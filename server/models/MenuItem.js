const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  // Newer UI uses "name"
  name: {
    type: String,
    default: '',
    trim: true,
  },
  itemName: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Coffee', 'Snacks', 'Desserts', 'Beverages'],
  },
  price: {
    type: Number,
    required: true,
  },
  image: {
    type: String, // URL or relative path to image
    required: true,
  },
  stock: {
    type: Number,
    default: 0,
  },
  inStock: {
    type: Boolean,
    default: false,
  },
  stockStatus: {
    type: String,
    enum: ['Available', 'Low Stock', 'Out of Stock'],
    default: 'Available',
  },
  cafeId: {
    type: String,
    required: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Normalize name fields for compatibility
menuItemSchema.pre('validate', function (next) {
  if (!this.name && this.itemName) this.name = this.itemName;
  if (!this.itemName && this.name) this.itemName = this.name;
  if (this.inStock === undefined) this.inStock = (this.stock || 0) > 0;
  next();
});

module.exports = mongoose.models.MenuItem || mongoose.model('MenuItem', menuItemSchema);
