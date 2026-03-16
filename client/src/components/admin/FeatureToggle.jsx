import { useState, useRef } from 'react';
import { updateFeature } from '../../services/adminApi';
import { Spinner } from './SkeletonLoader';
import toast from 'react-hot-toast';

const FEATURE_ICONS = {
  POS:                '🖥️',
  INVENTORY:          '📦',
  CRM:                '👥',
  BASIC_REPORTS:      '📊',
  ADVANCED_ANALYTICS: '📈',
  API_ACCESS:         '🔌',
  STAFF_MANAGEMENT:   '👔',
  ONLINE_ORDERING:    '🌐',
  LOYALTY_PROGRAM:    '⭐',
  GAMIFICATION:       '🎮',
  REVIEWS:            '🌟',
  NOTIFICATIONS:      '🔔',
  DEFAULT:            '⚡',
};

const PLAN_COLORS = {
  Free:       '#94a3b8',
  Starter:    '#22c55e',
  Growth:     '#C67C4E',
  Pro:        '#f59e0b',
  Enterprise: '#a78bfa',
};

function Section({ title, subtitle, children }) {
  return (
    <div style={{ background: 'var(--bg-base)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{title}</div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 12 }}>{subtitle}</div>
      {children}
    </div>
  );
}

export default function FeatureToggle({ feature: initialFeature, availablePlans, allTenants, onUpdate }) {
  const [feature, setFeature]     = useState(initialFeature);
  const [expanded, setExpanded]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [tenantSearch, setSearch] = useState('');
  const [showDrop, setShowDrop]   = useState(false);
  const searchRef                 = useRef(null);

  const icon        = FEATURE_ICONS[feature.key] || FEATURE_ICONS.DEFAULT;
  const on          = feature.globalEnabled;
  const planCount   = feature.plansEnabled?.length || 0;
  const overrideCount = feature.tenantOverrides?.length || 0;

  const patch = async (updates) => {
    setSaving(true);
    try {
      const res = await updateFeature(feature._id, updates);
      setFeature(res.data);
      if (onUpdate) onUpdate(res.data);
      toast.success('Feature updated');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleGlobal = (e) => { e?.stopPropagation(); patch({ globalEnabled: !feature.globalEnabled }); };
  const togglePlan   = (p) => {
    const next = (feature.plansEnabled || []).includes(p)
      ? (feature.plansEnabled).filter((x) => x !== p)
      : [...(feature.plansEnabled || []), p];
    patch({ plansEnabled: next });
  };
  const addOverride    = (id) => { patch({ tenantOverrides: [...(feature.tenantOverrides || []), id] }); setSearch(''); setShowDrop(false); };
  const removeOverride = (id) => patch({ tenantOverrides: (feature.tenantOverrides || []).filter((x) => x !== id) });

  const filteredTenants = tenantSearch.length > 1
    ? (allTenants || [])
        .filter((t) => !(feature.tenantOverrides || []).includes(t._id) &&
          (t.cafeName?.toLowerCase().includes(tenantSearch.toLowerCase()) ||
           t.tenantId?.toLowerCase().includes(tenantSearch.toLowerCase())))
        .slice(0, 8)
    : [];

  return (
    <div>
      {/* ── Collapsed row ── */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', cursor: 'pointer', transition: 'background 0.12s', background: expanded ? 'var(--bg-hover)' : 'transparent' }}
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Icon */}
        <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: on ? 'rgba(198,124,78,0.14)' : 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, transition: 'background 0.2s' }}>
          {icon}
        </div>

        {/* Name + description + scope pills */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 3 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>{feature.name}</span>
            <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'var(--bg-hover)', color: 'var(--text-3)', letterSpacing: '0.06em', fontFamily: 'monospace' }}>
              {feature.key}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.4, marginBottom: 7 }}>{feature.description}</div>

          {/* Scope pills */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
            {on ? (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(198,124,78,0.15)', color: '#C67C4E', border: '1px solid rgba(198,124,78,0.3)' }}>🌍 Global</span>
            ) : planCount > 0 ? (
              (feature.plansEnabled || []).map((p) => {
                const col = PLAN_COLORS[p] || '#94a3b8';
                return <span key={p} style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99, background: `${col}18`, color: col, border: `1px solid ${col}33` }}>{p}</span>;
              })
            ) : (
              <span style={{ fontSize: 10, color: 'var(--text-3)', fontStyle: 'italic' }}>No plan access</span>
            )}
            {overrideCount > 0 && (
              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99, background: 'rgba(139,92,246,0.12)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.25)' }}>
                +{overrideCount} override{overrideCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Tenant count */}
        <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 56 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: on ? '#C67C4E' : 'var(--text-2)' }}>{feature.tenantCount ?? 0}</div>
          <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{(feature.tenantCount ?? 0) === 1 ? 'tenant' : 'tenants'}</div>
        </div>

        {/* Global toggle */}
        <div style={{ flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
          {saving ? (
            <div style={{ width: 44, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={16} /></div>
          ) : (
            <button onClick={toggleGlobal} title={on ? 'Disable globally' : 'Enable globally'} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: on ? 'linear-gradient(135deg, #C67C4E, #E09A6E)' : 'var(--bg-hover)', position: 'relative', transition: 'background 0.2s', padding: 0, boxShadow: on ? '0 0 0 3px rgba(198,124,78,0.2)' : 'none' }}>
              <span style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s cubic-bezier(.4,0,.2,1)', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }} />
            </button>
          )}
        </div>

        {/* Chevron */}
        <span style={{ color: 'var(--text-3)', fontSize: 11, flexShrink: 0, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
      </div>

      {/* ── Expanded controls panel ── */}
      {expanded && (
        <div style={{ padding: '4px 20px 22px 76px', display: 'flex', flexDirection: 'column', gap: 14, borderTop: '1px solid var(--border)' }}>

          {/* 1. Global access */}
          <Section title="🌍 Global Access" subtitle="Enables for every tenant, ignoring their subscription plan.">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: on ? '#C67C4E' : 'var(--text-3)', fontWeight: on ? 700 : 400 }}>
                {on ? 'Globally enabled — all tenants have access' : 'Not global — controlled by plan or overrides'}
              </span>
              {saving ? <Spinner size={16} /> : (
                <button onClick={toggleGlobal} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: on ? 'linear-gradient(135deg, #C67C4E, #E09A6E)' : 'var(--bg-hover)', position: 'relative', transition: 'background 0.2s', padding: 0, boxShadow: on ? '0 0 0 3px rgba(198,124,78,0.2)' : 'none' }}>
                  <span style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s cubic-bezier(.4,0,.2,1)', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }} />
                </button>
              )}
            </div>
          </Section>

          {/* 2. Plan access */}
          <Section title="📋 Plan Access" subtitle="Enable for all tenants on the selected subscription plans.">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(availablePlans || []).map((planName) => {
                const active = (feature.plansEnabled || []).includes(planName);
                const col = PLAN_COLORS[planName] || '#94a3b8';
                return (
                  <label key={planName} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: saving ? 'default' : 'pointer', padding: '7px 14px', borderRadius: 99, background: active ? `${col}18` : 'var(--bg-hover)', border: `1px solid ${active ? col + '44' : 'var(--border)'}`, transition: 'all 0.12s', userSelect: 'none' }} onClick={() => !saving && togglePlan(planName)}>
                    <span style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0, border: `2px solid ${active ? col : 'var(--text-3)'}`, background: active ? col : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}>
                      {active && <span style={{ color: '#fff', fontSize: 9, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? col : 'var(--text-2)' }}>{planName}</span>
                  </label>
                );
              })}
            </div>
          </Section>

          {/* 3. Tenant overrides */}
          <Section title="🎯 Tenant Overrides" subtitle="Force-enable for specific tenants, regardless of their plan.">
            {/* Active chips */}
            {overrideCount > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
                {(feature.tenantOverrides || []).map((tid) => {
                  const t = (allTenants || []).find((x) => x._id === tid);
                  return (
                    <span key={tid} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: 'rgba(139,92,246,0.12)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.25)' }}>
                      {t ? t.cafeName : `…${tid.slice(-6)}`}
                      {t && <span style={{ fontSize: 10, opacity: 0.65 }}>({t.tenantId})</span>}
                      <button onClick={() => removeOverride(tid)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8b5cf6', fontSize: 15, lineHeight: 1, padding: 0 }}>×</button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Search + dropdown */}
            <div style={{ position: 'relative' }} ref={searchRef}>
              <input
                type="text"
                placeholder="Search by café name or tenant ID…"
                value={tenantSearch}
                onChange={(e) => { setSearch(e.target.value); setShowDrop(true); }}
                onFocus={() => setShowDrop(true)}
                onBlur={() => setTimeout(() => setShowDrop(false), 160)}
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-1)', padding: '8px 12px', borderRadius: 8, fontSize: 13, outline: 'none' }}
              />
              {showDrop && tenantSearch.length > 1 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 60, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, marginTop: 4, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}>
                  {filteredTenants.length === 0 ? (
                    <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-3)' }}>No matching tenants</div>
                  ) : filteredTenants.map((t) => (
                    <div key={t._id} onMouseDown={() => addOverride(t._id)} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{t.cafeName}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 8 }}>{t.tenantId}</span>
                      </div>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: `${PLAN_COLORS[t.subscriptionPlan] || '#94a3b8'}18`, color: PLAN_COLORS[t.subscriptionPlan] || '#94a3b8' }}>{t.subscriptionPlan}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

