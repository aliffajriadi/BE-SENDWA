import { profile as getProfile } from "../../func.js";
import { qrcodeGenerate } from "../link-qrcode.js";
import * as helper from "../../list.js";
import prisma from "../../config/db.js";
import paksir from "../../config/payment/index.js";

export const bayar = async (sock, senderNumber, pesan) => {
  try {
    // 1. Ambil data profile
    const pengirim = senderNumber.replace("@s.whatsapp.net", "");
    const userProfile = await getProfile(pengirim);

    if (!userProfile) {
      return await sock.sendMessage(senderNumber, { text: helper.daftar });
    }

    // 2. Parsing Input
    const args = pesan.trim().split(/\s+/);
    const buy_product = args[1]?.toLowerCase();
    const buy_quantity = parseInt(args[2]);
    const products = [{ name: "token", pricePerUnit: 65 }];

    // Fungsi Format Rupiah
    const toIdr = (n) =>
      new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(n);

    // 3. Validasi Input Awal
    if (!buy_product || isNaN(buy_quantity)) {
      const listProduk = products
        .map((p) => `• *${p.name}* (${toIdr(p.pricePerUnit)}/unit)`)
        .join("\n");

      return await sock.sendMessage(senderNumber, {
        text: `*🛍️ DAFTAR PRODUK*\n\n${listProduk}\n\n*Format:* .beli [nama] [jumlah]\nContoh: .beli token 16`,
      });
    }

    // 4. Cari Produk & Validasi
    const selectedProduct = products.find((p) => p.name === buy_product);
    if (!selectedProduct) {
      return await sock.sendMessage(senderNumber, {
        text: "❌ Produk tidak ditemukan!",
      });
    }

    if (buy_quantity < 16) {
      return await sock.sendMessage(senderNumber, {
        text: "⚠️ Minimal pembelian adalah 16 token!",
      });
    }
    if (buy_quantity > 1000) {
      return await sock.sendMessage(senderNumber, {
        text: "⚠️ Maksimal pembelian adalah 1.000 token!",
      });
    }

    // 5. Kalkulasi & Buat Pembayaran ke API
    const totalAmount = selectedProduct.pricePerUnit * buy_quantity;
    const randomString = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    // data langsung berisi amount, fee, dll (tidak di dalam data.payment)
    const data = await paksir.createPayment(
      "qris",
      `INVBOT${randomString}MEDIA`,
      totalAmount,
    );

    // 6. Generate QR Code
    const qrCode = await qrcodeGenerate(data.payment_number);

    // 7. Tampilan Caption (Total diperjelas)
    const caption =
      `✨ *KONFIRMASI PEMBAYARAN* ✨\n\n` +
      `👤 *Pembeli:* ${userProfile.name}\n` +
      `📦 *Produk:* ${selectedProduct.name} (${buy_quantity} unit)\n` +
      `💳 *Metode:* QRIS (All Payment)\n` + // Perbaikan di baris ini
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `💵 *Rincian Biaya:*\n` +
      `• Harga Produk: ${toIdr(data.amount)}\n` +
      `• Biaya Layanan: ${toIdr(data.fee)}\n\n` +
      `📢 *TOTAL PEMBAYARAN:*\n` +
      `*${toIdr(data.total_payment)}*\n\n` + // Lebih simpel penulisannya
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🆔 *Ref ID:* \`${data.order_id}\`\n\n` +
      `⚠️ _Silakan scan QR di atas._\n` +
      `🕒 _Pesan ini otomatis terhapus dalam 3 menit._`;

    const kirimqrpayment = await sock.sendMessage(senderNumber, {
      image: qrCode,
      caption: caption,
    });

    // 8. Simpan ke Database Prisma
    await prisma.payment.create({
      data: {
        user_id: userProfile.nomor,
        payment_number: data.payment_number,
        amount: data.amount,
        status: "pending",
        fee: data.fee,
        total_payment: data.total_payment,
        payment_method: "qris",
        order_id: data.order_id,
        product_buy: selectedProduct.name,
        product_price: selectedProduct.pricePerUnit,
        product_quantity: buy_quantity,
        msg_id: kirimqrpayment.key.id,
        expired_at: new Date(Date.now() + 15 * 60000), // Expired 15 Menit
      },
    });

    // 9. Auto Delete Pesan
    setTimeout(async () => {
      try {
        await sock.sendMessage(senderNumber, { delete: kirimqrpayment.key });
        const cekPayment = await prisma.payment.findUnique({
          where: {
            order_id: data.order_id,
            status: "pending",
          },
        });
        if (cekPayment) {
          const cancel = await paksir.cancelPayment(data.order_id, data.amount);

          await prisma.payment.update({
            where: {
              order_id: data.order_id,
            },
            data: {
              status: cancel.status,
            },
          });
        }
      } catch (err) {
        console.log("Pesan sudah dihapus oleh user.");
      }
    }, 180000);
  } catch (error) {
    console.error("ERROR PADA FUNGSI BAYAR:", error);
    await sock.sendMessage(senderNumber, {
      text: "❌ Terjadi kesalahan teknis. Silahkan hubungi owner.",
    });
  }
};

