import { useState, useRef } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import TenantTableComp from '../../components/admin/TenantTable';
import { createTenant } from '../../services/adminApi';
import { Spinner } from '../../components/admin/SkeletonLoader';

const EMPTY = {
  cafeName: '', ownerName: '', email: '', phone: '',
  subscriptionPlan: 'Free', status: 'Active',
};
const PLAN_DESC = {
  Free:       '100 orders / month',
  Starter:    '500 orders / month · ₹999',
  Growth:     '2,000 orders / month · ₹2,499',
  Pro:        '2,000 orders / month · ₹5,000',
  Enterprise: '10,000 orders / month · ₹5,999',
};
const inp = {
  width: '100%', background: 'var(--bg-base)', border: '1px solid var(--border)',
  color: 'var(--text-1)', padding: '9px 12px', borderRadius: 8, fontSize: 13,
  boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.15s',
};

/* ── Credential box shown after successful creation ─────── */
function CredBox({ creds, onClose }) {
  const [copied, setCopied] = useState(null);
  const copy = (key, val) => {
    navigator.clipboard.writeText(val).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    });
  };
  const Row = ({ label, value, field }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(198,124,78,0.15)' }}>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(198,124,78,0.7)', marginBottom: 2 }}>{label}</div>
        <code style={{ fontSize: 13, color: '#C67C4E', fontWeight: 600 }}>{value}</code>
      </div>
      <button onClick={() => copy(field, value)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(198,124,78,0.4)', background: 'rgba(198,124,78,0.08)', color: '#C67C4E', cursor: 'pointer', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
        {copied === field ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  );
  return (
    <div style={{ background: 'rgba(198,124,78,0.06)', border: '1px solid rgba(198,124,78,0.3)', borderRadius: 14, padding: 20, marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#C67C4E' }}>✅ Tenant Created Successfully</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>Save these credentials — the password cannot be recovered later.</div>
        </div>
        <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 18, lineHeight: 1 }}>✕</button>
      </div>
      <Row label="Tenant ID"      value={creds.tenantId}    field="tenantId" />
      <Row label="Admin Email"    value={creds.adminEmail}  field="adminEmail" />
      <Row label="Temp Password"  value={creds.tempPassword} field="tempPassword" />
      <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(245,158,11,0.08)', borderRadius: 8, fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>
        ⚠ Share these credentials securely with the café owner. Instruct them to change the password on first login.
      </div>
    </div>
  );
}

/* ═══ TenantManagement page ══════════════════════════════ */
export default function TenantManagement() {
  const [showForm,    setShowForm]    = useState(false);
  const [form,        setForm]        = useState(EMPTY);
  const [saving,      setSaving]      = useState(false);
  const [formError,   setFormError]   = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [refreshKey,  setRefreshKey]  = useState(0);
  const tableRef = useRef(null);

  const set    = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const cancel = () => { setShowForm(false); setFormError(null); setForm(EMPTY); };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    setCredentials(null);
    try {
      const res = await createTenant(form);
      setCredentials(res.credentials);
      setForm(EMPTY);
      setShowForm(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /* label helper */
  const Label = ({ children }) => (
    <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', display: 'block', marginBottom: 5 }}>
      {children}
    </label>
  );

  return (
    <AdminLayout>
      {/* ── Page header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 4px' }}>Tenant Management</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 14, margin: 0 }}>Lifecycle management for all café tenants on the platform.</p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setFormError(null); }}
          style={{ padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, transition: 'all 0.15s', background: showForm ? 'var(--bg-hover)' : '#C67C4E', color: showForm ? 'var(--text-2)' : '#fff', border: showForm ? '1px solid var(--border)' : 'none', whiteSpace: 'nowrap' }}
        >
          {showForm ? '✕ Cancel' : '+ Add Café'}
        </button>
      </div>

      {/* ── Credentials box ── */}
      {credentials && <CredBox creds={credentials} onClose={() => setCredentials(null)} />}

      {/* ── Create form ── */}
      {showForm && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 24, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)', marginBottom: 4 }}>New Café Tenant</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20 }}>
            Tenant ID, admin email and temporary password will be generated automatically.
          </div>

          <form onSubmit={handleCreate}>
            {/* Row 1: café info */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 14 }}>
              <div>
                <Label>Café Name *</Label>
                <input required value={form.cafeName} onChange={(e) => set('cafeName', e.target.value)} style={inp} placeholder="e.g. Morning Hub" />
              </div>
              <div>
                <Label>Owner Name *</Label>
                <input required value={form.ownerName} onChange={(e) => set('ownerName', e.target.value)} style={inp} placeholder="e.g. Rahul Sharma" />
              </div>
              <div>
                <Label>Owner Email *</Label>
                <input required type="email" value={form.email} onChange={(e) => set('email', e.target.value)} style={inp} placeholder="e.g. rahul@morninghub.com" />
              </div>
              <div>
                <Label>Phone</Label>
                <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} style={inp} placeholder="+91 98765 43210" />
              </div>
            </div>

            {/* Row 2: plan + status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div>
                <Label>Subscription Plan</Label>
                <select value={form.subscriptionPlan} onChange={(e) => set('subscriptionPlan', e.target.value)} style={{ ...inp }}>
                  {['Free','Starter','Growth','Pro','Enterprise'].map((p) => <option key={p}>{p}</option>)}
                </select>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                  {PLAN_DESC[form.subscriptionPlan]}
                </div>
              </div>
              <div>
                <Label>Initial Status</Label>
                <select value={form.status} onChange={(e) => set('status', e.target.value)} style={{ ...inp }}>
                  {['Active','Suspended'].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Error */}
            {formError && (
              <div style={{ marginBottom: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 9, fontSize: 13, color: '#ef4444', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span>⚠</span><span>{formError}</span>
              </div>
            )}

            {/* Auto-gen preview */}
            <div style={{ padding: '10px 14px', background: 'var(--bg-hover)', borderRadius: 9, fontSize: 12, color: 'var(--text-3)', marginBottom: 16, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <span>🔑 Tenant ID: <strong>auto-generated</strong></span>
              <span>✉ Admin email: <strong>{form.cafeName ? `admin@${form.cafeName.toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,20)}.com` : 'auto-generated'}</strong></span>
              <span>🔒 Password: <strong>auto-generated</strong></span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" onClick={cancel} style={{ padding: '9px 18px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-2)', cursor: 'pointer', fontWeight: 600 }}>
                Cancel
              </button>
              <button type="submit" disabled={saving} style={{ padding: '9px 22px', borderRadius: 9, border: 'none', background: '#C67C4E', color: '#fff', cursor: saving ? 'default' : 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.75 : 1 }}>
                {saving ? <><Spinner size={14} /> Creating…</> : '+ Create Tenant'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Table ── */}
      <div ref={tableRef}>
        <TenantTableComp key={refreshKey} />
      </div>
    </AdminLayout>
  );
}
