/**
 * Auth Controller — handles email/password authentication.
 */
const bcrypt = require('bcrypt');
const User = require('../models/User');
const AuthLog = require('../models/AuthLog');
const TokenService = require('../services/TokenService');
const config = require('../config');

const AuthController = {
  // ============================================================
  // POST /api/auth/login
  // Email + password login
  // ============================================================
  async passwordLogin(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      const user = User.findByEmail(email);
      if (!user) {
        await AuthLog.log({
          action: 'password_login',
          email,
          ip: req.ip,
          ua: req.headers?.['user-agent'],
          success: 0,
          errorMsg: 'User not found',
        });
        return res.status(401).json({ error: 'Невірний email або пароль' });
      }

      if (!user.password_hash) {
        return res.status(401).json({
          error: 'Цей акаунт не має пароля. Скористайтесь відновленням доступу.',
        });
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        await AuthLog.log({
          userId: user.id,
          action: 'password_login',
          email,
          ip: req.ip,
          ua: req.headers?.['user-agent'],
          success: 0,
          errorMsg: 'Invalid password',
        });
        return res.status(401).json({ error: 'Невірний email або пароль' });
      }

      // Update last login
      const db = require('../db/connection').getDb();
      db.prepare('UPDATE users SET last_login_at = datetime(\'now\') WHERE id = ?').run(user.id);

      await AuthLog.log({
        userId: user.id,
        action: 'password_login',
        email,
        ip: req.ip,
        ua: req.headers?.['user-agent'],
      });

      const token = TokenService.issue(user);

      res.cookie('token', token, {
        httpOnly: true,
        secure: !config.isDev,
        sameSite: 'lax',
        maxAge: config.session.expiryHours * 60 * 60 * 1000,
      });

      return res.json({ token, user: User.toPublic(user) });
    } catch (err) {
      next(err);
    }
  },

  // ============================================================
  // POST /api/auth/register
  // Email + password registration
  // ============================================================
  async register(req, res, next) {
    try {
      const { email, password, name } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'Пароль має бути щонайменше 6 символів' });
      }

      const existing = User.findByEmail(email);
      if (existing) {
        return res.status(409).json({ error: 'Користувач з таким email вже існує' });
      }

      const user = await User.create({ email, password, name });

      await AuthLog.log({
        userId: user.id,
        action: 'register',
        email,
        ip: req.ip,
        ua: req.headers?.['user-agent'],
      });

      const token = TokenService.issue(user);

      res.cookie('token', token, {
        httpOnly: true,
        secure: !config.isDev,
        sameSite: 'lax',
        maxAge: config.session.expiryHours * 60 * 60 * 1000,
      });

      return res.status(201).json({ token, user: User.toPublic(user) });
    } catch (err) {
      next(err);
    }
  },

  // ============================================================
  // POST /api/auth/password/set
  // Set password (account recovery)
  // ============================================================
  async setPassword(req, res, next) {
    try {
      const { password } = req.body;
      if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Пароль має бути щонайменше 6 символів' });
      }

      const user = await User.setPassword(req.user.id, password, req);

      return res.json({
        message: 'Пароль встановлено',
        user: User.toPublic(user),
      });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  },

  // ============================================================
  // GET /api/auth/me
  // Get current user profile
  // ============================================================
  getMe(req, res) {
    return res.json({ user: req.user });
  },

  // ============================================================
  // POST /api/auth/logout
  // Clear session
  // ============================================================
  logout(req, res) {
    res.clearCookie('token');
    return res.json({ message: 'Ви вийшли з системи' });
  },
};

module.exports = AuthController;
