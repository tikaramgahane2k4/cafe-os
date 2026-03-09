import React from 'react';
import { ownerRoutes } from './ownerRoutes';
import LandingPage from '../pages/LandingPage/LandingPage';

export const allRoutes = [
    ...ownerRoutes,
    { path: '/', element: <LandingPage /> },
];
