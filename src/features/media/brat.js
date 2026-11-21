import axios from "axios";
import { Sticker, StickerTypes } from "wa-sticker-formatter";
import { tmpdir } from "os";
import { join } from "path";
import { writeFile, unlink } from "fs/promises";

export const bratvidHandler = async (sock, msg, args) => {
  try {
    
    const text = args;
    if (!text) {
      await sock.sendMessage(msg.key.remoteJid, { text: "Contoh penggunaan: .bratvid <text>" });
      return false;
    }
    const url = `https://www.sankavollerei.com/imagecreator/bratvideo?apikey=planaai&text=${text}`;

    // Ambil video dari API
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);

    // Simpan sementara ke file .mp4
    const tmpPath = join(tmpdir(), `${Date.now()}.mp4`);
    await writeFile(tmpPath, buffer);

    // Buat stiker dari video
    const sticker = new Sticker(tmpPath, {
      type: StickerTypes.FULL,
      pack: "Bot Whatsapp",
      author: "@alfjrd_",
      categories: ["🎥"],
      id: "bratvid",
      quality: 70,
    });

    const stickerBuffer = await sticker.toBuffer();

    // Kirim stiker ke user
    await sock.sendMessage(msg.key.remoteJid, {
      sticker: stickerBuffer,
    }, { quoted: msg });

    // Hapus file sementara
    await unlink(tmpPath);

    return true;
  } catch (err) {
    console.error("❌ Bratvid Error:", err);
    await sock.sendMessage(msg.key.remoteJid, {
      text: `Gagal membuat stiker bratvid:\n${err.message || err}`,
    });
    return false;
  }
};
