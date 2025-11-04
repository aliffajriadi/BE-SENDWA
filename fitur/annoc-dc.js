import axios from "axios";

const webhook = "https://discord.com/api/webhooks/1435352972744724592/7MMizb1SHHvroMhY3C0tH43lizdCCXl3r-oHGMSs4-ANjavuI4fIUUz4kbRbILA5qxgU";

export const sendPesan = async (pesan) => {
  try {
    await axios.post(webhook, {
      content: pesan,
    });

  } catch (err) {
    console.error("❌ Gagal mengirim pesan ke Discord:", err.message);
  }
};
