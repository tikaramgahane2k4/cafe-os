import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { allRoutes } from './routes.jsx';
import { AuthProvider } from '../context/AuthContext';

/**
 * RootRouter Component
 * Handles all application routes
 */

const RootRouter = () => {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {allRoutes.map((route, index) => (
                        <Route
                            key={index}
                            path={route.path}
                            element={route.element}
                        />
                    ))}

                    {/* Fallback for 404 - can be moved to a separate file later */}
                    <Route path="*" element={<div>Page Not Found</div>} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
};

export default RootRouter;