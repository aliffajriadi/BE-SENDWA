import general from "./general.js";
import download from "./download.js";
import media from "./media.js";
import confess from "./confess.js";
import payment from "./payment.js";
import owner from "./owner.js";
import learning from "./learning.js";

/**
 * Daftar semua command bot. Urutan penting: command pertama yang cocok
 * yang dijalankan (filter kata kotor & balasan otomatis ada paling atas).
 *
 * Untuk menambah fitur baru:
 *   1. Buat logic-nya di src/features/<kategori>/
 *   2. Daftarkan command-nya di salah satu file di folder ini
 */
export const commands = [
  ...general,
  ...download,
  ...media,
  ...confess,
  ...payment,
  ...owner,
  ...learning,
];
