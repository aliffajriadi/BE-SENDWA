import prisma from "../config/db.js";

export const web = (app) => {
  // Basic Auth Middleware for Admin APIs
  const authMiddleware = (req, res, next) => {
    const apiKey = req.headers["x-api-key"];
    if (apiKey && apiKey === process.env.API_KEY) {
      next();
    } else {
      res.status(401).json({ message: "Unauthorized: Invalid API Key" });
    }
  };

  // Secret Key Check Endpoint
  app.post("/api/admin/login", (req, res) => {
    const { key } = req.body;
    if (key === process.env.API_KEY) {
      res.json({ success: true, message: "Login Berhasil" });
    } else {
      res.status(401).json({ success: false, message: "API Key Salah!" });
    }
  });

  // Admin Page HTML with Login Logic
  app.get("/admin", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login | BE-SENDWA</title>
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
            margin: 0; padding: 0; box-sizing: border-box;
            font-family: 'Outfit', sans-serif;
        }

        body {
            background: radial-gradient(circle at top left, #1e1b4b, #0f172a);
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        }

        #login-container {
            width: 100%;
            max-width: 400px;
            background: var(--card-bg);
            backdrop-filter: blur(20px);
            padding: 2rem;
            border-radius: 32px;
            border: 1px solid var(--border);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            text-align: center;
        }

        h1 {
            font-size: 1.75rem;
            margin-bottom: 2rem;
            background: linear-gradient(to right, #818cf8, #c084fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .input-group {
            margin-bottom: 1.5rem;
            text-align: left;
        }

        label {
            display: block;
            margin-bottom: 0.5rem;
            color: var(--text-muted);
            font-size: 0.9rem;
        }

        input {
            width: 100%;
            padding: 1rem;
            background: rgba(15, 23, 42, 0.8);
            border: 1px solid var(--border);
            border-radius: 12px;
            color: white;
            outline: none;
            transition: all 0.3s;
            font-size: 1rem;
        }

        input:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
        }

        button {
            width: 100%;
            padding: 1rem;
            background: var(--primary);
            color: white;
            border: none;
            border-radius: 12px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 1rem;
        }

        button:hover {
            background: var(--primary-hover);
            transform: translateY(-2px);
            box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.5);
        }

        #admin-panel {
            display: none;
            width: 100%;
            max-width: 1400px;
            padding: 1rem;
        }

        .container { 
            max-width: 100%; 
            margin: 0 auto; 
            width: 100%; 
        }

        header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 2rem; 
            flex-wrap: wrap;
            gap: 1rem;
        }

        header h1 {
            font-size: 1.5rem;
            margin: 0;
        }

        .header-actions {
            display: flex;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;
        }

        .tabs { 
            display: flex; 
            gap: 0.5rem; 
            margin-bottom: 1.5rem; 
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 0.5rem;
        }

        .tabs::-webkit-scrollbar {
            height: 4px;
        }

        .tabs::-webkit-scrollbar-thumb {
            background: var(--border);
            border-radius: 4px;
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
            white-space: nowrap;
            font-size: 0.9rem;
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
            padding: 1.5rem; 
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); 
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            gap: 1rem;
            flex-wrap: wrap;
        }

        .search-box {
            position: relative;
            flex: 1;
            min-width: 200px;
            max-width: 400px;
        }

        .search-box input {
            width: 100%;
            padding: 0.75rem 1rem 0.75rem 2.5rem;
            background: rgba(15, 23, 42, 0.8);
            border: 1px solid var(--border);
            border-radius: 12px;
            color: white;
            outline: none;
            transition: all 0.3s;
            font-size: 0.9rem;
        }

        .search-box input:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
        }

        .search-box::before {
            content: "🔍";
            position: absolute;
            left: 1rem;
            top: 50%;
            transform: translateY(-50%);
            font-size: 1rem;
        }

        .table-wrapper {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            margin-top: 1rem;
        }

        table { 
            width: 100%; 
            border-collapse: collapse; 
            min-width: 600px;
        }

        th { 
            text-align: left; 
            padding: 1rem; 
            border-bottom: 2px solid var(--border); 
            color: var(--text-muted); 
            font-weight: 600; 
            text-transform: uppercase; 
            font-size: 0.75rem; 
            letter-spacing: 0.05em; 
            white-space: nowrap;
        }

        td { 
            padding: 1rem; 
            border-bottom: 1px solid var(--border); 
            font-size: 0.9rem;
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
            font-size: 0.85rem;
            white-space: nowrap;
        }

        .btn-edit { 
            background: var(--primary); 
            color: white; 
        }

        .btn-delete { 
            background: var(--danger); 
            color: white; 
        }

        .btn-logout { 
            background: transparent; 
            border: 1px solid var(--danger); 
            color: var(--danger); 
        }

        .btn-logout:hover { 
            background: var(--danger); 
            color: white; 
        }

        .btn-add { 
            background: var(--success); 
            color: white; 
            display: inline-flex; 
            align-items: center; 
            gap: 0.5rem; 
        }

        .modal { 
            display: none; 
            position: fixed; 
            top: 0; 
            left: 0; 
            width: 100%; 
            height: 100%; 
            background: rgba(0, 0, 0, 0.8); 
            backdrop-filter: blur(5px); 
            z-index: 1000; 
            align-items: center; 
            justify-content: center; 
            padding: 1rem;
            overflow-y: auto;
        }

        .modal-content { 
            background: #1e293b; 
            padding: 2rem; 
            border-radius: 24px; 
            width: 100%; 
            max-width: 500px; 
            border: 1px solid var(--border); 
            margin: auto;
        }

        .modal-content h2 {
            margin-bottom: 1.5rem;
            font-size: 1.5rem;
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

        .form-group input:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
        }

        .modal-actions { 
            display: flex; 
            justify-content: flex-end; 
            gap: 1rem; 
            margin-top: 2rem; 
            flex-wrap: wrap;
        }

        .badge { 
            padding: 0.25rem 0.75rem; 
            border-radius: 6px; 
            font-size: 0.75rem; 
            font-weight: 700; 
            white-space: nowrap;
            display: inline-block;
        }

        .badge-success { 
            background: rgba(34, 197, 94, 0.2); 
            color: #4ade80; 
        }

        .badge-danger { 
            background: rgba(239, 68, 68, 0.2); 
            color: #f87171; 
        }

        .no-results {
            text-align: center;
            padding: 3rem 1rem;
            color: var(--text-muted);
            font-size: 0.95rem;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
            body {
                padding: 0.5rem;
            }

            #login-container {
                padding: 1.5rem;
                border-radius: 24px;
            }

            h1 {
                font-size: 1.5rem;
            }

            header h1 {
                font-size: 1.25rem;
            }

            .card {
                padding: 1rem;
                border-radius: 16px;
            }

            .modal-content {
                padding: 1.5rem;
            }

            th, td {
                padding: 0.75rem 0.5rem;
                font-size: 0.85rem;
            }

            .action-btn {
                padding: 0.4rem 0.75rem;
                font-size: 0.8rem;
                margin-bottom: 0.25rem;
            }

            .search-box {
                max-width: 100%;
            }

            .badge {
                font-size: 0.7rem;
                padding: 0.2rem 0.5rem;
            }

            .tabs {
                gap: 0.5rem;
            }

            .tab-btn {
                padding: 0.6rem 1rem;
                font-size: 0.85rem;
            }
        }

        @media (max-width: 480px) {
            #admin-panel {
                padding: 0.5rem;
            }

            .card-header {
                flex-direction: column;
                align-items: stretch;
            }

            .search-box {
                max-width: 100%;
            }

            .modal-actions {
                flex-direction: column;
            }

            .modal-actions button {
                width: 100%;
            }

            table {
                font-size: 0.8rem;
            }

            th, td {
                padding: 0.5rem 0.25rem;
            }
        }
    </style>
