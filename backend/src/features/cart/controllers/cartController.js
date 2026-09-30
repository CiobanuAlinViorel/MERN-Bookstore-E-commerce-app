const cartService = require('../services/cartServices');

// req.user este pus de middleware-ul authenticate; id-ul vine din token, niciodată din body
exports.get = async (req, res) => {
  res.json(await cartService.getCart(req.user._id));
};

exports.addItem = async (req, res) => {
  const { bookId, quantity } = req.body || {};
  res.status(201).json(await cartService.addItem(req.user._id, bookId, quantity));
};

exports.updateItem = async (req, res) => {
  res.json(await cartService.updateQuantity(req.user._id, req.params.bookId, (req.body || {}).quantity));
};

exports.removeItem = async (req, res) => {
  res.json(await cartService.removeItem(req.user._id, req.params.bookId));
};

exports.clear = async (req, res) => {
  res.json(await cartService.clearCart(req.user._id));
};