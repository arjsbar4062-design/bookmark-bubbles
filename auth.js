
import express from 'express';
import bcrypt from 'bcrypt';
import Database from 'better-sqlite3';

const db = new Database('app.db');
const router = express.Router();

function getSetting(key){
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row?.value ?? null;
}

router.get('/me', (req,res)=>{
  res.json({ role: req.session?.role || null });
});

router.post('/login', async (req,res)=>{
  const { role, password } = req.body || {};
  if (!role || !password) return res.status(400).json({error: 'role and password required'});
  if (!['guest','owner'].includes(role)) return res.status(400).json({error:'invalid role'});

  const key = role === 'owner' ? 'owner_hash' : 'guest_hash';
  const hash = getSetting(key);
  if (!hash) return res.status(500).json({error: 'password not set'});

  const ok = await bcrypt.compare(password, hash);
  if (!ok) return res.status(401).json({error: 'invalid password'});

  req.session.role = role;
  res.json({ ok: true, role });
});

router.post('/logout', (req,res)=>{
  req.session = null;
  res.json({ ok: true });
});

export default router;
