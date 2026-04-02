import axios from "axios";

/**
 * Command untuk mengecek deadline Moodle
 * Contoh penggunaan: /cek 7
 */
export const cekDeadline = async (sock, msg, args) => {
    const jid = msg.key.remoteJid;

    try {
        if (!args || isNaN(args)) {
            return await sock.sendMessage(jid, {
                text: `⚠️ *Format salah!*\nGunakan: /cek <hari>\nContoh: /cek 7`,
            }, { quoted: msg });
        }

        const hari = parseInt(args);
        if (hari < 1 || hari > 30) {
            return await sock.sendMessage(jid, {
                text: `⚠️ *Jumlah hari tidak valid!*\nMasukkan angka 1 - 30.`,
            }, { quoted: msg });
        }

        const url = `http://localhost:3874/upcoming?days=${hari}`;

        await sock.sendMessage(jid, { 
            text: `🔍 *Sedang mengecek deadline dalam ${hari} hari...*` 
        }, { quoted: msg });

        const response = await axios.get(url, { timeout: 15000 });
        const data = response.data;

        if (!data.success || !Array.isArray(data.upcoming)) {
            throw new Error("Format response API tidak sesuai");
        }

        if (data.upcoming.length === 0) {
            return await sock.sendMessage(jid, {
                text: `✅ Tidak ada deadline dalam ${hari} hari ke depan.\nSemua aman! 🎉`,
            }, { quoted: msg });
        }

        let text = `📅 *DEADLINE DALAM ${hari} HARI*\n\n`;
        text += `Total: *${data.upcoming.length} tugas*\n`;
        text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

        const sekarang = Date.now();

        data.upcoming.forEach((item, index) => {
            // === PARSER TANGGAL KHUSUS untuk format "4/4/2026, 00.00.00" ===
            let dueTime = 0;
            if (item.due_date) {
                const cleaned = item.due_date.replace(/,/g, ''); // hapus koma
                dueTime = new Date(cleaned).getTime();
                
                // Jika masih invalid, coba parse manual (format Indonesia)
                if (isNaN(dueTime)) {
                    const [datePart, timePart] = item.due_date.split(', ');
                    const [day, month, year] = datePart.split('/').map(Number);
                    const [hour, minute, second] = timePart ? timePart.split('.').map(Number) : [0,0,0];
                    
                    dueTime = new Date(year, month - 1, day, hour, minute, second).getTime();
                }
            }

            const remainingMs = dueTime - sekarang;
            const remainingHours = Math.max(0, Math.ceil(remainingMs / 3600000));
            console.log(remainingHours);

            const status = remainingHours <= 10 
                    ? "🔴 *KRITIS - Segera dikerjakan!*" 
                    : "🟡 *Mendekati deadline*";

            let sisaText = remainingHours <= 0 
                ? "🚨 *Sudah Lewat Deadline*" 
                : remainingHours < 24 
                    ? `⏳ *Sisa:* ${remainingHours} jam lagi`
                    : `⏳ *Sisa:* ${Math.floor(remainingHours / 24)} hari ${remainingHours % 24} jam lagi`;

            text += `*${index + 1}. ${item.name}*\n`;
            text += `${status}\n`;
            text += `📚 *Mata Kuliah:* ${item.course || '-'}\n`;
            text += `⏰ *Deadline:* ${item.due_date || '-'}\n`;
            text += `${sisaText}\n`;

            if (item.url && item.url !== '#') {
                text += `🔗 *Link:* ${item.url}\n`;
            }

            text += `\n━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        });

        text += `_Auto fetched from Moodle • ${new Date().toLocaleString('id-ID')}_`;

        await sock.sendMessage(jid, { text: text }, { quoted: msg });

    } catch (error) {
        console.error("❌ Cek Deadline Error:", error.message || error);
        await sock.sendMessage(jid, {
            text: `❌ Gagal mengambil data deadline.\n${error.message}`,
        }, { quoted: msg });
    }
};