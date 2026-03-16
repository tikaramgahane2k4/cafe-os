/* Reusable skeleton loader components */

const pulse = { animation: 'pulse-slow 1.8s ease-in-out infinite', background: 'var(--bg-hover)', borderRadius: 6 };

export function SkeletonLine({ width = '100%', height = 14, style = {} }) {
  return <div style={{ ...pulse, width, height, ...style }} />;
}

export function SkeletonAvatar({ size = 36 }) {
  return <div style={{ ...pulse, width: size, height: size, borderRadius: '50%', flexShrink: 0 }} />;
}

export function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '20px 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <SkeletonAvatar size={40} />
        <div style={{ flex: 1 }}>
          <SkeletonLine height={10} width="60%" style={{ marginBottom: 6 }} />
          <SkeletonLine height={24} width="40%" />
        </div>
      </div>
      <SkeletonLine height={10} width="80%" style={{ marginTop: 8 }} />
    </div>
  );
}

export function SkeletonChart({ height = 220 }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-card)', padding: '20px 24px',
    }}>
      <SkeletonLine height={12} width="45%" style={{ marginBottom: 8 }} />
      <SkeletonLine height={10} width="28%" style={{ marginBottom: 20 }} />
      <SkeletonLine height={height} width="100%" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 26 }}>
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
        {Array.from({ length: 3 }).map((_, i) => <SkeletonChart key={i} />)}
      </div>
    </div>
  );
}

export function SkeletonTableRow({ cols = 6 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <SkeletonLine height={12} width={i === 0 ? '70%' : i % 2 === 0 ? '50%' : '40%'} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ rows = 5, cols = 6 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} cols={cols} />
      ))}
    </>
  );
}

export function Spinner({ size = 20, color = '#C67C4E' }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid var(--border)`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'spin 0.75s linear infinite',
      flexShrink: 0,
    }} />
  );
}

export function PageSpinner({ message = 'Loading…' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 16 }}>
      <Spinner size={36} />
      <p style={{ color: 'var(--text-3)', fontSize: '14px', margin: 0 }}>{message}</p>
    </div>
  );
}

export function EmptyState({ icon = '☕', title = 'Nothing here yet', subtitle = '' }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-2)', marginBottom: 6 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{subtitle}</div>}
    </div>
  );
}

export function ErrorBanner({ message }) {
  return (
    <div style={{
      padding: '14px 18px', background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10,
      color: '#ef4444', fontSize: 13, marginBottom: 20,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      ⚠ {message || 'Something went wrong. Please try again.'}
    </div>
  );
}
