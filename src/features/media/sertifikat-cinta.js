import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Jika kamu punya font handwriting (.ttf), aktifkan baris ini:
// registerFont(path.join(__dirname, "GreatVibes-Regular.ttf"), { family: "GreatVibes" });

/**
 * 🎨 Membuat tanda tangan bergaya tulisan tangan.
 */
function createSignatureCanvas(name = "Direktur Patah Hati", options = {}) {
  const w = options.width || 420;
  const h = options.height || 140;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.translate(20, 20);

  // Pilih font handwriting
  const fontChoices = [
    "'GreatVibes'",
    "'Brush Script MT'",
    "'Lucida Handwriting'",
    "cursive"
  ].join(", ");

  // ✍️ Nama tanda tangan
  ctx.fillStyle = "#1b1b1b";
  ctx.font = `italic 48px ${fontChoices}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  ctx.save();
  ctx.translate(10, h / 2 - 10);
  ctx.rotate(-0.06);
  ctx.fillText(name, 0, 0);
  ctx.restore();

  // 🌊 Garis flourish di bawah tanda tangan
  ctx.strokeStyle = "rgba(27,27,27,0.85)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(10, h / 2 + 28);
  ctx.bezierCurveTo(90, h / 2 + 36, 190, h / 2 + 12, 280, h / 2 + 32);
  ctx.bezierCurveTo(320, h / 2 + 40, 360, h / 2 + 28, 390, h / 2 + 30);
  ctx.stroke();

  // Efek tinta lembut
  ctx.fillStyle = "rgba(27,27,27,0.08)";
  ctx.beginPath();
  ctx.ellipse(300, h / 2 + 32, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // 🪶 Jabatan kecil
  ctx.fillStyle = "rgba(27,27,27,0.8)";
  ctx.font = `16px ${fontChoices}`;
  ctx.fillText("Direktur Patah Hati Nasional 💔", 10, h - 18);

  ctx.restore();
  return canvas;
}

/**
 * 💌 Handler utama untuk membuat Sertifikat Cinta Palsu.
 */
export const sertifikatCintaHandler = async (sock, msg, pesan) => {
  try {
    const nama = pesan.split(" ").slice(1).join(" ") || msg.pushName || "Kamu";
    const alasan = pick([
      "karena terlalu tampan hingga memicu pemanasan global 🌍🔥",
      "karena senyumnya bikin resah warga +62 😳",
      "karena cinta palsunya berhasil menyakiti banyak hati 💔",
      "karena telah membuat 7 dari 10 orang gagal move on 😭",
      "karena berhasil ghosting dengan cara elegan 🕵️‍♂️",
      "karena cintanya cuma lewat status WhatsApp 💬",
      "karena skill PHP-nya (Pemberi Harapan Palsu) luar biasa 😆",
    ]);

    const width = 1000;
    const height = 700;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // 🌸 Background gradien lembut
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#ffe2e2");
    gradient.addColorStop(1, "#ffc1cc");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 💎 Frame emas lembut
    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth = 10;
    ctx.strokeRect(50, 50, width - 100, height - 100);

    // 💖 Judul utama
    ctx.fillStyle = "#b30059";
    ctx.font = "bold 50px Sans";
    ctx.textAlign = "center";
    ctx.fillText("💖 SERTIFIKAT CINTA PALSU 💖", width / 2, 150);

    // 🌷 Garis pemisah elegan
    ctx.strokeStyle = "#b30059";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 200, 170);
    ctx.lineTo(width / 2 + 200, 170);
    ctx.stroke();

    // 👤 Nama penerima
    ctx.fillStyle = "#222";
    ctx.font = "22px Sans";
    ctx.fillText("Diberikan kepada:", width / 2, 250);

    ctx.fillStyle = "#000";
    ctx.font = "bold 42px Sans";
    ctx.fillText(`${nama}`, width / 2, 310);

    // ✨ Kalimat penghargaan
    ctx.fillStyle = "#333";
    ctx.font = "22px Sans";
    ctx.fillText("Sebagai penghargaan tertinggi", width / 2, 370);
    ctx.fillText(`karena ${alasan}`, width / 2, 410);

    ctx.fillText("💌", width / 2, 470);

    // 📅 Informasi bawah
    ctx.font = "18px Sans";
    ctx.fillStyle = "#444";
    ctx.fillText("Dikeluarkan oleh:", width / 2, 520);
    ctx.fillText("✨ Dinas Cinta Palsu Internasional ✨", width / 2, 550);
    ctx.fillText(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, width / 2, 580);

    // 🖋️ Tanda tangan
    const signaturePath = path.join(__dirname, "signature.png");
    let sigCanvas;

    if (fs.existsSync(signaturePath)) {
      try {
        const signatureImg = await loadImage(signaturePath);
        ctx.drawImage(signatureImg, width / 2 - 180, 590, 360, 110);
      } catch {
        sigCanvas = createSignatureCanvas("Direktur Patah Hati");
        ctx.drawImage(sigCanvas, width / 2 - sigCanvas.width / 2, 580);
      }
    } else {
      sigCanvas = createSignatureCanvas("Rizky Mahardika, S.PatahHati");
      ctx.drawImage(sigCanvas, width / 2 - sigCanvas.width / 2, 580);

      // Simpan otomatis
      try {
        const out = fs.createWriteStream(signaturePath);
        const stream = sigCanvas.createPNGStream();
        stream.pipe(out);
        out.on("finish", () => console.log("✅ Signature disimpan:", signaturePath));
      } catch (err) {
        console.warn("⚠️ Gagal menyimpan signature:", err);
      }
    }

    // 🔴 Cap stempel “resmi”
    ctx.beginPath();
    ctx.arc(width - 160, height - 140, 60, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(179,0,89,0.6)";
    ctx.stroke();

    ctx.font = "bold 16px Sans";
    ctx.fillStyle = "rgba(179,0,89,0.8)";
    ctx.textAlign = "center";
    ctx.fillText("CINTA PALSU", width - 160, height - 140);
    ctx.fillText("APPROVED 💔", width - 160, height - 120);

    // 📤 Kirim hasil
    const buffer = canvas.toBuffer();
    await sock.sendMessage(msg.key.remoteJid, {
      image: buffer,
      caption: `💖 *Sertifikat Cinta Palsu Siap!*\n\n🎁 Untuk: *${nama}*\n💬 Alasan: ${alasan}`,
    });

  } catch (err) {
    console.error("❌ Error sertifikatCintaHandler:", err);
    await sock.sendMessage(msg.key.remoteJid, {
      text: "❌ Gagal membuat sertifikat cinta palsu. Coba lagi ya 😅",
    });
  }
};

// 🎲 Fungsi acak
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
