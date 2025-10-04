import axios from "axios";
import FormData from "form-data";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

async function removebg(buffer) {
  const apiKey = process.env.REMOVEBG_API_KEY;
  const formData = new FormData();

  // Kirim file sebagai binary buffer
  formData.append("image_file", buffer, {
    filename: "image.png",
    contentType: "image/png",
  });
  formData.append("size", "auto");

  try {
    const response = await axios({
      method: "post",
      url: "https://api.remove.bg/v1.0/removebg",
      data: formData,
      headers: {
        ...formData.getHeaders(),
        "X-Api-Key": apiKey,
      },
      responseType: "arraybuffer",
    });

    return Buffer.from(response.data, "binary");
  } catch (e) {
    throw `Gagal hapus background (${e.response?.status || e.message})`;
  }
}

export const removebgHandler = async (sock, m) => {
  try {
    await sock.sendMessage(m.key.remoteJid, { react: { text: "⌛", key: m.key } });

    const media = await downloadMediaMessage(m, "buffer", {}, { logger: console });
    const result = await removebg(media);

    await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });

    await sock.sendMessage(
      m.key.remoteJid,
      { image: result, caption: "✅ Background berhasil dihapus!" },
      { quoted: m }
    );
  } catch (error) {
    throw new Error("Gagal menghapus background: " + error.message);
    
  }
};
