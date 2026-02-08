export const confessChatHandler = async (sock, msg, text, senderJid) => {
  try {
    const cleanText = text.replace(/\s+/g, " ").trim();
    const args = cleanText.split(" ");

    if (args.length < 3) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `⚠️ *Format Salah!*\n\nGunakan format: \`.confess <nomor> <pesan>\`\nContoh: \`.confess 628123456789 Halo\``,
      });
      return false;
    }

    if (msg.key.remoteJid.endsWith("@g.us")) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "⚠️ Fitur ini hanya dapat digunakan dalam chat pribadi untuk menjaga kerahasiaan.",
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

    const targetSearchJid = fixedNumber + "@s.whatsapp.net";
    const senderNum = senderJid.split("@")[0];

    console.log(
      `[ConfessChat] Request: From ${senderJid} to ${targetSearchJid}`,
    );

    const [cek] = await sock.onWhatsApp(targetSearchJid);
    if (!cek || !cek.exists) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `❌ Nomor ${fixedNumber} tidak terdaftar di WhatsApp.`,
      });
      return false;
    }

    const targetRealJid = cek.jid;
    const targetRealNum = targetRealJid.split("@")[0];

    // Check if sender is in a chat
    if (
      global.confessChat.has(senderJid) ||
      global.confessChat.has(senderNum)
    ) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `⚠️ Kamu masih dalam obrolan lain. Ketik */stop* untuk berhenti.`,
      });
      return false;
    }

    // Check if target is in a chat
    if (
      global.confessChat.has(targetRealJid) ||
      global.confessChat.has(targetRealNum) ||
      global.confessChat.has(targetSearchJid)
    ) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `⚠️ Target sedang sibuk dalam obrolan lain.`,
      });
      return false;
    }

    // Send message immediately to target
    const instantMsg = `💌 *Pesan Anonim untuk Kamu!* 💌\n\n━━━━━━━━━━━━━━━\n"${pesanAwal}"\n━━━━━━━━━━━━━━━\n\n💬 Seseorang mengirim pesan ini secara anonim.\n\n✨ Ingin balas dan mulai obrolan?\nKetik */terima* untuk mulai chat anonim\nKetik */tolak* untuk menolak`;

    await sock.sendMessage(targetRealJid, { text: instantMsg });

    // Store pending confess using multiple keys for maximum compatibility
    global.pendingConfess.set(targetRealJid, senderJid);
    global.pendingConfess.set(targetSearchJid, senderJid);
    global.pendingConfess.set(targetRealNum, senderJid);
    global.pendingConfess.set(fixedNumber, senderJid);

    console.log(
      `[ConfessChat] Pending set for ${targetRealJid} and ${targetSearchJid}`,
    );

    // Give instant feedback to sender
    await sock.sendMessage(msg.key.remoteJid, {
      text: `✅ *Pesan berhasil dikirim ke ${fixedNumber}!* 🎉\n\n📩 Pesanmu telah terkirim secara anonim.\n💬 Jika dia tertarik, dia bisa balas dengan */terima* untuk mulai obrolan.\n\n⏳ Tunggu balasannya ya...`,
    });

    return true;
  } catch (error) {
    console.error("Error in confessChatHandler:", error);
    return false;
  }
};

export const terimaConfess = async (sock, msg, senderJid) => {
  const userNum = senderJid.split("@")[0];
  const remoteJid = msg.key.remoteJid;
  const remoteNum = remoteJid.split("@")[0];

  console.log(`[ConfessChat] .terima request from: ${senderJid}`);

  // Try finding in pending by various keys
  let partnerJid =
    global.pendingConfess.get(senderJid) ||
    global.pendingConfess.get(userNum) ||
    global.pendingConfess.get(remoteJid) ||
    global.pendingConfess.get(remoteNum);

  if (!partnerJid) {
    console.log(
      "[ConfessChat] FAILED .terima. Current pending keys:",
      Array.from(global.pendingConfess.keys()),
    );
    await sock.sendMessage(msg.key.remoteJid, {
      text: "❌ Tidak ada permintaan confess yang tertunda untuk kamu.",
    });
    return;
  }

  console.log(`[ConfessChat] Found partner: ${partnerJid} for ${senderJid}`);

  // Check if partner is still available
  if (global.confessChat.has(partnerJid)) {
    await sock.sendMessage(msg.key.remoteJid, {
      text: "⚠️ Maaf, pengirim pesan sudah memulai obrolan lain.",
    });
    global.pendingConfess.delete(senderJid);
    global.pendingConfess.delete(userNum);
    return;
  }

  // Set active chat for both (using full JIDs for stability)
  global.confessChat.set(senderJid, partnerJid);
  global.confessChat.set(partnerJid, senderJid);

  // Also store by number parts to ensure lookup matches in index.js
  global.confessChat.set(userNum, partnerJid);
  global.confessChat.set(partnerJid.split("@")[0], senderJid);

  // Clean up pending
  global.pendingConfess.delete(senderJid);
  global.pendingConfess.delete(userNum);
  global.pendingConfess.delete(remoteJid);
  global.pendingConfess.delete(remoteNum);
  // Also delete by partner's number just in case
  global.pendingConfess.delete(partnerJid.split("@")[0]);

  await sock.sendMessage(msg.key.remoteJid, {
    text: "✅ *Obrolan dimulai!* \n\nKirim pesan seperti biasa untuk mengobrol secara anonim.\nKetik */stop* untuk mengakhiri obrolan.",
  });

  await sock.sendMessage(partnerJid, {
    text: "✅ *Permintaanmu diterima!* 🎉\n\nKalian bisa saling mengobrol sekarang secara anonim.\nKetik */stop* untuk mengakhiri obrolan.",
  });
};

export const tolakConfess = async (sock, msg, senderJid) => {
  const userNum = senderJid.split("@")[0];
  const remoteJid = msg.key.remoteJid;

  let partnerJid =
    global.pendingConfess.get(senderJid) ||
    global.pendingConfess.get(userNum) ||
    global.pendingConfess.get(remoteJid);

  if (!partnerJid) {
    await sock.sendMessage(msg.key.remoteJid, {
      text: "❌ Tidak ada permintaan confess yang tertunda.",
    });
    return;
  }

  global.pendingConfess.delete(senderJid);
  global.pendingConfess.delete(userNum);
  global.pendingConfess.delete(remoteJid);

  await sock.sendMessage(msg.key.remoteJid, {
    text: "❌ Kamu menolak obrolan tersebut.",
  });

  await sock.sendMessage(partnerJid, {
    text: "❌ Maaf, permintaan obrolan anonim kamu ditolak.",
  });
};

export const stopConfess = async (sock, msg, senderJid) => {
  const userNum = senderJid.split("@")[0];
  const remoteJid = msg.key.remoteJid;

  let partnerJid =
    global.confessChat.get(senderJid) ||
    global.confessChat.get(userNum) ||
    global.confessChat.get(remoteJid);

  if (!partnerJid) return;

  const partnerNum = partnerJid.split("@")[0];

  // Clean up all possible keys
  global.confessChat.delete(senderJid);
  global.confessChat.delete(userNum);
  global.confessChat.delete(partnerJid);
  global.confessChat.delete(partnerNum);
  global.confessChat.delete(remoteJid);

  await sock.sendMessage(msg.key.remoteJid, { text: "⏹️ *Obrolan selesai.*" });
  await sock.sendMessage(partnerJid, {
    text: "⏹️ *Partner telah mengakhiri obrolan.*",
  });
};
