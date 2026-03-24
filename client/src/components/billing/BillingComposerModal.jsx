import { useEffect, useState } from 'react';
import { invoiceFilterOptions } from '../../utils/adminConstants';
import EmptyState from '../ui/EmptyState';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

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

export default function BillingComposerModal({
  open,
  onClose,
  tenants,
  plans,
  initialDraft,
  onSubmit,
  saving,
}) {
  const [draft, setDraft] = useState(initialDraft);

  const resolvePlanPrice = (planName = '') => {
    const matchedPlan = plans.find((plan) => plan.planName === planName);
    return Number(matchedPlan?.price || 0);
  };

  useEffect(() => {
    const hasInitialPlan = plans.some((plan) => plan.planName === initialDraft.planName);
    const fallbackPlanName = hasInitialPlan ? initialDraft.planName : plans[0]?.planName || '';

    setDraft({
      ...initialDraft,
      planName: fallbackPlanName,
      amount: fallbackPlanName
        ? initialDraft.amount || resolvePlanPrice(fallbackPlanName)
        : Number(initialDraft.amount || 0),
    });
  }, [initialDraft, open, plans]);

  const selectedTenant = tenants.find((tenant) => tenant._id === draft.tenantId) || null;

  const syncTenant = (tenantId) => {
    const nextTenant = tenants.find((tenant) => tenant._id === tenantId) || null;
    const matchedPlan = plans.find((plan) => plan.planName === nextTenant?.subscriptionPlan) || plans[0] || null;
    const planName = nextTenant?.subscriptionPlan || matchedPlan?.planName || '';

    setDraft((current) => ({
      ...current,
      tenantId,
      tenantName: nextTenant?.cafeName || '',
      planName,
      amount: matchedPlan ? Number(matchedPlan.price || 0) : current.amount,
    }));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generate invoice"
      subtitle="Create an invoice and push it directly into the billing ledger."
      width={620}
    >
      {!tenants.length ? (
        <EmptyState
          icon="🏪"
          title="No tenants available"
          subtitle="Add a tenant before generating invoices from the billing control panel."
        />
      ) : !plans.length ? (
        <EmptyState
          icon="💳"
          title="No subscription plans available"
          subtitle="Create a plan on the Subscriptions page first so invoices can use the live plan catalog."
        />
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit({
              ...draft,
              amount: Number(draft.amount),
            });
          }}
          style={{ display: 'grid', gap: 16 }}
        >
          <div>
            <label style={labelStyle}>Tenant</label>
            <select value={draft.tenantId} onChange={(event) => syncTenant(event.target.value)} style={fieldStyle}>
              {tenants.map((tenant) => (
                <option key={tenant._id} value={tenant._id}>
                  {tenant.cafeName} · {tenant.subscriptionPlan}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Plan</label>
              <select
                value={draft.planName}
                onChange={(event) => {
                  const planName = event.target.value;
                  setDraft((current) => ({
                    ...current,
                    planName,
                    amount: resolvePlanPrice(planName),
                  }));
                }}
                style={fieldStyle}
              >
                {plans.map((plan) => (
                  <option key={plan._id || plan.planName} value={plan.planName}>
                    {plan.planName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Amount</label>
              <input type="number" min="0" value={draft.amount} onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))} style={fieldStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))} style={fieldStyle}>
                {invoiceFilterOptions.filter((status) => status !== 'ALL' && status !== 'Overdue').map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Billing date</label>
              <input type="date" value={draft.billingDate} onChange={(event) => setDraft((current) => ({ ...current, billingDate: event.target.value }))} style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>Payment method</label>
              <select value={draft.paymentMethod} onChange={(event) => setDraft((current) => ({ ...current, paymentMethod: event.target.value }))} style={fieldStyle}>
                {['Card', 'UPI', 'Net Banking', 'Bank Transfer'].map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={draft.notes}
              onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
              style={{ ...fieldStyle, minHeight: 110, paddingTop: 14, resize: 'vertical' }}
            />
          </div>

          {selectedTenant ? (
            <div style={{ padding: '14px 16px', borderRadius: 16, background: 'var(--bg-hover)', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
              {selectedTenant.cafeName} is on the {selectedTenant.subscriptionPlan} plan and is using {selectedTenant.ordersUsed}/{selectedTenant.orderLimit} orders.
            </div>
          ) : null}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
            <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving || !draft.tenantId || !draft.planName}>{saving ? 'Creating...' : 'Generate invoice'}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
