const mongoose = require('mongoose');

// ── RBAC permission templates ─────────────────────────────────────────
const ROLE_PERMISSIONS = {
  SuperAdmin:   ['manageTenants','manageSubscriptions','manageFeatureFlags','manageUsers','viewAnalytics','viewActivityLogs'],
  Admin:        ['manageTenants','manageSubscriptions','viewAnalytics'],
  SupportStaff: ['viewTenants','viewAnalytics'],
};

const adminUserSchema = new mongoose.Schema(
  {
    name:          { type: String, required: true, trim: true },
    email:         { type: String, required: true, unique: true, lowercase: true },
    passwordHash:  { type: String, required: true },
    role: {
      type: String,
      enum: ['SuperAdmin', 'Admin', 'SupportStaff'],
      default: 'SupportStaff',
    },
    // derived from role — stored for query convenience, always synced in pre-save
    permissions:   { type: [String], default: [] },
    status:        { type: String, enum: ['Active','Inactive','Suspended'], default: 'Active' },
    // legacy alias kept for backward compat
    isActive:      { type: Boolean, default: true },
    lastLoginAt:   { type: Date, default: null },
    lastActiveAt:  { type: Date, default: null },
  },
  { timestamps: true }
);

// Always sync permissions from role before saving
adminUserSchema.pre('save', function () {
  this.permissions = ROLE_PERMISSIONS[this.role] || [];
  this.isActive    = this.status === 'Active';
});

adminUserSchema.pre('findOneAndUpdate', function () {
  const upd = this.getUpdate();
  const role = upd?.role || upd?.$set?.role;
  if (role) {
    const perms = ROLE_PERMISSIONS[role] || [];
    if (upd.$set) {
      upd.$set.permissions = perms;
      upd.$set.isActive    = (upd.$set.status || 'Active') === 'Active';
    } else {
      upd.permissions = perms;
    }
  }
  if ('status' in (upd?.$set || upd || {})) {
    const status = upd?.$set?.status ?? upd?.status;
    if (status !== undefined) {
      if (upd.$set) upd.$set.isActive = status === 'Active';
      else upd.isActive = status === 'Active';
    }
  }
});

adminUserSchema.statics.ROLE_PERMISSIONS = ROLE_PERMISSIONS;

module.exports = mongoose.models.AdminUser || mongoose.model('AdminUser', adminUserSchema);
