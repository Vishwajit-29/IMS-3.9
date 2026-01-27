import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// Create auth context
export const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if user is authenticated on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        if (storedUser && storedToken) {
            try {
                setUser(JSON.parse(storedUser));
                setToken(storedToken);
            } catch (err) {
                console.error('Failed to parse stored user:', err);
                // Clear invalid data
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                setToken(null);
                setUser(null);
            }
        }
        setLoading(false);
    }, []);

    // Login function
    const login = async(username, password) => {
        setLoading(true);
        setError(null);

        try {
            // Use hardcoded admin credentials for now
            if (username === 'admin' && password === 'admin123') {
                // Create a token
                const mockToken = `mock-jwt-token-${Date.now()}`;

                // Create user object
                const userData = {
                    username: username,
                    role: 'ADMIN'
                };

                // Save to localStorage
                localStorage.setItem('token', mockToken);
                localStorage.setItem('user', JSON.stringify(userData));

                // Update state
                setToken(mockToken);
                setUser(userData);
                setLoading(false);

                return true;
            } else {
                setError('Invalid username or password');
                setLoading(false);
                return false;
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'Failed to login');
            setLoading(false);
            return false;
        }
    };

    // Logout function
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    // Auth context value
    const authContextValue = {
        user,
        token,
        loading,
        error,
        login,
        logout,
        isAuthenticated: !!user,
    };

    return React.createElement(
        AuthContext.Provider, { value: authContextValue },
        children
    );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;