const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    // Primary audit fields
    action:       { type: String, required: true },       // e.g. TENANT_STATUS_CHANGED
    target:       { type: String, default: '' },          // human-readable target name
    performedBy:  { type: String, default: 'System' },   // admin name / role
    severity:     { type: String, enum: ['INFO','WARNING','SECURITY'], default: 'INFO' },
    // Diff tracking
    beforeValue:  { type: String, default: '' },
    afterValue:   { type: String, default: '' },
    // Forensic context
    ipAddress:    { type: String, default: '' },
    device:       { type: String, default: '' },
    // Legacy aliases kept for backward compat (normalize layer maps them)
    actionType:   { type: String, default: '' },
    adminUser:    { type: String, default: '' },
    targetEntity: { type: String, default: '' },
    description:  { type: String, default: '' },
    details:      { type: String, default: '' },
  },
  { timestamps: true }
);

// Pre-save: keep legacy aliases in sync
activityLogSchema.pre('save', function () {
  if (!this.actionType) this.actionType = this.action;
  if (!this.adminUser)  this.adminUser  = this.performedBy;
  if (!this.targetEntity) this.targetEntity = this.target;
});

module.exports = mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);
