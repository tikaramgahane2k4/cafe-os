const Plan = require('../models/Plan');
const Tenant = require('../models/Tenant');
const ActivityLog = require('../models/ActivityLog');
const { createNotification } = require('../services/notificationService');

// Canonical feature key → human label mapping (shared source of truth)
const FEATURE_CATALOG = {
  DIGITAL_MENU:       { label: 'Digital Menu',         icon: '📋' },
  QR_GENERATION:      { label: 'QR Generation',        icon: '🔳' },
  BASIC_ORDERS:       { label: 'Basic Orders',         icon: '🧾' },
  POS:                { label: 'Point of Sale',        icon: '🖥️' },
  INVENTORY:          { label: 'Inventory Management', icon: '📦' },
  CRM:                { label: 'CRM Automations',      icon: '👥' },
  BASIC_REPORTS:      { label: 'Basic Reports',         icon: '📊' },
  ADVANCED_ANALYTICS: { label: 'Advanced Analytics',   icon: '📈' },
  API_ACCESS:         { label: 'API Access',            icon: '🔌' },
  STAFF_MANAGEMENT:   { label: 'Staff Management',      icon: '👔' },
  ONLINE_ORDERING:    { label: 'Online Ordering',       icon: '🛒' },
  LOYALTY_PROGRAM:    { label: 'Loyalty Program',       icon: '⭐' },
  GAMIFICATION:       { label: 'Gamification Engine',  icon: '🎮' },
  REVIEWS:            { label: 'AI Review System',     icon: '🤖' },
  CUSTOM_BRANDING:    { label: 'Custom Branding',      icon: '🎨' },
};

const DEFAULT_PLANS = [
  {
    planName: 'Free',
    price: 0,
    featureList: ['POS', 'BASIC_REPORTS'],
    orderLimit: 100,
    staffLimit: 2,
    planStatus: 'Active',
  },
  {
    planName: 'Starter',
    price: 999,
    featureList: ['POS', 'BASIC_REPORTS', 'INVENTORY', 'STAFF_MANAGEMENT'],
    orderLimit: 500,
    staffLimit: 5,
    planStatus: 'Active',
  },
  {
    planName: 'Growth',
    price: 2499,
    featureList: ['POS', 'CRM', 'INVENTORY', 'BASIC_REPORTS', 'STAFF_MANAGEMENT', 'ONLINE_ORDERING'],
    orderLimit: 2000,
    staffLimit: 15,
    planStatus: 'Active',
  },
  {
    planName: 'Enterprise',
    price: 5999,
    featureList: ['POS', 'CRM', 'INVENTORY', 'ADVANCED_ANALYTICS', 'API_ACCESS', 'STAFF_MANAGEMENT', 'ONLINE_ORDERING', 'LOYALTY_PROGRAM'],
    orderLimit: 10000,
    staffLimit: 100,
    planStatus: 'Active',
  },
];

// POST /api/admin/plans
const createPlan = async (req, res) => {
  try {
    const plan = new Plan(req.body);
    await plan.save();
    await ActivityLog.create({
      actionType: 'PLAN_CREATED',
      adminUser: req.body.adminUser || 'SuperAdmin',
      targetEntity: plan.planName,
      description: `Subscription plan "${plan.planName}" created.`,
    });
    await createNotification({
      message: `Plan "${plan.planName}" was created at ${plan.price === 0 ? 'free' : `₹${plan.price.toLocaleString('en-IN')}/month`}.`,
      type: 'success',
      eventType: 'plan_created',
      link: '/admin/subscriptions',
      meta: { planId: plan._id, planName: plan.planName, price: plan.price },
    });
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /api/admin/plans
const getAllPlans = async (req, res) => {
  try {
    let plans = await Plan.find().sort({ price: 1 });
    // Seed/migrate default plans with structured feature keys when no canonical plans exist
    const hasCanonical = plans.some((p) =>
      ['Free', 'Starter', 'Growth', 'Enterprise'].includes(p.planName)
    );
    if (!hasCanonical) {
      // Upsert each default plan by planName
      await Promise.all(
        DEFAULT_PLANS.map((dp) =>
          Plan.updateOne({ planName: dp.planName }, { $set: dp }, { upsert: true })
        )
      );
      plans = await Plan.find().sort({ price: 1 });
    }
    res.json({ success: true, data: plans, featureCatalog: FEATURE_CATALOG });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/plans/distribution — tenant count per subscription plan
const getPlanDistribution = async (req, res) => {
  try {
    const raw = await Tenant.aggregate([
      { $group: { _id: '$subscriptionPlan', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const data = raw.map((r) => ({ plan: r._id || 'Unknown', count: r.count }));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/plans/:id
const updatePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    await ActivityLog.create({
      actionType: 'PLAN_UPDATED',
      adminUser: req.body.adminUser || 'SuperAdmin',
      targetEntity: plan.planName,
      description: `Subscription plan "${plan.planName}" updated.`,
    });
    await createNotification({
      message: `Plan "${plan.planName}" was updated by billing admin.`,
      type: 'info',
      eventType: 'plan_updated',
      link: '/admin/subscriptions',
      meta: { planId: plan._id, planName: plan.planName, price: plan.price },
    });
    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/plans/:id
const deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    await ActivityLog.create({
      actionType: 'PLAN_DELETED',
      adminUser: 'SuperAdmin',
      targetEntity: plan.planName,
      description: `Subscription plan "${plan.planName}" deleted.`,
    });
    await createNotification({
      message: `Plan "${plan.planName}" was deleted from the catalog.`,
      type: 'warning',
      eventType: 'plan_deleted',
      link: '/admin/subscriptions',
      meta: { planName: plan.planName },
    });
    res.json({ success: true, message: 'Plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createPlan, getAllPlans, updatePlan, deletePlan, getPlanDistribution };
