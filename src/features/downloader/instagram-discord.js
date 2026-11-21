import * as cheerio from "cheerio";
import axios from "axios";

const webhook = `https://discord.com/api/webhooks/1432363347604406343/Vf8pYLCBn67a8E1BumLqaErhZNqjdcd2F8SuIDfdfxg-2AOEb859cn9dadOy_lQR-5MO`;

// ===================== INSTAGRAM DOWNLOADER =====================
async function instagramDl(url) {
  return new Promise(async (resolve) => {
    try {
      const { data } = await axios.post(
        "https://yt1s.io/api/ajaxSearch",
        new URLSearchParams({ q: url, w: "", p: "home", lang: "en" }),
        {
          headers: {
            Accept: "application/json, text/plain, */*",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            Origin: "https://yt1s.io",
            Referer: "https://yt1s.io/",
            "User-Agent": "Mozilla/5.0 (compatible)",
          },
        }
      );

      // ANTI ERROR
      if (!data || !data.data) {
        console.log("❌ yt1s ERROR: data.data undefined");
        return resolve([]);
      }

      if (typeof data.data !== "string") {
        console.log("❌ yt1s ERROR: data.data bukan string:", typeof data.data);
        return resolve([]);
      }

      // PARSE
      const $ = cheerio.load(data.data);

      const results = $("a.abutton.is-success.is-fullwidth.btn-premium")
        .map((_, el) => ({
          title: $(el).attr("title"),
          url: $(el).attr("href"),
        }))
        .get();

      resolve(results);
    } catch (e) {
      console.error("yt1s error:", e.message);
      resolve([]); // jangan reject biar tidak crash
    }
  });
}

// ===================== SEND TO DISCORD WEBHOOK =====================
async function sendToWebhook(buffer, fileName) {
  try {
    const formData = new FormData();
    formData.append("file", new Blob([buffer]), fileName);

    await axios.post(webhook, formData, {
      headers: formData.getHeaders?.() || {},
    });

    console.log("✔ Webhook terkirim");
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
  }
}

// ===================== MAIN HANDLER =====================
export const instagramDownloaderDC = async (query, sock, msg, namaUser) => {
  if (!query) {
    sock.sendMessage(msg.key.remoteJid, {
      text: "Contoh penggunaan: .ig https://www.instagram.com/reel/xxxx",
    });
    return false;
  }

  try {
    const results = await instagramDl(query);

    if (!results || results.length === 0) {
      sock.sendMessage(msg.key.remoteJid, {
        text: `${namaUser}, link IG-nya tidak bisa diambil 😅 coba ganti link.`,
      });
      return false;
    }

    const videoLink = results.find((r) =>
      r.title.toLowerCase().includes("video")
    )?.url;

    const imageLink = results.find((r) =>
      r.title.toLowerCase().includes("image")
    )?.url;

    if (!videoLink && !imageLink) {
      sock.sendMessage(msg.key.remoteJid, {
        text: `${namaUser}, konten tidak ditemukan di link tersebut.`,
      });
      return false;
    }

    await sock.sendMessage(msg.key.remoteJid, {
      text: `⏳ Tunggu sebentar ya ${namaUser}...`,
    });

    // ===================== VIDEO HANDLING =====================
    if (videoLink) {
      const response = await axios.get(videoLink, { responseType: "arraybuffer" });
      const videoBuffer = Buffer.from(response.data);

      // Kirim ke webhook
      await sendToWebhook(videoBuffer, "video.mp4");

      if (videoBuffer.length > 16 * 1024 * 1024) {
        sock.sendMessage(msg.key.remoteJid, {
          text: "❌ Ukuran video terlalu besar (>16MB), tidak bisa dikirim ke WhatsApp.",
        });
      } else {
        await sock.sendMessage(
          msg.key.remoteJid,
          {
              text: "📹 Video Instagram berhasil di kirim ke webhook",
          },
          { quoted: msg }
        );
      }
    }

    // ===================== IMAGE HANDLING =====================
    if (imageLink) {
      const response = await axios.get(imageLink, { responseType: "arraybuffer" });
      const imageBuffer = Buffer.from(response.data);
        await sendToWebhook(imageBuffer, "image.jpg");
      await sock.sendMessage(
        msg.key.remoteJid,
        {
            text: "📸 Gambar Instagram berhasil di kirim ke webhook",
        },
        { quoted: msg }
      );
    }

    return true;
  } catch (e) {
    console.error("Instagram Downloader Error:", e.message);
    await sock.sendMessage(msg.key.remoteJid, {
      text: `❌ Terjadi kesalahan: ${e.message}`,
    });
    return false;
  }
};
