const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema(
  {
    // Human-readable name and canonical key
    name:        { type: String, required: true, unique: true, trim: true },
    key:         { type: String, required: true, unique: true, trim: true, uppercase: true },
    description: { type: String, default: '' },

    // Scope levels (evaluated top-down)
    globalEnabled:   { type: Boolean, default: false },          // fully global
    plansEnabled:    [{ type: String }],                         // plan names: ['Growth','Enterprise']
    tenantOverrides: [{ type: String }],                         // tenant _id strings

    // Legacy compat alias (read-only, same as globalEnabled)
    isEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Keep legacy isEnabled in sync with globalEnabled
featureSchema.pre('save', async function () {
  this.isEnabled = this.globalEnabled;
});

module.exports = mongoose.models.Feature || mongoose.model('Feature', featureSchema);
