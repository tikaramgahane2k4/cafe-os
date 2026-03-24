export default function EmptyState({
  icon = '☕',
  title = 'Nothing here yet',
  subtitle = '',
  actions = null,
  compact = false,
}) {
  return (
    <div style={{ textAlign: 'center', padding: compact ? '28px 18px' : '56px 20px' }}>
      <div style={{ fontSize: compact ? 28 : 44, marginBottom: 14 }}>{icon}</div>
      <div style={{ fontWeight: 800, fontSize: compact ? 15 : 18, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
        {title}
      </div>
      {subtitle ? (
        <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8, maxWidth: 520, marginInline: 'auto', lineHeight: 1.5 }}>
          {subtitle}
        </div>
      ) : null}
      {actions ? <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>{actions}</div> : null}
    </div>
  );
}
