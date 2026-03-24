import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import StatusBadge from '../ui/StatusBadge';
import Button from '../ui/Button';
import { formatDate, formatDateTime, formatMoney } from '../../utils/adminFormat';

export default function BillingTenantPanel({
  tenantDetails,
  selectedInvoice,
  loading,
  error,
  onGenerateInvoice,
}) {
  return (
    <Card
      title={tenantDetails?.tenant?.cafeName || 'Tenant billing details'}
      subtitle={selectedInvoice ? `Focused on ${selectedInvoice.invoiceNumber}` : 'Select an invoice to inspect billing history, usage, and payment logs.'}
      actions={tenantDetails?.tenant ? (
        <Button size="sm" type="button" onClick={() => onGenerateInvoice(tenantDetails.tenant._id)}>
          Generate invoice
        </Button>
      ) : null}
      style={{ position: 'sticky', top: 96 }}
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0', color: 'var(--text-3)' }}>
          Loading tenant details...
        </div>
      ) : error ? (
        <div style={{ color: '#ef4444', fontSize: 13 }}>{error}</div>
      ) : !tenantDetails ? (
        <EmptyState
          icon="🔎"
          title="No tenant selected"
          subtitle="Choose an invoice row to open billing history, plan usage, and payment logs."
          compact
        />
      ) : (
        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            <div style={metricStyle}>
              <div style={metricLabelStyle}>Lifetime revenue</div>
              <div style={{ marginTop: 8, fontSize: 20, fontWeight: 900, color: '#c67c4e' }}>
                {formatMoney(tenantDetails.summary.lifetimeRevenue)}
              </div>
            </div>
            <div style={metricStyle}>
              <div style={metricLabelStyle}>Outstanding</div>
              <div style={{ marginTop: 8, fontSize: 20, fontWeight: 900, color: tenantDetails.summary.outstandingAmount > 0 ? '#ef4444' : 'var(--text-1)' }}>
                {formatMoney(tenantDetails.summary.outstandingAmount)}
              </div>
            </div>
          </div>

          <div style={{ padding: 16, borderRadius: 18, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)' }}>Plan usage</div>
                <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-3)' }}>
                  {tenantDetails.tenant.subscriptionPlan} · {tenantDetails.tenant.ordersUsed}/{tenantDetails.tenant.orderLimit} orders
                </div>
              </div>
              <StatusBadge status={selectedInvoice?.status || 'Pending'} />
            </div>
            <div style={{ marginTop: 16, height: 10, borderRadius: 999, background: 'var(--bg-hover)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${tenantDetails.tenant.usagePct}%`,
                  height: '100%',
                  background: tenantDetails.tenant.usagePct >= 85 ? '#ef4444' : '#c67c4e',
                }}
              />
            </div>
            <div style={{ display: 'grid', gap: 6, marginTop: 14, fontSize: 12, color: 'var(--text-3)' }}>
              <div>Usage: {tenantDetails.tenant.usagePct}%</div>
              <div>Next billing date: {formatDate(tenantDetails.summary.nextBillingDate)}</div>
              <div>Last payment: {formatDate(tenantDetails.summary.lastPaymentDate)}</div>
              <div>Plan expiry: {formatDate(tenantDetails.tenant.planExpiryDate)}</div>
            </div>
          </div>

          <div>
            <div style={sectionTitleStyle}>Billing history</div>
            <div style={scrollPanelStyle}>
              {tenantDetails.billingHistory.length ? tenantDetails.billingHistory.map((invoice) => (
                <div key={invoice._id} style={listCardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)' }}>{invoice.invoiceNumber}</div>
                      <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-3)' }}>
                        {formatDate(invoice.billingDate)} · {invoice.planName}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#c67c4e' }}>{formatMoney(invoice.amount)}</div>
                      <div style={{ marginTop: 4 }}><StatusBadge status={invoice.status} /></div>
                    </div>
                  </div>
                </div>
              )) : (
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>No billing history available.</div>
              )}
            </div>
          </div>

          <div>
            <div style={sectionTitleStyle}>Payment logs</div>
            <div style={scrollPanelStyle}>
              {tenantDetails.paymentLogs.length ? tenantDetails.paymentLogs.map((log, index) => (
                <div key={`${log.invoiceId}-${index}`} style={{ borderLeft: '2px solid #c67c4e', paddingLeft: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>
                        {log.action || 'Payment event'}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-3)' }}>
                        {log.invoiceNumber} · {log.message || 'No payment note recorded.'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div><StatusBadge status={log.status || 'Pending'} /></div>
                      <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-3)' }}>{formatDateTime(log.timestamp)}</div>
                    </div>
                  </div>
                </div>
              )) : (
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>No payment logs recorded yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

const metricStyle = {
  padding: 14,
  borderRadius: 14,
  background: 'var(--bg-hover)',
};

const metricLabelStyle = {
  fontSize: 11,
  fontWeight: 800,
  color: 'var(--text-3)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const sectionTitleStyle = {
  fontSize: 14,
  fontWeight: 800,
  color: 'var(--text-1)',
  marginBottom: 10,
};

const scrollPanelStyle = {
  display: 'grid',
  gap: 10,
  maxHeight: 240,
  overflowY: 'auto',
  paddingRight: 4,
};

const listCardStyle = {
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 12,
};
