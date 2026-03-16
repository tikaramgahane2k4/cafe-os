const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    planName: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    featureList: [{ type: String }],
    orderLimit: { type: Number, default: 100 },
    staffLimit: { type: Number, default: 5 },
    planStatus: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Plan || mongoose.model('Plan', planSchema);
