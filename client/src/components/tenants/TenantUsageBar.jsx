import { getUsagePct } from '../../utils/adminFormat';

export default function TenantUsageBar({ used = 0, limit = 100 }) {
  const usagePct = getUsagePct(used, limit);
  const accent = usagePct >= 90 ? '#ef4444' : usagePct >= 70 ? '#f59e0b' : '#22c55e';

  return (
    <div style={{ minWidth: 140 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>
        <span>{used.toLocaleString('en-IN')} / {limit.toLocaleString('en-IN')}</span>
        <span style={{ fontWeight: 800, color: accent }}>{usagePct}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: 'var(--bg-hover)', overflow: 'hidden' }}>
        <div style={{ width: `${usagePct}%`, height: '100%', background: accent, borderRadius: 999 }} />
      </div>
    </div>
  );
}
