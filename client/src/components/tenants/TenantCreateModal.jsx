import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';

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

export default function TenantCreateModal({
  open,
  onClose,
  initialDraft,
  plans,
  onSubmit,
  saving,
}) {
  const [draft, setDraft] = useState(initialDraft);
  const selectedPlan = plans.find((plan) => plan.planName === draft.subscriptionPlan) || null;

  useEffect(() => {
    const hasInitialPlan = plans.some((plan) => plan.planName === initialDraft.subscriptionPlan);

    setDraft({
      ...initialDraft,
      subscriptionPlan: hasInitialPlan ? initialDraft.subscriptionPlan : plans[0]?.planName || '',
    });
  }, [initialDraft, open, plans]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create tenant"
      subtitle="Spin up a new cafe workspace with a generated tenant ID and temporary owner credentials."
      width={640}
    >
      {!plans.length ? (
        <EmptyState
          icon="💳"
          title="No subscription plans available"
          subtitle="Create a plan on the Subscriptions page first so new tenants can be assigned correctly."
          compact
        />
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(draft);
          }}
          style={{ display: 'grid', gap: 16 }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div>
              <label style={labelStyle}>Cafe name</label>
              <input required value={draft.cafeName} onChange={(event) => setDraft((current) => ({ ...current, cafeName: event.target.value }))} style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>Owner name</label>
              <input required value={draft.ownerName} onChange={(event) => setDraft((current) => ({ ...current, ownerName: event.target.value }))} style={fieldStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Owner email</label>
              <input required type="email" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>Plan</label>
              <select value={draft.subscriptionPlan} onChange={(event) => setDraft((current) => ({ ...current, subscriptionPlan: event.target.value }))} style={fieldStyle}>
                {plans.map((plan) => (
                  <option key={plan._id || plan.planName} value={plan.planName}>
                    {plan.planName}
                  </option>
                ))}
              </select>
              <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-3)' }}>
                {selectedPlan
                  ? `${selectedPlan.orderLimit.toLocaleString('en-IN')} orders / month${selectedPlan.price > 0 ? ` · ₹${selectedPlan.price.toLocaleString('en-IN')}/month` : ''}`
                  : 'Select a subscription plan from the live catalog.'}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))} style={fieldStyle}>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <Card accent="#c67c4e" bodyStyle={{ padding: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
              Tenant ID and temporary password are generated automatically after creation. Share them securely with the owner.
            </div>
          </Card>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
            <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving || !draft.subscriptionPlan}>{saving ? 'Creating...' : 'Create tenant'}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
