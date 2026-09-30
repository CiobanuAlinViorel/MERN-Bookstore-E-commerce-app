const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Book = require('../../products/models/Book');
const AppError = require('../../../shared/utils/AppError');

const MAX_QTY = 99;

// ---------- helpers ----------

function parseQuantity(value) {
  const q = Number(value);
  if (!Number.isInteger(q) || q < 1 || q > MAX_QTY)
    throw new AppError(`Cantitatea trebuie să fie un număr întreg între 1 și ${MAX_QTY}`, 400);
  return q;
}

function assertValidBookId(bookId) {
  if (!mongoose.isValidObjectId(bookId)) throw new AppError('Cartea nu a fost găsită', 404);
}

// Coșul există mereu: dacă utilizatorul nu are unul, îl creăm
async function getOrCreateCart(userId) {
  return (await Cart.findOne({ user: userId })) || Cart.create({ user: userId, items: [] });
}

// Transformă documentul într-un răspuns curat, cu subtotaluri și total calculate din prețurile curente
async function present(cart) {
  await cart.populate('items.book');
  const items = cart.items
    .filter((i) => i.book) // ignoră cărți șterse între timp
    .map((i) => ({
      book: i.book,
      quantity: i.quantity,
      subtotal: Math.round(i.book.price * i.quantity * 100) / 100,
    }));
  const total = Math.round(items.reduce((s, i) => s + i.subtotal, 0) * 100) / 100;
  const count = items.reduce((s, i) => s + i.quantity, 0);
  return { items, total, count };
}

const findItem = (cart, bookId) => cart.items.find((i) => String(i.book) === String(bookId));

// ---------- funcționalități ----------

async function getCart(userId) {
  return present(await getOrCreateCart(userId));
}

// Adaugă o carte; dacă e deja în coș, crește cantitatea
async function addItem(userId, bookId, quantity = 1) {
  assertValidBookId(bookId);
  const qty = parseQuantity(quantity);

  const book = await Book.findById(bookId);
  if (!book) throw new AppError('Cartea nu a fost găsită', 404);

  const cart = await getOrCreateCart(userId);
  const existing = findItem(cart, bookId);
  const newQty = (existing?.quantity || 0) + qty;

  if (newQty > MAX_QTY) throw new AppError(`Maximum ${MAX_QTY} bucăți per carte`, 400);
  if (newQty > book.stock) throw new AppError(`Stoc insuficient (disponibil: ${book.stock})`, 409);

  if (existing) existing.quantity = newQty;
  else cart.items.push({ book: book._id, quantity: qty });

  await cart.save();
  return present(cart);
}

// Setează cantitatea exactă (pentru butoanele +/- din CardSidebar)
async function updateQuantity(userId, bookId, quantity) {
  assertValidBookId(bookId);
  const qty = parseQuantity(quantity);

  const cart = await getOrCreateCart(userId);
  const item = findItem(cart, bookId);
  if (!item) throw new AppError('Cartea nu se află în coș', 404);

  const book = await Book.findById(bookId);
  if (!book) throw new AppError('Cartea nu mai este disponibilă', 404);
  if (qty > book.stock) throw new AppError(`Stoc insuficient (disponibil: ${book.stock})`, 409);

  item.quantity = qty;
  await cart.save();
  return present(cart);
}

async function removeItem(userId, bookId) {
  assertValidBookId(bookId);
  const cart = await getOrCreateCart(userId);
  if (!findItem(cart, bookId)) throw new AppError('Cartea nu se află în coș', 404);

  cart.items = cart.items.filter((i) => String(i.book) !== String(bookId));
  await cart.save();
  return present(cart);
}

async function clearCart(userId) {
  const cart = await getOrCreateCart(userId);
  cart.items = [];
  await cart.save();
  return present(cart);
}

module.exports = { getCart, addItem, updateQuantity, removeItem, clearCart };