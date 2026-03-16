const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  loyaltyPoints: { type: Number, default: 0 },
  visitHistory: [{
    date: { type: Date, default: Date.now },
    orderTotal: Number
  }],
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Customer || mongoose.model('Customer', customerSchema);
