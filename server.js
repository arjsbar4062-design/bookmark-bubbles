
import 'dotenv/config';
import express from 'express';
import cookieSession from 'cookie-session';
import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import authRoutes from './routes/auth.js';
import bookmarkRoutes from './routes/bookmarks.js';
import requestRoutes from './routes/requests.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '2mb' }));
app.use(cookieSession({
  name: 'sess',
  keys: [process.env.SESSION_SECRET || 'dev-secret'],
  httpOnly: true,
  sameSite: 'lax'
}));

// ensure DB exists and seeded
const db = new Database('app.db');
const initSql = fs.readFileSync('./db/init.sql','utf-8');
db.exec(initSql);

function getSetting(key){
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row?.value ?? null;
}
function setSetting(key, value){
  db.prepare('INSERT INTO settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key, value);
}

async function ensurePasswordHashes(){
  let ownerHash = getSetting('owner_hash');
  let guestHash = getSetting('guest_hash');
  if (!ownerHash || !guestHash){
    const ownerPlain = process.env.OWNER_PASSWORD || 'owner';
    const guestPlain = process.env.GUEST_PASSWORD || 'guest';
    ownerHash = await bcrypt.hash(ownerPlain, 10);
    guestHash = await bcrypt.hash(guestPlain, 10);
    setSetting('owner_hash', ownerHash);
    setSetting('guest_hash', guestHash);
    console.log('Seeded password hashes from .env');
  }
}
await ensurePasswordHashes();

app.use(express.static('public'));
app.use('/api', authRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/requests', requestRoutes);

app.get('*', (req,res)=>{
  res.sendFile(path.resolve('public/index.html'));
});

app.listen(PORT, ()=>{
  console.log(`Bookmark Bubbles listening on http://localhost:${PORT}`);
});
