import { Router } from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import { checkApiKey, checkApiKeyBuisness } from "../middleware/auth.js";
import { sendMessageSafe, toUserJid } from "../../utils/whatsapp.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

const MAX_BUSINESS_LENGTH = 300;

const businessLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 15, // maksimal 15 request per API key
  keyGenerator: (req) => req.apikeyId,
  message: "Terlalu banyak request, coba lagi nanti.",
});

/** Kirim pesan via WhatsApp dari website / layanan lain. */
export const messageRoutes = ({ getSock }) => {
  const router = Router();

  // Website personal
  router.post("/kirim", checkApiKey, async (req, res) => {
    const { pesan, nomor } = req.body;
    try {
      await sendMessageSafe(getSock, `${nomor}@s.whatsapp.net`, { text: pesan });
      return res.status(200).json({ message: "Pesan berhasil dikirim" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Pesan gagal dikirim" });
    }
  });

  // Klien bisnis (API key berbayar per request)
  router.post("/kirim-pesan", checkApiKeyBuisness, businessLimiter, async (req, res) => {
    const { pesan, nomor } = req.body;
    if (!pesan || !nomor) {
      return res
        .status(400)
        .json({ message: "Data tidak lengkap, butuh body pesan dan nomor" });
    }
    if (pesan.length > MAX_BUSINESS_LENGTH) {
      return res.status(400).json({
        message: `Pesan terlalu panjang! Maksimal ${MAX_BUSINESS_LENGTH} karakter.`,
      });
    }
    try {
      await sendMessageSafe(getSock, toUserJid(nomor), { text: pesan });
      return res.status(200).json({ message: "Pesan berhasil dikirim" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Pesan gagal dikirim" });
    }
  });

  // Kirim dokumen (PDF, dll)
  router.post("/kirim/pdf", checkApiKey, upload.single("file"), async (req, res) => {
    const { nomor, pesan } = req.body;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "File tidak ditemukan" });
    }
    try {
      await sendMessageSafe(getSock, `${nomor}@s.whatsapp.net`, {
        document: file.buffer,
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

  // Kirim ke grup
  router.post("/grub", checkApiKey, async (req, res) => {
    const { pesan, nomor } = req.body;
    try {
      await sendMessageSafe(getSock, `${nomor}@g.us`, { text: pesan });
      return res.status(200).json({ message: "Pesan berhasil dikirim" });
    } catch (error) {
      return res.status(500).json({ message: "Pesan gagal dikirim" });
    }
  });

  // Kirim ke semua anggota grup satu per satu (diproses di background)
  router.post("/broadcast", checkApiKey, (req, res) => {
    const { tujuan: groupId, pesan } = req.body;
    res.status(200).json({ message: "Broadcast sedang diproses di latar belakang..." });

    (async () => {
      try {
        const { participants } = await getSock().groupMetadata(groupId);
        console.log(`📢 Menyiarkan pesan ke ${participants.length} anggota grup...`);

        for (const { id: jid } of participants) {
          try {
            await sendMessageSafe(getSock, jid, { text: pesan }, 1);
            console.log(`✅ Pesan terkirim ke ${jid}`);
          } catch (err) {
            console.error(`❌ Gagal kirim ke ${jid}`, err.message);
          }
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        console.log("✅ Broadcast selesai.");
      } catch (error) {
        console.error("❌ Gagal broadcast:", error);
      }
    })();
  });

  return router;
};
