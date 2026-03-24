import Card from './Card';

export default function MetricCard({
  label,
  value,
  trend,
  trendLabel = 'vs previous period',
  trendPositiveIsGood = true,
  comparisonText = '',
  subtitle,
  accent = '#c67c4e',
  breakdown = null,
  icon = null,
}) {
  const trendTone = trendPositiveIsGood
    ? (trend >= 0 ? '#22c55e' : '#ef4444')
    : (trend >= 0 ? '#ef4444' : '#22c55e');

  return (
    <Card accent={accent} interactive style={{ minHeight: 170 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
            {label}
          </div>
          <div style={{ marginTop: 12, fontSize: 30, fontWeight: 900, color: 'var(--text-1)', letterSpacing: '-0.04em' }}>
            {value}
          </div>
          {typeof trend === 'number' ? (
            <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, color: trendTone }}>
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
              <span style={{ color: 'var(--text-3)' }}>{trendLabel}</span>
            </div>
          ) : null}

          {comparisonText ? (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>
              {comparisonText}
            </div>
          ) : null}

          {breakdown ? (
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 14 }}>
              {Object.entries(breakdown).map(([key, amount]) => (
                <div key={key}>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {key}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 17, fontWeight: 800, color: 'var(--text-1)' }}>
                    {amount}
                  </div>
                </div>
              ))}
            </div>
          ) : subtitle ? (
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>
              {subtitle}
            </div>
          ) : null}
        </div>

        {icon ? (
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 16,
              background: `${accent}20`,
              color: accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
