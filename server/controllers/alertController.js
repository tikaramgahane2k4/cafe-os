const Alert = require('../models/Alert');
const Tenant = require('../models/Tenant');

function daysUntil(date) {
  if (!date) return null;
  return Math.floor((new Date(date).getTime() - Date.now()) / 86400000);
}

function daysSince(date) {
  if (!date) return null;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

async function upsertAlert({ type, tenant, severity, message, meta = {} }) {
  return Alert.findOneAndUpdate(
    { type, tenantId: tenant._id, status: 'Active' },
    {
      type,
      tenantId: tenant._id,
      tenantName: tenant.cafeName,
      severity,
      message,
      status: 'Active',
      meta,
    },
    { upsert: true, new: true }
  );
}

async function generateTenantAlerts() {
  const tenants = await Tenant.find().lean();

  for (const tenant of tenants) {
    const orderPct = tenant.orderLimit > 0 ? Math.round((tenant.ordersUsed / tenant.orderLimit) * 100) : 0;
    if (orderPct >= 85) {
      await upsertAlert({
        type: 'Order Limit',
        tenant,
        severity: orderPct >= 100 ? 'Critical' : 'Warning',
        message: `${tenant.cafeName} is at ${orderPct}% of order limit (${tenant.ordersUsed}/${tenant.orderLimit}).`,
        meta: { orderPct, ordersUsed: tenant.ordersUsed, orderLimit: tenant.orderLimit },
      });
    }

    const exp = daysUntil(tenant.planExpiryDate);
    if (exp !== null && exp >= 0 && exp <= 5) {
      await upsertAlert({
        type: 'Subscription Expiry',
        tenant,
        severity: exp <= 2 ? 'Critical' : 'Warning',
        message: `${tenant.cafeName} subscription expires in ${exp} day${exp === 1 ? '' : 's'}.`,
        meta: { daysRemaining: exp, planExpiryDate: tenant.planExpiryDate },
      });
    }

    const inactive = daysSince(tenant.lastActiveAt);
    if (inactive !== null && inactive >= 30) {
      await upsertAlert({
        type: 'Inactive Tenant',
        tenant,
        severity: inactive >= 60 ? 'Critical' : 'Warning',
        message: `${tenant.cafeName} has been inactive for ${inactive} days.`,
        meta: { inactiveDays: inactive },
      });
    }
  }
}

const getAlerts = async (req, res) => {
  try {
    await generateTenantAlerts();

    const { severity = '', status = '', type = '', limit = 100 } = req.query;
    const query = {};
    if (severity && severity !== 'ALL') query.severity = severity;
    if (status && status !== 'ALL') query.status = status;
    if (type && type !== 'ALL') query.type = type;

    const data = await Alert.find(query).sort({ createdAt: -1 }).limit(Number(limit)).lean();
    const stats = {
      total: data.length,
      active: data.filter((a) => a.status === 'Active').length,
      warning: data.filter((a) => a.severity === 'Warning').length,
      critical: data.filter((a) => a.severity === 'Critical').length,
    };

    res.json({ success: true, data, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateAlertStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Active', 'Resolved', 'Dismissed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    const alert = await Alert.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });
    res.json({ success: true, data: alert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAlerts, updateAlertStatus };
