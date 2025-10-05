import axios from "axios";
import FormData from "form-data";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";
import { Buffer } from "buffer";

export async function upscaleHandler(sock, msg) {
  const imageMsg = msg.message?.imageMessage;
  if (!imageMsg) {
    await sock.sendMessage(msg.key.remoteJid, { text: "❌ Tidak ada gambar ditemukan." });
    return false;
  }

  const mime = imageMsg.mimetype || "";
  if (!/image\/(jpe?g|png)/i.test(mime)) {
    await sock.sendMessage(msg.key.remoteJid, { text: "❌ Harus berupa gambar JPG/PNG." });
    return false;
  }

  try {
    await sock.sendMessage(msg.key.remoteJid, { react: { text: "⏳", key: msg.key } });

    // Download media
    const stream = await downloadContentFromMessage(imageMsg, "image");
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    const ext = mime.split("/")[1];
    const filename = `upscaled_${Date.now()}.${ext}`;

    const form = new FormData();
    form.append("image", buffer, { filename, contentType: mime });
    form.append("scale", "2");

    const headers = {
      ...form.getHeaders(),
      accept: "application/json",
      "x-client-version": "web",
      "x-locale": "en",
    };

    // Gunakan axios
    const res = await axios.post("https://api2.pixelcut.app/image/upscale/v1", form, {
      headers,
    });

    const json = res.data;

    if (!json?.result_url || !json.result_url.startsWith("http")) {
      throw new Error("Gagal mendapatkan URL hasil dari Pixelcut.");
    }

    const resultRes = await axios.get(json.result_url, { responseType: "arraybuffer" });
    const resultBuffer = Buffer.from(resultRes.data);

    await sock.sendMessage(msg.key.remoteJid, {
      image: resultBuffer,
      caption: `
✨ Gambar kamu telah ditingkatkan hingga 2x resolusi.
📈 Kualitas lebih tajam & detail lebih jelas.
🔧 _Gunakan fitur ini kapan saja untuk memperjelas gambar blur._
      `.trim(),
    });

    await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });
    return true;

  } catch (err) {
    await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
    await sock.sendMessage(msg.key.remoteJid, { text: `❌ Upscaling gagal:\n${err.message || err}` });
    return false;
  }
}
