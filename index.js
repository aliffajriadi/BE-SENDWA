import express from 'express';
import cors from 'cors';
import { createPool } from 'mysql2/promise';
import apiRoutes from './routes/api.js';
import { startBot } from './bot/whatsappBot.js';

// Configure MySQL connection pool
const pool = createPool({
  host: 'localhost',
  user: 'root',
  database: 'waif',
  password: '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Mount API routes, passing the pool and sock
app.use('/api', apiRoutes(pool));

// Start WhatsApp bot and server
async function main() {
  const sock = await startBot();
  app.set('sock', sock); // Make sock available to controllers
  app.listen(3000, () => {
    console.log('Server running on port 3000');
  });
}

main().catch(console.error);