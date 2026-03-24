import { apiRequest } from './api';

function withQuery(path, params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== '' && value !== undefined && value !== null) {
        acc[key] = value;
      }

      return acc;
    }, {}),
  ).toString();

  return query ? `${path}?${query}` : path;
}

export const fetchTenants = (params = {}) => apiRequest({ url: withQuery('/admin/tenants', params) });
export const fetchTenantById = (id) => apiRequest({ url: `/admin/tenants/${id}` });
export const createTenant = (data) => apiRequest({ url: '/admin/tenants', method: 'post', data });
export const updateTenant = (id, data) => apiRequest({ url: `/admin/tenants/${id}`, method: 'patch', data });
export const updateTenantStatus = (id, status) => apiRequest({ url: `/admin/tenants/${id}/status`, method: 'patch', data: { status } });
export const trackTenantActivity = (id, orders = 0) => apiRequest({ url: `/admin/tenants/${id}/activity`, method: 'patch', data: { orders } });
export const deleteTenant = (id) => apiRequest({ url: `/admin/tenants/${id}`, method: 'delete' });

export const fetchPlans = () => apiRequest({ url: '/admin/plans' });
export const fetchPlanDistribution = () => apiRequest({ url: '/admin/plans/distribution' });
export const createPlan = (data) => apiRequest({ url: '/admin/plans', method: 'post', data });
export const updatePlan = (id, data) => apiRequest({ url: `/admin/plans/${id}`, method: 'patch', data });
export const deletePlan = (id) => apiRequest({ url: `/admin/plans/${id}`, method: 'delete' });

export const fetchFeatures = (params = {}) => apiRequest({ url: withQuery('/admin/features', params) });
export const fetchFeatureImpact = (id, params = {}) => apiRequest({ url: withQuery(`/admin/features/${id}/impact`, params) });
export const previewFeatureUpdate = (id, data) => apiRequest({ url: `/admin/features/${id}/preview`, method: 'post', data });
export const updateFeature = (id, updates) => apiRequest({ url: `/admin/features/${id}`, method: 'patch', data: updates });
export const searchFeatureTenants = (params = {}) => apiRequest({ url: withQuery('/admin/features/tenants/search', params) });
export const resolveFeatureFlags = (tenantId, plan) => apiRequest({
  url: withQuery('/admin/features/resolve', { tenantId, plan }),
});

export const fetchUsers = () => apiRequest({ url: '/admin/users' });
export const fetchRolePermissions = () => apiRequest({ url: '/admin/users/role-permissions' });
export const createUser = (data) => apiRequest({ url: '/admin/users', method: 'post', data });
export const updateUser = (id, data) => apiRequest({ url: `/admin/users/${id}`, method: 'patch', data });
export const deleteUser = (id) => apiRequest({ url: `/admin/users/${id}`, method: 'delete' });

export const fetchLogs = (params = {}) => apiRequest({ url: withQuery('/admin/logs', params) });
export const fetchAnalytics = (params = {}) => apiRequest({ url: withQuery('/admin/analytics', params) });
export const fetchTenantUsage = () => apiRequest({ url: '/admin/analytics/tenant-usage' });

export const fetchNotifications = (params = {}) => apiRequest({ url: withQuery('/admin/notifications', params) });
export const markNotificationRead = (id) => apiRequest({ url: `/admin/notifications/${id}/read`, method: 'patch' });
export const markAllNotificationsRead = () => apiRequest({ url: '/admin/notifications/read-all', method: 'patch' });

export const fetchInvoices = (params = {}) => apiRequest({ url: withQuery('/admin/invoices', params) });
export const createInvoice = (data) => apiRequest({ url: '/admin/invoices', method: 'post', data });
export const updateInvoice = (id, data) => apiRequest({ url: `/admin/invoices/${id}`, method: 'patch', data });
export const fetchBillingSummary = (params = {}) => apiRequest({ url: withQuery('/admin/invoices/summary', params) });
export const fetchTenantBillingDetails = (tenantId) => apiRequest({ url: `/admin/invoices/tenant/${tenantId}/details` });
export const seedInvoices = () => apiRequest({ url: '/admin/invoices/seed', method: 'post' });
