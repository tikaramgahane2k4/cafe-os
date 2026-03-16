import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchTenants, updateTenantStatus, deleteTenant } from '../../services/adminApi';
import { SkeletonTable, EmptyState, ErrorBanner } from './SkeletonLoader';
import toast from 'react-hot-toast';
import {
  IconSearch, IconFilter, IconDownload, IconEdit, IconTrash, IconCheck, IconX,
  IconSortAsc, IconSortDesc, IconRefresh,
} from './icons';

/* ── helpers ────────────────────────────────────────────── */
const STATUS_STYLE = {
  Active:    { bg: 'rgba(34,197,94,0.12)',   color: '#22c55e',  dot: '#22c55e'  },
  Suspended: { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b',  dot: '#f59e0b'  },
  Expired:   { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444',  dot: '#ef4444'  },
};
const PLAN_STYLE = {
  Free:       { bg: 'rgba(156,122,96,0.12)', color: '#9C7A60' },
  Starter:    { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
  Pro:        { bg: 'rgba(167,139,250,0.12)',color: '#a78bfa' },
  Enterprise: { bg: 'rgba(198,124,78,0.12)', color: '#C67C4E' },
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function timeAgo(d) {
  if (!d) return 'Never';
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}
function isExpiringSoon(expiry) {
  if (!expiry) return false;
  const diff = new Date(expiry) - Date.now();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

/* ── Usage bar ──────────────────────────────────────────── */
function UsageBar({ used = 0, limit = 100 }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const barColor = pct >= 90 ? '#ef4444' : pct >= 60 ? '#f59e0b' : '#22c55e';
  return (
    <div style={{ minWidth: 120 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>
        <span>{used.toLocaleString()} / {limit.toLocaleString()}</span>
        <span style={{ color: barColor, fontWeight: 700 }}>{pct}%</span>
      </div>
      <div style={{ height: 5, background: 'var(--bg-hover)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 99, transition: 'width 0.4s' }} />
      </div>
    </div>
  );
}

/* ── Badge ──────────────────────────────────────────────── */
function Badge({ text, style: s, dot }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700, ...s }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: dot, flexShrink: 0 }} />}
      {text}
    </span>
  );
}

/* ── Sort header cell ───────────────────────────────────── */
function SortTH({ label, field, sortField, sortOrder, onSort, style = {} }) {
  const active = sortField === field;
  return (
    <th
      onClick={() => onSort(field)}
      style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: active ? '#C67C4E' : 'var(--text-3)', background: 'var(--bg-hover)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none', ...style }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        {active ? (sortOrder === 'asc' ? <IconSortAsc size={12} /> : <IconSortDesc size={12} />) : <span style={{ opacity: 0.3 }}><IconSortAsc size={12} /></span>}
      </span>
    </th>
  );
}

/* ── CSV export ─────────────────────────────────────────── */
function csvExport(tenants) {
  const header = ['Tenant ID','Café','Owner','Email','Phone','Plan','Start Date','Expiry','Orders Used','Limit','Usage%','Last Active','Status'];
  const rows = tenants.map((t) => {
    const pct = t.orderLimit > 0 ? Math.round((t.ordersUsed / t.orderLimit) * 100) : 0;
    return [t.tenantId||'',t.cafeName,t.ownerName,t.email,t.phone||'',t.subscriptionPlan,fmtDate(t.subscriptionStartDate),fmtDate(t.planExpiryDate),t.ordersUsed||0,t.orderLimit||0,`${pct}%`,t.lastActiveAt?new Date(t.lastActiveAt).toISOString():'Never',t.status];
  });
  const csv = [header,...rows].map((r)=>r.map((c)=>`"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv],{type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='tenants.csv'; a.click();
  URL.revokeObjectURL(url);
}

/* ══════════════════════════════════════════════════════════ */
export default function TenantTable({ onEdit }) {
  const [tenants,     setTenants]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [search,      setSearch]      = useState('');
  const [statusFilter,setStatusFilter]= useState('ALL');
  const [sortField,   setSortField]   = useState('createdAt');
  const [sortOrder,   setSortOrder]   = useState('desc');
  const [page,        setPage]        = useState(1);
  const [pageSize,    setPageSize]    = useState(10);
  const [total,       setTotal]       = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  // Inline status editing
  const [editId,      setEditId]      = useState(null);
  const [editStatus,  setEditStatus]  = useState('');
  const [saving,      setSaving]      = useState(false);
  const debounceRef = useRef(null);

  const load = useCallback((params = {}) => {
    setLoading(true);
    fetchTenants({
      search: params.search   ?? search,
      status: (params.status  ?? statusFilter) === 'ALL' ? '' : (params.status ?? statusFilter),
      sort:   params.sort     ?? sortField,
      order:  params.order    ?? sortOrder,
      page:   params.page     ?? page,
      limit:  params.limit    ?? pageSize,
    })
      .then((res) => {
        setTenants(res.data || []);
        setTotal(res.total || 0);
        setTotalPages(res.pages || 1);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [search, statusFilter, sortField, sortOrder, page, pageSize]);

  useEffect(() => { load(); }, []);

  // Debounced search
  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load({ search: val, page: 1 }), 350);
  };

  const handleFilter = (val) => { setStatusFilter(val); setPage(1); load({ status: val, page: 1 }); };
  const handleSort   = (field) => {
    const order = sortField === field && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortField(field); setSortOrder(order); setPage(1); load({ sort: field, order, page: 1 });
  };
  const handlePage   = (p) => { setPage(p); load({ page: p }); };
  const handleSize   = (s) => { setPageSize(Number(s)); setPage(1); load({ limit: Number(s), page: 1 }); };

  const startEdit   = (t) => { setEditId(t._id); setEditStatus(t.status); };
  const cancelEdit  = ()  => { setEditId(null); };
  const saveStatus  = async (id) => {
    setSaving(true);
    try {
      await updateTenantStatus(id, editStatus);
      toast.success(`Tenant ${editStatus.toLowerCase()}`);
      setEditId(null);
      load();
    } catch (e) { setError(e.message); toast.error(e.message); }
    finally { setSaving(false); }
  };
  const handleDelete = async (t) => {
    if (!confirm(`Delete "${t.cafeName}"? This cannot be undone.`)) return;
    try { await deleteTenant(t._id); toast.success('Tenant deleted'); load(); }
    catch (e) { setError(e.message); toast.error(e.message); }
  };

  const TH = ({ children, style: s = {} }) => (
    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', background: 'var(--bg-hover)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', ...s }}>
      {children}
    </th>
  );

  return (
    <div>
      {error && <ErrorBanner message={error} />}

      {/* ── Controls bar ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
          <IconSearch size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
          <input
            value={search} onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by café, owner, email…"
            style={{ width: '100%', paddingLeft: 30, padding: '7px 12px 7px 30px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-1)', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Status filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <IconFilter size={13} style={{ color: 'var(--text-3)' }} />
          <select
            value={statusFilter} onChange={(e) => handleFilter(e.target.value)}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-2)', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}
          >
            {['ALL','Active','Suspended','Expired'].map((s) => <option key={s} value={s}>{s === 'ALL' ? 'All Status' : s}</option>)}
          </select>
        </div>

        {/* Page size */}
        <select
          value={pageSize} onChange={(e) => handleSize(e.target.value)}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-2)', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}
        >
          {[10, 25, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
        </select>

        <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 'auto' }}>{total} tenant{total !== 1 ? 's' : ''}</span>

        <button onClick={() => load()} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 12, color: 'var(--text-2)' }}>
          <IconRefresh size={13} /> Refresh
        </button>
        <button onClick={() => csvExport(tenants)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 12, color: 'var(--text-2)' }}>
          <IconDownload size={13} /> Export
        </button>
      </div>

      {/* ── Table ── */}
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
          <thead>
            <tr>
              <TH>Café</TH>
              <TH>Owner / Email</TH>
              <TH>Plan</TH>
              <SortTH label="Start Date"  field="createdAt"      sortField={sortField} sortOrder={sortOrder} onSort={handleSort} />
              <SortTH label="Expiry"      field="planExpiryDate" sortField={sortField} sortOrder={sortOrder} onSort={handleSort} />
              <SortTH label="Usage"       field="usage"          sortField={sortField} sortOrder={sortOrder} onSort={handleSort} />
              <TH>Last Active</TH>
              <TH>Status</TH>
              <TH style={{ textAlign: 'right' }}>Actions</TH>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTable rows={pageSize > 10 ? 8 : 5} cols={9} />
            ) : tenants.length === 0 ? (
              <tr><td colSpan={9}>
                <EmptyState icon="🏪" title="No tenants found" subtitle="Try adjusting your search or filters." />
              </td></tr>
            ) : tenants.map((t, i) => {
              const ss  = STATUS_STYLE[t.status] || STATUS_STYLE.Active;
              const ps  = PLAN_STYLE[t.subscriptionPlan] || PLAN_STYLE.Free;
              const expiring = isExpiringSoon(t.planExpiryDate);
              return (
                <tr
                  key={t._id}
                  style={{ borderTop: '1px solid var(--border)', transition: 'background 0.1s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Café name + tenantId */}
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#C67C4E,#E09A6E)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                        {(t.cafeName || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{t.cafeName}</div>
                        {t.tenantId && <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'monospace', marginTop: 1 }}>{t.tenantId}</div>}
                      </div>
                    </div>
                  </td>

                  {/* Owner + email */}
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: 13, color: 'var(--text-1)' }}>{t.ownerName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{t.email}</div>
                    {t.phone && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.phone}</div>}
                  </td>

                  {/* Plan badge */}
                  <td style={{ padding: '12px 14px' }}>
                    <Badge text={t.subscriptionPlan} style={{ background: ps.bg, color: ps.color }} />
                  </td>

                  {/* Start date */}
                  <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
                    {fmtDate(t.subscriptionStartDate || t.createdAt)}
                  </td>

                  {/* Expiry date */}
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: 12, color: expiring ? '#f59e0b' : 'var(--text-2)', fontWeight: expiring ? 700 : 400 }}>
                      {fmtDate(t.planExpiryDate)}
                    </span>
                    {expiring && <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 1 }}>⚠ Expiring soon</div>}
                  </td>

                  {/* Usage bar */}
                  <td style={{ padding: '12px 14px' }}>
                    <UsageBar used={t.ordersUsed || 0} limit={t.orderLimit || 100} />
                  </td>

                  {/* Last active */}
                  <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                    {timeAgo(t.lastActiveAt)}
                  </td>

                  {/* Status (inline edit) */}
                  <td style={{ padding: '12px 14px' }}>
                    {editId === t._id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-2)', borderRadius: 6, padding: '4px 6px', fontSize: 11 }}>
                          {['Active','Suspended','Expired'].map((s) => <option key={s}>{s}</option>)}
                        </select>
                        <button onClick={() => saveStatus(t._id)} disabled={saving} style={{ border: 'none', background: '#22c55e', color: '#fff', borderRadius: 6, padding: '4px 7px', cursor: 'pointer' }}>
                          <IconCheck size={11} />
                        </button>
                        <button onClick={cancelEdit} style={{ border: 'none', background: 'var(--bg-hover)', color: 'var(--text-2)', borderRadius: 6, padding: '4px 7px', cursor: 'pointer' }}>
                          <IconX size={11} />
                        </button>
                      </div>
                    ) : (
                      <Badge text={t.status} style={{ background: ss.bg, color: ss.color }} dot={ss.dot} />
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      {onEdit && (
                        <button onClick={() => onEdit(t)} title="Edit"
                          style={{ padding: '5px 7px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-2)', cursor: 'pointer' }}>
                          <IconEdit size={13} />
                        </button>
                      )}
                      <button onClick={() => startEdit(t)} title="Change status"
                        style={{ padding: '5px 7px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-2)', cursor: 'pointer' }}>
                        ⇄
                      </button>
                      <button onClick={() => handleDelete(t)} title="Delete"
                        style={{ padding: '5px 7px', borderRadius: 7, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', color: '#ef4444', cursor: 'pointer' }}>
                        <IconTrash size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
          {tenants.length === 0 ? 'No results' : `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}
        </span>
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => handlePage(Math.max(1, page - 1))} disabled={page === 1} style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-2)', cursor: page === 1 ? 'default' : 'pointer', fontSize: 12, opacity: page === 1 ? 0.5 : 1 }}>‹</button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 3, totalPages - 6));
              return start + i;
            }).map((n) => (
              <button key={n} onClick={() => handlePage(n)} style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid var(--border)', background: n === page ? '#C67C4E' : 'var(--bg-card)', color: n === page ? '#fff' : 'var(--text-2)', cursor: 'pointer', fontSize: 12, fontWeight: n === page ? 700 : 400 }}>{n}</button>
            ))}
            <button onClick={() => handlePage(Math.min(totalPages, page + 1))} disabled={page === totalPages} style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-2)', cursor: page === totalPages ? 'default' : 'pointer', fontSize: 12, opacity: page === totalPages ? 0.5 : 1 }}>›</button>
          </div>
        )}
      </div>
    </div>
  );
}
