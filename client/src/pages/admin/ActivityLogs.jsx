import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import ActivityLogTableComp from '../../components/admin/ActivityLogTable';
import { fetchLogs } from '../../services/adminApi';
import { PageSpinner, ErrorBanner } from '../../components/admin/SkeletonLoader';

const SEVERITY_COUNTS = (logs) => ({
  INFO:     logs.filter((l) => (l.severity || 'INFO') === 'INFO').length,
  WARNING:  logs.filter((l) => l.severity === 'WARNING').length,
  SECURITY: logs.filter((l) => l.severity === 'SECURITY').length,
});

export default function ActivityLogs() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [total,   setTotal]   = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    // fetch a large batch (200); client-side filtering/pagination handles the rest
    fetchLogs({ limit: 200, page: 1 })
      .then((r) => { setLogs(r.data || []); setTotal(r.total || 0); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = SEVERITY_COUNTS(logs);

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 4px' }}>Activity Logs</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 14, margin: 0 }}>
            Full forensic audit trail — every admin action is recorded with before/after values, IP, and device.
          </p>
        </div>
        <button
          onClick={load}
          style={{ padding: '9px 16px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-2)', cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
        >
          ↺ Refresh
        </button>
      </div>

      {/* Severity stats */}
      {!loading && logs.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Events',  value: total,            color: 'var(--text-2)', bg: 'var(--bg-hover)' },
            { label: 'INFO',          value: counts.INFO,      color: '#3b82f6',       bg: 'rgba(59,130,246,0.1)' },
            { label: 'WARNING',       value: counts.WARNING,   color: '#f59e0b',       bg: 'rgba(245,158,11,0.1)' },
            { label: 'SECURITY',      value: counts.SECURITY,  color: '#ef4444',       bg: 'rgba(239,68,68,0.1)' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ background: bg, borderRadius: 10, padding: '10px 18px', textAlign: 'center', minWidth: 100 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {loading && <PageSpinner />}
      {error && <ErrorBanner message={error} />}

      {!loading && !error && (
        <ActivityLogTableComp logs={logs} loading={false} error={null} />
      )}
    </AdminLayout>
  );
}
