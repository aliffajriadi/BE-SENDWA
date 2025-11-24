import axios from "axios";

const webhook = "https://discord.com/api/webhooks/1442643787909169315/2B5yDG3S7cNoqGG8ZLjAzDjLEAa7lx3N1N0rVmxLqekA-hq00Ow0rwxO8EuE9cIcwe5o";

export const sendPesan = async (pesan) => {
  try {
    await axios.post(webhook, {
      content: pesan,
    });

  } catch (err) {
    console.error("❌ Gagal mengirim pesan ke Discord:", err.message);
  }
};
