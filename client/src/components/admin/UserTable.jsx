import { IconEdit, IconCheck, IconX, IconDownload, IconTrash } from './icons';
import { SkeletonTable, EmptyState, ErrorBanner } from './SkeletonLoader';

/* ── Role config ─────────────────────────────────────────── */
const ROLE_BADGE = {
  SuperAdmin:   { bg: 'rgba(198,124,78,0.14)',  color: '#C67C4E' },
  Admin:        { bg: 'rgba(167,139,250,0.14)', color: '#a78bfa' },
  SupportStaff: { bg: 'rgba(34,197,94,0.14)',   color: '#22c55e' },
};

// Canonical RBAC map — mirrors server/models/AdminUser.js
const ROLE_PERMISSIONS = {
  SuperAdmin:   ['manageTenants','manageSubscriptions','manageFeatureFlags','manageUsers','viewAnalytics','viewActivityLogs'],
  Admin:        ['manageTenants','manageSubscriptions','viewAnalytics'],
  SupportStaff: ['viewTenants','viewAnalytics'],
};

const PERM_ICONS = {
  manageTenants:       '🏪',
  manageSubscriptions: '💳',
  manageFeatureFlags:  '⚑',
  manageUsers:         '👤',
  viewAnalytics:       '📈',
  viewActivityLogs:    '📋',
  viewTenants:         '👁️',
};

const STATUS_STYLE = {
  Active:    { bg: 'rgba(34,197,94,0.12)',   color: '#22c55e' },
  Inactive:  { bg: 'rgba(107,114,128,0.12)', color: '#6b7280' },
  Suspended: { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
};

/* ── Helpers ─────────────────────────────────────────────── */
function Avatar({ name }) {
  const initials = (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #C67C4E, #E09A6E)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: 12,
    }}>
      {initials}
    </div>
  );
}

function relativeTime(ts) {
  if (!ts) return null;
  const diff = Date.now() - new Date(ts).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)   return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60)   return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30)   return `${d}d ago`;
  return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function csvExport(users) {
  const header = ['Name', 'Email', 'Role', 'Status', 'Permissions', 'Last Login', 'Last Active'];
  const rows = users.map((u) => [
    u.name, u.email, u.role,
    u.status || (u.isActive ? 'Active' : 'Inactive'),
    (ROLE_PERMISSIONS[u.role] || []).join('; '),
    u.lastLoginAt  ? new Date(u.lastLoginAt).toLocaleString()  : '',
    u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleString() : '',
  ]);
  const csv = [header, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'users.csv'; a.click();
  URL.revokeObjectURL(url);
}

/* ── Component ───────────────────────────────────────────── */
export default function UserTable({ users = [], loading, error, onToggle, onEdit, onDelete }) {
  const TH = ({ children, style = {} }) => (
    <th style={{
      padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)',
      background: 'var(--bg-hover)', borderBottom: '1px solid var(--border)',
      whiteSpace: 'nowrap', ...style,
    }}>
      {children}
    </th>
  );

  return (
    <div>
      {error && <ErrorBanner message={error} />}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          onClick={() => csvExport(users)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}
        >
          <IconDownload width={14} /> Export CSV
        </button>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
          <thead>
            <tr>
              <TH>User</TH>
              <TH>Role</TH>
              <TH>Permissions (RBAC)</TH>
              <TH>Status</TH>
              <TH>Last Login</TH>
              <TH>Last Active</TH>
              <TH style={{ textAlign: 'right' }}>Actions</TH>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTable rows={4} cols={7} />
            ) : users.length === 0 ? (
              <tr><td colSpan={7}><EmptyState icon="👤" title="No users yet" subtitle="Add your first admin user." /></td></tr>
            ) : users.map((u) => {
              const rb      = ROLE_BADGE[u.role] || ROLE_BADGE.SupportStaff;
              const status  = u.status || (u.isActive ? 'Active' : 'Inactive');
              const ss      = STATUS_STYLE[status] || STATUS_STYLE.Inactive;
              const perms   = ROLE_PERMISSIONS[u.role] || [];
              const loginTs = relativeTime(u.lastLoginAt);
              const activeTs= relativeTime(u.lastActiveAt);
              return (
                <tr
                  key={u._id}
                  style={{ borderTop: '1px solid var(--border)', transition: 'background 0.1s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* User */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={u.name} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-1)' }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Role badge */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ ...rb, padding: '3px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
                      {u.role}
                    </span>
                  </td>

                  {/* RBAC Permissions — read-only */}
                  <td style={{ padding: '12px 16px', maxWidth: 280 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {perms.map((p) => (
                        <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', background: 'var(--bg-hover)', borderRadius: 99, fontSize: 10, color: 'var(--text-2)', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                          {PERM_ICONS[p] || '•'} {p.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, ...ss }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: ss.color, flexShrink: 0 }} />
                      {status}
                    </span>
                  </td>

                  {/* Last Login */}
                  <td style={{ padding: '12px 16px', fontSize: 12 }}>
                    {loginTs
                      ? <><div style={{ color: 'var(--text-3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Login</div><div style={{ color: 'var(--text-2)', fontWeight: 500 }}>{loginTs}</div></>
                      : <span style={{ color: 'var(--text-3)', fontStyle: 'italic', fontSize: 11 }}>Never</span>}
                  </td>

                  {/* Last Active */}
                  <td style={{ padding: '12px 16px', fontSize: 12 }}>
                    {activeTs
                      ? <><div style={{ color: 'var(--text-3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Active</div><div style={{ color: 'var(--text-2)', fontWeight: 500 }}>{activeTs}</div></>
                      : <span style={{ color: 'var(--text-3)', fontStyle: 'italic', fontSize: 11 }}>Never</span>}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button onClick={() => onEdit(u)} title="Edit" style={{ padding: '5px 8px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: '#C67C4E', display: 'flex', alignItems: 'center' }}>
                        <IconEdit width={13} height={13} />
                      </button>
                      <button
                        onClick={() => onToggle(u._id, status)}
                        title={status === 'Active' ? 'Suspend' : 'Activate'}
                        style={{ padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', background: status === 'Active' ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', color: status === 'Active' ? '#ef4444' : '#22c55e' }}
                      >
                        {status === 'Active' ? <IconX width={13} height={13} /> : <IconCheck width={13} height={13} />}
                      </button>
                      {onDelete && (
                        <button onClick={() => onDelete(u._id, u.name)} title="Delete" style={{ padding: '5px 8px', background: 'rgba(239,68,68,0.08)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}>
                          <IconTrash width={13} height={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
