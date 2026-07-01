/**
 * Express server setup — middleware, routes, and startup.
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

const config = require('./config');
const authRoutes = require('./routes/auth');
const { authenticate } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const User = require('./models/User');
const AuthLog = require('./models/AuthLog');

const app = express();

// ── Security headers ──
app.use(helmet());

// ── CORS ──
app.use(cors({
  origin: config.frontend.url,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Request parsing ──
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// ── Logging ──
app.use(morgan(config.isDev ? 'dev' : 'combined'));

// ── Rate limiting ──
const authLimiter = rateLimit({
  windowMs: config.rateLimit.authWindowMs,
  max: config.rateLimit.authMax,
  message: { error: 'Забагато запитів. Спробуйте пізніше.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiters
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ── API Routes ──
app.use('/api/auth', authRoutes);

// ── User management routes ──
app.get('/api/user/profile', authenticate, (req, res) => {
  res.json({ user: req.user });
});

app.put('/api/user/profile', authenticate, async (req, res, next) => {
  try {
    const db = require('./db/connection').getDb();
    const { name } = req.body;

    if (name !== undefined) {
      db.prepare('UPDATE users SET name = ?, updated_at = datetime(\'now\') WHERE id = ?')
        .run(name, req.user.id);
    }

    const user = User.findById(req.user.id);
    res.json({ user: User.toPublic(user) });
  } catch (err) {
    next(err);
  }
});

// ── Auth log (for settings page) ──
app.get('/api/user/auth-log', authenticate, (req, res) => {
  const logs = AuthLog.getByUser(req.user.id, 20);
  res.json({ logs });
});

// ── Health check ──
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── Serve static frontend (production) ──
const frontendPath = path.resolve(__dirname, '../../src');
app.use(express.static(frontendPath));

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ── Error handler ──
app.use(errorHandler);

// ── Start server ──
if (require.main === module) {
  // Run migration on startup
  require('./db/migrate');

  app.listen(config.port, () => {
    console.log(`
╔══════════════════════════════════════════╗
║         BeautyMatch API Server          ║
║──────────────────────────────────────────║
║  Environment : ${String(config.env).padEnd(27)}║
║  Port        : ${String(config.port).padEnd(27)}║
║  Frontend    : ${String(config.frontend.url).padEnd(27)}║
╚══════════════════════════════════════════╝
    `);
  });
}

module.exports = app;
