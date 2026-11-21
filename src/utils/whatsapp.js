/**
 * Kirim pesan dengan retry.
 * `sockOrGetter` boleh berupa socket atau fungsi `() => sock`, supaya
 * socket terbaru dipakai kalau bot reconnect di tengah retry.
 */
export async function sendMessageSafe(
  sockOrGetter,
  jid,
  message,
  retries = 5,
  delayMs = 3000,
) {
  for (let i = 0; i < retries; i++) {
    const sock = typeof sockOrGetter === "function" ? sockOrGetter() : sockOrGetter;
    try {
      if (!sock?.ws || sock.ws.readyState !== sock.ws.OPEN) {
        console.log("Socket belum siap, tunggu 3 detik...");
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue; // cek lagi socket
      }
      return await sock.sendMessage(jid, message); // berhasil
    } catch (err) {
      console.log(
        `Gagal kirim pesan ke ${jid}, percobaan ke-${i + 1}: ${err.message}`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error(`Gagal kirim pesan ke ${jid} setelah ${retries} percobaan`);
}

/** "62812...@s.whatsapp.net" -> "62812..." */
export const stripJid = (jid = "") => jid.replace("@s.whatsapp.net", "");

/** Nomor bot yang sedang login ("62812...:3@s.whatsapp.net" -> "62812..."), null kalau belum terhubung. */
export const botNumber = (sock) => sock?.user?.id?.split(/[:@]/)[0] ?? null;

/** "0812..." / "62812..." -> "62812...@s.whatsapp.net" */
export const toUserJid = (nomor = "") => {
  let n = String(nomor).trim();
  if (n.startsWith("0")) n = "62" + n.slice(1);
  return `${n}@s.whatsapp.net`;
};

/**
 * Ambil teks dari berbagai tipe pesan WhatsApp.
 */
export const extractText = (m) => {
  const type = Object.keys(m)[0];
  switch (type) {
    case "conversation":
      return { type, text: m.conversation || "" };
    case "extendedTextMessage":
      return { type, text: m.extendedTextMessage.text || "" };
    case "imageMessage":
      return { type, text: m.imageMessage.caption || "" };
    case "videoMessage":
      return { type, text: m.videoMessage.caption || "" };
    case "templateButtonReplyMessage":
      return { type, text: m.templateButtonReplyMessage.selectedId || "" };
    case "buttonsResponseMessage":
      return { type, text: m.buttonsResponseMessage.selectedButtonId || "" };
    case "listResponseMessage":
      return {
        type,
        text: m.listResponseMessage.singleSelectReply?.selectedRowId || "",
      };
    default:
      return { type, text: "" };
  }
};
