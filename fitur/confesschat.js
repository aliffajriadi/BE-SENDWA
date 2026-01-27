export const confessChatHandler = async (sock, msg, text, senderNumberJid) => {
  try {
    const cleanText = text.replace(/\s+/g, " ").trim();
    const args = cleanText.split(" ");

    if (args.length < 3) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `⚠️ *Format Salah!*\n\nGunakan format: \`/confess <nomor> <pesan>\`\nContoh: \`/confess 628123456789 Halo\``,
      });
      return false;
    }

    let nomorTujuan = args[1];
    let pesanAwal = args.slice(2).join(" ");

    let fixedNumber = nomorTujuan.replace(/\D/g, "");
    if (fixedNumber.startsWith("0")) {
      fixedNumber = "62" + fixedNumber.slice(1);
    } else if (!fixedNumber.startsWith("62") && fixedNumber.length > 5) {
      fixedNumber = "62" + fixedNumber;
    }

    if (fixedNumber.length < 10) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Nomor tujuan tidak valid.",
      });
      return false;
    }

    const targetNum = fixedNumber;
    const senderNum = senderNumberJid.split("@")[0];

    console.log(`[ConfessChat] Request: From ${senderNum} to ${targetNum}`);

    const [cek] = await sock.onWhatsApp(targetNum + "@s.whatsapp.net");
    if (!cek || !cek.exists) {
      await sock.sendMessage(senderNumberJid, {
        text: `❌ Nomor ${targetNum} tidak terdaftar di WhatsApp.`,
      });
      return false;
    }

    const targetRealJid = cek.jid;
    const targetRealNum = targetRealJid.split("@")[0];

    if (global.confessChat.has(senderNum)) {
      await sock.sendMessage(senderNumberJid, {
        text: `⚠️ Kamu masih dalam obrolan lain. Ketik /stop untuk berhenti.`,
      });
      return false;
    }

    if (global.confessChat.has(targetRealNum)) {
      await sock.sendMessage(senderNumberJid, {
        text: `⚠️ Target sedang sibuk dalam obrolan lain.`,
      });
      return false;
    }

    const requestMsg = `💌 *Kamu Dapat Pesan Confess!* 💌\n\n━━━━━━━━━━━━━━━\n"${pesanAwal}"\n━━━━━━━━━━━━━━━\n\nSeseorang ingin mengobrol anonim. Setuju?\n\nKetik */terima* untuk mulai balas\nKetik */tolak* untuk menolak`;

    await sock.sendMessage(targetRealJid, { text: requestMsg });

    // PENTING: Simpan ke dua-duanya (PN dan LID) jika berbeda untuk meminimalkan error
    global.pendingConfess.set(targetRealNum, senderNum);
    if (targetNum !== targetRealNum) {
      global.pendingConfess.set(targetNum, senderNum);
    }

    console.log(
      `[ConfessChat] Pending saved for target: ${targetRealNum} and ${targetNum}`,
    );

    await sock.sendMessage(senderNumberJid, {
      text: `✅ *Permintaan dikirim ke ${targetNum}!* Tunggu dia menerima ya...`,
    });

    return true;
  } catch (error) {
    console.error("Error in confessChatHandler:", error);
    return false;
  }
};

export const terimaConfess = async (sock, msg, senderNumberJid) => {
  const userJid = msg.key.remoteJid;
  const userNum = senderNumberJid.split("@")[0];
  const lidNum = userJid.split("@")[0];

  console.log(`[ConfessChat] .terima from PN: ${userNum}, JID-Num: ${lidNum}`);

  let senderNum =
    global.pendingConfess.get(userNum) || global.pendingConfess.get(lidNum);
  let matchedKey = global.pendingConfess.has(userNum) ? userNum : lidNum;

  if (!senderNum) {
    console.log(
      "[ConfessChat] FAILED .terima. Current pending keys:",
      Array.from(global.pendingConfess.keys()),
    );
    await sock.sendMessage(senderNumberJid, {
      text: "❌ Tidak ada permintaan confess yang tertunda untuk nomor kamu.",
    });
    return;
  }

  // Set active chat for both
  global.confessChat.set(userNum, senderNum);
  global.confessChat.set(lidNum, senderNum);
  global.confessChat.set(senderNum, userNum);

  global.pendingConfess.delete(userNum);
  global.pendingConfess.delete(lidNum);

  await sock.sendMessage(senderNumberJid, {
    text: "✅ *Obrolan dimulai!* Ketik pesan (tanpa /) untuk mengirim. Ketik */stop* untuk berhenti.",
  });
  await sock.sendMessage(senderNum + "@s.whatsapp.net", {
    text: "✅ *Permintaanmu diterima!* Kalian bisa saling mengobrol sekarang. Ketik */stop* untuk berhenti.",
  });
};

export const tolakConfess = async (sock, msg, senderNumberJid) => {
  const userJid = msg.key.remoteJid;
  const userNum = senderNumberJid.split("@")[0];
  const lidNum = userJid.split("@")[0];

  let senderNum =
    global.pendingConfess.get(userNum) || global.pendingConfess.get(lidNum);
  let matchedKey = global.pendingConfess.has(userNum) ? userNum : lidNum;

  if (!senderNum) {
    await sock.sendMessage(senderNumberJid, {
      text: "❌ Tidak ada permintaan confess yang tertunda.",
    });
    return;
  }

  global.pendingConfess.delete(userNum);
  global.pendingConfess.delete(lidNum);

  await sock.sendMessage(senderNumberJid, {
    text: "❌ Kamu menolak obrolan tersebut.",
  });
  await sock.sendMessage(senderNum + "@s.whatsapp.net", {
    text: "❌ Maaf, permintaan obrolan anonim kamu ditolak.",
  });
};

export const stopConfess = async (sock, msg, senderNumberJid) => {
  const userJid = msg.key.remoteJid;
  const userNum = senderNumberJid.split("@")[0];
  const lidNum = userJid.split("@")[0];

  let partnerNum =
    global.confessChat.get(userNum) || global.confessChat.get(lidNum);
  let matchedKey = global.confessChat.has(userNum) ? userNum : lidNum;

  if (!partnerNum) return;

  global.confessChat.delete(userNum);
  global.confessChat.delete(lidNum);
  global.confessChat.delete(partnerNum);

  await sock.sendMessage(senderNumberJid, { text: "⏹️ *Obrolan selesai.*" });
  await sock.sendMessage(partnerNum + "@s.whatsapp.net", {
    text: "⏹️ *Partner telah mengakhiri obrolan.*",
  });
};
