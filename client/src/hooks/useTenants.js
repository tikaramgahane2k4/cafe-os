import { startTransition, useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  createTenant,
  deleteTenant,
  fetchTenants,
  updateTenantStatus,
} from '../services/adminApi';
import { emptyTenantDraft } from '../utils/adminConstants';
import { isExpiringSoon } from '../utils/adminFormat';
import { useDebouncedValue } from './useDebouncedValue';

const defaultFilters = {
  search: '',
  status: 'ALL',
  sort: 'createdAt',
  order: 'desc',
  page: 1,
  limit: 10,
};

export function useTenants(initialFilters = defaultFilters) {
  const [filters, setFilters] = useState(initialFilters);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });

  const debouncedSearch = useDebouncedValue(filters.search, 350);

  const query = useMemo(() => ({
    search: debouncedSearch,
    status: filters.status === 'ALL' ? '' : filters.status,
    sort: filters.sort,
    order: filters.order,
    page: filters.page,
    limit: filters.limit,
  }), [debouncedSearch, filters.limit, filters.order, filters.page, filters.sort, filters.status]);

  const loadTenants = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);

    try {
      setError(null);
      const response = await fetchTenants(query);
      setTenants(response.data || []);
      setMeta({
        total: response.total || 0,
        page: response.page || 1,
        pages: response.pages || 1,
      });
    } catch (fetchError) {
      console.error('[useTenants] Failed to load tenants', fetchError);
      setError(fetchError.message);

      if (!silent) {
        setTenants([]);
        setMeta({ total: 0, page: 1, pages: 1 });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  const updateFilters = useCallback((updater) => {
    startTransition(() => {
      setFilters((current) => {
        const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
        return next;
      });
    });
  }, []);

  const createTenantRecord = useCallback(async (payload) => {
    setSaving(true);

    try {
      const response = await createTenant(payload);
      toast.success('Tenant created');
      await loadTenants({ silent: true });
      return response;
    } catch (createError) {
      console.error('[useTenants] Failed to create tenant', createError);
      toast.error(createError.message);
      throw createError;
    } finally {
      setSaving(false);
    }
  }, [loadTenants]);

  const updateTenantLifecycle = useCallback(async (tenantId, status) => {
    setSaving(true);

    try {
      await updateTenantStatus(tenantId, status);
      toast.success(`Tenant ${status.toLowerCase()}`);
      await loadTenants({ silent: true });
    } catch (updateError) {
      console.error('[useTenants] Failed to update tenant status', updateError);
      toast.error(updateError.message);
      throw updateError;
    } finally {
      setSaving(false);
    }
  }, [loadTenants]);

  const deleteTenantRecord = useCallback(async (tenantId) => {
    setSaving(true);

    try {
      await deleteTenant(tenantId);
      toast.success('Tenant deleted');
      await loadTenants({ silent: true });
    } catch (deleteError) {
      console.error('[useTenants] Failed to delete tenant', deleteError);
      toast.error(deleteError.message);
      throw deleteError;
    } finally {
      setSaving(false);
    }
  }, [loadTenants]);

  const tenantStats = useMemo(() => ({
    total: meta.total,
    active: tenants.filter((tenant) => tenant.status === 'Active').length,
    expiringSoon: tenants.filter((tenant) => isExpiringSoon(tenant.planExpiryDate)).length,
    highUsage: tenants.filter((tenant) => (tenant.orderLimit > 0 ? (tenant.ordersUsed / tenant.orderLimit) : 0) >= 0.8).length,
  }), [meta.total, tenants]);

  return {
    tenants,
    tenantStats,
    loading,
    error,
    saving,
    filters,
    meta,
    emptyDraft: emptyTenantDraft,
    setFilters: updateFilters,
    refresh: loadTenants,
    createTenantRecord,
    updateTenantLifecycle,
    deleteTenantRecord,
  };
}
