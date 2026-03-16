import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import AnalyticsChart from '../../components/admin/AnalyticsChart';
import { PageSpinner, ErrorBanner, EmptyState } from '../../components/admin/SkeletonLoader';
import { fetchTenantUsage } from '../../services/adminApi';

export default function TenantUsage() {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTenantUsage()
      .then((res) => setPayload(res))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const tenants = payload?.data || [];
  const charts = payload?.charts || { ordersPerDay: [], revenueTrend: [], activeStaffSessions: [] };

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 4px' }}>Tenant Usage Dashboard</h1>
        <p style={{ color: 'var(--text-3)', fontSize: 14, margin: 0 }}>Operational usage metrics per café tenant.</p>
      </div>

      {loading && <PageSpinner />}
      {error && <ErrorBanner message={error} />}

      {!loading && !error && tenants.length === 0 && (
        <EmptyState icon="📊" title="No tenant usage yet" subtitle="Tenant usage data will appear here." />
      )}

      {!loading && !error && tenants.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14, marginBottom: 24 }}>
            {tenants.map((tenant) => (
              <div key={tenant.tenantId} className="saas-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{tenant.cafeName}</div>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, color: '#C67C4E', background: 'rgba(198,124,78,0.12)' }}>{tenant.plan}</span>
                </div>
                <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Orders today</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)' }}>{tenant.ordersToday}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Active staff</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)' }}>{tenant.activeStaff}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Revenue today</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#C67C4E' }}>₹{tenant.revenueToday.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 18 }}>
            <AnalyticsChart type="line" data={charts.ordersPerDay} dataKey="orders" title="Orders per day" subtitle="14-day trend" color="#C67C4E" />
            <AnalyticsChart type="area" data={charts.revenueTrend} dataKey="revenue" title="Revenue trend" subtitle="14-day trend" color="#f59e0b" valuePrefix="₹" />
            <AnalyticsChart type="line" data={charts.activeStaffSessions} dataKey="sessions" title="Active staff sessions" subtitle="14-day trend" color="#22c55e" />
          </div>
        </>
      )}
    </AdminLayout>
  );
}
