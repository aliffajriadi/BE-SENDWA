// Entry point. dotenv harus di-load PALING AWAL, sebelum modul lain
// membaca process.env saat di-import.
import "dotenv/config";
import "./src/main.js";
