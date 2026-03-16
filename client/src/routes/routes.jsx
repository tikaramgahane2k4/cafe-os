import React from 'react';
import { ownerRoutes } from './ownerRoutes';
import { adminRoutes } from './adminRoutes';
import LandingPage from '../pages/LandingPage/LandingPage';
import Unauthorized from '../pages/Unauthorized';

export const allRoutes = [
    ...ownerRoutes,
    ...adminRoutes,
    { path: '/', element: <LandingPage /> },
    { path: '/unauthorized', element: <Unauthorized /> }
];
