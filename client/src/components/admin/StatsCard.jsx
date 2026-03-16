import { IconTrendingUp, IconTrendingDown } from './icons';

const VARIANTS = {
  caramel: { accent: '#C67C4E', bg: 'rgba(198,124,78,0.1)',  icon: 'rgba(198,124,78,0.18)' },
  green:   { accent: '#22c55e', bg: 'rgba(34,197,94,0.1)',   icon: 'rgba(34,197,94,0.18)'  },
  amber:   { accent: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: 'rgba(245,158,11,0.18)' },
  rose:    { accent: '#ef4444', bg: 'rgba(239,68,68,0.1)',   icon: 'rgba(239,68,68,0.18)'  },
  purple:  { accent: '#a78bfa', bg: 'rgba(167,139,250,0.1)', icon: 'rgba(167,139,250,0.18)'},
  blue:    { accent: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  icon: 'rgba(59,130,246,0.18)' },
};

/**
 * StatsCard
 * @param {string}  title       - Card label
 * @param {*}       value       - Large metric (number or string)
 * @param {string}  icon        - Emoji or text icon shown in avatar
 * @param {string}  variant     - Color variant (caramel | green | amber | rose | purple | blue)
 * @param {string}  subtitle    - Secondary description text
 * @param {number}  trend       - Numeric change (+3, -2, etc.)
 * @param {string}  trendLabel  - e.g. "this month", "vs last week"
 * @param {boolean} trendInvert - Flip good/bad color logic (e.g. suspended → down is good)
 */
export default function StatsCard({
  title, value, icon, variant = 'caramel',
  subtitle, trend, trendLabel = 'this month', trendInvert = false,
}) {
  const v = VARIANTS[variant] || VARIANTS.caramel;
  const hasValue = value !== undefined && value !== null;
  const isPositive = trend > 0;
  const trendGood = trendInvert ? !isPositive : isPositive;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '20px 22px',
        boxShadow: 'var(--shadow-sm)',
        position: 'relative', overflow: 'hidden',
        transition: 'transform 0.15s, box-shadow 0.15s',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      {/* Top accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: v.accent, borderRadius: '14px 14px 0 0' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        {/* Text */}
        <div style={{ flex: 1, paddingTop: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 8 }}>{title}</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {hasValue ? value : '—'}
          </div>

          {/* Trend indicator */}
          {trend !== undefined && trend !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, color: trendGood ? '#22c55e' : '#ef4444', fontSize: 12, fontWeight: 700 }}>
                {isPositive
                  ? <IconTrendingUp size={13} />
                  : <IconTrendingDown size={13} />
                }
                {isPositive ? '+' : ''}{trend}
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{trendLabel}</span>
            </div>
          )}

          {/* Subtitle (no trend) */}
          {!trend && subtitle && (
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>{subtitle}</div>
          )}
        </div>

        {/* Icon avatar */}
        <div style={{
          width: 44, height: 44, borderRadius: 11, flexShrink: 0,
          background: v.icon,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, marginTop: 4,
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}
