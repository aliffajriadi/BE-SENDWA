// Semua environment variable dikumpulkan di sini.
// dotenv sudah di-load di index.js sebelum modul lain dievaluasi.
export const env = {
  PORT: process.env.PORT || 3000,
  API_KEY: process.env.API_KEY,
  // URL publik untuk link halaman verifikasi, misal https://wa.domain.com (kosong = dari request)
  PUBLIC_URL: process.env.PUBLIC_URL,
};

if (!env.API_KEY) {
  console.warn("⚠️  API_KEY belum di-set di .env — semua endpoint terproteksi akan menolak request.");
}
