import { Router } from "express";
import prisma from "../../config/db.js";
import { checkApiKey, isMasterKey } from "../middleware/auth.js";
import {
  createVerification,
  effectiveStatus,
  isHttpUrl,
  newApiKey,
  newWebhookSecret,
  REPLY_MODES,
  baseUrl,
  sendWebhook,
  toPayload,
  validExpires,
} from "../../features/verification/verification.js";
import { botNumber } from "../../utils/whatsapp.js";

const toInt = (v, fallback = 0) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

/** API untuk dashboard admin (/admin). Semua endpoint butuh header x-api-key. */
export const adminRoutes = ({ getStatus, getSock }) => {
  const router = Router();

  router.post("/login", (req, res) => {
    if (isMasterKey(req.body?.key)) {
      return res.json({ success: true, message: "Login Berhasil" });
    }
    res.status(401).json({ success: false, message: "API Key Salah!" });
  });

  router.use(checkApiKey);

  // ── Ringkasan ────────────────────────────────────────────────
  router.get("/status", (req, res) => {
    res.json({ bot: getStatus(), uptime: process.uptime() });
  });

  router.get("/stats", async (req, res) => {
    const [users, tokenSum, apiKeys, paymentsSuccess, revenue] = await Promise.all([
      prisma.user.count(),
      prisma.user.aggregate({ _sum: { token: true, saldo: true } }),
      prisma.apiKey.count(),
      prisma.payment.count({ where: { status: "success" } }),
      prisma.payment.aggregate({ where: { status: "success" }, _sum: { amount: true } }),
    ]);
    res.json({
      users,
      totalToken: tokenSum._sum.token ?? 0,
      totalSaldo: tokenSum._sum.saldo ?? 0,
      apiKeys,
      paymentsSuccess,
      revenue: revenue._sum.amount ?? 0,
    });
  });

  // ── Users ────────────────────────────────────────────────────
  router.get("/users", async (req, res) => {
    res.json(await prisma.user.findMany({ orderBy: { name: "asc" } }));
  });

  router.post("/users", async (req, res) => {
    const { nomor, name, token, saldo, free_event } = req.body;
    if (!nomor || !name) {
      return res.status(400).json({ message: "Nomor dan nama wajib diisi" });
    }
    const data = {
      name: String(name),
      token: toInt(token),
      saldo: toInt(saldo),
      free_event: free_event ?? true,
    };
    const user = await prisma.user.upsert({
      where: { nomor: String(nomor) },
      update: data,
      create: { nomor: String(nomor), ...data },
    });
    res.json(user);
  });

  router.delete("/users/:nomor", async (req, res) => {
    await prisma.user.delete({ where: { nomor: req.params.nomor } });
    res.json({ success: true });
  });

  // ── API Keys ─────────────────────────────────────────────────
  router.get("/apikeys", async (req, res) => {
    res.json(await prisma.apiKey.findMany({ orderBy: { createdAt: "desc" } }));
  });

  router.post("/apikeys", async (req, res) => {
    const { id, key, owner, token } = req.body;
    if (!id || !key || !owner) {
      return res.status(400).json({ message: "ID, key, dan owner wajib diisi" });
    }
    const data = { key: String(key), owner: String(owner), token: toInt(token) };
    const apikey = await prisma.apiKey.upsert({
      where: { id: String(id) },
      update: data,
      create: { id: String(id), ...data },
    });
    res.json(apikey);
  });

  router.delete("/apikeys/:id", async (req, res) => {
    await prisma.apiKey.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  });

  // ── Payments (read-only) ─────────────────────────────────────
  router.get("/payments", async (req, res) => {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: Math.min(toInt(req.query.limit, 100), 500),
      include: { user: { select: { name: true } } },
    });
    res.json(payments);
  });

  // ── Projects verifikasi WA ───────────────────────────────────
  /** Validasi & ambil field project yang boleh diubah admin. */
  const projectFields = (body) => {
    const name = String(body.name ?? "").trim();
    const webhookUrl = String(body.webhook_url ?? "").trim();
    const expiresIn = toInt(body.expires_in, 300);
    if (!name) return { error: "Nama project wajib diisi" };
    if (webhookUrl && !isHttpUrl(webhookUrl)) return { error: "Webhook URL harus http/https" };
    if (!validExpires(expiresIn)) return { error: "Masa berlaku harus 60–86400 detik" };
    const replyMode = body.reply_mode ?? "none";
    if (!REPLY_MODES.includes(replyMode)) return { error: "Respon bot harus none, reaction, atau message" };
    return {
      data: {
        name,
        webhook_url: webhookUrl || null,
        expires_in: expiresIn,
        reply_mode: replyMode,
        success_message: String(body.success_message ?? "").trim() || null,
        active: body.active === undefined ? true : Boolean(body.active),
      },
    };
  };

  router.get("/projects", async (req, res) => {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { verifications: true } } },
    });
    const verified = await prisma.verification.groupBy({
      by: ["project_id"],
      where: { status: "verified" },
      _count: true,
    });
    const verifiedBy = Object.fromEntries(verified.map((v) => [v.project_id, v._count]));
    res.json(
      projects.map(({ _count, ...p }) => ({ ...p, total: _count.verifications, verified: verifiedBy[p.id] ?? 0 })),
    );
  });

  router.post("/projects", async (req, res) => {
    const { data, error } = projectFields(req.body ?? {});
    if (error) return res.status(400).json({ message: error });
    const project = await prisma.project.create({
      data: { ...data, api_key: newApiKey(), webhook_secret: newWebhookSecret() },
    });
    res.status(201).json(project);
  });

  router.put("/projects/:id", async (req, res) => {
    const { data, error } = projectFields(req.body ?? {});
    if (error) return res.status(400).json({ message: error });
    res.json(await prisma.project.update({ where: { id: req.params.id }, data }));
  });

  // Ganti api key / webhook secret (yang lama langsung tidak berlaku)
  router.post("/projects/:id/rotate", async (req, res) => {
    const field = req.body?.field;
    if (!["api_key", "webhook_secret"].includes(field)) {
      return res.status(400).json({ message: "field harus api_key atau webhook_secret" });
    }
    const value = field === "api_key" ? newApiKey() : newWebhookSecret();
    res.json(await prisma.project.update({ where: { id: req.params.id }, data: { [field]: value } }));
  });

  router.delete("/projects/:id", async (req, res) => {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  });

  // Buat verifikasi test dari dashboard
  router.post("/projects/:id/verifications", async (req, res) => {
    const number = botNumber(getSock());
    if (!number) return res.status(503).json({ message: "Bot WhatsApp belum terhubung" });
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ message: "Project tidak ditemukan" });
    try {
      const v = await createVerification(project, req.body ?? {});
      res.status(201).json({ ...toPayload(v, number, baseUrl(req)), project: project.name });
    } catch (error) {
      if (!error.status) throw error;
      res.status(error.status).json({ message: error.message });
    }
  });

  // ── Verifikasi WA ────────────────────────────────────────────
  router.get("/verifications", async (req, res) => {
    const list = await prisma.verification.findMany({
      where: req.query.project_id ? { project_id: String(req.query.project_id) } : undefined,
      orderBy: { createdAt: "desc" },
      take: Math.min(toInt(req.query.limit, 100), 500),
      include: { project: { select: { name: true, webhook_url: true } } },
    });
    const base = baseUrl(req);
    res.json(list.map((v) => ({ ...v, status: effectiveStatus(v), verification_url: `${base}/verify/${v.token}` })));
  });

  router.post("/verifications/:id/webhook", async (req, res) => {
    const v = await prisma.verification.findUnique({ where: { id: req.params.id }, include: { project: true } });
    if (!v) return res.status(404).json({ message: "Verifikasi tidak ditemukan" });
    if (v.status !== "verified") return res.status(400).json({ message: "Belum terverifikasi" });
    if (!v.project.webhook_url) return res.status(400).json({ message: "Project belum punya Webhook URL" });
    res.json({ webhook_status: await sendWebhook(v, v.project) });
  });

  router.delete("/verifications/:id", async (req, res) => {
    await prisma.verification.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  });

  return router;
};
