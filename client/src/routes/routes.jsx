/**
 * Central Routes Registry
 *
 * This file aggregates routes from all feature modules.
 * To add a new feature:
 * 1. Import its routes array.
 * 2. Spread it into the 'allRoutes' array.
 *
 * This pattern minimizes merge conflicts.
 */

import React from "react";
import { ownerRoutes } from "./ownerRoutes";
import { adminRoutes } from "./adminRoutes";
import LandingPage from "../pages/LandingPage/LandingPage";
import Unauthorized from "../pages/Unauthorized";

// Page Imports
import LandingPage from "../pages/LandingPage/LandingPage";
import Login from "../pages/Login";
import DashboardLayout from "../layouts/DashboardLayout";
import Dashboard from "../pages/Dashboard";
import MenuManagement from "../pages/MenuManagement";
import InventoryControl from "../pages/InventoryControl";
import StaffManagement from "../pages/StaffManagement";
import CustomerCRM from "../pages/CustomerCRM";

/**
 * ProtectedRoute Component
 * Guards dashboard routes
 */
export const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) return null;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

/**
 * Centralized Route Configuration
 */
export const allRoutes = [
  ...ownerRoutes,
  ...adminRoutes,
  { path: "/", element: <LandingPage /> },
  { path: "/unauthorized", element: <Unauthorized /> },
];
