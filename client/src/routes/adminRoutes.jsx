import ProtectedRoute from "../components/ProtectedRoute";
import AdminDashboard from "../pages/admin/AdminDashboard";
import TenantManagement from "../pages/admin/TenantManagement";
import SubscriptionManagement from "../pages/admin/SubscriptionManagement";
import SubscriptionRenewals from "../pages/admin/SubscriptionRenewals";
import FeatureFlags from "../pages/admin/FeatureFlags";
import UserManagement from "../pages/admin/UserManagement";
import ActivityLogs from "../pages/admin/ActivityLogs";
import Analytics from "../pages/admin/Analytics";
import TenantUsage from "../pages/admin/TenantUsage";
import BillingHistory from "../pages/admin/BillingHistory";
import Notifications from '../pages/admin/Notifications';

const withSuperAdmin = (element) => (
  <ProtectedRoute allowedRoles={['superadmin']}>{element}</ProtectedRoute>
);

export const adminRoutes = [
  { path: "/admin/dashboard", element: withSuperAdmin(<AdminDashboard />) },
  { path: "/admin/tenants", element: withSuperAdmin(<TenantManagement />) },
  { path: "/admin/subscriptions", element: withSuperAdmin(<SubscriptionManagement />) },
  { path: "/admin/subscriptions/renewals", element: withSuperAdmin(<SubscriptionRenewals />) },
  { path: "/admin/features", element: withSuperAdmin(<FeatureFlags />) },
  { path: "/admin/feature-flags", element: withSuperAdmin(<FeatureFlags />) },
  { path: "/admin/users", element: withSuperAdmin(<UserManagement />) },
  { path: "/admin/logs", element: withSuperAdmin(<ActivityLogs />) },
  { path: "/admin/analytics", element: withSuperAdmin(<Analytics />) },
  { path: "/admin/tenant-usage", element: withSuperAdmin(<TenantUsage />) },
  { path: "/admin/billing", element: withSuperAdmin(<BillingHistory />) },
  { path: '/admin/notifications', element: withSuperAdmin(<Notifications />) },
];
