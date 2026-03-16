import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import FeatureToggleComp from '../../components/admin/FeatureToggle';
import { fetchFeatures, fetchPlans, fetchTenants } from '../../services/adminApi';
import { PageSpinner, ErrorBanner, EmptyState } from '../../components/admin/SkeletonLoader';

export default function FeatureFlags() {
  const [features, setFeatures]     = useState([]);
  const [plans,    setPlans]        = useState([]);
  const [tenants,  setTenants]      = useState([]);
  const [loading,  setLoading]      = useState(true);
  const [error,    setError]        = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([fetchFeatures(), fetchPlans(), fetchTenants()])
      .then(([fRes, pRes, tRes]) => {
        setFeatures(fRes.data ?? []);
        setPlans((pRes.data ?? []).map((p) => p.planName));
        setTenants(tRes.data ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = (updated) => {
    setFeatures((prev) => prev.map((f) => (f._id === updated._id ? updated : f)));
    load();
  };

  // Stats
  const globalCount   = features.filter((f) => f.globalEnabled).length;
  const planScoped    = features.filter((f) => !f.globalEnabled && (f.plansEnabled?.length || 0) > 0).length;
  const overridedOnly = features.filter((f) => !f.globalEnabled && !(f.plansEnabled?.length) && (f.tenantOverrides?.length || 0) > 0).length;
  const offCount      = features.filter((f) => !f.globalEnabled && !(f.plansEnabled?.length) && !(f.tenantOverrides?.length)).length;

  return (
    <AdminLayout>
      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 4px' }}>Feature Flags</h1>
        <p style={{ color: 'var(--text-3)', fontSize: 14, margin: 0 }}>
          Control feature access by scope — globally, by plan, or per-tenant overrides.
        </p>
      </div>

      {/* ── Stats strip ── */}
      {!loading && features.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Features',    value: features.length, color: 'var(--text-2)', bg: 'var(--bg-hover)' },
            { label: 'Global',            value: globalCount,     color: '#C67C4E',       bg: 'rgba(198,124,78,0.1)' },
            { label: 'Plan-Scoped',       value: planScoped,      color: '#22c55e',       bg: 'rgba(34,197,94,0.1)'  },
            { label: 'Override Only',     value: overridedOnly,   color: '#8b5cf6',       bg: 'rgba(139,92,246,0.1)' },
            { label: 'Off / Unscoped',    value: offCount,        color: 'var(--text-3)', bg: 'var(--bg-hover)'      },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ background: bg, borderRadius: 10, padding: '10px 18px', textAlign: 'center', minWidth: 110 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {loading && <PageSpinner />}
      {error && <ErrorBanner message={error} />}

      {!loading && !error && features.length === 0 && (
        <EmptyState icon="⚑" title="No feature flags" subtitle="Feature flags will appear here once created." />
      )}

      {/* ── Feature list ── */}
      {!loading && features.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'visible' }}>
          {/* Column headers */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '10px 20px 10px 76px',
            borderBottom: '1px solid var(--border)', background: 'var(--bg-hover)',
            borderRadius: '14px 14px 0 0',
          }}>
            <div style={{ flex: 1, fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Feature / Scope
            </div>
            <div style={{ minWidth: 56, textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Tenants
            </div>
            <div style={{ width: 60, textAlign: 'right', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Global
            </div>
            <div style={{ width: 20 }} />
          </div>

          {features.map((feature) => (
            <FeatureToggleComp
              key={feature._id}
              feature={feature}
              availablePlans={plans}
              allTenants={tenants}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}

      {/* Resolution legend */}
      {!loading && (
        <div style={{ marginTop: 24, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 12 }}>⚡ Feature Resolution Order</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[
              ['1', '🌍 Global enabled',    '#C67C4E', 'Feature is active for every tenant.'],
              ['2', '🎯 Tenant override',   '#8b5cf6', 'Tenant is individually overridden.'],
              ['3', '📋 Plan match',        '#22c55e', "Tenant's plan is in the plan access list."],
              ['4', '✗  Otherwise',         '#ef4444', 'Feature is disabled for the tenant.'],
            ].map(([num, label, color, desc]) => (
              <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: `${color}22`, color, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{num}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 140 }}>{label}</span>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
