import { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import PlanCard from '../../components/admin/PlanCard';
import {
  fetchPlans, createPlan, updatePlan, deletePlan, fetchPlanDistribution,
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

const CHART_COLORS = ['#94a3b8', '#22c55e', '#C67C4E', '#a78bfa', '#3b82f6', '#f59e0b'];

// ── Custom chart tooltip ────────────────────────────────────────────────────
function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { plan, count } = payload[0].payload;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '8px 14px', fontSize: 13, color: 'var(--text-1)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    }}>
      <strong style={{ color: payload[0].fill }}>{plan}</strong>
      <span style={{ color: 'var(--text-3)' }}> — </span>
      {count} {count === 1 ? 'tenant' : 'tenants'}
    </div>
  );
}

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

export default function SubscriptionManagement() {
  const [plans, setPlans]               = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [showForm, setShowForm]         = useState(false);
  const [form, setForm]                 = useState(emptyForm);
  const [editId, setEditId]             = useState(null);
  const [saving, setSaving]             = useState(false);
  const [confirm, setConfirm]           = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([fetchPlans(), fetchPlanDistribution()])
      .then(([plansRes, distRes]) => {
        setPlans(plansRes.data ?? []);
        setDistribution(distRes.data ?? []);
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

  return (
    <AdminLayout>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 4px' }}>
            Subscription Plans
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: 14, margin: 0 }}>
            {plans.length} plan{plans.length !== 1 ? 's' : ''} · {totalTenants} total tenant{totalTenants !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(!showForm); }}
          style={{
            padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13,
            background: showForm ? 'var(--bg-hover)' : '#C67C4E',
            color: showForm ? 'var(--text-2)' : '#fff',
            border: showForm ? '1px solid var(--border)' : 'none',
          }}
        >
          {showForm ? '✕ Cancel' : '+ New Plan'}
        </button>
      </div>

      {/* ── Plan Usage Analytics bar chart ── */}
      {!loading && distribution.length > 0 && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '20px 24px', marginBottom: 28,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>Plan Usage Analytics</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>
                How many tenants are on each subscription plan
              </div>
            </div>
            {/* Summary pills */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {distribution.map(({ plan, count }, i) => (
                <div key={plan} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'var(--bg-hover)', borderRadius: 99, padding: '4px 12px',
                  fontSize: 12, fontWeight: 600, color: 'var(--text-2)',
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: CHART_COLORS[i % CHART_COLORS.length],
                    display: 'inline-block', flexShrink: 0,
                  }} />
                  {plan}
                  <span style={{ color: 'var(--text-1)', marginLeft: 2 }}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={distribution}
              barSize={44}
              margin={{ top: 4, right: 16, left: -20, bottom: 0 }}
            >
              <XAxis
                dataKey="plan"
                tick={{ fill: 'var(--text-3)', fontSize: 12, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--text-3)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="count" radius={[7, 7, 0, 0]}>
                {distribution.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.88} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
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
