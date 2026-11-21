"use strict";

/* ═══════════════ Helpers ═══════════════ */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Escape teks sebelum dimasukkan ke innerHTML (nama user diisi bebas dari WhatsApp). */
const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const rupiah = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);
const num = (n) => new Intl.NumberFormat("id-ID").format(n || 0);
const dateFmt = (d) =>
  d ? new Date(d).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

const relTime = (d) => {
  const s = Math.round((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "baru saja";
  if (s < 3600) return `${Math.floor(s / 60)} menit lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
  return `${Math.floor(s / 86400)} hari lalu`;
};

const AVATAR_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#14b8a6"];
const avatar = (name) => {
  const s = String(name || "?");
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const initials = s.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  return `<span class="avatar" style="background:${AVATAR_COLORS[h % AVATAR_COLORS.length]}">${esc(initials)}</span>`;
};

const storage = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  del: (k) => { try { localStorage.removeItem(k); } catch {} },
};

/* ═══════════════ Toast ═══════════════ */
const toast = (message, type = "success") => {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  $("#toasts").append(el);
  setTimeout(() => {
    el.classList.add("hide");
    setTimeout(() => el.remove(), 250);
  }, 3000);
};

/* ═══════════════ API ═══════════════ */
const KEY_STORAGE = "sendwa_admin_key";
let adminKey = storage.get(KEY_STORAGE);

const api = async (path, { method = "GET", body } = {}) => {
  const res = await fetch(`/api/admin${path}`, {
    method,
    headers: { "Content-Type": "application/json", "x-api-key": adminKey || "" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 || res.status === 403) {
    logout();
    throw new Error("Sesi berakhir, silakan login lagi");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request gagal (${res.status})`);
  return data;
};

/* ═══════════════ State ═══════════════ */
const state = {
  view: "overview",
  users: [],
  keys: [],
  payments: [],
  verifications: [],
  projects: [],
  stats: null,
  payStatus: "",
  verStatus: "",
  verProject: "",
  sort: { users: { key: "token", dir: "desc" }, apikeys: { key: "createdAt", dir: "desc" } },
};

const VIEWS = {
  overview: { title: "Ringkasan", subtitle: "Gambaran umum bot dan pengguna" },
  users: { title: "Users", subtitle: "Kelola pengguna bot, token, dan saldo" },
  apikeys: { title: "API Keys", subtitle: "Key untuk klien bisnis endpoint /api/kirim-pesan" },
  payments: { title: "Pembayaran", subtitle: "Riwayat transaksi QRIS (100 terakhir)" },
  projects: { title: "Projects", subtitle: "Aplikasi client yang memakai verifikasi WhatsApp" },
  verifications: { title: "Verifikasi WA", subtitle: "User mengirim @… VERF-XXXXXX ke bot, lalu webhook dikirim ke project (100 terakhir)" },
};

/* ═══════════════ Auth ═══════════════ */
function showLogin() {
  $("#app").hidden = true;
  $("#login").hidden = false;
  $("#loginKey").focus();
}

function logout() {
  adminKey = null;
  storage.del(KEY_STORAGE);
  showLogin();
}

$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("#loginBtn");
  const err = $("#loginError");
  const key = $("#loginKey").value.trim();
  btn.disabled = true;
  err.hidden = true;
  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    const data = await res.json().catch(() => ({}));
    if (!data.success) throw new Error(data.message || "API Key salah");
    adminKey = key;
    storage.set(KEY_STORAGE, key);
    $("#loginKey").value = "";
    startApp();
  } catch (error) {
    err.textContent = error.message;
    err.hidden = false;
  } finally {
    btn.disabled = false;
  }
});

$("#logoutBtn").addEventListener("click", logout);

/* ═══════════════ Theme ═══════════════ */
const isDark = () =>
  document.documentElement.dataset.theme
    ? document.documentElement.dataset.theme === "dark"
    : matchMedia("(prefers-color-scheme: dark)").matches;

const syncThemeIcon = () => {
  $("#themeBtn use").setAttribute("href", isDark() ? "#i-sun" : "#i-moon");
};
$("#themeBtn").addEventListener("click", () => {
  const next = isDark() ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  storage.set("sendwa_theme", next);
  syncThemeIcon();
});
syncThemeIcon();

