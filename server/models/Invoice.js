const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true, sparse: true },
    tenantId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    tenantName:    { type: String, default: '' },
    planName:      { type: String, required: true },
    amount:        { type: Number, required: true, min: 0 },
    status:        { type: String, enum: ['Paid', 'Pending', 'Overdue', 'Failed'], default: 'Pending' },
    billingDate:   { type: Date, required: true, default: Date.now },
    nextBillingDate:{ type: Date, default: null },
    paidAt:        { type: Date, default: null },
    lastPaymentAttemptAt: { type: Date, default: null },
    paymentMethod: { type: String, default: 'Card' },
    notes:         { type: String, default: '' },
    paymentLogs:   {
      type: [
        new mongoose.Schema(
          {
            timestamp: { type: Date, default: Date.now },
            action:    { type: String, default: '' },
            status:    { type: String, default: '' },
            message:   { type: String, default: '' },
            actor:     { type: String, default: 'System' },
            amount:    { type: Number, default: 0 },
            method:    { type: String, default: '' },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { timestamps: true }
);

invoiceSchema.pre('save', async function () {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments();
    this.invoiceNumber = `INV-${String(count + 1001).padStart(5, '0')}`;
  }
  if (!this.nextBillingDate && this.billingDate) {
    const d = new Date(this.billingDate);
    d.setMonth(d.getMonth() + 1);
    this.nextBillingDate = d;
  }
});

module.exports = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
