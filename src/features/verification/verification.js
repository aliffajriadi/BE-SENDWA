import crypto from "crypto";
import prisma from "../../config/db.js";
import { env } from "../../config/env.js";

/**
 * Verifikasi nomor WhatsApp "reverse OTP", model payment gateway:
 *   app external (project) minta kode → user MENGIRIM pesan berisi kode ke bot
 *   → bot cocokkan → webhook ber-HMAC ke project.
 * Bot tidak pernah memulai chat, jadi aman dari banned.
 *
 * Aturan pesan (hardcode): diawali PREFIX dan berisi kode VERF-XXXXXX di mana saja.
 * Isi pesan selebihnya bebas disusun app external.
 */
export const PREFIX = "@";
const CODE_REGEX = /\bVERF-([A-Z0-9]{6})\b/i;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // tanpa 0/O/1/I biar tidak salah ketik

/** Respon bot ke user per project. Default "none" supaya bot tidak mengirim pesan sama sekali. */
export const REPLY_MODES = ["none", "reaction", "message"];

const EXPIRES_MIN = 60;
const EXPIRES_MAX = 86400; // 24 jam

const badRequest = (message) => Object.assign(new Error(message), { status: 400 });

const randomCode = () =>
  "VERF-" + Array.from({ length: 6 }, () => CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)]).join("");

/** Generate kredensial project. */
export const newApiKey = () => "pk_live_" + crypto.randomBytes(24).toString("hex");
export const newWebhookSecret = () => "whsec_" + crypto.randomBytes(24).toString("hex");

/** "0812-345" / "+62812345" → "62812345" */
export const normalizePhone = (v) => {
  const n = String(v).replace(/\D/g, "");
  return n.startsWith("0") ? "62" + n.slice(1) : n;
};

export const isHttpUrl = (v) => {
  try {
    return ["http:", "https:"].includes(new URL(v).protocol);
  } catch {
    return false;
  }
};

export const validExpires = (n) => Number.isInteger(n) && n >= EXPIRES_MIN && n <= EXPIRES_MAX;

/** Status efektif: pending yang sudah lewat waktu dianggap expired. */
export const effectiveStatus = (v) =>
  v.status === "pending" && v.expires_at < new Date() ? "expired" : v.status;

/** URL publik server ini: PUBLIC_URL dari .env, atau diambil dari request. */
export const baseUrl = (req) => (env.PUBLIC_URL || `${req.protocol}://${req.get("host")}`).replace(/\/+$/, "");

/** Link wa.me dengan pesan default "@Verifikasi VERF-XXXXXX". */
export const waLink = (v, botNumber) =>
  botNumber ? `https://wa.me/${botNumber}?text=${encodeURIComponent(`${PREFIX}Verifikasi ${v.code}`)}` : null;

/** Payload verifikasi untuk app external. */
export const toPayload = (v, botNumber, base) => {
  return {
    id: v.id,
    code: v.code,
    phone: v.verified_phone ?? v.phone,
    reference: v.reference,
    status: effectiveStatus(v),
    prefix: PREFIX,
    bot_number: botNumber,
    // Link siap pakai dengan pesan default; client boleh menyusun pesan sendiri
    wa_link: waLink(v, botNumber),
    // Halaman verifikasi siap pakai (seperti invoice_url di payment gateway)
    verification_url: `${base}/verify/${v.token}`,
    expires_at: v.expires_at,
    verified_at: v.verified_at,
    webhook_status: v.webhook_status,
    created_at: v.createdAt,
  };
};

/**
 * Buat verifikasi baru untuk sebuah project.
 * @param {object} project baris Project
 * @param {{ phone?: string, reference?: string, expires_in?: number }} input
 */
export const createVerification = async (project, input = {}) => {
  const { phone, reference } = input;

  const expiresIn = input.expires_in == null ? project.expires_in : Number(input.expires_in);
  if (!validExpires(expiresIn)) {
    throw badRequest(`expires_in harus angka detik antara ${EXPIRES_MIN}–${EXPIRES_MAX}`);
  }
  if (phone && normalizePhone(phone).length < 9) throw badRequest("phone tidak valid");
  if (reference != null && String(reference).length > 191) throw badRequest("reference maksimal 191 karakter");

  // Kode unik: ulangi kalau (sangat jarang) bentrok dengan kode lain
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.verification.create({
        data: {
          project_id: project.id,
          code: randomCode(),
          token: crypto.randomBytes(18).toString("base64url"),
          phone: phone ? normalizePhone(phone) : null,
          reference: reference != null && reference !== "" ? String(reference) : null,
          expires_at: new Date(Date.now() + expiresIn * 1000),
        },
      });
    } catch (error) {
      if (error.code !== "P2002") throw error; // P2002 = unique constraint (kode bentrok)
    }
  }
  throw new Error("Gagal membuat kode unik");
};

