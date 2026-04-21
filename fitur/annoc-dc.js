import axios from "axios";
import config from "../config";

const webhook = config.DISCORD_WEBHOOK_ANNOUC;
export const sendPesan = async (pesan) => {
  try {
    await axios.post(webhook, {
      content: pesan,
    });

  } catch (err) {
    console.error("❌ Gagal mengirim pesan ke Discord:", err.message);
  }
};
