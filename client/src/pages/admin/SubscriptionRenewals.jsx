import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { fetchTenants, fetchInvoices } from '../../services/adminApi';
import { PageSpinner, ErrorBanner, EmptyState } from '../../components/admin/SkeletonLoader';

export default function SubscriptionRenewals() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchTenants({ limit: 1000 }), fetchInvoices({ limit: 500, page: 1 })])
      .then(([tRes, iRes]) => {
        setTenants(tRes.data ?? []);
        setInvoices(iRes.data ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const now = Date.now();
  const latestInvoiceByTenant = new Map();
  [...invoices]
    .sort((a, b) => new Date(b.billingDate).getTime() - new Date(a.billingDate).getTime())
    .forEach((inv) => {
      if (!latestInvoiceByTenant.has(String(inv.tenantId))) {
        latestInvoiceByTenant.set(String(inv.tenantId), inv);
      }
    });

  const expiringSoon = tenants
    .filter((t) => t.status === 'Active')
    .filter((t) => t.planExpiryDate)
    .map((t) => ({ ...t, daysLeft: Math.ceil((new Date(t.planExpiryDate).getTime() - now) / 86400000) }))
    .filter((t) => t.daysLeft >= 0 && t.daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const shortDate = (v) => (v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—');
  const initials = (name = '') => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 4px' }}>Upcoming Renewals</h1>
          <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Next 30 days · {expiringSoon.length} total</div>
        </div>
        <button
          onClick={() => navigate('/admin/subscriptions')}
          style={{
            padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
            background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer',
          }}
        >
          Back to Subscriptions
        </button>
      </div>

      {loading && <PageSpinner />}
      {error && <ErrorBanner message={error} />}

      {!loading && !error && expiringSoon.length === 0 && (
        <EmptyState icon="⏱" title="No renewals in the next 30 days" subtitle="You’re all clear for now." />
      )}

      {!loading && !error && expiringSoon.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {expiringSoon.map((t) => {
              const method = latestInvoiceByTenant.get(String(t._id))?.paymentMethod || '';
              const badge = method ? (method === 'Card' ? 'Auto' : 'Manual') : '—';
              return (
                <div key={t._id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 14, alignItems: 'center' }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, background: 'var(--bg-hover)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-1)',
                  }}>
                    {initials(t.cafeName)}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{t.cafeName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{t.subscriptionPlan} · {shortDate(t.planExpiryDate)}</div>
                  </div>
                  <div style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999,
                    background: 'var(--bg-hover)', color: 'var(--text-2)', border: '1px solid var(--border)',
                    textAlign: 'center',
                  }}>
                    {badge}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: t.daysLeft <= 3 ? '#ef4444' : 'var(--text-2)' }}>
                    {t.daysLeft}d
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

