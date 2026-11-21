import express from "express";
import cors from "cors";
import path from "path";
import { messageRoutes } from "./routes/message.routes.js";
import { paymentRoutes } from "./routes/payment.routes.js";
import { tokenRoutes } from "./routes/token.routes.js";
import { adminRoutes } from "./routes/admin.routes.js";
import { verificationRoutes } from "./routes/verification.routes.js";

const ADMIN_DIR = path.join(import.meta.dirname, "..", "web", "admin");
const DOCS_DIR = path.join(import.meta.dirname, "..", "web", "docs");
const VERIFY_PAGE = path.join(import.meta.dirname, "..", "web", "verify", "index.html");

/**
 * Buat aplikasi Express.
 * @param {{ getSock: () => any, getStatus: () => object }} deps
 */
export const createApp = (deps) => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Dashboard admin (file statis)
  app.use("/admin", express.static(ADMIN_DIR));
  // Dokumentasi API verifikasi WA untuk developer app client (publik)
  app.use("/docs", express.static(DOCS_DIR));
  // Halaman verifikasi untuk user (seperti halaman invoice payment gateway)
  app.get("/verify/:token", (req, res) => res.sendFile(VERIFY_PAGE));

  app.use("/api/admin", adminRoutes(deps));
  app.use("/api", messageRoutes(deps));
  app.use("/api", paymentRoutes(deps));
  app.use("/api", tokenRoutes(deps));
  app.use("/api", verificationRoutes(deps));

  app.use("/api", (req, res) => {
    res.status(404).json({ message: "Endpoint tidak ditemukan" });
  });

  // Error handler terakhir: jangan bocorkan detail error ke client
  app.use((err, req, res, next) => {
    console.error("[API Error]", err);
    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({ message: "Terjadi kesalahan server" });
  });

  return app;
};
