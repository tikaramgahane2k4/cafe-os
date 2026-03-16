import { IconEdit, IconTrash } from './icons';

const PLAN_COLORS = {
  Free:       '#94a3b8',
  Starter:    '#22c55e',
  Growth:     '#C67C4E',
  Pro:        '#C67C4E',
  Enterprise: '#a78bfa',
};

// Feature key → display info
const FEATURE_META = {
  POS:                { label: 'Point of Sale',        icon: '🖥️', color: '#3b82f6' },
  INVENTORY:          { label: 'Inventory',            icon: '📦', color: '#f59e0b' },
  CRM:                { label: 'CRM',                  icon: '👥', color: '#06b6d4' },
  BASIC_REPORTS:      { label: 'Basic Reports',        icon: '📊', color: '#22c55e' },
  ADVANCED_ANALYTICS: { label: 'Adv. Analytics',      icon: '📈', color: '#8b5cf6' },
  API_ACCESS:         { label: 'API Access',           icon: '🔌', color: '#ec4899' },
  STAFF_MANAGEMENT:   { label: 'Staff Mgmt',           icon: '👔', color: '#f97316' },
  ONLINE_ORDERING:    { label: 'Online Ordering',      icon: '🛒', color: '#14b8a6' },
  LOYALTY_PROGRAM:    { label: 'Loyalty',              icon: '⭐', color: '#eab308' },
};

export default function PlanCard({ plan, onEdit, onDelete, tenantCount }) {
  const color = PLAN_COLORS[plan.planName] || '#C67C4E';
  const features = Array.isArray(plan.featureList) ? plan.featureList : [];

  return (
    <div
      style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '24px',
        position: 'relative', overflow: 'hidden',
        boxShadow: 'var(--shadow)', transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.25)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
    >
      {/* Top accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${color}, ${color}88)`, borderRadius: '16px 16px 0 0' }} />

      {/* Header row: plan badge + tenant count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 20 }}>
        <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: `${color}22`, color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {plan.planName}
        </span>
        {tenantCount !== undefined && (
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', background: 'var(--bg-hover)', padding: '2px 8px', borderRadius: 99 }}>
            {tenantCount} {tenantCount === 1 ? 'tenant' : 'tenants'}
          </span>
        )}
      </div>

      {/* Price */}
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 32, fontWeight: 800, color, letterSpacing: '-0.03em' }}>
          {plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString('en-IN')}`}
        </span>
        {plan.price > 0 && <span style={{ fontSize: 13, color: 'var(--text-3)' }}>/mo</span>}
      </div>

      {/* Limits chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <div style={{ flex: 1, background: 'var(--bg-hover)', borderRadius: 8, padding: '7px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>{plan.orderLimit >= 10000 ? '∞' : plan.orderLimit.toLocaleString('en-IN')}</div>
          <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Orders</div>
        </div>
        <div style={{ flex: 1, background: 'var(--bg-hover)', borderRadius: 8, padding: '7px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>{plan.staffLimit >= 100 ? '∞' : plan.staffLimit}</div>
          <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Staff</div>
        </div>
      </div>

      {/* Feature key badges */}
      {features.length > 0 && (
        <div style={{ marginBottom: 18, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
            Included Features
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {features.map((key) => {
              const meta = FEATURE_META[key];
              if (!meta) return (
                <span key={key} style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: 'var(--bg-hover)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                  {key}
                </span>
              );
              return (
                <span key={key} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 11, fontWeight: 600,
                  padding: '3px 9px', borderRadius: 99,
                  background: `${meta.color}18`,
                  color: meta.color,
                  border: `1px solid ${meta.color}33`,
                }}>
                  <span style={{ fontSize: 12 }}>{meta.icon}</span>
                  {meta.label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Status badge */}
      <div style={{ marginBottom: 16 }}>
        <span style={{
          padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
          background: plan.planStatus === 'Active' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          color: plan.planStatus === 'Active' ? '#22c55e' : '#ef4444',
        }}>
          {plan.planStatus}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onEdit(plan)} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '8px', background: 'var(--bg-hover)', border: '1px solid var(--border)',
          borderRadius: 8, cursor: 'pointer', color: '#C67C4E', fontSize: 12, fontWeight: 600,
        }}>
          <IconEdit width={13} height={13} /> Edit
        </button>
        <button onClick={() => onDelete(plan._id)} style={{
          width: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 8, cursor: 'pointer', color: '#ef4444',
        }}>
          <IconTrash width={13} height={13} />
        </button>
      </div>
    </div>
  );
}

