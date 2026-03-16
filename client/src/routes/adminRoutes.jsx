import React from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import Dashboard from "../pages/superAdmin/Dashboard";
import AdminDashboard from "../pages/admin/AdminDashboard";
import TenantManagement from "../pages/admin/TenantManagement";
import SubscriptionManagement from "../pages/admin/SubscriptionManagement";
import FeatureFlags from "../pages/admin/FeatureFlags";
import UserManagement from "../pages/admin/UserManagement";
import ActivityLogs from "../pages/admin/ActivityLogs";
import Analytics from "../pages/admin/Analytics";
import TenantUsage from "../pages/admin/TenantUsage";
import SystemAlerts from "../pages/admin/SystemAlerts";
import BillingHistory from "../pages/admin/BillingHistory";

const withSuperAdmin = (element) => (
  <ProtectedRoute allowedRoles={["superadmin"]}>{element}</ProtectedRoute>
);

export const adminRoutes = [
  // Legacy super-admin dashboard (existing)
  { path: "/admin", element: withSuperAdmin(<Dashboard />) },

  // New Admin Portal routes
  { path: "/admin/dashboard", element: withSuperAdmin(<AdminDashboard />) },
  { path: "/admin/tenants", element: withSuperAdmin(<TenantManagement />) },
  { path: "/admin/subscriptions", element: withSuperAdmin(<SubscriptionManagement />) },
  { path: "/admin/features", element: withSuperAdmin(<FeatureFlags />) },
  { path: "/admin/feature-flags", element: withSuperAdmin(<FeatureFlags />) },
  { path: "/admin/users", element: withSuperAdmin(<UserManagement />) },
  { path: "/admin/logs", element: withSuperAdmin(<ActivityLogs />) },
  { path: "/admin/analytics", element: withSuperAdmin(<Analytics />) },
  { path: "/admin/tenant-usage", element: withSuperAdmin(<TenantUsage />) },
  { path: "/admin/alerts", element: withSuperAdmin(<SystemAlerts />) },
  { path: "/admin/billing", element: withSuperAdmin(<BillingHistory />) },
];
