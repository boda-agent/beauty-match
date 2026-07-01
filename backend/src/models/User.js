/**
 * User model — encapsulates user-related database operations.
 */
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { getDb } = require('../db/connection');
const config = require('../config');
const AuthLog = require('./AuthLog');

const User = {
  /**
   * Find user by email.
   */
  findByEmail(email) {
    const db = getDb();
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  },

  /**
   * Find user by ID.
   */
  findById(id) {
    const db = getDb();
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },

  /**
   * Create a new user (email + password registration).
   */
  async create({ email, password, name }) {
    const db = getDb();
    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name)
      VALUES (?, ?, ?, ?)
    `).run(id, email.toLowerCase().trim(), passwordHash, name || '');

    return this.findById(id);
  },

  /**
   * Set password for existing user (recovery).
   */
  async setPassword(userId, newPassword, req) {
    const db = getDb();
    const user = this.findById(userId);
    if (!user) throw new Error('User not found');

    const passwordHash = await bcrypt.hash(newPassword, config.bcryptRounds);

    db.prepare(`
      UPDATE users SET password_hash = ?, recovery_token = NULL, recovery_sent_at = NULL, updated_at = datetime('now')
      WHERE id = ?
    `).run(passwordHash, userId);

    await AuthLog.log({
      userId,
      action: 'password_set',
      email: user.email,
      ip: req?.ip,
      ua: req?.headers?.['user-agent'],
    });

    return this.findById(userId);
  },

  /**
   * Remove user (complete account deletion).
   */
  async remove(userId) {
    const db = getDb();
    const user = this.findById(userId);
    if (!user) throw new Error('User not found');

    db.prepare('DELETE FROM auth_log WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  },

  /**
   * Sanitize user object (remove sensitive fields).
   */
  toPublic(user) {
    if (!user) return null;
    const { password_hash, recovery_token, recovery_sent_at, ...safe } = user;
    return safe;
  },
};

module.exports = User;
