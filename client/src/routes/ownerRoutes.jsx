import Login from '../pages/Owner/Login';
import Dashboard from '../pages/Owner/Dashboard';

export const ownerRoutes = [
    {
        path: '/login',
        element: <Login />
    },
    {
        path: '/owner/dashboard',
        element: <Dashboard />
    }
];
