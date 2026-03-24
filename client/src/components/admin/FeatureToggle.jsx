import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import {
  fetchFeatureImpact,
  previewFeatureUpdate,
  searchFeatureTenants,
  updateFeature,
} from '../../services/adminApi';
import { formatDateTime } from '../../utils/adminFormat';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import { Spinner } from './SkeletonLoader';

const FEATURE_ICONS = {
  DIGITAL_MENU: '📋',
  QR_GENERATION: '🔳',
  BASIC_ORDERS: '🧾',
  POS: '🖥️',
  INVENTORY: '📦',
  CRM: '👥',
  BASIC_REPORTS: '📊',
  ADVANCED_ANALYTICS: '📈',
  API_ACCESS: '🔌',
  STAFF_MANAGEMENT: '👔',
  ONLINE_ORDERING: '🌐',
  LOYALTY_PROGRAM: '⭐',
  GAMIFICATION: '🎮',
  REVIEWS: '🤖',
  CUSTOM_BRANDING: '🎨',
  NOTIFICATIONS: '🔔',
  DEFAULT: '⚡',
};

const STATUS_STYLE = {
  active: { color: '#22c55e', background: 'rgba(34,197,94,0.12)', label: 'Active' },
  partial: { color: '#f59e0b', background: 'rgba(245,158,11,0.12)', label: 'Partial rollout' },
  disabled: { color: '#94a3b8', background: 'rgba(148,163,184,0.12)', label: 'Disabled' },
};

const PLAN_COLORS = {
  Starter: '#22c55e',
  Pro: '#f59e0b',
  Elite: '#8b5cf6',
};

function buildDraft(feature) {
  return {
    isGlobal: Boolean(feature.isGlobal ?? feature.globalEnabled),
    plans: Array.isArray(feature.plans) ? feature.plans : (feature.plansEnabled || []),
    tenantOverrides: Array.isArray(feature.tenantOverrides) ? feature.tenantOverrides : [],
    rolloutPercentage: Number(feature.rolloutPercentage || 0),
  };
}

function hasScope(draft) {
  return Boolean(draft.isGlobal || draft.plans.length > 0 || draft.tenantOverrides.length > 0);
}

function getDraftStatus(draft) {
  if (!hasScope(draft) || Number(draft.rolloutPercentage || 0) <= 0) return 'disabled';
  if (Number(draft.rolloutPercentage || 0) < 100) return 'partial';
  return 'active';
}

function areDraftsEqual(a, b) {
  return JSON.stringify({
    isGlobal: a.isGlobal,
    plans: [...a.plans].sort(),
    tenantOverrides: [...a.tenantOverrides].sort(),
    rolloutPercentage: Number(a.rolloutPercentage || 0),
  }) === JSON.stringify({
    isGlobal: b.isGlobal,
    plans: [...b.plans].sort(),
    tenantOverrides: [...b.tenantOverrides].sort(),
    rolloutPercentage: Number(b.rolloutPercentage || 0),
  });
}

function Section({ title, subtitle, children, accent }) {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 18,
        padding: 16,
        background: accent
          ? `linear-gradient(180deg, ${accent}10 0%, transparent 48%), var(--bg-base)`
          : 'var(--bg-base)',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)' }}>{title}</div>
      {subtitle ? (
        <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>
          {subtitle}
        </div>
      ) : null}
      <div style={{ marginTop: 14 }}>{children}</div>
    </div>
  );
}

function AnimatedSwitch({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      style={{
        width: 54,
        height: 30,
        borderRadius: 999,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: checked ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'var(--bg-hover)',
        position: 'relative',
        transition: 'all 0.2s ease',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 4,
          left: checked ? 28 : 4,
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 4px 10px rgba(0,0,0,0.18)',
          transition: 'left 0.2s cubic-bezier(.4,0,.2,1)',
        }}
      />
    </button>
  );
}

