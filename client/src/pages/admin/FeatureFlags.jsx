import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import FeatureToggleComp from '../../components/admin/FeatureToggle';
import { ErrorBanner, PageSpinner } from '../../components/admin/SkeletonLoader';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import MetricCard from '../../components/ui/MetricCard';
import { fetchFeatures, fetchPlans } from '../../services/adminApi';

const ENVIRONMENTS = [
  { key: 'dev', label: 'Dev' },
  { key: 'staging', label: 'Staging' },
  { key: 'production', label: 'Production' },
];

const FEATURE_FLAG_PLAN_LABELS = ['Starter', 'Pro', 'Elite'];
const FEATURE_FLAG_PLAN_MAP = {
  Free: 'Starter',
  Starter: 'Starter',
  Growth: 'Pro',
  Pro: 'Pro',
  Enterprise: 'Elite',
  Elite: 'Elite',
};

function normalizeFeatureFlagPlan(planName = '') {
  return FEATURE_FLAG_PLAN_MAP[String(planName || '').trim()] || String(planName || '').trim();
}

export default function FeatureFlags() {
  const [features, setFeatures] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [environment, setEnvironment] = useState('production');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [featureResponse, planResponse] = await Promise.all([
        fetchFeatures({ environment }),
        fetchPlans(),
      ]);

      setFeatures(featureResponse.data || []);
      const normalizedPlans = [...new Set(
        (planResponse.data || [])
          .map((plan) => normalizeFeatureFlagPlan(plan.planName))
          .filter((planName) => FEATURE_FLAG_PLAN_LABELS.includes(planName)),
      )];
      setPlans(normalizedPlans.length ? normalizedPlans : FEATURE_FLAG_PLAN_LABELS);
    } catch (fetchError) {
      console.error('[FeatureFlags] Failed to load features', fetchError);
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }, [environment]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpdate = (updatedFeature) => {
    setFeatures((current) => current.map((feature) => (
      feature._id === updatedFeature._id ? updatedFeature : feature
    )));
  };

  const stats = useMemo(() => ({
    total: features.length,
    active: features.filter((feature) => feature.status === 'active').length,
    partial: features.filter((feature) => feature.status === 'partial').length,
    disabled: features.filter((feature) => feature.status === 'disabled').length,
    blocked: features.filter((feature) => feature.blockedByDependencies).length,
  }), [features]);

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="Release Control"
        title="Feature flags"
        subtitle="Safe, environment-aware flag management with rollout controls, live impact visibility, dependency guards, and tenant-level overrides."
        actions={(
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ENVIRONMENTS.map((item) => (
              <Button
                key={item.key}
                variant={environment === item.key ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setEnvironment(item.key)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        )}
      />

      {loading ? <PageSpinner message="Loading feature control system..." /> : null}
      {error ? <ErrorBanner message={error} /> : null}

      {!loading && !error ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 20 }}>
            <MetricCard label="Total flags" value={stats.total} subtitle={`Flags configured for ${environment}`} accent="#C67C4E" icon="⚑" />
            <MetricCard label="Active" value={stats.active} subtitle="Fully enabled with 100% rollout" accent="#22c55e" icon="✅" />
            <MetricCard label="Partial" value={stats.partial} subtitle="Gradual rollouts in progress" accent="#f59e0b" icon="📊" />
            <MetricCard label="Disabled" value={stats.disabled} subtitle="No tenant currently receives the feature" accent="#94a3b8" icon="⏸" />
          </div>

          <Card
            title="Environment-aware feature catalog"
            subtitle={`Each environment keeps its own rollout state, impact surface, metadata, and dependency safety checks. Currently viewing ${environment}.`}
            actions={<Button variant="ghost" size="sm" onClick={load}>Refresh</Button>}
          >
            {features.length ? (
              <div style={{ border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', background: 'var(--bg-card)' }}>
                {features.map((feature) => (
                  <FeatureToggleComp
                    key={feature._id}
                    feature={feature}
                    availablePlans={plans}
                    environment={environment}
                    onUpdate={handleUpdate}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon="⚑"
                title="No feature flags available"
                subtitle="The feature catalog will appear here once the backend has seeded feature definitions."
              />
            )}
          </Card>

          <Card title="Resolution model" subtitle="How feature delivery is evaluated for a tenant in the selected environment." style={{ marginTop: 20 }}>
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                '1. Scope decides eligibility: global, matching plan, or tenant override.',
                '2. Rollout percentage determines which eligible tenants are actually included.',
                '3. Dependencies must be enabled before a blocked feature can be rolled out.',
                '4. Metadata and notifications capture who changed the flag and where.',
              ].map((line) => (
                <div key={line} style={{ fontSize: 13, color: 'var(--text-2)' }}>{line}</div>
              ))}
            </div>
          </Card>
        </>
      ) : null}
    </AdminLayout>
  );
}
