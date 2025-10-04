import os from "os";

export const cekServer = async (sock, msg) => {
     const uptime = os.uptime(); // dalam detik
      const days = Math.floor(uptime / (60 * 60 * 24));
      const hours = Math.floor((uptime % (60 * 60 * 24)) / (60 * 60));
      const minutes = Math.floor((uptime % (60 * 60)) / 60);

      await sock.sendMessage(msg.key.remoteJid, {
        text: `*🖥 SERVER INFO*

• *OS*        : ${os.platform()}
• *Release*   : ${os.release()}
• *Type*      : ${os.type()}
• *Hostname*  : ${os.hostname()}
• *Uptime*    : ${days} hari ${hours} jam ${minutes} menit
• *Total RAM* : ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB
• *Free RAM*  : ${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
      });
}