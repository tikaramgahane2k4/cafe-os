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

export const allRoutes = [
  ...ownerRoutes,
  ...adminRoutes,
  { path: "/", element: <LandingPage /> },
  { path: "/unauthorized", element: <Unauthorized /> },
];
