import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { Sticker, StickerTypes } from "wa-sticker-formatter";



export const createStiker = async (sock, msg) => {
    const jid = msg.key.remoteJid;
      try {
        // pakai util function downloadMediaMessage
        const buffer = await downloadMediaMessage(
          msg,
          "buffer", // hasil dalam bentuk buffer
          {},
          {
            logger: sock.logger,
            reuploadRequest: sock.updateMediaMessage,
          }
        );

        const sticker = new Sticker(buffer, {
          pack: "BotWA",
          author: "Alif",
          type: StickerTypes.FULL,
        });

        const stickerBuffer = await sticker.toBuffer();

        await sock.sendMessage(jid, { sticker: stickerBuffer }, { quoted: msg });
      } catch (err) {
        console.error("Gagal buat stiker:", err);
        throw new Error(err);
        
      }
}