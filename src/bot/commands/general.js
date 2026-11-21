import { kataKotor, simpleReplies, menu, daftar } from "../../utils/messages.js";
import { daftarFunc } from "../../features/account/daftar.js";
import { daftarHosting } from "../../features/account/daftar-hosting.js";
import { cekServer } from "../../features/tools/cek-server.js";
import { sendPesan } from "../../features/integrations/discord.js";
import { withReaction } from "./helpers.js";

// Pesan dari grup ini diteruskan ke Discord sebagai pengumuman
const ANNOUNCE_GROUP = "120363405146206045@g.us";

const profileText = (p) => `╔══✦ *👤 PROFIL* ✦══╗

✨ *Nama*       : ${p.nama}
📞 *Nomor*      : ${p.nomor}
💎 *Sisa Token* : ${p.token}

${
  p.token <= 0
    ? `⚠️ _Token kamu sudah *habis*_ 😢\n📩 Beli Token dengan perintah *.beli token*`
    : `💡 Token kamu aktif!
Token digunakan untuk mengakses fitur-fitur bot seperti download, stiker, dan lainnya.
Semakin banyak token = semakin banyak fitur yang bisa kamu pakai!

ketik *.beli* untuk beli token
`
}

╚══════════════╝`;

export default [
  {
    name: "filter-kata-kotor",
    match: (ctx) => kataKotor.some((kata) => ctx.pesan.includes(kata)),
    run: (ctx) => ctx.reply("sopan dikit boss"),
  },
  {
    name: "simple-reply",
    match: (ctx) => !!simpleReplies[ctx.pesan],
    run: (ctx) => ctx.sock.sendMessage(ctx.sender, { text: simpleReplies[ctx.pesan] }),
  },
  {
    name: "announce-discord",
    match: (ctx) => ctx.sender === ANNOUNCE_GROUP,
    run: (ctx) => sendPesan(ctx.text),
  },
  {
    name: "daftar",
    match: ".daftar",
    error: "Gagal mendaftar. Silahkan Gunakan Nama Lain dan Coba Lagi.",
    run: withReaction((ctx) =>
      daftarFunc(ctx.text.split(" "), ctx.sock, ctx.msg, ctx.sender),
    ),
  },
  {
    name: "server",
    match: { exact: [".server"] },
    error: "Terjadi kesalahan saat mengambil informasi server. Coba lagi nanti.",
    run: (ctx) => cekServer(ctx.sock, ctx.msg),
  },
  {
    name: "me",
    match: { exact: [".me"] },
    run: async (ctx) => {
      const p = await ctx.getProfile();
      if (!p) return ctx.send({ text: daftar });
      await ctx.react("✨");
      await ctx.send({ text: profileText(p) });
    },
  },
  {
    name: "menu",
    match: { exact: [".menu"] },
    run: withReaction((ctx) => ctx.reply(menu)),
  },
  {
    name: "free",
    match: ".free",
    error: "Gagal Daftar",
    run: async (ctx) => {
      const p = await ctx.getProfile();
      if (!p) return ctx.send({ text: daftar });
      if (p.free_event === false) {
        return ctx.send({ text: `Maaf ${p.nama}, Kamu hanya bisa claim 1x` });
      }
      return withReaction(() => daftarHosting(ctx.sock, ctx.msg, p))(ctx);
    },
  },
];
