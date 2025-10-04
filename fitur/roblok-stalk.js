// fitur/robloxStalk.js
import axios from "axios";

/**
 * robloxStalk handler untuk dipanggil dari index.js
 * @param {import('@whiskeysockets/baileys').AnyWASocket} sock
 * @param {Object} msg  - message object dari messages.upsert (messages[0])
 * @param {String} username - username roblox yg dicari
 * @param {String} usedPrefix - (opsional) prefix yg dipakai, mis "."
 */
export const robloxStalk = async (sock, msg, username, usedPrefix = ".") => {
  const jid = msg?.key?.remoteJid;
  if (!jid) return;
  try {
    if (!username || username.trim() === "") {
      await sock.sendMessage(jid, {
        text: `📦 Format salah, kirim dengan username tujuan Contoh:\n${usedPrefix}cekroblok alf_jrd`,
      });
      return false;
    }
    await sock.sendMessage(jid, { text: "🔎 Mencari data Roblox..." });

    // helper request
    const headers = {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      Accept: "application/json",
    };

    // 1) ambil id dari username
    const resUser = await axios.post(
      "https://users.roblox.com/v1/usernames/users",
      { usernames: [username] },
      { headers }
    );
    const userData = resUser.data?.data?.[0];
    if (!userData) {
      await sock.sendMessage(jid, { text: "❌ Username tidak ditemukan." });
      return false;
    }
    const id = userData.id;

    // paralel ambil data
    const getUserData = (id) =>
      axios
        .get(`https://users.roblox.com/v1/users/${id}`, { headers })
        .then((r) => r.data)
        .catch(() => ({}));
    const getProfile = (id) =>
      axios
        .get(
          `https://thumbnails.roblox.com/v1/users/avatar?userIds=${id}&size=720x720&format=Png&isCircular=false`,
          { headers }
        )
        .then((r) => r.data?.data?.[0]?.imageUrl || null)
        .catch(() => null);
    const getPresence = (id) =>
      axios
        .post(
          "https://presence.roblox.com/v1/presence/users",
          { userIds: [id] },
          { headers }
        )
        .then((res) => {
          const p = res.data?.userPresences?.[0] || {};
          return {
            isOnline: p.userPresenceType === 2,
            lastOnline: p.lastOnline || "Tidak tersedia",
            recentGame: p.lastLocation || "Tidak sedang bermain",
          };
        })
        .catch(() => ({
          isOnline: false,
          lastOnline: "Tidak tersedia",
          recentGame: "Tidak tersedia",
        }));

    const getFriendCount = (id) =>
      axios
        .get(`https://friends.roblox.com/v1/users/${id}/friends/count`, {
          headers,
        })
        .then((r) => r.data?.count || 0)
        .catch(() => 0);
    const getFollowers = (id) =>
      axios
        .get(`https://friends.roblox.com/v1/users/${id}/followers/count`, {
          headers,
        })
        .then((r) => r.data?.count || 0)
        .catch(() => 0);
    const getFollowing = (id) =>
      axios
        .get(`https://friends.roblox.com/v1/users/${id}/followings/count`, {
          headers,
        })
        .then((r) => r.data?.count || 0)
        .catch(() => 0);
    const getBadges = (id) =>
      axios
        .get(
          `https://badges.roblox.com/v1/users/${id}/badges?limit=10&sortOrder=Desc`,
          { headers }
        )
        .then(
          (r) =>
            r.data?.data?.map((b) => ({
              name: b.name,
              description: b.description,
              iconImageId: b.iconImageId,
            })) || []
        )
        .catch(() => []);

    const [
      userDetails,
      profilePicture,
      presence,
      friendCount,
      followers,
      following,
      badges,
    ] = await Promise.all([
      getUserData(id),
      getProfile(id),
      getPresence(id),
      getFriendCount(id),
      getFollowers(id),
      getFollowing(id),
      getBadges(id),
    ]);

    // build caption rapi
    const created = userDetails.created
      ? new Date(userDetails.created).toLocaleString("id-ID")
      : "-";
    let caption = `*🕹️ Roblox User Stalk*\n\n`;
    caption += `👤 *Username:* ${userDetails.name || username}\n`;
    caption += `📛 *Display Name:* ${userDetails.displayName || "-"}\n`;
    caption += `📅 *Akun Dibuat:* ${created}\n`;
    caption += `📜 *Deskripsi:* ${userDetails.description || "-"}\n`;
    caption += `✅ *Verified Badge:* ${
      userDetails.hasVerifiedBadge ? "✅" : "❌"
    }\n`;
    caption += `🚫 *Banned:* ${userDetails.isBanned ? "✅" : "❌"}\n\n`;
    caption += `*📡 Presence:*\n`;
    caption += `🌐 *Online:* ${presence.isOnline ? "✅" : "❌"}\n`;
    caption += `🕑 *Last Online:* ${presence.lastOnline}\n`;
    caption += `🎮 *Recent Game:* ${presence.recentGame}\n\n`;
    caption += `*📊 Stats:*\n`;
    caption += `👥 *Friends:* ${friendCount}\n`;
    caption += `👣 *Followers:* ${followers}\n`;
    caption += `📌 *Following:* ${following}\n\n`;
    if (badges && badges.length) {
      caption += `🎖️ *Recent Badges:*\n`;
      badges.slice(0, 10).forEach((b, i) => {
        caption += `${i + 1}. ${b.name}\n`;
      });
    }

    // kirim gambar profil (kalau ada) + caption
    if (profilePicture) {
      await sock.sendMessage(
        jid,
        { image: { url: profilePicture }, caption },
        { quoted: msg }
      );
    } else {
      await sock.sendMessage(jid, { text: caption }, { quoted: msg });
    }
    return true;
  } catch (err) {
    console.error(
      "[ROBLOX STALK ERROR]",
      err?.response?.status,
      err?.response?.data || err.message || err
    );
    await sock.sendMessage(
      msg.key.remoteJid,
      { text: "❌ Gagal mengambil data. Coba lagi nanti." },
      { quoted: msg }
    );
  }
};

export default robloxStalk;
