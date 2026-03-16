import { NavLink } from 'react-router-dom';

const C = {
  bg: '#1B1410',
  bgHover: '#2E1A0E',
  active: '#3D2410',
  accent: '#C97C3A',
  accentLight: '#E8A94F',
  text: '#D4B896',
  textMuted: '#7A5A42',
  border: '#3A2010',
  white: '#FFF8F0',
};

const navItems = [
  { label: 'Dashboard',     to: '/admin/dashboard', icon: '▦' },
  { label: 'Tenants',       to: '/admin/tenants',   icon: '🏪' },
  { label: 'Tenant Usage',  to: '/admin/tenant-usage', icon: '📊' },
  { label: 'Subscriptions', to: '/admin/subscriptions', icon: '💳' },
  { label: 'Billing',       to: '/admin/billing', icon: '🧾' },
  { label: 'Analytics',     to: '/admin/analytics', icon: '📈' },
  { label: 'System Alerts', to: '/admin/alerts', icon: '🚨' },
  { label: 'Feature Flags', to: '/admin/feature-flags',  icon: '⚑' },
  { label: 'Users & Roles', to: '/admin/users',     icon: '👥' },
  { label: 'Activity Logs', to: '/admin/logs',      icon: '📋' },
];

function AdminSidebar() {
  return (
    <aside
      style={{
        width: '230px',
        minHeight: '100vh',
        background: C.bg,
        position: 'fixed',
        top: 0,
        left: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${C.border}`,
        zIndex: 100,
      }}
    >
      {/* Brand */}
      <div style={{ padding: '24px 20px 18px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', flexShrink: 0,
            }}
          >
            ☕
          </div>
          <div>
            <div style={{ color: C.white, fontWeight: '700', fontSize: '15px' }}>Cafe OS</div>
            <div style={{ color: C.textMuted, fontSize: '10px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Super Admin</div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ padding: '10px 10px', flex: 1 }}>
        <div style={{
          color: C.textMuted, fontSize: '10px', fontWeight: '700',
          letterSpacing: '0.12em', textTransform: 'uppercase',
          padding: '10px 10px 6px',
        }}>
          Navigation
        </div>
        {navItems.map(({ label, to, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin/dashboard'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 12px', borderRadius: '8px', marginBottom: '2px',
              textDecoration: 'none', fontSize: '13.5px',
              fontWeight: isActive ? '600' : '400',
              color: isActive ? C.accentLight : C.text,
              background: isActive ? C.active : 'transparent',
              borderLeft: isActive ? `3px solid ${C.accent}` : '3px solid transparent',
              transition: 'all 0.15s ease',
            })}
          >
            <span style={{ fontSize: '14px', width: '20px', textAlign: 'center' }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.border}`, fontSize: '11px', color: C.textMuted }}>
        <div style={{ fontWeight: '600', color: C.text, marginBottom: '2px' }}>Cafe OS Platform</div>
        <div>Admin Panel v1.0</div>
      </div>
    </aside>
  );
}

export default AdminSidebar;
