import { cekToken, consumeToken } from "../../services/user.service.js";

/**
 * Bungkus command berbayar token.
 *
 * 1. Pastikan user terdaftar & token cukup (kirim pesan kalau tidak)
 * 2. Jalankan fitur
 * 3. Potong token secara atomic
 *
 * @param {number} cost   jumlah token
 * @param {(ctx, profile) => Promise<any>} run
 * @param {object} opts
 * @param {"on-success"|"always"|"never"} opts.charge
 *   on-success: potong hanya kalau fitur return truthy
 *   always    : potong selama fitur tidak throw
 *   never     : hanya cek token, tidak dipotong
 */
export const paid =
  (cost, run, { charge = "on-success" } = {}) =>
  async (ctx) => {
    const user = await ctx.getProfile();
    if (!(await cekToken(user, ctx.sock, ctx.msg, cost))) return;

    const result = await run(ctx, user);

    const shouldCharge = charge === "always" || (charge === "on-success" && result);
    if (shouldCharge) await consumeToken(user.nomor, cost);
    return result;
  };

/** Tampilkan reaksi 🕒 → ✅ / ❌ di sekitar proses. */
export const withReaction = (run) => async (ctx, ...rest) => {
  await ctx.react("🕒");
  const result = await run(ctx, ...rest);
  await ctx.react(result === false ? "❌" : "✅");
  return result;
};

/** Ambil kata pertama dari args (misal: link). */
export const firstArg = (ctx) => ctx.args.split(/\s+/)[0] || undefined;
