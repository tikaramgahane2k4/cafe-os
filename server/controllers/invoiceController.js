const Invoice = require('../models/Invoice');
const Tenant = require('../models/Tenant');
const { upsertNotification } = require('../services/notificationService');

const PLAN_PRICE = { Free: 0, Starter: 999, Growth: 2499, Pro: 5000, Enterprise: 5999 };
const PLAN_ORDER = ['Free', 'Starter', 'Growth', 'Pro', 'Enterprise'];
const REVENUE_STATUSES = ['Paid', 'Pending'];

function buildInvoiceQuery({ tenantId = '', status = '', planName = '', dateFrom = '', dateTo = '' } = {}) {
  const query = {};

  if (tenantId) query.tenantId = tenantId;
  if (status && status !== 'ALL') query.status = status;
  if (planName && planName !== 'ALL') query.planName = planName;

  if (dateFrom || dateTo) {
    query.billingDate = {};
    if (dateFrom) query.billingDate.$gte = new Date(dateFrom);
    if (dateTo) query.billingDate.$lte = new Date(`${dateTo}T23:59:59.999Z`);
  }

  return query;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function monthKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function monthLabel(date) {
  return date.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
}

function buildMonthlyBuckets(dateFrom = '', dateTo = '') {
  const now = new Date();
  const first = dateFrom ? startOfMonth(new Date(dateFrom)) : startOfMonth(addMonths(now, -5));
  const last = dateTo ? endOfMonth(new Date(dateTo)) : endOfMonth(now);
  const safeFirst = first > last ? startOfMonth(last) : first;
  const buckets = [];
  const cursor = new Date(safeFirst);

  while (cursor <= last) {
    buckets.push({
      key: monthKey(cursor),
      month: monthLabel(cursor),
      start: startOfMonth(cursor),
      end: endOfMonth(cursor),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return buckets;
}

function growthPct(current = 0, previous = 0) {
  if (!previous) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function buildLogEntry({ invoice, action, status, message, actor = 'System', timestamp = new Date() }) {
  return {
    timestamp,
    action,
    status,
    message,
    actor,
    amount: invoice.amount || 0,
    method: invoice.paymentMethod || '',
  };
}

function fallbackPaymentLog(invoice) {
  return buildLogEntry({
    invoice,
    action: invoice.status === 'Paid' ? 'Payment Received' : 'Invoice Generated',
    status: invoice.status,
    message: invoice.status === 'Paid'
      ? 'Payment recorded for this invoice.'
      : 'Invoice issued and awaiting follow-up.',
    timestamp: invoice.paidAt || invoice.lastPaymentAttemptAt || invoice.billingDate || invoice.createdAt || new Date(),
  });
}

async function notifyPaymentFailure(invoice, reopenOnUpdate = false) {
  await upsertNotification({
    sourceKey: `payment-failed:${invoice._id}`,
    eventType: 'payment_failed',
    type: 'error',
    message: `${invoice.tenantName} payment failed for ${invoice.invoiceNumber} (₹${Number(invoice.amount || 0).toLocaleString('en-IN')}).`,
    tenantId: invoice.tenantId,
    tenantName: invoice.tenantName,
    link: '/admin/billing',
    meta: {
      invoiceId: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      status: invoice.status,
    },
    reopenOnUpdate,
    refreshTimestamp: reopenOnUpdate,
  });
}

function summarizeStatusBuckets(rows = []) {
  const base = {
    total: 0,
    paid: 0,
    pending: 0,
    failed: 0,
    overdue: 0,
    collected: 0,
    outstanding: 0,
  };

  rows.forEach((row) => {
    base.total += row.count;
    if (row._id === 'Paid') {
      base.paid = row.count;
      base.collected = row.amount;
    }
    if (row._id === 'Pending') {
      base.pending = row.count;
      base.outstanding += row.amount;
    }
    if (row._id === 'Overdue') {
      base.overdue = row.count;
      base.outstanding += row.amount;
    }
    if (row._id === 'Failed') base.failed = row.count;
  });

  return base;
}

async function buildTrend(query, dateFrom = '', dateTo = '') {
  const buckets = buildMonthlyBuckets(dateFrom, dateTo);
  if (buckets.length === 0) return [];

  const trendQuery = {
    ...query,
    billingDate: {
      $gte: buckets[0].start,
      $lte: buckets[buckets.length - 1].end,
    },
  };

  const raw = await Invoice.aggregate([
    { $match: trendQuery },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m', date: '$billingDate' },
        },
        revenue: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const byMonth = Object.fromEntries(raw.map((row) => [row._id, row]));

  return buckets.map((bucket) => ({
    month: bucket.month,
    revenue: byMonth[bucket.key]?.revenue || 0,
    invoiceCount: byMonth[bucket.key]?.count || 0,
  }));
}

async function getInvoices(req, res) {
  try {
    const { page = 1, limit = 100, ...filters } = req.query;
    const query = buildInvoiceQuery(filters);
    const skip = (Number(page) - 1) * Number(limit);

    const [total, data] = await Promise.all([
      Invoice.countDocuments(query),
      Invoice.find(query).sort({ billingDate: -1 }).skip(skip).limit(Number(limit)).lean(),
    ]);

    res.json({ success: true, data, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createInvoice(req, res) {
  try {
    const tenant = await Tenant.findById(req.body.tenantId).lean();
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });

    const planName = req.body.planName || tenant.subscriptionPlan;
    const amount = req.body.amount ?? (PLAN_PRICE[planName] || 0);
    const billingDate = req.body.billingDate ? new Date(req.body.billingDate) : new Date();
    const status = req.body.status || 'Pending';
    const actor = req.body.actor || 'Super Admin';

    const invoicePayload = {
      ...req.body,
      amount,
      billingDate,
      tenantName: req.body.tenantName || tenant.cafeName,
      planName,
      status,
      paymentLogs: [
        buildLogEntry({
          invoice: { amount, paymentMethod: req.body.paymentMethod || 'Card' },
          action: 'Invoice Generated',
          status,
          actor,
          timestamp: billingDate,
          message: `Invoice created for ${tenant.cafeName}.`,
        }),
      ],
    };

    if (status === 'Paid') {
      invoicePayload.paidAt = new Date();
      invoicePayload.lastPaymentAttemptAt = new Date();
      invoicePayload.paymentLogs.push(
        buildLogEntry({
          invoice: { amount, paymentMethod: req.body.paymentMethod || 'Card' },
          action: 'Payment Recorded',
          status: 'Paid',
          actor,
          message: 'Payment recorded at invoice creation.',
        })
      );
    }

    if (status === 'Failed') {
      invoicePayload.lastPaymentAttemptAt = new Date();
      invoicePayload.paymentLogs.push(
        buildLogEntry({
          invoice: { amount, paymentMethod: req.body.paymentMethod || 'Card' },
          action: 'Payment Failed',
          status: 'Failed',
          actor,
          message: req.body.notes || 'Initial collection attempt failed.',
        })
      );
    }

    const invoice = await Invoice.create(invoicePayload);
    if (status === 'Failed' || status === 'Overdue') {
      await notifyPaymentFailure(invoice, true);
    }
    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function updateInvoice(req, res) {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const { action = '', actor = 'Super Admin', note = '', ...updates } = req.body;
    const prevStatus = invoice.status;

    if (action === 'markPaid') {
      invoice.status = 'Paid';
      invoice.paidAt = new Date();
      invoice.lastPaymentAttemptAt = new Date();
      if (updates.paymentMethod) invoice.paymentMethod = updates.paymentMethod;
      if (updates.notes !== undefined) invoice.notes = updates.notes;
      invoice.paymentLogs.push(
        buildLogEntry({
          invoice,
          action: 'Marked Paid',
          status: 'Paid',
          actor,
          message: note || 'Payment manually marked as paid by billing admin.',
        })
      );
    } else if (action === 'retryPayment') {
      invoice.status = 'Pending';
      invoice.lastPaymentAttemptAt = new Date();
      if (updates.notes !== undefined) invoice.notes = updates.notes;
      invoice.paymentLogs.push(
        buildLogEntry({
          invoice,
          action: 'Retry Payment',
          status: 'Pending',
          actor,
          message: note || 'Payment retry initiated and awaiting confirmation.',
        })
      );
    } else {
      Object.entries(updates).forEach(([key, value]) => {
        invoice[key] = value;
      });

      if (updates.status === 'Paid') {
        invoice.paidAt = invoice.paidAt || new Date();
        invoice.lastPaymentAttemptAt = new Date();
      }

      if (updates.status === 'Failed' || updates.status === 'Overdue') {
        invoice.lastPaymentAttemptAt = new Date();
      }
    }

    if (invoice.status !== prevStatus && !action) {
      invoice.paymentLogs.push(
        buildLogEntry({
          invoice,
          action: 'Status Updated',
          status: invoice.status,
          actor,
          message: note || `Invoice status changed from ${prevStatus} to ${invoice.status}.`,
        })
      );
    }

    await invoice.save();

    if (
      ['Failed', 'Overdue'].includes(invoice.status) &&
      (prevStatus !== invoice.status || action === 'retryPayment' || action === 'markPaid')
    ) {
      await notifyPaymentFailure(invoice, true);
    }

    res.json({ success: true, data: invoice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function getBillingSummary(req, res) {
  try {
    const activeTenants = await Tenant.find({ status: 'Active' }).lean();
    const payingTenants = activeTenants.filter((tenant) => (PLAN_PRICE[tenant.subscriptionPlan] || 0) > 0).length;
    const freeTenants = activeTenants.length - payingTenants;
    const mrr = activeTenants.reduce((sum, tenant) => sum + (PLAN_PRICE[tenant.subscriptionPlan] || 0), 0);

    const globalTrend = await buildTrend({ status: { $in: REVENUE_STATUSES } });
    const monthlyGrowthPct = globalTrend.length > 1
      ? growthPct(globalTrend[globalTrend.length - 1].revenue, globalTrend[globalTrend.length - 2].revenue)
      : growthPct(globalTrend[0]?.revenue || 0, 0);

    const revenueByPlan = [...new Set([...PLAN_ORDER, ...activeTenants.map((tenant) => tenant.subscriptionPlan).filter(Boolean)])]
      .map((plan) => {
        const tenantCount = activeTenants.filter((tenant) => tenant.subscriptionPlan === plan).length;
        return {
          plan,
          tenantCount,
          activeTenants: tenantCount,
          unitPrice: PLAN_PRICE[plan] || 0,
          revenue: (PLAN_PRICE[plan] || 0) * tenantCount,
        };
      })
      .sort((a, b) => {
        const aIndex = PLAN_ORDER.indexOf(a.plan);
        const bIndex = PLAN_ORDER.indexOf(b.plan);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return b.revenue - a.revenue;
      });

    const filteredQuery = buildInvoiceQuery(req.query);
    const trendQuery = { ...filteredQuery };
    if (!trendQuery.status) trendQuery.status = { $in: REVENUE_STATUSES };
    const trend = await buildTrend(trendQuery, req.query.dateFrom, req.query.dateTo);

    const statusBreakdown = await Invoice.aggregate([
      { $match: filteredQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$amount' },
        },
      },
    ]);

    const invoiceStats = summarizeStatusBuckets(statusBreakdown);

    res.json({
      success: true,
      data: {
        mrr,
        monthlyGrowthPct,
        payingTenants,
        freeVsPaid: {
          free: freeTenants,
          paid: payingTenants,
          totalActive: activeTenants.length,
        },
        revenueByPlan,
        trend,
        invoiceStats,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getTenantBillingDetails(req, res) {
  try {
    const tenant = await Tenant.findById(req.params.tenantId).lean();
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });

    const invoices = await Invoice.find({ tenantId: tenant._id }).sort({ billingDate: -1 }).lean();
    const paymentLogs = invoices
      .flatMap((invoice) => {
        const logs = invoice.paymentLogs?.length ? invoice.paymentLogs : [fallbackPaymentLog(invoice)];
        return logs.map((log) => ({
          ...log,
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
        }));
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const paidInvoices = invoices.filter((invoice) => invoice.status === 'Paid');
    const pendingInvoices = invoices.filter((invoice) => invoice.status === 'Pending');
    const failedInvoices = invoices.filter((invoice) => ['Failed', 'Overdue'].includes(invoice.status));
    const lifetimeRevenue = paidInvoices.reduce((sum, invoice) => sum + (invoice.amount || 0), 0);
    const outstandingAmount = pendingInvoices
      .concat(failedInvoices.filter((invoice) => invoice.status === 'Overdue'))
      .reduce((sum, invoice) => sum + (invoice.amount || 0), 0);

    const usagePct = tenant.orderLimit > 0
      ? Math.min(100, Math.round((tenant.ordersUsed / tenant.orderLimit) * 100))
      : 0;

    res.json({
      success: true,
      data: {
        tenant: {
          _id: tenant._id,
          cafeName: tenant.cafeName,
          ownerName: tenant.ownerName,
          email: tenant.email,
          status: tenant.status,
          subscriptionPlan: tenant.subscriptionPlan,
          planExpiryDate: tenant.planExpiryDate,
          ordersUsed: tenant.ordersUsed,
          orderLimit: tenant.orderLimit,
          usagePct,
          lastActiveAt: tenant.lastActiveAt,
        },
        summary: {
          totalInvoices: invoices.length,
          paidInvoices: paidInvoices.length,
          pendingInvoices: pendingInvoices.length,
          failedInvoices: failedInvoices.length,
          lifetimeRevenue,
          outstandingAmount,
          nextBillingDate: invoices[0]?.nextBillingDate || null,
          lastPaymentDate: paidInvoices[0]?.paidAt || paidInvoices[0]?.billingDate || null,
        },
        billingHistory: invoices,
        paymentLogs: paymentLogs.slice(0, 30),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function seedInvoices(req, res) {
  try {
    const existing = await Invoice.countDocuments();
    if (existing > 0) return res.json({ success: true, message: 'Invoices already seeded', seeded: 0 });

    const tenants = await Tenant.find().lean();
    let seeded = 0;

    for (const [index, tenant] of tenants.entries()) {
      const amount = PLAN_PRICE[tenant.subscriptionPlan] || 0;
      const invoiceCount = amount > 0 ? 4 : 1;

      for (let i = 0; i < invoiceCount; i++) {
        const billingDate = startOfMonth(addMonths(new Date(), -i));
        const currentCycle = i === 0;
        let status = 'Paid';

        if (currentCycle && amount > 0 && index % 4 === 0) status = 'Failed';
        else if (currentCycle && amount > 0 && index % 3 === 0) status = 'Pending';
        else if (currentCycle && amount === 0) status = 'Paid';

        const paymentMethod = ['Card', 'UPI', 'Net Banking'][Math.floor(Math.random() * 3)];
        const paymentLogs = [
          buildLogEntry({
            invoice: { amount, paymentMethod },
            action: 'Invoice Generated',
            status,
            timestamp: billingDate,
            message: `Scheduled invoice created for ${tenant.cafeName}.`,
          }),
        ];

        let paidAt = null;
        let lastPaymentAttemptAt = null;

        if (status === 'Paid') {
          paidAt = new Date(billingDate.getTime() + 86400000);
          lastPaymentAttemptAt = paidAt;
          paymentLogs.push(
            buildLogEntry({
              invoice: { amount, paymentMethod },
              action: 'Payment Recorded',
              status: 'Paid',
              timestamp: paidAt,
              message: amount > 0 ? 'Subscription payment captured successfully.' : 'Free plan invoice closed automatically.',
            })
          );
        }

        if (status === 'Pending') {
          paymentLogs.push(
            buildLogEntry({
              invoice: { amount, paymentMethod },
              action: 'Awaiting Payment',
              status: 'Pending',
              timestamp: new Date(),
              message: 'Invoice is open and awaiting collection.',
            })
          );
        }

        if (status === 'Failed') {
          lastPaymentAttemptAt = new Date();
          paymentLogs.push(
            buildLogEntry({
              invoice: { amount, paymentMethod },
              action: 'Payment Failed',
              status: 'Failed',
              timestamp: new Date(),
              message: 'Automatic collection failed. Manual retry required.',
            })
          );
        }

        const invoice = await Invoice.create({
          tenantId: tenant._id,
          tenantName: tenant.cafeName,
          planName: tenant.subscriptionPlan,
          amount,
          status,
          billingDate,
          paymentMethod,
          paidAt,
          lastPaymentAttemptAt,
          notes: currentCycle && status !== 'Paid' ? 'Requires billing team follow-up.' : '',
          paymentLogs,
        });
        if (status === 'Failed' || status === 'Overdue') {
          await notifyPaymentFailure(invoice, false);
        }
        seeded += 1;
      }
    }

    res.json({ success: true, seeded });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getInvoices,
  createInvoice,
  updateInvoice,
  getBillingSummary,
  getTenantBillingDetails,
  seedInvoices,
};
