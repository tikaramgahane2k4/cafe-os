const mongoose = require('mongoose');

const ownerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  cafeName: { type: String, required: true },
  phone: String,
  locationSettings: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    radius: { type: Number, default: 100 },
    enabled: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Owner || mongoose.model('Owner', ownerSchema);
