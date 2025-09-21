import crypto from "crypto";
// global.crypto = crypto;
import express from "express";
import cors from "cors";
import { createPool } from "mysql2/promise";
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode-terminal";
import fs from "fs";
import cheerio from "cherio/lib/cheerio.js";
import axios from "axios";
import { kataKotor, simpleReplies, panduan } from "./list.js";
import { configDotenv } from "dotenv";
import { dataos, getName, registerNumber } from "./func.js";
import multer from "multer";
import os from "os";
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

// SESUAIIN SAMA LOKAL NANTI
// const pool = createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASS,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// });

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
    // Skip jika status atau tidak ada pesan
    if (msg.key.remoteJid === "status@broadcast" || !msg.message) return;

    // Cek jika pengirim adalah bot sendiri
    if (msg.key.fromMe) return;

    // Hindari duplikasi di grup: hanya tangani jika pengirimnya bukan sistem
    if (msg.key.participant && msg.key.remoteJid.endsWith("@g.us")) {
      if (msg.key.participant === sock.user.id) return;
    }

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
    const cooldown = 5000; // 5 detik

    if (rateLimitMap.has(senderNumber)) {
      const lastTime = rateLimitMap.get(senderNumber);
      if (now - lastTime < cooldown) {
        await sock.sendMessage(senderNumber, {
          text: "⏳ Tunggu beberapa detik sebelum mengirim pesan lagi.",
        });
        return;
      }
    }
    rateLimitMap.set(senderNumber, now);

    //============================================================================================
    //INSTAGRAM DOWNLOADER
    async function instagramDl(url) {
      return new Promise(async (resolve, reject) => {
        try {
          const { data } = await axios.post(
            "https://yt1s.io/api/ajaxSearch",
            new URLSearchParams({ q: url, w: "", p: "home", lang: "en" }),
            {
              headers: {
                Accept: "application/json, text/plain, */*",
                "Content-Type":
                  "application/x-www-form-urlencoded; charset=UTF-8",
                Origin: "https://yt1s.io",
                Referer: "https://yt1s.io/",
                "User-Agent": "Mozilla/5.0 (compatible)",
              },
            }
          );

          const $ = cheerio.load(data.data);
          const results = $("a.abutton.is-success.is-fullwidth.btn-premium")
            .map((_, el) => ({
              title: $(el).attr("title"),
              url: $(el).attr("href"),
            }))
            .get();

          resolve(results);
        } catch (e) {
          console.error("yt1s error:", e.message);
          reject(e);
        }
      });
    }
    //END

    //===================================================================
    // TIKTOK - diletakkan di atas semua handler
    const tiktokApi = {
      download: async (url) => {
        try {
          const { data } = await axios.get(
            `https://tikwm.com/api?url=${encodeURIComponent(url)}`
          );
          if (!data || !data.data || !data.data.play) return null;

          return {
            video: data.data.play,
            audio: data.data.music,
            thumbnail: data.data.cover,
            description: data.data.title,
            username: data.data.author.nickname,
          };
        } catch (err) {
          console.error("API Tikwm error:", err.message);
          return null;
        }
      },
    };

    //===================================================================

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
      const namaUser = await getName(
        senderNumber.replace("@s.whatsapp.net", "")
      );
      if (!namaUser) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: `Nomor kamu belum terdaftar. Kirim pesan dengan format:\n\n.daftar NAMA_LENGKAP`,
        });
      }
      const query = messageText.split(" ")[1];
      if (!query) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: "Contoh penggunaan: .tiktok https://vt.tiktok.com/xxxx",
        });
      }

      try {
        const data = await tiktokApi.download(query);

        if (!data || !data.video) {
          throw new Error("Tidak bisa mengambil video.");
        }

        await sock.sendMessage(senderNumber, {
          text: `Lagi download video-nya, sabar ya ${namaUser} 😘 ...`,
        });

        const response = await axios.get(data.video, {
          responseType: "arraybuffer",
        });

        const videoBuffer = Buffer.from(response.data);
        if (videoBuffer.length > 16 * 1024 * 1024) {
          return sock.sendMessage(msg.key.remoteJid, {
            text: "Ukuran video terlalu besar (>16MB). Gagal dikirim.",
          });
        }

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            video: videoBuffer,
            mimetype: "video/mp4",
            caption: `✅ Berhasil download!\n\n👤 ${data.username || "-"}\n📝 ${
              data.description || "-"
            }`,
          },
          { quoted: msg }
        );
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

      //INSTAGRAM
    } else if (messageText.startsWith(".daftar")) {
      const parts = messageText.split(" ");
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

      const success = await registerNumber(number, name);
      if (success) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `✅ Terima kasih ${name}, nomor kamu telah terdaftar!`,
        });
      } else {
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
      const namaUser = await getName(
        senderNumber.replace("@s.whatsapp.net", "")
      );
      if (!namaUser) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: `Nomor kamu belum terdaftar. Kirim pesan dengan format:\n\n.daftar NAMA_LENGKAP`,
        });
      }
      const query = messageText.split(" ")[1];
      if (!query) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: "Contoh penggunaan: .ig https://www.instagram.com/reel/xxxx",
        });
      }

      try {
        const results = await instagramDl(query);

        // Cari link yang mengandung mp4 (video)
        const videoLink = results.find((r) =>
          r.title.toLowerCase().includes("video")
        )?.url;

        if (!videoLink) {
          return sock.sendMessage(msg.key.remoteJid, {
            text: `${namaUser}, vidio nya ga ketemu nih kyak ny kamu salah link deh ....`,
          });
        }

        await sock.sendMessage(msg.key.remoteJid, {
          text: `sabar ya ${namaUser} 😘 ........`,
        });

        const response = await axios.get(videoLink, {
          responseType: "arraybuffer",
        });
        const videoBuffer = Buffer.from(response.data);

        // WhatsApp maksimal file 16MB
        if (videoBuffer.length > 16 * 1024 * 1024) {
          return sock.sendMessage(msg.key.remoteJid, {
            text: "❌ Ukuran video terlalu besar (>16MB), tidak bisa dikirim.",
          });
        }

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            video: videoBuffer,
            mimetype: "video/mp4",
            caption: "✅ Berhasil download video dari Instagram.",
          },
          { quoted: msg }
        );
      } catch (e) {
        console.error("Gagal download Instagram:", e.message);
        await sock.sendMessage(msg.key.remoteJid, {
          text: "❌ Gagal mengambil video dari Instagram. Coba lagi nanti.",
        });
      }
    } else if (messageText.toLowerCase().startsWith("echo ")) {
      const echo = messageText.slice(5);
      await sock.sendMessage(senderNumber, { text: echo });
    } else if (pesan === ".server") {
      const uptime = os.uptime(); // dalam detik
const days = Math.floor(uptime / (60 * 60 * 24));
const hours = Math.floor((uptime % (60 * 60 * 24)) / (60 * 60));
const minutes = Math.floor((uptime % (60 * 60)) / 60);

await sock.sendMessage(msg.key.remoteJid, {
  text: `*🖥 SERVER INFO*

• *OS*        : ${os.platform()}
• *Release*   : ${os.release()}
• *Type*      : ${os.type()}
• *Hostname*  : ${os.hostname()}
• *Uptime*    : ${days} hari ${hours} jam ${minutes} menit
• *Total RAM* : ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB
• *Free RAM*  : ${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`
})


    }
  });
}

await startBot();
app.listen(process.env.PORT, "0.0.0.0", () => {
  console.log(`Server running on 0.0.0.0:${process.env.PORT}`);
});
