const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true,
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
  stockStatus: {
    type: String,
    enum: ['Available', 'Low Stock', 'Out of Stock'],
    default: 'Available',
  },
  cafeId: {
    type: String,
    required: true,
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

module.exports = mongoose.model('MenuItem', menuItemSchema);
