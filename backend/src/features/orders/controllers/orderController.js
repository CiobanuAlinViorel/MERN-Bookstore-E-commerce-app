const orderService = require('../services/orderService');

exports.checkout = async (req, res) => {
  res.status(201).json(await orderService.createCheckout(req.user)); // { orderId, url }
};

exports.list = async (req, res) => {
  res.json(await orderService.getUserOrders(req.user._id));
};

exports.getOne = async (req, res) => {
  res.json(await orderService.getOrderById(req.user, req.params.id));
};

exports.sync = async (req, res) => {
  res.json(await orderService.syncOrder(req.user, req.params.id));
};

exports.listAll = async (req, res) => {
  res.json(await orderService.getAllOrders(req.query));
};