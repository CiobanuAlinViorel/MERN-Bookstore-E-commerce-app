const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true }, // un coș / utilizator
    items: [cartItemSchema],
  },
  { timestamps: true }
);

// Prețul nu se stochează: se citește din Book prin populate('items.book')
cartSchema.methods.total = function () {
  return this.items.reduce((sum, i) => sum + (i.book?.price || 0) * i.quantity, 0);
};

module.exports = mongoose.model('Cart', cartSchema);