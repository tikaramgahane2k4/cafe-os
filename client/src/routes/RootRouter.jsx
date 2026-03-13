import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { allRoutes } from './routes';

/**
 * RootRouter Component
 * 
 * Uses standard declarative JSX structure as requested.
 */
const RootRouter = () => {
    return (
        <Routes>
            {allRoutes.map((route, index) => {
                if (route.children) {
                    return (
                        <Route key={index} path={route.path} element={route.element}>
                            {route.children.map((child, childIdx) => (
                                <Route
                                    key={childIdx}
                                    index={child.index}
                                    path={child.path}
                                    element={child.element}
                                />
                            ))}
                        </Route>
                    );
                }
                return (
                    <Route
                        key={index}
                        path={route.path}
                        element={route.element}
                    />
                );
            })}
        </Routes>
    );
};

export default RootRouter;
