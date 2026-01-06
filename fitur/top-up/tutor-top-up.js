import fs from 'fs';
import { join } from 'path';
import * as repository from "../../func.js";
import * as helper from "../../list.js";

export const tutorTopUp = async (sock, msg, senderNumber) => {
    const remoteJid = msg.key.remoteJid;
    const dataProfil = await repository.profile(senderNumber.replace("@s.whatsapp.net", ""));
    if (!dataProfil) {
        return await sock.sendMessage(remoteJid, { text: helper.daftar });
    }
    const imagePath = join(process.cwd(), 'fitur', 'top-up', 'tutor.jpg');

    // Cek apakah file gambar ada agar bot tidak crash
    if (!fs.existsSync(imagePath)) {
        return await sock.sendMessage(remoteJid, { text: "❌ File gambar tutorial tidak ditemukan." });
    }

  const caption = `
*TUTORIAL TOP UP OTOMATIS* 🚀

Saldo akan *bertambah otomatis* setelah pembayaran berhasil.

━━━━━━━━━━━━━━
📌 *Langkah-langkah:*

1️⃣ Buka link Trakteer:
https://trakteer.id/alif_fajriadi/tip

2️⃣ Pilih jumlah *unit* sesuai saldo yang ingin diisi.

3️⃣ ⚠️ *PENTING*  
Pada kolom *Nama*, isi dengan *Nomor WhatsApp kamu*  
Contoh: 0812xxxxxxx

4️⃣ Pilih metode pembayaran dan selesaikan transaksi.

━━━━━━━━━━━━━━
📝 *Catatan:*
Pastikan nomor WhatsApp yang dimasukkan *benar*,  
agar sistem bisa mengenali akunmu.

💡 *Tips:*  
Ketik *.beli* untuk melihat daftar produk.
`.trim();


    await sock.sendMessage(remoteJid, {
        image: fs.readFileSync(imagePath),
        caption: caption
    }, { quoted: msg });
};