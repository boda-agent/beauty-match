/**
 * AuthLog model — logs all authentication attempts (AC-3 Security).
 *
 * Required per AC-3: "Логирование всех попыток"
 */
const { getDb } = require('../db/connection');

const AuthLog = {
  log({ userId = null, action, email, ip = null, ua = null, success = 1, errorMsg = null }) {
    const db = getDb();
    try {
      db.prepare(`
        INSERT INTO auth_log (user_id, action, email, ip_address, user_agent, success, error_msg)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(userId, action, email, ip, ua ? String(ua).slice(0, 500) : null, success ? 1 : 0, errorMsg);
    } catch (err) {
      console.error('Failed to write auth log:', err.message);
    }
  },

  /**
   * Get recent auth attempts for a user.
   */
  getByUser(userId, limit = 50) {
    const db = getDb();
    return db.prepare('SELECT * FROM auth_log WHERE user_id = ? ORDER BY created_at DESC LIMIT ?').all(userId, limit);
  },

  /**
   * Get recent auth attempts by email (for rate limiting analysis).
   */
  getByEmail(email, sinceMinutes = 15) {
    const db = getDb();
    return db.prepare(`
      SELECT * FROM auth_log
      WHERE email = ? AND created_at >= datetime('now', ?)
      ORDER BY created_at DESC
    `).all(email, `-${sinceMinutes} minutes`);
  },
};

module.exports = AuthLog;
