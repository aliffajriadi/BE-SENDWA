import { NomorOwner } from "../list.js";
import * as query from "../helper/crud-Key.js";

export const crudApiKeyBuisness = async (sock, msg, senderNumber, pesan) => {
  const owner = NomorOwner;
  const pengirim = senderNumber.replace("@s.whatsapp.net", "");
  const jid = msg.key.remoteJid;

  if (pengirim !== owner) {
    return sock.sendMessage(jid, { text: "Anda bukan owner!" });
  }

  const args = pesan.split(" ");
  const key = args[1];
  const sub = args[2]; // add / tambah / kurang / info / delete / list / menu
  const angka = parseInt(args[3]);
  const pemilik = args[4]; // untuk add

  // ========================= MENU =========================
  if (key === "menu") {
    return sock.sendMessage(jid, {
      text: `📌 *MENU APIKEY*\n
.apikey <key> add <token> <nama>
.apikey <key> tambah <jumlah>
.apikey <key> kurang <jumlah>
.apikey <key> info
.apikey <key> delete
.apikey list`
    });
  }

  // ========================= LIST =========================
  if (key === "list") {
    const all = query.readData();

    if (!all || all.length === 0) {
      return sock.sendMessage(jid, { text: "Belum ada API Key tersimpan." });
    }

    let listText = "📌 *LIST API KEY*\n\n";
    all.forEach(a => {
      listText += `• Key: ${a.key}\n  Token: ${a.token}\n  Owner: ${a.owner}\n\n`;
    });

    return sock.sendMessage(jid, { text: listText });
  }

  // Jika key tidak ada
  if (!key) {
    return sock.sendMessage(jid, { text: "Format salah. Ketik .apikey menu" });
  }

  // ========================= ADD API KEY =========================
  if (sub === "add") {
    if (!angka || !pemilik) {
      return sock.sendMessage(jid, {
        text: "Format salah.\nContoh: .apikey KEY123 add 50 jon"
      });
    }

    const exist = query.readDataBy("key", key);
    if (exist) return sock.sendMessage(jid, { text: "API Key sudah ada!" });

    const newData = {
      id: Date.now(),
      key,
      token: angka,
      owner: pemilik,
      createdAt: new Date().toISOString()
    };

    query.createData(newData);

    return sock.sendMessage(jid, {
      text: `✔ API Key berhasil dibuat!\nKey: ${key}\nToken: ${angka}\nOwner: ${pemilik}`
    });
  }

  // ========================= INFO =========================
  if (sub === "info") {
    const data = query.readDataBy("key", key);
    if (!data) return sock.sendMessage(jid, { text: "API Key tidak ditemukan!" });

    return sock.sendMessage(jid, {
      text: `📌 *DETAIL API KEY*\n
Key: ${data.key}
Token: ${data.token}
Owner: ${data.owner}
Created: ${data.createdAt}`
    });
  }

  // ========================= DELETE =========================
  if (sub === "delete") {
    const deleted = query.deleteData("key", key);
    if (!deleted) return sock.sendMessage(jid, { text: "API Key tidak ditemukan!" });

    return sock.sendMessage(jid, {
      text: `✔ API key '${key}' berhasil dihapus!`
    });
  }

  // ========================= TAMBAH TOKEN =========================
  if (sub === "tambah") {
    if (isNaN(angka))
      return sock.sendMessage(jid, { text: "Jumlah harus angka!" });

    const data = query.readDataBy("key", key);
    if (!data) return sock.sendMessage(jid, { text: "API Key tidak ditemukan!" });

    const newToken = data.token + angka;
    query.updateData("id", data.id, { token: newToken });

    return sock.sendMessage(jid, {
      text: `✔ Token ditambah!\nKey: ${key}\nToken Baru: ${newToken}`
    });
  }

  // ========================= KURANG TOKEN =========================
  if (sub === "kurang") {
    if (isNaN(angka))
      return sock.sendMessage(jid, { text: "Jumlah harus angka!" });

    const data = query.readDataBy("key", key);
    if (!data) return sock.sendMessage(jid, { text: "API Key tidak ditemukan!" });

    let newToken = data.token - angka;
    if (newToken < 0) newToken = 0;

    query.updateData("id", data.id, { token: newToken });

    return sock.sendMessage(jid, {
      text: `✔ Token dikurangi!\nKey: ${key}\nToken Baru: ${newToken}`
    });
  }

  // Jika command tidak dikenali
  return sock.sendMessage(jid, { text: "Perintah tidak dikenal.\nKetik .apikey menu" });
};
