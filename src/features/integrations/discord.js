import axios from "axios";

export const sendPesan = async (pesan) => {
  const webhook = process.env.DISCORD_WEBHOOK_ANNOUC;
  if (!webhook) return console.warn("⚠️ DISCORD_WEBHOOK_ANNOUC belum di-set");
  try {
    await axios.post(webhook, {
      content: pesan,
    });
  } catch (err) {
    console.error("❌ Gagal mengirim pesan ke Discord:", err.message);
  }
};
