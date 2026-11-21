import axios from "axios";

const URL = `https://store.ku.anjay.fun/api/stats?apikey=${process.env.API_KEY}`;

//result
// {
//   "success": true,
//   "data": {
//     "daily": {
//       "totalOrders": 50,
//       "paidOrders": 37,
//       "totalVolume": 702291,
//       "feeIncome": 15488,
//       "withdrawalFee": 17500,
//       "totalIncome": 32988
//     },
//     "overall": {
//       "totalOrders": 2850,
//       "paidOrders": 2388,
//       "totalVolume": 21820235,
//       "feeIncome": 543194,
//       "withdrawalFee": 583000,
//       "totalIncome": 1126194
//     },
//     "recentTransactions": [
//       {
//         "totalAmount": 10201,
//         "paymentStatus": "PAID",
//         "createdAt": "2026-08-13T15:18:45.010Z",
//         "store": {
//           "name": "luigi's Store"
//         }
//       },
//       {
//         "totalAmount": 25297,
//         "paymentStatus": "PAID",
//         "createdAt": "2026-08-13T15:14:38.927Z",
//         "store": {
//           "name": "wann's Store"
//         }
//       },
//       {
//         "totalAmount": 5289,
//         "paymentStatus": "PAID",
//         "createdAt": "2026-08-13T15:06:58.368Z",
//         "store": {
//           "name": "wauu's Store"
//         }
//       },
//       {
//         "totalAmount": 12289,
//         "paymentStatus": "PAID",
//         "createdAt": "2026-08-13T14:48:27.602Z",
//         "store": {
//           "name": "masuqik's Store"
//         }
//       },
//       {
//         "totalAmount": 12289,
//         "paymentStatus": "CANCELLED",
//         "createdAt": "2026-08-13T14:32:57.443Z",
//         "store": {
//           "name": "masuqik's Store"
//         }
//       }
//     ]
//   }
// }

const formatRp = (angka) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
};

export const storekuStats = async (sock, msg, pesan) => {
    try {
        const res = await axios.get(URL);
        const data = res.data?.data;
        if (!data) return false;

        const cmd = pesan.trim().toLowerCase();

        if (cmd === ".pg stat") {
            const daily = data.daily;
            const overall = data.overall;
            
            const textStats = `📊 *STATISTIK PAYMENT GATEWAY*

━━━━━━━━━━━━━━━━━━
📅 *HARI INI*
━━━━━━━━━━━━━━━━━━

🛒 *Order*
• Total Order : *${daily.totalOrders}*
• Paid Order  : *${daily.paidOrders}*

💰 *Transaksi*
• Volume      : *${formatRp(daily.totalVolume)}*

💵 *Pendapatan*
• Fee Income  : *${formatRp(daily.feeIncome)}*
• WD Fee      : *${formatRp(daily.withdrawalFee)}*
• Total Income: *${formatRp(daily.totalIncome)}*

━━━━━━━━━━━━━━━━━━
📈 *KESELURUHAN*
━━━━━━━━━━━━━━━━━━

🛒 *Order*
• Total Order : *${overall.totalOrders}*
• Paid Order  : *${overall.paidOrders}*

💰 *Transaksi*
• Volume      : *${formatRp(overall.totalVolume)}*

💵 *Pendapatan*
• Fee Income  : *${formatRp(overall.feeIncome)}*
• WD Fee      : *${formatRp(overall.withdrawalFee)}*
• Total Income: *${formatRp(overall.totalIncome)}*

━━━━━━━━━━━━━━━━━━
🤖 _Payment Gateway Statistics_
`;
            await sock.sendMessage(msg.key.remoteJid, { text: textStats }, { quoted: msg });
            return true;
        }

        if (cmd === ".pg history") {
            const history = data.recentTransactions;
            if (!history || history.length === 0) {
                await sock.sendMessage(msg.key.remoteJid, { text: "Belum ada transaksi terbaru." }, { quoted: msg });
                return true;
            }

            let textHistory = `📜 *RECENT TRANSACTIONS* 📜\n\n`;
            history.forEach((tx, idx) => {
                const statusIcon = tx.paymentStatus === 'PAID' ? '✅' : (tx.paymentStatus === 'CANCELLED' ? '❌' : '⏳');
                textHistory += `${idx + 1}. *${tx.store.name}*\n`;
                textHistory += `   Nominal: ${formatRp(tx.totalAmount)}\n`;
                textHistory += `   Status: ${statusIcon} ${tx.paymentStatus}\n`;
                textHistory += `   Waktu: ${formatDate(tx.createdAt)}\n\n`;
            });

            await sock.sendMessage(msg.key.remoteJid, { text: textHistory.trim() }, { quoted: msg });
            return true;
        }

        return false;
    } catch (error) {
        console.log(error);
        return false;
    }
}

