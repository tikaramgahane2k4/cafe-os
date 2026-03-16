import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import AnalyticsChart from '../../components/admin/AnalyticsChart';
import { fetchInvoices, fetchBillingSummary, seedInvoices } from '../../services/adminApi';
import { PageSpinner, ErrorBanner, EmptyState } from '../../components/admin/SkeletonLoader';
import toast from 'react-hot-toast';

export default function BillingHistory() {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([fetchInvoices({ limit: 300, page: 1 }), fetchBillingSummary()])
      .then(([inv, sum]) => {
        setInvoices(inv.data || []);
        setSummary(sum.data || null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const statusStyle = {
    Paid: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
    Pending: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    Overdue: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
    Failed: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
  };

  const createSeed = async () => {
    try {
      const res = await seedInvoices();
      toast.success(res?.seeded ? `Seeded ${res.seeded} invoices` : 'Billing seed already present');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 4px' }}>Billing History</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 14, margin: 0 }}>Invoices, payment status, MRR and revenue by plan.</p>
        </div>
        <button onClick={createSeed} className="btn-ghost" style={{ padding: '8px 14px' }}>Seed Demo Invoices</button>
      </div>

      {loading && <PageSpinner />}
      {error && <ErrorBanner message={error} />}

      {!loading && !error && !summary && <EmptyState icon="🧾" title="No billing summary" subtitle="No billing data available." />}

      {!loading && !error && summary && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12, marginBottom: 20 }}>
            <div className="saas-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase' }}>Total MRR</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#C67C4E' }}>₹{(summary.mrr || 0).toLocaleString('en-IN')}</div>
            </div>
            {summary.revenueByPlan?.slice(0, 3).map((p) => (
              <div key={p.plan} className="saas-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase' }}>{p.plan}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)' }}>₹{p.revenue.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.activeTenants} active tenants</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 22 }}>
            <AnalyticsChart type="line" data={summary.trend || []} dataKey="revenue" xKey="month" title="Revenue trend" subtitle="Trailing 6 months" color="#C67C4E" valuePrefix="₹" />
          </div>

          {invoices.length === 0 ? <EmptyState icon="🧾" title="No invoices" subtitle="Create or seed invoices to view history." /> : (
            <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
                <thead>
                  <tr>
                    {['Invoice', 'Tenant', 'Plan', 'Amount', 'Status', 'Billing Date', 'Payment Method', 'Next Billing'].map((h) => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', background: 'var(--bg-hover)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => {
                    const s = statusStyle[inv.status] || statusStyle.Pending;
                    return (
                      <tr key={inv._id} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#C67C4E' }}>{inv.invoiceNumber}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-1)' }}>{inv.tenantName}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-2)' }}>{inv.planName}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-1)', fontWeight: 700 }}>₹{inv.amount.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '10px 12px' }}><span style={{ padding: '3px 10px', borderRadius: 99, background: s.bg, color: s.color, fontSize: 11, fontWeight: 700 }}>{inv.status}</span></td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-2)' }}>{new Date(inv.billingDate).toLocaleDateString('en-IN')}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-2)' }}>{inv.paymentMethod}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-2)' }}>{inv.nextBillingDate ? new Date(inv.nextBillingDate).toLocaleDateString('en-IN') : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
