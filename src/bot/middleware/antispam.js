import { simpleReplies } from "../../utils/messages.js";
import { isInConfessChat } from "../confess-relay.js";

const limits = new Map();
const CLEANUP_AFTER = 10 * 60_000;

/** Tentukan tipe command & cooldown-nya (ms). */
const classify = (ctx) => {
  const { pesan } = ctx;
  if (/^(\.confess|\/terima|\/tolak|\/stop)/.test(pesan)) return ["confess", 500];
  if (simpleReplies[pesan]) return ["reply", 0];
  if (/^\.(tiktok|tt|ig|instagram)/.test(pesan)) return ["download", 3000];
  if (pesan.startsWith(".")) return ["command", 1500];
  if (isInConfessChat(ctx)) return ["confess_chat", 800];
  return ["normal", 1500];
};

/**
 * Anti-spam per user per tipe command.
 * @returns true kalau pesan harus diblok
 */
export const isSpam = async (ctx) => {
  const now = Date.now();
  const [commandType, cooldown] = classify(ctx);
  const user = limits.get(ctx.sender) ?? { lastCommand: null, lastTime: 0, count: 0 };

  if (user.lastCommand === commandType && user.lastTime > 0) {
    if (now - user.lastTime < cooldown) {
      user.count += 1;
      if (user.count >= 2) {
        await ctx.sock.sendMessage(ctx.sender, {
          text: `⚠️ Tunggu ${Math.ceil(cooldown / 1000)} detik sebelum mengirim ${commandType === "download" ? "command download" : "pesan"} lagi.`,
        });
        return true;
      }
    } else {
      user.count = 0;
    }
  }

  user.lastCommand = commandType;
  user.lastTime = now;
  limits.set(ctx.sender, user);

  // Bersihkan user yang sudah lama tidak aktif supaya Map tidak terus membesar
  if (limits.size > 1000) {
    for (const [k, v] of limits) {
      if (now - v.lastTime > CLEANUP_AFTER) limits.delete(k);
    }
  }
  return false;
};
