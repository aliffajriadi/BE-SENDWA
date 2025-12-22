import axios from "axios";
import prisma from "../config/db.js";
import https from "https";

export const daftarHosting = async (sock, msg, profile) => {
  try {
    const nama = profile.name || "User";
    const namaDepan = nama.trim().split(' ')[0].toLowerCase();
    const userPass = `${namaDepan}564`;
    const passAdmin = process.env.PASS_ADMIN;

    const response = await axios.post(
      "https://213.163.204.41:8090/api/submitUserCreation",
      {
        adminUser: "admin",
        adminPass: passAdmin,
        userName: namaDepan,
        password: userPass,
        email: `${namaDepan}@gmail.com`,
        firstName: namaDepan,
        lastName: "Member",
        accountType: "user",
        selectedACL: "user 2",
        websitesLimit: 2,
        selectedPackage: "Default",
      },
      {
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        headers: { "Content-Type": "application/json" },
      }
    );

    if (response.status === 200 || response.status === 201) {
      await prisma.user.update({
        where: { nomor: profile.nomor },
        data: { free_event: false },
      });

      // Template Pesan WhatsApp yang dipercantik
      const pesan = 
`*PENDAFTARAN HOSTING BERHASIL* 🚀

Halo *${nama}*, akun hosting kamu telah aktif!
Berikut adalah detail login panel kamu:

┌─  *DETAIL AKUN*
│ 👤 *Username:* \`${namaDepan}\`
│ 🔑 *Password:* \`${userPass}\`
└───────────────

🌐 *URL AKSES PANEL:*
https://panel.aliffajriadi.my.id

👨‍💻 *DOMAIN GRATIS (gunakan saat create website):*
https://${namaDepan}.free.aliffajriadi.my.id

💡 *Catatan:*
- Gunakan username & password di atas untuk login.
- Segera ganti password demi keamanan.
- Gunakan domain gratis kamu untuk mulai membangun website.

_Terima kasih telah menggunakan bot ini!_`;

      return await sock.sendMessage(msg.key.remoteJid, { text: pesan }, { quoted: msg });
    }

  } catch (err) {
    console.error("❌ Gagal daftar hosting:", err.response?.data || err.message);
    
    // Memberi tahu user jika terjadi kegagalan sistem
    return await sock.sendMessage(msg.key.remoteJid, { 
      text: "⚠️ *Gagal memproses pendaftaran.* Silakan hubungi admin atau coba beberapa saat lagi." 
    });
  }
};