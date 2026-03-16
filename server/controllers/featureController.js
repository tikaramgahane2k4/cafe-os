const Feature = require('../models/Feature');
const Tenant = require('../models/Tenant');
const ActivityLog = require('../models/ActivityLog');

// ── Default feature catalogue ─────────────────────────────────────────────
const DEFAULT_FEATURES = [
  {
    name: 'Point of Sale',
    key: 'POS',
    description: 'Core POS terminal for processing dine-in and counter orders.',
    globalEnabled: true,
    plansEnabled: ['Free', 'Starter', 'Growth', 'Pro', 'Enterprise'],
    tenantOverrides: [],
  },
  {
    name: 'Inventory Management',
    key: 'INVENTORY',
    description: 'Track stock levels and receive low-inventory alerts automatically.',
    globalEnabled: false,
    plansEnabled: ['Starter', 'Growth', 'Pro', 'Enterprise'],
    tenantOverrides: [],
  },
  {
    name: 'CRM System',
    key: 'CRM',
    description: 'Manage customer profiles, segments, and marketing campaigns.',
    globalEnabled: false,
    plansEnabled: ['Growth', 'Enterprise'],
    tenantOverrides: [],
  },
  {
    name: 'Basic Reports',
    key: 'BASIC_REPORTS',
    description: 'Daily sales summaries, order counts, and simple revenue charts.',
    globalEnabled: false,
    plansEnabled: ['Free', 'Starter', 'Growth', 'Pro', 'Enterprise'],
    tenantOverrides: [],
  },
  {
    name: 'Advanced Analytics',
    key: 'ADVANCED_ANALYTICS',
    description: 'Deep-dive analytics: cohorts, heatmaps, and predictive Revenue.',
    globalEnabled: false,
    plansEnabled: ['Enterprise'],
    tenantOverrides: [],
  },
  {
    name: 'API Access',
    key: 'API_ACCESS',
    description: 'REST API access to integrate CafeOS data with third-party tools.',
    globalEnabled: false,
    plansEnabled: ['Enterprise'],
    tenantOverrides: [],
  },
  {
    name: 'Staff Management',
    key: 'STAFF_MANAGEMENT',
    description: 'Role-based staff accounts, shift tracking, and permissions.',
    globalEnabled: false,
    plansEnabled: ['Starter', 'Growth', 'Pro', 'Enterprise'],
    tenantOverrides: [],
  },
  {
    name: 'Online Ordering',
    key: 'ONLINE_ORDERING',
    description: 'Accept orders from a public-facing web storefront.',
    globalEnabled: false,
    plansEnabled: ['Growth', 'Pro', 'Enterprise'],
    tenantOverrides: [],
  },
  {
    name: 'Loyalty Program',
    key: 'LOYALTY_PROGRAM',
    description: 'Allow customers to earn and redeem loyalty points on every order.',
    globalEnabled: false,
    plansEnabled: ['Enterprise'],
    tenantOverrides: [],
  },
  {
    name: 'Gamification',
    key: 'GAMIFICATION',
    description: 'Add badges, streaks, and leaderboard mechanics to boost engagement.',
    globalEnabled: false,
    plansEnabled: ['Enterprise'],
    tenantOverrides: [],
  },
  {
    name: 'Review System',
    key: 'REVIEWS',
    description: 'Let customers leave ratings and reviews for menu items.',
    globalEnabled: false,
    plansEnabled: ['Growth', 'Enterprise'],
    tenantOverrides: [],
  },
  {
    name: 'Push Notifications',
    key: 'NOTIFICATIONS',
    description: 'Send push and email notifications for orders, offers, and updates.',
    globalEnabled: false,
    plansEnabled: ['Growth', 'Enterprise'],
    tenantOverrides: [],
  },
];

// ── Helper: compute tenant usage count for a feature ──────────────────────
async function computeTenantCount(feature) {
  if (feature.globalEnabled) {
    return Tenant.countDocuments({ status: 'Active' });
  }
  const planMatches = feature.plansEnabled?.length
    ? Tenant.countDocuments({ subscriptionPlan: { $in: feature.plansEnabled }, status: 'Active' })
    : Promise.resolve(0);
  const overrideMatches = feature.tenantOverrides?.length
    ? Tenant.countDocuments({ _id: { $in: feature.tenantOverrides }, status: 'Active' })
    : Promise.resolve(0);
  const [planCount, overrideCount] = await Promise.all([planMatches, overrideMatches]);
  // Unique count: overrides may already belong to matching plans — sum is a max, fine for display
  return planCount + overrideCount;
}

// ── GET /api/admin/features ───────────────────────────────────────────────
const getAllFeatures = async (req, res) => {
  try {
    let features = await Feature.find().sort({ name: 1 });

    // Seed new structured defaults if no canonical features exist yet
    const hasNew = features.some((f) => f.key);
    if (!hasNew) {
      // Remove old-style docs (featureName field only) and insert new defaults
      await Feature.deleteMany({});
      await Feature.insertMany(DEFAULT_FEATURES);
      features = await Feature.find().sort({ name: 1 });
    }

    // Attach tenant usage count to each feature
    const withCounts = await Promise.all(
      features.map(async (f) => {
        const tenantCount = await computeTenantCount(f);
        return { ...f.toObject(), tenantCount };
      })
    );

    res.json({ success: true, data: withCounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── PATCH /api/admin/features/:id ─────────────────────────────────────────
// Accepts any combination of: { globalEnabled, plansEnabled, tenantOverrides }
const updateFeature = async (req, res) => {
  try {
    const allowed = ['globalEnabled', 'plansEnabled', 'tenantOverrides'];
    const updates = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    }
    // Legacy: accept isEnabled as alias for globalEnabled
    if (req.body.isEnabled !== undefined && req.body.globalEnabled === undefined) {
      updates.globalEnabled = req.body.isEnabled;
    }
    // Keep isEnabled in sync
    if (updates.globalEnabled !== undefined) {
      updates.isEnabled = updates.globalEnabled;
    }

    const feature = await Feature.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );
    if (!feature) return res.status(404).json({ success: false, message: 'Feature not found' });

    const tenantCount = await computeTenantCount(feature);

    const scopeSummary = feature.globalEnabled
      ? 'globally enabled'
      : `plans: [${(feature.plansEnabled || []).join(', ')}]`;

    await ActivityLog.create({
      actionType: 'FEATURE_FLAG_UPDATED',
      adminUser: req.body.adminUser || 'SuperAdmin',
      targetEntity: feature.name,
      description: `Feature "${feature.name}" updated — ${scopeSummary}.`,
    });

    res.json({ success: true, data: { ...feature.toObject(), tenantCount } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── GET /api/admin/features/resolve?tenantId=<_id>&plan=<planName> ────────
// Returns which feature keys are active for a given tenant
const resolveForTenant = async (req, res) => {
  try {
    const { tenantId, plan } = req.query;
    if (!tenantId || !plan) {
      return res.status(400).json({ success: false, message: 'tenantId and plan are required' });
    }
    const features = await Feature.find().lean();
    const resolved = {};
    for (const f of features) {
      resolved[f.key] =
        f.globalEnabled ||
        (f.tenantOverrides || []).includes(tenantId) ||
        (f.plansEnabled || []).includes(plan);
    }
    res.json({ success: true, data: resolved });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllFeatures, updateFeature, resolveForTenant };
