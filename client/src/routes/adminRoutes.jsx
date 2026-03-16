import React from 'react';
import ProtectedRoute from '../components/ProtectedRoute';

// Temporary component for Admin Dashboard (can be moved to its own file later)
const AdminDashboard = () => (
  <div style={{ padding: "50px", color: "white" }}>
    <h1>Super Admin Dashboard 👑</h1>
  </div>
);

export const adminRoutes = [
  {
    path: '/admin/dashboard',
    element: (
      <ProtectedRoute allowedRoles={["superadmin"]}>
        <AdminDashboard />
      </ProtectedRoute>
    )
  }
];