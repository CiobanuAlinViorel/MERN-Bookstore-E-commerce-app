const router = require('express').Router();
const { rateLimit } = require('express-rate-limit');
const ctrl = require('../controllers/authController');
const { authenticate } = require('../../../shared/middleware');

// Limitează încercările de login/înregistrare (protecție împotriva brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Prea multe încercări, reveniți mai târziu' },
});

router.post('/register', authLimiter, ctrl.register); // POST /api/auth/register
router.post('/login', authLimiter, ctrl.login);       // POST /api/auth/login
router.get('/me', authenticate, ctrl.me);             // GET  /api/auth/me

module.exports = router;