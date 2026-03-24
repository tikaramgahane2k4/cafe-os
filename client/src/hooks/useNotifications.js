import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/adminApi';

const emptyStats = { total: 0, unread: 0, page: 1, pages: 1 };

export function useNotifications({
  page = 1,
  limit = 12,
  type = 'ALL',
  read = 'ALL',
  autoRefresh = false,
  pollMs = 30000,
} = {}) {
  const [payload, setPayload] = useState({ data: [], stats: emptyStats });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState('');

  const loadNotifications = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);

    try {
      setError(null);
      const response = await fetchNotifications({ page, limit, type, read });
      setPayload({
        data: response.data || [],
        stats: response.stats || { ...emptyStats, page, pages: 1 },
      });
    } catch (fetchError) {
      console.error('[useNotifications] Failed to load notifications', fetchError);
      setError(fetchError.message);

      if (!silent) {
        setPayload({ data: [], stats: { ...emptyStats, page, pages: 1 } });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [limit, page, read, type]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!autoRefresh) return undefined;

    const timer = setInterval(() => {
      loadNotifications({ silent: true });
    }, pollMs);

    return () => clearInterval(timer);
  }, [autoRefresh, loadNotifications, pollMs]);

  const markOneRead = useCallback(async (notification, { silent = false } = {}) => {
    if (!notification || notification.isRead) return notification;

    setBusyId(notification.id);

    try {
      const response = await markNotificationRead(notification.id);

      setPayload((current) => {
        const shouldFilterOut = read === 'UNREAD';
        const nextData = shouldFilterOut
          ? current.data.filter((item) => item.id !== notification.id)
          : current.data.map((item) => (
            item.id === notification.id ? { ...item, isRead: true } : item
          ));
        const unread = Math.max(0, (current.stats.unread || 0) - 1);
        const total = shouldFilterOut
          ? Math.max(0, (current.stats.total || 0) - 1)
          : current.stats.total;

        return {
          data: nextData,
          stats: {
            ...current.stats,
            unread,
            total,
            pages: Math.max(1, Math.ceil(total / limit)),
          },
        };
      });

      if (!silent) toast.success('Notification marked as read');
      return response.data;
    } catch (markError) {
      console.error('[useNotifications] Failed to mark notification read', markError);
      if (!silent) toast.error(markError.message);
      throw markError;
    } finally {
      setBusyId('');
    }
  }, [limit, read]);

  const markAllRead = useCallback(async ({ silent = false } = {}) => {
    setBusyId('all');

    try {
      await markAllNotificationsRead();

      setPayload((current) => {
        const total = read === 'UNREAD' ? 0 : current.stats.total;

        return {
          data: read === 'UNREAD' ? [] : current.data.map((item) => ({ ...item, isRead: true })),
          stats: {
            ...current.stats,
            unread: 0,
            total,
            pages: Math.max(1, Math.ceil(total / limit)),
          },
        };
      });

      if (!silent) toast.success('All notifications marked as read');
    } catch (markError) {
      console.error('[useNotifications] Failed to mark all notifications read', markError);
      if (!silent) toast.error(markError.message);
      throw markError;
    } finally {
      setBusyId('');
    }
  }, [limit, read]);

  return {
    notifications: payload.data,
    stats: payload.stats,
    loading,
    error,
    busyId,
    refresh: loadNotifications,
    markOneRead,
    markAllRead,
  };
}