/* ═══════════════ Navigation ═══════════════ */
function setView(view) {
  if (!VIEWS[view]) view = "overview";
  state.view = view;
  $$(".view").forEach((v) => (v.hidden = v.dataset.view !== view));
  $$(".nav-item").forEach((n) => n.classList.toggle("active", n.dataset.view === view));
  $("#viewTitle").textContent = VIEWS[view].title;
  $("#viewSubtitle").textContent = VIEWS[view].subtitle;
  if (location.hash !== `#${view}`) history.replaceState(null, "", `#${view}`);
}

$("#nav").addEventListener("click", (e) => {
  const btn = e.target.closest(".nav-item");
  if (btn) setView(btn.dataset.view);
});
$$("[data-goto]").forEach((b) => b.addEventListener("click", () => setView(b.dataset.goto)));

/* ═══════════════ Load data ═══════════════ */
async function loadAll({ silent = false } = {}) {
  const btn = $("#refreshBtn");
  btn.classList.add("spin");
  try {
    const [stats, users, keys, payments, verifications, projects] = await Promise.all([
      api("/stats"),
      api("/users"),
      api("/apikeys"),
      api("/payments?limit=100"),
      api("/verifications?limit=100"),
      api("/projects"),
    ]);
    Object.assign(state, { stats, users, keys, payments, verifications, projects });
    renderAll();
    if (!silent) toast("Data diperbarui");
  } catch (error) {
    toast(error.message, "error");
  } finally {
    btn.classList.remove("spin");
  }
}

async function loadStatus() {
  try {
    const { bot } = await api("/status");
    const labels = { open: "Terhubung", connecting: "Menghubungkan…", qr: "Menunggu scan QR", close: "Terputus" };
    $("#botStatus").dataset.state = bot.state;
    $("#botStatusText").textContent = labels[bot.state] || bot.state;
  } catch {
    $("#botStatus").dataset.state = "close";
    $("#botStatusText").textContent = "Tidak diketahui";
  }
}

$("#refreshBtn").addEventListener("click", () => {
  loadAll();
  loadStatus();
});

function renderAll() {
  renderStats();
  renderUsers();
  renderKeys();
  renderPayments();
  renderProjects();
  renderVerifications();
}

/* ═══════════════ Overview ═══════════════ */
function renderStats() {
  const s = state.stats || {};
  const set = (k, v) => ($(`[data-stat="${k}"]`).textContent = v);
  set("users", num(s.users));
  set("totalToken", num(s.totalToken));
  set("totalSaldo", rupiah(s.totalSaldo));
  set("revenue", rupiah(s.revenue));
  set("paymentsSuccess", `${num(s.paymentsSuccess)} transaksi sukses`);

  const top = [...state.users].sort((a, b) => b.token - a.token).slice(0, 5);
  $("#topUsers").innerHTML = top.length
    ? top
        .map(
          (u, i) => `<li>
            <span class="pos">${i + 1}</span>${avatar(u.name)}
            <div class="grow"><div class="name">${esc(u.name)}</div><div class="sub">${esc(u.nomor)}</div></div>
            <span class="token-pill">${num(u.token)} token</span>
          </li>`,
        )
        .join("")
    : `<li class="list-empty">Belum ada user</li>`;

  const recent = state.payments.slice(0, 5);
  $("#recentPayments").innerHTML = recent.length
    ? recent
        .map(
          (p) => `<li>
            ${avatar(p.user?.name || p.user_id)}
            <div class="grow"><div class="name">${esc(p.user?.name || p.user_id)}</div>
            <div class="sub">${esc(p.product_quantity)} ${esc(p.product_buy)} · ${relTime(p.createdAt)}</div></div>
            <div style="text-align:right"><div class="token-pill">${rupiah(p.total_payment)}</div>${statusBadge(p.status)}</div>
          </li>`,
        )
        .join("")
    : `<li class="list-empty">Belum ada pembayaran</li>`;
}

/* ═══════════════ Sorting ═══════════════ */
const sortBy = (list, { key, dir }) => {
  const m = dir === "asc" ? 1 : -1;
  return [...list].sort((a, b) => {
    const x = a[key], y = b[key];
    if (typeof x === "number" && typeof y === "number") return (x - y) * m;
    return String(x ?? "").localeCompare(String(y ?? ""), "id", { numeric: true }) * m;
  });
};

