import { createStiker } from "../../features/media/stiker.js";
import { removebgHandler } from "../../features/media/removebg.js";
import { upscaleHandler } from "../../features/media/hd-foto.js";
import { bratvidHandler } from "../../features/media/brat.js";
import { qrcodeHandler } from "../../features/media/qrcode.js";
import { sertifikatCintaHandler } from "../../features/media/sertifikat-cinta.js";
import { robloxStalk } from "../../features/tools/roblox-stalk.js";
import { paid, withReaction } from "./helpers.js";

export default [
  // ── Fitur gambar (kirim foto dengan caption) ───────────────────
  {
    name: "stiker",
    match: { caption: ".stiker" },
    error: "Gagal buat stiker",
    run: paid(1, (ctx) => createStiker(ctx.sock, ctx.msg), { charge: "always" }),
  },
  {
    name: "removebg",
    match: { caption: ".removebg" },
    error: "RemoveBG Error",
    run: paid(3, (ctx) => removebgHandler(ctx.sock, ctx.msg), { charge: "always" }),
  },
  {
    name: "hd",
    match: { caption: ".hd" },
    error: "Gagal membuat foto HD",
    run: paid(1, (ctx) => upscaleHandler(ctx.sock, ctx.msg)),
  },
  {
    name: "ghibli",
    match: (ctx) => ctx.caption === ".ghibli" || ctx.pesan === ".ghibli",
    run: (ctx) => ctx.reply("Fitur ini sedang tahap Maintenance"),
  },

  // ── Petunjuk kalau dikirim tanpa gambar ────────────────────────
  {
    name: "stiker-hint",
    match: { exact: [".stiker"] },
    run: (ctx) => ctx.reply("Kirim gambar dengan caption .stiker"),
  },
  {
    name: "removebg-hint",
    match: { exact: [".removebg"] },
    run: (ctx) => ctx.reply("Kirim gambar dengan caption .removebg"),
  },

  // ── Fitur teks ─────────────────────────────────────────────────
  {
    name: "brat",
    match: ".brat",
    error: "Gagal membuat stiker brat",
    run: paid(1, withReaction((ctx) => bratvidHandler(ctx.sock, ctx.msg, ctx.args))),
  },
  {
    name: "qrcode",
    match: ".qrcode",
    error: "Gagal membuat QR Code",
    run: paid(1, (ctx) => qrcodeHandler(ctx.sock, ctx.msg, ctx.args)),
  },
  {
    name: "sertifikat",
    match: ".sertifikat",
    error: "Gagal membuat sertifikat",
    run: paid(1, (ctx) => sertifikatCintaHandler(ctx.sock, ctx.msg, ctx.text), {
      charge: "always",
    }),
  },
  {
    name: "cekroblok",
    match: ".cekroblok",
    error: "Gagal cek akun Roblox",
    run: paid(2, (ctx) => robloxStalk(ctx.sock, ctx.msg, ctx.args, ".")),
  },
];
