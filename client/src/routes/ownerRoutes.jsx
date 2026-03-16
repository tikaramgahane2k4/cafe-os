import React from 'react';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import Dashboard from '../pages/Owner/Dashboard';
import ProtectedRoute from '../components/ProtectedRoute';

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
    element: (
      <ProtectedRoute allowedRoles={["owner"]}>
        <Dashboard />
      </ProtectedRoute>
    )
  }
];