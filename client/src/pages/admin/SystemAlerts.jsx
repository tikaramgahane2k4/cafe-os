import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { fetchAlerts, updateAlertStatus } from '../../services/adminApi';
import { PageSpinner, ErrorBanner, EmptyState } from '../../components/admin/SkeletonLoader';
import toast from 'react-hot-toast';

const SEV = {
  Info: { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
  Warning: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  Critical: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
};

export default function SystemAlerts() {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    fetchAlerts({ limit: 200 })
      .then((res) => setPayload(res))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const data = payload?.data || [];
  const stats = payload?.stats || { total: 0, active: 0, warning: 0, critical: 0 };

  const change = async (id, status) => {
    try {
      await updateAlertStatus(id, status);
      toast.success(`Alert ${status.toLowerCase()}`);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 4px' }}>System Alerts</h1>
        <p style={{ color: 'var(--text-3)', fontSize: 14, margin: 0 }}>Operational alerts across tenant activity and subscription health.</p>
      </div>

      {loading && <PageSpinner />}
      {error && <ErrorBanner message={error} />}

      {!loading && !error && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            {[
              ['Active Alerts', stats.active, '#ef4444', 'rgba(239,68,68,0.12)'],
              ['Warnings', stats.warning, '#f59e0b', 'rgba(245,158,11,0.12)'],
              ['Critical', stats.critical, '#ef4444', 'rgba(239,68,68,0.18)'],
            ].map(([label, value, color, bg]) => (
              <div key={label} style={{ background: bg, borderRadius: 10, padding: '10px 16px', minWidth: 120 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase' }}>{label}</div>
              </div>
            ))}
          </div>

          {data.length === 0 ? <EmptyState icon="🚨" title="No alerts" subtitle="Everything looks healthy right now." /> : (
            <div style={{ display: 'grid', gap: 10 }}>
              {data.map((alert) => {
                const s = SEV[alert.severity] || SEV.Info;
                return (
                  <div key={alert._id} className="saas-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99, background: s.bg, color: s.color, fontWeight: 700 }}>{alert.severity}</span>
                        <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99, background: 'var(--bg-hover)', color: 'var(--text-2)', fontWeight: 700 }}>{alert.type}</span>
                        <span style={{ fontSize: 12, color: '#C67C4E', fontWeight: 700 }}>{alert.tenantName}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{new Date(alert.createdAt).toLocaleString('en-IN')}</div>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-1)', marginTop: 8 }}>{alert.message}</div>
                    <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                      <button onClick={() => change(alert._id, 'Resolved')} className="btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}>Resolve</button>
                      <button onClick={() => change(alert._id, 'Dismissed')} className="btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}>Dismiss</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