function bindSort(section, render) {
  $$(`[data-view="${section}"] th[data-sort]`).forEach((th) => {
    th.addEventListener("click", () => {
      const cur = state.sort[section];
      const key = th.dataset.sort;
      state.sort[section] = { key, dir: cur.key === key && cur.dir === "desc" ? "asc" : "desc" };
      render();
    });
  });
}

const paintSortHeaders = (section) => {
  const { key, dir } = state.sort[section];
  $$(`[data-view="${section}"] th[data-sort]`).forEach((th) => {
    if (th.dataset.sort === key) th.dataset.dir = dir;
    else delete th.dataset.dir;
  });
};

/* ═══════════════ Users ═══════════════ */
function renderUsers() {
  const q = $("#userSearch").value.trim().toLowerCase();
  const list = sortBy(
    state.users.filter((u) => !q || u.name.toLowerCase().includes(q) || u.nomor.includes(q)),
    state.sort.users,
  );
  paintSortHeaders("users");

  $("#usersBody").innerHTML = list
    .map(
      (u) => `<tr>
        <td class="cell-main"><div class="cell-user">${avatar(u.name)}<span>${esc(u.name)}</span></div></td>
        <td class="mono" data-label="Nomor">${esc(u.nomor)}</td>
        <td class="num" data-label="Token"><span class="token-pill ${u.token <= 0 ? "zero" : ""}">${num(u.token)}</span></td>
        <td class="num" data-label="Saldo">${rupiah(u.saldo)}</td>
        <td data-label="Free event">${u.free_event ? '<span class="badge badge-green">Tersedia</span>' : '<span class="badge badge-gray">Sudah claim</span>'}</td>
        <td class="cell-actions-td"><div class="cell-actions">
          <button class="icon-btn" data-edit-user="${esc(u.nomor)}" title="Edit" aria-label="Edit"><svg><use href="#i-edit"/></svg></button>
          <button class="icon-btn danger" data-del-user="${esc(u.nomor)}" title="Hapus" aria-label="Hapus"><svg><use href="#i-trash"/></svg></button>
        </div></td>
      </tr>`,
    )
    .join("");
  $("#usersEmpty").hidden = list.length > 0;
  $("#usersCount").textContent = `Menampilkan ${num(list.length)} dari ${num(state.users.length)} user`;
}

$("#userSearch").addEventListener("input", renderUsers);
bindSort("users", renderUsers);

$("#usersBody").addEventListener("click", async (e) => {
  const edit = e.target.closest("[data-edit-user]");
  const del = e.target.closest("[data-del-user]");
  if (edit) openUserModal(state.users.find((u) => u.nomor === edit.dataset.editUser));
  if (del) {
    const u = state.users.find((x) => x.nomor === del.dataset.delUser);
    if (await confirmDialog("Hapus user?", `${u.name} (${u.nomor}) beserta riwayat pembayarannya akan dihapus permanen.`)) {
      try {
        await api(`/users/${encodeURIComponent(u.nomor)}`, { method: "DELETE" });
        toast("User dihapus");
        loadAll({ silent: true });
      } catch (error) {
        toast(error.message, "error");
      }
    }
  }
});

function openUserModal(u) {
  const editing = !!u;
  $("#userModalTitle").textContent = editing ? "Edit User" : "Tambah User";
  $("#fNomor").value = u?.nomor ?? "";
  $("#fNomor").readOnly = editing;
  $("#fName").value = u?.name ?? "";
  $("#fToken").value = u?.token ?? 10;
  $("#fSaldo").value = u?.saldo ?? 0;
  $("#fFree").checked = u?.free_event ?? true;
  $("#userModal").showModal();
  (editing ? $("#fName") : $("#fNomor")).focus();
}
$("#addUserBtn").addEventListener("click", () => openUserModal());

$("#userForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await api("/users", {
      method: "POST",
      body: {
        nomor: $("#fNomor").value.trim(),
        name: $("#fName").value.trim(),
        token: Number($("#fToken").value),
        saldo: Number($("#fSaldo").value),
        free_event: $("#fFree").checked,
      },
    });
    $("#userModal").close();
    toast("User disimpan");
    loadAll({ silent: true });
  } catch (error) {
    toast(error.message, "error");
  }
});

