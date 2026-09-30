const mongoose = require('mongoose');

// Snapshot: titlul și prețul din momentul cumpărării (nu se schimbă dacă Book e modificat)
const orderItemSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    title: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], validate: (v) => v.length > 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'ron', lowercase: true },
    status: { type: String, enum: ['pending', 'paid', 'failed', 'cancelled'], default: 'pending' },
    stripeSessionId: { type: String, index: true, sparse: true },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);