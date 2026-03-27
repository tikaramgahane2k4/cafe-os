import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList,
} from 'recharts';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import PlanCard from '../../components/admin/PlanCard';
import StatsCard from '../../components/admin/StatsCard';
import {
  fetchPlans, createPlan, updatePlan, deletePlan, fetchPlanDistribution, fetchTenants, fetchInvoices, fetchBillingSummary, fetchLogs,
} from '../../services/adminApi';
import { PageSpinner, ErrorBanner, EmptyState, Spinner } from '../../components/admin/SkeletonLoader';
import ConfirmDialog from '../../components/admin/ConfirmDialog';

// ── Feature catalog ─────────────────────────────────────────────────────────
const ALL_FEATURES = [
  { key: 'POS',                label: 'Point of Sale',        icon: '🖥️' },
  { key: 'INVENTORY',          label: 'Inventory Management', icon: '📦' },
  { key: 'CRM',                label: 'CRM System',           icon: '👥' },
  { key: 'BASIC_REPORTS',      label: 'Basic Reports',        icon: '📊' },
  { key: 'ADVANCED_ANALYTICS', label: 'Advanced Analytics',   icon: '📈' },
  { key: 'API_ACCESS',         label: 'API Access',           icon: '🔌' },
  { key: 'STAFF_MANAGEMENT',   label: 'Staff Management',     icon: '👔' },
  { key: 'ONLINE_ORDERING',    label: 'Online Ordering',      icon: '🛒' },
  { key: 'LOYALTY_PROGRAM',    label: 'Loyalty Program',      icon: '⭐' },
];

// ── Style constants ─────────────────────────────────────────────────────────
const emptyForm = {
  planName: '', price: '', featureList: [], orderLimit: 100, staffLimit: 5, planStatus: 'Active',
};
const inp = {
  width: '100%', background: 'var(--bg-base)', border: '1px solid var(--border)',
  color: 'var(--text-1)', padding: '10px 14px', borderRadius: 9,
  fontSize: 13, boxSizing: 'border-box', outline: 'none',
};
const lbl = {
  fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
  textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5,
};

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { revenue } = payload[0].payload;
  if (!revenue) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'var(--text-1)',
    }}>
      Peak: ₹{Number(revenue || 0).toLocaleString('en-IN')}
    </div>
  );
}

