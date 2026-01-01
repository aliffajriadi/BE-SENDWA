import axios from "axios";

export const sendLaporan = async (sock, msg, senderNumber, pesan) => {
  try {
    const jid = msg.key.remoteJid;
    const nohp = senderNumber.replace("@s.whatsapp.net", "");

    const args = pesan.trim().split(/\s+/);
    const periodeText = args[1];

    const periodeMap = {
      harian: 6,
      mingguan: 1,
      bulanan: 2,
      "3bulanan": 3,
      semesteran: 4,
      tahunan: 5,
    };

    const periode = periodeMap[periodeText];

    if (!periode) {
      return await sock.sendMessage(jid, {
        text: `❌ *Periode tidak valid*

Silakan pilih salah satu periode berikut:
• harian
• mingguan
• bulanan
• 3bulanan
• semesteran
• tahunan

📌 Cara penggunaan:
*/laporan <periode>*

Contoh:
*/laporan bulanan*`,
      });
    }

    await sock.sendMessage(jid, {
      text: "⏳ Mengambil laporan...",
    });

    // === SESUAI BACKEND res.download() ===
    const response = await axios.get(
      "https://api.aliffajriadi.my.id/smartpresence/api/laporan/laporan-profile-wa",
      {
        params: { nohp, periode },
        responseType: "arraybuffer",
        validateStatus: () => true, // BIAR TIDAK MASUK catch
      }
    );

    // Cek content-type
    const contentType = response.headers["content-type"];

    // Kalau backend kirim JSON (bukan PDF)
    if (!contentType?.includes("application/pdf")) {
      const errorJson = JSON.parse(Buffer.from(response.data).toString());

      return await sock.sendMessage(jid, {
        text: `❌ ${errorJson.message || "Laporan tidak tersedia"}`,
      });
    }

    // Kalau PDF → kirim ke WA
    await sock.sendMessage(jid, {
      document: Buffer.from(response.data),
      mimetype: "application/pdf",
      fileName: `laporan-${periodeText}.pdf`,
    });
    await sock.sendMessage(jid, {
      react: {
        text: "✅",
        key: msg.key,
      },
    });
  } catch (error) {
    console.error("LAPORAN ERROR:", error?.response?.data || error.message);

    await sock.sendMessage(msg.key.remoteJid, {
      text: "❌ Laporan tidak ditemukan atau gagal diambil",
    });
  }
};
