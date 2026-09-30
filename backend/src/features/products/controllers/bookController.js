const bookService = require('../services/bookService');

// Controllerul face doar: citește req -> apelează service -> trimite res
exports.list = async (req, res) => {
  const result = await bookService.getBooks(req.query);
  res.json(result);
};

exports.getOne = async (req, res) => {
  const book = await bookService.getBookById(req.params.id);
  if (!book) return res.status(404).json({ error: 'Cartea nu a fost găsită' });
  res.json(book);
};

exports.categories = async (_req, res) => {
  res.json(await bookService.getCategories());
};

// ---------- Admin ----------
exports.create = async (req, res) => {
  const book = await bookService.createBook(req.body);
  res.status(201).json(book);
};
 
exports.update = async (req, res) => {
  res.json(await bookService.updateBook(req.params.id, req.body));
};
 
exports.remove = async (req, res) => {
  await bookService.deleteBook(req.params.id);
  res.status(204).end();
};