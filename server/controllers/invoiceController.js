const Invoice = require('../models/Invoice');
const Tenant = require('../models/Tenant');

const PLAN_PRICE = { Free: 0, Starter: 999, Growth: 2499, Pro: 5000, Enterprise: 5999 };

const getInvoices = async (req, res) => {
  try {
    const { tenantId = '', status = '', planName = '', dateFrom = '', dateTo = '', page = 1, limit = 100 } = req.query;
    const query = {};
    if (tenantId) query.tenantId = tenantId;
    if (status && status !== 'ALL') query.status = status;
    if (planName && planName !== 'ALL') query.planName = planName;
    if (dateFrom || dateTo) {
      query.billingDate = {};
      if (dateFrom) query.billingDate.$gte = new Date(dateFrom);
      if (dateTo) query.billingDate.$lte = new Date(`${dateTo}T23:59:59.999Z`);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [total, data] = await Promise.all([
      Invoice.countDocuments(query),
      Invoice.find(query).sort({ billingDate: -1 }).skip(skip).limit(Number(limit)).lean(),
    ]);

    res.json({ success: true, data, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createInvoice = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.body.tenantId).lean();
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
    const amount = req.body.amount ?? (PLAN_PRICE[req.body.planName || tenant.subscriptionPlan] || 0);
    const invoice = await Invoice.create({
      ...req.body,
      amount,
      tenantName: req.body.tenantName || tenant.cafeName,
      planName: req.body.planName || tenant.subscriptionPlan,
    });
    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getBillingSummary = async (req, res) => {
  try {
    const activeTenants = await Tenant.find({ status: 'Active' }).lean();
    const mrr = activeTenants.reduce((sum, t) => sum + (PLAN_PRICE[t.subscriptionPlan] || 0), 0);

    const byPlanMap = {};
    activeTenants.forEach((t) => {
      byPlanMap[t.subscriptionPlan] = (byPlanMap[t.subscriptionPlan] || 0) + 1;
    });
    const revenueByPlan = Object.entries(byPlanMap).map(([plan, count]) => ({
      plan,
      activeTenants: count,
      unitPrice: PLAN_PRICE[plan] || 0,
      revenue: (PLAN_PRICE[plan] || 0) * count,
    })).sort((a, b) => b.revenue - a.revenue);

    const now = new Date();
    const trend = [];
    for (let i = 5; i >= 0; i--) {
      const first = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const last = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthInvoices = await Invoice.aggregate([
        { $match: { billingDate: { $gte: first, $lte: last }, status: { $in: ['Paid', 'Pending', 'Overdue'] } } },
        { $group: { _id: null, revenue: { $sum: '$amount' } } },
      ]);
      trend.push({
        month: first.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
        revenue: monthInvoices[0]?.revenue || 0,
      });
    }

    res.json({ success: true, data: { mrr, revenueByPlan, trend } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const seedInvoices = async (req, res) => {
  try {
    const existing = await Invoice.countDocuments();
    if (existing > 0) return res.json({ success: true, message: 'Invoices already seeded', seeded: 0 });

    const tenants = await Tenant.find().lean();
    let seeded = 0;
    for (const t of tenants) {
      const amount = PLAN_PRICE[t.subscriptionPlan] || 0;
      if (amount <= 0) continue;
      for (let i = 0; i < 3; i++) {
        const billingDate = new Date();
        billingDate.setMonth(billingDate.getMonth() - i);
        billingDate.setDate(1);

        await Invoice.create({
          tenantId: t._id,
          tenantName: t.cafeName,
          planName: t.subscriptionPlan,
          amount,
          status: i === 0 ? 'Pending' : 'Paid',
          billingDate,
          paymentMethod: ['Card', 'UPI', 'Net Banking'][Math.floor(Math.random() * 3)],
        });
        seeded += 1;
      }
    }
    res.json({ success: true, seeded });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getInvoices, createInvoice, updateInvoice, getBillingSummary, seedInvoices };
