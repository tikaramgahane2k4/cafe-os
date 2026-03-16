import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';

const TIP = ({ active, payload, label, valuePrefix = '', valueSuffix = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 14px', fontSize: 13,
      boxShadow: 'var(--shadow-lg)',
    }}>
      <div style={{ color: 'var(--text-3)', fontSize: 11, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#C67C4E', fontWeight: 700 }}>
          {valuePrefix}{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}{valueSuffix}
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsChart({
  type = 'bar', data = [], dataKey = 'count', xKey = 'date', title, subtitle,
  color = '#C67C4E', height = 220, valuePrefix = '', valueSuffix = '',
}) {
  const axisStyle = { fontSize: 11, fill: 'var(--text-3)' };
  const gradId = `grad-${dataKey}-${color.replace('#','')}`;
  const gradLineId = `grad-line-${dataKey}-${color.replace('#','')}`;

  // For date keys: show only day part (e.g. "Mar 11") every ~5th tick to avoid crowding
  const tickFormatter = xKey === 'date'
    ? (val) => {
        try {
          const d = new Date(val);
          return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        } catch { return val; }
      }
    : (val) => val;

  // Show every Nth tick when there are many data points
  const tickInterval = data.length > 14 ? Math.floor(data.length / 6) : 0;

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-card)', padding: '20px 24px',
      flex: 1, minWidth: 260, boxShadow: 'var(--shadow-md)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.15)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
    >
      {title && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{subtitle}</div>}
          <div style={{ height: 2, width: 28, background: color, borderRadius: 2, marginTop: 6, boxShadow: `0 0 6px ${color}80` }} />
        </div>
      )}
      {(!data || data.length === 0) ? (
        <div style={{ height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', gap: 8 }}>
          <span style={{ fontSize: 28 }}>📊</span>
          <span style={{ fontSize: 13 }}>No data available</span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          {type === 'bar' ? (
            <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.55} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey={xKey} tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={tickFormatter} interval={tickInterval} />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
              <Tooltip content={<TIP valuePrefix={valuePrefix} valueSuffix={valueSuffix} />} cursor={{ fill: 'var(--bg-hover)' }} />
              <Bar dataKey={dataKey} fill={`url(#${gradId})`} radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : type === 'area' ? (
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor={color} stopOpacity={0.25} />
                  <stop offset="60%" stopColor={color} stopOpacity={0.08} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey={xKey} tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={tickFormatter} interval={tickInterval} />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
              <Tooltip content={<TIP valuePrefix={valuePrefix} valueSuffix={valueSuffix} />} />
              <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} fill={`url(#${gradId})`} dot={false} activeDot={{ r: 5, fill: color, strokeWidth: 2, stroke: 'var(--bg-card)' }} />
            </AreaChart>
          ) : (
            <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={gradLineId} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#C67C4E" />
                  <stop offset="100%" stopColor="#E09A6E" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey={xKey} tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={tickFormatter} interval={tickInterval} />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
              <Tooltip content={<TIP valuePrefix={valuePrefix} valueSuffix={valueSuffix} />} />
              <Line type="monotone" dataKey={dataKey} stroke={`url(#${gradLineId})`} strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: color, strokeWidth: 2, stroke: 'var(--bg-card)' }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
}
