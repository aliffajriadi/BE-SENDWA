import { jidNormalizedUser } from "@whiskeysockets/baileys";
import { buildContext } from "./context.js";
import { isDuplicate } from "./middleware/dedupe.js";
import { isSpam } from "./middleware/antispam.js";
import { relayConfess } from "./confess-relay.js";
import { route } from "./router.js";
import { extractText } from "../utils/whatsapp.js";
import { PREFIX as VERIFY_PREFIX } from "../features/verification/verification.js";
import { handleVerification } from "./verification.js";

/**
 * Pipeline pesan masuk:
 *   filter → dedupe → [verifikasi "@..." → selesai] → context → anti-spam → relay confess → router command
 */
export const handleMessage = async (sock, { messages, type }) => {
  if (type !== "notify") return;
  const msg = messages[0];
  if (!msg?.message) return;

  const jid = msg.key.remoteJid;
  if (jid === "status@broadcast") return;
  if (msg.key.fromMe) return;
  if (isDuplicate(msg)) return;

  // Abaikan pesan dari bot sendiri di grup
  if (msg.key.participant && jid.endsWith("@g.us")) {
    const botId = jidNormalizedUser(sock.user.id);
    if (jidNormalizedUser(msg.key.participant) === botId) return;
  }

  // Jalur cepat verifikasi: chat pribadi yang diawali prefix tidak masuk pipeline command
  if (!jid.endsWith("@g.us")) {
    const { text } = extractText(msg.message);
    if (text.startsWith(VERIFY_PREFIX)) return handleVerification(sock, msg, text);
  }

  const ctx = await buildContext(sock, msg);
  console.log(`Pesan dari ${ctx.sender}: ${ctx.text}`);

  if (await isSpam(ctx)) return;
  if (await relayConfess(ctx)) return;

  await route(ctx);
};
