import { jidNormalizedUser } from "@whiskeysockets/baileys";
import { extractText, stripJid } from "../utils/whatsapp.js";
import { profile } from "../services/user.service.js";
import { NomorOwner } from "../utils/messages.js";

/**
 * Cari nomor asli pengirim. Baileys v6 kadang memberi LID, jadi
 * prioritaskan senderPn → remoteJidAlt → mapping LID.
 */
export const resolveSender = async (sock, key) => {
  let sender = jidNormalizedUser(key.remoteJid);

  if (key.senderPn) {
    sender = jidNormalizedUser(key.senderPn);
  } else if (key.remoteJidAlt?.endsWith("@s.whatsapp.net")) {
    sender = jidNormalizedUser(key.remoteJidAlt);
  } else if (sender.endsWith("@lid")) {
    try {
      const pn = await sock.signalRepository?.lidMapping?.getPNForLID(sender);
      if (pn) sender = jidNormalizedUser(pn);
    } catch (e) {
      console.error("Gagal mapping LID ke PN:", e.message);
    }
  }
  return sender;
};

/**
 * Bangun context yang dipakai semua command.
 *
 * - `text`  : teks asli (case dipertahankan)
 * - `pesan` : teks lowercase, dipakai untuk mencocokkan command
 * - `args`  : teks setelah command, case asli (diisi oleh router)
 */
export const buildContext = async (sock, msg) => {
  const m = msg.message;
  const { type, text } = extractText(m);
  const sender = await resolveSender(sock, msg.key);
  const jid = msg.key.remoteJid;

  let cachedProfile;

  return {
    sock,
    msg,
    m,
    jid,
    sender,
    nomor: stripJid(sender),
    messageType: type,
    text,
    pesan: text.toLowerCase(),
    args: "",
    isOwner: stripJid(sender) === NomorOwner,
    caption: (m.imageMessage?.caption || "").toLowerCase().trim(),
    hasImage: !!m.imageMessage,

    reply: (pesan) => sock.sendMessage(jid, { text: pesan }, { quoted: msg }),
    send: (content) => sock.sendMessage(jid, content),
    react: (emoji) => sock.sendMessage(jid, { react: { text: emoji, key: msg.key } }),

    /** Profil user dari DB (di-cache per pesan). */
    async getProfile() {
      if (cachedProfile === undefined) cachedProfile = await profile(this.nomor);
      return cachedProfile;
    },
  };
};
