import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchPlans } from '../services/adminApi';

function comparePlans(left, right) {
  const leftPrice = Number(left?.price || 0);
  const rightPrice = Number(right?.price || 0);

  if (leftPrice !== rightPrice) return leftPrice - rightPrice;
  return String(left?.planName || '').localeCompare(String(right?.planName || ''));
}

function normalizePlans(rows = []) {
  const planMap = new Map();

  rows.forEach((row) => {
    const planName = String(row?.planName || '').trim();
    if (!planName) return;

    const current = planMap.get(planName);
    const nextPlan = {
      ...row,
      planName,
      price: Number(row?.price || 0),
      orderLimit: Number(row?.orderLimit || 0),
      staffLimit: Number(row?.staffLimit || 0),
    };

    if (!current) {
      planMap.set(planName, nextPlan);
      return;
    }

    const currentUpdatedAt = new Date(current.updatedAt || 0).getTime();
    const nextUpdatedAt = new Date(nextPlan.updatedAt || 0).getTime();

    if (
      current.planStatus !== 'Active' && nextPlan.planStatus === 'Active'
      || nextUpdatedAt > currentUpdatedAt
    ) {
      planMap.set(planName, nextPlan);
    }
  });

  return [...planMap.values()].sort(comparePlans);
}

export function usePlanCatalog() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPlans = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);

    try {
      setError(null);
      const response = await fetchPlans();
      setPlans(normalizePlans(response.data || []));
    } catch (fetchError) {
      console.error('[usePlanCatalog] Failed to load plans', fetchError);
      setError(fetchError.message);

      if (!silent) {
        setPlans([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const planNames = useMemo(
    () => plans.map((plan) => plan.planName).filter(Boolean),
    [plans],
  );

  const planPriceLookup = useMemo(
    () => Object.fromEntries(plans.map((plan) => [plan.planName, Number(plan.price || 0)])),
    [plans],
  );

  return {
    plans,
    planNames,
    planPriceLookup,
    loading,
    error,
    refresh: loadPlans,
  };
}
