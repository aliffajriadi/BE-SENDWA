import { profile } from "../../func"
import { NomorOwner } from "../../list";
import prisma from "../../config/db";

export const topUp = async (sock, data) => {
    const price = data.price;
    let nomor = data.supporter_name;
    if (isNaN(nomor)) {
        return sock.sendMessage(`${NomorOwner}@s.whatsapp.net`, { text: `ada yang GAGAL top up ${price}, ${data.supporter_name}` });  
    }
    nomor = nomor.replace(/^0/, "62");
    const user = await profile(nomor);
    if (!user) {
        return sock.sendMessage(`${NomorOwner}@s.whatsapp.net`, { text: `ada yang GAGAL top up ${price}, ${data.supporter_name}` });
    }
    
    const saldo = user.saldo + price;
    await prisma.user.update({ where: { nomor }, data: { saldo } });
    
    return sock.sendMessage(`${nomor}@s.whatsapp.net`, { text: `Top Up Saldo Berhasil!

Top Up Saldo: Rp.${price}
Total Saldo Sekarang: Rp.${saldo}` });
}