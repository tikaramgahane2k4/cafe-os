const mongoose = require('mongoose');

const PLAN_ORDER_LIMITS = { Free: 100, Starter: 500, Pro: 2000, Growth: 2000, Enterprise: 10000 };

const tenantSchema = new mongoose.Schema(
  {
    // Identity
    tenantId:   { type: String, unique: true, sparse: true },
    cafeName:   { type: String, required: true, trim: true },
    ownerName:  { type: String, required: true, trim: true },
    email:      { type: String, required: true, unique: true, lowercase: true },
    phone:      { type: String, default: '' },

    // Credentials (generated on creation)
    adminEmail:   { type: String, default: '' },
    tempPassword: { type: String, default: '' },

    // Subscription lifecycle
    subscriptionPlan: {
      type: String,
      default: 'Free',
    },
    subscriptionStartDate: { type: Date, default: null },
    planExpiryDate:        { type: Date, default: null },

    // Status
    status: {
      type: String,
      enum: ['Active', 'Suspended', 'Expired'],
      default: 'Active',
    },

    // Usage tracking
    orderLimit:  { type: Number, default: 100 },
    ordersUsed:  { type: Number, default: 0 },

    // Activity
    lastActiveAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Auto-set orderLimit from plan on save
tenantSchema.pre('save', async function () {
  if (this.isModified('subscriptionPlan') || this.isNew) {
    this.orderLimit = PLAN_ORDER_LIMITS[this.subscriptionPlan] || 100;
  }
});

module.exports = mongoose.models.Tenant || mongoose.model('Tenant', tenantSchema);
module.exports.PLAN_ORDER_LIMITS = PLAN_ORDER_LIMITS;
