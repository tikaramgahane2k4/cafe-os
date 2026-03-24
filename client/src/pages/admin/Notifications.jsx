import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/layout/PageHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import MetricCard from '../../components/ui/MetricCard';
import { useNotifications } from '../../hooks/useNotifications';
import {
  notificationReadOptions,
  notificationTypeOptions,
  notificationVisualMap,
} from '../../utils/adminConstants';
import { formatDateTime } from '../../utils/adminFormat';
import {
  IconAlert,
  IconBell,
  IconCheck,
  IconX,
} from '../../components/admin/icons';

const pageSize = 12;

const fieldStyle = {
  width: '100%',
  minHeight: 44,
  borderRadius: 14,
  border: '1px solid var(--border)',
  background: 'var(--bg-base)',
  color: 'var(--text-1)',
  padding: '0 14px',
  boxSizing: 'border-box',
  fontSize: 13,
};

const labelStyle = {
  fontSize: 11,
  fontWeight: 800,
  color: 'var(--text-3)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: 6,
  display: 'block',
};

const iconMap = {
  info: IconBell,
  success: IconCheck,
  warning: IconAlert,
  error: IconX,
};

export default function Notifications() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ type: 'ALL', read: 'ALL' });
  const {
    notifications,
    stats,
    loading,
    error,
    busyId,
    markAllRead,
    markOneRead,
  } = useNotifications({
    page,
    limit: pageSize,
    type: filters.type,
    read: filters.read,
  });

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="Events"
        title="Notifications"
        subtitle="The single source of truth for tenant, billing, plan, and feature events across the Super Admin workspace."
        actions={<Button variant="ghost" onClick={() => markAllRead()} disabled={!stats.unread || busyId === 'all'}>Mark all as read</Button>}
      />

      {error ? (
        <Card>
          <div style={{ color: '#ef4444', fontSize: 13 }}>{error}</div>
        </Card>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 18 }}>
        <MetricCard label="Total notifications" value={stats.total} subtitle="System events stored in the notification center" accent="#c67c4e" icon="🔔" />
        <MetricCard label="Unread" value={stats.unread} subtitle="Items that still need acknowledgement" accent="#ef4444" icon="🆕" />
        <MetricCard label="Current page" value={`${stats.page}/${stats.pages}`} subtitle={`Showing ${pageSize} notifications per page`} accent="#3b82f6" icon="📄" />
      </div>

      <Card title="Notification feed" subtitle="Filter by type and read state, then drill into the source screen from each item.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Type</label>
            <select
              value={filters.type}
              onChange={(event) => {
                setPage(1);
                setFilters((current) => ({ ...current, type: event.target.value }));
              }}
              style={fieldStyle}
            >
              {notificationTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Read state</label>
            <select
              value={filters.read}
              onChange={(event) => {
                setPage(1);
                setFilters((current) => ({ ...current, read: event.target.value }));
              }}
              style={fieldStyle}
            >
              {notificationReadOptions.map((state) => <option key={state} value={state}>{state}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 24, fontSize: 13, color: 'var(--text-3)' }}>Loading notifications...</div>
        ) : notifications.length ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {notifications.map((notification) => {
              const Icon = iconMap[notification.type] || IconBell;
              const visual = notificationVisualMap[notification.type] || notificationVisualMap.info;

              return (
                <div
                  key={notification.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                    border: '1px solid var(--border)',
                    borderRadius: 18,
                    padding: 16,
                    background: notification.isRead ? 'var(--bg-card)' : 'linear-gradient(90deg, rgba(198,124,78,0.08), transparent)',
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: visual.background, color: visual.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: notification.isRead ? 600 : 800, color: 'var(--text-1)', lineHeight: 1.45 }}>
                          {notification.message}
                        </div>
                        <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          <Badge tone={visual.color} background={visual.background}>{notification.type}</Badge>
                          {!notification.isRead ? <Badge>Unread</Badge> : null}
                          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{formatDateTime(notification.timestamp)}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markOneRead(notification)}
                          disabled={busyId === notification.id || notification.isRead}
                        >
                          {notification.isRead ? 'Read' : 'Mark as read'}
                        </Button>
                        {notification.link ? (
                          <Button
                            size="sm"
                            onClick={async () => {
                              await markOneRead(notification, { silent: true });
                              navigate(notification.link);
                            }}
                          >
                            Open source
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon="🔔"
            title="No notifications"
            subtitle="This feed is now the single source of truth for alerts and system events."
          />
        )}

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
            Showing page {stats.page} of {stats.pages}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={stats.page <= 1}>
              Previous
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setPage((current) => Math.min(stats.pages, current + 1))} disabled={stats.page >= stats.pages}>
              Next
            </Button>
          </div>
        </div>
      </Card>
    </AdminLayout>
  );
}
