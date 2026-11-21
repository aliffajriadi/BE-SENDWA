import { Router } from "express";
import * as apiKeyService from "../../services/apikey.service.js";

const CACHE_TTL = 8000; // 8 detik

/** Cek API key bisnis: GET /api/cek-token?key=YOURTOKEN */
export const tokenRoutes = () => {
  const router = Router();
  const cache = new Map();

  router.get("/cek-token", async (req, res) => {
    const key = req.query.key;
    if (!key) {
      return res.status(400).json({ error: "API key wajib dikirim!" });
    }

    const now = Date.now();
    const cached = cache.get(key);
    if (cached && cached.expires > now) {
      return res.status(200).json({
        success: true,
        message: "Token valid! (cached)",
        cached: true,
        data: cached.data,
      });
    }

    try {
      const findKey = await apiKeyService.readDataBy("key", key);
      if (!findKey) {
        return res.status(403).json({ error: "API key tidak valid!" });
      }

      // Buang entry kadaluarsa supaya cache tidak membesar terus
      if (cache.size > 500) {
        for (const [k, v] of cache) if (v.expires <= now) cache.delete(k);
      }
      cache.set(key, { data: findKey, expires: now + CACHE_TTL });

      return res.status(200).json({
        success: true,
        message: "Token valid!",
        cached: false,
        data: findKey,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Terjadi kesalahan server" });
    }
  });

  return router;
};
