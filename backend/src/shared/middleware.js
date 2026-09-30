const authService = require('../features/auth/services/authService');
const AppError = require('./utils/AppError');

// Cere header: Authorization: Bearer <token>
async function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw new AppError('Autentificare necesară', 401);

  const payload = authService.verifyToken(token);
  const user = await authService.getUserById(payload.sub);
  if (!user) throw new AppError('Utilizatorul nu mai există', 401);

  req.user = user;
  next();
}

// Folosire: router.post('/', authenticate, requireRole('admin'), ...)
const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) throw new AppError('Acces interzis', 403);
  next();
};

module.exports = { authenticate, requireRole };