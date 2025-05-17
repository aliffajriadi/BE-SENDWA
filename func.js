export async function timeAgo(waktu) {
    const sekarang = new Date();
    const dibuat = new Date(waktu);
    const selisihMs = sekarang - dibuat;
  
    const menit = Math.floor(selisihMs / (1000 * 60));
    const jam = Math.floor(selisihMs / (1000 * 60 * 60));
    const hari = Math.floor(selisihMs / (1000 * 60 * 60 * 24));
  
    if (menit < 1) return "Baru saja";
    if (menit < 60) return `*${menit}* menit yang lalu`;
    if (jam < 24) return `*${jam}* jam yang lalu`;
    return `*${hari}* hari yang lalu`;
  }