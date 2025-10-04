import { setToken, lessToken } from "../func.js";
import { NomorOwner } from "../list.js";

export const tokenManage = async (sock, msg, senderNumber, pesan) => {
    const owner = NomorOwner;
      const pengirim = senderNumber.replace("@s.whatsapp.net", "");
      if (pengirim !== owner) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: `Anda bukan owner, lappet jangan aneh aneh kau`,
        });
      }
      const nomorTujuan = pesan.split(" ")[1];
      let token = pesan.split(" ")[2];
      const penjumlahan = pesan.split(" ")[3];
      token = parseInt(token);

      if (isNaN(token)) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: "Token harus berupa angka",
        });
      }

      if (penjumlahan == "tambah") {
        const settoken = await setToken(nomorTujuan, token);
        if (!settoken) {
          return await sock.sendMessage(msg.key.remoteJid, {
            text: `Nomor ${nomorTujuan} tidak ditemukan`,
          });
        }
        await sock.sendMessage(msg.key.remoteJid, {
          text: `Token berhasil ditambahkan ke ${nomorTujuan}
        
Token sekarang *${settoken.token}*
Nama *${settoken.nama}*`,
        });
      } else if (penjumlahan == "kurang") {
        const kurangtoken = await lessToken(nomorTujuan, token);
        if (!kurangtoken) {
          return await sock.sendMessage(msg.key.remoteJid, {
            text: `Nomor ${nomorTujuan} tidak ditemukan`,
          });
        }
        await sock.sendMessage(msg.key.remoteJid, {
          text: `Token berhasil dikurangi ke ${nomorTujuan}
        
Token sekarang *${kurangtoken.token}*
Nama *${kurangtoken.nama}*`,
        });
      }
}