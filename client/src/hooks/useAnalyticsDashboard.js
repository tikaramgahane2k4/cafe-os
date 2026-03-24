import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchAnalytics } from '../services/adminApi';
import { toInputDate } from '../utils/adminFormat';

function defaultCustomFilters() {
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - 29);

  return {
    range: '30d',
    dateFrom: toInputDate(start),
    dateTo: toInputDate(today),
  };
}

export function useAnalyticsDashboard() {
  const [filters, setFilters] = useState(defaultCustomFilters);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const query = useMemo(() => (
    filters.range === 'custom'
      ? filters
      : { range: filters.range }
  ), [filters]);

  const loadAnalytics = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);

    try {
      setError(null);
      const response = await fetchAnalytics(query);
      setData(response.data || null);
    } catch (fetchError) {
      console.error('[useAnalyticsDashboard] Failed to load analytics data', fetchError);
      setError(fetchError.message);
      if (!silent) setData(null);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    loadAnalytics();

    const timer = setInterval(() => {
      loadAnalytics({ silent: true });
    }, 30000);

    return () => clearInterval(timer);
  }, [loadAnalytics]);

  const setRange = useCallback((range) => {
    setFilters((current) => ({ ...current, range }));
  }, []);

  return {
    data,
    loading,
    error,
    filters,
    setFilters,
    setRange,
    refresh: loadAnalytics,
  };
}