/**
 * Kirim webhook ke project. Tanda tangan: HMAC-SHA256(secret, `${timestamp}.${body}`).
 * @returns {Promise<"sent"|"failed"|null>} null kalau project tidak punya webhook_url
 */
export const sendWebhook = async (v, project) => {
  if (!project.webhook_url) return null;

  const body = JSON.stringify({
    event: "verification.success",
    id: v.id,
    code: v.code,
    phone: v.verified_phone,
    reference: v.reference,
    verified_at: v.verified_at,
  });
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto.createHmac("sha256", project.webhook_secret).update(`${timestamp}.${body}`).digest("hex");

  let status = "failed";
  try {
    const res = await fetch(project.webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Event": "verification.success",
        "X-Webhook-Timestamp": timestamp,
        "X-Webhook-Signature": `sha256=${signature}`,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) status = "sent";
    else console.error(`[Verification] Webhook ${v.code} ditolak: HTTP ${res.status}`);
  } catch (error) {
    console.error(`[Verification] Webhook ${v.code} gagal: ${error.message}`);
  }

  await prisma.verification.update({ where: { id: v.id }, data: { webhook_status: status } });
  return status;
};

/**
 * Tandai verifikasi berhasil atas nama `phone` lalu kirim webhook (dipakai bot & simulasi).
 * @param {object} v verifikasi + project
 * @returns {Promise<"ok"|"used"|"expired"|"phone_mismatch">}
 */
export const confirmVerification = async (v, phone) => {
  if (v.status === "verified") return "used";
  if (v.expires_at < new Date()) return "expired";
  if (v.phone && v.phone !== phone) return "phone_mismatch";

  // Klaim atomic: kalau dua request masuk bersamaan, hanya satu yang menang
  const verifiedAt = new Date();
  const { count } = await prisma.verification.updateMany({
    where: { id: v.id, status: "pending" },
    data: { status: "verified", verified_phone: phone, verified_at: verifiedAt },
  });
  if (count === 0) return "used";

  // Webhook di background supaya respon tidak menunggu server client
  sendWebhook({ ...v, verified_phone: phone, verified_at: verifiedAt }, v.project).catch((e) =>
    console.error("[Verification] Webhook error:", e),
  );
  return "ok";
};

const SIMULATE_ERRORS = {
  used: [409, "Kode ini sudah digunakan"],
  expired: [410, "Kode verifikasi sudah kedaluwarsa"],
  phone_mismatch: [400, "phone tidak sesuai dengan nomor di permintaan verifikasi"],
};
export const DEFAULT_SIMULATE_PHONE = "6280000000000";

/**
 * Simulasi user mengirim kode ke bot (hanya project sandbox). Webhook tetap dikirim sungguhan.
 * @returns {Promise<object>} verifikasi terbaru
 */
export const simulateVerification = async (v, phone) => {
  if (!v.project.sandbox) {
    throw Object.assign(new Error("Simulasi hanya untuk project mode sandbox"), { status: 403 });
  }
  const sender = phone ? normalizePhone(phone) : v.phone || DEFAULT_SIMULATE_PHONE;
  const result = await confirmVerification(v, sender);
  if (result !== "ok") {
    const [status, message] = SIMULATE_ERRORS[result];
    throw Object.assign(new Error(message), { status });
  }
  return prisma.verification.findUnique({ where: { id: v.id } });
};

/**
 * Proses pesan WA yang diawali PREFIX.
 * @returns {Promise<{ result: string, code?: string, mode?: string, emoji?: string, text?: string }>}
 *   result "no_code" / "unknown" → project tidak diketahui, bot diam
 */
export const verifyFromMessage = async (text, senderNumber) => {
  const match = text.match(CODE_REGEX);
  if (!match) return { result: "no_code" };

  const code = `VERF-${match[1].toUpperCase()}`;
  const v = await prisma.verification.findUnique({ where: { code }, include: { project: true } });
  if (!v || !v.project.active) return { result: "unknown", code };

  const result = await confirmVerification(v, senderNumber);
  const respond = (emoji, msg) => ({ result, code, mode: v.project.reply_mode, emoji, text: msg });

  if (result === "used") return respond("ℹ️", "ℹ️ Kode ini sudah digunakan.");
  if (result === "expired") return respond("⌛", "⌛ Kode verifikasi sudah kedaluwarsa, silahkan minta kode baru.");
  if (result === "phone_mismatch") return respond("❌", "❌ Nomor ini tidak sesuai dengan permintaan verifikasi.");
  return respond("✅", v.project.success_message || `✅ Verifikasi ${code} berhasil. Silahkan kembali ke aplikasi.`);
};
