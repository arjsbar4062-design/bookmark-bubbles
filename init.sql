
PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  parent_id TEXT REFERENCES bookmarks(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('folder','link')),
  title TEXT NOT NULL,
  url TEXT,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open','resolved')) DEFAULT 'open'
);