/* ═══════════════ API Keys ═══════════════ */
const maskKey = (k) => (k.length > 10 ? `${k.slice(0, 6)}••••${k.slice(-4)}` : k);

function renderKeys() {
  const q = $("#keySearch").value.trim().toLowerCase();
  const list = sortBy(
    state.keys.filter(
      (k) => !q || k.owner.toLowerCase().includes(q) || k.id.toLowerCase().includes(q) || k.key.toLowerCase().includes(q),
    ),
    state.sort.apikeys,
  );
  paintSortHeaders("apikeys");

  $("#keysBody").innerHTML = list
    .map(
      (k) => `<tr>
        <td class="cell-main"><div class="cell-user">${avatar(k.owner)}<span>${esc(k.owner)}</span></div></td>
        <td class="mono" data-label="ID">${esc(k.id)}</td>
        <td data-label="Key"><div class="key-cell"><code title="${esc(k.key)}">${esc(maskKey(k.key))}</code>
          <button class="icon-btn" data-copy="${esc(k.key)}" title="Salin key" aria-label="Salin key"><svg><use href="#i-copy"/></svg></button></div></td>
        <td class="num" data-label="Sisa token"><span class="token-pill ${k.token <= 0 ? "zero" : ""}">${num(k.token)}</span></td>
        <td class="muted" data-label="Dibuat">${dateFmt(k.createdAt)}</td>
        <td class="cell-actions-td"><div class="cell-actions">
          <button class="icon-btn" data-edit-key="${esc(k.id)}" title="Edit" aria-label="Edit"><svg><use href="#i-edit"/></svg></button>
          <button class="icon-btn danger" data-del-key="${esc(k.id)}" title="Hapus" aria-label="Hapus"><svg><use href="#i-trash"/></svg></button>
        </div></td>
      </tr>`,
    )
    .join("");
  $("#keysEmpty").hidden = list.length > 0;
}

$("#keySearch").addEventListener("input", renderKeys);
bindSort("apikeys", renderKeys);

$("#keysBody").addEventListener("click", async (e) => {
  const copy = e.target.closest("[data-copy]");
  const edit = e.target.closest("[data-edit-key]");
  const del = e.target.closest("[data-del-key]");
  if (copy) {
    try {
      await navigator.clipboard.writeText(copy.dataset.copy);
      toast("Key disalin ke clipboard");
    } catch {
      toast("Gagal menyalin", "error");
    }
  }
  if (edit) openKeyModal(state.keys.find((k) => k.id === edit.dataset.editKey));
  if (del) {
    const k = state.keys.find((x) => x.id === del.dataset.delKey);
    if (await confirmDialog("Hapus API key?", `Key milik ${k.owner} akan langsung berhenti berfungsi.`)) {
      try {
        await api(`/apikeys/${encodeURIComponent(k.id)}`, { method: "DELETE" });
        toast("API key dihapus");
        loadAll({ silent: true });
      } catch (error) {
        toast(error.message, "error");
      }
    }
  }
});

const randomKey = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return "sk_" + [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
};

function openKeyModal(k) {
  const editing = !!k;
  $("#keyModalTitle").textContent = editing ? "Edit API Key" : "Tambah API Key";
  $("#kId").value = k?.id ?? String(Date.now());
  $("#kId").readOnly = editing;
  $("#kKey").value = k?.key ?? randomKey();
  $("#kOwner").value = k?.owner ?? "";
  $("#kToken").value = k?.token ?? 100;
  $("#keyModal").showModal();
  $("#kOwner").focus();
}
$("#addKeyBtn").addEventListener("click", () => openKeyModal());
$("#genKeyBtn").addEventListener("click", () => ($("#kKey").value = randomKey()));

$("#keyForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await api("/apikeys", {
      method: "POST",
      body: {
        id: $("#kId").value.trim(),
        key: $("#kKey").value.trim(),
        owner: $("#kOwner").value.trim(),
        token: Number($("#kToken").value),
      },
    });
    $("#keyModal").close();
    toast("API key disimpan");
    loadAll({ silent: true });
  } catch (error) {
    toast(error.message, "error");
  }
});

