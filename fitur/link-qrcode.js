import QRCode from "qrcode";

export const qrcodeHandler = async (sock, msg, args) => {
  try {
    const input = args?.trim();
    if (!input) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Contoh penggunaan:\n.qrcode aliffajriadi.my.id",
      });
      return false;
    }

    // ✅ Generate QR Code dalam bentuk PNG buffer (harus pakai type: 'png')
    const qrBuffer = await QRCode.toBuffer(input, {
      type: "png",
      width: 300,
      margin: 2,
      errorCorrectionLevel: "H",
    });

    // ✅ Kirim QR Code ke user
    await sock.sendMessage(msg.key.remoteJid, {
      image: qrBuffer,
      caption: `✅ QR Code berhasil dibuat untuk:\n\n📄 *${input}*`,
    });
    return true;
  } catch (err) {
    console.error("QR Code Error:", err);
    throw new Error(err);
    
  }
};
