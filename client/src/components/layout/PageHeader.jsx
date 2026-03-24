export default function PageHeader({ eyebrow, title, subtitle, actions = null }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 28 }}>
      <div style={{ maxWidth: 760 }}>
        {eyebrow ? (
          <div style={{ marginBottom: 8, fontSize: 11, fontWeight: 800, color: '#c67c4e', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {eyebrow}
          </div>
        ) : null}
        <h1 style={{ margin: 0, fontSize: 30, lineHeight: 1.05, fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text-1)', fontFamily: '"Fraunces", Georgia, serif' }}>
          {title}
        </h1>
        {subtitle ? (
          <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.6, color: 'var(--text-3)' }}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}