/* ═══════════════ Payments ═══════════════ */
function statusBadge(status) {
  const map = {
    success: ["badge-green", "Sukses"],
    completed: ["badge-green", "Sukses"],
    pending: ["badge-amber", "Pending"],
    canceled: ["badge-red", "Batal"],
    cancelled: ["badge-red", "Batal"],
    verified: ["badge-green", "Terverifikasi"],
    expired: ["badge-gray", "Expired"],
    sent: ["badge-green", "Terkirim"],
    failed: ["badge-red", "Gagal"],
  };
  const [cls, label] = map[status] || ["badge-gray", status];
  return `<span class="badge ${cls}">${esc(label)}</span>`;
}

function renderPayments() {
  const q = $("#paySearch").value.trim().toLowerCase();
  const list = state.payments.filter((p) => {
    if (state.payStatus && p.status !== state.payStatus) return false;
    if (!q) return true;
    return [p.order_id, p.user_id, p.user?.name].some((v) => String(v ?? "").toLowerCase().includes(q));
  });

  $("#payBody").innerHTML = list
    .map(
      (p) => `<tr>
        <td class="mono" data-label="Order ID">${esc(p.order_id)}</td>
        <td class="cell-main"><div class="cell-user">${avatar(p.user?.name || p.user_id)}<div>
          <div>${esc(p.user?.name || "-")}</div><div class="muted mono" style="font-weight:400;font-size:12px">${esc(p.user_id)}</div></div></div></td>
        <td data-label="Produk">${num(p.product_quantity)} ${esc(p.product_buy)}</td>
        <td class="num" data-label="Total"><b>${rupiah(p.total_payment)}</b><div class="muted" style="font-size:12px">fee ${rupiah(p.fee)}</div></td>
        <td data-label="Status">${statusBadge(p.status)}</td>
        <td class="muted" data-label="Waktu">${dateFmt(p.createdAt)}</td>
      </tr>`,
    )
    .join("");
  $("#payEmpty").hidden = list.length > 0;
}

$("#paySearch").addEventListener("input", renderPayments);
$("#payFilter").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  state.payStatus = btn.dataset.status;
  $$("#payFilter button").forEach((b) => b.classList.toggle("active", b === btn));
  renderPayments();
});

/* ═══════════════ Projects ═══════════════ */
const REPLY_LABELS = { none: "Tidak merespon", reaction: "Reaksi emoji", message: "Balas pesan" };

const copyText = async (text, label) => {
  try {
    await navigator.clipboard.writeText(text);
    toast(`${label} disalin ke clipboard`);
  } catch {
    toast("Gagal menyalin", "error");
  }
};

function renderProjects() {
  $("#projectGrid").innerHTML = state.projects
    .map(
      (p) => `<article class="panel project-card ${p.active ? "" : "inactive"}">
        <div class="project-head">
          <div><h3>${esc(p.name)}</h3>${p.active ? '<span class="badge badge-green">Aktif</span>' : '<span class="badge badge-gray">Nonaktif</span>'}
            ${p.sandbox ? '<span class="badge badge-amber">Sandbox</span>' : ""}</div>
          <div class="cell-actions">
            <button class="icon-btn" data-edit-project="${esc(p.id)}" title="Edit" aria-label="Edit project"><svg><use href="#i-edit"/></svg></button>
            <button class="icon-btn danger" data-del-project="${esc(p.id)}" title="Hapus" aria-label="Hapus project"><svg><use href="#i-trash"/></svg></button>
          </div>
        </div>
        <dl class="project-meta">
          <dt>API key</dt><dd><div class="key-cell"><code>${esc(maskKey(p.api_key))}</code>
            <button class="icon-btn" data-copy-key="${esc(p.id)}" title="Salin API key" aria-label="Salin API key"><svg><use href="#i-copy"/></svg></button></div></dd>
          <dt>Webhook</dt><dd title="${esc(p.webhook_url || "")}">${p.webhook_url ? esc(p.webhook_url) : '<span class="muted">belum diatur</span>'}</dd>
          <dt>Berlaku</dt><dd>${num(p.expires_in)} detik</dd>
          <dt>Respon</dt><dd>${esc(REPLY_LABELS[p.reply_mode] || p.reply_mode)}</dd>
        </dl>
        <div class="project-stats"><span><b>${num(p.total)}</b> request</span><span><b>${num(p.verified)}</b> terverifikasi</span></div>
        <div class="project-actions">
          <button class="btn btn-ghost" data-test-project="${esc(p.id)}"><svg><use href="#i-send"/></svg>Test</button>
          <button class="btn btn-ghost" data-goto-ver="${esc(p.id)}"><svg><use href="#i-shield"/></svg>Riwayat</button>
        </div>
      </article>`,
    )
    .join("");
  $("#projectEmpty").hidden = state.projects.length > 0;

  // Opsi filter project di halaman verifikasi
  $("#verProject").innerHTML =
    `<option value="">Semua project</option>` +
    state.projects.map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("");
  $("#verProject").value = state.verProject;
}

