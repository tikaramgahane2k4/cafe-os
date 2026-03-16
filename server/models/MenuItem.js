const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true, enum: ['Coffee', 'Snacks', 'Desserts', 'Beverages'] },
  price: { type: Number, required: true },
  description: String,
  image: String,
  inStock: { type: Boolean, default: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.MenuItem || mongoose.model('MenuItem', menuItemSchema);
