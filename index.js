import express from "express";
import cors from "cors";
import {
  makeWASocket,
  useMultiFileAuthState,
  downloadMediaMessage,
  jidNormalizedUser,
  fetchLatestWaWebVersion,
  DisconnectReason,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode-terminal";
import fs from "fs";
import { kataKotor, simpleReplies, NomorOwner, menu, daftar } from "./list.js";
import { configDotenv } from "dotenv";
import { profile, lessToken, cekToken, sendMessageSafe } from "./func.js";
import multer from "multer";
import * as fitur from "./fitur/index.js";
import { checkApiKey, checkApiKeyBuisness } from "./helper/apiKey.js";
import * as query from "./helper/crud-Key.js";
import { crudApiKeyBuisness } from "./fitur/apiKeyBisnis.js";
import rateLimit from "express-rate-limit";

const upload = multer({ storage: multer.memoryStorage() });

configDotenv();
//WEBSOCKET NYA INI
try {
  global.WebSocket = (await import("ws")).default;
} catch {}

const app = express();
app.use(cors());
app.use(express.json());

const userLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 15, // maksimal 15 request per user
  keyGenerator: (req) => req.apikeyId, // gunakan userId sebagai key
  message: "Terlalu banyak request, coba lagi nanti.",
});

let version;
try {
  const { version: waVersion } = await fetchLatestWaWebVersion();
  version = waVersion;
} catch {
  version = [2, 3000, 1015901307]; // Fallback version
}
let sock;
let connecting = false;
async function startBot() {
  if (connecting) return;
  connecting = true;
  try {
    const { state, saveCreds } = await useMultiFileAuthState("auth");
    sock = makeWASocket({
      version,
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
        connecting = false;
        const shouldReconnect =
          lastDisconnect?.error instanceof Boom
            ? lastDisconnect.error.output?.statusCode !==
              DisconnectReason.loggedOut
            : true;

        console.log("Koneksi terputus karena:", lastDisconnect.error);

        if (shouldReconnect) {
          console.log("Mencoba menghubungkan kembali dalam 5 detik...");
          setTimeout(startBot, 5000);
        } else {
          console.log("Koneksi ditutup. Menghapus kredensial...");
          if (fs.existsSync("./auth")) {
            fs.rmSync("./auth", { recursive: true, force: true });
          }
        }
      }

      if (connection === "open") {
        console.log("Koneksi terbuka, bot sudah siap digunakan!");
        connecting = false;
      }

      if (qr) {
        console.log("Scan QR Code berikut untuk login:");
        qrcode.generate(qr, { small: true });
      }
    });
  } catch (error) {
    console.log(error);
    connecting = false;
    setTimeout(startBot, 5000);
  }

  app.get("/", async (req, res) => {
    res.send("WELCOME TO BOT WA");
  });

  /////////////////////////////////////////////////////////////////////////////
  // API to send message via website personal
  app.post("/api/kirim", checkApiKey, async (req, res) => {
    const pesan = req.body.pesan;
    const nomor = req.body.nomor;
    try {
      await sendMessageSafe(sock, `${nomor}@s.whatsapp.net`, { text: pesan });
      return res.status(200).json({ message: "Pesan berhasil dikirim" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Pesan gagal dikirim" });
    }
  });

  app.post("/api/webhook-payment", async (req, res) => {
    const data = req.body;
    const apiKey = req.query.key;

    if (!apiKey) {
      return res.status(401).json({ message: "API key tidak ditemukan" });
    }
    if (apiKey !== process.env.API_KEY) {
      return res.status(401).json({ message: "API key tidak valid" });
    }
    try {
      await fitur.topUp(sock, data);
      return res.status(200).json({ message: "Top Up berhasil" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Top Up gagal" });
    }
  });
  // API to send message via website for buisines
  app.post(
    "/api/kirim-pesan",
    checkApiKeyBuisness,
    userLimiter,
    async (req, res) => {
      if (!req.body.pesan || !req.body.nomor) {
        return res
          .status(400)
          .json({ message: "Data tidak lengkap, butuh body pesan dan nomor" });
      }
      const pesan = req.body.pesan;
      let nomor = req.body.nomor;
      if (nomor.startsWith("0")) {
        nomor = "62" + nomor.slice(1);
      }
      const maxLength = 300; // batas maksimal karakter
      if (pesan.length > maxLength) {
        return res.status(400).json({
          message: `Pesan terlalu panjang! Maksimal ${maxLength} karakter.`,
        });
      }
      try {
        await sendMessageSafe(sock, `${nomor}@s.whatsapp.net`, { text: pesan });
        return res.status(200).json({ message: "Pesan berhasil dikirim" });
      } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Pesan gagal dikirim" + error });
      }
    }
  );
  //KIRIM FILE
  app.post(
    "/api/kirim/pdf",
    checkApiKey,
    upload.single("file"),
    async (req, res) => {
      try {
        const { nomor, pesan } = req.body;
        const file = req.file;

        if (!file) {
          return res.status(400).json({ message: "File tidak ditemukan" });
        }

        // kirim dokumen ke WhatsApp
        await sendMessageSafe(sock, `${nomor}@s.whatsapp.net`, {
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
    }
  );
  //GRUB
  app.post("/api/grub", checkApiKey, async (req, res) => {
    const pesan = req.body.pesan;
    const nomor = req.body.nomor;
    try {
      await sendMessageSafe(sock, `${nomor}@g.us`, { text: pesan });
      return res.status(200).json({ message: "Pesan berhasil dikirim" });
    } catch (error) {
      return res.status(500).json({ message: "Pesan gagal dikirim" });
    }
  });
  // API for group broadcast
  app.post("/api/broadcast", checkApiKey, async (req, res) => {
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
  // CEK TOKEN
  // /api/cek-token?key=YOURTOKEN
  // Cache data (result) dan anti-spam
  const tokenCheckCache = {};
  const CHECK_COOLDOWN = 8000; // 2 detik

  app.get("/api/cek-token", async (req, res) => {
    const key = req.query.key;
    try {
      if (!key) {
        return res.status(400).json({ error: "API key wajib dikirim!" });
      }
      const now = Date.now();
      const cache = tokenCheckCache[key];
      // ======================================================
      // 🔥 Kalau sudah pernah cek dalam 2 detik → balas dari cache
      // ======================================================
      if (cache && cache.expires > now) {
        return res.status(200).json({
          success: true,
          message: "Token valid! (cached)",
          cached: true,
          data: cache.data,
        });
      }

      // ======================================================
      // 🔍 Query JSON (karena cache tidak valid / expired)
      // ======================================================
      const findKey = await query.readDataBy("key", key);

      if (!findKey) {
        return res.status(403).json({ error: "API key tidak valid!" });
      }

      // Simpan ke cache (valid 2 detik)
      tokenCheckCache[key] = {
        data: findKey,
        expires: now + CHECK_COOLDOWN,
      };

      return res.status(200).json({
        success: true,
        message: "Token valid!",
        cached: false,
        data: findKey,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Terjadi kesalahan server" + error });
    }
  });

  ///////////////////////////////////////////////////////////////////////////////

  const rateLimitMap = new Map();

  // Handle incoming messages
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    const msg = messages[0];
    if (!msg.message) return;

    const jid = msg.key.remoteJid;
    if (jid === "status@broadcast") return;

    // Cek jika pengirim adalah bot sendiri (normalize user first)
    const botId = jidNormalizedUser(sock.user.id);
    if (msg.key.fromMe) return;

    // Hindari duplikasi di grup: hanya tangani jika pengirimnya bukan sistem
    if (msg.key.participant && jid.endsWith("@g.us")) {
      if (jidNormalizedUser(msg.key.participant) === botId) return;
    }

    const m = msg.message;

    // Prioritaskan PN (Phone Number) jika tersedia
    let rawJid = msg.key.remoteJid;
    let senderNumber = jidNormalizedUser(rawJid);

    // Cek senderPn di message key (sering ada di v6 untuk LID)
    if (msg.key.senderPn) {
      senderNumber = jidNormalizedUser(msg.key.senderPn);
    }
    // Jika tidak ada di senderPn, coba remoteJidAlt
    else if (
      msg.key.remoteJidAlt &&
      msg.key.remoteJidAlt.endsWith("@s.whatsapp.net")
    ) {
      senderNumber = jidNormalizedUser(msg.key.remoteJidAlt);
    }
    // Terakhir, coba mapping manual jika masih LID
    else if (senderNumber.endsWith("@lid")) {
      try {
        const pn = await sock.signalRepository?.lidMapping?.getPNForLID(
          senderNumber
        );
        if (pn) {
          senderNumber = jidNormalizedUser(pn);
        }
      } catch (e) {
        console.error("Gagal mapping LID ke PN:", e.message);
      }
    }

    // Ekstrak teks dari berbagai tipe pesan
    const messageType = Object.keys(m)[0];
    let messageText = "";

    if (messageType === "conversation") {
      messageText = m.conversation;
    } else if (messageType === "extendedTextMessage") {
      messageText = m.extendedTextMessage.text;
    } else if (messageType === "imageMessage") {
      messageText = m.imageMessage.caption;
    } else if (messageType === "videoMessage") {
      messageText = m.videoMessage.caption;
    } else if (messageType === "templateButtonReplyMessage") {
      messageText = m.templateButtonReplyMessage.selectedId;
    } else if (messageType === "buttonsResponseMessage") {
      messageText = m.buttonsResponseMessage.selectedButtonId;
    } else if (messageType === "listResponseMessage") {
      messageText = m.listResponseMessage.singleSelectReply.selectedRowId;
    }

    if (!messageText) messageText = "";

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
          text: "Terlalu banyak permintaan, tunggu 3-5 detik",
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
    } else if (senderNumber == "120363405146206045@g.us") {
      await fitur.sendPesan(pesan);
    } else if (
      messageText.startsWith(".tiktok") ||
      messageText.startsWith(".tt")
    ) {
      await kirimReaction("🕒");
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
        const cek = await fitur.tiktokDownloader(query, sock, msg, namaUser);
        if (!cek) return;
        lessToken(senderNumber.replace("@s.whatsapp.net", ""), 1);
        await kirimReaction("✅");
      } catch (err) {
        console.error("Gagal download TikTok:", err.message);
        await kirimReaction("❌");
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
        await kirimReaction("🕒");
        await fitur.daftarFunc(parts, sock, msg, senderNumber);
        await kirimReaction("✅");
      } catch (error) {
        await kirimReaction("❌");
        await sock.sendMessage(msg.key.remoteJid, {
          text: "❌ Gagal mendaftar. Silahkan Gunakan Nama Lain dan Coba Lagi.",
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
        await kirimReaction("🕒");
        const cek = await fitur.instagramDownloader(query, sock, msg, namaUser);
        if (!cek) return;
        lessToken(pengirim, 1);
        await kirimReaction("✅");
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
💰 *Saldo*      : Rp.${dataProfil.saldo}

${
  dataProfil.token <= 0
    ? `⚠️ _Token kamu sudah *habis*_ 😢\n📩 Beli Token dengan perintah *.beli token*`
    : `💡 Token kamu aktif!
Token digunakan untuk mengakses fitur-fitur bot seperti download, stiker, dan lainnya.
Semakin banyak token = semakin banyak fitur yang bisa kamu pakai!

Ketik *.topup* untuk top up saldo
ketik *.beli* untuk beli token
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
        await kirimPesan("Gagal Menambahkan token" + error.message);
      }
    } else if (pesan === ".menu") {
      await kirimReaction("🕒");
      await kirimPesan(menu);
      await kirimReaction("✅");
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

📩 Beli Token dengan perintah *.beli token*

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
    } else if (
      (m.imageMessage &&
        m.imageMessage.caption.toLowerCase().trim() === ".ghibli") ||
      pesan === ".ghibli"
    ) {
      await kirimPesan("Fitur ini sedang tahap Maintenance");
    } else if (messageText.startsWith(".dcig")) {
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
        const cek = await fitur.instagramDownloaderDC(
          query,
          sock,
          msg,
          namaUser
        );
        if (!cek) return;
      } catch (e) {
        console.error("Gagal download Instagram:", e.message);
        await sock.sendMessage(msg.key.remoteJid, {
          text: "❌ Gagal mengambil video dari Instagram. Coba lagi nanti.",
        });
      }
    } else if (pesan.startsWith(".apikey")) {
      try {
        crudApiKeyBuisness(sock, msg, senderNumber, pesan);
      } catch (error) {}
    } else if (pesan.startsWith(".free")) {
      const dataProfil = await profile(
        senderNumber.replace("@s.whatsapp.net", "")
      );
      if (!dataProfil) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: daftar,
        });
      }
      if (dataProfil.free_event === false) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: `Maaf ${dataProfil.nama}, Kamu hanya bisa claim 1x`,
        });
      }
      try {
        await kirimReaction("🕒");
        const success = await fitur.daftarHosting(sock, msg, dataProfil);
        if (!success) {
          return await kirimReaction("❌");
        }
        await kirimReaction("✅");
      } catch (error) {
        await kirimPesan(`Gagal Daftar pesan ${error.message}`);
      }
    } else if (pesan.startsWith("/laporan")) {
      try {
        await fitur.sendLaporan(sock, msg, senderNumber, pesan);
      } catch (error) {
        await kirimPesan(`Gagal kirim laporan pesan ${error}`);
      }
    } else if (pesan.startsWith(".topup")) {
      try {
        await fitur.tutorTopUp(sock, msg, senderNumber);
      } catch (error) {
        await kirimPesan(`Gagal kirim tutor top up pesan ${error}`);
      }
    } else if (pesan.startsWith(".beli")) {
      try {
        await fitur.beli(sock, msg, senderNumber, pesan);
      } catch (error) {
        await kirimPesan(`Gagal kirim beli token pesan ${error}`);
      }
    }
  });
}

global.pendingGhibli = new Map();
await startBot();
app.listen(process.env.PORT, "0.0.0.0", () => {
  console.log(`Server running on 0.0.0.0:${process.env.PORT}`);
});
