const Feature = require('../models/Feature');
const Tenant = require('../models/Tenant');
const ActivityLog = require('../models/ActivityLog');
const { createNotification } = require('../services/notificationService');

const ENVIRONMENTS = ['dev', 'staging', 'production'];
const CANONICAL_FLAG_PLANS = ['Starter', 'Pro', 'Elite'];
const FEATURE_PLAN_CANONICAL = {
  Free: 'Starter',
  Starter: 'Starter',
  Growth: 'Pro',
  Pro: 'Pro',
  Enterprise: 'Elite',
  Elite: 'Elite',
};

const DEFAULT_FEATURES = [
  {
    name: 'Point of Sale',
    key: 'POS',
    description: 'Core POS terminal for processing dine-in and counter orders.',
    dependencies: [],
    defaultState: { isGlobal: true, plans: ['Starter', 'Pro', 'Elite'], rolloutPercentage: 100 },
  },
  {
    name: 'Digital Menu',
    key: 'DIGITAL_MENU',
    description: 'Publish a mobile-friendly live menu for guests to browse in store and online.',
    dependencies: [],
    defaultState: { isGlobal: false, plans: ['Starter', 'Pro', 'Elite'], rolloutPercentage: 100 },
  },
  {
    name: 'QR Generation',
    key: 'QR_GENERATION',
    description: 'Generate branded QR entry points for dine-in tables, counters, and takeaway flows.',
    dependencies: ['DIGITAL_MENU'],
    defaultState: { isGlobal: false, plans: ['Starter', 'Pro', 'Elite'], rolloutPercentage: 100 },
  },
  {
    name: 'Basic Orders',
    key: 'BASIC_ORDERS',
    description: 'Capture simple counter and dine-in orders without advanced workflow automation.',
    dependencies: ['POS'],
    defaultState: { isGlobal: false, plans: ['Starter', 'Pro', 'Elite'], rolloutPercentage: 100 },
  },
  {
    name: 'Inventory Management',
    key: 'INVENTORY',
    description: 'Track stock levels and receive low-inventory alerts automatically.',
    dependencies: ['BASIC_ORDERS'],
    defaultState: { isGlobal: false, plans: ['Starter', 'Pro', 'Elite'], rolloutPercentage: 100 },
  },
  {
    name: 'CRM Automations',
    key: 'CRM',
    description: 'Automate lifecycle messaging, re-engagement, and CRM-driven customer journeys.',
    dependencies: ['BASIC_ORDERS'],
    defaultState: { isGlobal: false, plans: ['Pro', 'Elite'], rolloutPercentage: 100 },
  },
  {
    name: 'Basic Reports',
    key: 'BASIC_REPORTS',
    description: 'Daily sales summaries, order counts, and simple revenue charts.',
    dependencies: ['BASIC_ORDERS'],
    defaultState: { isGlobal: false, plans: ['Starter', 'Pro', 'Elite'], rolloutPercentage: 100 },
  },
  {
    name: 'Advanced Analytics',
    key: 'ADVANCED_ANALYTICS',
    description: 'Deep-dive analytics: cohorts, heatmaps, and predictive revenue analysis.',
    dependencies: ['BASIC_REPORTS'],
    defaultState: { isGlobal: false, plans: ['Elite'], rolloutPercentage: 100 },
  },
  {
    name: 'API Access',
    key: 'API_ACCESS',
    description: 'REST API access to integrate CafeOS data with third-party tools.',
    dependencies: [],
    defaultState: { isGlobal: false, plans: ['Elite'], rolloutPercentage: 100 },
  },
  {
    name: 'Staff Management',
    key: 'STAFF_MANAGEMENT',
    description: 'Role-based staff accounts, shift tracking, and permissions.',
    dependencies: [],
    defaultState: { isGlobal: false, plans: ['Starter', 'Pro', 'Elite'], rolloutPercentage: 100 },
  },
  {
    name: 'Online Ordering',
    key: 'ONLINE_ORDERING',
    description: 'Accept orders from a public-facing web storefront.',
    dependencies: ['DIGITAL_MENU', 'BASIC_ORDERS'],
    defaultState: { isGlobal: false, plans: ['Pro', 'Elite'], rolloutPercentage: 100 },
  },
  {
    name: 'Loyalty Program',
    key: 'LOYALTY_PROGRAM',
    description: 'Allow customers to earn and redeem loyalty points on every order.',
    dependencies: ['CRM'],
    defaultState: { isGlobal: false, plans: ['Elite'], rolloutPercentage: 100 },
  },
  {
    name: 'Gamification Engine',
    key: 'GAMIFICATION',
    description: 'Add streaks, challenges, and reward loops that increase guest retention.',
    dependencies: ['LOYALTY_PROGRAM'],
    defaultState: { isGlobal: false, plans: ['Pro', 'Elite'], rolloutPercentage: 100 },
  },
  {
    name: 'AI Review System',
    key: 'REVIEWS',
    description: 'Collect, summarize, and action customer reviews with AI-assisted insights.',
    dependencies: ['CRM'],
    defaultState: { isGlobal: false, plans: ['Elite'], rolloutPercentage: 100 },
  },
  {
    name: 'Custom Branding',
    key: 'CUSTOM_BRANDING',
    description: 'Apply tenant-specific brand colors, assets, and white-label presentation across the product.',
    dependencies: ['DIGITAL_MENU'],
    defaultState: { isGlobal: false, plans: ['Elite'], rolloutPercentage: 100 },
  },
  {
    name: 'Push Notifications',
    key: 'NOTIFICATIONS',
    description: 'Send push and email notifications for orders, offers, and updates.',
    dependencies: ['BASIC_ORDERS'],
    defaultState: { isGlobal: false, plans: ['Pro', 'Elite'], rolloutPercentage: 100 },
  },
];

