import React from 'react';
import { Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import ProtectedRoute from '../components/ProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';
import Dashboard from '../pages/Dashboard';
import MenuManagement from '../pages/MenuManagement';
import InventoryControl from '../pages/InventoryControl';
import StaffManagement from '../pages/StaffManagement';
import CustomerCRM from '../pages/CustomerCRM';

export const ownerRoutes = [
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/signup',
    element: <SignupPage />
  },
  {
    path: '/owner/dashboard',
    element: <Navigate to="/dashboard" replace />
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute allowedRoles={["owner"]}>
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      </ProtectedRoute>
    )
  },
  {
    path: '/dashboard/menu',
    element: (
      <ProtectedRoute allowedRoles={["owner"]}>
        <DashboardLayout showHeader={false}>
          <MenuManagement />
        </DashboardLayout>
      </ProtectedRoute>
    )
  },
  {
    path: '/dashboard/inventory',
    element: (
      <ProtectedRoute allowedRoles={["owner"]}>
        <DashboardLayout showHeader={false}>
          <InventoryControl />
        </DashboardLayout>
      </ProtectedRoute>
    )
  },
  {
    path: '/dashboard/staff',
    element: (
      <ProtectedRoute allowedRoles={["owner"]}>
        <DashboardLayout showHeader={false}>
          <StaffManagement />
        </DashboardLayout>
      </ProtectedRoute>
    )
  },
  {
    path: '/dashboard/customers',
    element: (
      <ProtectedRoute allowedRoles={["owner"]}>
        <DashboardLayout showHeader={false}>
          <CustomerCRM />
        </DashboardLayout>
      </ProtectedRoute>
    )
  }
];
