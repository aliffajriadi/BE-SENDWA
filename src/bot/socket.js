import {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestWaWebVersion,
  DisconnectReason,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode-terminal";
import fs from "fs";

const AUTH_DIR = "auth";
const FALLBACK_VERSION = [2, 3000, 1015901307];

let sock = null;
let connecting = false;
const status = { state: "connecting", since: Date.now(), user: null };

const setStatus = (state) => {
  status.state = state;
  status.since = Date.now();
  status.user = sock?.user?.id ?? null;
};

/** Socket aktif saat ini (berubah setiap reconnect). */
export const getSock = () => sock;
export const getStatus = () => ({ ...status });

const getVersion = async () => {
  try {
    const { version } = await fetchLatestWaWebVersion();
    return version;
  } catch {
    return FALLBACK_VERSION;
  }
};

/**
 * Koneksikan bot ke WhatsApp dan auto-reconnect.
 * @param {(sock, upsert) => Promise<void>} onMessage handler messages.upsert
 */
export async function startBot(onMessage) {
  if (connecting) return;
  connecting = true;
  setStatus("connecting");

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const version = await getVersion();

    sock = makeWASocket({
      version,
      auth: state,
      browser: ["Bot WhatsApp", "Chrome", "1.0.0"],
    });
    const current = sock;

    current.ev.on("creds.update", saveCreds);

    current.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        setStatus("qr");
        console.log("Scan QR Code berikut untuk login:");
        qrcode.generate(qr, { small: true });
      }

      if (connection === "open") {
        connecting = false;
        setStatus("open");
        console.log("Koneksi terbuka, bot sudah siap digunakan!");
      }

      if (connection === "close") {
        connecting = false;
        setStatus("close");
        const error = lastDisconnect?.error;
        const loggedOut =
          error instanceof Boom &&
          error.output?.statusCode === DisconnectReason.loggedOut;

        console.log("Koneksi terputus karena:", error);

        if (!loggedOut) {
          console.log("Mencoba menghubungkan kembali dalam 5 detik...");
          setTimeout(() => startBot(onMessage), 5000);
        } else {
          console.log("Koneksi ditutup. Menghapus kredensial...");
          fs.rmSync(`./${AUTH_DIR}`, { recursive: true, force: true });
        }
      }
    });

    current.ev.on("messages.upsert", async (upsert) => {
      try {
        await onMessage(current, upsert);
      } catch (error) {
        console.error("[Bot] Error saat memproses pesan:", error);
      }
    });
  } catch (error) {
    console.log(error);
    connecting = false;
    setTimeout(() => startBot(onMessage), 5000);
  }
}
