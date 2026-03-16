const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Subscription Expiry', 'Order Limit', 'High API Error Rate', 'Inactive Tenant'],
      required: true,
    },
    tenantId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null },
    tenantName: { type: String, default: '' },
    severity:   { type: String, enum: ['Info', 'Warning', 'Critical'], default: 'Info' },
    message:    { type: String, required: true },
    status:     { type: String, enum: ['Active', 'Resolved', 'Dismissed'], default: 'Active' },
    meta:       { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Alert || mongoose.model('Alert', alertSchema);
