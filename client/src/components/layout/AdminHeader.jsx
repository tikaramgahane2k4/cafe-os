import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNotificationsCenter } from '../../context/NotificationsContext';
import { adminSearchItems, notificationVisualMap } from '../../utils/adminConstants';
import { formatRelativeTime } from '../../utils/adminFormat';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import {
  IconAlert,
  IconBell,
  IconCheck,
  IconChevronD,
  IconLogout,
  IconMenu,
  IconMoon,
  IconSearch,
  IconSettings,
  IconSun,
  IconUser,
  IconX,
} from '../admin/icons';

const notificationIconMap = {
  info: IconBell,
  success: IconCheck,
  warning: IconAlert,
  error: IconX,
};

export default function AdminHeader({ onToggleSidebar, isMobile }) {
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();
  const { user, logoutUser } = useAuth();
  const {
    notifications,
    stats,
    busyId,
    markAllRead,
    markOneRead,
  } = useNotificationsCenter();
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef = useRef(null);
  const bellRef = useRef(null);
  const profileRef = useRef(null);
  const deferredQuery = useDeferredValue(query);

  const filteredItems = useMemo(() => {
    if (!deferredQuery) return [];
    return adminSearchItems.filter((item) => item.label.toLowerCase().includes(deferredQuery.toLowerCase()));
  }, [deferredQuery]);

  const displayName = user?.name || user?.email || 'Admin';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((token) => token[0])
    .join('')
    .toUpperCase();

  useEffect(() => {
    const handleMouseDown = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setBellOpen(false);
      }

      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    const handleShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleShortcut);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleShortcut);
    };
  }, []);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        padding: isMobile ? '18px 18px 0' : '20px 24px 0',
        background: 'linear-gradient(180deg, rgba(245,230,211,0.96) 0%, rgba(245,230,211,0.8) 62%, rgba(245,230,211,0) 100%)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div
        style={{
          minHeight: 72,
          border: '1px solid var(--border)',
          borderRadius: 22,
          background: dark ? 'rgba(59,39,33,0.92)' : 'rgba(255,255,255,0.92)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: isMobile ? '12px 14px' : '14px 18px',
        }}
      >
        <button
          onClick={onToggleSidebar}
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            border: '1px solid var(--border)',
            background: 'var(--bg-hover)',
            color: 'var(--text-1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <IconMenu size={18} />
        </button>

        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minHeight: 44,
              borderRadius: 14,
              background: 'var(--bg-hover)',
              border: `1px solid ${showResults ? '#c67c4e' : 'transparent'}`,
              padding: '0 14px',
            }}
          >
            <IconSearch size={15} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 160)}
              placeholder="Jump to dashboard, billing, tenants, notifications..."
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                outline: 'none',
                color: 'var(--text-1)',
                fontSize: 13,
              }}
            />
            {!query ? (
              <kbd style={{ padding: '2px 7px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', fontSize: 11, color: 'var(--text-3)' }}>
                ⌘K
              </kbd>
            ) : null}
          </div>

          {showResults && filteredItems.length > 0 ? (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                right: 0,
                borderRadius: 18,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-lg)',
                overflow: 'hidden',
              }}
            >
              {filteredItems.map((item) => (
                <button
                  key={item.to}
                  onMouseDown={() => {
                    navigate(item.to);
                    setQuery('');
                    setShowResults(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    background: 'transparent',
                    padding: '12px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-2)',
                    cursor: 'pointer',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <Button variant="secondary" size="md" onClick={toggle} leadingIcon={dark ? <IconSun size={15} /> : <IconMoon size={15} />}>
          {!isMobile ? (dark ? 'Light' : 'Dark') : null}
        </Button>

        <div ref={bellRef} style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setBellOpen((current) => !current);
              setProfileOpen(false);
            }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 16,
              border: '1px solid var(--border)',
              background: bellOpen ? 'var(--bg-hover)' : 'var(--bg-card)',
              color: 'var(--text-1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            <IconBell size={16} />
            {stats.unread ? (
              <span
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  minWidth: 17,
                  height: 17,
                  padding: '0 4px',
                  borderRadius: 999,
                  background: '#c67c4e',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {stats.unread > 99 ? '99+' : stats.unread}
              </span>
            ) : null}
          </button>

          {bellOpen ? (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: 'min(380px, calc(100vw - 32px))',
                borderRadius: 22,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-lg)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: 16, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)' }}>Notifications</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-3)' }}>{stats.unread} unread</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => markAllRead({ silent: true })} disabled={!stats.unread || busyId === 'all'}>
                  Mark all as read
                </Button>
              </div>

              <div style={{ maxHeight: 360, overflowY: 'auto', padding: 12, display: 'grid', gap: 8 }}>
                {notifications.length ? notifications.map((notification) => {
                  const Icon = notificationIconMap[notification.type] || IconBell;
                  const visual = notificationVisualMap[notification.type] || notificationVisualMap.info;

                  return (
                    <button
                      key={notification.id}
                      onClick={async () => {
                        await markOneRead(notification, { silent: true });
                        setBellOpen(false);
                        if (notification.link) navigate(notification.link);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        border: '1px solid var(--border)',
                        background: notification.isRead ? 'var(--bg-card)' : 'linear-gradient(90deg, rgba(198,124,78,0.08), transparent)',
                        borderRadius: 18,
                        padding: 14,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 12,
                            background: visual.background,
                            color: visual.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={15} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: notification.isRead ? 600 : 800, color: 'var(--text-1)', lineHeight: 1.45 }}>
                            {notification.message}
                          </div>
                          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <Badge tone={visual.color} background={visual.background}>{notification.type}</Badge>
                            {!notification.isRead ? <Badge>Unread</Badge> : null}
                            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{formatRelativeTime(notification.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                }) : (
                  <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>
                    No notifications yet.
                  </div>
                )}
              </div>

              <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
                <Button variant="secondary" fullWidth onClick={() => { setBellOpen(false); navigate('/admin/notifications'); }}>
                  View all notifications
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <div ref={profileRef} style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setProfileOpen((current) => !current);
              setBellOpen(false);
            }}
            style={{
              minWidth: 44,
              height: 44,
              borderRadius: 16,
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '0 10px 0 8px',
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(198,124,78,0.9), rgba(130,68,30,0.9))',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {initials}
            </span>
            {!isMobile ? (
              <>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{displayName}</span>
                <IconChevronD size={14} style={{ color: 'var(--text-3)' }} />
              </>
            ) : null}
          </button>

          {profileOpen ? (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: 250,
                borderRadius: 18,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-lg)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)' }}>{displayName}</div>
                <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-3)' }}>
                  {user?.role === 'superadmin' ? 'Super Admin' : user?.role}
                </div>
              </div>
              <div style={{ padding: 10, display: 'grid', gap: 4 }}>
                <button style={menuButtonStyle} onClick={() => setProfileOpen(false)}>
                  <IconUser size={15} /> Profile
                </button>
                <button style={menuButtonStyle} onClick={() => setProfileOpen(false)}>
                  <IconSettings size={15} /> Preferences
                </button>
                <button
                  style={{ ...menuButtonStyle, color: '#ef4444' }}
                  onClick={() => {
                    logoutUser();
                    navigate('/login');
                  }}
                >
                  <IconLogout size={15} /> Sign out
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

const menuButtonStyle = {
  minHeight: 42,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  border: 'none',
  borderRadius: 12,
  background: 'transparent',
  color: 'var(--text-2)',
  padding: '0 12px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};
