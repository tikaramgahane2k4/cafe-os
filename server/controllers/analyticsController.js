const Tenant = require('../models/Tenant');
const ActivityLog = require('../models/ActivityLog');
const Invoice = require('../models/Invoice');

const PLAN_PRICE = { Free: 0, Starter: 999, Growth: 2499, Pro: 5000, Enterprise: 5999, Elite: 5999 };
const REVENUE_STATUSES = ['Paid', 'Pending'];
const TENANT_INACTIVE_DAYS = 14;
const TENANT_DORMANT_DAYS = 21;
const ALERT_WINDOW_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value = new Date()) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

function addDays(value, amount) {
  const date = new Date(value);
  date.setDate(date.getDate() + amount);
  return date;
}

function startOfMonth(value = new Date()) {
  const date = new Date(value);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfMonth(value = new Date()) {
  const date = new Date(value);
  date.setMonth(date.getMonth() + 1, 0);
  date.setHours(23, 59, 59, 999);
  return date;
}

function diffDaysInclusive(start, end) {
  return Math.max(1, Math.round((startOfDay(end) - startOfDay(start)) / DAY_MS) + 1);
}

function pctChange(current = 0, previous = 0) {
  if (!previous) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function toDisplayDate(value) {
  return new Date(value).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

function getRangeWindow(query = {}) {
  const now = new Date();
  const range = ['7d', '30d', 'custom'].includes(query.range) ? query.range : '30d';

  let currentStart = range === '7d'
    ? startOfDay(addDays(now, -6))
    : startOfDay(addDays(now, -29));
  let currentEnd = endOfDay(now);

  if (range === 'custom') {
    currentStart = query.dateFrom ? startOfDay(query.dateFrom) : startOfDay(addDays(now, -29));
    currentEnd = query.dateTo ? endOfDay(query.dateTo) : endOfDay(now);
  }

  if (currentStart > currentEnd) {
    const swappedStart = startOfDay(currentEnd);
    currentEnd = endOfDay(currentStart);
    currentStart = swappedStart;
  }

  const dayCount = diffDaysInclusive(currentStart, currentEnd);
  const previousEnd = endOfDay(addDays(currentStart, -1));
  const previousStart = startOfDay(addDays(previousEnd, -(dayCount - 1)));

  const currentLabel = range === '7d'
    ? 'this week'
    : range === '30d'
      ? 'last 30 days'
      : `${toDisplayDate(currentStart)} - ${toDisplayDate(currentEnd)}`;

  return {
    range,
    dayCount,
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
    currentLabel,
    comparisonLabel: `vs previous ${dayCount} day${dayCount === 1 ? '' : 's'}`,
  };
}

function buildDateLabels(start, end) {
  const labels = [];
  const cursor = startOfDay(start);

  while (cursor <= end) {
    labels.push(cursor.toISOString().split('T')[0]);
    cursor.setDate(cursor.getDate() + 1);
  }

  return labels;
}

function mapSeries(labels, rows = [], valueKey = 'count') {
  const byKey = Object.fromEntries(rows.map((row) => [row._id, row]));

  return labels.map((date) => ({
    date,
    label: toDisplayDate(date),
    [valueKey]: byKey[date]?.[valueKey] || 0,
    invoiceCount: byKey[date]?.invoiceCount || 0,
  }));
}

function getPlanPrice(plan) {
  return PLAN_PRICE[plan] || 0;
}

function getUsagePct(tenant) {
  if (!tenant.orderLimit) return 0;
  return Math.min(100, Math.round(((tenant.ordersUsed || 0) / tenant.orderLimit) * 100));
}

function isWithinRange(value, start, end) {
  if (!value) return false;
  const timestamp = new Date(value);
  return timestamp >= start && timestamp <= end;
}

function isExpiringSoon(value, days = ALERT_WINDOW_DAYS) {
  if (!value) return false;
  const diff = new Date(value).getTime() - Date.now();
  return diff >= 0 && diff <= days * DAY_MS;
}

function daysSince(value, fallbackValue = null) {
  const target = value || fallbackValue;
  if (!target) return Infinity;
  return Math.floor((Date.now() - new Date(target).getTime()) / DAY_MS);
}

function tenantWasLiveDuring(tenant, start, end) {
  const startAt = tenant.subscriptionStartDate || tenant.createdAt;
  if (!startAt || new Date(startAt) > end) return false;
  if (!tenant.planExpiryDate) return true;
  return new Date(tenant.planExpiryDate) >= start;
}

function getHealthStatus(tenant) {
  if (tenant.status !== 'Active') return 'Inactive';

  const inactiveDays = daysSince(tenant.lastActiveAt, tenant.createdAt);
  if (inactiveDays > TENANT_DORMANT_DAYS) return 'Inactive';
  if (getUsagePct(tenant) >= 80 || isExpiringSoon(tenant.planExpiryDate) || inactiveDays > 7) return 'At Risk';
  return 'Active';
}

function buildTenantLink(tenant) {
  return `/admin/tenants?search=${encodeURIComponent(tenant.tenantId || tenant.cafeName || '')}`;
}

function normalizeLog(log) {
  return {
    id: String(log._id),
    action: log.action || log.actionType || '',
    target: log.target || log.targetEntity || '',
    actor: log.performedBy || log.adminUser || 'System',
    details: log.details || log.description || '',
    severity: log.severity || 'INFO',
    createdAt: log.createdAt || log.timestamp || new Date(),
  };
}

async function sumRevenueBetween(start, end) {
  const [row] = await Invoice.aggregate([
    {
      $match: {
        status: { $in: REVENUE_STATUSES },
        billingDate: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: null,
        amount: { $sum: '$amount' },
      },
    },
  ]);

  return row?.amount || 0;
}

// GET /api/admin/analytics
const getAnalytics = async (req, res) => {
  try {
    const rangeWindow = getRangeWindow(req.query);
    const currentMonthStart = startOfMonth(new Date());
    const currentMonthEnd = endOfMonth(new Date());
    const previousMonthStart = startOfMonth(addDays(currentMonthStart, -1));
    const previousMonthEnd = endOfMonth(previousMonthStart);
    const monthBeforeStart = startOfMonth(addDays(previousMonthStart, -1));
    const monthBeforeEnd = endOfMonth(monthBeforeStart);

    const labels = buildDateLabels(rangeWindow.currentStart, rangeWindow.currentEnd);

    const [
      tenants,
      tenantGrowthRaw,
      activityTrendRaw,
      revenueTrendRaw,
      recentLogsRaw,
      lifetimeRevenueRaw,
      currentMonthRevenue,
      previousMonthRevenue,
      monthBeforeRevenue,
    ] = await Promise.all([
      Tenant.find().lean(),
      Tenant.aggregate([
        {
          $match: {
            createdAt: {
              $gte: rangeWindow.currentStart,
              $lte: rangeWindow.currentEnd,
            },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      ActivityLog.aggregate([
        {
          $match: {
            createdAt: {
              $gte: rangeWindow.currentStart,
              $lte: rangeWindow.currentEnd,
            },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Invoice.aggregate([
        {
          $match: {
            status: { $in: REVENUE_STATUSES },
            billingDate: {
              $gte: rangeWindow.currentStart,
              $lte: rangeWindow.currentEnd,
            },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$billingDate' } },
            amount: { $sum: '$amount' },
            invoiceCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      ActivityLog.find().sort({ createdAt: -1 }).limit(8).lean(),
      Invoice.aggregate([
        {
          $match: {
            status: { $in: REVENUE_STATUSES },
          },
        },
        {
          $group: {
            _id: '$tenantId',
            revenue: { $sum: '$amount' },
            invoices: { $sum: 1 },
          },
        },
      ]),
      sumRevenueBetween(currentMonthStart, currentMonthEnd),
      sumRevenueBetween(previousMonthStart, previousMonthEnd),
      sumRevenueBetween(monthBeforeStart, monthBeforeEnd),
    ]);

    const totalCafes = tenants.length;
    const activeSnapshotTenants = tenants.filter((tenant) => tenant.status === 'Active');
    const suspendedTenants = tenants.filter((tenant) => tenant.status === 'Suspended').length;
    const expiredTenants = tenants.filter((tenant) => tenant.status === 'Expired').length;

    const activeTenantsInRange = tenants.filter((tenant) => (
      tenant.status === 'Active'
      && isWithinRange(tenant.lastActiveAt || tenant.createdAt, rangeWindow.currentStart, rangeWindow.currentEnd)
    )).length;

    const activeTenantsPreviousRange = tenants.filter((tenant) => (
      tenant.status === 'Active'
      && isWithinRange(tenant.lastActiveAt || tenant.createdAt, rangeWindow.previousStart, rangeWindow.previousEnd)
    )).length;

    const newTenantsCurrent = tenants.filter((tenant) => (
      isWithinRange(tenant.createdAt, rangeWindow.currentStart, rangeWindow.currentEnd)
    )).length;

    const newTenantsPrevious = tenants.filter((tenant) => (
      isWithinRange(tenant.createdAt, rangeWindow.previousStart, rangeWindow.previousEnd)
    )).length;

    const activityEventsCurrent = activityTrendRaw.reduce((sum, item) => sum + (item.count || 0), 0);
    const activityEventsPrevious = await ActivityLog.countDocuments({
      createdAt: {
        $gte: rangeWindow.previousStart,
        $lte: rangeWindow.previousEnd,
      },
    });

    const payingTenantsCurrent = activeSnapshotTenants.filter((tenant) => getPlanPrice(tenant.subscriptionPlan) > 0).length;
    const payingTenantsPrevious = tenants.filter((tenant) => (
      tenantWasLiveDuring(tenant, rangeWindow.previousStart, rangeWindow.previousEnd)
      && getPlanPrice(tenant.subscriptionPlan) > 0
    )).length;

    const currentMrrTenants = activeSnapshotTenants.filter((tenant) => (
      !tenant.planExpiryDate || new Date(tenant.planExpiryDate) >= startOfDay(new Date())
    ));
    const mrr = currentMrrTenants.reduce((sum, tenant) => sum + getPlanPrice(tenant.subscriptionPlan), 0);

    const previousMrr = tenants
      .filter((tenant) => tenantWasLiveDuring(tenant, previousMonthStart, previousMonthEnd))
      .reduce((sum, tenant) => sum + getPlanPrice(tenant.subscriptionPlan), 0);

    const monthlyGrowthRate = pctChange(currentMonthRevenue, previousMonthRevenue);
    const previousGrowthRate = pctChange(previousMonthRevenue, monthBeforeRevenue);

    const currentChurned = tenants.filter((tenant) => (
      ['Suspended', 'Expired'].includes(tenant.status)
      && isWithinRange(tenant.updatedAt, currentMonthStart, currentMonthEnd)
    )).length;
    const previousChurned = tenants.filter((tenant) => (
      ['Suspended', 'Expired'].includes(tenant.status)
      && isWithinRange(tenant.updatedAt, previousMonthStart, previousMonthEnd)
    )).length;

    const currentChurnBase = Math.max(1, tenants.filter((tenant) => tenantWasLiveDuring(tenant, currentMonthStart, currentMonthEnd)).length);
    const previousChurnBase = Math.max(1, tenants.filter((tenant) => tenantWasLiveDuring(tenant, previousMonthStart, previousMonthEnd)).length);
    const churnRate = Number(((currentChurned / currentChurnBase) * 100).toFixed(1));
    const previousChurnRate = Number(((previousChurned / previousChurnBase) * 100).toFixed(1));

    const healthSummary = tenants.reduce((summary, tenant) => {
      const health = getHealthStatus(tenant);
      if (health === 'Active') summary.active += 1;
      if (health === 'At Risk') summary.atRisk += 1;
      if (health === 'Inactive') summary.inactive += 1;
      return summary;
    }, { active: 0, atRisk: 0, inactive: 0 });

    const planGroups = activeSnapshotTenants.reduce((acc, tenant) => {
      const plan = tenant.subscriptionPlan || 'Unknown';
      acc[plan] = (acc[plan] || 0) + 1;
      return acc;
    }, {});

    const planDistribution = Object.entries(planGroups)
      .map(([plan, count]) => ({
        plan,
        count,
        percentage: activeSnapshotTenants.length
          ? Number(((count / activeSnapshotTenants.length) * 100).toFixed(1))
          : 0,
        revenue: count * getPlanPrice(plan),
      }))
      .sort((left, right) => right.count - left.count || right.revenue - left.revenue);

    const lifetimeRevenueByTenant = Object.fromEntries(
      lifetimeRevenueRaw.map((row) => [String(row._id), row]),
    );

    const topTenants = tenants
      .map((tenant) => {
        const revenueRow = lifetimeRevenueByTenant[String(tenant._id)] || {};
        return {
          id: String(tenant._id),
          tenantId: tenant.tenantId,
          cafeName: tenant.cafeName,
          plan: tenant.subscriptionPlan,
          orders: tenant.ordersUsed || 0,
          revenue: revenueRow.revenue || 0,
          invoices: revenueRow.invoices || 0,
          status: tenant.status,
          health: getHealthStatus(tenant),
          lastActiveAt: tenant.lastActiveAt,
          link: buildTenantLink(tenant),
        };
      })
      .sort((left, right) => right.revenue - left.revenue || right.orders - left.orders)
      .slice(0, 8);

    const nearOrderLimit = activeSnapshotTenants
      .filter((tenant) => getUsagePct(tenant) >= 80)
      .sort((left, right) => getUsagePct(right) - getUsagePct(left))
      .slice(0, 6)
      .map((tenant) => ({
        id: `usage-${tenant._id}`,
        tenantId: tenant.tenantId,
        cafeName: tenant.cafeName,
        plan: tenant.subscriptionPlan,
        status: tenant.status,
        type: 'warning',
        title: `${getUsagePct(tenant)}% of order limit used`,
        description: `${tenant.ordersUsed || 0} of ${tenant.orderLimit || 0} orders consumed.`,
        metric: `${getUsagePct(tenant)}%`,
        link: buildTenantLink(tenant),
      }));

    const expiringSubscriptions = activeSnapshotTenants
      .filter((tenant) => isExpiringSoon(tenant.planExpiryDate))
      .sort((left, right) => new Date(left.planExpiryDate) - new Date(right.planExpiryDate))
      .slice(0, 6)
      .map((tenant) => ({
        id: `expiry-${tenant._id}`,
        tenantId: tenant.tenantId,
        cafeName: tenant.cafeName,
        plan: tenant.subscriptionPlan,
        status: tenant.status,
        type: 'warning',
        title: 'Subscription expiry approaching',
        description: `Plan renews on ${toDisplayDate(tenant.planExpiryDate)}.`,
        metric: toDisplayDate(tenant.planExpiryDate),
        link: buildTenantLink(tenant),
      }));

    const inactiveTenants = tenants
      .filter((tenant) => daysSince(tenant.lastActiveAt, tenant.createdAt) >= TENANT_INACTIVE_DAYS)
      .sort((left, right) => daysSince(right.lastActiveAt, right.createdAt) - daysSince(left.lastActiveAt, left.createdAt))
      .slice(0, 6)
      .map((tenant) => ({
        id: `inactive-${tenant._id}`,
        tenantId: tenant.tenantId,
        cafeName: tenant.cafeName,
        plan: tenant.subscriptionPlan,
        status: tenant.status,
        type: 'error',
        title: 'Tenant inactivity',
        description: `Last seen ${daysSince(tenant.lastActiveAt, tenant.createdAt)} day(s) ago.`,
        metric: tenant.lastActiveAt || tenant.createdAt,
        link: buildTenantLink(tenant),
      }));

    const adminActions = recentLogsRaw.map(normalizeLog);
    const tenantActivity = tenants
      .filter((tenant) => tenant.lastActiveAt || tenant.createdAt)
      .sort((left, right) => new Date(right.lastActiveAt || right.createdAt) - new Date(left.lastActiveAt || left.createdAt))
      .slice(0, 8)
      .map((tenant) => ({
        id: `tenant-${tenant._id}`,
        title: tenant.cafeName,
        description: tenant.lastActiveAt
          ? `Active on the ${tenant.subscriptionPlan} plan.`
          : 'Tenant created and awaiting first activity.',
        status: tenant.status,
        plan: tenant.subscriptionPlan,
        timestamp: tenant.lastActiveAt || tenant.createdAt,
        link: buildTenantLink(tenant),
      }));

    const tenantGrowth = mapSeries(labels, tenantGrowthRaw, 'count');
    const activityTrend = mapSeries(labels, activityTrendRaw, 'count');
    const revenueGrowth = mapSeries(labels, revenueTrendRaw, 'amount');

    const recentLogs = adminActions.map((log) => ({
      ...log,
      performedBy: log.actor,
    }));

    const kpis = {
      activeTenants: {
        label: 'Active tenants',
        value: activeTenantsInRange,
        previousValue: activeTenantsPreviousRange,
        trendPct: pctChange(activeTenantsInRange, activeTenantsPreviousRange),
        comparison: `${activeTenantsPreviousRange} in the previous period`,
        trendLabel: rangeWindow.comparisonLabel,
      },
      newTenants: {
        label: 'New tenants',
        value: newTenantsCurrent,
        previousValue: newTenantsPrevious,
        trendPct: pctChange(newTenantsCurrent, newTenantsPrevious),
        comparison: `${newTenantsPrevious} in the previous period`,
        trendLabel: rangeWindow.comparisonLabel,
      },
      activityEvents: {
        label: 'Activity events',
        value: activityEventsCurrent,
        previousValue: activityEventsPrevious,
        trendPct: pctChange(activityEventsCurrent, activityEventsPrevious),
        comparison: `${activityEventsPrevious} events in the previous period`,
        trendLabel: rangeWindow.comparisonLabel,
      },
      payingTenants: {
        label: 'Paying tenants',
        value: payingTenantsCurrent,
        previousValue: payingTenantsPrevious,
        trendPct: pctChange(payingTenantsCurrent, payingTenantsPrevious),
        comparison: `${payingTenantsPrevious} paying tenants previously`,
        trendLabel: rangeWindow.comparisonLabel,
      },
      mrr: {
        label: 'Total MRR',
        value: mrr,
        previousValue: previousMrr,
        trendPct: pctChange(mrr, previousMrr),
        comparison: `₹${previousMrr.toLocaleString('en-IN')} in the previous month snapshot`,
        trendLabel: 'vs previous month',
      },
      monthlyGrowthRate: {
        label: 'Monthly growth rate',
        value: monthlyGrowthRate,
        previousValue: previousGrowthRate,
        trendPct: Number((monthlyGrowthRate - previousGrowthRate).toFixed(1)),
        comparison: `${previousGrowthRate >= 0 ? '+' : ''}${previousGrowthRate}% in the prior month`,
        trendLabel: 'vs prior month growth',
      },
      churnRate: {
        label: 'Churn rate',
        value: churnRate,
        previousValue: previousChurnRate,
        trendPct: Number((churnRate - previousChurnRate).toFixed(1)),
        comparison: `${previousChurnRate}% in the prior month`,
        trendLabel: 'vs prior month churn',
      },
    };

    res.json({
      success: true,
      data: {
        filters: {
          range: rangeWindow.range,
          dateFrom: rangeWindow.currentStart.toISOString().slice(0, 10),
          dateTo: rangeWindow.currentEnd.toISOString().slice(0, 10),
          currentLabel: rangeWindow.currentLabel,
          comparisonLabel: rangeWindow.comparisonLabel,
          dayCount: rangeWindow.dayCount,
        },
        totals: {
          totalCafes,
          activeTenants: activeSnapshotTenants.length,
          suspendedTenants,
          expiredTenants,
        },
        tenantHealth: {
          ...healthSummary,
          total: totalCafes,
        },
        revenue: {
          mrr,
          currentMonthRevenue,
          previousMonthRevenue,
          monthlyGrowthRate,
          churnRate,
        },
        kpis,
        alerts: {
          total: nearOrderLimit.length + expiringSubscriptions.length + inactiveTenants.length,
          nearOrderLimit,
          expiringSubscriptions,
          inactiveTenants,
        },
        charts: {
          tenantGrowth,
          activityTrend,
          revenueTrend: revenueGrowth,
          planDistribution,
        },
        topTenants,
        activityFeed: {
          adminActions,
          tenantActivity,
        },

        // Backward-compatible fields used elsewhere in the admin app.
        totalCafes,
        activeTenants: activeSnapshotTenants.length,
        suspendedTenants,
        expiredTenants,
        mrr,
        tenantGrowthRate: kpis.newTenants.trendPct,
        activeTrend: kpis.activeTenants.trendPct,
        suspendedTrend: 0,
        expiredTrend: Number((churnRate * -1).toFixed(1)),
        tenantGrowth,
        activityTrend,
        planDistribution,
        subscriptionData: planDistribution,
        revenueGrowth,
        revenue: revenueGrowth,
        recentLogs,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/analytics/tenant-usage
const getTenantUsage = async (req, res) => {
  try {
    const tenants = await Tenant.find().sort({ cafeName: 1 }).lean();

    const data = tenants.map((tenant) => {
      const usagePct = tenant.orderLimit > 0
        ? Math.round((tenant.ordersUsed / tenant.orderLimit) * 100)
        : 0;

      const activeStaff = Math.max(
        1,
        Math.round(((tenant.orderLimit > 0 ? tenant.ordersUsed / tenant.orderLimit : 0) * 10) + 1)
      );

      const ordersToday = Math.max(0, Math.round((tenant.ordersUsed || 0) * 0.08));
      const revenueToday = ordersToday * 180;

      return {
        tenantId: tenant._id,
        cafeName: tenant.cafeName,
        plan: tenant.subscriptionPlan,
        status: tenant.status,
        ordersUsed: tenant.ordersUsed,
        orderLimit: tenant.orderLimit,
        usagePct,
        activeStaff,
        ordersToday,
        revenueToday,
        lastActiveAt: tenant.lastActiveAt,
      };
    });

    const now = new Date();
    const ordersPerDay = Array.from({ length: 14 }).map((_, idx) => {
      const date = startOfDay(addDays(now, -(13 - idx))).toISOString().split('T')[0];
      const orders = Math.max(0, Math.round(data.reduce((sum, tenant) => sum + tenant.ordersToday, 0) * (0.55 + Math.random() * 0.9)));
      return { date, orders };
    });

    const revenueTrend = ordersPerDay.map((item) => ({
      date: item.date,
      revenue: item.orders * 180,
    }));

    const activeStaffSessions = Array.from({ length: 14 }).map((_, idx) => {
      const date = startOfDay(addDays(now, -(13 - idx))).toISOString().split('T')[0];
      const sessions = Math.max(1, Math.round(data.reduce((sum, tenant) => sum + tenant.activeStaff, 0) * (0.7 + Math.random() * 0.6)));
      return { date, sessions };
    });

    res.json({
      success: true,
      data,
      charts: { ordersPerDay, revenueTrend, activeStaffSessions },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAnalytics, getTenantUsage };
