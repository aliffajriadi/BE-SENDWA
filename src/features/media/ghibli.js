import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileTypeFromBuffer } from "file-type";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

export const ghibliHandler = async (sock, msg) => {
  const image = msg.message?.imageMessage;
  const nomorBotGhibli = "6285520728156"; // Nomor bot Ghibli

  if (!global.pendingGhibli) global.pendingGhibli = new Map();

  // Jika tidak ada gambar
  if (!image) {
    await sock.sendMessage(msg.key.remoteJid, { text: "❌ Tidak ada gambar ditemukan. \n\nContoh penggunaan: kirim gambar/foto lalu beri caption .ghibli" });
    return false;
  }

  try {
    console.log("🟢 Mulai download media...");
    const buffer = await downloadMediaMessage(
      msg,
      "buffer",
      {},
      { logger: console, reuploadRequest: sock.updateMediaMessage }
    );

    if (!buffer || buffer.length === 0) throw new Error("Gagal download media");
    console.log(`✅ Buffer terdownload: ${buffer.length} bytes`);

    // Deteksi ulang MIME
    const type = await fileTypeFromBuffer(buffer);
    let mime = type?.mime || "image/jpeg";
    console.log(`🧩 MIME terdeteksi: ${mime}`);

    if (!/image\/(jpe?g|png)/i.test(mime)) {
      await sock.sendMessage(msg.key.remoteJid, { text: "❌ Harus berupa gambar JPG/PNG." });
      return false;
    }

    // Konversi ulang pakai Sharp ke format aman (JPEG)
    const inputPath = path.join(process.cwd(), "test_input.jpg");
    const outputPath = path.join(process.cwd(), "test_output.jpg");

    fs.writeFileSync(inputPath, buffer);
    await sharp(inputPath).jpeg({ quality: 90 }).toFile(outputPath);

    console.log("📁 File hasil konversi disimpan:", outputPath);
    const finalBuffer = fs.readFileSync(outputPath);

    // Simpan pending user
    global.pendingGhibli.set(nomorBotGhibli, msg.key.remoteJid);

    // Kirim ke bot Ghibli
    await sock.sendMessage(`${nomorBotGhibli}@s.whatsapp.net`, {
      image: finalBuffer,
      mimetype: "image/jpeg",
      caption: ".toghibli"
    });

    await sock.sendMessage(msg.key.remoteJid, {
      text: "⏳ Tunggu sebentar, gambar sedang diproses oleh bot Ghibli..."
    });

    console.log("✅ Gambar berhasil dikirim ke bot Ghibli");
    return true;
  } catch (err) {
    console.error("❌ Error kirim Ghibli:", err);
    await sock.sendMessage(msg.key.remoteJid, {
      text: "⚠️ Terjadi kesalahan saat mengirim gambar ke bot Ghibli."
    });
    return false;
  } finally {
    // Hapus file sementara
    try {
      if (fs.existsSync("test_input.jpg")) fs.unlinkSync("test_input.jpg");
      if (fs.existsSync("test_output.jpg")) fs.unlinkSync("test_output.jpg");
    } catch {}
  }
};
