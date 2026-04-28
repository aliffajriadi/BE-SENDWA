import { configDotenv } from "dotenv";
configDotenv();

const BASE_URL = "https://short-link-polibatam.oke.aliffajriadi.my.id";
const API_KEY = process.env.API_KEY_SHORTLINKPOLIBATAM;

/**
 * Helper: panggil endpoint Polibatam shortlink API
 * Auth menggunakan query param ?api_key=
 */
async function callApi(method, path, body = null) {
  const separator = path.includes("?") ? "&" : "?";
  const url = `${BASE_URL}${path}${separator}api_key=${API_KEY}`;

  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/**
 * Main handler untuk command .short
 *
 * Sub-commands:
 *  .short                          → tampilkan bantuan
 *  .short status                   → cek status sesi login Polibatam
 *  .short list                     → list semua shortlink
 *  .short cari <code>              → detail satu shortlink by code
 *  .short buat <longUrl> [code]    → buat shortlink baru
 *  .short hapus <code>             → hapus shortlink by code (otomatis cari ID)
 */
export const shortPolibatamHandler = async (sock, msg, text) => {
  const kirimPesan = async (teks) => {
    await sock.sendMessage(msg.key.remoteJid, { text: teks }, { quoted: msg });
  };

  const kirimReaction = async (emoji) => {
    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: emoji, key: msg.key },
    });
  };

  // Pisahkan argumen: hapus prefix ".short" dan split
  const args = text.trim().split(/\s+/).slice(1); // args[0] = sub-command
  const sub = (args[0] || "").toLowerCase();

  // ─────────────────────────────────────────────
  // BANTUAN
  // ─────────────────────────────────────────────
  if (!sub || sub === "help" || sub === "bantuan") {
    return kirimPesan(
      `╔══✦ *🔗 POLIBATAM SHORT LINK* ✦══╗\n\n` +
        `📋 *Perintah Tersedia:*\n\n` +
        `🔹 *.short status*\n` +
        `   Cek status sesi login Polibatam\n\n` +
        `🔹 *.short list*\n` +
        `   Lihat semua shortlink milikmu\n\n` +
        `🔹 *.short cari <code>*\n` +
        `   Detail satu shortlink\n` +
        `   _Contoh: .short cari test123_\n\n` +
        `🔹 *.short buat <url> [code]*\n` +
        `   Buat shortlink baru\n` +
        `   _Contoh: .short buat https://github.com gitku_\n\n` +
        `🔹 *.short hapus <code>*\n` +
        `   Hapus shortlink berdasarkan code\n` +
        `   _Contoh: .short hapus gitku_\n\n` +
        `╚══════════════════╝`
    );
  }

  // ─────────────────────────────────────────────
  // STATUS SESI
  // ─────────────────────────────────────────────
  if (sub === "status") {
    await kirimReaction("🕒");
    const { ok, data } = await callApi("GET", "/api/status");
    if (!ok) {
      await kirimReaction("❌");
      return kirimPesan(
        `❌ Gagal cek status.\n${data?.message || JSON.stringify(data)}`
      );
    }
    await kirimReaction("✅");
    const icon = data?.authenticated ? "🟢" : "🔴";
    return kirimPesan(
      `╔══✦ *${icon} STATUS SESI* ✦══╗\n\n` +
        `📡 *Status:* ${data?.success ? "OK" : "Error"}\n` +
        `🔐 *Authenticated:* ${data?.authenticated ? "Ya ✅" : "Tidak ❌"}\n` +
        `💬 *Pesan:* ${data?.message || "-"}\n\n` +
        `╚══════════════════╝`
    );
  }

  // ─────────────────────────────────────────────
  // LIST SHORTLINK
  // ─────────────────────────────────────────────
  if (sub === "list") {
    await kirimReaction("🕒");
    const { ok, data } = await callApi("GET", "/api/shortlinks");
    if (!ok) {
      await kirimReaction("❌");
      return kirimPesan(
        `❌ Gagal ambil daftar shortlink.\n${data?.message || JSON.stringify(data)}`
      );
    }
    if (!data?.data || data.data.length === 0) {
      await kirimReaction("✅");
      return kirimPesan("📭 Belum ada shortlink yang tersimpan.");
    }

    const list = data.data
      .map(
        (l) =>
          `${l.no}. 🔗 *${l.shortCode}*\n` +
          `   📎 ${l.shortUrl}\n` +
          `   🌐 ${l.longUrl}\n` +
          `   👆 ${l.clicks} klik  |  🆔 ID: ${l.id}`
      )
      .join("\n\n");

    await kirimReaction("✅");
    return kirimPesan(
      `╔══✦ *🔗 POLIBATAM SHORTLINKS* (${data.count}) ✦══╗\n\n${list}\n\n╚══════════════════╝`
    );
  }

  // ─────────────────────────────────────────────
  // CARI SATU SHORTLINK BY CODE
  // ─────────────────────────────────────────────
  if (sub === "cari" || sub === "detail") {
    const code = args[1];
    if (!code) {
      return kirimPesan(
        `❌ Format salah!\n\n` +
          `Gunakan: *.short cari <code>*\n` +
          `Contoh: .short cari test123`
      );
    }

    await kirimReaction("🕒");
    const { ok, data } = await callApi("GET", `/api/shortlinks/${code}`);
    if (!ok) {
      await kirimReaction("❌");
      return kirimPesan(
        `❌ Shortlink *${code}* tidak ditemukan.\n${data?.message || JSON.stringify(data)}`
      );
    }

    const l = data?.data;
    await kirimReaction("✅");
    return kirimPesan(
      `╔══✦ *🔍 DETAIL SHORTLINK* ✦══╗\n\n` +
        `🔗 *Short Code:* ${l.shortCode}\n` +
        `📎 *Short URL:* ${l.shortUrl}\n` +
        `🌐 *Long URL:* ${l.longUrl}\n` +
        `👆 *Klik:* ${l.clicks}\n` +
        `🆔 *ID:* ${l.id}\n\n` +
        `╚══════════════════╝`
    );
  }

  // ─────────────────────────────────────────────
  // BUAT SHORTLINK BARU
  // ─────────────────────────────────────────────
  if (sub === "buat" || sub === "create") {
    const longUrl = args[1];
    const shortCode = args[2] || null;

    if (!longUrl) {
      return kirimPesan(
        `❌ Format salah!\n\n` +
          `Gunakan: *.short buat <url> [code]*\n` +
          `Contoh: .short buat https://github.com gitku`
      );
    }
    if (!longUrl.startsWith("https://") && !longUrl.startsWith("http://")) {
      return kirimPesan(
        `❌ URL harus dimulai dengan *https://* atau *http://*\n\nContoh: https://github.com`
      );
    }

    await kirimReaction("🕒");
    const body = { longUrl };
    if (shortCode) body.shortCode = shortCode;

    const { ok, data } = await callApi("POST", "/api/shortlinks", body);
    if (!ok) {
      await kirimReaction("❌");
      return kirimPesan(
        `❌ Gagal membuat shortlink.\n${data?.message || JSON.stringify(data)}`
      );
    }

    await kirimReaction("✅");
    return kirimPesan(
      `╔══✦ *✅ SHORTLINK BERHASIL DIBUAT* ✦══╗\n\n` +
        `📎 *Short URL:* ${data?.shortUrl}\n` +
        `🌐 *Tujuan:* ${longUrl}\n\n` +
        `╚══════════════════╝`
    );
  }

  // ─────────────────────────────────────────────
  // HAPUS SHORTLINK BY CODE
  // ─────────────────────────────────────────────
  if (sub === "hapus" || sub === "delete") {
    const code = args[1];
    if (!code) {
      return kirimPesan(
        `❌ Format salah!\n\n` +
          `Gunakan: *.short hapus <code>*\n` +
          `Contoh: .short hapus gitku`
      );
    }

    await kirimReaction("🕒");
    // Gunakan endpoint hapus by code — sistem otomatis cari ID
    const { ok, data } = await callApi(
      "DELETE",
      `/api/shortlinks/code/${code}`
    );
    if (!ok) {
      await kirimReaction("❌");
      return kirimPesan(
        `❌ Gagal hapus shortlink *${code}*.\n${data?.message || JSON.stringify(data)}`
      );
    }

    await kirimReaction("✅");
    const deleted = data?.deleted;
    return kirimPesan(
      `╔══✦ *🗑️ SHORTLINK DIHAPUS* ✦══╗\n\n` +
        `✅ ${data?.message || `Shortlink "${code}" berhasil dihapus.`}\n` +
        (deleted
          ? `\n🔗 *Code:* ${deleted.shortCode}\n` +
            `📎 *Short URL:* ${deleted.shortUrl}\n` +
            `🌐 *Long URL:* ${deleted.longUrl}\n` +
            `👆 *Klik:* ${deleted.clicks}\n`
          : "") +
        `\n╚══════════════════╝`
    );
  }

  // ─────────────────────────────────────────────
  // SUB-COMMAND TIDAK DIKENAL
  // ─────────────────────────────────────────────
  return kirimPesan(
    `❓ Perintah *.short ${sub}* tidak dikenal.\n\nKetik *.short* untuk melihat daftar perintah.`
  );
};
