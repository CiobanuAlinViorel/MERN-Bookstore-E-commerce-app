const mongoose = require('mongoose');
const { Book } = require('../models/Book');

// Câmpurile după care are voie să se sorteze (whitelist = securitate)
const SORTABLE = ['title', 'author', 'price', 'year', 'createdAt'];

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Lista de cărți cu căutare, filtrare, sortare și paginare.
 * Primește un obiect simplu (NU req), returnează date simple (NU res).
 */
async function getBooks({ search, category, minPrice, maxPrice, sortBy = 'title', order = 'asc', page = 1, limit = 12 } = {}) {
  const filter = {};

  if (search) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ title: rx }, { author: rx }, { publisher: rx }];
  }
  if (category) filter.category = category;
  if (minPrice != null || maxPrice != null) {
    filter.price = {};
    if (minPrice != null) filter.price.$gte = Number(minPrice);
    if (maxPrice != null) filter.price.$lte = Number(maxPrice);
  }

  const sortField = SORTABLE.includes(sortBy) ? sortBy : 'title';
  const sort = { [sortField]: order === 'desc' ? -1 : 1 };

  const safeLimit = Math.min(Math.max(parseInt(limit) || 12, 1), 50);
  const safePage = Math.max(parseInt(page) || 1, 1);

  const [items, total] = await Promise.all([
    Book.find(filter).sort(sort).skip((safePage - 1) * safeLimit).limit(safeLimit).lean(),
    Book.countDocuments(filter),
  ]);

  return { items, total, page: safePage, pages: Math.ceil(total / safeLimit) };
}

async function getBookById(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Book.findById(id).lean(); // null dacă nu există
}

async function getCategories() {
  return Book.distinct('category');
}

// ---------- Administrare (doar admin, protejat în rute) ----------
 
// Whitelist: doar aceste câmpuri pot fi setate din request (previne mass assignment)
const EDITABLE = ['title', 'author', 'publisher', 'isbn', 'pages', 'year', 'category', 'price', 'stock', 'coverUrl', 'description'];
 
const pickEditable = (data = {}) =>
  Object.fromEntries(EDITABLE.filter((k) => data[k] !== undefined).map((k) => [k, data[k]]));
 
async function createBook(data) {
  return Book.create(pickEditable(data)); // ValidationError / duplicate ISBN -> handler global
}
 
async function updateBook(id, data) {
  if (!mongoose.isValidObjectId(id)) throw new AppError('Cartea nu a fost găsită', 404);
  const book = await Book.findById(id);
  if (!book) throw new AppError('Cartea nu a fost găsită', 404);
 
  book.set(pickEditable(data));
  return book.save(); // rulează validările și hook-urile din model
}
 
async function deleteBook(id) {
  if (!mongoose.isValidObjectId(id)) throw new AppError('Cartea nu a fost găsită', 404);
  const book = await Book.findByIdAndDelete(id);
  if (!book) throw new AppError('Cartea nu a fost găsită', 404);
 
  // Scoatem cartea din toate coșurile; comenzile păstrează snapshot-ul (titlu + preț)
  await Cart.updateMany({}, { $pull: { items: { book: book._id } } });
}
 
module.exports = { getBooks, getBookById, getCategories, createBook, updateBook, deleteBook };