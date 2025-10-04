import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { daftar, NomorOwner } from './list.js';

const filePath = path.resolve('./data.json');

// baca data JSON
let data = [];
try {
  const fileContent = await fs.readFile(filePath, 'utf-8');
  data = JSON.parse(fileContent);
} catch (err) {
  console.error('Gagal membaca file JSON, membuat data kosong...');
  data = [];
}

export const getName = async (number) => {
  const user = data.find(user => user.nomor === number);
  return user ? user.nama : null;
}

export const registerNumber = async (number, name, newToken) => {
  const userExists = data.some(user => user.nomor === number);
  if (userExists) return false;

  const newUser = { nomor: number, nama: name, token: newToken };
  data.push(newUser);

  // tulis ke file JSON
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

  return true;
}

export const getToken = async (number) => {
  const user = data.find(user => user.nomor === number);
  return user ? user.token : null;
}
export const profile = async (number) => {
  const user = data.find(user => user.nomor === number);
  return user ? user : null;
}
export const setToken = async (number, token) => {
  const user = data.find(user => user.nomor === number);
  if (user) {
    user.token = user.token + token;
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return user;
  }
  return null;
}
export const getAllUser = async () => {
  return data
}
export const lessToken = async (number, token) => {
  const user = data.find(user => user.nomor === number);
  if (user) {
    user.token = user.token - token;
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return user;
  }
  return null;
}

export const cekToken = async (dataProfil, sock, msg, minimalToken) => {
  if (!dataProfil) {
    sock.sendMessage(msg.key.remoteJid, {
      text: daftar,
    });
    return false;
  }
  if (dataProfil.token < minimalToken) {
    sock.sendMessage(msg.key.remoteJid, {
      text: `╭───❌ *TOKEN TIDAK CUKUP* ❌───╮
  
😢 Maaf, token kamu *tidak mencukupi* untuk menggunakan fitur ini.  
💎 *Minimal Token Dibutuhkan:* ${minimalToken}  
📊 *Token Kamu Sekarang:* ${dataProfil.token}

📩 Hubungi *Owner* untuk menambah token:  
👉 ${NomorOwner} / Alif  

🪪 *Cek profil dan sisa token kamu:*  
Ketik *.me*

╰────────────────────────────╯`,
    });
    return false;
  }
  return true;
}



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

export const dataos = {
    platform: os.platform(),
    release: os.release(),
    type: os.type(),
    hostname: os.hostname(),
    uptime: os.uptime(),
    totalmem: os.totalmem(),
    freemem: os.freemem()
}


