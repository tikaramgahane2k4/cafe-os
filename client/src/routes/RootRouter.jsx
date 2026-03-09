import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { allRoutes } from './routes.jsx';

/**
 * RootRouter Component
 * 
 * This is the engine of our routing system. It iterates through the
 * 'allRoutes' registry and renders each route dynamically.
 * 
 * Team members should rarely need to modify this file.
 */
const RootRouter = () => {
    return (
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
    );
};

export default RootRouter;