/** Tampilkan hasil verifikasi baru seperti invoice: kode + link halaman verifikasi. */
let resultVer = null;

async function simulateVer(id) {
  try {
    await api(`/verifications/${encodeURIComponent(id)}/simulate`, { method: "POST", body: {} });
    toast("Simulasi berhasil, webhook dikirim ke project");
    loadAll({ silent: true });
    return true;
  } catch (error) {
    toast(error.message, "error");
    return false;
  }
}

function showVerResult(v) {
  resultVer = v;
  $("#vrSimulate").hidden = !v.sandbox;
  $("#vrCode").textContent = v.code;
  $("#vrExpires").textContent = `${v.project} · berlaku sampai ${dateFmt(v.expires_at)}`;
  $("#vrLink").value = v.verification_url;
  $("#vrOpen").href = v.verification_url;
  // Kirim link lewat WhatsApp admin ke nomor user (kalau nomornya diisi)
  $("#vrShare").hidden = !v.phone;
  if (v.phone) {
    const text = `Silahkan verifikasi nomor WhatsApp kamu untuk ${v.project} melalui link berikut:\n${v.verification_url}`;
    $("#vrShare").href = `https://wa.me/${v.phone}?text=${encodeURIComponent(text)}`;
  }
  $("#verResultModal").showModal();
}

let editingProject = null;

function openProjectModal(p) {
  editingProject = p ?? null;
  $("#projectModalTitle").textContent = p ? "Edit Project" : "Buat Project";
  $("#pName").value = p?.name ?? "";
  $("#pWebhook").value = p?.webhook_url ?? "";
  $("#pExpires").value = p?.expires_in ?? 300;
  $("#pSuccess").value = p?.success_message ?? "";
  $("#pReply").value = p?.reply_mode ?? "none";
  $("#pSuccessField").hidden = $("#pReply").value !== "message";
  $("#pActive").checked = p?.active ?? true;
  $("#pSandbox").checked = p?.sandbox ?? false;
  $("#pCreds").hidden = !p;
  $("#pKey").value = p?.api_key ?? "";
  $("#pSecret").value = p?.webhook_secret ?? "";
  $("#projectModal").showModal();
  $("#pName").focus();
}

$("#addProjectBtn").addEventListener("click", () => openProjectModal());
$("#pReply").addEventListener("change", (e) => ($("#pSuccessField").hidden = e.target.value !== "message"));

$("#projectGrid").addEventListener("click", async (e) => {
  const find = (attr) => {
    const el = e.target.closest(`[${attr}]`);
    return el && state.projects.find((p) => p.id === el.getAttribute(attr));
  };
  const edit = find("data-edit-project");
  const del = find("data-del-project");
  const copy = find("data-copy-key");
  const test = find("data-test-project");
  const goto = find("data-goto-ver");

  if (edit) openProjectModal(edit);
  if (copy) copyText(copy.api_key, "API key");
  if (goto) {
    state.verProject = goto.id;
    $("#verProject").value = goto.id;
    renderVerifications();
    setView("verifications");
  }
  if (test) {
    try {
      showVerResult(await api(`/projects/${encodeURIComponent(test.id)}/verifications`, { method: "POST", body: {} }));
      loadAll({ silent: true });
    } catch (error) {
      toast(error.message, "error");
    }
  }
  if (del && (await confirmDialog("Hapus project?", `${del.name} beserta seluruh riwayat verifikasinya akan dihapus, dan API key-nya langsung berhenti berfungsi.`))) {
    try {
      await api(`/projects/${encodeURIComponent(del.id)}`, { method: "DELETE" });
      toast("Project dihapus");
      loadAll({ silent: true });
    } catch (error) {
      toast(error.message, "error");
    }
  }
});

