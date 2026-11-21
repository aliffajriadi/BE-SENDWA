const TTL = 60_000; // 60 detik
const processed = new Map();

/**
 * Cegah pesan yang sama diproses dua kali.
 * @returns true kalau pesan ini sudah pernah diproses
 */
export const isDuplicate = (msg) => {
  const key = `${msg.key.remoteJid}_${msg.key.id}_${msg.messageTimestamp}`;
  if (processed.has(key)) {
    console.log(`[DEDUPE] Skipping duplicate message: ${msg.key.id}`);
    return true;
  }
  processed.set(key, Date.now());

  if (processed.size > 100) {
    const now = Date.now();
    for (const [k, t] of processed) {
      if (now - t > TTL) processed.delete(k);
    }
  }
  return false;
};
