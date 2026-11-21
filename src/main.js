import net from "node:net";
import { env } from "./config/env.js";
import { createApp } from "./api/server.js";
import { startBot, getSock, getStatus } from "./bot/socket.js";
import { handleMessage } from "./bot/handler.js";

// Jangan sampai bot mati hanya karena satu promise lupa di-catch
process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});

// Default Node cuma menunggu 250 ms per alamat IP (IPv4/IPv6). Di jaringan lambat
// koneksi ke WhatsApp jadi ETIMEDOUT terus, jadi beri waktu lebih lama.
net.setDefaultAutoSelectFamilyAttemptTimeout(5000);

global.WebSocket ??= (await import("ws")).default;

await startBot(handleMessage);

const app = createApp({ getSock, getStatus });
app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Server running on 0.0.0.0:${env.PORT}`);
});
