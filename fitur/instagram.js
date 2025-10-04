import cheerio from "cherio/lib/cheerio.js";
import axios from "axios";

//============================================================================================
    //INSTAGRAM DOWNLOADER
    async function instagramDl(url) {
      return new Promise(async (resolve, reject) => {
        try {
          const { data } = await axios.post(
            "https://yt1s.io/api/ajaxSearch",
            new URLSearchParams({ q: url, w: "", p: "home", lang: "en" }),
            {
              headers: {
                Accept: "application/json, text/plain, */*",
                "Content-Type":
                  "application/x-www-form-urlencoded; charset=UTF-8",
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
    //END


 export const instagramDownloader = async (query, sock, msg, namaUser ) => {
     if (!query) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: "Contoh penggunaan: .ig https://www.instagram.com/reel/xxxx",
        });
      }

      try {
        const results = await instagramDl(query);

        // Cari link yang mengandung mp4 (video)
        const videoLink = results.find((r) =>
          r.title.toLowerCase().includes("video")
        )?.url;

        if (!videoLink) {
          return sock.sendMessage(msg.key.remoteJid, {
            text: `${namaUser}, vidio nya ga ketemu nih kyak ny kamu salah link deh ....`,
          });
        }

        await sock.sendMessage(msg.key.remoteJid, {
          text: `sabar ya ${namaUser} 😘 ........`,
        });

        const response = await axios.get(videoLink, {
          responseType: "arraybuffer",
        });
        const videoBuffer = Buffer.from(response.data);

        // WhatsApp maksimal file 16MB
        if (videoBuffer.length > 16 * 1024 * 1024) {
          return sock.sendMessage(msg.key.remoteJid, {
            text: "❌ Ukuran video terlalu besar (>16MB), tidak bisa dikirim.",
          });
        }
        await sock.sendMessage(
          msg.key.remoteJid,
          {
            video: videoBuffer,
            mimetype: "video/mp4",
            caption: "✅ Berhasil download video dari Instagram.",
          },
          { quoted: msg }
        );
      } catch (e) {
        throw e;
      }
 }