const mongoose = require('mongoose');

const featureEnvironmentSchema = new mongoose.Schema(
  {
    isGlobal: { type: Boolean, default: false },
    plans: [{ type: String, trim: true }],
    tenantOverrides: [{ type: String, trim: true }],
    rolloutPercentage: { type: Number, min: 0, max: 100, default: 0 },
    updatedBy: { type: String, default: 'System' },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const featureSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    key: { type: String, required: true, unique: true, trim: true, uppercase: true },
    description: { type: String, default: '' },
    dependencies: [{ type: String, trim: true, uppercase: true }],

    // Canonical environment-aware state
    environments: {
      dev: { type: featureEnvironmentSchema, default: () => ({}) },
      staging: { type: featureEnvironmentSchema, default: () => ({}) },
      production: { type: featureEnvironmentSchema, default: () => ({}) },
    },

    // Flattened compatibility snapshot (mirrors production)
    environment: { type: String, default: 'production' },
    isGlobal: { type: Boolean, default: false },
    plans: [{ type: String, trim: true }],
    tenantOverrides: [{ type: String, trim: true }],
    rolloutPercentage: { type: Number, min: 0, max: 100, default: 0 },
    updatedBy: { type: String, default: 'System' },

    // Legacy compatibility aliases
    globalEnabled: { type: Boolean, default: false },
    plansEnabled: [{ type: String, trim: true }],
    isEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

featureSchema.pre('save', function syncLegacyAliases(next) {
  const production = this.environments?.production || {};

  this.environment = 'production';
  this.isGlobal = Boolean(production.isGlobal);
  this.plans = Array.isArray(production.plans) ? production.plans : [];
  this.tenantOverrides = Array.isArray(production.tenantOverrides) ? production.tenantOverrides : [];
  this.rolloutPercentage = Number.isFinite(production.rolloutPercentage)
    ? Math.max(0, Math.min(100, production.rolloutPercentage))
    : 0;
  this.updatedBy = production.updatedBy || this.updatedBy || 'System';

  this.globalEnabled = this.isGlobal;
  this.plansEnabled = this.plans;
  this.isEnabled = this.rolloutPercentage > 0 && (this.isGlobal || this.plans.length > 0 || this.tenantOverrides.length > 0);

  next();
});

module.exports = mongoose.models.Feature || mongoose.model('Feature', featureSchema);
