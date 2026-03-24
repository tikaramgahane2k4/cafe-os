import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { ErrorBanner } from '../../components/admin/SkeletonLoader';
import PageHeader from '../../components/layout/PageHeader';
import TenantCreateModal from '../../components/tenants/TenantCreateModal';
import TenantUsageBar from '../../components/tenants/TenantUsageBar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import MetricCard from '../../components/ui/MetricCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { usePlanCatalog } from '../../hooks/usePlanCatalog';
import { useTenants } from '../../hooks/useTenants';
import {
  formatDate,
  formatRelativeTime,
  getPlanTone,
  isExpiringSoon,
} from '../../utils/adminFormat';

function downloadTenantsCsv(tenants) {
  const header = ['Cafe', 'Owner', 'Email', 'Plan', 'Status', 'Usage', 'Expiry', 'Last Active'];
  const rows = tenants.map((tenant) => [
    tenant.cafeName,
    tenant.ownerName,
    tenant.email,
    tenant.subscriptionPlan,
    tenant.status,
    `${tenant.ordersUsed}/${tenant.orderLimit}`,
    formatDate(tenant.planExpiryDate),
    formatRelativeTime(tenant.lastActiveAt),
  ]);

  const csv = [header, ...rows].map((row) => row.map((cell) => `"${cell ?? ''}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'cafeos-tenants.csv';
  link.click();
  window.URL.revokeObjectURL(url);
}

function CredentialsCard({ credentials, onDismiss }) {
  return (
    <Card accent="#22c55e" style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)' }}>Tenant created successfully</div>
          <div style={{ marginTop: 5, fontSize: 13, color: 'var(--text-3)' }}>
            Save these credentials now. The temporary password cannot be recovered later.
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onDismiss}>Dismiss</Button>
      </div>

      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <CredentialField label="Tenant ID" value={credentials.tenantId} />
        <CredentialField label="Owner Email" value={credentials.ownerEmail} />
        <CredentialField label="Temp Password" value={credentials.tempPassword} />
      </div>
    </Card>
  );
}

function CredentialField({ label, value }) {
  return (
    <div style={{ padding: '14px 16px', borderRadius: 16, background: 'var(--bg-hover)' }}>
      <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
        {label}
      </div>
      <div style={{ marginTop: 8, fontSize: 13, fontWeight: 800, color: '#c67c4e' }}>
        {value}
      </div>
    </div>
  );
}

export default function TenantManagement() {
  const [searchParams] = useSearchParams();
  const querySearch = searchParams.get('search') || '';
  const queryStatus = searchParams.get('status') || 'ALL';
  const querySort = searchParams.get('sort') || 'createdAt';
  const queryOrder = searchParams.get('order') || 'desc';

  const {
    tenants,
    tenantStats,
    loading,
    error,
    saving,
    filters,
    meta,
    emptyDraft,
    setFilters,
    refresh,
    createTenantRecord,
    updateTenantLifecycle,
    deleteTenantRecord,
  } = useTenants({
    search: querySearch,
    status: queryStatus,
    sort: querySort,
    order: queryOrder,
    page: 1,
    limit: 10,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const { plans: subscriptionPlans } = usePlanCatalog();

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      search: querySearch,
      status: queryStatus,
      sort: querySort,
      order: queryOrder,
      page: 1,
    }));
  }, [queryOrder, querySearch, querySort, queryStatus, setFilters]);

  const columns = useMemo(() => [
    {
      key: 'cafe',
      label: 'Cafe',
      render: (tenant) => (
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)' }}>{tenant.cafeName}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-3)' }}>{tenant.tenantId}</div>
        </div>
      ),
    },
    {
      key: 'owner',
      label: 'Owner',
      render: (tenant) => (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{tenant.ownerName}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-3)' }}>{tenant.email}</div>
        </div>
      ),
    },
    {
      key: 'plan',
      label: 'Plan',
      render: (tenant) => {
        const tone = getPlanTone(tenant.subscriptionPlan);
        return (
          <Badge tone={tone.accent} background={tone.background}>
            {tenant.subscriptionPlan}
          </Badge>
        );
      },
    },
    {
      key: 'usage',
      label: 'Usage',
      render: (tenant) => <TenantUsageBar used={tenant.ordersUsed} limit={tenant.orderLimit} />,
    },
    {
      key: 'expiry',
      label: 'Expiry',
      render: (tenant) => (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{formatDate(tenant.planExpiryDate)}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: isExpiringSoon(tenant.planExpiryDate) ? '#f59e0b' : 'var(--text-3)' }}>
            {isExpiringSoon(tenant.planExpiryDate) ? 'Renewal due soon' : 'On schedule'}
          </div>
        </div>
      ),
    },
    {
      key: 'lastActive',
      label: 'Last Active',
      render: (tenant) => formatRelativeTime(tenant.lastActiveAt),
    },
    {
      key: 'status',
      label: 'Status',
      render: (tenant) => <StatusBadge status={tenant.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (tenant) => (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              updateTenantLifecycle(tenant._id, tenant.status === 'Active' ? 'Suspended' : 'Active');
            }}
            disabled={saving}
          >
            {tenant.status === 'Active' ? 'Suspend' : 'Activate'}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              if (window.confirm(`Delete "${tenant.cafeName}"? This cannot be undone.`)) {
                deleteTenantRecord(tenant._id);
              }
            }}
            disabled={saving}
          >
            Delete
          </Button>
        </div>
      ),
      align: 'right',
    },
  ], [deleteTenantRecord, saving, updateTenantLifecycle]);

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="Tenant Ops"
        title="Tenant management"
        subtitle="Manage onboarding, usage, renewals, and workspace lifecycle from one operational surface."
        actions={(
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button variant="ghost" onClick={() => downloadTenantsCsv(tenants)}>Export CSV</Button>
            <Button onClick={() => setShowCreateModal(true)}>Add tenant</Button>
          </div>
        )}
      />

      <TenantCreateModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        initialDraft={emptyDraft}
        plans={subscriptionPlans}
        saving={saving}
        onSubmit={async (draft) => {
          try {
            const response = await createTenantRecord(draft);
            setCredentials(response.credentials);
            setShowCreateModal(false);
          } catch (_) {
            // The hook already shows a toast; keep the modal open so the admin can correct the form.
          }
        }}
      />

      {credentials ? <CredentialsCard credentials={credentials} onDismiss={() => setCredentials(null)} /> : null}
      {error ? <ErrorBanner message={error} /> : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 18 }}>
        <MetricCard label="Total tenants" value={tenantStats.total} subtitle="Workspace count across the current filtered dataset" accent="#c67c4e" icon="🏪" />
        <MetricCard label="Active now" value={tenantStats.active} subtitle="Tenants currently serving traffic" accent="#22c55e" icon="⚡" />
        <MetricCard label="Expiring soon" value={tenantStats.expiringSoon} subtitle="Renewals coming up in the next 7 days" accent="#f59e0b" icon="⏳" />
        <MetricCard label="High usage" value={tenantStats.highUsage} subtitle="Tenants above 80% of their current plan limit" accent="#0f766e" icon="📈" />
      </div>

      <Card
        title="Tenant ledger"
        subtitle="Search by cafe, owner, or email. Sort and paginate the operational tenant list."
        actions={(
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="ghost" size="sm" onClick={() => refresh()}>Refresh</Button>
          </div>
        )}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1.5fr) repeat(4, minmax(120px, 0.65fr))', gap: 12, marginBottom: 16 }}>
          <input
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))}
            placeholder="Search cafe, owner, or email"
            style={fieldStyle}
          />
          <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))} style={fieldStyle}>
            {['ALL', 'Active', 'Suspended', 'Expired'].map((status) => (
              <option key={status} value={status}>{status === 'ALL' ? 'All statuses' : status}</option>
            ))}
          </select>
          <select value={filters.sort} onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value, page: 1 }))} style={fieldStyle}>
            <option value="createdAt">Newest</option>
            <option value="planExpiryDate">Expiry date</option>
            <option value="usage">Usage</option>
            <option value="cafeName">Cafe name</option>
          </select>
          <select value={filters.order} onChange={(event) => setFilters((current) => ({ ...current, order: event.target.value, page: 1 }))} style={fieldStyle}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
          <select value={filters.limit} onChange={(event) => setFilters((current) => ({ ...current, limit: Number(event.target.value), page: 1 }))} style={fieldStyle}>
            {[10, 25, 50].map((limit) => <option key={limit} value={limit}>{limit} / page</option>)}
          </select>
        </div>

        <DataTable
          columns={columns}
          rows={tenants}
          rowKey="_id"
          loading={loading}
          emptyIcon="🏪"
          emptyTitle="No tenants found"
          emptySubtitle="Adjust your filters or create the first tenant workspace."
          minWidth={1080}
          skeletonRows={filters.limit}
        />

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
            Showing page {meta.page} of {meta.pages} · {meta.total} tenant{meta.total === 1 ? '' : 's'}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" size="sm" onClick={() => setFilters((current) => ({ ...current, page: Math.max(1, current.page - 1) }))} disabled={meta.page <= 1}>
              Previous
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setFilters((current) => ({ ...current, page: Math.min(meta.pages, current.page + 1) }))} disabled={meta.page >= meta.pages}>
              Next
            </Button>
          </div>
        </div>
      </Card>
    </AdminLayout>
  );
}

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
