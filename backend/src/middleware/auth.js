/**
 * Authentication middleware — verifies JWT from Authorization header or cookie.
 *
 * Attaches user to req.user on success, returns 401 on failure.
 * Works with both cookie-based (browser) and Bearer token (API) auth.
 */
const User = require('../models/User');
const TokenService = require('../services/TokenService');
const AuthLog = require('../models/AuthLog');

function authenticate(req, res, next) {
  // Extract token: Authorization header > cookie
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Необхідна авторизація' });
  }

  const decoded = TokenService.verify(token);
  if (!decoded) {
    // AC-3: Log failed token verification
    AuthLog.log({
      action: 'token_verify_fail',
      ip: req.ip,
      ua: req.headers?.['user-agent'],
      success: 0,
      errorMsg: 'Invalid or expired JWT',
    });

    return res.status(401).json({ error: 'Токен недійсний або прострочений. Увійдіть знову.' });
  }

  const user = User.findById(decoded.sub);
  if (!user) {
    return res.status(401).json({ error: 'Користувача не знайдено' });
  }

  if (!user.is_active) {
    return res.status(403).json({ error: 'Акаунт деактивовано' });
  }

  req.user = User.toPublic(user);
  next();
}

/**
 * Optional auth — attaches user if token present, but doesn't block.
 */
function optionalAuth(req, res, next) {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (token) {
    const decoded = TokenService.verify(token);
    if (decoded) {
      const user = User.findById(decoded.sub);
      if (user && user.is_active) {
        req.user = User.toPublic(user);
      }
    }
  }

  next();
}

module.exports = { authenticate, optionalAuth };
