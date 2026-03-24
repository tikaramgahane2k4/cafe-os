import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import AnalyticsChart from '../../components/admin/AnalyticsChart';
import { DashboardSkeleton, ErrorBanner } from '../../components/admin/SkeletonLoader';
import DashboardQuickActions from '../../components/dashboard/DashboardQuickActions';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import MetricCard from '../../components/ui/MetricCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { useDashboardOverview } from '../../hooks/useDashboardOverview';
import { formatMoney } from '../../utils/adminFormat';

const HEALTH = [
  { label: 'API Server', status: 'Paid', text: 'Operational' },
  { label: 'Database', status: 'Paid', text: 'Healthy' },
  { label: 'Notification jobs', status: 'Pending', text: 'Polling every 30s' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const {
    analytics,
    billingSummary,
    loading,
    error,
    unreadNotifications,
  } = useDashboardOverview();

  const quickActions = [
    {
      icon: '🏪',
      label: 'Add tenant',
      description: 'Create a new cafe workspace and issue owner credentials.',
      onClick: () => navigate('/admin/tenants'),
    },
    {
      icon: '💳',
      label: 'Manage plans',
      description: 'Update pricing, limits, and package availability.',
      onClick: () => navigate('/admin/subscriptions'),
    },
    {
      icon: '🧾',
      label: 'Billing control',
      description: 'Generate invoices, retry payments, and inspect collections.',
      onClick: () => navigate('/admin/billing'),
    },
    {
      icon: '⚑',
      label: 'Feature rollout',
      description: 'Toggle capabilities by plan or tenant override.',
      onClick: () => navigate('/admin/feature-flags'),
    },
  ];

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="Control Center"
        title="Platform dashboard"
        subtitle="A Super Admin view of revenue, tenant health, feature rollout, and live system activity."
      />

      {loading ? <DashboardSkeleton /> : null}
      {error ? <ErrorBanner message={error} /> : null}

      {!loading && !error && !analytics ? (
        <EmptyState
          icon="☕"
          title="No platform data yet"
          subtitle="Connect the backend and start creating tenants to unlock live SaaS metrics."
        />
      ) : null}

      {!loading && !error && analytics ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
            <MetricCard label="Total tenants" value={analytics.totalCafes} subtitle="Registered workspaces across the platform" accent="#c67c4e" icon="🏪" />
            <MetricCard label="Active tenants" value={analytics.activeTenants} subtitle={`${analytics.suspendedTenants} suspended · ${analytics.expiredTenants} expired`} accent="#22c55e" icon="⚡" />
            <MetricCard label="Platform MRR" value={formatMoney(billingSummary?.mrr || analytics.mrr || 0)} trend={billingSummary?.monthlyGrowthPct || 0} subtitle="Recurring subscription revenue" accent="#0f766e" icon="💰" />
            <MetricCard label="Unread notifications" value={unreadNotifications} subtitle="Centralized alerts and events awaiting review" accent="#3b82f6" icon="🔔" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(280px, 0.9fr)', gap: 18, marginBottom: 24 }}>
            <DashboardQuickActions actions={quickActions} />

            <Card title="Platform health" subtitle="Operational signals across the admin control plane.">
              <div style={{ display: 'grid', gap: 12 }}>
                {HEALTH.map((item) => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{item.label}</div>
                      <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-3)' }}>{item.text}</div>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18, marginBottom: 24 }}>
            <AnalyticsChart
              type="bar"
              data={analytics.tenantGrowth}
              dataKey="count"
              title="Tenant growth"
              subtitle="New tenants created across the last 30 days"
              color="#c67c4e"
            />
            <AnalyticsChart
              type="area"
              data={analytics.activityTrend}
              dataKey="count"
              title="Activity volume"
              subtitle="Tracked admin and platform events"
              color="#0f766e"
            />
            <AnalyticsChart
              type="line"
              data={analytics.revenueGrowth}
              dataKey="amount"
              title="Revenue trend"
              subtitle="Estimated MRR progression"
              color="#3b82f6"
              valuePrefix="₹"
            />
          </div>

          <Card title="Recent activity" subtitle="The latest admin and system events flowing into the platform.">
            {analytics.recentLogs?.length ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {analytics.recentLogs.map((log, index) => (
                  <div key={`${log.action}-${index}`} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingBottom: 12, borderBottom: index < analytics.recentLogs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 14, background: 'rgba(198,124,78,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      📋
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)' }}>{log.action}</div>
                      <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>
                        {log.target || log.details}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="📋"
                title="No activity yet"
                subtitle="Recent billing, tenant, and feature events will appear here."
                compact
              />
            )}
          </Card>
        </>
      ) : null}
    </AdminLayout>
  );
}
