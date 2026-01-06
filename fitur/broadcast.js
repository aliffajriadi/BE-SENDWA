import { getAllUser } from "../func.js";

export const broadcast = async (sock, msg, rawPesan) => {
  const dataUser = await getAllUser();
  let skip = 0;

  try {
    for (const user of dataUser) {
      // 🔥 replace variabel dengan data user
      let pesanKirim = rawPesan
        .replace(/{nama}/g, user.name)
        .replace(/{nomor}/g, user.nomor)
        .replace(/{token}/g, user.token);

      if (user.nomor.endsWith("@lid")) {
        console.log(`Skip ${user.nomor}, name: ${user.name}`);
        skip++;
      } else {
        await sock.sendMessage(`${user.nomor}@s.whatsapp.net`, {
          text: pesanKirim,
        });
      }

      await new Promise((r) => setTimeout(r, 2000));
    }

    await sock.sendMessage(msg.key.remoteJid, {
      text: `Pesan berhasil dikirim ke ${
        dataUser.length - skip
      } orang, ${skip} di skip`,
    });
  } catch (error) {
    console.log(error);
    throw new Error("Pesan gagal di kirim" + error.message);
  }
};