export default function SubscriptionManagement() {
  const [plans, setPlans]               = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [tenants, setTenants]           = useState([]);
  const [invoices, setInvoices]         = useState([]);
  const [logs, setLogs]                 = useState([]);
  const [billing, setBilling]           = useState(null);
  const [revMetric, setRevMetric]       = useState('NET');
  const [activityFilter, setActivityFilter] = useState('All');
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const navigate = useNavigate();
  const [showForm, setShowForm]         = useState(false);
  const [form, setForm]                 = useState(emptyForm);
  const [editId, setEditId]             = useState(null);
  const [saving, setSaving]             = useState(false);
  const [confirm, setConfirm]           = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchPlans(),
      fetchPlanDistribution(),
      fetchTenants({ limit: 500 }),
      fetchInvoices({ limit: 300, page: 1 }),
      fetchBillingSummary(),
      fetchLogs({ limit: 200, page: 1 }),
    ])
      .then(([plansRes, distRes, tenantsRes, invoicesRes, billingRes, logsRes]) => {
        setPlans(plansRes.data ?? []);
        setDistribution(distRes.data ?? []);
        setTenants(tenantsRes.data ?? []);
        setInvoices(invoicesRes.data ?? []);
        setBilling(billingRes.data ?? null);
        setLogs(logsRes.data ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Toggle a feature key on/off in the form
  const toggleFeature = (key) =>
    setForm((f) => ({
      ...f,
      featureList: f.featureList.includes(key)
        ? f.featureList.filter((k) => k !== key)
        : [...f.featureList, key],
    }));

  const openEdit = (plan) => {
    setForm({
      planName:    plan.planName,
      price:       plan.price,
      featureList: Array.isArray(plan.featureList) ? plan.featureList : [],
      orderLimit:  plan.orderLimit,
      staffLimit:  plan.staffLimit,
      planStatus:  plan.planStatus,
    });
    setEditId(plan._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    try { await deletePlan(id); toast.success('Plan deleted'); load(); } catch (e) { toast.error(e.message); }
    setConfirm(null);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price:      Number(form.price),
        orderLimit: Number(form.orderLimit),
        staffLimit: Number(form.staffLimit),
        // featureList is already an array of keys
      };
      if (editId) await updatePlan(editId, payload);
      else        await createPlan(payload);
      toast.success(editId ? 'Plan updated' : 'Plan created');
      setForm(emptyForm);
      setEditId(null);
      setShowForm(false);
      load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const countMap     = Object.fromEntries(distribution.map(({ plan, count }) => [plan, count]));
  const totalTenants = distribution.reduce((s, d) => s + d.count, 0);
  const priceMap     = Object.fromEntries(plans.map((p) => [p.planName, p.price]));
  const priceMapServer = Object.fromEntries((billing?.revenueByPlan || []).map((p) => [p.plan, p.unitPrice]));
  const priceForPlan = (planName) => {
    if (priceMapServer[planName] !== undefined) return priceMapServer[planName];
    return priceMap[planName] || 0;
  };

  const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;
  const shortDate = (v) => (v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—');
  const initials = (name = '') => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const tenantByName = new Map(tenants.map((t) => [t.cafeName, t]));

  const now = Date.now();
  const activeTenants = tenants.filter((t) => t.status === 'Active');
  const latestInvoiceByTenant = new Map();
  [...invoices]
    .sort((a, b) => new Date(b.billingDate).getTime() - new Date(a.billingDate).getTime())
    .forEach((inv) => {
      if (!latestInvoiceByTenant.has(String(inv.tenantId))) {
        latestInvoiceByTenant.set(String(inv.tenantId), inv);
      }
    });
  const expiringSoon = tenants
    .filter((t) => t.status === 'Active')
    .filter((t) => t.planExpiryDate)
    .map((t) => ({ ...t, daysLeft: Math.ceil((new Date(t.planExpiryDate).getTime() - now) / 86400000) }))
    .filter((t) => t.daysLeft >= 0 && t.daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const futureRenewals = tenants
    .filter((t) => t.status === 'Active')
    .filter((t) => t.planExpiryDate)
    .map((t) => ({ ...t, daysLeft: Math.ceil((new Date(t.planExpiryDate).getTime() - now) / 86400000) }))
    .filter((t) => t.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const upcomingRenewals = expiringSoon.length >= 3
    ? expiringSoon
    : [...expiringSoon, ...futureRenewals.filter((t) => t.daysLeft > 30)]
        .slice(0, 3);

  const visibleRenewals = upcomingRenewals.slice(0, 3);
  const mapLogAction = (log) => {
    const action = log.action || '';
    if (action.includes('TENANT_CREATED')) return 'New Subscription';
    if (action.includes('TENANT_STATUS_CHANGED')) return log.afterValue ? `Status: ${log.afterValue}` : 'Status Changed';
    if (action.includes('TENANT_UPDATED')) return 'Subscription Updated';
    if (action.includes('TENANT_DELETED')) return 'Subscription Removed';
    return log.details || action || 'Activity';
  };

  const invoiceActivity = invoices.map((inv) => ({
    type: 'invoice',
    ts: new Date(inv.billingDate || inv.createdAt).getTime(),
    entity: inv.tenantName || 'Tenant',
    plan: inv.planName || '—',
    amount: inv.amount,
    status: inv.status,
    action: inv.status === 'Paid'
      ? 'Payment Received'
      : inv.status === 'Pending'
        ? 'Invoice Pending'
        : 'Payment Issue',
  }));

  const logActivity = logs.map((log) => {
    const entity = log.target || log.targetEntity || 'Tenant';
    const tenant = tenantByName.get(entity);
    const plan = tenant?.subscriptionPlan || '—';
    const amount = tenant ? (priceMap[tenant.subscriptionPlan] || 0) : null;
    return {
      type: 'log',
      ts: new Date(log.createdAt).getTime(),
      entity,
      plan,
      amount,
      status: log.severity || 'INFO',
      action: mapLogAction(log),
    };
  });

  const mergedActivity = [...invoiceActivity, ...logActivity]
    .filter((a) => Number.isFinite(a.ts))
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 100);

  const balancedRecent = () => {
    const topInvoices = invoiceActivity.sort((a, b) => b.ts - a.ts).slice(0, 6);
    const topLogs = logActivity.sort((a, b) => b.ts - a.ts).slice(0, 6);
    return [...topInvoices, ...topLogs].sort((a, b) => b.ts - a.ts).slice(0, 8);
  };

  const filteredActivity = mergedActivity.filter((a) => (
    activityFilter === 'All'
      ? true
      : activityFilter === 'Billing'
        ? a.type === 'invoice'
        : a.type === 'log'
  ));

  const recentActivity = activityFilter === 'All'
    ? (logActivity.length ? logActivity.sort((a, b) => b.ts - a.ts).slice(0, 8) : balancedRecent())
    : filteredActivity.slice(0, 8);

  const newRevenueTrend = (() => {
    const nowDt = new Date();
    const year = nowDt.getFullYear();
    const buckets = new Map();
    tenants.forEach((t) => {
      const d = new Date(t.subscriptionStartDate || t.createdAt);
      if (Number.isNaN(d.getTime()) || d.getFullYear() !== year) return;
      const key = d.getMonth(); // 0-11
      buckets.set(key, (buckets.get(key) || 0) + priceForPlan(t.subscriptionPlan));
    });
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months.map((m, idx) => ({
      month: m,
      revenue: buckets.get(idx) || 0,
    }));
  })();

  const churnRevenueTrend = (() => {
    const nowDt = new Date();
    const year = nowDt.getFullYear();
    const buckets = new Map();
    tenants.forEach((t) => {
      if (!t.planExpiryDate) return;
      const d = new Date(t.planExpiryDate);
      if (Number.isNaN(d.getTime()) || d.getFullYear() !== year) return;
      const key = d.getMonth();
      buckets.set(key, (buckets.get(key) || 0) + priceForPlan(t.subscriptionPlan));
    });
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months.map((m, idx) => ({
      month: m,
      revenue: buckets.get(idx) || 0,
    }));
  })();

  const recurringTrend = (() => {
    const nowDt = new Date();
    const year = nowDt.getFullYear();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months.map((m, idx) => {
      const monthStart = new Date(year, idx, 1);
      // Don’t project future months beyond current date
      if (monthStart > nowDt) {
        return { month: m, revenue: 0 };
      }
      const monthEnd = new Date(year, idx + 1, 0, 23, 59, 59, 999);
      const revenue = tenants
        .filter((t) => {
          const start = new Date(t.subscriptionStartDate || t.createdAt);
          if (Number.isNaN(start.getTime())) return false;
          if (start > monthEnd) return false;
          const expiry = t.planExpiryDate ? new Date(t.planExpiryDate) : null;
          if (expiry && expiry < monthStart) return false;
          return true;
        })
        .reduce((sum, t) => sum + priceForPlan(t.subscriptionPlan), 0);
      return { month: m, revenue };
    });
  })();

  const trendData = revMetric === 'MRR' ? recurringTrend : newRevenueTrend;
  const trendTotal = trendData.reduce((s, d) => s + (d.revenue || 0), 0);
  const maxRevenue = trendData.reduce((m, d) => Math.max(m, d.revenue || 0), 0);

  const exportAudit = () => {
    if (!invoices.length) {
      toast.error('No invoices to export.');
      return;
    }
    const header = ['Invoice', 'Tenant', 'Plan', 'Amount', 'Status', 'Billing Date', 'Payment Method'];
    const rows = invoices.map((inv) => ([
      inv.invoiceNumber || '',
      inv.tenantName || '',
      inv.planName || '',
      inv.amount ?? '',
      inv.status || '',
      inv.billingDate ? new Date(inv.billingDate).toLocaleDateString('en-IN') : '',
      inv.paymentMethod || '',
    ]));

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Subscription Audit</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #1f1f1f; }
            h1 { font-size: 18px; margin: 0 0 6px; }
            .meta { font-size: 12px; color: #666; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border-bottom: 1px solid #e5e5e5; padding: 8px; text-align: left; }
            th { background: #f7f7f7; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; }
          </style>
        </head>
        <body>
          <h1>Subscription Audit</h1>
          <div class="meta">Generated: ${new Date().toLocaleString('en-IN')}</div>
          <table>
            <thead>
              <tr>${header.map((h) => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${rows.map((r) => `<tr>${r.map((v) => `<td>${String(v)}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const frame = document.createElement('iframe');
    frame.style.position = 'fixed';
    frame.style.right = '0';
    frame.style.bottom = '0';
    frame.style.width = '0';
    frame.style.height = '0';
    frame.style.border = '0';
    frame.setAttribute('aria-hidden', 'true');
    document.body.appendChild(frame);

    const doc = frame.contentWindow?.document;
    if (!doc) {
      toast.error('Unable to generate PDF preview.');
      frame.remove();
      return;
    }
    doc.open();
    doc.write(html);
    doc.close();

    frame.onload = () => {
      try {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
      } catch (_) {
        toast.error('Print blocked. Please allow printing.');
      } finally {
        setTimeout(() => frame.remove(), 500);
      }
    };
  };


  return (
    <AdminLayout>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 4px' }}>
            Subscription Management
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: 14, margin: 0 }}>
            {plans.length} plan{plans.length !== 1 ? 's' : ''} · {totalTenants} total tenant{totalTenants !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={exportAudit}
            style={{
              padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13,
              background: 'var(--bg-hover)', color: 'var(--text-2)', border: '1px solid var(--border)',
            }}
          >
            Export Audit
          </button>
          <button
            onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(!showForm); }}
            style={{
              padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13,
              background: showForm ? 'var(--bg-hover)' : '#C67C4E',
              color: showForm ? 'var(--text-2)' : '#fff',
              border: showForm ? '1px solid var(--border)' : 'none',
            }}
          >
            {showForm ? '✕ Cancel' : '+ Create Custom Plan'}
          </button>
        </div>
      </div>

      {/* ── KPI Row (Mock-style) ── */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
          <StatsCard title="Monthly Recurring" value={billing ? money(billing.mrr) : '—'} icon="🧾" variant="caramel" subtitle="MRR" />
          <StatsCard title="Expiring in 30 Days" value={expiringSoon.length} icon="⏱" variant="amber" subtitle="Renewals due" />
          <StatsCard title="Net Churn Rate" value={billing ? `${billing.churnRate || 0}%` : '—'} icon="👥" variant="rose" subtitle="Last 30 days" />
          <StatsCard title="Subscriptions" value={totalTenants} icon="👥" variant="purple" subtitle="Active cafés" />
        </div>
      )}

      {/* ── Revenue Growth + Upcoming Renewals ── */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 28 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>Revenue Growth</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setRevMetric('MRR')}
                  style={{
                    fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999,
                    background: revMetric === 'MRR' ? '#C67C4E' : 'var(--bg-hover)',
                    color: revMetric === 'MRR' ? '#fff' : 'var(--text-2)',
                    border: revMetric === 'MRR' ? 'none' : '1px solid var(--border)',
                    cursor: 'pointer',
                  }}
                >
                  MRR
                </button>
                <button
                  onClick={() => setRevMetric('NET')}
                  style={{
                    fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999,
                    background: revMetric === 'NET' ? '#C67C4E' : 'var(--bg-hover)',
                    color: revMetric === 'NET' ? '#fff' : 'var(--text-2)',
                    border: revMetric === 'NET' ? 'none' : '1px solid var(--border)',
                    cursor: 'pointer',
                  }}
                >
                  Net Volume
                </button>
              </div>
            </div>
            <div style={{ width: '100%', height: 240, overflow: 'visible' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 40, right: 8, left: -10, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fill: 'var(--text-3)', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `₹${Number(v || 0).toLocaleString('en-IN')}`}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    <Bar dataKey="revenue" radius={[8, 8, 0, 0]} fill="#7c5534">
                      <LabelList
                        content={({ x, y, width, value }) => {
                          if (!value || value !== maxRevenue) return null;
                          const badgeW = 86;
                          const badgeH = 20;
                          const bx = x + (width / 2) - (badgeW / 2);
                          const by = Math.max(0, y - badgeH - 8);
                          return (
                            <g>
                              <rect x={bx} y={by} rx={6} ry={6} width={badgeW} height={badgeH} fill="#2b1b13" />
                              <text x={bx + 8} y={by + 13} fill="#fff" fontSize="10" fontWeight="700">
                                Peak: ₹{Number(value || 0).toLocaleString('en-IN')}
                              </text>
                            </g>
                          );
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            {trendTotal === 0 && (
              <div style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 6 }}>
                No revenue activity yet — chart shows months with zero value.
              </div>
            )}
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>Upcoming Renewals</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Next due</div>
            </div>
            {visibleRenewals.length === 0 ? (
              <div style={{ color: 'var(--text-3)', fontSize: 13 }}>No renewals due in the next 30 days.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {visibleRenewals.map((t) => {
                  const method = latestInvoiceByTenant.get(String(t._id))?.paymentMethod || '';
                  const badge = method ? (method === 'Card' ? 'Auto' : 'Manual') : '—';
                  return (
                    <div key={t._id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, alignItems: 'center' }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 10, background: 'var(--bg-hover)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-1)',
                      }}>
                        {initials(t.cafeName)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{t.cafeName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                          {t.subscriptionPlan} · {shortDate(t.planExpiryDate)} · {t.daysLeft}d
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{money(priceMap[t.subscriptionPlan] || 0)}</div>
                        <div style={{
                          fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999,
                          background: 'var(--bg-hover)', color: 'var(--text-2)', border: '1px solid var(--border)',
                        }}>
                          {badge}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <button
              onClick={() => navigate('/admin/subscriptions/renewals')}
              style={{
                marginTop: 14, width: '100%', padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer',
              }}
            >
              View All Renewals
            </button>
          </div>
        </div>
      )}

      {/* ── Create / Edit form ── */}
      {showForm && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 14, padding: 24, marginBottom: 28,
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 18 }}>
            {editId ? 'Edit Plan' : 'New Plan'}
          </div>
          <form onSubmit={handleSubmit}>

            {/* Basic fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
              {[
                ['Plan Name', 'planName', 'text',   true],
                ['Price (₹)', 'price',    'number', true],
                ['Order Limit','orderLimit','number',false],
                ['Staff Limit','staffLimit','number',false],
              ].map(([l, k, t, r]) => (
                <div key={k}>
                  <label style={lbl}>{l}</label>
                  <input
                    required={r} type={t} value={form[k]}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                    style={inp}
                  />
                </div>
              ))}
              <div>
                <label style={lbl}>Status</label>
                <select
                  value={form.planStatus}
                  onChange={(e) => setForm({ ...form, planStatus: e.target.value })}
                  style={inp}
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>

            {/* Feature key checkboxes */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ ...lbl, marginBottom: 12 }}>
                Features{' '}
                <span style={{ color: 'var(--text-2)', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>
                  ({form.featureList.length} selected)
                </span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 8 }}>
                {ALL_FEATURES.map(({ key, label, icon }) => {
                  const selected = form.featureList.includes(key);
                  return (
                    <label
                      key={key}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        cursor: 'pointer', padding: '9px 12px', borderRadius: 9,
                        background: selected ? 'rgba(198,124,78,0.1)' : 'var(--bg-hover)',
                        border: `1px solid ${selected ? 'rgba(198,124,78,0.4)' : 'var(--border)'}`,
                        transition: 'background 0.12s, border-color 0.12s',
                        userSelect: 'none',
                      }}
                    >
                      <input
                        type="checkbox" checked={selected}
                        onChange={() => toggleFeature(key)}
                        style={{ display: 'none' }}
                      />
                      {/* Custom checkbox indicator */}
                      <span style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                        border: `2px solid ${selected ? '#C67C4E' : 'var(--text-3)'}`,
                        background: selected ? '#C67C4E' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.12s',
                      }}>
                        {selected && (
                          <span style={{ color: '#fff', fontSize: 10, fontWeight: 900, lineHeight: 1 }}>✓</span>
                        )}
                      </span>
                      <span style={{ fontSize: 14 }}>{icon}</span>
                      <span style={{
                        fontSize: 12,
                        fontWeight: selected ? 600 : 400,
                        color: selected ? 'var(--text-1)' : 'var(--text-2)',
                      }}>
                        {label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button" onClick={() => setShowForm(false)}
                style={{ padding: '9px 18px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-2)', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                type="submit" disabled={saving}
                style={{ padding: '9px 18px', borderRadius: 9, border: 'none', background: '#C67C4E', color: '#fff', cursor: saving ? 'default' : 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1 }}
              >
                {saving ? <><Spinner size={14} /> Saving…</> : editId ? 'Update Plan' : 'Create Plan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <PageSpinner />}
      {error && <ErrorBanner message={error} />}

      {!loading && !error && plans.length === 0 && (
        <EmptyState icon="💳" title="No plans yet" subtitle='Click "+ New Plan" to get started.' />
      )}

      {/* ── Plan cards grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 20 }}>
        {plans.map((plan) => (
          <PlanCard
            key={plan._id}
            plan={plan}
            tenantCount={countMap[plan.planName] ?? 0}
            onEdit={() => openEdit(plan)}
            onDelete={() => setConfirm({ id: plan._id, name: plan.planName })}
          />
        ))}
      </div>

      {/* ── Recent Subscription Activity ── */}
      {!loading && (
        <div style={{ marginTop: 28, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>Recent Subscription Activity</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['All', 'Billing', 'Tenant Events'].map((label) => (
                <button
                  key={label}
                  onClick={() => setActivityFilter(label)}
                  style={{
                    fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999,
                    background: activityFilter === label ? '#C67C4E' : 'var(--bg-hover)',
                    color: activityFilter === label ? '#fff' : 'var(--text-2)',
                    border: activityFilter === label ? 'none' : '1px solid var(--border)',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {recentActivity.length === 0 ? (
            <div style={{ color: 'var(--text-3)', fontSize: 13 }}>No recent activity.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--text-3)' }}>
                    {['Entity', 'Action', 'Plan', 'Amount'].map((h) => (
                      <th key={h} style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 10 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((inv) => (
                    <tr key={`${inv.type}-${inv.ts}-${inv.entity}`} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 8px', color: 'var(--text-1)', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 26, height: 26, borderRadius: 8, background: 'var(--bg-hover)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                          }}>
                            {initials(inv.entity || 'T')}
                          </div>
                          {inv.entity || 'Tenant'}
                        </div>
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 999,
                          background: inv.type === 'invoice'
                            ? (inv.status === 'Paid' ? 'rgba(34,197,94,0.12)' : inv.status === 'Pending' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)')
                            : 'rgba(59,130,246,0.12)',
                          color: inv.type === 'invoice'
                            ? (inv.status === 'Paid' ? '#22c55e' : inv.status === 'Pending' ? '#f59e0b' : '#ef4444')
                            : '#3b82f6',
                        }}>
                          {inv.action}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-2)' }}>{inv.plan}</td>
                      <td style={{ padding: '10px 8px', fontWeight: 700, color: 'var(--text-1)' }}>{inv.amount ? money(inv.amount) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          open
          danger
          title="Delete Plan"
          message={`Delete "${confirm.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => handleDelete(confirm.id)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </AdminLayout>
  );
}
