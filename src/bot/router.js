import { commands } from "./commands/index.js";

const NOT_OWNER = "Anda bukan owner, lappet jangan aneh aneh kau";

/**
 * Cek apakah command cocok dengan pesan.
 * Mengembalikan prefix yang cocok (string), true untuk matcher fungsi, atau false.
 *
 * Bentuk `match`:
 *  - string / string[] : cocok kalau pesan diawali prefix tersebut
 *  - { exact: [...] }  : cocok kalau pesan sama persis
 *  - { caption: "..." }: cocok kalau gambar dengan caption tersebut
 *  - (ctx) => boolean  : matcher custom
 */
const matchCommand = (cmd, ctx) => {
  const { match } = cmd;
  if (typeof match === "function") return match(ctx);
  if (match.exact) return match.exact.includes(ctx.pesan) && ctx.pesan;
  if (match.caption) return ctx.hasImage && ctx.caption === match.caption && match.caption;
  const prefixes = Array.isArray(match) ? match : [match];
  return prefixes.find((p) => ctx.pesan.startsWith(p)) ?? false;
};

/** Jalankan command pertama yang cocok. */
export const route = async (ctx) => {
  for (const cmd of commands) {
    const matched = matchCommand(cmd, ctx);
    if (!matched) continue;

    // args = teks setelah command, dengan case asli
    ctx.args = typeof matched === "string" ? ctx.text.slice(matched.length).trim() : ctx.text;

    if (cmd.owner && !ctx.isOwner) return ctx.reply(NOT_OWNER);

    try {
      await cmd.run(ctx);
    } catch (error) {
      console.error(`[Command ${cmd.name}] Error:`, error);
      await ctx.react("❌").catch(() => {});
      await ctx.reply(`❌ ${cmd.error ?? "Terjadi kesalahan"}\n${error.message ?? error}`);
    }
    return;
  }
};
