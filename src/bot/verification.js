import { resolveSender } from "./context.js";
import { stripJid } from "../utils/whatsapp.js";
import { verifyFromMessage } from "../features/verification/verification.js";

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5; // per nomor per menit, cegah tebak-tebakan kode
const attempts = new Map();

const isLimited = (sender) => {
  const now = Date.now();
  const hits = (attempts.get(sender) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  attempts.set(sender, hits);

  // Bersihkan nomor yang sudah lama tidak aktif supaya Map tidak terus membesar
  if (attempts.size > 1000) {
    for (const [k, v] of attempts) if (now - v.at(-1) > WINDOW_MS) attempts.delete(k);
  }
  return hits.length > MAX_ATTEMPTS;
};

/**
 * Proses pesan verifikasi (sudah dipastikan chat pribadi & diawali prefix).
 * Respon ke user mengikuti reply_mode project: none (diam) | reaction (emoji) | message (teks).
 */
export const handleVerification = async (sock, msg, text) => {
  const sender = await resolveSender(sock, msg.key);
  if (isLimited(sender)) return; // diam saja, supaya bot tidak ikut spam

  try {
    const result = await verifyFromMessage(text, stripJid(sender));
    if (!result || result.mode === "none") return;

    const jid = msg.key.remoteJid;
    if (result.mode === "reaction") {
      await sock.sendMessage(jid, { react: { text: result.emoji, key: msg.key } });
    } else {
      await sock.sendMessage(jid, { text: result.text }, { quoted: msg });
    }
  } catch (error) {
    console.error("[Verification] Error:", error);
  }
};
