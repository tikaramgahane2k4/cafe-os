import { useCallback, useEffect, useState } from 'react';
import { fetchAnalytics, fetchBillingSummary } from '../services/adminApi';
import { useNotificationsCenter } from '../context/NotificationsContext';

export function useDashboardOverview() {
  const notificationCenter = useNotificationsCenter();
  const [analytics, setAnalytics] = useState(null);
  const [billingSummary, setBillingSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOverview = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);

    try {
      setError(null);
      const [analyticsResponse, billingResponse] = await Promise.all([
        fetchAnalytics(),
        fetchBillingSummary(),
      ]);

      setAnalytics(analyticsResponse.data || null);
      setBillingSummary(billingResponse.data || null);
    } catch (fetchError) {
      console.error('[useDashboardOverview] Failed to load dashboard overview', fetchError);
      setError(fetchError.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();

    const timer = setInterval(() => {
      loadOverview({ silent: true });
    }, 30000);

    return () => clearInterval(timer);
  }, [loadOverview]);

  return {
    analytics,
    billingSummary,
    loading,
    error,
    refresh: loadOverview,
    unreadNotifications: notificationCenter.stats?.unread || 0,
  };
}
