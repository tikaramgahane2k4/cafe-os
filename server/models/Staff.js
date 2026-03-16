const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, required: true, enum: ['Manager', 'Waiter', 'Chef', 'Cashier'] },
  permissions: [{ type: String }],
  phone: String,
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Staff || mongoose.model('Staff', staffSchema);
