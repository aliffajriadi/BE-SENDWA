import { allData } from "../../services/user.service.js";

export const cekPeserta = async (sock, msg) => {
  try {
    const users = await allData();
    if (!users || users.length === 0) {
      return await sock.sendMessage(msg.key.remoteJid, { text: "❌ Tidak ada peserta." });
    }

    // Gabungkan semua peserta menjadi satu pesan
    let text = "📋 Daftar Peserta:\n\n";
    for (const user of users) {
      text += `👉 ${user.name} (${user.nomor}) - Token: ${user.token}\n`;
    }

    await sock.sendMessage(msg.key.remoteJid, { text });

  } catch (err) {
    console.error(err);
    await sock.sendMessage(msg.key.remoteJid, { text: `❌ Terjadi kesalahan: ${err.message || err}` });
  }
};
