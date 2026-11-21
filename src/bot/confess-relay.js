import { stopConfess } from "../features/confess/confess-chat.js";

// Sesi confess disimpan in-memory (hilang saat restart).
// Dipakai juga oleh features/confess/confess-chat.js via global.
global.confessChat ??= new Map();
global.pendingConfess ??= new Map();

const lookupKeys = (ctx) => [ctx.sender, ctx.sender.split("@")[0], ctx.jid];

export const isInConfessChat = (ctx) =>
  lookupKeys(ctx).some((k) => global.confessChat.has(k));

const getPartner = (ctx) =>
  lookupKeys(ctx).map((k) => global.confessChat.get(k)).find(Boolean);

/**
 * Teruskan pesan ke partner kalau user sedang dalam sesi confess chat.
 * @returns true kalau pesan sudah ditangani (tidak perlu diproses router)
 */
export const relayConfess = async (ctx) => {
  if (!isInConfessChat(ctx)) return false;
  const { sock, msg, text, messageType } = ctx;

  if (ctx.pesan === "/stop") {
    await stopConfess(sock, msg, ctx.sender);
    return true;
  }

  // Command tetap diproses router
  if (text.startsWith(".") || text.startsWith("/")) return false;

  const partnerJid = getPartner(ctx);
  console.log(`[Confess] Forwarding from ${ctx.sender} to ${partnerJid}`);

  try {
    if (messageType === "conversation" || messageType === "extendedTextMessage") {
      await sock.sendMessage(partnerJid, { text: `📩 *Pesan Confess:* ${text}` });
    } else {
      await sock.sendMessage(partnerJid, {
        forward: msg,
        contextInfo: {
          isForwarded: true,
          externalAdReply: {
            title: "Pesan Confess Anonim",
            body: "Sesi obrolan aktif",
            showAdAttribution: true,
          },
        },
      });
      if (text) {
        await sock.sendMessage(partnerJid, { text: `📩 *Caption Confess:* ${text}` });
      }
    }
    await ctx.react("📤");
    return true;
  } catch (err) {
    console.error("[Confess] Forwarding error:", err);
    await ctx.reply("❌ Gagal mengirim pesan ke partner. Pastikan chat masih aktif.");
    return false;
  }
};
