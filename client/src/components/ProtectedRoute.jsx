import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token } = useAuth();
  
  if (!token || !user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Agar allowed role match nahi karta, toh unauthorized bhejo
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
