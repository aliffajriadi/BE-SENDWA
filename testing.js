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
import { text } from "stream/consumers";
import { timeAgo } from "./func.js";

// Try to import WebSocket if needed
try {
  global.WebSocket = (await import("ws")).default;
} catch {}

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Configure MySQL connection pool
const pool = createPool({
  host: "localhost",
  user: "root",
  database: "waif",
  password: "",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
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
  "asu",
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

  // API to get suggestions
  app.get("/api/saran", async (req, res) => {
    try {
      const [rows] = await pool.query(
        "SELECT * FROM saran ORDER BY dibuat DESC LIMIT 15"
      );
      const [countTotalConfess] = await pool.query(
        "SELECT COUNT(*) AS totalConfess FROM confess"
      );
      const countConfessTotal = countTotalConfess[0].totalConfess;
      const [countsaran] = await pool.query("SELECT COUNT(*) FROM saran");
      const countTotalSaran = countsaran[0]["COUNT(*)"];
      return res.status(200).json({ rows, countTotalSaran, countConfessTotal });
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // API SEND CONFESS
  app.post("/api/confess", async (req, res) => {
    const userid = req.body.id_users;
    const pesan = req.body.pesan;
    const dibuat = req.body.dibuat;
    const lowerText = pesan.toLowerCase();
    const katakata = lowerText;
    if (kataKotor.some((kata) => katakata.includes(kata))) {
      return res
        .status(403)
        .json({
          message:
            "Gagal Mengirim Confess, Otomatis MenDeteksi Analisa Sentimen -1 / Negatif dan mengujar Kebencian",
        });
    }
    try {
      const [rows] = await pool.query("SELECT nama FROM users WHERE id = ?", [
        userid,
      ]);
      const nama = rows[0].nama;
      await sock.sendMessage(userid, {
        text: `Hallo ${nama}👋, ada yang confess nihh:\n \n${pesan}`,
      });
      await pool.query(
        "INSERT INTO confess (id_users, pesan, dibuat) VALUES (?, ?, ?)",
        [userid, pesan, dibuat]
      );
      return res
        .status(200)
        .json({ message: `Confess Berhasil Dikirim Ke WhatsApp ${nama}` });
    } catch (error) {
      console.error("error fetch confess");
      return res.status(500).json({ message: "Internal Server Eror" });
    }
  });

  // API to submit suggestions
  app.post("/api/kirimsaran", async (req, res) => {
    const nama = req.body.nama;
    const no_wa = req.body.no_wa;
    const pesan = req.body.pesan;
    try {
      await pool.query(
        "INSERT INTO saran (nama, no_wa, pesan) VALUES (?, ?, ?)",
        [nama, no_wa, pesan]
      );
      return res
        .status(200)
        .json({ message: `Terimakasih ${nama} atas saran dan masukkannya` });
    } catch (error) {
      return res.status(500).json({ message: "Gagal Menambahkan Saran" });
    }
  });

  // Test API
  app.get("/api/test", async (req, res) => {
    try {
      return res.status(200).json({ message: "Online" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
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

  // Handle incoming messages
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (msg.key.remoteJid === "status@broadcast" || !msg.message) return;

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
    🕘 09.‌30 sd 12.‌50`,
    
      ".kamis": `📌 *Kamis - IF 2D*
    
    1. PBO (Prak) - BN - GU 702  
    🕘 07.‌50 sd 09.‌30  
    ====================
    2. PROWEB (Prak) - NN - GU 805  
    🕘 09.‌30 sd 12.‌10  
    ====================
    3. Jaringan Komputer (Prak) - DP - TA 10.3  
    🕘 13.‌40 sd 17.‌00`,
    
      ".jumat": `📌 *Jumat - IF 2D*
    
    1. DRPL (Prak) - UM - GU 704  
    🕘 07.‌50 sd 10.‌20  
    ====================
    2. BIngKom - BY - GU 701  
    🕘 13.‌40 sd 17.‌00`
    };
    
    

    // Deteksi kata kotor
    if (kataKotor.some((kata) => pesan.includes(kata))) {
      await sock.sendMessage(senderNumber, {
        text: "sopan dikit boss",
      });
    } else if (simpleReplies[pesan]) {
      await sock.sendMessage(senderNumber, { text: simpleReplies[pesan] });
    } else if (pesan === ".menu" || pesan === "menu" || pesan === '".menu"') {
      await sock.sendMessage(senderNumber, {
        text: "Hallo silahkan pilih menu \n1. Website waifd.vercel.app \n2. Cek Jadwal (.jadwal) \n3. Cek Saran (.saran)\n4. Cek Yang Confess keKamu (.confess) \n5. Hapus Confess (.hapusconfess)",
      });
    } else if (jadwal[pesan]) {
      await sock.sendMessage(senderNumber, { text: jadwal[pesan] });

      //CEK CONFESS VIA WHATSAPP
    } else if (pesan === ".confess") {
      try {
        const [rows] = await pool.query(
          "SELECT pesan, dibuat FROM confess WHERE id_users = ? ORDER BY dibuat DESC LIMIT 10",
          [senderNumber]
        );
        const [countConfess] = await pool.query(
          "SELECT COUNT(*) AS banyak FROM confess WHERE id_users = ?",
          [senderNumber]
        );
        const countku = countConfess[0].banyak;

        if (rows.length === 0) {
          await sock.sendMessage(senderNumber, {
            text: "Yahhh belum ada yang confess ke kamu 😌\n\nyuk kirim link ini ke teman teman kmu: waifd.vercel.app",
          });
          return;
        }

        let responsePesan = "Daftar pesan yang confess ke kamu😁: \n\n";
        for (const [index, row] of rows.entries()) {
          const waktuDibuat = await timeAgo(row.dibuat); // Menunggu hasil dari Promise timeAgo
          responsePesan += `Confess ${index + 1}.`;
          responsePesan += `${waktuDibuat}\n`;
          responsePesan += `Pesan:\n${row.pesan}\n\n\n`;
        }
        responsePesan += `Total Seluruh yang Confess ke Kamu: *${countku}*/10`;
        responsePesan += `Ketik ".menu" untuk menggunakan BOT`;

        await sock.sendMessage(senderNumber, { text: responsePesan });
      } catch (error) {
        await sock.sendMessage(senderNumber, {
          text: "Gagal Mengambil data, Silahkan Contact ke developer",
        });
      }
      //END CEK CONFESS
    } else if (pesan === ".saran") {
      try {
        const [rows] = await pool.query(
          "SELECT * FROM saran ORDER BY dibuat DESC LIMIT 5"
        );
        const [totalSaran] = await pool.query("SELECT COUNT(*) FROM saran");

        if (rows.length === 0) {
          await sock.sendMessage(senderNumber, {
            text: "Tidak ada saran yang ditemukan.",
          });
          return;
        }

        let responseMessage = "Daftar Saran:\n\n";
        rows.forEach((row, index) => {
          responseMessage += `Saran ${index + 1}:\n`;
          responseMessage += `Nama: ${row.nama}\n`;
          responseMessage += `No WA: ${row.no_wa}\n`;
          responseMessage += `Pesan: ${row.pesan}\n`;
          responseMessage += `Dibuat: ${new Date(
            row.dibuat
          ).toLocaleString()}\n\n`;
        });
        const count = totalSaran[0]["COUNT(*)"];
        responseMessage += `Total Saran : *${count}*`;

        await sock.sendMessage(senderNumber, { text: responseMessage });
      } catch (error) {
        console.log(error);
        await sock.sendMessage(senderNumber, {
          text: "Terjadi kesalahan saat mengambil data saran.",
        });
      }
    } else if (pesan === ".jadwal") {
      await sock.sendMessage(senderNumber, {
        text: "Pilih Hari \n .senin \n .selasa \n .rabu \n .kamis \n .jumaat",
      });

      //DELETE CONFESS
    } else if (pesan === ".hapusconfess") {
      try {
        await pool.query("DELETE FROM confess WHERE id_users = ?", [
          senderNumber,
        ]);
        await sock.sendMessage(senderNumber, {
          text: "✅ Berhasil Mnghapus Seluruh Confess mu",
        });
      } catch (error) {
        await sock.sendMessage(senderNumber, {
          text: "❌ Gagal Menghapus, Tolong hubungi developer",
        });
      }
    } else if (messageText.toLowerCase().startsWith("echo ")) {
      const echo = messageText.slice(5);
      await sock.sendMessage(senderNumber, { text: echo });
    }
  });
}

await startBot();
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