function TenantChip({ tenant, onRemove }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 10px',
        borderRadius: 999,
        background: 'rgba(139,92,246,0.12)',
        color: '#8b5cf6',
        border: '1px solid rgba(139,92,246,0.2)',
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {tenant.cafeName}
      <span style={{ fontSize: 10, opacity: 0.75 }}>{tenant.tenantId || tenant.id}</span>
      <button
        type="button"
        onClick={() => onRemove(tenant.id)}
        style={{
          background: 'none',
          border: 'none',
          color: '#8b5cf6',
          cursor: 'pointer',
          padding: 0,
          fontSize: 14,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </span>
  );
}

export default function FeatureToggle({ feature: incomingFeature, availablePlans, environment, onUpdate }) {
  const { user } = useAuth();
  const [feature, setFeature] = useState(incomingFeature);
  const [draft, setDraft] = useState(buildDraft(incomingFeature));
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [impactLoading, setImpactLoading] = useState(false);
  const [impact, setImpact] = useState(null);
  const [impactError, setImpactError] = useState('');
  const [tenantSearch, setTenantSearch] = useState('');
  const [tenantResults, setTenantResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    setFeature(incomingFeature);
    setDraft(buildDraft(incomingFeature));
    setImpact(null);
    setPreview(null);
    setTenantSearch('');
    setTenantResults([]);
  }, [incomingFeature, environment]);

  const icon = FEATURE_ICONS[feature.key] || FEATURE_ICONS.DEFAULT;
  const currentStatusKey = feature.status || getDraftStatus(buildDraft(feature));
  const currentStatus = STATUS_STYLE[currentStatusKey] || STATUS_STYLE.disabled;
  const draftStatusKey = getDraftStatus(draft);
  const draftStatus = STATUS_STYLE[draftStatusKey] || STATUS_STYLE.disabled;
  const dirty = !areDraftsEqual(draft, buildDraft(feature));
  const updatedBy = feature.updatedBy || 'System';
  const dependencyWarnings = feature.dependencyWarnings || [];
  const dependencyStates = feature.dependencyStates || [];
  const overrideTenants = useMemo(() => {
    const byId = new Map((impact?.affectedTenants || []).map((tenant) => [tenant.id, tenant]));
    return draft.tenantOverrides.map((tenantId) => {
      const fromImpact = byId.get(tenantId);
      if (fromImpact) return fromImpact;
      return tenantResults.find((tenant) => tenant.id === tenantId) || { id: tenantId, cafeName: `Tenant ${tenantId.slice(-6)}` };
    });
  }, [draft.tenantOverrides, impact?.affectedTenants, tenantResults]);

  useEffect(() => {
    if (!expanded) return undefined;

    let ignore = false;

    const loadImpact = async () => {
      setImpactLoading(true);
      setImpactError('');

      try {
        const response = await fetchFeatureImpact(feature._id, { environment });
        if (!ignore) setImpact(response.data);
      } catch (error) {
        console.error('[FeatureToggle] Failed to load feature impact', error);
        if (!ignore) setImpactError(error.message);
      } finally {
        if (!ignore) setImpactLoading(false);
      }
    };

    loadImpact();

    return () => {
      ignore = true;
    };
  }, [expanded, feature._id, environment]);

  useEffect(() => {
    if (!expanded || tenantSearch.trim().length < 2) {
      setTenantResults([]);
      return undefined;
    }

    let ignore = false;
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const response = await searchFeatureTenants({ q: tenantSearch.trim(), limit: 8 });
        if (!ignore) {
          setTenantResults((response.data || []).filter((tenant) => !draft.tenantOverrides.includes(tenant.id)));
        }
      } catch (error) {
        console.error('[FeatureToggle] Failed to search tenants', error);
        if (!ignore) setTenantResults([]);
      } finally {
        if (!ignore) setSearchLoading(false);
      }
    }, 250);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [tenantSearch, expanded, draft.tenantOverrides]);

  const queuePreview = async () => {
    setPreviewLoading(true);
    try {
      const response = await previewFeatureUpdate(feature._id, {
        environment,
        ...draft,
        updatedBy: user?.name || user?.email || 'SuperAdmin',
      });
      setPreview(response.data);
      setConfirmOpen(true);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const applyChanges = async () => {
    setSaving(true);
    try {
      const response = await updateFeature(feature._id, {
        environment,
        ...draft,
        updatedBy: user?.name || user?.email || 'SuperAdmin',
      });
      setFeature(response.data);
      setDraft(buildDraft(response.data));
      setConfirmOpen(false);
      setPreview(null);
      setImpact(null);
      if (onUpdate) onUpdate(response.data);
      toast.success(`Feature updated in ${environment}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const togglePlan = (plan) => {
    setDraft((current) => {
      const hasPlan = current.plans.includes(plan);
      const nextPlans = hasPlan
        ? current.plans.filter((item) => item !== plan)
        : [...current.plans, plan];

      return {
        ...current,
        plans: nextPlans,
        rolloutPercentage: current.rolloutPercentage === 0 && (current.isGlobal || nextPlans.length > 0 || current.tenantOverrides.length > 0)
          ? 100
          : current.rolloutPercentage,
      };
    });
  };

  const addOverride = (tenant) => {
    setDraft((current) => ({
      ...current,
      tenantOverrides: [...current.tenantOverrides, tenant.id],
      rolloutPercentage: current.rolloutPercentage === 0 ? 100 : current.rolloutPercentage,
    }));
    setTenantSearch('');
    setTenantResults([]);
  };

  const removeOverride = (tenantId) => {
    setDraft((current) => ({
      ...current,
      tenantOverrides: current.tenantOverrides.filter((item) => item !== tenantId),
    }));
  };

  return (
    <div
      style={{
        borderTop: '1px solid var(--border)',
        transition: 'background 0.18s ease',
        background: expanded ? 'rgba(198,124,78,0.04)' : 'transparent',
      }}
    >
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm feature rollout"
        subtitle={`Review the impact of changing ${feature.name} in ${environment}.`}
        width={720}
      >
        {previewLoading || !preview ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-3)' }}>Preparing impact preview...</div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              <PreviewMetric label="Status" value={(STATUS_STYLE[preview.status] || STATUS_STYLE.disabled).label} />
              <PreviewMetric label="Rollout" value={`${preview.rolloutPercentage}%`} />
              <PreviewMetric label="Affected tenants" value={preview.affectedTenantCount} />
              <PreviewMetric label="Eligible tenants" value={preview.eligibleTenantCount} />
            </div>

            <Section title="Affected plans" subtitle="Plans that will receive this flag after the rollout is applied.">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {preview.affectedPlans?.length ? preview.affectedPlans.map((plan) => (
                  <Badge key={plan} tone={PLAN_COLORS[plan] || '#94a3b8'} background={`${PLAN_COLORS[plan] || '#94a3b8'}1f`}>
                    {plan}
                  </Badge>
                )) : <span style={{ fontSize: 12, color: 'var(--text-3)' }}>No plans affected</span>}
              </div>
            </Section>

            <Section title="Affected tenants" subtitle="Preview of tenants in the rollout population.">
              {preview.affectedTenants?.length ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  {preview.affectedTenants.map((tenant) => (
                    <div key={tenant.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 12px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)' }}>{tenant.cafeName}</div>
                        <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-3)' }}>{tenant.tenantId}</div>
                      </div>
                      <Badge tone={PLAN_COLORS[tenant.plan] || '#94a3b8'} background={`${PLAN_COLORS[tenant.plan] || '#94a3b8'}1f`}>
                        {tenant.plan}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>No tenants will receive this feature with the current draft.</span>
              )}
            </Section>

            {preview.dependencyWarnings?.length ? (
              <div style={{ padding: '12px 14px', borderRadius: 16, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 13 }}>
                {preview.dependencyWarnings.join(' ')}
              </div>
            ) : null}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
              <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button onClick={applyChanges} disabled={saving || preview.blockedByDependencies}>
                {saving ? 'Applying...' : 'Confirm rollout'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 16,
          padding: '18px 20px',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded((current) => !current)}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: expanded ? 'rgba(198,124,78,0.16)' : 'var(--bg-hover)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            flexShrink: 0,
            transition: 'all 0.18s ease',
          }}
        >
          {icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)' }}>{feature.name}</div>
            <Badge tone={currentStatus.color} background={currentStatus.background}>{currentStatus.label}</Badge>
            <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: 'var(--bg-hover)', color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {feature.key}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{feature.rolloutPercentage}% rollout</span>
          </div>

          <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 }}>
            {feature.description}
          </div>

          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {(feature.affectedPlans || []).map((plan) => (
              <Badge key={plan} tone={PLAN_COLORS[plan] || '#94a3b8'} background={`${PLAN_COLORS[plan] || '#94a3b8'}1f`}>
                {plan}
              </Badge>
            ))}
            {feature.dependencyStates?.map((dependency) => (
              <Badge
                key={dependency.key}
                tone={dependency.status === 'disabled' ? '#ef4444' : '#22c55e'}
                background={dependency.status === 'disabled' ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)'}
              >
                Depends on {dependency.name}
              </Badge>
            ))}
          </div>

          <div style={{ marginTop: 10, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-3)' }}>
            <span>Affected tenants: <strong style={{ color: 'var(--text-1)' }}>{feature.affectedTenantCount || 0}</strong></span>
            <span>Updated by <strong style={{ color: 'var(--text-1)' }}>{updatedBy}</strong></span>
            <span>{formatDateTime(feature.updatedAt)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
          {dirty ? <Badge tone={draftStatus.color} background={draftStatus.background}>Draft: {draftStatus.label}</Badge> : null}
          <span style={{ color: 'var(--text-3)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s ease' }}>▼</span>
        </div>
      </div>

      {expanded ? (
        <div style={{ padding: '0 20px 22px 84px', display: 'grid', gap: 16 }}>
          {dependencyWarnings.length ? (
            <div style={{ padding: '12px 14px', borderRadius: 16, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 13 }}>
              {dependencyWarnings.join(' ')}
            </div>
          ) : null}

          <Section
            title="Live impact"
            subtitle="Affected population fetched from the backend for the selected environment."
            accent="#C67C4E"
          >
            {impactLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-3)', fontSize: 13 }}>
                <Spinner size={16} /> Loading impact...
              </div>
            ) : impactError ? (
              <div style={{ color: '#ef4444', fontSize: 13 }}>{impactError}</div>
            ) : impact ? (
              <div style={{ display: 'grid', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                  <PreviewMetric label="Affected tenants" value={impact.affectedTenantCount} />
                  <PreviewMetric label="Eligible tenants" value={impact.eligibleTenantCount} />
                  <PreviewMetric label="Plans" value={impact.affectedPlans?.length || 0} />
                  <PreviewMetric label="Environment" value={environment} />
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    Affected plans
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {impact.affectedPlans?.length ? impact.affectedPlans.map((plan) => (
                      <Badge key={plan} tone={PLAN_COLORS[plan] || '#94a3b8'} background={`${PLAN_COLORS[plan] || '#94a3b8'}1f`}>
                        {plan}
                      </Badge>
                    )) : <span style={{ fontSize: 12, color: 'var(--text-3)' }}>No plans affected</span>}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    Affected tenants
                  </div>
                  {impact.affectedTenants?.length ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                      {impact.affectedTenants.map((tenant) => (
                        <div key={tenant.id} style={{ padding: '12px 14px', borderRadius: 16, border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)' }}>{tenant.cafeName}</div>
                          <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-3)' }}>{tenant.tenantId}</div>
                          <div style={{ marginTop: 8 }}>
                            <Badge tone={PLAN_COLORS[tenant.plan] || '#94a3b8'} background={`${PLAN_COLORS[tenant.plan] || '#94a3b8'}1f`}>
                              {tenant.plan}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>No tenants currently affected.</span>
                  )}
                </div>
              </div>
            ) : null}
          </Section>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 0.85fr)', gap: 16 }}>
            <Section title="Scope controls" subtitle="Control plan access, tenant overrides, and global exposure.">
              <div style={{ display: 'grid', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)' }}>Global access</div>
                    <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-3)' }}>
                      Enable for every tenant in {environment}, then control exposure with rollout percentage.
                    </div>
                  </div>
                  <AnimatedSwitch
                    checked={draft.isGlobal}
                    onChange={() => setDraft((current) => ({
                      ...current,
                      isGlobal: !current.isGlobal,
                      rolloutPercentage: current.rolloutPercentage === 0 ? 100 : current.rolloutPercentage,
                    }))}
                    disabled={saving}
                  />
                </div>

                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8 }}>Affected plans</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {(availablePlans || []).map((plan) => {
                      const active = draft.plans.includes(plan);
                      const color = PLAN_COLORS[plan] || '#94a3b8';

                      return (
                        <button
                          key={plan}
                          type="button"
                          onClick={() => togglePlan(plan)}
                          style={{
                            border: `1px solid ${active ? `${color}55` : 'var(--border)'}`,
                            background: active ? `${color}18` : 'var(--bg-card)',
                            color: active ? color : 'var(--text-2)',
                            borderRadius: 999,
                            padding: '8px 12px',
                            fontSize: 12,
                            fontWeight: active ? 800 : 600,
                            cursor: 'pointer',
                            transition: 'all 0.18s ease',
                          }}
                        >
                          {plan}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8 }}>Tenant overrides</div>
                  {overrideTenants.length ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                      {overrideTenants.map((tenant) => (
                        <TenantChip key={tenant.id} tenant={tenant} onRemove={removeOverride} />
                      ))}
                    </div>
                  ) : null}

                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={tenantSearch}
                      onChange={(event) => setTenantSearch(event.target.value)}
                      placeholder="Search active tenants by cafe name, tenant ID, owner, or email..."
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        minHeight: 44,
                        borderRadius: 14,
                        border: '1px solid var(--border)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-1)',
                        padding: '0 14px',
                        fontSize: 13,
                      }}
                    />
                    {tenantSearch.trim().length >= 2 ? (
                      <div
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 6px)',
                          left: 0,
                          right: 0,
                          zIndex: 40,
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          borderRadius: 16,
                          boxShadow: 'var(--shadow-lg)',
                          overflow: 'hidden',
                        }}
                      >
                        {searchLoading ? (
                          <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-3)' }}>Searching tenants...</div>
                        ) : tenantResults.length ? tenantResults.map((tenant) => (
                          <button
                            key={tenant.id}
                            type="button"
                            onClick={() => addOverride(tenant)}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              border: 'none',
                              background: 'transparent',
                              padding: '12px 14px',
                              cursor: 'pointer',
                              borderBottom: '1px solid var(--border)',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)' }}>{tenant.cafeName}</div>
                                <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-3)' }}>{tenant.tenantId}</div>
                              </div>
                              <Badge tone={PLAN_COLORS[tenant.plan] || '#94a3b8'} background={`${PLAN_COLORS[tenant.plan] || '#94a3b8'}1f`}>
                                {tenant.plan}
                              </Badge>
                            </div>
                          </button>
                        )) : (
                          <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-3)' }}>No active tenants match this search.</div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </Section>

            <div style={{ display: 'grid', gap: 16 }}>
              <Section title="Rollout percentage" subtitle="Gradually expose the feature to the selected population.">
                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Rollout</span>
                    <Badge tone={draftStatus.color} background={draftStatus.background}>
                      {draft.rolloutPercentage}%
                    </Badge>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={draft.rolloutPercentage}
                    onChange={(event) => setDraft((current) => ({ ...current, rolloutPercentage: Number(event.target.value) }))}
                    style={{ width: '100%' }}
                  />
                  <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>
                    `0%` disables the feature. `1–99%` creates a partial rollout. `100%` enables it fully for the selected scope.
                  </div>
                </div>
              </Section>

              <Section title="Dependencies" subtitle="Prevent unsafe rollouts when prerequisite capabilities are disabled.">
                {dependencyStates.length ? (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {dependencyStates.map((dependency) => (
                      <div key={dependency.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: '10px 12px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)' }}>{dependency.name}</div>
                          {dependency.warning ? <div style={{ marginTop: 4, fontSize: 12, color: '#ef4444' }}>{dependency.warning}</div> : null}
                        </div>
                        <Badge
                          tone={dependency.status === 'disabled' ? '#ef4444' : dependency.status === 'partial' ? '#f59e0b' : '#22c55e'}
                          background={dependency.status === 'disabled' ? 'rgba(239,68,68,0.12)' : dependency.status === 'partial' ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)'}
                        >
                          {STATUS_STYLE[dependency.status]?.label || dependency.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>No dependencies configured for this feature.</span>
                )}
              </Section>

              <Section title="Activity metadata" subtitle="Track who changed the flag and when it was last touched.">
                <div style={{ display: 'grid', gap: 8, fontSize: 12, color: 'var(--text-2)' }}>
                  <div>Last updated by: <strong>{updatedBy}</strong></div>
                  <div>Last updated at: <strong>{formatDateTime(feature.updatedAt)}</strong></div>
                  <div>Environment: <strong>{environment}</strong></div>
                </div>
              </Section>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
            <Button
              variant="ghost"
              onClick={() => setDraft(buildDraft(feature))}
              disabled={!dirty || saving}
            >
              Discard changes
            </Button>
            <Button
              onClick={queuePreview}
              disabled={!dirty || previewLoading || saving}
            >
              {previewLoading ? 'Preparing preview...' : 'Review & apply'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PreviewMetric({ label, value }) {
  return (
    <div style={{ padding: '12px 14px', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ marginTop: 8, fontSize: 18, fontWeight: 900, color: 'var(--text-1)' }}>
        {value}
      </div>
    </div>
  );
}
