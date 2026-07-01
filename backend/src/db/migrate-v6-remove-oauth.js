/**
 * Migration v6 — Remove all OAuth columns from users table.
 *
 * SQLite (pre-3.35.0) doesn't support DROP COLUMN.
 * Strategy: recreate table without OAuth columns, copy data, drop old, rename.
 *
 * R1: Users without password_hash get a recovery_token set.
 * R2: Backup is created as data/beautymatch.db.v6-backup before migration.
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const DB_PATH = process.env.DATABASE_PATH || './data/beautymatch.db';

const COLUMNS_TO_KEEP = [
  'id', 'email', 'password_hash', 'name', 'avatar_url',
  'is_active', 'created_at', 'updated_at', 'last_login_at',
  'recovery_token', 'recovery_sent_at'
];

function migrate() {
  const dbPath = path.resolve(__dirname, '../../', DB_PATH);
  const dir = path.dirname(dbPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // R2: Backup
  if (fs.existsSync(dbPath)) {
    const backupPath = dbPath + '.v6-backup';
    fs.copyFileSync(dbPath, backupPath);
    console.log(`✓ Backup created: ${backupPath}`);
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Check if migration already applied
  const columns = db.prepare("PRAGMA table_info('users')").all().map(c => c.name);
  const hasOAuthColumns = columns.includes('google_id') || columns.includes('github_id');
  if (!hasOAuthColumns) {
    console.log('✓ Migration v6 already applied — no OAuth columns found');
    db.close();
    return;
  }

  // R1: Handle users without password_hash
  const usersWithoutPassword = db.prepare(
    "SELECT id, email FROM users WHERE password_hash IS NULL"
  ).all();

  for (const user of usersWithoutPassword) {
    const recoveryToken = crypto.randomBytes(32).toString('hex');
    db.prepare(
      "UPDATE users SET recovery_token = ?, recovery_sent_at = datetime('now') WHERE id = ?"
    ).run(recoveryToken, user.id);
    console.log(`  → Recovery token set for ${user.email} (${user.id})`);
  }

  const keepList = COLUMNS_TO_KEEP.join(', ');

  db.exec(`
    CREATE TABLE users_new (
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

    INSERT INTO users_new (${keepList})
    SELECT ${keepList} FROM users;

    DROP TABLE users;

    ALTER TABLE users_new RENAME TO users;

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);

  console.log(`✓ Migration v6 complete — removed 35 OAuth columns`);
  console.log(`  → ${usersWithoutPassword.length} users without password set recovery_token (R1)`);

  db.close();
}

migrate();
