import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  createInvoice,
  fetchBillingSummary,
  fetchInvoices,
  fetchTenantBillingDetails,
  fetchTenants,
  seedInvoices,
  updateInvoice,
} from '../services/adminApi';
import {
  defaultBillingFilters,
  emptyInvoiceDraft,
} from '../utils/adminConstants';
import {
  hasBillingFilters,
  toInputDate,
} from '../utils/adminFormat';
import { usePlanCatalog } from './usePlanCatalog';

function cloneBillingFilters(source = defaultBillingFilters) {
  return {
    dateFrom: source?.dateFrom || '',
    dateTo: source?.dateTo || '',
    planName: source?.planName || 'ALL',
    status: source?.status || 'ALL',
  };
}

function areBillingFiltersEqual(left, right) {
  const a = cloneBillingFilters(left);
  const b = cloneBillingFilters(right);

  return (
    a.dateFrom === b.dateFrom
    && a.dateTo === b.dateTo
    && a.planName === b.planName
    && a.status === b.status
  );
}

export function useBilling() {
  const {
    plans: availablePlans,
    planNames,
    planPriceLookup,
    loading: planCatalogLoading,
  } = usePlanCatalog();
  const [filters, setFiltersState] = useState(() => cloneBillingFilters());
  const [appliedFilters, setAppliedFilters] = useState(() => cloneBillingFilters());
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [tenantDetails, setTenantDetails] = useState(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [actionKey, setActionKey] = useState('');
  const [saving, setSaving] = useState(false);

  const setFilters = useCallback((updater) => {
    setFiltersState((current) => cloneBillingFilters(
      typeof updater === 'function'
        ? updater(current)
        : updater,
    ));
  }, []);

  const loadBilling = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);

    try {
      setError(null);

      const [invoiceResponse, summaryResponse, tenantResponse] = await Promise.all([
        fetchInvoices({ page: 1, limit: 300, ...appliedFilters }),
        fetchBillingSummary(appliedFilters),
        fetchTenants({ page: 1, limit: 500 }),
      ]);

      setInvoices(invoiceResponse.data || []);
      setSummary(summaryResponse.data || null);
      setTenants(tenantResponse.data || []);
    } catch (fetchError) {
      console.error('[useBilling] Failed to load billing data', fetchError);
      setError(fetchError.message);

      if (!silent) {
        setInvoices([]);
        setSummary(null);
        setTenants([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  useEffect(() => {
    if (!invoices.length) {
      setSelectedInvoiceId(null);
      setTenantDetails(null);
      return;
    }

    if (!invoices.some((invoice) => invoice._id === selectedInvoiceId)) {
      setSelectedInvoiceId(invoices[0]._id);
    }
  }, [invoices, selectedInvoiceId]);

  const selectedInvoice = useMemo(
    () => invoices.find((invoice) => invoice._id === selectedInvoiceId) || null,
    [invoices, selectedInvoiceId],
  );

  useEffect(() => {
    if (!selectedInvoice?.tenantId) {
      setTenantDetails(null);
      return;
    }

    let ignore = false;

    const loadTenantDetails = async () => {
      setDetailLoading(true);

      try {
        setDetailError(null);
        const response = await fetchTenantBillingDetails(selectedInvoice.tenantId);

        if (!ignore) {
          setTenantDetails(response.data || null);
        }
      } catch (fetchError) {
        console.error('[useBilling] Failed to load tenant billing details', fetchError);

        if (!ignore) {
          setDetailError(fetchError.message);
          setTenantDetails(null);
        }
      } finally {
        if (!ignore) setDetailLoading(false);
      }
    };

    loadTenantDetails();

    return () => {
      ignore = true;
    };
  }, [selectedInvoice?.tenantId]);

  const applyFilters = useCallback(() => {
    const nextFilters = cloneBillingFilters(filters);
    setAppliedFilters(nextFilters);

    if (areBillingFiltersEqual(nextFilters, appliedFilters)) {
      loadBilling({ silent: true });
    }
  }, [appliedFilters, filters, loadBilling]);

  const resetFilterFields = useCallback(() => {
    setFiltersState(cloneBillingFilters(appliedFilters));
  }, [appliedFilters]);

  const clearAppliedFilters = useCallback(() => {
    const clearedFilters = cloneBillingFilters();
    setFiltersState(clearedFilters);
    setAppliedFilters(clearedFilters);

    if (areBillingFiltersEqual(clearedFilters, appliedFilters)) {
      loadBilling({ silent: true });
    }
  }, [appliedFilters, loadBilling]);

  const seedDemoData = useCallback(async () => {
    setSaving(true);

    try {
      const response = await seedInvoices();
      toast.success(response?.seeded ? `Seeded ${response.seeded} invoices` : 'Demo billing data already exists');
      await loadBilling({ silent: true });
    } catch (seedError) {
      console.error('[useBilling] Failed to seed invoice data', seedError);
      toast.error(seedError.message);
      throw seedError;
    } finally {
      setSaving(false);
    }
  }, [loadBilling]);

  const createInvoiceRecord = useCallback(async (payload) => {
    setSaving(true);

    try {
      await createInvoice(payload);
      toast.success('Invoice generated');
      await loadBilling({ silent: true });
    } catch (createError) {
      console.error('[useBilling] Failed to create invoice', createError);
      toast.error(createError.message);
      throw createError;
    } finally {
      setSaving(false);
    }
  }, [loadBilling]);

  const runInvoiceAction = useCallback(async (invoice, type) => {
    const currentActionKey = `${type}:${invoice._id}`;
    setActionKey(currentActionKey);

    try {
      if (type === 'markPaid') {
        await updateInvoice(invoice._id, { action: 'markPaid' });
        toast.success(`${invoice.invoiceNumber} marked as paid`);
      }

      if (type === 'retryPayment') {
        await updateInvoice(invoice._id, {
          action: 'retryPayment',
          note: 'Retry initiated from billing control panel.',
        });
        toast.success(`Retry queued for ${invoice.invoiceNumber}`);
      }

      await loadBilling({ silent: true });
    } catch (actionError) {
      console.error('[useBilling] Failed to run invoice action', actionError);
      toast.error(actionError.message);
      throw actionError;
    } finally {
      setActionKey('');
    }
  }, [loadBilling]);

  const trendPoints = useMemo(
    () => (summary?.trend?.some((point) => point.revenue > 0) ? summary.trend : []),
    [summary],
  );

  const featuredPlans = useMemo(() => {
    const planBreakdown = summary?.revenueByPlan || [];
    const fallbackPlans = planBreakdown.map((plan) => ({
      planName: plan.plan,
      price: plan.unitPrice || 0,
    }));
    const planCards = (availablePlans.length ? availablePlans : fallbackPlans)
      .filter((plan) => plan?.planName)
      .map((plan) => ({
        label: plan.planName,
        fallbackUnitPrice: Number(plan.price || 0),
      }));

    return planCards.map(({ label, fallbackUnitPrice }) => {
      const matchedPlan = planBreakdown.find((item) => item.plan === label);

      return {
        plan: label,
        tenantCount: matchedPlan?.tenantCount || 0,
        activeTenants: matchedPlan?.activeTenants || matchedPlan?.tenantCount || 0,
        unitPrice: matchedPlan?.unitPrice ?? fallbackUnitPrice,
        revenue: matchedPlan?.revenue || 0,
      };
    });
  }, [availablePlans, summary]);

  const filterPlanNames = useMemo(
    () => [...new Set([
      ...planNames,
      ...(summary?.revenueByPlan || []).map((plan) => plan.plan).filter(Boolean),
      ...invoices.map((invoice) => invoice.planName).filter(Boolean),
      ...tenants.map((tenant) => tenant.subscriptionPlan).filter(Boolean),
    ])],
    [invoices, planNames, summary, tenants],
  );

  const invoiceDraftFactory = useCallback((tenant) => ({
    ...emptyInvoiceDraft,
    tenantId: tenant?._id || '',
    tenantName: tenant?.cafeName || '',
    planName: tenant?.subscriptionPlan || availablePlans[0]?.planName || '',
    amount: planPriceLookup[tenant?.subscriptionPlan] ?? Number(availablePlans[0]?.price || 0),
    billingDate: toInputDate(),
  }), [availablePlans, planPriceLookup]);

  const isFilterDirty = useMemo(
    () => !areBillingFiltersEqual(filters, appliedFilters),
    [appliedFilters, filters],
  );

  return {
    invoices,
    summary,
    tenants,
    tenantDetails,
    selectedInvoice,
    selectedInvoiceId,
    trendPoints,
    featuredPlans,
    availablePlans,
    filterPlanNames,
    loading,
    planCatalogLoading,
    error,
    detailLoading,
    detailError,
    saving,
    actionKey,
    filters,
    appliedFilters,
    setFilters,
    setSelectedInvoiceId,
    applyFilters,
    resetFilterFields,
    clearAppliedFilters,
    hasActiveFilters: hasBillingFilters(appliedFilters),
    isFilterDirty,
    refresh: loadBilling,
    seedDemoData,
    createInvoiceRecord,
    runInvoiceAction,
    invoiceDraftFactory,
  };
}
