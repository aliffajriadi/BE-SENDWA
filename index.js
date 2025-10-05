import express from "express";
import cors from "cors";
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode-terminal";
import fs from "fs";
import { kataKotor, simpleReplies, NomorOwner, menu, daftar } from "./list.js";
import { configDotenv } from "dotenv";
import { profile, lessToken, cekToken } from "./func.js";
import multer from "multer";
import * as fitur from "./fitur/index.js";

const upload = multer({ storage: multer.memoryStorage() });

configDotenv();
//WEBSOCKET NYA INI
try {
  global.WebSocket = (await import("ws")).default;
} catch {}

const app = express();
app.use(cors());
app.use(express.json());
// Middleware cek API Key
app.use((req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(403).json({ error: "masukkan api key yang valid!" });
  }

  next();
});

// Function to start the WhatsApp bot
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const sock = makeWASocket({
    printQRInTerminal: true,
    auth: state,
    browser: ["Bot WhatsApp", "Chrome", "1.0.0"],
  });

  // Save credentials on update
  sock.ev.on("creds.update", saveCreds);

  // Handle connection updates
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error instanceof Boom
          ? lastDisconnect.error.output?.statusCode !==
            DisconnectReason.loggedOut
          : true;

      console.log("Koneksi terputus karena:", lastDisconnect.error);

      if (shouldReconnect) {
        console.log("Mencoba menghubungkan kembali...");
        startBot();
      } else {
        console.log("Koneksi ditutup. Menghapus kredensial...");
        if (fs.existsSync("./auth")) {
          fs.rmSync("./auth", { recursive: true, force: true });
        }
      }
    }

    if (connection === "open") {
      console.log("Koneksi terbuka, bot sudah siap digunakan!");
    }

    if (qr) {
      console.log("Scan QR Code berikut untuk login:");
      qrcode.generate(qr, { small: true });
    }
  });

  // API to send message via website
  app.post("/api/kirim", async (req, res) => {
    const pesan = req.body.pesan;
    const nomor = req.body.nomor;
    try {
      await sock.sendMessage(`${nomor}@s.whatsapp.net`, { text: pesan });
      return res.status(200).json({ message: "Pesan berhasil dikirim" });
    } catch (error) {
      return res.status(500).json({ message: "Pesan gagal dikirim" });
    }
  });
  //KIRIM FILE
  app.post("/api/kirim/pdf", upload.single("file"), async (req, res) => {
    try {
      const { nomor, pesan } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "File tidak ditemukan" });
      }

      // kirim dokumen ke WhatsApp
      await sock.sendMessage(`${nomor}@s.whatsapp.net`, {
        document: file.buffer, // langsung buffer dari upload
        mimetype: file.mimetype || "application/pdf",
        fileName: file.originalname || "dokumen.pdf",
        caption: pesan || "",
      });

      return res.status(200).json({ message: "PDF berhasil dikirim" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Gagal kirim PDF" });
    }
  });
  //GRUB
  app.post("/api/grub", async (req, res) => {
    const pesan = req.body.pesan;
    const nomor = req.body.nomor;
    try {
      await sock.sendMessage(`${nomor}@g.us`, { text: pesan });
      return res.status(200).json({ message: "Pesan berhasil dikirim" });
    } catch (error) {
      return res.status(500).json({ message: "Pesan gagal dikirim" });
    }
  });
  // API for group broadcast
  app.post("/api/broadcast", (req, res) => {
    const groupId = req.body.tujuan;
    const pesan = req.body.pesan;

    res
      .status(200)
      .json({ message: "Broadcast sedang diproses di latar belakang..." });

    (async () => {
      try {
        const metadata = await sock.groupMetadata(groupId);
        const participants = metadata.participants;

        console.log(
          `📢 Menyiarkan pesan ke ${participants.length} anggota grup...`
        );

        for (const participant of participants) {
          const jid = participant.id;
          try {
            await sock.sendMessage(jid, { text: pesan });
            console.log(`✅ Pesan terkirim ke ${jid}`);
            await new Promise((resolve) => setTimeout(resolve, 2000));
          } catch (err) {
            console.error(`❌ Gagal kirim ke ${jid}`, err);
          }
        }

        console.log("✅ Broadcast selesai.");
      } catch (error) {
        console.error("❌ Gagal broadcast:", error);
      }
    })();
  });

  const rateLimitMap = new Map();
  // Handle incoming messages
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;
    if (msg.key.remoteJid === "status@broadcast" || !msg.message) return;
    // Cek jika pengirim adalah bot sendiri
    if (msg.key.fromMe) return;

    // Hindari duplikasi di grup: hanya tangani jika pengirimnya bukan sistem
    if (msg.key.participant && msg.key.remoteJid.endsWith("@g.us")) {
      if (msg.key.participant === sock.user.id) return;
    }
    const m = msg.message; // <-- gunakan m untuk referensi pesan
    const senderNumber = msg.key.remoteJid;
    const messageType = Object.keys(msg.message)[0];
    let messageText = "";
    if (messageType === "conversation") {
      messageText = msg.message.conversation;
    } else if (messageType === "extendedTextMessage") {
      messageText = msg.message.extendedTextMessage.text;
    }

    console.log(`Pesan dari ${senderNumber}: ${messageText}`);

    const lowerText = messageText.toLowerCase();
    const pesan = lowerText;

    // ✅ Anti-Spam Logic
    const now = Date.now();
    const cooldown = 2000; // 2 detik

    if (rateLimitMap.has(senderNumber)) {
      const lastTime = rateLimitMap.get(senderNumber);
      if (now - lastTime < cooldown) {
        await sock.sendMessage(senderNumber, {
          text: "⏳ Tunggu beberapa detik, Jangan di spam yahhh 😡",
        });
        return;
      }
    }
    rateLimitMap.set(senderNumber, now);

    const kirimPesan = async (pesan) => {
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: pesan },
        { quoted: msg }
      );
    };
    const kirimReaction = async (emoji) => {
      await sock.sendMessage(msg.key.remoteJid, {
        react: {
          text: emoji,
          key: msg.key,
        },
      });
    };

    // Deteksi kata kotor
    if (kataKotor.some((kata) => pesan.includes(kata))) {
      await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: `sopan dikit boss`,
        },
        { quoted: msg }
      );
    } else if (simpleReplies[pesan]) {
      await sock.sendMessage(senderNumber, { text: simpleReplies[pesan] });

      //TIKTOK HANDLER
    } else if (
      messageText.startsWith(".tiktok") ||
      messageText.startsWith(".tt")
    ) {
      const pengirim = await profile(
        senderNumber.replace("@s.whatsapp.net", "")
      );
      if (!pengirim) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: daftar,
        });
      }
      const namaUser = pengirim.nama;
      if (pengirim.token <= 0) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: `Yahhh token kamu habiss, Coba kontak owner / alif ya ${pengirim.nama}
          
Cek profil dan token dengan mengetik .me`,
        });
      }
      const query = messageText.split(" ")[1];
      try {
        await fitur.tiktokDownloader(query, sock, msg, namaUser);
        lessToken(senderNumber.replace("@s.whatsapp.net", ""), 1);
      } catch (err) {
        console.error("Gagal download TikTok:", err.message);
        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text: "❌ Gagal download video TikTok. Pastikan link valid dan coba lagi.",
          },
          { quoted: msg }
        );
      }

      //Daftar pengguna
    } else if (messageText.startsWith(".daftar")) {
      const parts = messageText.split(" ");
      try {
        await fitur.daftarFunc(parts, sock, msg, senderNumber);
      } catch (error) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: "❌ Gagal mendaftar. Coba lagi nanti.",
        });
      }
    }
    //INSTAGRAM HANDLER
    else if (
      messageText.startsWith(".ig") ||
      messageText.startsWith(".instagram")
    ) {
      const pengirim = senderNumber.replace("@s.whatsapp.net", "");
      const userPengirim = await profile(pengirim);
      if (!userPengirim) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: daftar,
        });
      }
      const namaUser = userPengirim.nama;
      if (userPengirim.token <= 0) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: `Maaf ${namaUser}, kamu udah habis token
          
Cek Profil dan Token Kamu dengan mengetik: .me`,
        });
      }
      const query = messageText.split(" ")[1];
      try {
        await fitur.instagramDownloader(query, sock, msg, namaUser);
        lessToken(pengirim, 1);
      } catch (e) {
        console.error("Gagal download Instagram:", e.message);
        await sock.sendMessage(msg.key.remoteJid, {
          text: "❌ Gagal mengambil video dari Instagram. Coba lagi nanti.",
        });
      }
      //SERVER INFO
    } else if (pesan === ".server") {
      try {
        await fitur.cekServer(sock, msg);
      } catch (error) {
        await kirimPesan(
          "❌ Terjadi kesalahan saat mengambil informasi server. Coba lagi nanti."
        );
      }
      //PROFIL INFO
    } else if (pesan === ".me") {
      const dataProfil = await profile(
        senderNumber.replace("@s.whatsapp.net", "")
      );
      if (!dataProfil) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: daftar,
        });
      }
      await kirimReaction("✨");
      return await sock.sendMessage(msg.key.remoteJid, {
        text: `╔══✦ *👤 PROFIL* ✦══╗

✨ *Nama*       : ${dataProfil.nama}
📞 *Nomor*      : ${dataProfil.nomor}
💎 *Sisa Token* : ${dataProfil.token}

${
  dataProfil.token <= 0
    ? `⚠️ _Token kamu sudah *habis*_ 😢\n📩 Hubungi *Owner* untuk menambah token 😉 \n ${NomorOwner} / alif`
    : `💡 Token kamu aktif!
Token digunakan untuk mengakses fitur-fitur bot seperti download, stiker, dan lainnya.
Semakin banyak token = semakin banyak fitur yang bisa kamu pakai!
`
}

╚══════════════╝`,
      });
    }
    //OWNER FITUR
    else if (pesan.startsWith(".token")) {
      try {
        await fitur.tokenManage(sock, msg, senderNumber, pesan);
      } catch (error) {
        await kirimPesan("Gagal Menambahkan token");
      }
    } else if (pesan === ".menu") {
      await kirimPesan(menu);
    } else if (
      m.imageMessage &&
      (m.imageMessage.caption || "").toLowerCase().trim() === ".stiker"
    ) {
      const dataProfil = await profile(
        senderNumber.replace("@s.whatsapp.net", "")
      );
      if (!dataProfil) {
        return await kirimPesan(daftar);
      }
      if (dataProfil.token <= 0) {
        return await kirimPesan(
          `⚠️ _Token kamu sudah *habis*_ 😢\n📩 Hubungi *Owner* untuk menambah token 😉 \n ${NomorOwner} / alif`
        );
      }
      try {
        await fitur.createStiker(sock, msg);
        lessToken(dataProfil.nomor, 1);
      } catch (error) {
        await kirimPesan(`Gagal buat stiker ${error.message}`);
      }
    } else if (pesan === ".stiker") {
      await kirimPesan("Kirim gambar dengan caption .stiker");
    } else if (pesan.startsWith(".broadcast")) {
      const pengirim = senderNumber.replace("@s.whatsapp.net", "");
      if (pengirim !== NomorOwner) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: `Anda bukan owner, lappet jangan aneh aneh kau`,
        });
      }
      const rawPesan = pesan.split(" ").slice(1).join(" ");
      try {
        await fitur.broadcast(sock, msg, rawPesan);
      } catch (error) {
        await kirimPesan(`Gagal kirim pesan ${error.message}`);
      }
    } else if (
      m.imageMessage &&
      (m.imageMessage.caption || "").toLowerCase().trim() === ".removebg"
    ) {
      const dataProfil = await profile(
        senderNumber.replace("@s.whatsapp.net", "")
      );
      if (!dataProfil) {
        return await kirimPesan(daftar);
      }
      if (dataProfil.token < 3) {
        return await kirimPesan(
          `╭───❌ *TOKEN TIDAK CUKUP* ❌───╮
  
😢 Maaf, token kamu *tidak mencukupi* untuk menggunakan fitur ini.  
💎 *Minimal Token Dibutuhkan:* 3  
📊 *Token Kamu Sekarang:* ${dataProfil.token}

📩 Hubungi *Owner* untuk menambah token:  
👉 ${NomorOwner} / Alif  

🪪 *Cek profil dan sisa token kamu:*  
Ketik *.me*

╰────────────────────────────╯`
        );
      }
      try {
        await fitur.removebgHandler(sock, msg);
        lessToken(dataProfil.nomor, 3);
      } catch (error) {
        await sock.sendMessage(msg.key.remoteJid, {
          react: { text: "❌", key: m.key },
        });
        await sock.sendMessage(
          m.key.remoteJid,
          { text: `❌ RemoveBG Error: ${error}` },
          { quoted: m }
        );
      }
    } else if (pesan === ".removebg") {
      await kirimPesan("Kirim gambar dengan caption .removebg");
    } else if (pesan.startsWith(".cekroblok")) {
      const dataProfil = await profile(
        senderNumber.replace("@s.whatsapp.net", "")
      );
      const minimalToken = 2;
      const cek = await cekToken(dataProfil, sock, msg, minimalToken);
      if (!cek) return;
      const username = pesan.split(" ").slice(1).join(" ");
      try {
        const success = await fitur.robloxStalk(sock, msg, username, ".");
        if (!success) return;
        lessToken(dataProfil.nomor, minimalToken);
      } catch (error) {
        await kirimPesan(`Gagal kirim pesan ${error.message}`);
      }
    } else if (pesan.startsWith(".sertifikat")) {
      const dataProfil = await profile(
        senderNumber.replace("@s.whatsapp.net", "")
      );
      const minimalToken = 1;
      const cek = await cekToken(dataProfil, sock, msg, minimalToken);
      if (!cek) return;
      try {
        await fitur.sertifikatCintaHandler(sock, msg, pesan);
        lessToken(dataProfil.nomor, minimalToken);
      } catch (error) {
        await kirimPesan(`Gagal kirim pesan ${error.message}`);
      }
    } else if (pesan.startsWith(".confess")) {
      const dataProfil = await profile(
        senderNumber.replace("@s.whatsapp.net", "")
      );
      const minimalToken = 1;
      const cek = await cekToken(dataProfil, sock, msg, minimalToken);
      if (!cek) return;
      try {
        const success = await fitur.confessHandler(sock, msg, pesan);
        if (!success) return;
        lessToken(dataProfil.nomor, minimalToken);
      } catch (error) {
        await kirimPesan(`Gagal kirim pesan ${error.message}`);
      }
    } else if (
      m.imageMessage &&
      (m.imageMessage.caption || "").toLowerCase().trim() === ".hd"
    ) {
      const dataProfil = await profile(
        senderNumber.replace("@s.whatsapp.net", "")
      );
      const minimalToken = 1;
      const cek = await cekToken(dataProfil, sock, msg, minimalToken);
      if (!cek) return;
      try {
        const success = await fitur.upscaleHandler(sock, msg);
        if (!success) return;
        lessToken(dataProfil.nomor, minimalToken);
      } catch (error) {}
    } else if (pesan === ".cekpeserta") {
      if (senderNumber.replace("@s.whatsapp.net", "") !== NomorOwner) {
        return await kirimPesan(
          "Anda bukan owner, lappet jangan aneh aneh kau"
        );
      }
      try {
        await fitur.cekPeserta(sock, msg);
      } catch (error) {
        await kirimPesan(`Gagal kirim pesan ${error.message}`);
      }
    } else if (pesan.startsWith(".qrcode")) {
      const dataProfil = await profile(
        senderNumber.replace("@s.whatsapp.net", "")
      );
      const minimalToken = 1;
      const cek = await cekToken(dataProfil, sock, msg, minimalToken);
      if (!cek) return;
      const args = pesan.split(" ").slice(1).join(" ");
      try {
        const success = await fitur.qrcodeHandler(sock, msg, args);
        if (!success) return;
        lessToken(dataProfil.nomor, minimalToken);
      } catch (error) {
        await kirimPesan(`Gagal kirim pesan ${error.message}`);
      }
    } else if (pesan.startsWith(".brat")) {
      const dataProfil = await profile(
        senderNumber.replace("@s.whatsapp.net", "")
      );
      const minimalToken = 1;
      const cek = await cekToken(dataProfil, sock, msg, minimalToken);
      if (!cek) return;
      const args = pesan.split(" ").slice(1).join(" ");
      try {
        await kirimReaction("🕒");
        const success = await fitur.bratvidHandler(sock, msg, args);
        if (!success) {
          return await kirimReaction("❌");
        }
        lessToken(dataProfil.nomor, minimalToken);
        await kirimReaction("✅");
      } catch (error) {
        await kirimPesan(`Gagal kirim pesan ${error.message}`);
      }
    }
  });
}

await startBot();
app.listen(process.env.PORT, "0.0.0.0", () => {
  console.log(`Server running on 0.0.0.0:${process.env.PORT}`);
});
