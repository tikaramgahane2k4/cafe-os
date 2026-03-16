import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import StatsCard from '../../components/admin/StatsCard';
import AnalyticsChart from '../../components/admin/AnalyticsChart';
import { DashboardSkeleton, ErrorBanner, EmptyState } from '../../components/admin/SkeletonLoader';
import { fetchAnalytics, fetchBillingSummary, fetchAlerts } from '../../services/adminApi';

const HEALTH = [
  { label: 'API Server', ok: true },
  { label: 'Database',   ok: true },
  { label: 'Auth Layer', ok: true },
];

function QuickAction({ icon, label, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '18px 24px', background: hover ? 'var(--bg-hover)' : 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s', flex: '1 1 0', minWidth: 100 }}
    >
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>{label}</span>
    </button>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [mrr, setMrr] = useState(0);
  const [activeAlerts, setActiveAlerts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = (silent = false) => {
    if (!silent) setLoading(true);
    Promise.all([fetchAnalytics(), fetchBillingSummary(), fetchAlerts({ status: 'Active', limit: 200 })])
      .then(([analytics, billing, alerts]) => {
        setData(analytics.data);
        setMrr(billing.data?.mrr || 0);
        setActiveAlerts(alerts.stats?.active || 0);
      })
      .catch((e) => setError(e.message))
      .finally(() => !silent && setLoading(false));
  };

  useEffect(() => {
    load(false);
    const id = setInterval(() => load(true), 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <AdminLayout>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 4px' }}>Platform Dashboard</h1>
        <p style={{ color: 'var(--text-3)', fontSize: 14, margin: 0 }}>Real-time overview of your Cafe OS SaaS platform.</p>
      </div>

      {loading && <DashboardSkeleton />}
      {error && <ErrorBanner message={error} />}

      {!loading && !error && !data && (
        <EmptyState icon="☕" title="No data yet" subtitle="Connect the backend to see live metrics." />
      )}

      {data && (
        <>
          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
            <StatsCard title="Total Cafés"       value={data.totalCafes}        icon="🏪" variant="caramel" subtitle="All registered" />
            <StatsCard title="Active Tenants"    value={data.activeTenants}     icon="✅" variant="green"   subtitle="Running now" />
            <StatsCard title="Suspended"         value={data.suspendedTenants}  icon="⏸" variant="amber" />
            <StatsCard title="Expired"           value={data.expiredTenants}    icon="⏱" variant="rose" />
            <StatsCard title="Total MRR"         value={`₹${mrr.toLocaleString('en-IN')}`} icon="💰" variant="purple" subtitle="Active subscription revenue" />
            <StatsCard title="Active Alerts"     value={activeAlerts} icon="🚨" variant="blue" subtitle="Operational warnings" />
          </div>

          {/* Quick actions + Platform health */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, marginBottom: 32, alignItems: 'start' }}>
            {/* Quick actions */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Quick Actions</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <QuickAction icon="🏪" label="Add Tenant"       onClick={() => navigate('/admin/tenants')} />
                <QuickAction icon="💳" label="Create Plan"      onClick={() => navigate('/admin/subscriptions')} />
                <QuickAction icon="⚑" label="Manage Features"  onClick={() => navigate('/admin/feature-flags')} />
                <QuickAction icon="👤" label="Add User"         onClick={() => navigate('/admin/users')} />
                <QuickAction icon="🧾" label="Billing"          onClick={() => navigate('/admin/billing')} />
                <QuickAction icon="🚨" label="Alerts"           onClick={() => navigate('/admin/alerts')} />
              </div>
            </div>

            {/* Platform health */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', padding: 20, minWidth: 200 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Platform Health</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {HEALTH.map((h) => (
                  <div key={h.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{h.label}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: h.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: h.ok ? '#22c55e' : '#ef4444' }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: h.ok ? '#22c55e' : '#ef4444' }} />
                      {h.ok ? 'Online' : 'Offline'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginBottom: 32 }}>
            <AnalyticsChart type="bar"  data={data.tenantGrowth}  dataKey="count"  title="🏪 Tenant Growth"     subtitle="New tenants — last 7 days" color="#C67C4E" />
            <AnalyticsChart type="area" data={data.activityTrend} dataKey="count"  title="⚡ Platform Activity"  subtitle="Events tracked daily"       color="#a78bfa" />
            <AnalyticsChart type="area" data={data.revenueGrowth || data.revenue} dataKey="amount" title="💰 Revenue Growth" subtitle="Monthly recurring revenue" color="#3b82f6" valuePrefix="₹" />
          </div>

          {/* Live activity feed */}
          {data.recentLogs && data.recentLogs.length > 0 && (
            <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Recent Activity</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {data.recentLogs.slice(0, 5).map((log, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize: 20 }}>📋</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{log.action}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 8 }}>{log.target || log.details}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
