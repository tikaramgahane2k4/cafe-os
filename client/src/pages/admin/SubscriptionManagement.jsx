import { useMemo, useState } from 'react';
import {
  BarChart, Bar, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import AdminLayout from '../../components/admin/AdminLayout';
import PlanCard from '../../components/admin/PlanCard';
import { ErrorBanner, PageSpinner } from '../../components/admin/SkeletonLoader';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import MetricCard from '../../components/ui/MetricCard';
import Modal from '../../components/ui/Modal';
import { usePlans } from '../../hooks/usePlans';

const chartColors = ['#94a3b8', '#22c55e', '#d97706', '#c67c4e', '#0f766e', '#3b82f6'];

const fieldStyle = {
  width: '100%',
  minHeight: 46,
  background: 'var(--bg-base)',
  border: '1px solid var(--border)',
  color: 'var(--text-1)',
  borderRadius: 14,
  padding: '0 14px',
  boxSizing: 'border-box',
  fontSize: 13,
};

const labelStyle = {
  fontSize: 11,
  fontWeight: 800,
  color: 'var(--text-3)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: 6,
  display: 'block',
};

function PlanEditorModal({
  open,
  onClose,
  form,
  setForm,
  featureCatalog,
  saving,
  onSubmit,
  editing,
}) {
  const featureEntries = Object.entries(featureCatalog);

  const toggleFeature = (key) => {
    setForm((current) => ({
      ...current,
      featureList: current.featureList.includes(key)
        ? current.featureList.filter((item) => item !== key)
        : [...current.featureList, key],
    }));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit plan' : 'Create plan'}
      subtitle="Configure pricing, limits, and included product capabilities."
      width={760}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        style={{ display: 'grid', gap: 18 }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
          <div>
            <label style={labelStyle}>Plan name</label>
            <input required value={form.planName} onChange={(event) => setForm((current) => ({ ...current, planName: event.target.value }))} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Price (₹)</label>
            <input required type="number" min="0" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Order limit</label>
            <input type="number" min="0" value={form.orderLimit} onChange={(event) => setForm((current) => ({ ...current, orderLimit: event.target.value }))} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Staff limit</label>
            <input type="number" min="0" value={form.staffLimit} onChange={(event) => setForm((current) => ({ ...current, staffLimit: event.target.value }))} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select value={form.planStatus} onChange={(event) => setForm((current) => ({ ...current, planStatus: event.target.value }))} style={fieldStyle}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Included features</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            {featureEntries.map(([key, meta]) => {
              const active = form.featureList.includes(key);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleFeature(key)}
                  style={{
                    border: active ? '1px solid rgba(198,124,78,0.34)' : '1px solid var(--border)',
                    background: active ? 'rgba(198,124,78,0.12)' : 'var(--bg-card)',
                    color: active ? '#c67c4e' : 'var(--text-2)',
                    borderRadius: 16,
                    padding: '12px 14px',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 800 }}>{meta.icon || '⚑'} {meta.label || key}</div>
                  <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-3)' }}>
                    {active ? 'Included in this plan' : 'Tap to include'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update plan' : 'Create plan'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function DistributionTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const row = payload[0].payload;

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '10px 12px', fontSize: 12, boxShadow: 'var(--shadow-md)' }}>
      <div style={{ fontWeight: 800, color: 'var(--text-1)' }}>{row.plan}</div>
      <div style={{ marginTop: 4, color: 'var(--text-3)' }}>{row.count} tenant{row.count === 1 ? '' : 's'}</div>
    </div>
  );
}

export default function SubscriptionManagement() {
  const {
    plans,
    distribution,
    countByPlan,
    featureCatalog,
    loading,
    saving,
    error,
    emptyDraft,
    createPlanRecord,
    updatePlanRecord,
    deletePlanRecord,
  } = usePlans();
  const [showEditor, setShowEditor] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState('');
  const [form, setForm] = useState(emptyDraft);

  const totalTenants = distribution.reduce((sum, row) => sum + row.count, 0);
  const paidPlans = useMemo(() => plans.filter((plan) => Number(plan.price) > 0).length, [plans]);

  const openCreate = () => {
    setForm(emptyDraft);
    setEditingPlanId('');
    setShowEditor(true);
  };

  const openEdit = (plan) => {
    setEditingPlanId(plan._id);
    setForm({
      planName: plan.planName,
      price: plan.price,
      featureList: Array.isArray(plan.featureList) ? plan.featureList : [],
      orderLimit: plan.orderLimit,
      staffLimit: plan.staffLimit,
      planStatus: plan.planStatus,
    });
    setShowEditor(true);
  };

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="Monetization"
        title="Subscription plans"
        subtitle="Manage pricing, packaging, and adoption across the CafeOS product catalog."
        actions={<Button onClick={openCreate}>New plan</Button>}
      />

      <PlanEditorModal
        open={showEditor}
        onClose={() => setShowEditor(false)}
        form={form}
        setForm={setForm}
        featureCatalog={featureCatalog}
        saving={saving}
        editing={Boolean(editingPlanId)}
        onSubmit={async () => {
          const payload = {
            ...form,
            price: Number(form.price),
            orderLimit: Number(form.orderLimit),
            staffLimit: Number(form.staffLimit),
          };

          if (editingPlanId) {
            await updatePlanRecord(editingPlanId, payload);
          } else {
            await createPlanRecord(payload);
          }

          setShowEditor(false);
        }}
      />

      {loading ? <PageSpinner message="Loading plan catalog..." /> : null}
      {error ? <ErrorBanner message={error} /> : null}

      {!loading && !error ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 18 }}>
            <MetricCard label="Plans" value={plans.length} subtitle="Active catalog entries in the subscription stack" accent="#c67c4e" icon="💳" />
            <MetricCard label="Paid tiers" value={paidPlans} subtitle="Plans generating recurring revenue" accent="#22c55e" icon="💰" />
            <MetricCard label="Tenants assigned" value={totalTenants} subtitle="Workspaces distributed across available plans" accent="#0f766e" icon="🏪" />
            <MetricCard label="Feature catalog" value={Object.keys(featureCatalog).length} subtitle="Capabilities available for packaging" accent="#3b82f6" icon="⚑" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, 0.9fr)', gap: 18, marginBottom: 18 }}>
            <Card title="Plan adoption" subtitle="How tenants are currently distributed across pricing tiers.">
              {distribution.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={distribution} margin={{ top: 8, right: 12, left: -24, bottom: 0 }}>
                    <XAxis dataKey="plan" tick={{ fill: 'var(--text-3)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<DistributionTooltip />} cursor={{ fill: 'rgba(198,124,78,0.08)' }} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {distribution.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  icon="📊"
                  title="No adoption data yet"
                  subtitle="Create plans and assign tenants to visualize packaging performance."
                  compact
                />
              )}
            </Card>

            <Card title="Adoption summary" subtitle="Quick read on how each tier is performing.">
              <div style={{ display: 'grid', gap: 10 }}>
                {distribution.length ? distribution.map((row, index) => (
                  <div key={row.plan} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: '12px 14px', borderRadius: 16, background: 'var(--bg-hover)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)' }}>{row.plan}</div>
                      <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-3)' }}>{row.count} tenant{row.count === 1 ? '' : 's'}</div>
                    </div>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: chartColors[index % chartColors.length], flexShrink: 0 }} />
                  </div>
                )) : (
                  <EmptyState
                    icon="💳"
                    title="No plan activity yet"
                    subtitle="Tenants will appear here as soon as plan assignments begin."
                    compact
                  />
                )}
              </div>
            </Card>
          </div>

          {plans.length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
              {plans.map((plan) => (
                <PlanCard
                  key={plan._id}
                  plan={plan}
                  tenantCount={countByPlan[plan.planName] || 0}
                  onEdit={openEdit}
                  onDelete={(planId) => {
                    if (window.confirm('Delete this plan? Existing tenant assignments may need follow-up.')) {
                      deletePlanRecord(planId);
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <Card>
              <EmptyState
                icon="💳"
                title="No plans configured"
                subtitle="Create the first plan to start packaging CafeOS as a real SaaS product."
                actions={<Button onClick={openCreate}>Create plan</Button>}
              />
            </Card>
          )}
        </>
      ) : null}
    </AdminLayout>
  );
}
