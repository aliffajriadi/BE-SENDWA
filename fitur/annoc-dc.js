import axios from "axios";

const webhook = process.env.DISCORD_WEBHOOK_ANNOUC;

export const sendPesan = async (pesan) => {
  try {
    await axios.post(webhook, {
      content: pesan,
    });

  } catch (err) {
    console.error("❌ Gagal mengirim pesan ke Discord:", err.message);
  }
};
