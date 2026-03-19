const mongoose = require("mongoose");

const cafeSchema = new mongoose.Schema({
  cafeName: { type: String, required: true },
  ownerEmail: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Cafe", cafeSchema);
