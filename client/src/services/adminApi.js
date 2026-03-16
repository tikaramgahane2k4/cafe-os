const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

/**
 * Centralized fetch helper.
 * - Prepends BASE_URL to every path
 * - Always sends / expects JSON
 * - Throws a plain Error with a human-readable message on failure
 */
export async function apiFetch(path, { method = 'GET', body, headers = {} } = {}) {
  const url = `${BASE_URL}${path}`;
  const init = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  if (body !== undefined) init.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(url, init);
  } catch (networkErr) {
    // Covers "Failed to fetch" (server down, CORS preflight blocked, etc.)
    throw new Error(
      'Cannot reach the server. Make sure the backend is running on port 5000.',
    );
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server returned an unexpected response (HTTP ${res.status}).`);
  }

  if (!res.ok) {
    throw new Error(data?.message || `Request failed with status ${res.status}.`);
  }

  return data;
}

// ────── Tenants ──────
export const fetchTenants = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/admin/tenants${query ? '?' + query : ''}`);
};

export const fetchTenantById = (id) => apiFetch(`/admin/tenants/${id}`);

export const createTenant = (data) =>
  apiFetch('/admin/tenants', { method: 'POST', body: data });

export const updateTenant = (id, data) =>
  apiFetch(`/admin/tenants/${id}`, { method: 'PATCH', body: data });

export const updateTenantStatus = (id, status) =>
  apiFetch(`/admin/tenants/${id}/status`, { method: 'PATCH', body: { status } });

// Track tenant activity (updates lastActiveAt, optionally increments ordersUsed)
export const trackTenantActivity = (id, orders = 0) =>
  apiFetch(`/admin/tenants/${id}/activity`, { method: 'PATCH', body: { orders } });

export const deleteTenant = (id) =>
  apiFetch(`/admin/tenants/${id}`, { method: 'DELETE' });

// ────── Plans ──────
export const fetchPlans = () => apiFetch('/admin/plans');

export const fetchPlanDistribution = () => apiFetch('/admin/plans/distribution');

export const createPlan = (data) =>
  apiFetch('/admin/plans', { method: 'POST', body: data });

export const updatePlan = (id, data) =>
  apiFetch(`/admin/plans/${id}`, { method: 'PATCH', body: data });

export const deletePlan = (id) =>
  apiFetch(`/admin/plans/${id}`, { method: 'DELETE' });

// ────── Features ──────
export const fetchFeatures = () => apiFetch('/admin/features');

// Update any combination of { globalEnabled, plansEnabled, tenantOverrides }
export const updateFeature = (id, updates) =>
  apiFetch(`/admin/features/${id}`, { method: 'PATCH', body: updates });

// Resolve which feature keys are active for a specific tenant
export const resolveFeatureFlags = (tenantId, plan) =>
  apiFetch(`/admin/features/resolve?tenantId=${tenantId}&plan=${encodeURIComponent(plan)}`);

// ────── Admin Users ──────
export const fetchUsers = () => apiFetch('/admin/users');

export const fetchRolePermissions = () => apiFetch('/admin/users/role-permissions');

export const createUser = (data) =>
  apiFetch('/admin/users', { method: 'POST', body: data });

export const updateUser = (id, data) =>
  apiFetch(`/admin/users/${id}`, { method: 'PATCH', body: data });

export const deleteUser = (id) =>
  apiFetch(`/admin/users/${id}`, { method: 'DELETE' });

// ────── Logs ──────
export const fetchLogs = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/admin/logs${query ? '?' + query : ''}`);
};

// ────── Analytics ──────
export const fetchAnalytics = () => apiFetch('/admin/analytics');

export const fetchTenantUsage = () => apiFetch('/admin/analytics/tenant-usage');

// ────── Alerts ──────
export const fetchAlerts = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/admin/alerts${query ? '?' + query : ''}`);
};

export const updateAlertStatus = (id, status) =>
  apiFetch(`/admin/alerts/${id}/status`, { method: 'PATCH', body: { status } });

// ────── Invoices / Billing ──────
export const fetchInvoices = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/admin/invoices${query ? '?' + query : ''}`);
};

export const createInvoice = (data) =>
  apiFetch('/admin/invoices', { method: 'POST', body: data });

export const updateInvoice = (id, data) =>
  apiFetch(`/admin/invoices/${id}`, { method: 'PATCH', body: data });

export const fetchBillingSummary = () => apiFetch('/admin/invoices/summary');

export const seedInvoices = () => apiFetch('/admin/invoices/seed', { method: 'POST' });

