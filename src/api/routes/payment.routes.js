import { Router } from "express";
import { checkQueryKey } from "../middleware/auth.js";
import { topUp } from "../../features/payment/top-up.js";
import { webhookPayment } from "../../features/payment/bayar.js";
import { sendMessageSafe } from "../../utils/whatsapp.js";

/** Webhook dari payment gateway. Autentikasi via ?key=API_KEY. */
export const paymentRoutes = ({ getSock }) => {
  const router = Router();

  // Trakteer → tambah saldo
  router.post("/webhook-payment", checkQueryKey, async (req, res) => {
    try {
      await topUp(getSock, req.body, sendMessageSafe);
      return res.status(200).json({ message: "Top Up berhasil" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Top Up gagal" });
    }
  });

  // Pakasir (QRIS) → tambah token
  router.post("/webhook2-payment", checkQueryKey, async (req, res) => {
    try {
      await webhookPayment(getSock, sendMessageSafe, req.body);
      return res.status(200).json({ message: "Top Up berhasil" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Top Up gagal" });
    }
  });

  return router;
};
