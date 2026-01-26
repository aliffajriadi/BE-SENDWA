import prisma from "../config/db.js";

export const web = (app) => {
  // Admin Page HTML
  app.get("/admin", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard | BE-SENDWA</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #6366f1;
            --primary-hover: #4f46e5;
            --bg-dark: #0f172a;
            --card-bg: rgba(30, 41, 59, 0.7);
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --border: rgba(255, 255, 255, 0.1);
            --danger: #ef4444;
            --success: #22c55e;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Outfit', sans-serif;
        }

        body {
            background: radial-gradient(circle at top left, #1e1b4b, #0f172a);
            color: var(--text-main);
            min-height: 100vh;
            padding: 2rem;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
        }

        h1 {
            font-size: 2rem;
            font-weight: 700;
            background: linear-gradient(to right, #818cf8, #c084fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .tabs {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
        }

        .tab-btn {
            padding: 0.75rem 1.5rem;
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            color: var(--text-muted);
            cursor: pointer;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        }

        .tab-btn.active {
            background: var(--primary);
            color: white;
            border-color: var(--primary);
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
        }

        .card {
            background: var(--card-bg);
            backdrop-filter: blur(12px);
            border: 1px solid var(--border);
            border-radius: 24px;
            padding: 2rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1.5rem;
        }

        th {
            text-align: left;
            padding: 1rem;
            border-bottom: 2px solid var(--border);
            color: var(--text-muted);
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.85rem;
            letter-spacing: 0.05em;
        }

        td {
            padding: 1rem;
            border-bottom: 1px solid var(--border);
        }

        tr:hover {
            background: rgba(255, 255, 255, 0.03);
        }

        .action-btn {
            padding: 0.5rem 1rem;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s;
            margin-right: 0.5rem;
        }

        .btn-edit { background: var(--primary); color: white; }
        .btn-delete { background: var(--danger); color: white; }
        .btn-add { background: var(--success); color: white; margin-bottom: 1rem; display: inline-flex; align-items: center; gap: 0.5rem; }

        .btn-add:hover { background: #16a34a; transform: translateY(-2px); }
        .btn-edit:hover { background: var(--primary-hover); transform: translateY(-2px); }
        .btn-delete:hover { background: #dc2626; transform: translateY(-2px); }

        .modal {
            display: none;
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(5px);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }

        .modal-content {
            background: #1e293b;
            padding: 2.5rem;
            border-radius: 24px;
            width: 100%;
            max-width: 500px;
            border: 1px solid var(--border);
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            color: var(--text-muted);
            font-size: 0.9rem;
        }

        .form-group input {
            width: 100%;
            padding: 0.75rem 1rem;
            background: #0f172a;
            border: 1px solid var(--border);
            border-radius: 10px;
            color: white;
            outline: none;
        }

        .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
            margin-top: 2rem;
        }

        .badge {
            padding: 0.25rem 0.5rem;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 700;
        }
        .badge-success { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
        .badge-danger { background: rgba(239, 68, 68, 0.2); color: #f87171; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Admin Dashboard</h1>
            <div id="loading" style="display:none;" class="badge badge-success">Processing...</div>
        </header>

        <div class="tabs">
            <button class="tab-btn active" onclick="switchTab('users')">Users</button>
            <button class="tab-btn" onclick="switchTab('apikeys')">API Keys</button>
        </div>

        <div class="card">
            <div id="users-section">
                <button class="action-btn btn-add" onclick="openModal('user')">+ Add User</button>
                <div style="overflow-x: auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>Nomor</th>
                                <th>Nama</th>
                                <th>Token</th>
                                <th>Saldo</th>
                                <th>Free Event</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="users-table"></tbody>
                    </table>
                </div>
            </div>

            <div id="apikeys-section" style="display:none;">
                <button class="action-btn btn-add" onclick="openModal('apikey')">+ Add API Key</button>
                <div style="overflow-x: auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Key</th>
                                <th>Owner</th>
                                <th>Token</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="apikeys-table"></tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- User Modal -->
    <div id="userModal" class="modal">
        <div class="modal-content">
            <h2 id="userModalTitle" style="margin-bottom: 2rem;">Add User</h2>
            <form id="userForm">
                <div class="form-group">
                    <label>Nomor (WhatsApp)</label>
                    <input type="text" id="userNomor" required>
                </div>
                <div class="form-group">
                    <label>Nama</label>
                    <input type="text" id="userName" required>
                </div>
                <div class="form-group">
                    <label>Token</label>
                    <input type="number" id="userToken" value="0" required>
                </div>
                <div class="form-group">
                    <label>Saldo</label>
                    <input type="number" id="userSaldo" value="0" required>
                </div>
                <div class="form-group" style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="checkbox" id="userFreeEvent" style="width: auto;">
                    <label style="margin-bottom: 0;">Free Event Claimed?</label>
                </div>
                <div class="modal-actions">
                    <button type="button" class="action-btn" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="action-btn btn-edit">Save</button>
                </div>
            </form>
        </div>
    </div>

    <!-- ApiKey Modal -->
    <div id="apikeyModal" class="modal">
        <div class="modal-content">
            <h2 id="apikeyModalTitle" style="margin-bottom: 2rem;">Add API Key</h2>
            <form id="apikeyForm">
                <div class="form-group">
                    <label>ID</label>
                    <input type="text" id="apikeyId" required>
                </div>
                <div class="form-group">
                    <label>Key</label>
                    <input type="text" id="apikeyValue" required>
                </div>
                <div class="form-group">
                    <label>Owner</label>
                    <input type="text" id="apikeyOwner" required>
                </div>
                <div class="form-group">
                    <label>Token</label>
                    <input type="number" id="apikeyToken" value="0" required>
                </div>
                <div class="modal-actions">
                    <button type="button" class="action-btn" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="action-btn btn-edit">Save</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        async function fetchData() {
            document.getElementById('loading').style.display = 'block';
            try {
                const usersRes = await fetch('/api/admin/users');
                const users = await usersRes.json();
                renderUsers(users);

                const keysRes = await fetch('/api/admin/apikeys');
                const keys = await keysRes.json();
                renderApiKeys(keys);
            } catch (err) {
                console.error(err);
            }
            document.getElementById('loading').style.display = 'none';
        }

        function renderUsers(users) {
            const tbody = document.getElementById('users-table');
            tbody.innerHTML = users.map(u => \`
                <tr>
                    <td>\${u.nomor}</td>
                    <td>\${u.name}</td>
                    <td><span class="badge badge-success">\${u.token}</span></td>
                    <td>Rp\${u.saldo.toLocaleString()}</td>
                    <td>\${u.free_event ? '<span class="badge badge-danger">Claimed</span>' : '<span class="badge badge-success">Available</span>'}</td>
                    <td>
                        <button class="action-btn btn-edit" onclick='editUser(\${JSON.stringify(u)})'>Edit</button>
                        <button class="action-btn btn-delete" onclick="deleteUser('\${u.nomor}')">Delete</button>
                    </td>
                </tr>
            \`).join('');
        }

        function renderApiKeys(keys) {
            const tbody = document.getElementById('apikeys-table');
            tbody.innerHTML = keys.map(k => \`
                <tr>
                    <td>\${k.id}</td>
                    <td style="font-family: monospace; font-size: 0.8rem;">\${k.key}</td>
                    <td>\${k.owner}</td>
                    <td><span class="badge badge-success">\${k.token}</span></td>
                    <td>
                        <button class="action-btn btn-edit" onclick='editApiKey(\${JSON.stringify(k)})'>Edit</button>
                        <button class="action-btn btn-delete" onclick="deleteApiKey('\${k.id}')">Delete</button>
                    </td>
                </tr>
            \`).join('');
        }

        function switchTab(tab) {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            event.target.classList.add('active');
            document.getElementById('users-section').style.display = tab === 'users' ? 'block' : 'none';
            document.getElementById('apikeys-section').style.display = tab === 'apikeys' ? 'block' : 'none';
        }

        function openModal(type) {
            if (type === 'user') {
                document.getElementById('userModalTitle').innerText = 'Add User';
                document.getElementById('userForm').reset();
                document.getElementById('userModal').style.display = 'flex';
                document.getElementById('userNomor').readOnly = false;
            } else {
                document.getElementById('apikeyModalTitle').innerText = 'Add API Key';
                document.getElementById('apikeyForm').reset();
                document.getElementById('apikeyModal').style.display = 'flex';
                document.getElementById('apikeyId').readOnly = false;
            }
        }

        function closeModal() {
            document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
        }

        function editUser(u) {
            document.getElementById('userModalTitle').innerText = 'Edit User';
            document.getElementById('userNomor').value = u.nomor;
            document.getElementById('userNomor').readOnly = true;
            document.getElementById('userName').value = u.name;
            document.getElementById('userToken').value = u.token;
            document.getElementById('userSaldo').value = u.saldo;
            document.getElementById('userFreeEvent').checked = u.free_event;
            document.getElementById('userModal').style.display = 'flex';
        }

        function editApiKey(k) {
            document.getElementById('apikeyModalTitle').innerText = 'Edit API Key';
            document.getElementById('apikeyId').value = k.id;
            document.getElementById('apikeyId').readOnly = true;
            document.getElementById('apikeyValue').value = k.key;
            document.getElementById('apikeyOwner').value = k.owner;
            document.getElementById('apikeyToken').value = k.token;
            document.getElementById('apikeyModal').style.display = 'flex';
        }

        document.getElementById('userForm').onsubmit = async (e) => {
            e.preventDefault();
            const data = {
                nomor: document.getElementById('userNomor').value,
                name: document.getElementById('userName').value,
                token: parseInt(document.getElementById('userToken').value),
                saldo: parseInt(document.getElementById('userSaldo').value),
                free_event: document.getElementById('userFreeEvent').checked
            };
            await save('/api/admin/users', data);
        };

        document.getElementById('apikeyForm').onsubmit = async (e) => {
            e.preventDefault();
            const data = {
                id: document.getElementById('apikeyId').value,
                key: document.getElementById('apikeyValue').value,
                owner: document.getElementById('apikeyOwner').value,
                token: parseInt(document.getElementById('apikeyToken').value)
            };
            await save('/api/admin/apikeys', data);
        };

        async function save(url, data) {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) { closeModal(); fetchData(); }
        }

        async function deleteUser(nomor) {
            if (confirm('Hapus user?')) await fetch('/api/admin/users/' + nomor, { method: 'DELETE' });
            fetchData();
        }

        async function deleteApiKey(id) {
            if (confirm('Hapus API Key?')) await fetch('/api/admin/apikeys/' + id, { method: 'DELETE' });
            fetchData();
        }

        fetchData();
    </script>
</body>
</html>
        `);
  });

  // API ENDPOINTS
  app.get("/api/admin/users", async (req, res) => {
    const users = await prisma.user.findMany();
    res.json(users);
  });

  app.post("/api/admin/users", async (req, res) => {
    const { nomor, name, token, saldo, free_event } = req.body;
    const user = await prisma.user.upsert({
      where: { nomor },
      update: { name, token, saldo, free_event },
      create: { nomor, name, token, saldo, free_event: free_event ?? true },
    });
    res.json(user);
  });

  app.delete("/api/admin/users/:nomor", async (req, res) => {
    await prisma.user.delete({ where: { nomor: req.params.nomor } });
    res.json({ success: true });
  });

  app.get("/api/admin/apikeys", async (req, res) => {
    const keys = await prisma.apiKey.findMany();
    res.json(keys);
  });

  app.post("/api/admin/apikeys", async (req, res) => {
    const { id, key, owner, token } = req.body;
    const apikey = await prisma.apiKey.upsert({
      where: { id },
      update: { key, owner, token },
      create: { id, key, owner, token },
    });
    res.json(apikey);
  });

  app.delete("/api/admin/apikeys/:id", async (req, res) => {
    await prisma.apiKey.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  });
};
