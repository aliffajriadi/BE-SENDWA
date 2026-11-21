import { tutorTopUp } from "../../features/payment/tutor-top-up.js";
import { bayar } from "../../features/payment/bayar.js";

export default [
  {
    name: "topup",
    match: ".topup",
    error: "Gagal kirim tutor top up",
    run: (ctx) => tutorTopUp(ctx.sock, ctx.msg, ctx.sender),
  },
  {
    name: "beli",
    match: ".beli",
    error: "Gagal beli",
    run: (ctx) => bayar(ctx.sock, ctx.sender, ctx.pesan),
  },
];
