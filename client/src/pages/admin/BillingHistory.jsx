import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import AnalyticsChart from '../../components/admin/AnalyticsChart';
import { ErrorBanner, PageSpinner } from '../../components/admin/SkeletonLoader';
import BillingComposerModal from '../../components/billing/BillingComposerModal';
import BillingTenantPanel from '../../components/billing/BillingTenantPanel';
import PageHeader from '../../components/layout/PageHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import MetricCard from '../../components/ui/MetricCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { useBilling } from '../../hooks/useBilling';
import { invoiceFilterOptions } from '../../utils/adminConstants';
import {
  buildInvoiceHtml,
  downloadTextFile,
  formatDate,
  formatMoney,
} from '../../utils/adminFormat';

const fieldStyle = {
  width: '100%',
  minHeight: 44,
  borderRadius: 14,
  border: '1px solid var(--border)',
  background: 'var(--bg-base)',
  color: 'var(--text-1)',
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

export default function BillingHistory() {
  const {
    invoices,
    summary,
    tenants,
    tenantDetails,
    selectedInvoice,
    selectedInvoiceId,
    trendPoints,
    featuredPlans,
    loading,
    planCatalogLoading,
    error,
    detailLoading,
    detailError,
    saving,
    availablePlans,
    filterPlanNames,
    actionKey,
    filters,
    setFilters,
    setSelectedInvoiceId,
    applyFilters,
    resetFilterFields,
    clearAppliedFilters,
    hasActiveFilters,
    isFilterDirty,
    seedDemoData,
    createInvoiceRecord,
    runInvoiceAction,
    invoiceDraftFactory,
  } = useBilling();
  const [showComposer, setShowComposer] = useState(false);
  const [draftInvoice, setDraftInvoice] = useState(invoiceDraftFactory(tenants[0]));

  const openComposer = (tenantId = '') => {
    if (!tenants.length) {
      toast.error('Add a tenant before generating an invoice.');
      return;
    }

    if (!availablePlans.length) {
      toast.error('Create a subscription plan first on the Subscriptions page.');
      return;
    }

    const tenant = tenants.find((item) => item._id === tenantId) || tenants[0];
    setDraftInvoice(invoiceDraftFactory(tenant));
    setShowComposer(true);
  };

  const invoiceColumns = useMemo(() => [
    {
      key: 'invoiceNumber',
      label: 'Invoice ID',
      render: (invoice) => (
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#c67c4e' }}>{invoice.invoiceNumber}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-3)' }}>{invoice.paymentMethod || 'No method'}</div>
        </div>
      ),
    },
    {
      key: 'tenantName',
      label: 'Tenant',
      render: (invoice) => (
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)' }}>{invoice.tenantName}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-3)' }}>{invoice.planName}</div>
        </div>
      ),
    },
    {
      key: 'plan',
      label: 'Plan',
      render: (invoice) => invoice.planName,
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (invoice) => <span style={{ fontWeight: 800, color: 'var(--text-1)' }}>{formatMoney(invoice.amount)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (invoice) => <StatusBadge status={invoice.status} />,
    },
    {
      key: 'billingDate',
      label: 'Date',
      render: (invoice) => formatDate(invoice.billingDate),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (invoice) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
          {invoice.status !== 'Paid' ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={actionKey === `markPaid:${invoice._id}`}
              onClick={(event) => {
                event.stopPropagation();
                runInvoiceAction(invoice, 'markPaid');
              }}
            >
              {actionKey === `markPaid:${invoice._id}` ? 'Marking...' : 'Mark as paid'}
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              downloadTextFile({
                filename: `${invoice.invoiceNumber}.html`,
                content: buildInvoiceHtml(invoice),
                type: 'text/html;charset=utf-8',
              });
            }}
          >
            Download
          </Button>
          {['Failed', 'Overdue'].includes(invoice.status) ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={actionKey === `retryPayment:${invoice._id}`}
              onClick={(event) => {
                event.stopPropagation();
                runInvoiceAction(invoice, 'retryPayment');
              }}
            >
              {actionKey === `retryPayment:${invoice._id}` ? 'Retrying...' : 'Retry payment'}
            </Button>
          ) : null}
        </div>
      ),
    },
  ], [actionKey, runInvoiceAction]);

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="Revenue Ops"
        title="Billing control panel"
        subtitle="Operational SaaS billing with invoice actions, revenue visibility, tenant-level payment history, and filterable collections data."
        actions={(
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button variant="ghost" onClick={seedDemoData} disabled={saving}>
              {saving ? 'Working...' : 'Seed demo data'}
            </Button>
            <Button onClick={() => openComposer()} disabled={!tenants.length || !availablePlans.length || saving}>Generate invoice</Button>
          </div>
        )}
      />

      <BillingComposerModal
        open={showComposer}
        onClose={() => setShowComposer(false)}
        tenants={tenants}
        plans={availablePlans}
        initialDraft={draftInvoice}
        saving={saving}
        onSubmit={async (payload) => {
          await createInvoiceRecord(payload);
          setShowComposer(false);
        }}
      />

      {loading || planCatalogLoading ? <PageSpinner message="Loading billing control panel..." /> : null}
      {error ? <ErrorBanner message={error} /> : null}

      {!loading && !planCatalogLoading && !error && summary ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 18 }}>
            <MetricCard label="Total MRR" value={formatMoney(summary.mrr)} subtitle="Recurring revenue across active subscriptions" accent="#c67c4e" icon="💰" />
            <MetricCard label="Monthly growth" value={`${summary.monthlyGrowthPct >= 0 ? '+' : ''}${summary.monthlyGrowthPct || 0}%`} trend={summary.monthlyGrowthPct || 0} subtitle="Compared to the previous month" accent={summary.monthlyGrowthPct >= 0 ? '#22c55e' : '#ef4444'} icon="📈" />
            <MetricCard label="Paying tenants" value={summary.payingTenants} subtitle={`${summary.freeVsPaid?.totalActive || 0} active tenants on platform`} accent="#22c55e" icon="🏪" />
            <MetricCard label="Free vs paid" value={`${summary.freeVsPaid?.paid || 0}:${summary.freeVsPaid?.free || 0}`} breakdown={{ paid: summary.freeVsPaid?.paid || 0, free: summary.freeVsPaid?.free || 0 }} subtitle="Current active tenant mix" accent="#0f766e" icon="⚖️" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.45fr) minmax(300px, 0.9fr)', gap: 18, marginBottom: 18 }}>
            <AnalyticsChart
              type="line"
              data={trendPoints}
              dataKey="revenue"
              xKey="month"
              title="Revenue trend"
              subtitle={hasActiveFilters ? 'Filtered invoice revenue' : 'Monthly invoice revenue'}
              color="#c67c4e"
              valuePrefix="₹"
              height={290}
              emptyIcon="📉"
              emptyTitle="No revenue in this range"
              emptySubtitle="Adjust the billing filters or seed demo data to visualize revenue movement."
            />

            <Card title="Revenue by plan" subtitle="Current recurring value and tenant count by subscription tier.">
              {featuredPlans.length ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  {featuredPlans.map((plan) => (
                    <div key={plan.plan} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', padding: '14px 16px', borderRadius: 16, border: '1px solid var(--border)', background: 'linear-gradient(90deg, rgba(198,124,78,0.06), transparent)' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)' }}>{plan.plan}</div>
                        <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-3)' }}>{plan.tenantCount} tenant{plan.tenantCount === 1 ? '' : 's'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#c67c4e' }}>{formatMoney(plan.revenue)}</div>
                        <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-3)' }}>{formatMoney(plan.unitPrice)}/month</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="💳"
                  title="No plan revenue yet"
                  subtitle="Create active tenants or seed invoices to populate this revenue breakdown."
                  compact
                />
              )}
            </Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(320px, 0.95fr)', gap: 18, alignItems: 'start' }}>
            <div>
              <Card
                title="Invoice ledger"
                subtitle="Filter the billing ledger, inspect failed collections, and take payment actions."
                actions={(
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Badge tone="#22c55e" background="rgba(34,197,94,0.12)">Paid {summary.invoiceStats?.paid || 0}</Badge>
                    <Badge tone="#f59e0b" background="rgba(245,158,11,0.12)">Pending {summary.invoiceStats?.pending || 0}</Badge>
                    <Badge tone="#ef4444" background="rgba(239,68,68,0.12)">Failed {summary.invoiceStats?.failed || 0}</Badge>
                    {summary.invoiceStats?.overdue ? <Badge tone="#f97316" background="rgba(249,115,22,0.12)">Overdue {summary.invoiceStats.overdue}</Badge> : null}
                  </div>
                )}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>Date from</label>
                    <input type="date" value={filters.dateFrom} onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))} style={fieldStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Date to</label>
                    <input type="date" value={filters.dateTo} onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))} style={fieldStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Plan</label>
                    <select value={filters.planName} onChange={(event) => setFilters((current) => ({ ...current, planName: event.target.value }))} style={fieldStyle}>
                      {['ALL', ...filterPlanNames].map((plan) => <option key={plan} value={plan}>{plan}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Status</label>
                    <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} style={fieldStyle}>
                      {invoiceFilterOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-3)' }}>
                    <span>{summary.invoiceStats?.total || 0} invoice{summary.invoiceStats?.total === 1 ? '' : 's'}</span>
                    <span>Collected {formatMoney(summary.invoiceStats?.collected || 0)}</span>
                    <span>Outstanding {formatMoney(summary.invoiceStats?.outstanding || 0)}</span>
                    {hasActiveFilters ? <span>Active filters applied</span> : null}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button variant="ghost" size="sm" onClick={resetFilterFields} disabled={!isFilterDirty}>
                      Reset fields
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearAppliedFilters} disabled={!hasActiveFilters && !isFilterDirty}>
                      Clear active filters
                    </Button>
                    <Button size="sm" onClick={applyFilters} disabled={saving}>
                      Apply filters
                    </Button>
                  </div>
                </div>

                {!invoices.length ? (
                  <EmptyState
                    icon="🧾"
                    title="No invoices found"
                    subtitle="Seed demo data or generate the first invoice to start tracking billing activity."
                    actions={(
                      <>
                        <Button variant="ghost" onClick={seedDemoData} disabled={saving}>
                          {saving ? 'Working...' : 'Seed demo data'}
                        </Button>
                        <Button onClick={() => openComposer()} disabled={!tenants.length || !availablePlans.length || saving}>Create invoice</Button>
                      </>
                    )}
                  />
                ) : (
                  <DataTable
                    columns={invoiceColumns}
                    rows={invoices}
                    rowKey="_id"
                    selectedRowKey={selectedInvoiceId}
                    onRowClick={(invoice) => setSelectedInvoiceId(invoice._id)}
                    minWidth={980}
                    emptyIcon="🧾"
                    emptyTitle="No invoices"
                    emptySubtitle="Generate the first invoice to populate the ledger."
                  />
                )}
              </Card>
            </div>

            <BillingTenantPanel
              tenantDetails={tenantDetails}
              selectedInvoice={selectedInvoice}
              loading={detailLoading}
              error={detailError}
              onGenerateInvoice={openComposer}
            />
          </div>
        </>
      ) : null}
    </AdminLayout>
  );
}
