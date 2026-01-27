import React, { useContext, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Loader from './components/Loader';
import './App.css';

// Protected route component
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return React.createElement(Loader);
    }

    if (!user) {
        return React.createElement(Navigate, { to: "/login", replace: true });
    }

    return children;
};

const AppContent = () => {
    const { user, loading } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        // Redirect based on auth status when it changes
        if (!loading) {
            if (!user) {
                navigate('/login');
            } else if (window.location.pathname === '/login') {
                navigate('/');
            }
        }
    }, [user, loading, navigate]);

    if (loading) {
        return React.createElement(Loader);
    }

    return React.createElement(
        Routes,
        null,
        React.createElement(Route, {
            path: "/login",
            element: React.createElement(Login)
        }),
        React.createElement(Route, {
            path: "/",
            element: React.createElement(
                ProtectedRoute,
                null,
                React.createElement(Dashboard)
            )
        }),
        React.createElement(Route, {
            path: "*",
            element: React.createElement(NotFound)
        })
    );
};

function App() {
    return React.createElement(
        AuthProvider,
        null,
        React.createElement(
            Router,
            null,
            React.createElement(AppContent)
        )
    );
}

export default App;