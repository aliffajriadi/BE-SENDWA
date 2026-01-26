import os from "os";

export const cekServer = async (sock, msg) => {
    // Kalkulasi Uptime
    const uptime = os.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    // Kalkulasi Memori
    const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    const usedMem = (totalMem - freeMem).toFixed(2);
    const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(1);

    // Info CPU
    const cpus = os.cpus();
    const cpuModel = cpus[0].model.trim();
    const loadAvg = os.loadavg().map(l => l.toFixed(2)).join(", ");

    const infoMessage = `
╔══════════════════╗
      *📊 SERVER STATUS*
╚══════════════════╝

*🌐 SYSTEM INFO*
• *Platform* : ${os.platform()} (${os.arch()})
• *OS Type* : ${os.type()}
• *Hostname* : ${os.hostname()}
• *Release* : ${os.release()}

*⚙️ HARDWARE*
• *CPU* : ${cpuModel}
• *Cores* : ${cpus.length} Core(s)
• *Load Avg* : ${loadAvg} (1m, 5m, 15m)

*🧠 MEMORY USAGE*
• *Total RAM* : ${totalMem} GB
• *Used RAM* : ${usedMem} GB (${memUsagePercent}%)
• *Free RAM* : ${freeMem} GB

*⏳ UP TIME*
• ${days} Hari, ${hours} Jam, ${minutes} Menit, ${seconds} Detik

*🕒 TIME*
• ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB

──────────────────
_Status: Operational_ ✅`.trim();

    await sock.sendMessage(msg.key.remoteJid, {
        text: infoMessage,
    });
}