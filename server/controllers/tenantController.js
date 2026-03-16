const Tenant = require('../models/Tenant');
const ActivityLog = require('../models/ActivityLog');

/* ── Credential generators ─────────────────────────────── */
function genTenantId() {
  return 'tenant_' + Math.floor(1000 + Math.random() * 9000);
}

function genAdminEmail(cafeName) {
  const slug = cafeName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 20);
  return `admin@${slug}.com`;
}

function genPassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
  let pwd = '';
  for (let i = 0; i < length; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  return pwd;
}

function planExpiry(plan) {
  const d = new Date();
  const months = { Free: 1, Starter: 1, Pro: 12, Enterprise: 12 };
  d.setMonth(d.getMonth() + (months[plan] || 1));
  return d;
}

/* ── Activity log helper ────────────────────────────────── */
async function log(action, target, performedBy, details) {
  try {
    await ActivityLog.create({ actionType: action, adminUser: performedBy, targetEntity: target, description: details });
  } catch (_) { /* non-fatal */ }
}

/* ── GET /api/admin/tenants ─────────────────────────────── */
const getAllTenants = async (req, res) => {
  try {
    const { search, status, sort = 'createdAt', order = 'desc', page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status && status !== 'ALL') filter.status = status;
    if (search) {
      filter.$or = [
        { cafeName: { $regex: search, $options: 'i' } },
        { email:    { $regex: search, $options: 'i' } },
        { ownerName:{ $regex: search, $options: 'i' } },
      ];
    }

    const sortMap = {
      createdAt:     { createdAt: order === 'asc' ? 1 : -1 },
      planExpiryDate:{ planExpiryDate: order === 'asc' ? 1 : -1 },
      usage:         { ordersUsed: order === 'asc' ? 1 : -1 },
      cafeName:      { cafeName: order === 'asc' ? 1 : -1 },
    };
    const sortQuery = sortMap[sort] || { createdAt: -1 };

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Tenant.countDocuments(filter);
    const tenants = await Tenant.find(filter).sort(sortQuery).skip(skip).limit(parseInt(limit));

    res.json({ success: true, data: tenants, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ── GET /api/admin/tenants/:id ─────────────────────────── */
const getTenantById = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
    res.json({ success: true, data: tenant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ── POST /api/admin/tenants ────────────────────────────── */
const createTenant = async (req, res) => {
  try {
    const { cafeName, subscriptionPlan = 'Free', adminUser = 'SuperAdmin' } = req.body;

    // Auto-generate lifecycle fields
    const tenantId    = genTenantId();
    const adminEmail  = genAdminEmail(cafeName || 'cafe');
    const tempPassword = genPassword();
    const subscriptionStartDate = new Date();
    const planExpiryDate = planExpiry(subscriptionPlan);

    const tenant = new Tenant({
      ...req.body,
      tenantId,
      adminEmail,
      tempPassword,
      subscriptionStartDate,
      planExpiryDate,
      lastActiveAt: new Date(),
    });
    await tenant.save();

    await log(
      'TENANT_CREATED',
      cafeName,
      adminUser,
      `Tenant ${cafeName} created with ${subscriptionPlan} plan. ID: ${tenantId}`,
    );

    res.status(201).json({
      success: true,
      data: tenant,
      credentials: { tenantId, adminEmail, tempPassword },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* ── PATCH /api/admin/tenants/:id ───────────────────────── */
const updateTenant = async (req, res) => {
  try {
    // If plan changed, update orderLimit and reset expiry
    if (req.body.subscriptionPlan) {
      const expiry = planExpiry(req.body.subscriptionPlan);
      req.body.planExpiryDate = expiry;
    }
    const tenant = await Tenant.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });

    await log('TENANT_UPDATED', tenant.cafeName, req.body.adminUser || 'SuperAdmin', `Tenant ${tenant.cafeName} updated.`);
    res.json({ success: true, data: tenant });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* ── PATCH /api/admin/tenants/:id/status ────────────────── */
const updateTenantStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const tenant = await Tenant.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });

    await log('TENANT_STATUS_CHANGED', tenant.cafeName, req.body.adminUser || 'SuperAdmin', `Status changed to ${status}.`);
    res.json({ success: true, data: tenant });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* ── PATCH /api/admin/tenants/:id/activity ──────────────── */
const trackActivity = async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { lastActiveAt: new Date(), $inc: { ordersUsed: req.body.orders || 0 } },
      { new: true }
    );
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
    res.json({ success: true, data: tenant });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* ── DELETE /api/admin/tenants/:id ──────────────────────── */
const deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndDelete(req.params.id);
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });

    await log('TENANT_DELETED', tenant.cafeName, 'SuperAdmin', `Tenant ${tenant.cafeName} deleted.`);
    res.json({ success: true, message: 'Tenant deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllTenants, getTenantById, createTenant, updateTenant, updateTenantStatus, trackActivity, deleteTenant };
