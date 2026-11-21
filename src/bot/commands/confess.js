import { confessHandler } from "../../features/confess/pesan-confess.js";
import {
  confessChatHandler,
  terimaConfess,
  tolakConfess,
  stopConfess,
} from "../../features/confess/confess-chat.js";
import { paid } from "./helpers.js";

export default [
  {
    // Kirim pesan anonim satu arah
    name: "pesanconfess",
    match: ".pesanconfess",
    error: "Gagal kirim pesan confess",
    run: paid(1, (ctx) => confessHandler(ctx.sock, ctx.msg, ctx.text)),
  },
  {
    // Ajak chat anonim dua arah
    name: "confess",
    match: ".confess",
    error: "Gagal confess chat",
    run: paid(5, (ctx) => confessChatHandler(ctx.sock, ctx.msg, ctx.text, ctx.sender)),
  },
  {
    name: "confess-terima",
    match: { exact: ["/terima"] },
    run: (ctx) => terimaConfess(ctx.sock, ctx.msg, ctx.sender),
  },
  {
    name: "confess-tolak",
    match: { exact: ["/tolak"] },
    run: (ctx) => tolakConfess(ctx.sock, ctx.msg, ctx.sender),
  },
  {
    name: "confess-stop",
    match: { exact: ["/stop"] },
    run: (ctx) => stopConfess(ctx.sock, ctx.msg, ctx.sender),
  },
];
