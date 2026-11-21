import { cekDeadline } from "../../features/learning/cek-deadline.js";
import { sendLaporan } from "../../features/learning/send-laporan.js";
import { withReaction } from "./helpers.js";

const HELP_TEXT =
  `📚 *Fitur Learning*\n` +
  `────────────────────\n\n` +
  `🔍 *Perintah yang tersedia:*\n\n` +
  `📅 */cek <hari>*\n` +
  `Cek deadline dalam beberapa hari ke depan\n\n` +
  `🗓️ */today*\n` +
  `Cek deadline hari ini\n\n` +
  `📆 */week*\n` +
  `Cek deadline dalam 1 minggu\n\n` +
  `────────────────────\n` +
  `Ketik salah satu perintah di atas ya 👍`;

const deadline = (hari) => withReaction((ctx) => cekDeadline(ctx.sock, ctx.msg, hari));

export default [
  {
    name: "laporan",
    match: "/laporan",
    error: "Gagal kirim laporan",
    run: (ctx) => sendLaporan(ctx.sock, ctx.msg, ctx.sender, ctx.pesan),
  },
  {
    name: "cek-deadline",
    match: "/cek",
    error: "Gagal cek deadline",
    run: async (ctx) => {
      const hari = ctx.args.split(/\s+/)[0];
      if (!hari) {
        await ctx.reply("Masukkan hari yang ingin dicek\nContoh: /cek 6");
        return ctx.react("❌");
      }
      return deadline(hari)(ctx);
    },
  },
  {
    name: "today",
    match: "/today",
    error: "Gagal cek deadline",
    run: deadline("1"),
  },
  {
    name: "week",
    match: "/week",
    error: "Gagal cek deadline",
    run: deadline("7"),
  },
  {
    name: "learning-help",
    match: ["/help", "/menu"],
    run: async (ctx) => {
      await ctx.reply(HELP_TEXT);
      await ctx.react("✅");
    },
  },
];
