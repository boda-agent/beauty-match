/**
 * Application configuration — loaded from environment variables.
 *
 * @see .env.example for all available settings
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3001,
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  database: {
    path: process.env.DATABASE_PATH || './data/beautymatch.db',
  },

  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  session: {
    expiryHours: parseInt(process.env.SESSION_EXPIRY_HOURS, 10) || 168, // 7 days
  },

  rateLimit: {
    authWindowMs: 15 * 60 * 1000,  // 15 min
    authMax: 20,                     // 20 requests per window
  },

  bcryptRounds: 12,
};

module.exports = config;
