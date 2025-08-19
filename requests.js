
import express from 'express';
import { nanoid } from 'nanoid';
import Database from 'better-sqlite3';
import { requireAny, requireRole } from '../utils/authMiddleware.js';

const db = new Database('app.db');
const router = express.Router();

router.post('/', requireAny('guest','owner'), (req,res)=>{
  const { message } = req.body || {};
  if (!message) return res.status(400).json({error:'message required'});
  const id = nanoid();
  const created_at = new Date().toISOString();
  db.prepare('INSERT INTO requests(id,created_at,message,status) VALUES (?,?,?,?)')
    .run(id, created_at, message, 'open');
  res.json({ ok:true, id });
});

router.get('/', requireRole('owner'), (req,res)=>{
  const rows = db.prepare('SELECT * FROM requests ORDER BY created_at DESC').all();
  res.json({ requests: rows });
});

router.post('/:id/resolve', requireRole('owner'), (req,res)=>{
  const { id } = req.params;
  db.prepare('UPDATE requests SET status = ? WHERE id = ?').run('resolved', id);
  res.json({ ok:true });
});

export default router;
