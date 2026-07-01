/**
 * JWT token utilities — issue and verify tokens.
 *
 * AC-3: ID token verification on the backend
 */
const jwt = require('jsonwebtoken');
const config = require('../config');

const TokenService = {
  /**
   * Issue a new JWT for the user.
   * Token contains minimal claims; user data fetched on verify.
   */
  issue(user) {
    const payload = {
      sub: user.id,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  },

  /**
   * Verify and decode a JWT.
   * @returns {Object|null} decoded payload or null if invalid
   */
  verify(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (err) {
      return null;
    }
  },

  /**
   * Decode a token without verification (for inspection only).
   */
  decode(token) {
    return jwt.decode(token);
  },
};

module.exports = TokenService;
