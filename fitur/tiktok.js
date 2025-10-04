import axios from "axios";

//===================================================================
    // TIKTOK - diletakkan di atas semua handler
    const tiktokApi = {
      download: async (url) => {
        try {
          const { data } = await axios.get(
            `https://tikwm.com/api?url=${encodeURIComponent(url)}`
          );
          if (!data || !data.data || !data.data.play) return null;

          return {
            video: data.data.play,
            audio: data.data.music,
            thumbnail: data.data.cover,
            description: data.data.title,
            username: data.data.author.nickname,
          };
        } catch (err) {
          console.error("API Tikwm error:", err.message);
          return null;
        }
      },
    };

    //===================================================================

export const tiktokDownloader = async (query, sock, msg, namaUser ) => {
    if (!query) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: "Contoh penggunaan: .tiktok https://vt.tiktok.com/xxxx",
        });
      }

      try {
        const data = await tiktokApi.download(query);

        if (!data || !data.video) {
          throw new Error("Tidak bisa mengambil video.");
        }

        await sock.sendMessage(msg.key.remoteJid, {
          text: `Lagi download video-nya, sabar ya ${namaUser} 😘 ...`,
        });

        const response = await axios.get(data.video, {
          responseType: "arraybuffer",
        });

        const videoBuffer = Buffer.from(response.data);
        if (videoBuffer.length > 16 * 1024 * 1024) {
          return sock.sendMessage(msg.key.remoteJid, {
            text: "Ukuran video terlalu besar (>16MB). Gagal dikirim.",
          });
        }
       

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            video: videoBuffer,
            mimetype: "video/mp4",
            caption: `✅ Berhasil download!\n\n👤 ${data.username || "-"}\n📝 ${
              data.description || "-"
            }`,
          },
          { quoted: msg }
        );
      } catch (err) {
        throw err;
      }
}