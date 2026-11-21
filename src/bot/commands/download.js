import { tiktokDownloader } from "../../features/downloader/tiktok.js";
import { instagramDownloader } from "../../features/downloader/instagram.js";
import { instagramDownloaderDC } from "../../features/downloader/instagram-discord.js";
import { paid, withReaction, firstArg } from "./helpers.js";

export default [
  {
    name: "tiktok",
    match: [".tiktok", ".tt"],
    error: "Gagal download video TikTok. Pastikan link valid dan coba lagi.",
    run: paid(
      1,
      withReaction((ctx, user) => tiktokDownloader(firstArg(ctx), ctx.sock, ctx.msg, user.nama)),
    ),
  },
  {
    name: "instagram",
    match: [".instagram", ".ig"],
    error: "Gagal mengambil video dari Instagram. Coba lagi nanti.",
    run: paid(
      1,
      withReaction((ctx, user) => instagramDownloader(firstArg(ctx), ctx.sock, ctx.msg, user.nama)),
    ),
  },
  {
    // Download Instagram untuk channel meme Discord (tidak memotong token)
    name: "instagram-discord",
    match: ".dcig",
    error: "Gagal mengambil video dari Instagram. Coba lagi nanti.",
    run: paid(
      1,
      (ctx, user) => instagramDownloaderDC(firstArg(ctx), ctx.sock, ctx.msg, user.nama),
      { charge: "never" },
    ),
  },
];