$("#projectForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = {
    name: $("#pName").value.trim(),
    webhook_url: $("#pWebhook").value.trim(),
    expires_in: Number($("#pExpires").value),
    reply_mode: $("#pReply").value,
    success_message: $("#pSuccess").value.trim(),
    active: $("#pActive").checked,
    sandbox: $("#pSandbox").checked,
  };
  try {
    if (editingProject) {
      await api(`/projects/${encodeURIComponent(editingProject.id)}`, { method: "PUT", body });
      $("#projectModal").close();
      toast("Project disimpan");
    } else {
      // Setelah dibuat, langsung tampilkan API key & secret-nya
      const created = await api("/projects", { method: "POST", body });
      toast("Project dibuat, salin API key & webhook secret di bawah");
      openProjectModal(created);
    }
    loadAll({ silent: true });
  } catch (error) {
    toast(error.message, "error");
  }
});

$("#pCreds").addEventListener("click", async (e) => {
  const copy = e.target.closest("[data-copy-input]");
  const rotate = e.target.closest("[data-rotate]");
  if (copy) copyText($(`#${copy.dataset.copyInput}`).value, copy.dataset.copyInput === "pKey" ? "API key" : "Webhook secret");
  if (rotate && editingProject) {
    const field = rotate.dataset.rotate;
    const label = field === "api_key" ? "API key" : "Webhook secret";
    $("#projectModal").close();
    const ok = await confirmDialog(`Generate ulang ${label}?`, `${label} lama milik ${editingProject.name} langsung tidak berlaku. App client harus memakai yang baru.`);
    if (!ok) return openProjectModal(editingProject);
    try {
      const updated = await api(`/projects/${encodeURIComponent(editingProject.id)}/rotate`, { method: "POST", body: { field } });
      toast(`${label} baru dibuat`);
      openProjectModal(updated);
      loadAll({ silent: true });
    } catch (error) {
      toast(error.message, "error");
    }
  }
});

/* ═══════════════ Verifikasi WA ═══════════════ */
function renderVerifications() {
  const q = $("#verSearch").value.trim().toLowerCase();
  const list = state.verifications.filter((v) => {
    if (state.verStatus && v.status !== state.verStatus) return false;
    if (state.verProject && v.project_id !== state.verProject) return false;
    if (!q) return true;
    return [v.code, v.phone, v.verified_phone, v.reference].some((x) => String(x ?? "").toLowerCase().includes(q));
  });

  $("#verBody").innerHTML = list
    .map((v) => {
      const canResend = v.status === "verified" && v.project?.webhook_url;
      const canSimulate = v.status === "pending" && v.project?.sandbox;
      return `<tr>
        <td class="mono cell-main" data-label="Kode">${esc(v.code)}</td>
        <td data-label="Project">${esc(v.project?.name || "-")}</td>
        <td class="mono" data-label="Nomor">${esc(v.verified_phone || v.phone || "-")}</td>
        <td data-label="Reference">${esc(v.reference || "-")}</td>
        <td data-label="Status">${statusBadge(v.status)}</td>
        <td data-label="Webhook">${v.webhook_status ? statusBadge(v.webhook_status) : '<span class="muted">-</span>'}</td>
        <td class="muted" data-label="Dibuat">${dateFmt(v.createdAt)}</td>
        <td class="cell-actions-td"><div class="cell-actions">
          <button class="icon-btn" data-copy-ver="${esc(v.verification_url)}" title="Salin link verifikasi" aria-label="Salin link verifikasi"><svg><use href="#i-copy"/></svg></button>
          ${canSimulate ? `<button class="icon-btn" data-sim-ver="${esc(v.id)}" title="Simulasi verifikasi berhasil (sandbox)" aria-label="Simulasi verifikasi berhasil"><svg><use href="#i-check"/></svg></button>` : ""}
          ${canResend ? `<button class="icon-btn" data-resend-ver="${esc(v.id)}" title="Kirim ulang webhook" aria-label="Kirim ulang webhook"><svg><use href="#i-send"/></svg></button>` : ""}
          <button class="icon-btn danger" data-del-ver="${esc(v.id)}" title="Hapus" aria-label="Hapus"><svg><use href="#i-trash"/></svg></button>
        </div></td>
      </tr>`;
    })
    .join("");
  $("#verEmpty").hidden = list.length > 0;
}

