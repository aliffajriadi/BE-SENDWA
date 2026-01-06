import * as repository from "../../func.js";
import * as helper from "../../list.js";

export const beli = async (sock, msg, senderNumber, pesan) => {
  const remoteJid = msg.key.remoteJid;

  const dataProfil = await repository.profile(senderNumber.replace("@s.whatsapp.net", ""));
  if (!dataProfil) {
    return await sock.sendMessage(remoteJid, { text: helper.daftar });
  }

  const args = pesan.trim().split(" ");
  const fitur = args[1];
  const jumlah = parseInt(args[2]);

  // Jika perintah tidak lengkap
  if (!fitur || !args[2]) {
    return await sock.sendMessage(remoteJid, {
      text: `📦 *LIST PRODUK*

🪙 *Token*
Harga: Rp.65 / 1 Token
Perintah: *.beli token [jumlah]*
Contoh: *.beli token 10*

🚧 *Hosting*
Coming Soon

━━━━━━━━━━━━━━
💰 Saldo Kamu: Rp.${dataProfil.saldo}
ketik *.topup* untuk top up saldo
`,
    });
  }

  // ================= TOKEN =================
  if (fitur === "token") {
    if (isNaN(jumlah) || jumlah <= 0) {
      return await sock.sendMessage(remoteJid, {
        text: `❌ Jumlah token tidak valid

🪙 *Token*
Harga: Rp.65 / 1 Token
Contoh: *.beli token 10*`,
      });
    }

    const harga = 65;
    const totalHarga = jumlah * harga;

    if (dataProfil.saldo < totalHarga) {
      return await sock.sendMessage(remoteJid, {
        text: `❌ *Saldo Tidak Cukup*

💰 Saldo Kamu: Rp.${dataProfil.saldo}
🧾 Total Harga: Rp.${totalHarga}

Silakan top up saldo terlebih dahulu.`,
      });
    }

    // Update saldo & token (AMAN 🔥)
    await repository.updateProfile(senderNumber.replace("@s.whatsapp.net", ""), {
      saldo: { decrement: totalHarga },
      token: { increment: jumlah },
    });

    return await sock.sendMessage(remoteJid, {
      text: `✅ *Pembelian Berhasil!*

🪙 Token dibeli: ${jumlah}
💸 Total: Rp.${totalHarga}

💰 Sisa Saldo: Rp.${dataProfil.saldo - totalHarga}
`,
    });
  }

  // ================= FITUR TIDAK DITEMUKAN =================
  return await sock.sendMessage(remoteJid, {
    text: "❌ Produk tidak ditemukan.\nKetik *.beli* untuk melihat daftar produk.",
  });
};
