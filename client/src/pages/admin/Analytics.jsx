import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import StatsCard from '../../components/admin/StatsCard';
import AnalyticsChart from '../../components/admin/AnalyticsChart';
import { DashboardSkeleton, ErrorBanner, EmptyState } from '../../components/admin/SkeletonLoader';
import { fetchAnalytics } from '../../services/adminApi';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = (silent = false) => {
    if (!silent) setLoading(true);
    fetchAnalytics()
      .then((res) => setData(res.data))
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
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 4px' }}>Analytics</h1>
        <p style={{ color: 'var(--text-3)', fontSize: 14, margin: 0 }}>Detailed platform metrics, growth trends, and revenue data.</p>
      </div>

      {loading && <DashboardSkeleton />}
      {error && <ErrorBanner message={error} />}

      {!loading && !error && !data && (
        <EmptyState icon="📊" title="No analytics data" subtitle="Connect the backend to see live charts." />
      )}

      {data && (
        <>
          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
            <StatsCard title="Total Cafés"    value={data.totalCafes}       icon="🏪" variant="caramel" trend={data.tenantGrowthRate} trendLabel="this month" />
            <StatsCard title="Active Tenants" value={data.activeTenants}    icon="✅" variant="green"   trend={data.activeTrend}     trendLabel="vs last month" />
            <StatsCard title="Suspended"      value={data.suspendedTenants} icon="⏸" variant="amber"   trend={data.suspendedTrend}  trendLabel="this period" trendInvert />
            <StatsCard title="Expired"        value={data.expiredTenants}   icon="⏱" variant="rose"    trend={data.expiredTrend}    trendLabel="this period" trendInvert />
          </div>

          {/* 2 × 2 chart grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20, marginBottom: 32 }}>
            <AnalyticsChart
              type="bar"
              data={data.tenantGrowth}
              dataKey="count"
              title="🏪 Tenant Growth"
              subtitle="New tenants registered per day"
              color="#C67C4E"
            />
            <AnalyticsChart
              type="area"
              data={data.activityTrend}
              dataKey="count"
              title="⚡ Platform Activity"
              subtitle="Total events tracked daily"
              color="#a78bfa"
            />
            <AnalyticsChart
              type="bar"
              data={data.planDistribution || data.subscriptionData}
              dataKey="count"
              title="📦 Plan Distribution"
              subtitle="Tenant count per subscription plan"
              color="#22c55e"
            />
            <AnalyticsChart
              type="area"
              data={data.revenueGrowth || data.revenue}
              dataKey="amount"
              title="💰 Revenue Growth"
              subtitle="Monthly recurring revenue trend"
              color="#3b82f6"
              valuePrefix="₹"
            />
          </div>

          {/* Recent platform activity feed */}
          {data.recentLogs && data.recentLogs.length > 0 && (
            <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', border: '1px solid var(--border)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                Recent Events
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {data.recentLogs.slice(0, 8).map((log, i) => (
                  <div
                    key={i}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 7 ? '1px solid var(--border)' : 'none' }}
                  >
                    <span style={{ fontSize: 18 }}>📋</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{log.action}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 8 }}>{log.target || log.details}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString('en-IN', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
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
