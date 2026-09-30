const mongoose = require('mongoose');
const validator = require('validator');

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Titlul este obligatoriu'], trim: true, maxlength: 200 },
    author: { type: String, required: [true, 'Autorul este obligatoriu'], trim: true, maxlength: 120 },
    publisher: { type: String, trim: true, maxlength: 120 },
    isbn: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: { validator: (v) => validator.isISBN(v), message: 'ISBN invalid' },
    },
    pages: { type: Number, min: 1 },
    year: { type: Number, min: 1400, max: new Date().getFullYear() + 1 },
    category: { type: String, required: true, trim: true, index: true }, // ex: IT, Economie
    price: { type: Number, required: true, min: [0, 'Prețul nu poate fi negativ'] },
    stock: { type: Number, default: 0, min: 0 },
    coverUrl: { type: String, trim: true }, // OpenLibrary
    description: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

// Căutare full-text (L3 - SearchFilterSort)
bookSchema.index({ title: 'text', author: 'text', publisher: 'text' });

// Dacă lipsește coperta, o construim din ISBN (OpenLibrary)
bookSchema.pre('save', function () {
  if (!this.coverUrl && this.isbn) {
    this.coverUrl = `https://covers.openlibrary.org/b/isbn/${this.isbn.replace(/-/g, '')}-M.jpg`;
  }
});

module.exports = mongoose.model('Book', bookSchema);