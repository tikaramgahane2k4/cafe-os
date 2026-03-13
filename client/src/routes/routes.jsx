import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
    {
        path: "/",
        element: <LandingPage />
    },
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/dashboard",
        element: (
            <ProtectedRoute>
                <DashboardLayout />
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <Dashboard />
            },
            {
                path: "menu",
                element: <MenuManagement />
            },
            {
                path: "inventory",
                element: <InventoryControl />
            },
            {
                path: "staff",
                element: <StaffManagement />
            },
            {
                path: "customers",
                element: <CustomerCRM />
            }
        ]
    },
    {
        path: "*",
        element: <Navigate to="/" replace />
    }
];