import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import UserTableComp from '../../components/admin/UserTable';
import { fetchUsers, createUser, updateUser, deleteUser } from '../../services/adminApi';
import { PageSpinner, ErrorBanner, EmptyState, Spinner } from '../../components/admin/SkeletonLoader';
import toast from 'react-hot-toast';

// Canonical RBAC permissions — mirrors the server model
const ROLE_PERMISSIONS = {
  SuperAdmin:   ['manageTenants','manageSubscriptions','manageFeatureFlags','manageUsers','viewAnalytics','viewActivityLogs'],
  Admin:        ['manageTenants','manageSubscriptions','viewAnalytics'],
  SupportStaff: ['viewTenants','viewAnalytics'],
};
const PERM_ICONS = {
  manageTenants:'🏪', manageSubscriptions:'💳', manageFeatureFlags:'⚑',
  manageUsers:'👤', viewAnalytics:'📈', viewActivityLogs:'📋', viewTenants:'👁️',
};

const emptyForm = { name: '', email: '', password: '', role: 'SupportStaff', status: 'Active' };
const inp = { width: '100%', background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-1)', padding: '10px 14px', borderRadius: 9, fontSize: 13, boxSizing: 'border-box', outline: 'none' };
const lbl = { fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 };

export default function UserManagement() {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(emptyForm);
  const [editId,   setEditId]   = useState(null);
  const [saving,   setSaving]   = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchUsers().then((r) => setUsers(r.data ?? [])).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  // Toggle status: Active ↔ Suspended
  const handleToggle = async (id, currentStatus) => {
    const next = currentStatus === 'Active' ? 'Suspended' : 'Active';
    try { await updateUser(id, { status: next }); toast.success(`User ${next.toLowerCase()}`); load(); } catch (e) { toast.error(e.message); }
  };

  const handleEdit = (user) => {
    setForm({ name: user.name, email: user.email, password: '', role: user.role, status: user.status || 'Active' });
    setEditId(user._id);
    setShowForm(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try { await deleteUser(id); toast.success('User deleted'); load(); } catch (e) { toast.error(e.message); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        const payload = { name: form.name, role: form.role, status: form.status };
        if (form.password) payload.password = form.password;
        await updateUser(editId, payload);
      } else {
        await createUser({ name: form.name, email: form.email, password: form.password, role: form.role });
      }
      setForm(emptyForm); setEditId(null); setShowForm(false); load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const permsPreview = ROLE_PERMISSIONS[form.role] || [];

  // Stats
  const activeCount    = users.filter((u) => (u.status || (u.isActive ? 'Active' : 'Inactive')) === 'Active').length;
  const suspendedCount = users.filter((u) => (u.status || '') === 'Suspended').length;

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 4px' }}>Users & Roles</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 14, margin: 0 }}>Role-based access control — permissions are derived automatically from role.</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(!showForm); }}
          style={{ padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, background: showForm ? 'var(--bg-hover)' : '#C67C4E', color: showForm ? 'var(--text-2)' : '#fff', border: showForm ? '1px solid var(--border)' : 'none', flexShrink: 0 }}
        >
          {showForm ? '✕ Cancel' : '+ Add User'}
        </button>
      </div>

      {/* Stats */}
      {!loading && users.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Users',    value: users.length,    color: 'var(--text-2)', bg: 'var(--bg-hover)' },
            { label: 'Active',         value: activeCount,     color: '#22c55e',       bg: 'rgba(34,197,94,0.1)' },
            { label: 'Suspended',      value: suspendedCount,  color: '#ef4444',       bg: 'rgba(239,68,68,0.1)' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ background: bg, borderRadius: 10, padding: '10px 18px', textAlign: 'center', minWidth: 100 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* RBAC reference card */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 10 }}>🔐 Role Permission Matrix</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
          {Object.entries(ROLE_PERMISSIONS).map(([role, perms]) => (
            <div key={role} style={{ flex: '1 1 180px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#C67C4E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{role}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {perms.map((p) => (
                  <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', background: 'var(--bg-hover)', borderRadius: 99, fontSize: 10, color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                    {PERM_ICONS[p]} {p.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 18 }}>{editId ? 'Edit User' : 'New Admin User'}</div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 14 }}>
              <div><label style={lbl}>Name</label><input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inp} /></div>
              {!editId && <div><label style={lbl}>Email</label><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inp} /></div>}
              <div>
                <label style={lbl}>Password{editId && ' (leave blank to keep)'}</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={inp} required={!editId} />
              </div>
              <div>
                <label style={lbl}>Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={inp}>
                  {['SuperAdmin','Admin','SupportStaff'].map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {editId && (
                <div>
                  <label style={lbl}>Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={inp}>
                    {['Active','Inactive','Suspended'].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* RBAC permissions preview — read-only */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ ...lbl, marginBottom: 8 }}>Permissions (auto-assigned for {form.role})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {permsPreview.map((p) => (
                  <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'rgba(198,124,78,0.1)', border: '1px solid rgba(198,124,78,0.25)', borderRadius: 8, fontSize: 12, color: '#C67C4E', fontWeight: 500 }}>
                    {PERM_ICONS[p]} {p.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                ))}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '7px 0 0' }}>Permissions cannot be manually edited — they are derived from the selected role.</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '9px 18px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-2)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ padding: '9px 18px', borderRadius: 9, border: 'none', background: '#C67C4E', color: '#fff', cursor: saving ? 'default' : 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1 }}>
                {saving ? <><Spinner size={14} /> Saving…</> : editId ? 'Update User' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <PageSpinner />}
      {error && <ErrorBanner message={error} />}
      {!loading && !error && users.length === 0 && <EmptyState icon="👤" title="No users yet" subtitle="Add your first admin user." />}
      {!loading && !error && users.length > 0 && (
        <UserTableComp
          users={users}
          loading={false}
          error={null}
          onToggle={handleToggle}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </AdminLayout>
  );
}
