import React, { Suspense, lazy } from 'react';
import { Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { PageSpinner } from '../components/admin/SkeletonLoader';

const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const TenantManagement = lazy(() => import('../pages/admin/TenantManagement'));
const SubscriptionManagement = lazy(() => import('../pages/admin/SubscriptionManagement'));
const FeatureFlags = lazy(() => import('../pages/admin/FeatureFlags'));
const UserManagement = lazy(() => import('../pages/admin/UserManagement'));
const ActivityLogs = lazy(() => import('../pages/admin/ActivityLogs'));
const Analytics = lazy(() => import('../pages/admin/Analytics'));
const TenantUsage = lazy(() => import('../pages/admin/TenantUsage'));
const Notifications = lazy(() => import('../pages/admin/Notifications'));
const BillingHistory = lazy(() => import('../pages/admin/BillingHistory'));

const withSuperAdmin = (element) => (
  <ProtectedRoute allowedRoles={['superadmin']}>{element}</ProtectedRoute>
);

const withSuspense = (Component) => (
  <Suspense fallback={<PageSpinner message="Loading admin workspace..." />}>
    <Component />
  </Suspense>
);

export const adminRoutes = [
  { path: '/admin', element: withSuperAdmin(<Navigate to="/admin/dashboard" replace />) },
  { path: '/admin/dashboard', element: withSuperAdmin(withSuspense(AdminDashboard)) },
  { path: '/admin/tenants', element: withSuperAdmin(withSuspense(TenantManagement)) },
  { path: '/admin/subscriptions', element: withSuperAdmin(withSuspense(SubscriptionManagement)) },
  { path: '/admin/features', element: withSuperAdmin(withSuspense(FeatureFlags)) },
  { path: '/admin/feature-flags', element: withSuperAdmin(withSuspense(FeatureFlags)) },
  { path: '/admin/users', element: withSuperAdmin(withSuspense(UserManagement)) },
  { path: '/admin/logs', element: withSuperAdmin(withSuspense(ActivityLogs)) },
  { path: '/admin/analytics', element: withSuperAdmin(withSuspense(Analytics)) },
  { path: '/admin/tenant-usage', element: withSuperAdmin(withSuspense(TenantUsage)) },
  { path: '/admin/notifications', element: withSuperAdmin(withSuspense(Notifications)) },
  { path: '/admin/billing', element: withSuperAdmin(withSuspense(BillingHistory)) },
];
