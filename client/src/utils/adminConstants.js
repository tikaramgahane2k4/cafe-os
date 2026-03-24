export const tenantStatusOptions = ['Active', 'Suspended', 'Expired'];
export const invoiceStatusOptions = ['Paid', 'Pending', 'Failed', 'Overdue'];
export const invoiceFilterOptions = ['ALL', ...invoiceStatusOptions];
export const notificationTypeOptions = ['ALL', 'info', 'success', 'warning', 'error'];
export const notificationReadOptions = ['ALL', 'UNREAD', 'READ'];

export const planAccentMap = {
  Free: '#94a3b8',
  Starter: '#22c55e',
  Growth: '#d97706',
  Pro: '#c67c4e',
  Enterprise: '#0f766e',
};

export const statusAccentMap = {
  Active: '#22c55e',
  Suspended: '#f59e0b',
  Expired: '#ef4444',
  Paid: '#22c55e',
  Pending: '#f59e0b',
  Failed: '#ef4444',
  Overdue: '#f97316',
  info: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
};

export const notificationVisualMap = {
  info: { color: '#3b82f6', background: 'rgba(59,130,246,0.12)' },
  success: { color: '#22c55e', background: 'rgba(34,197,94,0.12)' },
  warning: { color: '#f59e0b', background: 'rgba(245,158,11,0.12)' },
  error: { color: '#ef4444', background: 'rgba(239,68,68,0.12)' },
};

export const defaultBillingFilters = {
  dateFrom: '',
  dateTo: '',
  planName: 'ALL',
  status: 'ALL',
};

export const emptyTenantDraft = {
  cafeName: '',
  ownerName: '',
  email: '',
  subscriptionPlan: '',
  status: 'Active',
};

export const emptyPlanDraft = {
  planName: '',
  price: '',
  featureList: [],
  orderLimit: 100,
  staffLimit: 5,
  planStatus: 'Active',
};

export const emptyInvoiceDraft = {
  tenantId: '',
  tenantName: '',
  planName: '',
  amount: 0,
  status: 'Pending',
  billingDate: '',
  paymentMethod: 'Card',
  notes: '',
};

export const adminSearchItems = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'Tenants', to: '/admin/tenants' },
  { label: 'Subscriptions', to: '/admin/subscriptions' },
  { label: 'Billing', to: '/admin/billing' },
  { label: 'Analytics', to: '/admin/analytics' },
  { label: 'Tenant Usage', to: '/admin/tenant-usage' },
  { label: 'Feature Flags', to: '/admin/feature-flags' },
  { label: 'Notifications', to: '/admin/notifications' },
  { label: 'Activity Logs', to: '/admin/logs' },
];
