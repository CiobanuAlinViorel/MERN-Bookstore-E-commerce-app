const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Book = require('../models/Book');
const AppError = require('../../../shared/utils/AppError');
const { getStripe } = require('../utils/stripe');

const toCents = (amount) => Math.round(amount * 100);

// ---------- 1. Checkout: coș -> comandă "pending" -> sesiune Stripe ----------

async function createCheckout(user) {
  const cart = await Cart.findOne({ user: user._id }).populate('items.book');
  const lines = (cart?.items || []).filter((i) => i.book);
  if (lines.length === 0) throw new AppError('Coșul este gol', 400);

  // Snapshot: titlul și prețul se îngheață în comandă; totalul se calculează în bani (întregi)
  let totalCents = 0;
  const items = lines.map(({ book, quantity }) => {
    if (quantity > book.stock)
      throw new AppError(`Stoc insuficient pentru "${book.title}" (disponibil: ${book.stock})`, 409);
    totalCents += toCents(book.price) * quantity;
    return { book: book._id, title: book.title, unitPrice: book.price, quantity };
  });

  const order = await Order.create({ user: user._id, items, total: totalCents / 100, status: 'pending' });

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      client_reference_id: order._id.toString(),
      metadata: { orderId: order._id.toString() }, // legătura Stripe -> comanda noastră
      line_items: items.map((i) => ({
        quantity: i.quantity,
        price_data: {
          currency: order.currency,
          unit_amount: toCents(i.unitPrice),
          product_data: { name: i.title },
        },
      })),
      success_url: `${process.env.CORS_ORIGIN}/order-success?orderId=${order._id}`,
      cancel_url: `${process.env.CORS_ORIGIN}/cart`,
    });

    order.stripeSessionId = session.id;
    await order.save();
    return { orderId: order._id, url: session.url };
  } catch (err) {
    order.status = 'failed';
    await order.save();
    throw err;
  }
}

// ---------- 2. Confirmarea plății (apelată de webhook sau de sync) ----------

// Idempotentă: Stripe poate trimite același eveniment de mai multe ori
async function fulfillSession(session) {
  if (session.payment_status !== 'paid') return null;

  const orderId = session.metadata?.orderId;
  if (!mongoose.isValidObjectId(orderId)) return null;
  const order = await Order.findById(orderId);
  if (!order) return null;

  if (session.amount_total !== toCents(order.total)) {
    console.error(`Suma plătită (${session.amount_total}) nu corespunde comenzii ${orderId}`);
    return null;
  }

  // Trecere atomică pending -> paid; dacă altcineva a făcut-o deja, nu mai repetăm efectele
  const paid = await Order.findOneAndUpdate(
    { _id: order._id, status: 'pending' },
    { $set: { status: 'paid', paidAt: new Date() } },
    { new: true }
  );
  if (!paid) return order;

  for (const item of paid.items) {
    const r = await Book.updateOne({ _id: item.book, stock: { $gte: item.quantity } }, { $inc: { stock: -item.quantity } });
    if (r.modifiedCount === 0) console.warn(`Stoc insuficient la confirmarea comenzii ${paid._id} (${item.title})`);
  }
  await Cart.updateOne({ user: paid.user }, { $set: { items: [] } });
  return paid;
}

async function markPendingAs(orderId, status) {
  if (!mongoose.isValidObjectId(orderId)) return;
  await Order.updateOne({ _id: orderId, status: 'pending' }, { $set: { status } });
}

async function handleStripeEvent(event) {
  const session = event.data.object;
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      await fulfillSession(session);
      break;
    case 'checkout.session.expired':
      await markPendingAs(session.metadata?.orderId, 'cancelled');
      break;
    case 'checkout.session.async_payment_failed':
      await markPendingAs(session.metadata?.orderId, 'failed');
      break;
    default:
      break; // alte evenimente sunt ignorate
  }
}

// ---------- 3. Citire comenzi ----------

async function getUserOrders(userId) {
  return Order.find({ user: userId }).sort({ createdAt: -1 }).lean();
}

async function getOrderById(user, id) {
  if (!mongoose.isValidObjectId(id)) throw new AppError('Comanda nu a fost găsită', 404);
  const order = await Order.findById(id);
  // Un utilizator își vede doar comenzile lui; adminul le vede pe toate
  if (!order || (String(order.user) !== String(user._id) && user.role !== 'admin'))
    throw new AppError('Comanda nu a fost găsită', 404);
  return order;
}

// Fallback fără webhook (ex. în dezvoltare): întreabă Stripe direct de starea sesiunii
async function syncOrder(user, id) {
  const order = await getOrderById(user, id);
  if (order.status === 'pending' && order.stripeSessionId) {
    const session = await getStripe().checkout.sessions.retrieve(order.stripeSessionId);
    await fulfillSession(session);
    return getOrderById(user, id);
  }
  return order;
}

async function getAllOrders({ status, page = 1, limit = 20 } = {}) {
  const filter = status ? { status } : {};
  const safeLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
  const safePage = Math.max(parseInt(page) || 1, 1);
  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit).populate('user', 'email name').lean(),
    Order.countDocuments(filter),
  ]);
  return { items, total, page: safePage, pages: Math.ceil(total / safeLimit) };
}

module.exports = { createCheckout, fulfillSession, handleStripeEvent, getUserOrders, getOrderById, syncOrder, getAllOrders };