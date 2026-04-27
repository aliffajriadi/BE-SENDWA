import { configDotenv } from "dotenv";
configDotenv();

const BASE_URL = `https://link.aliffajriadi.my.id`;
const API_KEY = process.env.API_KEY_SHORTLINK;

/**
 * Helper: panggil endpoint shortlink API
 */
async function callApi(method, path, body = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": API_KEY,
    },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/**
 * Format tanggal ke tampilan lokal
 */
function formatDate(str) {
  if (!str) return "-";
  const d = new Date(str);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Main handler untuk command .link
 *
 * Sub-commands:
 *  .link list                        → list semua link
 *  .link create <url> [slug]         → buat link baru
 *  .link edit <slug> <url> [newslug] → edit link
 *  .link hapus <slug>                → hapus link
 *  .link key list                    → list semua api key
 *  .link key buat <nama>             → buat api key baru
 *  .link key hapus <id>              → hapus api key
 *  .link (tanpa argumen)             → tampilkan bantuan
 */
export const shortlinkHandler = async (sock, msg, text) => {
  const kirimPesan = async (teks) => {
    await sock.sendMessage(msg.key.remoteJid, { text: teks }, { quoted: msg });
  };

  const kirimReaction = async (emoji) => {
    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: emoji, key: msg.key },
    });
  };

  // Pisahkan argumen: hapus prefix ".link" dan split
  const args = text.trim().split(/\s+/).slice(1); // args[0] = sub-command
  const sub = (args[0] || "").toLowerCase();

  // ─────────────────────────────────────────────
  // BANTUAN
  // ─────────────────────────────────────────────
  if (!sub || sub === "help" || sub === "bantuan") {
    return kirimPesan(
      `╔══✦ *🔗 SHORTLINK MANAGER* ✦══╗\n\n` +
        `📋 *Perintah Tersedia:*\n\n` +
        `🔹 *.link list*\n` +
        `   Lihat semua link yang ada\n\n` +
        `🔹 *.link create <url> [slug]*\n` +
        `   Buat link pendek baru\n` +
        `   _Contoh: .link create https://google.com gl_\n\n` +
        `🔹 *.link edit <slug> <url_baru> [slug_baru]*\n` +
        `   Edit link yang sudah ada\n` +
        `   _Contoh: .link edit gl https://new.com newgl_\n\n` +
        `🔹 *.link hapus <slug>*\n` +
        `   Hapus link\n` +
        `   _Contoh: .link hapus gl_\n\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `🔑 *Manajemen API Key:*\n\n` +
        `🔹 *.link key list*\n` +
        `   Lihat semua API key\n\n` +
        `🔹 *.link key buat <nama>*\n` +
        `   Buat API key baru\n` +
        `   _Contoh: .link key buat "Aplikasi Mobile"_\n\n` +
        `🔹 *.link key hapus <id>*\n` +
        `   Hapus API key berdasarkan ID\n` +
        `   _Contoh: .link key hapus 2_\n\n` +
        `╚══════════════════╝`
    );
  }

  // ─────────────────────────────────────────────
  // LIST LINK
  // ─────────────────────────────────────────────
  if (sub === "list") {
    await kirimReaction("🕒");
    const { ok, data } = await callApi("GET", "/links");
    if (!ok) {
      await kirimReaction("❌");
      return kirimPesan(`❌ Gagal ambil data link.\n${data?.message || ""}`);
    }
    if (!data || data.length === 0) {
      await kirimReaction("✅");
      return kirimPesan("📭 Belum ada link yang tersimpan.");
    }
    const list = data
      .map(
        (l, i) =>
          `${i + 1}. 🔗 */${l.slug}*\n` +
          `   ➜ ${l.url}\n` +
          `   👆 ${l.clicks} klik  •  🕐 ${formatDate(l.created_at)}`
      )
      .join("\n\n");
    await kirimReaction("✅");
    return kirimPesan(
      `╔══✦ *🔗 DAFTAR LINK* ✦══╗\n\n${list}\n\n╚══════════════════╝`
    );
  }

  // ─────────────────────────────────────────────
  // CREATE LINK
  // ─────────────────────────────────────────────
  if (sub === "create" || sub === "buat") {
    const url = args[1];
    const slug = args[2] || null;

    if (!url) {
      return kirimPesan(
        `❌ Format salah!\n\n` +
          `Gunakan: *.link create <url> [slug]*\n` +
          `Contoh: .link create https://google.com gl`
      );
    }
    if (!url.startsWith("https://")) {
      return kirimPesan(
        `❌ URL harus dimulai dengan *https://*\n\nContoh: https://google.com`
      );
    }

    await kirimReaction("🕒");
    const body = { url };
    if (slug) body.slug = slug;

    const { ok, data } = await callApi("POST", "/links", body);
    if (!ok) {
      await kirimReaction("❌");
      return kirimPesan(
        `❌ Gagal membuat link.\n${data?.message || JSON.stringify(data)}`
      );
    }
    await kirimReaction("✅");
    return kirimPesan(
      `╔══✦ *✅ LINK BERHASIL DIBUAT* ✦══╗\n\n` +
        `🔗 *Slug:* /${data.slug}\n` +
        `📎 *Short URL:* ${data.short_url}\n` +
        `🌐 *Tujuan:* ${data.url}\n\n` +
        `╚══════════════════╝`
    );
  }

  // ─────────────────────────────────────────────
  // EDIT LINK
  // ─────────────────────────────────────────────
  if (sub === "edit") {
    // .link edit <slug> <url_baru> [slug_baru]
    const slug = args[1];
    const newUrl = args[2];
    const newSlug = args[3] || null;

    if (!slug || !newUrl) {
      return kirimPesan(
        `❌ Format salah!\n\n` +
          `Gunakan: *.link edit <slug> <url_baru> [slug_baru]*\n` +
          `Contoh: .link edit gl https://new-url.com newgl`
      );
    }
    if (!newUrl.startsWith("https://")) {
      return kirimPesan(
        `❌ URL harus dimulai dengan *https://*\n\nContoh: https://new-url.com`
      );
    }

    await kirimReaction("🕒");
    const body = { url: newUrl };
    if (newSlug) body.new_slug = newSlug;

    const { ok, data } = await callApi("PUT", `/links/${slug}`, body);
    if (!ok) {
      await kirimReaction("❌");
      return kirimPesan(
        `❌ Gagal edit link /${slug}.\n${data?.message || JSON.stringify(data)}`
      );
    }
    await kirimReaction("✅");
    return kirimPesan(
      `╔══✦ *✏️ LINK BERHASIL DIUPDATE* ✦══╗\n\n` +
        `🔗 *Slug:* /${data.slug}\n` +
        `📎 *Short URL:* ${data.short_url}\n` +
        `🌐 *Tujuan:* ${data.url}\n\n` +
        `╚══════════════════╝`
    );
  }

  // ─────────────────────────────────────────────
  // HAPUS LINK
  // ─────────────────────────────────────────────
  if (sub === "hapus" || sub === "delete") {
    const slug = args[1];
    if (!slug) {
      return kirimPesan(
        `❌ Format salah!\n\n` +
          `Gunakan: *.link hapus <slug>*\n` +
          `Contoh: .link hapus gl`
      );
    }

    await kirimReaction("🕒");
    const { ok, data } = await callApi("DELETE", `/links/${slug}`);
    if (!ok) {
      await kirimReaction("❌");
      return kirimPesan(
        `❌ Gagal hapus link /${slug}.\n${data?.message || JSON.stringify(data)}`
      );
    }
    await kirimReaction("✅");
    return kirimPesan(
      `🗑️ *Link berhasil dihapus!*\n\n${data?.message || `Link /${slug} sudah dihapus.`}`
    );
  }

  // ─────────────────────────────────────────────
  // API KEY MANAGEMENT
  // ─────────────────────────────────────────────
  if (sub === "key") {
    const keyAction = (args[1] || "").toLowerCase();

    // .link key list
    if (keyAction === "list") {
      await kirimReaction("🕒");
      const { ok, data } = await callApi("GET", "/keys");
      if (!ok) {
        await kirimReaction("❌");
        return kirimPesan(
          `❌ Gagal ambil data API key.\n${data?.message || ""}`
        );
      }
      if (!data || data.length === 0) {
        await kirimReaction("✅");
        return kirimPesan("📭 Belum ada API key yang tersimpan.");
      }
      const list = data
        .map(
          (k) =>
            `🔑 *[${k.id}] ${k.name}*\n` +
            `   \`${k.key}\`\n` +
            `   🕐 ${formatDate(k.created_at)}`
        )
        .join("\n\n");
      await kirimReaction("✅");
      return kirimPesan(
        `╔══✦ *🔑 DAFTAR API KEY* ✦══╗\n\n${list}\n\n╚══════════════════╝`
      );
    }

    // .link key buat <nama>
    if (keyAction === "buat" || keyAction === "create") {
      // Nama bisa mengandung spasi: ambil semua setelah args[1]
      const nama = args.slice(2).join(" ");
      if (!nama) {
        return kirimPesan(
          `❌ Format salah!\n\n` +
            `Gunakan: *.link key buat <nama>*\n` +
            `Contoh: .link key buat Aplikasi Mobile`
        );
      }
      await kirimReaction("🕒");
      const { ok, data } = await callApi("POST", "/keys", { name: nama });
      if (!ok) {
        await kirimReaction("❌");
        return kirimPesan(
          `❌ Gagal membuat API key.\n${data?.message || JSON.stringify(data)}`
        );
      }
      await kirimReaction("✅");
      return kirimPesan(
        `╔══✦ *✅ API KEY BERHASIL DIBUAT* ✦══╗\n\n` +
          `📛 *Nama:* ${data.name}\n` +
          `🔑 *Key:* \`${data.key}\`\n\n` +
          `⚠️ _Simpan key ini, tidak bisa ditampilkan lagi!_\n\n` +
          `╚══════════════════╝`
      );
    }

    // .link key hapus <id>
    if (keyAction === "hapus" || keyAction === "delete") {
      const id = args[2];
      if (!id) {
        return kirimPesan(
          `❌ Format salah!\n\n` +
            `Gunakan: *.link key hapus <id>*\n` +
            `Contoh: .link key hapus 2`
        );
      }
      await kirimReaction("🕒");
      const { ok, data } = await callApi("DELETE", `/keys/${id}`);
      if (!ok) {
        await kirimReaction("❌");
        return kirimPesan(
          `❌ Gagal hapus API key ID ${id}.\n${data?.message || JSON.stringify(data)}`
        );
      }
      await kirimReaction("✅");
      return kirimPesan(
        `🗑️ *API Key berhasil dicabut!*\n\n${data?.message || `Key ID ${id} sudah dihapus.`}`
      );
    }

    // Tidak ada sub-sub command yang cocok
    return kirimPesan(
      `❓ Sub-command *key ${keyAction}* tidak dikenal.\n\n` +
        `Perintah yang tersedia:\n` +
        `• *.link key list*\n` +
        `• *.link key buat <nama>*\n` +
        `• *.link key hapus <id>*`
    );
  }

  // ─────────────────────────────────────────────
  // SUB-COMMAND TIDAK DIKENAL
  // ─────────────────────────────────────────────
  return kirimPesan(
    `❓ Perintah *${sub}* tidak dikenal.\n\nKetik *.link* untuk melihat daftar perintah.`
  );
};