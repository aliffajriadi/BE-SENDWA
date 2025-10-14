import * as cheerio from "cheerio";
import axios from "axios";

//============================================================================================
// INSTAGRAM DOWNLOADER
async function instagramDl(url) {
  return new Promise(async (resolve, reject) => {
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
      reject(e);
    }
  });
}
// END

export const instagramDownloader = async (query, sock, msg, namaUser) => {
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
        text: `${namaUser}, link-nya gak bisa diambil nih 😅 coba pakai link lain.`,
      });
      return false;
    }

    // Pisahkan berdasarkan tipe konten
    const videoLink = results.find((r) =>
      r.title.toLowerCase().includes("video")
    )?.url;

    const imageLink = results.find((r) =>
      r.title.toLowerCase().includes("image")
    )?.url;

    if (!videoLink && !imageLink) {
      sock.sendMessage(msg.key.remoteJid, {
        text: `${namaUser}, kontennya gak ketemu 😅 coba pastiin link-nya benar.`,
      });
      return false;
    }

    await sock.sendMessage(msg.key.remoteJid, {
      text: `⏳ Tunggu sebentar ya ${namaUser}, lagi aku download...`,
    });

    // Jika ada video, kirim video dulu
    if (videoLink) {
      const response = await axios.get(videoLink, { responseType: "arraybuffer" });
      const videoBuffer = Buffer.from(response.data);

      if (videoBuffer.length > 16 * 1024 * 1024) {
        sock.sendMessage(msg.key.remoteJid, {
          text: "❌ Ukuran video terlalu besar (>16MB), tidak bisa dikirim.",
        });
        return false;
      } else {
        await sock.sendMessage(
          msg.key.remoteJid,
          {
            video: videoBuffer,
            mimetype: "video/mp4",
            caption: "✅ Berhasil download video dari Instagram.",
          },
          { quoted: msg }
        );
      }
      
    }

    // Jika ada gambar, kirim gambar juga
    if (imageLink) {
      const response = await axios.get(imageLink, { responseType: "arraybuffer" });
      const imageBuffer = Buffer.from(response.data);

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          image: imageBuffer,
          mimetype: "image/jpeg",
          caption: "✅ Berhasil download foto dari Instagram.",
        },
        { quoted: msg }
      );
    }
    return true;
  } catch (e) {
    console.error("Instagram Downloader Error:", e.message);
    await sock.sendMessage(msg.key.remoteJid, {
      text: `❌ Terjadi kesalahan saat download: ${e.message}`,
    });
    return false;
  }
};
