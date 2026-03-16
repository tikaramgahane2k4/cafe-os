const mongoose = require('mongoose');

const ownerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  cafeName: { type: String, required: true },
  phone: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Owner || mongoose.model('Owner', ownerSchema);
