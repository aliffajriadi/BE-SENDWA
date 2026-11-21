import { tokenManage } from "../../features/owner/token.js";
import { broadcast } from "../../features/owner/broadcast.js";
import { cekPeserta } from "../../features/owner/cek-peserta.js";
import { crudApiKeyBuisness } from "../../features/owner/api-key-bisnis.js";
import { shortlinkHandler } from "../../features/tools/shortlink.js";
import { shortPolibatamHandler } from "../../features/tools/short-polibatam.js";
import { storekuStats } from "../../features/tools/storeku.js";
import { withReaction } from "./helpers.js";

// Semua command di sini hanya bisa dipakai owner (dicek di router)
export default [
  {
    name: "token",
    match: ".token",
    owner: true,
    error: "Gagal mengubah token",
    run: (ctx) => tokenManage(ctx.sock, ctx.msg, ctx.sender, ctx.pesan),
  },
  {
    name: "broadcast",
    match: ".broadcast",
    owner: true,
    error: "Gagal kirim broadcast",
    run: (ctx) => broadcast(ctx.sock, ctx.msg, ctx.args),
  },
  {
    name: "cekpeserta",
    match: { exact: [".cekpeserta"] },
    owner: true,
    error: "Gagal cek peserta",
    run: (ctx) => cekPeserta(ctx.sock, ctx.msg),
  },
  {
    // API key disimpan lowercase, jadi tetap pakai teks lowercase
    name: "apikey",
    match: ".apikey",
    owner: true,
    error: "Gagal kelola API key",
    run: (ctx) => crudApiKeyBuisness(ctx.sock, ctx.msg, ctx.sender, ctx.pesan),
  },
  {
    name: "link",
    match: ".link",
    owner: true,
    error: "Terjadi kesalahan pada perintah .link",
    run: (ctx) => shortlinkHandler(ctx.sock, ctx.msg, ctx.text),
  },
  {
    name: "short",
    match: ".short",
    owner: true,
    error: "Terjadi kesalahan pada perintah .short",
    run: (ctx) => shortPolibatamHandler(ctx.sock, ctx.msg, ctx.text),
  },
  {
    name: "pg",
    match: ".pg",
    owner: true,
    error: "Gagal cek stats",
    run: withReaction((ctx) => storekuStats(ctx.sock, ctx.msg, ctx.pesan)),
  },
];
