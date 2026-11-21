// Daftar kata kotor
const kataKotor = [
  "kontol",
  "kntol",
  "kntl",
  "memek",
  "mmk",
  "anjing",
  "anjg",
  "ajg",
  "babi",
  "goblok",
  "gblk",
  "gblg",
  "tolol",
  "tll",
  "tololl",
  "bangsat",
  "bgst",
  "bangs",
  "ashu",
  "pepek",
  "ppk",
  "pepk",
  "jembut",
  "jmbt",
  "jmbut",
  "pantek",
  "pantk",
  "pntk",
  "puki",
  "pky",
  "pqi",
  "puqi",
  "ngentot",
  "ngntt",
  "ngentod",
  "ngntd",
  "kentod",
  "kntd",
  "kimak",
  "woy",
  "wkwk",
  "wlee", // bisa kamu sesuaikan, kalau 'we' dianggap kasar
];

const simpleReplies = {
  ".ping": "Pong!",
  ".hai": "Halo! Aku adalah bot whatsapp yang dibuat oleh Alif Fajriadi",
  ".halo": "Halo! Aku adalah bot whatsapp yang dibuat oleh Alif Fajriadi",
  iya: "Ketik .menu untuk cek menu",
  apa: "Ketik .menu untuk cek menu",
  ya: "Ketik .menu untuk cek menu",
  dc: "ayo aja gw mah 😁",
  "dc kuy": "ayo aja gw mah 😁",
  "ayok dc": "ayo aja gw mah 😁",
  "kuy dc": "ayo aja gw mah 😁",
  "dc we": "ayo aja gw mah 😁",
  "dc lee": "ayo aja gw mah 😁",
  "dc le": "ayo aja gw mah 😁",
  padim: "tekno le",
  tamor: "tamor trusss kuntulll",
};
const jadwal = {
  ".senin": `📌 *Senin - IF 2D*
  
  1. DRPL - UM - Online  
  🕘 07.‌50 sd 08.‌40  
  ====================
  2. PBO - HW - Online  
  🕘 08.‌40 sd 10.‌20  
  ====================
  3. PROWEB - DE - Online  
  🕘 10.‌20 sd 12.‌00  
  ====================
  4. Basis Data - DW - Online  
  🕘 13.‌40 sd 15.‌20`,

  ".selasa": `📌 *Selasa - IF 2D*
  
  1. Jaringan Komputer - DP - Online  
  🕘 07.‌50 sd 09.‌30  
  ====================
  2. Pembuatan Prototype - MS - GU 805  
  🕘 12.‌50 sd 16.‌10`,

  ".rabu": `📌 *Rabu - IF 2D*
  
  1. Basis Data (Prak) - BN - GU 702  
  🕘 10.‌20 sd 12.‌50`,

  ".kamis": `📌 *Kamis - IF 2D*
  
  1. PBO (Prak) - BN - GU 702  
  🕘 07.‌50 sd 09.‌30  
  ====================
  2. PROWEB (Prak) - NN - GU 805  
  🕘 10.‌20 sd 12.‌10  
  ====================
  3. Jaringan Komputer (Prak) - DP - TA 10.3  
  🕘 13.‌40 sd 17.‌00`,

  ".jumaat": `📌 *Jumat - IF 2D*
  
  1. DRPL (Prak) - UM - GU 704  
  🕘 07.‌50 sd 10.‌20  
  ====================
  2. BIngKom - BY - GU 701  
  🕘 14.‌30 sd 17.‌00`,
};
const NomorOwner = process.env.OWNER_NUMBER || "62895603792033";

const menuLearning = `
╭─━━━✦ *🤖 MENU LEARNING* ✦━━━─╮
cek learning if c 

cek deadline => /cek <hari>

contoh => /cek 6

`

const menu = `
╭─━━━✦ *🤖 MENU UTAMA* ✦━━━─╮

📂 *INFORMASI & PROFIL*
├─ 🏷️ *.menu*
│   ❯ Lihat daftar semua fitur
├─ 👤 *.me*
│   ❯ Lihat profil kamu
├─ 💰 *.topup*
│   ❯ Top up Saldo Kamu
├─ 💰 *.beli*
│   ❯ Beli fitur dari Bot

📥 *DOWNLOAD MEDIA*
├─ 🎵 *.tt [link]*
│   ❯ Download video TikTok (1 Token)
├─ 📸 *.ig [link]*
│   ❯ Download video Instagram (1 Token)
├─ 📖 *.igstory [link]*
│   ❯ Download Story Instagram (1 Token)

🎨 *KREASI & EDIT FOTO*
├─ 🖼️ *.stiker [foto]*
│   ❯ Ubah foto jadi stiker (1 Token)
├─ 🎉 *.ghibli [foto]*
│   ❯ Ubah foto kamu menjadi Anime Ghibli (1 Token)
├─ 🧹 *.removebg [foto]*
│   ❯ Hapus background foto kamu (2 Token)
├─ ✨ *.hd [foto]*
│   ❯ Buat foto jadi HD (1 Token)
├─ 🎀 *.brat [text]*
│   ❯ Buat stiker dengan teks lucu (1 Token)

💌 *PESAN & SERU-SERUAN*
├─ 💌 *.confess [nomor] [pesan]*
│   ❯ Ngobrol rahasia ke nomor tujuan (5 Token)
├─ 💬 *.pesanconfess [nomor] [pesan]*
│   ❯ Pesan rahasia ke nomor tujuan (1 Token)
├─ 💖 *.sertifikat [namakamu]*
│   ❯ Buat sertifikat cinta digital 💞 (1 Token)

🧰 *TOOLS & FUN*
├─ 🕹️ *.cekroblok [username]*
│   ❯ Stalking akun Roblox (1 Token)
├─ 🧾 *.qrcode [link]*
│   ❯ Buat QR Code dari link (1 Token)

╰─━━━━━━━━━━━━━━━━━━━─╯
🌟 _Bot siap menemani harimu dengan gaya!_ 🌟
`;

const daftar = `⚠️ *Nomor kamu belum terdaftar!*

📝 Silakan daftar dengan format:
\`.daftar NAMA_LENGKAP\`

Contoh:
\`.daftar Alif Fajriadi\`


Cek daftar menu dengan:
\`.menu\``;

export { kataKotor, jadwal, simpleReplies, NomorOwner, menu, daftar };