const defaultFeatureMap = new Map(DEFAULT_FEATURES.map((feature) => [feature.key, feature]));

function normalizeEnvironment(value = 'production') {
  return ENVIRONMENTS.includes(value) ? value : 'production';
}

function uniqueStrings(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean).map(String))];
}

function normalizeFeaturePlan(planName = '') {
  return FEATURE_PLAN_CANONICAL[String(planName || '').trim()] || String(planName || '').trim();
}

function normalizeFeaturePlans(plans = []) {
  return uniqueStrings((Array.isArray(plans) ? plans : []).map(normalizeFeaturePlan))
    .sort((left, right) => {
      const leftIndex = CANONICAL_FLAG_PLANS.indexOf(left);
      const rightIndex = CANONICAL_FLAG_PLANS.indexOf(right);

      if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right);
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      return leftIndex - rightIndex;
    });
}

function clampRollout(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function createEnvironmentState(state = {}, fallbackUpdatedAt = new Date()) {
  const plans = normalizeFeaturePlans(state.plans || state.plansEnabled || []);
  const tenantOverrides = uniqueStrings(state.tenantOverrides || []);
  const hasScope = Boolean(state.isGlobal || state.globalEnabled || plans.length > 0 || tenantOverrides.length > 0);
  const rolloutPercentage = state.rolloutPercentage !== undefined
    ? clampRollout(state.rolloutPercentage)
    : hasScope ? 100 : 0;

  return {
    isGlobal: Boolean(state.isGlobal ?? state.globalEnabled ?? false),
    plans,
    tenantOverrides,
    rolloutPercentage,
    updatedBy: state.updatedBy || 'System',
    updatedAt: state.updatedAt ? new Date(state.updatedAt) : new Date(fallbackUpdatedAt),
  };
}

function createEnvironmentSet(defaultState, fallbackUpdatedAt = new Date()) {
  const baseState = createEnvironmentState(defaultState, fallbackUpdatedAt);

  return {
    dev: { ...baseState },
    staging: { ...baseState },
    production: { ...baseState },
  };
}

function hasScope(state = {}) {
  return Boolean(state.isGlobal || (state.plans || []).length || (state.tenantOverrides || []).length);
}

function getFeatureStatus(state = {}) {
  if (!hasScope(state) || Number(state.rolloutPercentage || 0) <= 0) return 'disabled';
  if (Number(state.rolloutPercentage || 0) < 100) return 'partial';
  return 'active';
}

function hashString(value = '') {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function isTenantInRollout(tenantId, rolloutPercentage) {
  const rollout = clampRollout(rolloutPercentage);
  if (rollout <= 0) return false;
  if (rollout >= 100) return true;
  return (hashString(String(tenantId)) % 100) < rollout;
}

function getDefaultDefinitionForFeature(feature) {
  return defaultFeatureMap.get(feature.key) || {
    defaultState: {
      isGlobal: Boolean(feature.globalEnabled || feature.isGlobal),
      plans: feature.plansEnabled || feature.plans || [],
      tenantOverrides: feature.tenantOverrides || [],
      rolloutPercentage: feature.rolloutPercentage,
    },
    dependencies: feature.dependencies || [],
  };
}

function getEnvironmentState(feature, environment = 'production') {
  const safeEnvironment = normalizeEnvironment(environment);
  const defaultDefinition = getDefaultDefinitionForFeature(feature);
  const fallback = createEnvironmentState({
    isGlobal: feature.isGlobal ?? feature.globalEnabled ?? feature.isEnabled ?? defaultDefinition.defaultState?.isGlobal,
    plans: feature.plans || feature.plansEnabled || defaultDefinition.defaultState?.plans || [],
    tenantOverrides: feature.tenantOverrides || defaultDefinition.defaultState?.tenantOverrides || [],
    rolloutPercentage: feature.rolloutPercentage ?? defaultDefinition.defaultState?.rolloutPercentage,
    updatedBy: feature.updatedBy || 'Legacy migration',
    updatedAt: feature.updatedAt,
  }, feature.updatedAt || new Date());

  const environments = feature.environments || {};
  return createEnvironmentState(environments[safeEnvironment] || fallback, feature.updatedAt || new Date());
}

function syncProductionAliases(feature) {
  const production = getEnvironmentState(feature, 'production');
  feature.environment = 'production';
  feature.isGlobal = production.isGlobal;
  feature.globalEnabled = production.isGlobal;
  feature.plans = production.plans;
  feature.plansEnabled = production.plans;
  feature.tenantOverrides = production.tenantOverrides;
  feature.rolloutPercentage = production.rolloutPercentage;
  feature.updatedBy = production.updatedBy;
  feature.isEnabled = getFeatureStatus(production) === 'active';
}

async function syncDefaultFeatures(features = []) {
  const byKey = new Map(features.filter((feature) => feature.key).map((feature) => [feature.key, feature]));
  const missingFeatures = [];
  const syncSaves = [];

  for (const defaultFeature of DEFAULT_FEATURES) {
    const existing = byKey.get(defaultFeature.key);

    if (!existing) {
      missingFeatures.push({
        name: defaultFeature.name,
        key: defaultFeature.key,
        description: defaultFeature.description,
        dependencies: defaultFeature.dependencies,
        environments: createEnvironmentSet(defaultFeature.defaultState),
      });
      continue;
    }

    let changed = false;

    if (existing.name !== defaultFeature.name) {
      existing.name = defaultFeature.name;
      changed = true;
    }

    if (existing.description !== defaultFeature.description) {
      existing.description = defaultFeature.description;
      changed = true;
    }

    const nextDependencies = uniqueStrings(defaultFeature.dependencies || []);
    if (JSON.stringify(uniqueStrings(existing.dependencies || [])) !== JSON.stringify(nextDependencies)) {
      existing.dependencies = nextDependencies;
      changed = true;
    }

    const nextEnvironments = {};
    let environmentsChanged = false;
    const existingEnvironments = existing.environments || {};

    for (const environment of ENVIRONMENTS) {
      const sourceState = existingEnvironments[environment]
        || getEnvironmentState(existing, 'production');
      const normalizedState = createEnvironmentState(sourceState, existing.updatedAt || new Date());
      nextEnvironments[environment] = normalizedState;

      if (!existingEnvironments[environment]) {
        environmentsChanged = true;
      }
    }

    if (JSON.stringify(existingEnvironments) !== JSON.stringify(nextEnvironments)) {
      existing.environments = nextEnvironments;
      changed = true;
      environmentsChanged = true;
    }

    if (changed || environmentsChanged) {
      syncProductionAliases(existing);
      syncSaves.push(existing.save());
    }
  }

  if (missingFeatures.length > 0) {
    await Feature.insertMany(missingFeatures);
  }

  if (syncSaves.length > 0) {
    await Promise.all(syncSaves);
  }

  if (missingFeatures.length > 0 || syncSaves.length > 0) {
    return Feature.find().sort({ name: 1 });
  }

  return features;
}

function buildDependencyStates(feature, environment, featureMap) {
  return uniqueStrings(feature.dependencies || []).map((dependencyKey) => {
    const dependencyFeature = featureMap.get(dependencyKey);

    if (!dependencyFeature) {
      return {
        key: dependencyKey,
        name: dependencyKey,
        status: 'disabled',
        missing: true,
        warning: `Dependency ${dependencyKey} is missing.`,
      };
    }

    const dependencyState = getEnvironmentState(dependencyFeature, environment);
    const status = getFeatureStatus(dependencyState);

    return {
      key: dependencyFeature.key,
      name: dependencyFeature.name,
      status,
      rolloutPercentage: dependencyState.rolloutPercentage,
      missing: false,
      warning: status === 'disabled'
        ? `${dependencyFeature.name} must be enabled first.`
        : '',
    };
  });
}

function buildTenantSearchFilter(query) {
  if (!query) return {};

  return {
    $or: [
      { cafeName: { $regex: query, $options: 'i' } },
      { tenantId: { $regex: query, $options: 'i' } },
      { ownerName: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
    ],
  };
}

function getEligibleTenants(tenants, state) {
  const planSet = new Set(normalizeFeaturePlans(state.plans || []));
  const overrideSet = new Set((state.tenantOverrides || []).map(String));

  return tenants.filter((tenant) => (
    state.isGlobal
    || planSet.has(normalizeFeaturePlan(tenant.subscriptionPlan))
    || overrideSet.has(String(tenant._id))
  ));
}

function summarizeImpact(feature, environment, activeTenants, featureMap, previewState = null) {
  const state = previewState ? createEnvironmentState(previewState) : getEnvironmentState(feature, environment);
  const eligibleTenants = getEligibleTenants(activeTenants, state);
  const affectedTenants = eligibleTenants.filter((tenant) => isTenantInRollout(tenant._id, state.rolloutPercentage));
  const affectedPlans = normalizeFeaturePlans(affectedTenants.map((tenant) => tenant.subscriptionPlan));
  const dependencyStates = buildDependencyStates(feature, environment, featureMap);
  const blockedDependencies = dependencyStates.filter((dependency) => dependency.status === 'disabled');
  const status = getFeatureStatus(state);

  return {
    state,
    status,
    eligibleTenantCount: eligibleTenants.length,
    affectedTenantCount: affectedTenants.length,
    affectedTenants,
    affectedPlans,
    dependencyStates,
    blockedByDependencies: blockedDependencies.length > 0 && status !== 'disabled',
    dependencyWarnings: blockedDependencies.map((dependency) => dependency.warning),
  };
}

function serializeFeature(feature, environment, summary) {
  const state = summary?.state || getEnvironmentState(feature, environment);
  const status = summary?.status || getFeatureStatus(state);

  return {
    ...feature.toObject(),
    environment: normalizeEnvironment(environment),
    isGlobal: state.isGlobal,
    globalEnabled: state.isGlobal,
    plans: state.plans,
    plansEnabled: state.plans,
    tenantOverrides: state.tenantOverrides,
    rolloutPercentage: state.rolloutPercentage,
    updatedBy: state.updatedBy || feature.updatedBy || 'System',
    updatedAt: state.updatedAt || feature.updatedAt,
    status,
    isEnabled: status === 'active',
    affectedTenantCount: summary?.affectedTenantCount ?? 0,
    eligibleTenantCount: summary?.eligibleTenantCount ?? 0,
    affectedPlans: summary?.affectedPlans ?? [],
    dependencyStates: summary?.dependencyStates ?? [],
    dependencyWarnings: summary?.dependencyWarnings ?? [],
    blockedByDependencies: summary?.blockedByDependencies ?? false,
  };
}

async function loadActiveTenants() {
  return Tenant.find({ status: 'Active' })
    .select('_id tenantId cafeName ownerName email subscriptionPlan status')
    .sort({ cafeName: 1 })
    .lean();
}

function buildNextState(feature, environment, updates = {}) {
  const currentState = getEnvironmentState(feature, environment);
  const nextState = {
    ...currentState,
  };

  if (updates.isGlobal !== undefined) nextState.isGlobal = Boolean(updates.isGlobal);
  if (updates.globalEnabled !== undefined && updates.isGlobal === undefined) nextState.isGlobal = Boolean(updates.globalEnabled);
  if (updates.plans !== undefined) nextState.plans = uniqueStrings(updates.plans);
  if (updates.plansEnabled !== undefined && updates.plans === undefined) nextState.plans = uniqueStrings(updates.plansEnabled);
  if (updates.tenantOverrides !== undefined) nextState.tenantOverrides = uniqueStrings(updates.tenantOverrides);
  if (updates.rolloutPercentage !== undefined) nextState.rolloutPercentage = clampRollout(updates.rolloutPercentage);

  if (hasScope(nextState) && updates.rolloutPercentage === undefined && Number(currentState.rolloutPercentage || 0) === 0) {
    nextState.rolloutPercentage = 100;
  }

  nextState.updatedBy = updates.updatedBy || updates.adminUser || currentState.updatedBy || 'SuperAdmin';
  nextState.updatedAt = new Date();

  return createEnvironmentState(nextState, nextState.updatedAt);
}

async function getAllFeatures(req, res) {
  try {
    const environment = normalizeEnvironment(req.query.environment);
    let features = await Feature.find().sort({ name: 1 });

    const hasStructuredFeatures = features.some((feature) => feature.key);
    if (!hasStructuredFeatures) {
      await Feature.deleteMany({});
      await Feature.insertMany(DEFAULT_FEATURES.map((feature) => ({
        name: feature.name,
        key: feature.key,
        description: feature.description,
        dependencies: feature.dependencies,
        environments: createEnvironmentSet(feature.defaultState),
      })));
      features = await Feature.find().sort({ name: 1 });
    } else {
      features = await syncDefaultFeatures(features);
    }

    const activeTenants = await loadActiveTenants();
    const featureMap = new Map(features.map((feature) => [feature.key, feature]));

    res.json({
      success: true,
      environment,
      data: features.map((feature) => {
        const summary = summarizeImpact(feature, environment, activeTenants, featureMap);
        return serializeFeature(feature, environment, summary);
      }),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getFeatureImpact(req, res) {
  try {
    const environment = normalizeEnvironment(req.query.environment);
    const feature = await Feature.findById(req.params.id);
    if (!feature) return res.status(404).json({ success: false, message: 'Feature not found' });

    const [features, activeTenants] = await Promise.all([
      Feature.find().select('key name dependencies environments globalEnabled plansEnabled tenantOverrides rolloutPercentage updatedBy').lean(),
      loadActiveTenants(),
    ]);
    const featureMap = new Map(features.map((item) => [item.key, item]));
    const summary = summarizeImpact(feature, environment, activeTenants, featureMap);

    res.json({
      success: true,
      data: {
        featureId: feature._id,
        environment,
        status: summary.status,
        affectedTenantCount: summary.affectedTenantCount,
        eligibleTenantCount: summary.eligibleTenantCount,
        affectedPlans: summary.affectedPlans,
        affectedTenants: summary.affectedTenants.slice(0, 12).map((tenant) => ({
          id: tenant._id,
          tenantId: tenant.tenantId,
          cafeName: tenant.cafeName,
          ownerName: tenant.ownerName,
          email: tenant.email,
          plan: normalizeFeaturePlan(tenant.subscriptionPlan),
        })),
        rolloutPercentage: summary.state.rolloutPercentage,
        dependencyStates: summary.dependencyStates,
        dependencyWarnings: summary.dependencyWarnings,
        blockedByDependencies: summary.blockedByDependencies,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function previewFeatureUpdate(req, res) {
  try {
    const environment = normalizeEnvironment(req.body.environment || req.query.environment);
    const feature = await Feature.findById(req.params.id);
    if (!feature) return res.status(404).json({ success: false, message: 'Feature not found' });

    const [features, activeTenants] = await Promise.all([
      Feature.find().select('key name dependencies environments globalEnabled plansEnabled tenantOverrides rolloutPercentage updatedBy').lean(),
      loadActiveTenants(),
    ]);
    const featureMap = new Map(features.map((item) => [item.key, item]));
    const nextState = buildNextState(feature, environment, req.body);
    const summary = summarizeImpact(feature, environment, activeTenants, featureMap, nextState);

    res.json({
      success: true,
      data: {
        environment,
        status: summary.status,
        rolloutPercentage: nextState.rolloutPercentage,
        affectedTenantCount: summary.affectedTenantCount,
        eligibleTenantCount: summary.eligibleTenantCount,
        affectedPlans: summary.affectedPlans,
        affectedTenants: summary.affectedTenants.slice(0, 12).map((tenant) => ({
          id: tenant._id,
          tenantId: tenant.tenantId,
          cafeName: tenant.cafeName,
          ownerName: tenant.ownerName,
          email: tenant.email,
          plan: normalizeFeaturePlan(tenant.subscriptionPlan),
        })),
        dependencyStates: summary.dependencyStates,
        dependencyWarnings: summary.dependencyWarnings,
        blockedByDependencies: summary.blockedByDependencies,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function searchTenantsForFeature(req, res) {
  try {
    const query = String(req.query.q || '').trim();
    const limit = Math.max(1, Math.min(20, Number(req.query.limit) || 8));

    if (query.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const tenants = await Tenant.find({
      status: 'Active',
      ...buildTenantSearchFilter(query),
    })
      .select('_id tenantId cafeName ownerName email subscriptionPlan')
      .sort({ cafeName: 1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: tenants.map((tenant) => ({
        id: tenant._id,
        tenantId: tenant.tenantId,
        cafeName: tenant.cafeName,
        ownerName: tenant.ownerName,
        email: tenant.email,
        plan: normalizeFeaturePlan(tenant.subscriptionPlan),
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function updateFeature(req, res) {
  try {
    const environment = normalizeEnvironment(req.body.environment || req.query.environment);
    const feature = await Feature.findById(req.params.id);
    if (!feature) return res.status(404).json({ success: false, message: 'Feature not found' });

    const features = await Feature.find().select('key name dependencies environments globalEnabled plansEnabled tenantOverrides rolloutPercentage updatedBy').lean();
    const featureMap = new Map(features.map((item) => [item.key, item]));
    const nextState = buildNextState(feature, environment, req.body);
    const preview = summarizeImpact(feature, environment, await loadActiveTenants(), featureMap, nextState);

    if (preview.blockedByDependencies) {
      return res.status(400).json({
        success: false,
        message: preview.dependencyWarnings[0] || 'One or more dependencies must be enabled first.',
      });
    }

    feature.environments = {
      ...(feature.environments?.toObject ? feature.environments.toObject() : feature.environments),
      [environment]: nextState,
    };
    syncProductionAliases(feature);
    await feature.save();

    const scopeSummary = nextState.isGlobal
      ? 'global access'
      : `${nextState.plans.length} plans · ${nextState.tenantOverrides.length} tenant overrides`;

    await ActivityLog.create({
      actionType: 'FEATURE_FLAG_UPDATED',
      adminUser: nextState.updatedBy || 'SuperAdmin',
      targetEntity: `${feature.name} (${environment})`,
      description: `Feature "${feature.name}" updated in ${environment} with ${nextState.rolloutPercentage}% rollout and ${scopeSummary}.`,
    });

    await createNotification({
      message: `Feature flag "${feature.name}" was updated in ${environment}.`,
      type: getFeatureStatus(nextState) === 'active' ? 'success' : 'warning',
      eventType: 'feature_flag_updated',
      link: '/admin/feature-flags',
      meta: {
        featureId: feature._id,
        featureName: feature.name,
        environment,
        isGlobal: nextState.isGlobal,
        plans: nextState.plans,
        tenantOverrides: nextState.tenantOverrides,
        rolloutPercentage: nextState.rolloutPercentage,
      },
    });

    const activeTenants = await loadActiveTenants();
    const updatedFeatureMap = new Map([
      ...featureMap,
      [feature.key, feature],
    ]);
    const summary = summarizeImpact(feature, environment, activeTenants, updatedFeatureMap);

    res.json({
      success: true,
      data: serializeFeature(feature, environment, summary),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function resolveForTenant(req, res) {
  try {
    const { tenantId, plan } = req.query;
    const environment = normalizeEnvironment(req.query.environment);

    if (!tenantId || !plan) {
      return res.status(400).json({ success: false, message: 'tenantId and plan are required' });
    }

    const features = await Feature.find().lean();
    const resolved = {};

    for (const feature of features) {
      const state = getEnvironmentState(feature, environment);
      const normalizedPlan = normalizeFeaturePlan(plan);
      const eligible = state.isGlobal
        || (state.plans || []).includes(normalizedPlan)
        || (state.tenantOverrides || []).includes(String(tenantId));

      resolved[feature.key] = eligible && isTenantInRollout(tenantId, state.rolloutPercentage);
    }

    res.json({ success: true, environment, data: resolved });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  getAllFeatures,
  getFeatureImpact,
  previewFeatureUpdate,
  searchTenantsForFeature,
  updateFeature,
  resolveForTenant,
};