export const webhookPayment = async (sock, sendMessageSafe, data) => {
  try {
    const dataPayment = await prisma.payment.findUnique({
      where: {
        order_id: data.order_id,
      },
    });

    if (!dataPayment) {
      return console.log(
        `[Webhook] Order ID ${data.order_id} tidak ditemukan di database.`,
      );
    }

    if (data.status !== "completed") {
      return console.log(
        `[Webhook] Order ID ${data.order_id} status belum completed: ${data.status}`,
      );
    }

    if (dataPayment.status === "success") {
      return console.log(
        `[Webhook] Order ID ${data.order_id} sudah diproses sebelumnya.`,
      );
    }

    if (dataPayment.status === "canceled") {
      return console.log(
        `[Webhook] Order ID ${data.order_id} sudah dibatalkan.`,
      );
    }

    if (dataPayment.product_buy === "token") {
      // Update status payment dan tambah token user secara atomic
      await prisma.payment.update({
        where: {
          order_id: data.order_id,
        },
        data: {
          status: "success",
          user: {
            // Menggunakan nama relasi 'user', bukan field 'user_id'
            update: {
              token: {
                increment: dataPayment.product_quantity,
              },
            },
          },
        },
      });

      // Kirim notifikasi sukses ke user
      const jid = dataPayment.user_id + "@s.whatsapp.net";
      await sendMessageSafe(sock, jid, {
        text:
          `✅ *PEMBAYARAN BERHASIL!*\n\n` +
          `📦 *Produk:* ${dataPayment.product_buy} (${dataPayment.product_quantity} unit)\n` +
          `💰 *Total:* Rp ${dataPayment.total_payment.toLocaleString("id-ID")}\n` +
          `🆔 *Order ID:* \`${data.order_id}\`\n\n` +
          `Sisa token Anda telah berhasil ditambahkan. Silakan cek dengan mengetik *.me*.\n` +
          `Terima kasih telah berlangganan! ✨`,
      });

      // Hapus pesan QR Code (jika msg_id tersimpan)
      if (dataPayment.msg_id) {
        try {
          await sendMessageSafe(sock, jid, {
            delete: {
              remoteJid: jid,
              fromMe: true,
              id: dataPayment.msg_id,
            },
          });
        } catch (delErr) {
          console.log(`[Webhook] Gagal menghapus pesan QR: ${delErr.message}`);
        }
      }
    } else {
      // Jika ada jenis produk lain di masa depan
      await prisma.payment.update({
        where: { order_id: data.order_id },
        data: { status: "success" },
      });
      console.log(
        `[Webhook] Order ID ${data.order_id} berhasil diproses (produk: ${dataPayment.product_buy}).`,
      );
    }
  } catch (error) {
    console.error("[Webhook Error]:", error);
  }
};
