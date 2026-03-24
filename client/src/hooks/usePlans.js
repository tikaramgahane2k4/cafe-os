import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  createPlan,
  deletePlan,
  fetchPlanDistribution,
  fetchPlans,
  updatePlan,
} from '../services/adminApi';
import { emptyPlanDraft } from '../utils/adminConstants';

export function usePlans() {
  const [plans, setPlans] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [featureCatalog, setFeatureCatalog] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadPlans = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);

    try {
      setError(null);
      const [plansResponse, distributionResponse] = await Promise.all([
        fetchPlans(),
        fetchPlanDistribution(),
      ]);

      setPlans(plansResponse.data || []);
      setDistribution(distributionResponse.data || []);
      setFeatureCatalog(plansResponse.featureCatalog || {});
    } catch (fetchError) {
      console.error('[usePlans] Failed to load plans', fetchError);
      setError(fetchError.message);

      if (!silent) {
        setPlans([]);
        setDistribution([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const createPlanRecord = useCallback(async (payload) => {
    setSaving(true);

    try {
      await createPlan(payload);
      toast.success('Plan created');
      await loadPlans({ silent: true });
    } catch (createError) {
      console.error('[usePlans] Failed to create plan', createError);
      toast.error(createError.message);
      throw createError;
    } finally {
      setSaving(false);
    }
  }, [loadPlans]);

  const updatePlanRecord = useCallback(async (planId, payload) => {
    setSaving(true);

    try {
      await updatePlan(planId, payload);
      toast.success('Plan updated');
      await loadPlans({ silent: true });
    } catch (updateError) {
      console.error('[usePlans] Failed to update plan', updateError);
      toast.error(updateError.message);
      throw updateError;
    } finally {
      setSaving(false);
    }
  }, [loadPlans]);

  const deletePlanRecord = useCallback(async (planId) => {
    setSaving(true);

    try {
      await deletePlan(planId);
      toast.success('Plan deleted');
      await loadPlans({ silent: true });
    } catch (deleteError) {
      console.error('[usePlans] Failed to delete plan', deleteError);
      toast.error(deleteError.message);
      throw deleteError;
    } finally {
      setSaving(false);
    }
  }, [loadPlans]);

  const countByPlan = useMemo(
    () => Object.fromEntries(distribution.map(({ plan, count }) => [plan, count])),
    [distribution],
  );

  return {
    plans,
    distribution,
    countByPlan,
    featureCatalog,
    loading,
    saving,
    error,
    emptyDraft: emptyPlanDraft,
    refresh: loadPlans,
    createPlanRecord,
    updatePlanRecord,
    deletePlanRecord,
  };
}
