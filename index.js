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
        lastDisconnect.error instanceof Boom
          ? lastDisconnect.error.output.statusCode !==
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
        await sock.sendMessage(senderNumber, {text: "⏳ Tunggu beberapa detik sebelum mengirim pesan lagi."});
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
      const query = messageText.split(" ")[1];
      if (!query) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: "Contoh penggunaan: .tiktok https://vt.tiktok.com/xxxx",
        });
      }
      const namaUser = "kak";

      try {
        const data = await tiktokApi.download(query);

        if (!data || !data.video) {
          throw new Error("Tidak bisa mengambil video.");
        }

        await sock.sendMessage(senderNumber, {
          text: `Lagi download video-nya, sabar ya ${namaUser} ...`,
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
    } else if (
      messageText.startsWith(".ig") ||
      messageText.startsWith(".instagram")
    ) {
      const query = messageText.split(" ")[1];
      if (!query) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: "Contoh penggunaan: .ig https://www.instagram.com/reel/xxxx",
        });
      }
      const namaUser = "kak";

      try {
        const results = await instagramDl(query);

        // Cari link yang mengandung mp4 (video)
        const videoLink = results.find((r) =>
          r.title.toLowerCase().includes("video")
        )?.url;

        if (!videoLink) {
          return sock.sendMessage(msg.key.remoteJid, {
            text: `${nameSender}, vidio nya ga ketemu ....`,
          });
        }

        await sock.sendMessage(msg.key.remoteJid, {
          text: `sabar ya ${namaUser} ........`,
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
    } else if (messageText) {
      const apiUrl =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: `
Anda adalah customer service resmi lomba OSC 2025.
Gunakan data berikut sebagai satu-satunya sumber jawaban:

📄 Panduan & rangkuman teknikal meeting lomba Mascot Design:
${panduan.mascot}

📄 Panduan lomba Network Simulation:
${panduan.netsim}

📄 Panduan lomba Web Design:
${panduan.webdesign}

📄 Panduan lomba System Administration:
${panduan.sysadmin}

⚠️ Aturan Menjawab:
1. Jawab hanya berdasarkan panduan di atas, tanpa menambah atau mengubah fakta.
2. Gunakan bahasa Indonesia yang sopan dan profesional ala CS.
3. Format teks rapi seperti percakapan WhatsApp:
   - Gunakan emoji yang relevan.
   - Gunakan *bold* untuk penekanan.
   - Rapikan dari list tab / space sesuai dengan styling text di whatsapp
   - Gunakan bullet/nomor untuk daftar.
4. Jawab ringkas, jelas, dan to the point.
5. Jangan awali dengan kata "Halo" atau sapaan berulang jika tidak perlu.
6. Jika informasi tidak ada di panduan, jawab: "Mohon maaf, informasi tersebut tidak tersedia di panduan kami."

Sekarang jawab pertanyaan ini sebagai CS:
"${messageText}"
`,
              },
            ],
          },
        ],
      };

      const config = {
        headers: {
          "x-goog-api-key": process.env.API_AI,
          "Content-Type": "application/json",
        },
      };

      let hasil = "";

      try {
        const response = await axios.post(apiUrl, requestBody, config);
        hasil = response.data.candidates[0].content.parts[0].text;
      } catch (error) {
        console.error("Error saat memanggil API: ", error.message);
        hasil = "Maaf, terjadi kesalahan saat menjawab pertanyaan Anda.";
      }

      await sock.sendMessage(msg.key.remoteJid, { text: hasil }, {quoted: msg});
    }
  });
}

await startBot();
app.listen(process.env.PORT, "0.0.0.0", () => {
  console.log(`Server running on 0.0.0.0:${process.env.PORT}`);
});
