import { Router } from "express";
import rateLimit from "express-rate-limit";
import prisma from "../../config/db.js";
import { checkProjectKey } from "../middleware/auth.js";
import QRCode from "qrcode";
import {
  baseUrl,
  createVerification,
  effectiveStatus,
  PREFIX,
  simulateVerification,
  toPayload,
  waLink,
} from "../../features/verification/verification.js";
import { botNumber } from "../../utils/whatsapp.js";

const createLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60, // per project per menit
  keyGenerator: (req) => req.project.id,
  message: { message: "Terlalu banyak request, coba lagi nanti." },
});

const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120, // per IP per menit (halaman polling tiap beberapa detik)
  message: { message: "Terlalu banyak request, coba lagi nanti." },
});

/** Kirim error 4xx dari simulateVerification sebagai JSON, lempar error lain. */
const sendKnownError = (res, error) => {
  if (!error.status) throw error;
  res.status(error.status).json({ message: error.message });
};

/** API verifikasi WA untuk app external. Auth: header x-api-key = api key project. */
export const verificationRoutes = ({ getSock }) => {
  const router = Router();
  router.use("/v1/verifications", checkProjectKey);

  router.post("/v1/verifications", createLimiter, async (req, res) => {
    const number = botNumber(getSock());
    if (!number) return res.status(503).json({ message: "Bot WhatsApp belum terhubung" });

    try {
      const v = await createVerification(req.project, req.body);
      res.status(201).json(toPayload(v, number, baseUrl(req)));
    } catch (error) {
      if (!error.status) throw error;
      res.status(error.status).json({ message: error.message });
    }
  });

  // Cek status (fallback kalau webhook tidak sampai)
  router.get("/v1/verifications/:id", async (req, res) => {
    const v = await prisma.verification.findFirst({
      where: { id: req.params.id, project_id: req.project.id },
    });
    if (!v) return res.status(404).json({ message: "Verifikasi tidak ditemukan" });
    res.json(toPayload(v, botNumber(getSock()), baseUrl(req)));
  });

  // Simulasi user mengirim kode (hanya project sandbox). Body opsional: { phone }
  router.post("/v1/verifications/:id/simulate", async (req, res) => {
    const v = await prisma.verification.findFirst({
      where: { id: req.params.id, project_id: req.project.id },
      include: { project: true },
    });
    if (!v) return res.status(404).json({ message: "Verifikasi tidak ditemukan" });
    try {
      res.json(toPayload(await simulateVerification(v, req.body?.phone), botNumber(getSock()), baseUrl(req)));
    } catch (error) {
      sendKnownError(res, error);
    }
  });

  // ── Publik: data untuk halaman /verify/<token> (tanpa auth) ──
  router.get("/public/verifications/:token", publicLimiter, async (req, res) => {
    const v = await prisma.verification.findUnique({
      where: { token: req.params.token },
      include: { project: { select: { name: true, active: true, sandbox: true } } },
    });
    if (!v || !v.project.active) return res.status(404).json({ message: "Link verifikasi tidak ditemukan" });

    const link = waLink(v, botNumber(getSock()));
    res.set("Cache-Control", "no-store").json({
      project: v.project.name,
      code: v.code,
      prefix: PREFIX,
      status: effectiveStatus(v),
      // Hanya 4 digit terakhir, supaya link yang tersebar tidak membocorkan nomor
      phone_hint: v.phone ? `••••${v.phone.slice(-4)}` : null,
      expires_at: v.expires_at,
      verified_at: v.verified_at,
      wa_link: link,
      qr_svg: link ? await QRCode.toString(link, { type: "svg", margin: 1, errorCorrectionLevel: "M" }) : null,
      sandbox: v.project.sandbox,
      server_time: new Date(),
    });
  });

  // Tombol simulasi di halaman verifikasi (hanya project sandbox)
  router.post("/public/verifications/:token/simulate", publicLimiter, async (req, res) => {
    const v = await prisma.verification.findUnique({ where: { token: req.params.token }, include: { project: true } });
    if (!v || !v.project.active) return res.status(404).json({ message: "Link verifikasi tidak ditemukan" });
    try {
      await simulateVerification(v);
      res.json({ success: true });
    } catch (error) {
      sendKnownError(res, error);
    }
  });

  return router;
};
