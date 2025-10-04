import { getName, registerNumber } from "../func.js";

const newToken = 10;
export const daftarFunc = async (parts, sock, msg, senderNumber) => {
    if (parts.length < 2) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: "Format salah. Gunakan: .daftar NAMAKAMU",
        });
      }

      const name = parts.slice(1).join(" ");
      const number = senderNumber.replace("@s.whatsapp.net", "");

      const alreadyRegistered = await getName(number);
      if (alreadyRegistered) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: `Nomor ini sudah terdaftar dengan nama: ${alreadyRegistered}`,
        });
      }

      const success = await registerNumber(number, name, newToken);
      if (success) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `Yeayy kamu dapat token baru sebanyak *${newToken}*! 🎉`,
        });
        await sock.sendMessage(msg.key.remoteJid, {
          text: `✅ *Terima kasih, ${name}!* 🎉
Nomor kamu berhasil *terdaftar* 📌

👉 Untuk melihat profil, ketik: *.me*`,
        });
      } else {
        throw new Error("Terjadi kesalahan saat mendaftar.");
        
      }
}