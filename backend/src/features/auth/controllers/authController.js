const authService = require('../services/authService');

exports.register = async (req, res) => {
  const { user, token } = await authService.register(req.body);
  res.status(201).json({ user, token });
};

exports.login = async (req, res) => {
  const { user, token } = await authService.login(req.body);
  res.json({ user, token });
};

// req.user este pus de middleware-ul authenticate
exports.me = async (req, res) => {
  res.json({ user: req.user });
};