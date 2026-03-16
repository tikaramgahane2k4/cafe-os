import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  IconSearch, IconBell, IconSun, IconMoon, IconUser,
  IconSettings, IconLogout, IconChevronD, IconX,
} from './icons';

const SEARCHES = [
  { label: 'Dashboard',      to: '/admin/dashboard' },
  { label: 'Tenants',        to: '/admin/tenants' },
  { label: 'Subscriptions',  to: '/admin/subscriptions' },
  { label: 'Analytics',      to: '/admin/analytics' },
  { label: 'Feature Flags',  to: '/admin/feature-flags' },
  { label: 'Users & Roles',  to: '/admin/users' },
  { label: 'Activity Logs',  to: '/admin/logs' },
];

const NOTIFS = [
  { id: 1, text: 'New tenant "Brew & Bean" registered', time: '2m ago', unread: true },
  { id: 2, text: 'Plan "Pro" updated by admin@cafe.os', time: '18m ago', unread: true },
  { id: 3, text: 'Feature "CRM System" enabled',        time: '1h ago',  unread: false },
];

export default function Header({ sidebarOpen }) {
  const { dark, toggle } = useTheme();
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState('');
  const [searchFocus, setSearchFocus] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const bellRef = useRef(null);
  const profileRef = useRef(null);
  const searchRef = useRef(null);

  const sidebarW = sidebarOpen ? '240px' : '64px';
  const unreadCount = NOTIFS.filter((n) => n.unread).length;
  const displayName = user?.name || user?.email || 'User';
  const displayRole = user?.role === 'superadmin' ? 'Super Admin' : (user?.role || 'User');
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase() || 'U';

  const filteredSuggestions = searchVal
    ? SEARCHES.filter((s) => s.label.toLowerCase().includes(searchVal.toLowerCase()))
    : [];

  // close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // global keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const headerBase = {
    position: 'fixed', top: 0, left: sidebarW, right: 0, height: '60px', zIndex: 30,
    display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px',
    background: dark ? 'rgba(44,31,26,0.92)' : 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border)',
    transition: 'left 0.22s cubic-bezier(.4,0,.2,1)',
    boxShadow: 'var(--shadow-sm)',
  };

  return (
    <header style={headerBase}>
      {/* Search */}
      <div style={{ flex: 1, maxWidth: 440, position: 'relative' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: dark ? 'var(--bg-hover)' : '#F7F0E8',
          border: `1px solid ${searchFocus ? '#C67C4E' : 'var(--border)'}`,
          borderRadius: 10, padding: '0 12px', height: 36,
          boxShadow: searchFocus ? '0 0 0 3px rgba(198,124,78,0.15)' : 'none',
          transition: 'all 0.15s',
        }}>
          <IconSearch size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search pages…"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onFocus={() => setSearchFocus(true)}
            onBlur={() => setTimeout(() => setSearchFocus(false), 150)}
            style={{
              border: 'none', background: 'transparent', outline: 'none',
              fontSize: 13, color: 'var(--text-1)', width: '100%',
            }}
          />
          {searchVal
            ? <button onClick={() => setSearchVal('')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', color: 'var(--text-3)' }}><IconX size={13} /></button>
            : <kbd style={{ fontSize: 10, color: 'var(--text-3)', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px', whiteSpace: 'nowrap' }}>⌘K</kbd>
          }
        </div>
        {/* Search dropdown */}
        {searchFocus && filteredSuggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 10, boxShadow: 'var(--shadow-lg)', zIndex: 50, overflow: 'hidden',
          }}>
            {filteredSuggestions.map((s) => (
              <button key={s.to} onMouseDown={() => { navigate(s.to); setSearchVal(''); }}
                style={{ display: 'block', width: '100%', padding: '9px 14px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, color: 'var(--text-2)', cursor: 'pointer', transition: 'background 0.1s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: dark ? '#f59e0b' : '#4B2E2B', transition: 'all 0.15s' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-card)')}
        >
          {dark ? <IconSun size={15} /> : <IconMoon size={15} />}
        </button>

        {/* Notification bell */}
        <div ref={bellRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setBellOpen((o) => !o); setProfileOpen(false); }}
            style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid var(--border)', background: bellOpen ? 'var(--bg-hover)' : 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', position: 'relative', transition: 'all 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = bellOpen ? 'var(--bg-hover)' : 'var(--bg-card)')}
          >
            <IconBell size={15} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: 4, right: 4, width: 14, height: 14, background: '#C67C4E', borderRadius: '50%', fontSize: 9, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {unreadCount}
              </span>
            )}
          </button>
          {bellOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 300, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', zIndex: 50, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-1)' }}>Notifications</span>
                <span style={{ fontSize: 11, color: '#C67C4E', fontWeight: 700 }}>{unreadCount} new</span>
              </div>
              {NOTIFS.map((n) => (
                <div key={n.id} style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', background: n.unread ? (dark ? 'rgba(198,124,78,0.06)' : 'rgba(198,124,78,0.04)') : 'transparent', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: n.unread ? '#C67C4E' : 'transparent', flexShrink: 0, marginTop: 4 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-1)', lineHeight: 1.4 }}>{n.text}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>{n.time}</div>
                  </div>
                </div>
              ))}
              <div style={{ padding: '10px 16px', textAlign: 'center' }}>
                <button style={{ fontSize: 12, color: '#C67C4E', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>View all notifications</button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setProfileOpen((o) => !o); setBellOpen(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 10px 5px 5px', background: profileOpen ? 'var(--bg-hover)' : 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 9, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = profileOpen ? 'var(--bg-hover)' : 'var(--bg-card)')}
          >
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #C67C4E, #E09A6E)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 10 }}>{initials}</div>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>{displayRole}</span>
            <IconChevronD size={12} style={{ color: 'var(--text-3)' }} />
          </button>
          {profileOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 180, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 11, boxShadow: 'var(--shadow-lg)', zIndex: 50, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{displayName}</div>
                {user?.email && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{user.email}</div>}
              </div>
              {[
                { icon: <IconUser size={13} />, label: 'Profile' },
                { icon: <IconSettings size={13} />, label: 'Settings' },
                { sep: true },
                { icon: <IconLogout size={13} />, label: 'Sign out', danger: true },
              ].map((item, i) =>
                item.sep
                  ? <div key={i} style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                  : (
                    <button key={i}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, color: item.danger ? '#ef4444' : 'var(--text-2)', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = item.danger ? 'rgba(239,68,68,0.06)' : 'var(--bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                      onClick={() => {
                        if (item.label === 'Sign out') {
                          logoutUser();
                          navigate('/login', { replace: true });
                        }
                        setProfileOpen(false);
                      }}
                    >
                      {item.icon}{item.label}
                    </button>
                  )
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
