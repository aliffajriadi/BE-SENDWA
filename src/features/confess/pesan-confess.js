export const confessHandler = async (sock, msg, text) => {
  try {
    // 🧩 Pisahkan nomor dan isi pesan
    const nomorTujuan = text.split(" ")[1];
    const pesanConfess = text.split(" ").slice(2).join(" ");

    // ⚠️ Validasi input
    if (!nomorTujuan || !pesanConfess) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `⚠️ *Format Salah!*\n\nGunakan format berikut:\n\n\`\`\`\n.confess <nomor> <pesan>\n\`\`\`\n\n📌 *Contoh:*\n.confess 6281234567890 Halo, aku suka kamu 😳\n\nPastikan nomor menggunakan format *62* (bukan 08).`,
      });
      return false;
    }

    // 🔢 Normalisasi nomor ke format internasional
    let fixedNumber = nomorTujuan.replace(/\D/g, ""); // ambil hanya angka

    if (fixedNumber.startsWith("0")) {
      fixedNumber = "62" + fixedNumber.slice(1);
    } else if (!fixedNumber.startsWith("62")) {
      fixedNumber = "62" + fixedNumber; // pastikan selalu diawali 62
    }

    fixedNumber = fixedNumber + "@s.whatsapp.net";

    // 🔍 Cek apakah nomor benar-benar terdaftar di WhatsApp
    const [cek] = await sock.onWhatsApp(fixedNumber);
    if (!cek || !cek.exists) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `❌ *Nomor ${nomorTujuan} tidak terdaftar di WhatsApp.*\n\n😢 Pastikan nomor tersebut aktif dan gunakan format tanpa spasi.\n\n📌 *Contoh benar:* 6281234567890`,
      });
      return false;
    }

    const jid = cek.jid;

    // 💌 Pesan confess untuk penerima
    const pesanUntukPenerima = `💌 *Kamu Dapat Pesan Rahasia!* 💌\n\n━━━━━━━━━━━━━━━\n"${pesanConfess}"\n━━━━━━━━━━━━━━━\n\n📩 *Dikirim secara anonim melalui Confess Bot* 🕊️`;

    // ✅ Notifikasi untuk pengirim
    const pesanUntukPengirim = `✅ *Confess Berhasil Dikirim!*\n\n📱 *Nomor Tujuan:* ${nomorTujuan}\n💬 *Isi Pesan:*\n"${pesanConfess}"\n\nTerima kasih telah menggunakan *Confess Bot* 💌\nSemoga pesanmu sampai ke hati yang tepat 😳❤️`;

    // ✉️ Kirim ke penerima
    await sock.sendMessage(jid, { text: pesanUntukPenerima });

    // 💬 Kirim konfirmasi ke pengirim
    await sock.sendMessage(msg.key.remoteJid, { text: pesanUntukPengirim });

    return true;
  } catch (error) {
    console.error("Error sending confess message:", error);
    await sock.sendMessage(msg.key.remoteJid, {
      text: `❌ *Gagal mengirim confess.*\n\nKemungkinan penyebab:\n- Nomor tidak aktif di WhatsApp\n- Koneksi internet lemah\n- Server sedang sibuk\n\nCoba lagi nanti ya 😅`,
    });
    return false;
  }
};
