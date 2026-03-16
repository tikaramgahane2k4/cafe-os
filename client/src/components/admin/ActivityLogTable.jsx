import { useState, useMemo } from 'react';
import { IconDownload, IconFilter, IconCalendar, IconX, IconUser } from './icons';
import { SkeletonTable, EmptyState, ErrorBanner } from './SkeletonLoader';

/* ─── Severity config ──────────────────────────────────────── */
const SEVERITY_STYLE = {
  INFO:     { bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6', icon: 'ℹ' },
  WARNING:  { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b', icon: '⚠' },
  SECURITY: { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444', icon: '🔒' },
};
/* ─── Action type → icon + color ──────────────────────────── */
const ACTION_META = {
  ADMIN_USER_CREATED:       { icon: '✚', bg: 'rgba(34,197,94,0.1)',   color: '#22c55e',  label: 'USER CREATED'    },
  ADMIN_USER_UPDATED:       { icon: '✎', bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6',  label: 'USER UPDATED'    },
  ADMIN_USER_DELETED:       { icon: '✕', bg: 'rgba(239,68,68,0.1)',   color: '#ef4444',  label: 'USER DELETED'    },
  TENANT_CREATED:           { icon: '🏪', bg: 'rgba(34,197,94,0.1)',  color: '#22c55e',  label: 'TENANT CREATED'  },
  TENANT_STATUS_CHANGED:    { icon: '↺', bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b',  label: 'TENANT STATUS'   },
  TENANT_DELETED:           { icon: '✕', bg: 'rgba(239,68,68,0.1)',   color: '#ef4444',  label: 'TENANT DELETED'  },
  TENANT_PLAN_CHANGED:      { icon: '💳', bg: 'rgba(167,139,250,0.1)', color: '#a78bfa', label: 'PLAN CHANGED'    },
  FEATURE_UPDATED:          { icon: '⚑', bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6',  label: 'FEATURE UPDATE'  },
  FEATURE_UPDATE:           { icon: '⚑', bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6',  label: 'FEATURE UPDATE'  },
  SUBSCRIPTION_CHANGED:     { icon: '💳', bg: 'rgba(167,139,250,0.1)', color: '#a78bfa', label: 'PLAN CHANGED'    },
  ADMIN_LOGIN:              { icon: '🔑', bg: 'rgba(198,124,78,0.1)',  color: '#C67C4E',  label: 'ADMIN LOGIN'     },
  CREATE:                   { icon: '✚', bg: 'rgba(34,197,94,0.1)',   color: '#22c55e',  label: 'CREATE'          },
  UPDATE:                   { icon: '✎', bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6',  label: 'UPDATE'          },
  DELETE:                   { icon: '✕', bg: 'rgba(239,68,68,0.1)',   color: '#ef4444',  label: 'DELETE'          },
  SUSPEND:                  { icon: '⏸', bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b',  label: 'SUSPEND'         },
  ACTIVATE:                 { icon: '▶', bg: 'rgba(34,197,94,0.1)',  color: '#22c55e',   label: 'ACTIVATE'        },
  LOGIN:                    { icon: '⎆', bg: 'rgba(198,124,78,0.1)',  color: '#C67C4E',  label: 'LOGIN'           },
  LOGOUT:                   { icon: '⎇', bg: 'rgba(107,114,128,0.1)', color: '#6b7280', label: 'LOGOUT'          },
};

function getActionMeta(action = '') {
  const key = action.toUpperCase().replace(/\s+/g, '_');
  return ACTION_META[key] || { icon: '📋', bg: 'rgba(156,122,96,0.1)', color: '#9C7A60', label: action || '—' };
}

function fmt(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function csvExport(logs) {
  const header = ['Action', 'Target', 'Admin', 'Severity', 'Before', 'After', 'IP Address', 'Device', 'Time'];
  const rows = logs.map((l) => [
    l.action, l.target || '', l.performedBy || '',
    l.severity || 'INFO',
    l.beforeValue || '', l.afterValue || '',
    l.ipAddress || '', l.device || '',
    fmt(l.createdAt),
  ]);
  const csv = [header, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'activity-logs.csv'; a.click();
  URL.revokeObjectURL(url);
}

const ALL_ACTION_TYPES = [
  'ALL','ADMIN_USER_CREATED','ADMIN_USER_UPDATED','ADMIN_USER_DELETED',
  'TENANT_CREATED','TENANT_STATUS_CHANGED','TENANT_DELETED','TENANT_PLAN_CHANGED',
  'FEATURE_UPDATED','SUBSCRIPTION_CHANGED','ADMIN_LOGIN',
];
const PAGE_SIZE = 15;

export default function ActivityLogTable({ logs = [], loading, error }) {
  const [actionFilter,   setActionFilter]   = useState('ALL');
  const [userFilter,     setUserFilter]     = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [dateFrom,       setDateFrom]       = useState('');
  const [dateTo,         setDateTo]         = useState('');
  const [expandedId,     setExpandedId]     = useState(null);
  const [page,           setPage]           = useState(1);

  const admins = useMemo(() => {
    const set = new Set(logs.map((l) => l.performedBy).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [logs]);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (actionFilter !== 'ALL') {
        const key = (l.action || '').toUpperCase().replace(/\s+/g, '_');
        if (key !== actionFilter) return false;
      }
      if (severityFilter !== 'ALL' && (l.severity || 'INFO') !== severityFilter) return false;
      if (userFilter && userFilter !== 'ALL' && l.performedBy !== userFilter) return false;
      if (dateFrom && new Date(l.createdAt) < new Date(dateFrom)) return false;
      if (dateTo) {
        const to = new Date(dateTo); to.setHours(23, 59, 59, 999);
        if (new Date(l.createdAt) > to) return false;
      }
      return true;
    });
  }, [logs, actionFilter, severityFilter, userFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilters = actionFilter !== 'ALL' || severityFilter !== 'ALL' || (userFilter && userFilter !== 'ALL') || dateFrom || dateTo;
  const clearFilters = () => { setActionFilter('ALL'); setSeverityFilter('ALL'); setUserFilter(''); setDateFrom(''); setDateTo(''); setPage(1); };

  const selStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-2)', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer' };
  const inpStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-2)', borderRadius: 8, padding: '6px 10px', fontSize: 12 };

  return (
    <div>
      {error && <ErrorBanner message={error} />}

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <IconFilter size={13} style={{ color: 'var(--text-3)' }} />
          <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} style={selStyle}>
            {ALL_ACTION_TYPES.map((a) => <option key={a} value={a}>{a === 'ALL' ? 'All Actions' : ACTION_META[a]?.label || a}</option>)}
          </select>
        </div>

        {/* Severity */}
        <select value={severityFilter} onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }} style={selStyle}>
          <option value="ALL">All Severity</option>
          {['INFO','WARNING','SECURITY'].map((s) => (
            <option key={s} value={s}>{SEVERITY_STYLE[s]?.icon} {s}</option>
          ))}
        </select>

        {/* Admin */}
        {admins.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <IconUser size={13} style={{ color: 'var(--text-3)' }} />
            <select value={userFilter || 'ALL'} onChange={(e) => { setUserFilter(e.target.value === 'ALL' ? '' : e.target.value); setPage(1); }} style={selStyle}>
              {admins.map((a) => <option key={a} value={a}>{a === 'ALL' ? 'All Admins' : a}</option>)}
            </select>
          </div>
        )}

        {/* Date range */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <IconCalendar size={13} style={{ color: 'var(--text-3)' }} />
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} style={inpStyle} title="From date" />
          <span style={{ color: 'var(--text-3)', fontSize: 11 }}>—</span>
          <input type="date" value={dateTo}   onChange={(e) => { setDateTo(e.target.value);   setPage(1); }} style={inpStyle} title="To date" />
        </div>

        {hasFilters && (
          <button onClick={clearFilters} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: 'rgba(198,124,78,0.1)', border: '1px solid rgba(198,124,78,0.3)', borderRadius: 7, cursor: 'pointer', fontSize: 12, color: '#C67C4E', fontWeight: 600 }}>
            <IconX size={12} /> Clear
          </button>
        )}
        <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 'auto' }}>{filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}</span>
        <button onClick={() => csvExport(filtered)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>
          <IconDownload size={14} /> Export CSV
        </button>
      </div>

      {/* ── Table ── */}
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
          <thead>
            <tr>
              {['Action', 'Target', 'Admin', 'Severity', 'Diff', 'Time'].map((h) => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', background: 'var(--bg-hover)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTable rows={5} cols={6} />
            ) : paged.length === 0 ? (
              <tr><td colSpan={6}>
                <EmptyState icon="📋" title="No activity logs" subtitle={hasFilters ? 'No entries match the current filters.' : 'Activity will appear here once events occur.'} />
              </td></tr>
            ) : paged.map((log, i) => {
              const meta    = getActionMeta(log.action);
              const sev     = SEVERITY_STYLE[log.severity || 'INFO'] || SEVERITY_STYLE.INFO;
              const isExp   = expandedId === (log._id || i);
              const hasDiff = log.beforeValue || log.afterValue;
              return (
                <>
                  <tr
                    key={log._id || i}
                    onClick={() => hasDiff && setExpandedId(isExp ? null : (log._id || i))}
                    style={{ borderTop: '1px solid var(--border)', transition: 'background 0.1s', cursor: hasDiff ? 'pointer' : 'default' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Action */}
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: meta.bg, color: meta.color, whiteSpace: 'nowrap' }}>
                        <span>{meta.icon}</span>
                        {meta.label}
                      </span>
                    </td>
                    {/* Target */}
                    <td style={{ padding: '11px 16px' }}>
                      {log.target
                        ? <span style={{ display: 'inline-block', padding: '2px 8px', background: 'var(--bg-hover)', borderRadius: 6, fontSize: 12, color: 'var(--text-2)', border: '1px solid var(--border)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.target}</span>
                        : <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>}
                    </td>
                    {/* Admin + IP */}
                    <td style={{ padding: '11px 16px', fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>
                      {log.performedBy || '—'}
                      {log.ipAddress && <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'monospace' }}>{log.ipAddress}</div>}
                    </td>
                    {/* Severity */}
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: sev.bg, color: sev.color }}>
                        {sev.icon} {log.severity || 'INFO'}
                      </span>
                    </td>
                    {/* Diff toggle */}
                    <td style={{ padding: '11px 16px', color: 'var(--text-3)', fontSize: 12 }}>
                      {hasDiff
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#C67C4E', fontWeight: 600 }}>{isExp ? '▲ Hide' : '▼ View'}</span>
                        : <span style={{ color: 'var(--text-3)', fontSize: 11 }}>—</span>}
                    </td>
                    {/* Time + device */}
                    <td style={{ padding: '11px 16px', fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                      {fmt(log.createdAt)}
                      {log.device && <div style={{ fontSize: 10, color: 'var(--text-3)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.device.split(' ').slice(0, 4).join(' ')}</div>}
                    </td>
                  </tr>

                  {/* Expanded diff row */}
                  {isExp && hasDiff && (
                    <tr key={`${log._id || i}-diff`} style={{ background: 'rgba(198,124,78,0.04)', borderTop: '1px solid var(--border)' }}>
                      <td colSpan={6} style={{ padding: '12px 20px' }}>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          {log.beforeValue && (
                            <div style={{ flex: 1, minWidth: 160 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', marginBottom: 5 }}>Before</div>
                              <pre style={{ margin: 0, padding: '8px 12px', background: 'rgba(239,68,68,0.06)', borderRadius: 7, fontSize: 11, color: 'var(--text-2)', border: '1px solid rgba(239,68,68,0.15)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{log.beforeValue}</pre>
                            </div>
                          )}
                          {log.afterValue && (
                            <div style={{ flex: 1, minWidth: 160 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', marginBottom: 5 }}>After</div>
                              <pre style={{ margin: 0, padding: '8px 12px', background: 'rgba(34,197,94,0.06)', borderRadius: 7, fontSize: 11, color: 'var(--text-2)', border: '1px solid rgba(34,197,94,0.15)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{log.afterValue}</pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4, marginTop: 14, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
          {paged.length === 0 ? 'No results' : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
        </span>
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-2)', cursor: page === 1 ? 'default' : 'pointer', fontSize: 12, opacity: page === 1 ? 0.5 : 1 }}>‹</button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 3, totalPages - 6));
              return start + i;
            }).map((n) => (
              <button key={n} onClick={() => setPage(n)} style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid var(--border)', background: n === page ? '#C67C4E' : 'var(--bg-card)', color: n === page ? '#fff' : 'var(--text-2)', cursor: 'pointer', fontSize: 12, fontWeight: n === page ? 700 : 400 }}>{n}</button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-2)', cursor: page === totalPages ? 'default' : 'pointer', fontSize: 12, opacity: page === totalPages ? 0.5 : 1 }}>›</button>
          </div>
        )}
      </div>
    </div>
  );
}

