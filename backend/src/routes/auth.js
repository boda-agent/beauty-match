/**
 * Auth routes — email/password authentication endpoints.
 */
const { Router } = require('express');
const AuthController = require('../controllers/AuthController');
const { authenticate } = require('../middleware/auth');

const router = Router();

// ── Public routes ──
router.post('/login', AuthController.passwordLogin);
router.post('/register', AuthController.register);

// ── Authenticated routes ──
router.post('/password/set', authenticate, AuthController.setPassword);
router.get('/me', authenticate, AuthController.getMe);
router.post('/logout', authenticate, AuthController.logout);

module.exports = router;
