export default function Card({
  children,
  title,
  subtitle,
  actions,
  accent,
  interactive = false,
  padding = 20,
  style = {},
  bodyStyle = {},
}) {
  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        boxShadow: 'var(--shadow-sm)',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        ...style,
      }}
      onMouseEnter={(event) => {
        if (!interactive) return;
        event.currentTarget.style.transform = 'translateY(-2px)';
        event.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(event) => {
        if (!interactive) return;
        event.currentTarget.style.transform = 'translateY(0)';
        event.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      {accent ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, ${accent}14 0%, transparent 42%)`,
            pointerEvents: 'none',
          }}
        />
      ) : null}

      <div style={{ position: 'relative', padding, ...bodyStyle }}>
        {(title || subtitle || actions) ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 18 }}>
            <div>
              {title ? (
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
                  {title}
                </div>
              ) : null}
              {subtitle ? (
                <div style={{ marginTop: 4, fontSize: 13, color: 'var(--text-3)', maxWidth: 720 }}>
                  {subtitle}
                </div>
              ) : null}
            </div>
            {actions}
          </div>
        ) : null}

        {children}
      </div>
    </section>
  );
}
