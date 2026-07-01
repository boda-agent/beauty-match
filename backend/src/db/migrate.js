/**
 * Database Migration — v1: Users with email/password auth
 *
 * Schema: simple users table + auth_log for logging
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const DB_PATH = process.env.DATABASE_PATH || './data/beautymatch.db';

function migrate() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(DB_PATH);

  // Enable WAL mode for better concurrent access
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      name          TEXT NOT NULL DEFAULT '',
      avatar_url    TEXT,
      is_active     INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
      last_login_at TEXT,
      recovery_token   TEXT,
      recovery_sent_at TEXT
    );

    CREATE TABLE IF NOT EXISTS auth_log (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    TEXT,
      action     TEXT NOT NULL,
      email      TEXT,
      ip_address TEXT,
      user_agent TEXT,
      success    INTEGER NOT NULL DEFAULT 1,
      error_msg  TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_auth_log_user ON auth_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_auth_log_action ON auth_log(action);
    CREATE INDEX IF NOT EXISTS idx_auth_log_created ON auth_log(created_at);
  `);

  console.log(`✓ Migration complete — database at ${DB_PATH}`);
  db.close();
}

migrate();
