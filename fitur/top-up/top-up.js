import { profile } from "../../func.js";
import { NomorOwner } from "../../list.js";
import prisma from "../../config/db.js";

export const topUp = async (sock, data, sendMessageSafe) => {
    const price = data.price;
    let nomor = data.supporter_name;
    if (isNaN(nomor)) {
        return sendMessageSafe(sock, `${NomorOwner}@s.whatsapp.net`, { text: `ada yang GAGAL top up ${price}, ${data.supporter_name}` });  
    }
    nomor = nomor.replace(/^0/, "62");
    const user = await profile(nomor);
    if (!user) {
        return sendMessageSafe(sock, `${NomorOwner}@s.whatsapp.net`, { text: `ada yang GAGAL top up ${price}, ${data.supporter_name}` });
    }
    
    const saldo = user.saldo + price;
    await sendMessageSafe(sock, `${NomorOwner}@s.whatsapp.net`, { text: `ada yang berhasil top up ${price}, ${data.supporter_name}` });
    await prisma.user.update({ where: { nomor }, data: { saldo } });
    return sendMessageSafe(sock, `${nomor}@s.whatsapp.net`, { text: `Top Up Saldo Berhasil ✅!

Top Up Saldo: *Rp.${price}*
Total Saldo Sekarang: *Rp.${saldo}*` });
}