</head>
<body>
    <!-- Login Form -->
    <div id="login-container">
        <h1>Admin Login</h1>
        <form id="loginForm">
            <div class="input-group">
                <label>Admin Secret Key</label>
                <input type="password" id="secretKey" placeholder="Enter API_KEY from .env" required>
            </div>
            <button type="submit">Login to Dashboard</button>
        </form>
    </div>

    <!-- Admin Dashboard Panel (Hidden by default) -->
    <div id="admin-panel">
        <div class="container">
            <header>
                <h1>Admin Dashboard</h1>
                <div class="header-actions">
                    <div id="loading" style="display:none;" class="badge badge-success">Processing...</div>
                    <button class="action-btn btn-logout" onclick="logout()">Logout</button>
                </div>
            </header>

            <div class="tabs">
                <button class="tab-btn active" onclick="switchTab('users')">Users</button>
                <button class="tab-btn" onclick="switchTab('apikeys')">API Keys</button>
            </div>

            <div class="card">
                <div id="users-section">
                    <div class="card-header">
                        <button class="action-btn btn-add" onclick="openModal('user')">+ Add User</button>
                        <div class="search-box">
                            <input type="text" id="userSearch" placeholder="Search users..." onkeyup="searchUsers()">
                        </div>
                    </div>
                    <div class="table-wrapper">
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
                    <div id="users-no-results" class="no-results" style="display:none;">
                        No users found
                    </div>
                </div>

                <div id="apikeys-section" style="display:none;">
                    <div class="card-header">
                        <button class="action-btn btn-add" onclick="openModal('apikey')">+ Add API Key</button>
                        <div class="search-box">
                            <input type="text" id="apikeySearch" placeholder="Search API keys..." onkeyup="searchApiKeys()">
                        </div>
                    </div>
                    <div class="table-wrapper">
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
                    <div id="apikeys-no-results" class="no-results" style="display:none;">
                        No API keys found
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- User Modal -->
    <div id="userModal" class="modal">
        <div class="modal-content">
            <h2 id="userModalTitle">Add User</h2>
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

    <!-- API Key Modal -->
    <div id="apikeyModal" class="modal">
        <div class="modal-content">
            <h2 id="apikeyModalTitle">Add API Key</h2>
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
        let adminKey = localStorage.getItem('admin_key');
        let allUsers = [];
        let allApiKeys = [];

        document.getElementById('loginForm').onsubmit = async (e) => {
            e.preventDefault();
            const key = document.getElementById('secretKey').value;
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('admin_key', key);
                adminKey = key;
                initDashboard();
            } else {
                alert(data.message);
            }
        };

        function logout() {
            localStorage.removeItem('admin_key');
            location.reload();
        }

        function initDashboard() {
            if (!adminKey) return;
            document.getElementById('login-container').style.display = 'none';
            document.getElementById('admin-panel').style.display = 'block';
            document.body.style.alignItems = 'flex-start';
            fetchData();
        }

        async function apiFetch(url, options = {}) {
            options.headers = {
                ...options.headers,
                'x-api-key': adminKey
            };
            const res = await fetch(url, options);
            if (res.status === 401) logout();
            return res;
        }

        async function fetchData() {
            document.getElementById('loading').style.display = 'block';
            try {
                const usersRes = await apiFetch('/api/admin/users');
                allUsers = await usersRes.json();
                renderUsers(allUsers);

                const keysRes = await apiFetch('/api/admin/apikeys');
                allApiKeys = await keysRes.json();
                renderApiKeys(allApiKeys);
            } catch (err) {
                console.error(err);
            }
            document.getElementById('loading').style.display = 'none';
        }

        function renderUsers(users) {
            const tbody = document.getElementById('users-table');
            const noResults = document.getElementById('users-no-results');
            
            if (users.length === 0) {
                tbody.innerHTML = '';
                noResults.style.display = 'block';
                return;
            }
            
            noResults.style.display = 'none';
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
            const noResults = document.getElementById('apikeys-no-results');
            
            if (keys.length === 0) {
                tbody.innerHTML = '';
                noResults.style.display = 'block';
                return;
            }
            
            noResults.style.display = 'none';
            tbody.innerHTML = keys.map(k => \`
                <tr>
                    <td>\${k.id}</td>
                    <td style="font-family: monospace; font-size: 0.8rem; word-break: break-all;">\${k.key}</td>
                    <td>\${k.owner}</td>
                    <td><span class="badge badge-success">\${k.token}</span></td>
                    <td>
                        <button class="action-btn btn-edit" onclick='editApiKey(\${JSON.stringify(k)})'>Edit</button>
                        <button class="action-btn btn-delete" onclick="deleteApiKey('\${k.id}')">Delete</button>
                    </td>
                </tr>
            \`).join('');
        }

        function searchUsers() {
            const query = document.getElementById('userSearch').value.toLowerCase();
            const filtered = allUsers.filter(u => 
                u.nomor.toLowerCase().includes(query) ||
                u.name.toLowerCase().includes(query) ||
                u.token.toString().includes(query) ||
                u.saldo.toString().includes(query)
            );
            renderUsers(filtered);
        }

        function searchApiKeys() {
            const query = document.getElementById('apikeySearch').value.toLowerCase();
            const filtered = allApiKeys.filter(k => 
                k.id.toLowerCase().includes(query) ||
                k.key.toLowerCase().includes(query) ||
                k.owner.toLowerCase().includes(query) ||
                k.token.toString().includes(query)
            );
            renderApiKeys(filtered);
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
            const res = await apiFetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) { 
                closeModal(); 
                fetchData(); 
            } else {
                alert('Failed to save');
            }
        }

        async function deleteUser(nomor) {
            if (confirm('Hapus user?')) {
                const res = await apiFetch('/api/admin/users/' + nomor, { method: 'DELETE' });
                if (res.ok) fetchData();
            }
        }

        async function deleteApiKey(id) {
            if (confirm('Hapus API Key?')) {
                const res = await apiFetch('/api/admin/apikeys/' + id, { method: 'DELETE' });
                if (res.ok) fetchData();
            }
        }

        // Close modal when clicking outside
        window.onclick = function(event) {
            if (event.target.classList.contains('modal')) {
                closeModal();
            }
        }

        // Auto-login if key exists
        if (adminKey) initDashboard();
    </script>
</body>
</html>
        `);
  });

  // API ENDPOINTS Protected with authMiddleware
  app.get("/api/admin/users", authMiddleware, async (req, res) => {
    const users = await prisma.user.findMany();
    res.json(users);
  });

  app.post("/api/admin/users", authMiddleware, async (req, res) => {
    const { nomor, name, token, saldo, free_event } = req.body;
    const user = await prisma.user.upsert({
      where: { nomor },
      update: { name, token, saldo, free_event },
      create: { nomor, name, token, saldo, free_event: free_event ?? true },
    });
    res.json(user);
  });

  app.delete("/api/admin/users/:nomor", authMiddleware, async (req, res) => {
    await prisma.user.delete({ where: { nomor: req.params.nomor } });
    res.json({ success: true });
  });

  app.get("/api/admin/apikeys", authMiddleware, async (req, res) => {
    const keys = await prisma.apiKey.findMany();
    res.json(keys);
  });

  app.post("/api/admin/apikeys", authMiddleware, async (req, res) => {
    const { id, key, owner, token } = req.body;
    const apikey = await prisma.apiKey.upsert({
      where: { id },
      update: { key, owner, token },
      create: { id, key, owner, token },
    });
    res.json(apikey);
  });

  app.delete("/api/admin/apikeys/:id", authMiddleware, async (req, res) => {
    await prisma.apiKey.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  });
};