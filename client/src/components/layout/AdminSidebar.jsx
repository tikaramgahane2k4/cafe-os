import { NavLink } from 'react-router-dom';
import {
  IconAnalytics,
  IconBell,
  IconChevronL,
  IconChevronR,
  IconCoffee,
  IconDashboard,
  IconFlags,
  IconLogs,
  IconPlans,
  IconTenants,
} from '../admin/icons';

const navigationGroups = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', to: '/admin/dashboard', icon: IconDashboard },
      { label: 'Notifications', to: '/admin/notifications', icon: IconBell },
    ],
  },
  {
    label: 'Revenue',
    items: [
      { label: 'Tenants', to: '/admin/tenants', icon: IconTenants },
      { label: 'Subscriptions', to: '/admin/subscriptions', icon: IconPlans },
      { label: 'Billing', to: '/admin/billing', icon: IconLogs },
    ],
  },
  {
    label: 'Platform',
    items: [
      { label: 'Analytics', to: '/admin/analytics', icon: IconAnalytics },
      { label: 'Tenant Usage', to: '/admin/tenant-usage', icon: IconAnalytics },
      { label: 'Feature Flags', to: '/admin/feature-flags', icon: IconFlags },
      { label: 'Activity Logs', to: '/admin/logs', icon: IconLogs },
    ],
  },
];

export default function AdminSidebar({
  open,
  collapsed,
  isMobile,
  onToggle,
  onClose,
}) {
  const width = collapsed ? 88 : 264;

  return (
    <>
      {isMobile && open ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(17,12,9,0.4)',
            zIndex: 39,
          }}
          onClick={onClose}
        />
      ) : null}

      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width,
          transform: isMobile ? `translateX(${open ? '0' : '-100%'})` : 'translateX(0)',
          background: 'linear-gradient(180deg, #1a130f 0%, #231711 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          color: '#f5e6d3',
          zIndex: 40,
          transition: 'width 0.22s ease, transform 0.22s ease',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: collapsed ? '18px 12px 16px' : '22px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: collapsed ? 'center' : 'center',
            justifyContent: 'space-between',
            flexDirection: collapsed ? 'column' : 'row',
            gap: collapsed ? 10 : 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 12,
              minWidth: 0,
              width: collapsed ? '100%' : 'auto',
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #f6c08d, #c67c4e 60%, #7a3f1b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 18px 32px rgba(198,124,78,0.28)',
                flexShrink: 0,
              }}
            >
              <IconCoffee size={20} />
            </div>
            {!collapsed ? (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-0.03em' }}>CafeOS</div>
                <div style={{ marginTop: 3, fontSize: 10, color: '#b99779', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                  Super Admin
                </div>
              </div>
            ) : null}
          </div>
          {!isMobile ? (
            <button
              onClick={onToggle}
              style={{
                width: 30,
                height: 30,
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: '#d7baa0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                alignSelf: collapsed ? 'center' : 'auto',
              }}
            >
              {collapsed ? <IconChevronR size={14} /> : <IconChevronL size={14} />}
            </button>
          ) : null}
        </div>

        <nav style={{ flex: 1, padding: '18px 12px 20px', overflowY: 'auto' }}>
          {navigationGroups.map((group) => (
            <div key={group.label} style={{ marginBottom: 20 }}>
              {!collapsed ? (
                <div style={{ padding: '0 10px 8px', fontSize: 10, color: '#8f6e57', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 800 }}>
                  {group.label}
                </div>
              ) : null}

              <div style={{ display: 'grid', gap: 6 }}>
                {group.items.map(({ label, to, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/admin/dashboard'}
                    onClick={isMobile ? onClose : undefined}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      gap: 12,
                      minHeight: 46,
                      padding: collapsed ? '0 12px' : '0 14px',
                      borderRadius: 16,
                      color: isActive ? '#fff1e1' : '#d1b49b',
                      background: isActive ? 'linear-gradient(135deg, rgba(198,124,78,0.3), rgba(198,124,78,0.08))' : 'transparent',
                      border: isActive ? '1px solid rgba(198,124,78,0.24)' : '1px solid transparent',
                      textDecoration: 'none',
                      fontSize: 13,
                      fontWeight: isActive ? 800 : 600,
                    })}
                  >
                    <span
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 12,
                        background: 'rgba(255,255,255,0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={16} />
                    </span>
                    {!collapsed ? <span>{label}</span> : null}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div style={{ padding: collapsed ? '16px 14px 18px' : '18px 18px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div
            style={{
              borderRadius: 18,
              background: 'linear-gradient(135deg, rgba(198,124,78,0.18), rgba(198,124,78,0.04))',
              border: '1px solid rgba(198,124,78,0.16)',
              padding: collapsed ? '12px 10px' : '14px 14px',
              textAlign: collapsed ? 'center' : 'left',
            }}
          >
            {!collapsed ? (
              <>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#f7dec5' }}>Revenue operations</div>
                <div style={{ marginTop: 4, fontSize: 11, color: '#bb9a7e', lineHeight: 1.5 }}>
                  Billing, tenants, feature rollout, and platform visibility in one place.
                </div>
              </>
            ) : (
              <div style={{ fontSize: 18 }}>☕</div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
