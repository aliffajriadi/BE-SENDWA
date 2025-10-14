import axios from "axios";

const tiktokApi = {
  download: async (url) => {
    try {
      const { data } = await axios.get(
        `https://tikwm.com/api?url=${encodeURIComponent(url)}`
      );
      if (!data || data.code !== 0 || !data.data) return null;

      const d = data.data;

      return {
        type: d.images && d.images.length > 0 ? "image" : "video",
        video: d.play,
        audio: d.music,
        images: d.images || [],
        thumbnail: d.cover,
        description: d.title || "-",
        username: d.author?.nickname || "-",
      };
    } catch (err) {
      console.error("API Tikwm error:", err.message);
      return null;
    }
  },
};

export const tiktokDownloader = async (query, sock, msg, namaUser) => {
  if (!query){
    sock.sendMessage(msg.key.remoteJid, {
      text: "Contoh penggunaan: .tiktok https://vt.tiktok.com/xxxx",
    });
    return false;
  }

  try {
    const data = await tiktokApi.download(query);
    if (!data) throw new Error("Gagal mengambil data TikTok.");

    await sock.sendMessage(msg.key.remoteJid, {
      text: `📥 Sedang memproses konten TikTok kamu, sabar ya ${namaUser} 😘 ...`,
    });

    // === CASE 1: VIDEO ===
    if (data.type === "video" && data.video) {
      const res = await axios.get(data.video, { responseType: "arraybuffer" });
      const videoBuffer = Buffer.from(res.data);

      if (videoBuffer.length > 16 * 1024 * 1024){
        sock.sendMessage(msg.key.remoteJid, {
          text: "❌ Ukuran video terlalu besar (>16MB).",
        });
        return false;
      }

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          video: videoBuffer,
          mimetype: "video/mp4",
          caption: `✅ Berhasil download!\n👤 ${data.username}\n📝 ${data.description}`,
        },
        { quoted: msg }
      );
      return true;
    }

    // === CASE 2: PHOTO MODE ===
    if (data.type === "image" && data.images.length > 0) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `🖼️ Post ini adalah *Photo Mode*, mengirim ${data.images.length} gambar...`,
      });

      for (const img of data.images) {
        const res = await axios.get(img, { responseType: "arraybuffer" });
        const imgBuffer = Buffer.from(res.data);

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            image: imgBuffer,
          },
          { quoted: msg }
        );
      }
      await sock.sendMessage(msg.key.remoteJid, {
          text: `📝 ${data.description}\n👤 ${data.username}\n Download music: ${data.audio}`,
        });
      return true;
    }

    throw new Error("Konten tidak dikenali.");
  } catch (err) {
    console.error("Error TikTok Downloader:", err);
    await sock.sendMessage(msg.key.remoteJid, {
      text: "⚠️ Gagal mengambil data TikTok. Coba lagi atau kirim link lain.",
    });
    return false;
  }
};
