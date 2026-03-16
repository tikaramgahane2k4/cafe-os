const bcrypt = require('bcryptjs');
const AdminUser   = require('../models/AdminUser');
const ActivityLog = require('../models/ActivityLog');

const { ROLE_PERMISSIONS } = AdminUser;

// helper: parse request metadata for audit logs
function requestMeta(req) {
  return {
    ipAddress: (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim(),
    device:    req.headers['user-agent']
                 ? req.headers['user-agent'].replace(/\s+/g, ' ').slice(0, 120)
                 : 'Unknown',
  };
}

// POST /api/admin/users
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!password) return res.status(400).json({ success: false, message: 'Password is required' });
    const existing = await AdminUser.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    // permissions auto-set by pre-save hook
    const user = new AdminUser({ name, email, passwordHash, role: role || 'SupportStaff', status: 'Active' });
    await user.save();

    await ActivityLog.create({
      action: 'ADMIN_USER_CREATED',
      target: email,
      performedBy: req.admin?.name || req.admin?.role || 'SuperAdmin',
      severity: 'INFO',
      afterValue: JSON.stringify({ name, email, role: user.role }),
      ...requestMeta(req),
    });

    const { passwordHash: _, ...userData } = user.toObject();
    res.status(201).json({ success: true, data: userData });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const users = await AdminUser.find({}, '-passwordHash').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/users/:id
const updateUser = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.passwordHash;
    delete updates.permissions; // never allow manual override — derived from role by hook

    if (updates.password) {
      updates.passwordHash = await bcrypt.hash(updates.password, 10);
      delete updates.password;
    }

    // Sync isActive with status
    if (updates.status !== undefined) {
      updates.isActive = updates.status === 'Active';
    } else if (updates.isActive !== undefined) {
      updates.status = updates.isActive ? 'Active' : 'Inactive';
    }

    const before = await AdminUser.findById(req.params.id).select('-passwordHash');
    if (!before) return res.status(404).json({ success: false, message: 'User not found' });

    const user = await AdminUser.findByIdAndUpdate(
      req.params.id,
      { ...updates, permissions: ROLE_PERMISSIONS[updates.role || before.role] || [] },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    await ActivityLog.create({
      action: 'ADMIN_USER_UPDATED',
      target: user.email,
      performedBy: req.admin?.name || req.admin?.role || 'SuperAdmin',
      severity: updates.status === 'Suspended' ? 'WARNING' : 'INFO',
      beforeValue: JSON.stringify({ role: before.role, status: before.status }),
      afterValue:  JSON.stringify({ role: user.role,   status: user.status }),
      ...requestMeta(req),
    });

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await AdminUser.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await ActivityLog.create({
      action: 'ADMIN_USER_DELETED',
      target: user.email,
      performedBy: req.admin?.name || req.admin?.role || 'SuperAdmin',
      severity: 'WARNING',
      beforeValue: JSON.stringify({ name: user.name, role: user.role }),
      ...requestMeta(req),
    });

    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/users/role-permissions — return the RBAC map for the frontend
const getRolePermissions = (req, res) => {
  res.json({ success: true, data: ROLE_PERMISSIONS });
};

module.exports = { createUser, getAllUsers, updateUser, deleteUser, getRolePermissions };