$("#verSearch").addEventListener("input", renderVerifications);
$("#verProject").addEventListener("change", (e) => {
  state.verProject = e.target.value;
  renderVerifications();
});
$("#verFilter").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  state.verStatus = btn.dataset.status;
  $$("#verFilter button").forEach((b) => b.classList.toggle("active", b === btn));
  renderVerifications();
});

$("#verBody").addEventListener("click", async (e) => {
  const sim = e.target.closest("[data-sim-ver]");
  if (sim) simulateVer(sim.dataset.simVer);
  const copyLink = e.target.closest("[data-copy-ver]");
  if (copyLink) copyText(copyLink.dataset.copyVer, "Link verifikasi");
  const resend = e.target.closest("[data-resend-ver]");
  const del = e.target.closest("[data-del-ver]");
  if (resend) {
    try {
      const { webhook_status } = await api(`/verifications/${encodeURIComponent(resend.dataset.resendVer)}/webhook`, { method: "POST" });
      toast(webhook_status === "sent" ? "Webhook terkirim" : "Webhook gagal dikirim", webhook_status === "sent" ? "success" : "error");
      loadAll({ silent: true });
    } catch (error) {
      toast(error.message, "error");
    }
  }
  if (del) {
    const v = state.verifications.find((x) => x.id === del.dataset.delVer);
    if (await confirmDialog("Hapus verifikasi?", `Kode ${v.code} akan dihapus dan tidak bisa dipakai lagi.`)) {
      try {
        await api(`/verifications/${encodeURIComponent(v.id)}`, { method: "DELETE" });
        toast("Verifikasi dihapus");
        loadAll({ silent: true });
      } catch (error) {
        toast(error.message, "error");
      }
    }
  }
});

$("#vrSimulate").addEventListener("click", async () => {
  if (resultVer && (await simulateVer(resultVer.id))) $("#verResultModal").close();
});

$("#vrCopy").addEventListener("click", () => copyText($("#vrLink").value, "Link"));

$("#addVerBtn").addEventListener("click", () => {
  const active = state.projects.filter((p) => p.active);
  if (!active.length) {
    toast("Buat project aktif dulu di menu Projects", "error");
    return setView("projects");
  }
  $("#verForm").reset();
  $("#vProject").innerHTML = active.map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("");
  if (active.some((p) => p.id === state.verProject)) $("#vProject").value = state.verProject;
  $("#verModal").showModal();
  $("#vPhone").focus();
});

$("#verForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const expires = $("#vExpires").value.trim();
  try {
    const v = await api(`/projects/${encodeURIComponent($("#vProject").value)}/verifications`, {
      method: "POST",
      body: {
        phone: $("#vPhone").value.trim() || undefined,
        reference: $("#vRef").value.trim() || undefined,
        expires_in: expires ? Number(expires) : undefined,
      },
    });
    $("#verModal").close();
    showVerResult(v);
    loadAll({ silent: true });
  } catch (error) {
    toast(error.message, "error");
  }
});

/* ═══════════════ Dialogs ═══════════════ */
$$("[data-close]").forEach((b) => b.addEventListener("click", () => b.closest("dialog").close()));
$$("dialog.modal").forEach((d) =>
  d.addEventListener("click", (e) => {
    if (e.target === d) d.close(); // klik backdrop
  }),
);

function confirmDialog(title, text) {
  const dlg = $("#confirmModal");
  $("#confirmTitle").textContent = title;
  $("#confirmText").textContent = text;
  dlg.returnValue = "";
  dlg.showModal();
  return new Promise((resolve) => {
    dlg.addEventListener("close", () => resolve(dlg.returnValue === "ok"), { once: true });
  });
}

/* ═══════════════ Boot ═══════════════ */
let statusTimer;
function startApp() {
  $("#login").hidden = true;
  $("#app").hidden = false;
  setView(location.hash.slice(1));
  loadAll({ silent: true });
  loadStatus();
  clearInterval(statusTimer);
  statusTimer = setInterval(loadStatus, 15000);
}

if (adminKey) startApp();
else showLogin();
