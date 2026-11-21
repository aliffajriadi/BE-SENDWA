import crypto from "crypto";
import prisma from "../../config/db.js";
import { env } from "../../config/env.js";

/** Bandingkan string tanpa bocor timing. */
export const safeEqual = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
};

export const isMasterKey = (key) => !!env.API_KEY && safeEqual(key, env.API_KEY);

/** API key master (personal / admin) via header x-api-key. */
export const checkApiKey = (req, res, next) => {
  if (!isMasterKey(req.headers["x-api-key"])) {
    return res.status(403).json({ error: "masukkan api key yang valid!" });
  }
  next();
};

/** API key master via query ?key= (dipakai webhook pihak ketiga). */
export const checkQueryKey = (req, res, next) => {
  const apiKey = req.query.key;
  if (!apiKey) {
    return res.status(401).json({ message: "API key tidak ditemukan" });
  }
  if (!isMasterKey(apiKey)) {
    return res.status(401).json({ message: "API key tidak valid" });
  }
  next();
};

/** API key bisnis: setiap request memotong 1 token milik key tersebut. */
export const checkApiKeyBuisness = async (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(403).json({ error: "API key wajib dikirim!" });
  }

  try {
    const findKey = await prisma.apiKey.findFirst({ where: { key: apiKey } });
    if (!findKey) {
      return res.status(403).json({ error: "API key tidak valid!" });
    }

    // Kurangi token secara atomic (gagal kalau token sudah habis)
    const { count } = await prisma.apiKey.updateMany({
      where: { id: findKey.id, token: { gt: 0 } },
      data: { token: { decrement: 1 } },
    });
    if (count === 0) {
      return res
        .status(403)
        .json({ error: "Token API key sudah habis, silahkan chat alip!" });
    }

    req.apikeyId = findKey.id;
    next();
  } catch (error) {
    next(error);
  }
};

/** API key project verifikasi WA (header x-api-key). Mengisi req.project. */
export const checkProjectKey = async (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) return res.status(401).json({ message: "API key wajib dikirim di header x-api-key" });

  const project = await prisma.project.findUnique({ where: { api_key: String(apiKey) } });
  if (!project) return res.status(401).json({ message: "API key tidak valid" });
  if (!project.active) return res.status(403).json({ message: "Project sedang nonaktif" });

  req.project = project;
  next();
};
