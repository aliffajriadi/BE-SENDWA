# BE-SENDWA

Bot WhatsApp ([Baileys](https://github.com/WhiskeySockets/Baileys)) + REST API (Express) + dashboard admin, dengan Prisma/SQLite.

## Menjalankan

```bash
cp .env.example .env   # isi API_KEY, PORT, dll
corepack enable         # sekali saja, supaya perintah pnpm tersedia
pnpm install
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm start              # atau: pnpm dev (auto-reload)
```

Scan QR yang muncul di terminal untuk login WhatsApp. Dashboard admin: `http://localhost:PORT/admin` (login dengan `API_KEY`). Dokumentasi API verifikasi untuk developer app client: `http://localhost:PORT/docs`.

## Struktur

```
index.js                  entry point (load .env lalu src/main.js)
src/
├── main.js               start bot + server HTTP
├── config/               env, prisma (db.js), payment gateway
├── bot/
│   ├── socket.js         koneksi WhatsApp & auto-reconnect
│   ├── handler.js        pipeline pesan masuk
│   ├── context.js        ctx (sender, text, reply, react, getProfile…)
│   ├── router.js         cocokkan pesan → command
│   ├── confess-relay.js  teruskan pesan saat sesi confess aktif
│   ├── middleware/       dedupe & anti-spam
│   └── commands/         daftar command per kategori
├── features/             logic tiap fitur (downloader, media, payment, …)
├── services/             akses database (user, api key)
├── api/
│   ├── server.js         Express app
│   ├── middleware/       autentikasi API key
│   └── routes/           message, payment webhook, token, verifikasi, admin
├── web/admin/            dashboard admin (HTML/CSS/JS statis)
├── web/docs/             dokumentasi API verifikasi WA (/docs)
├── web/verify/           halaman verifikasi untuk user (/verify/:token)
└── utils/                teks menu/balasan, helper WhatsApp
```

## Menambah command baru

1. Tulis logic-nya di `src/features/<kategori>/nama-fitur.js`.
2. Daftarkan di salah satu file `src/bot/commands/*.js`:

```js
{
  name: "contoh",
  match: ".contoh",          // prefix | [prefix…] | { exact: [...] } | { caption: ".x" } | (ctx) => bool
  error: "Gagal menjalankan contoh",
  run: paid(1, (ctx, user) => contohHandler(ctx.sock, ctx.msg, ctx.args)), // potong 1 token kalau sukses
}
```

Tambahkan `owner: true` untuk command khusus owner.

## Endpoint API

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| POST | `/api/kirim` | `x-api-key` master | Kirim teks ke nomor |
| POST | `/api/kirim/pdf` | `x-api-key` master | Kirim dokumen (multipart `file`) |
| POST | `/api/grub` | `x-api-key` master | Kirim teks ke grup |
| POST | `/api/broadcast` | `x-api-key` master | Kirim ke semua anggota grup |
| POST | `/api/kirim-pesan` | `x-api-key` bisnis | Kirim teks (memotong token key, maks 300 karakter) |
| GET | `/api/cek-token?key=` | – | Cek sisa token API key bisnis |
| POST | `/api/webhook-payment?key=` | query key | Webhook Trakteer (saldo) |
| POST | `/api/webhook2-payment?key=` | query key | Webhook Pakasir QRIS (token) |
| POST | `/api/v1/verifications` | `x-api-key` project | Buat verifikasi WA |
| GET | `/api/v1/verifications/:id` | `x-api-key` project | Cek status verifikasi |
| POST | `/api/v1/verifications/:id/simulate` | `x-api-key` project | Simulasi verifikasi berhasil (project sandbox saja) |
| GET | `/api/public/verifications/:token` | – | Data halaman verifikasi publik `/verify/:token` |
| * | `/api/admin/*` | `x-api-key` master | API dashboard admin |

## Verifikasi WhatsApp (reverse OTP)

Cara kerjanya seperti payment gateway, tapi bot **tidak mengirim OTP**: user yang mengirim kode ke bot, jadi nomor bot aman dari banned.

```
App client ──POST /api/v1/verifications──▶ BE-SENDWA ──▶ { code: "VERF-8K2D9Q", bot_number, wa_link, ... }
User kirim "@... VERF-8K2D9Q ..." ke bot ──▶ bot cocokkan ──▶ webhook ke project
```

**Setup:** dashboard admin → **Projects** → *Buat Project*. Setiap project mendapat `API key` (`pk_live_…`) dan `webhook secret` (`whsec_…`) sendiri, dan bisa diatur Webhook URL, masa berlaku default, serta respon bot (diam / emoji / pesan).

### 1. Buat verifikasi

```bash
curl -X POST http://localhost:3000/api/v1/verifications \
  -H "x-api-key: pk_live_xxx" -H "Content-Type: application/json" \
  -d '{ "phone": "081234567890", "reference": "user_123", "expires_in": 600 }'
```

| Field | Wajib | Keterangan |
|---|---|---|
| `phone` | – | Kalau diisi, hanya nomor ini yang bisa verifikasi |
| `reference` | – | ID dari app client, ikut dikirim di webhook |
| `expires_in` | – | Detik, 60–86400 (default: setting project) |

Response `201`:

```json
{
  "id": "cmi8...", "code": "VERF-8K2D9Q", "phone": "6281234567890", "reference": "user_123",
  "status": "pending", "prefix": "@", "bot_number": "6281111111111",
  "wa_link": "https://wa.me/6281111111111?text=%40Verifikasi%20VERF-8K2D9Q",
  "verification_url": "https://domain-kamu.com/verify/gQvVZmP6SzpeIs7qvk4fxpjm",
  "expires_at": "...", "verified_at": null, "webhook_status": null, "created_at": "..."
}
```

### 2. User mengirim pesan ke bot

Aturan (hardcode di bot): pesan **diawali `@`** dan **berisi kode `VERF-XXXXXX`** di mana saja (huruf besar/kecil bebas). Isi lainnya bebas disusun app client:

```js
const text = `@Halo, saya ingin verifikasi akun TokoKu.\nKode: ${data.code}\n\nSetelah itu kembali ke https://tokoku.com`;
const link = `https://wa.me/${data.bot_number}?text=${encodeURIComponent(text)}`;
```

Atau pakai `wa_link` dari response (pesan default `@Verifikasi VERF-XXXXXX`), atau redirect user ke **`verification_url`**: halaman verifikasi siap pakai (`/verify/<token>`) berisi kode, tombol WhatsApp, QR code, hitung mundur, dan status yang berubah otomatis, seperti halaman invoice payment gateway. Set `PUBLIC_URL` di `.env` supaya link-nya memakai domain publik.

Admin juga bisa membuat verifikasi manual dari dashboard → **Verifikasi WA → Buat Verifikasi** (seperti membuat invoice), lalu mengirim link-nya ke user.

Pesan `@…` di chat pribadi langsung diproses jalur verifikasi tanpa melewati command lain, dengan batas 5 percobaan per nomor per menit.

Respon bot ke user diatur per project: `none` (diam, default), `reaction` (emoji ✅/❌/⌛/ℹ️), atau `message` (balas teks). Kode tidak dikenal / tanpa kode / kena rate limit selalu diabaikan tanpa respon.

### 3. Webhook

Dikirim sekali ke Webhook URL project saat berhasil. Kalau gagal, kirim ulang dari dashboard atau polling `GET /api/v1/verifications/:id`.

```http
POST <webhook_url>
X-Webhook-Event: verification.success
X-Webhook-Timestamp: 1763719333
X-Webhook-Signature: sha256=<hex>

{ "event": "verification.success", "id": "...", "code": "VERF-8K2D9Q",
  "phone": "6281234567890", "reference": "user_123", "verified_at": "..." }
```

Signature = `HMAC-SHA256(webhook_secret, "<timestamp>.<raw body>")`. Cek di app client:

```js
const ts = req.headers["x-webhook-timestamp"];
const expected = "sha256=" + crypto.createHmac("sha256", WEBHOOK_SECRET).update(`${ts}.${rawBody}`).digest("hex");
const valid =
  expected.length === req.headers["x-webhook-signature"]?.length &&
  crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(req.headers["x-webhook-signature"])) &&
  Math.abs(Date.now() / 1000 - Number(ts)) < 300; // tolak webhook lama (replay)
if (!valid) return res.status(401).end();
```

### 4. Simulasi (sandbox)

Untuk development tanpa WhatsApp: aktifkan **Mode sandbox** di project (dashboard → Projects → Edit), lalu:

```bash
curl -X POST http://localhost:3000/api/v1/verifications/<id>/simulate -H "x-api-key: pk_live_xxx" \
  -H "Content-Type: application/json" -d '{"phone": "081234567890"}'   # phone opsional
```

Status jadi `verified` dan webhook dikirim sungguhan (signature valid). Bisa juga lewat tombol simulasi di halaman `verification_url` atau di dashboard. Project non-sandbox menolak simulasi (`403`).
