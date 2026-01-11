import prisma from './config/db.js';
import { daftar, NomorOwner } from './list.js';
import os from 'os';

/**
 * Ambil nama user berdasarkan nomor
 */
export const getName = async (number) => {
  const user = await prisma.user.findUnique({ where: { nomor: number } });
  return user ? user.name : null;
};

// cara pakai updateProfile
// updateProfile(number, { name: 'nama', token: 10 });
export const updateProfile = async (number, args) => {
  return prisma.user.update({
    where: { nomor: number },
    data: args,
  });
}

/**
 * Registrasi nomor baru
 */
export const registerNumber = async (number, name, newToken) => {
  // Cek apakah nomor SUDAH digunakan oleh siapapun (tanpa peduli namanya)
  const userExists = await prisma.user.findFirst({
    where: {
      OR: [
        { nomor: number },
        { name: name }
      ]
    }
  });

  if (userExists) return false;

  try {
    await prisma.user.create({
      data: { nomor: number, name, token: newToken },
    });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Ambil token user
 */
export const getToken = async (number) => {
  const user = await prisma.user.findUnique({ where: { nomor: number } });
  return user ? user.token : null;
};

/**
 * Ambil profil user
 */
export const profile = async (number) => {
  const data = await prisma.user.findUnique({ where: { nomor: number } });
  if (!data) return null;

  // buat alias supaya ada properti `nama` juga
  return { ...data, nama: data.name };
};


/**
 * Tambah token user
 */
export const setToken = async (number, token) => {
  return prisma.user.update({
    where: { nomor: number },
    data: { token: { increment: token } },
  });
};

/**
 * Kurangi token user
 */
export const lessToken = async (number, token) => {
  return prisma.user.update({
    where: { nomor: number },
    data: { token: { decrement: token } },
  });
};

/**
 * Ambil semua user
 */
export const getAllUser = async () => {
  return prisma.user.findMany();
};

/**
 * Cek token cukup atau tidak
 */
export const cekToken = async (dataProfil, sock, msg, minimalToken) => {
  if (!dataProfil) {
    sock.sendMessage(msg.key.remoteJid, { text: daftar });
    return false;
  }

  if (dataProfil.token < minimalToken) {
    sock.sendMessage(msg.key.remoteJid, {
      text: `╭───❌ *TOKEN TIDAK CUKUP* ❌───╮
😢 Maaf, token kamu *tidak mencukupi* untuk menggunakan fitur ini.  
💎 *Minimal Token Dibutuhkan:* ${minimalToken}
📊 *Token Kamu Sekarang:* ${dataProfil.token}

📩 Beli Token Murah Kamu dengan cara:
Ketik *.beli*

🪪 *Cek profil dan sisa token kamu:*  
Ketik *.me*
╰────────────────────────────╯`,
    });
    return false;
  }
  return true;
};

/**
 * Semua data user (sama dengan getAllUser)
 */
export const allData = async () => {
  return prisma.user.findMany();
};

/**
 * Fungsi waktu "time ago"
 */
export async function timeAgo(waktu) {
  const sekarang = new Date();
  const dibuat = new Date(waktu);
  const selisihMs = sekarang - dibuat;

  const menit = Math.floor(selisihMs / (1000 * 60));
  const jam = Math.floor(selisihMs / (1000 * 60 * 60));
  const hari = Math.floor(selisihMs / (1000 * 60 * 60 * 24));

  if (menit < 1) return "Baru saja";
  if (menit < 60) return `*${menit}* menit yang lalu`;
  if (jam < 24) return `*${jam}* jam yang lalu`;
  return `*${hari}* hari yang lalu`;
}

/**
 * Info OS
 */
export const dataos = {
  platform: os.platform(),
  release: os.release(),
  type: os.type(),
  hostname: os.hostname(),
  uptime: os.uptime(),
  totalmem: os.totalmem(),
  freemem: os.freemem(),
};

// Fungsi untuk mengirim pesan dengan retry
export async function sendMessageSafe(sock, jid, message, retries = 5, delayMs = 3000) {
    for (let i = 0; i < retries; i++) {
      try {
        if (!sock || sock.ws.readyState !== sock.ws.OPEN) {
          console.log("Socket belum siap, tunggu 3 detik...");
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue; // cek lagi socket
        }
        return await sock.sendMessage(jid, message); // berhasil
      } catch (err) {
        console.log(
          `Gagal kirim pesan ke ${jid}, percobaan ke-${i + 1}: ${err.message}`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    throw new Error(`Gagal kirim pesan ke ${jid} setelah ${retries} percobaan`);
  }