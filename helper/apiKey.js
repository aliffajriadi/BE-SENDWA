import * as query from "./crud-Key.js"
export const checkApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(403).json({ error: "masukkan api key yang valid!" });
  }

  next();
};

export const checkApiKeyBuisness = async (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(403).json({ error: "API key wajib dikirim!" });
  }

  // Cari apakah API key ada di JSON
  const findKey = await query.readDataBy("key", apiKey);

  if (!findKey) {
    return res.status(403).json({ error: "API key tidak valid!" });
  }

  // Cek token habis
  if (findKey.token <= 0) {
    return res.status(403).json({ error: "Token API key sudah habis, silahkan chat alip!" });
  }

  // Kurangi token (satu kali penggunaan)
  const newToken = findKey.token - 1;

  // Update JSON
  await query.updateData("id", findKey.id, { token: newToken });

  next();
};
