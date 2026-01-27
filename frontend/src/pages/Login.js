import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Login.css';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login, error, loading } = useContext(AuthContext);
    const navigate = useNavigate();

    // Set admin credentials
    const setAdminCredentials = () => {
        setUsername('admin');
        setPassword('admin123');
    };

    const handleSubmit = async(e) => {
        e.preventDefault();
        console.log('Login submission with:', { username, password: '*****' });
        const success = await login(username, password);
        if (success) {
            console.log('Login successful, navigating to dashboard');
            navigate('/');
        } else {
            console.error('Login failed');
        }
    };

    return React.createElement('div', { className: 'login-container' },
        React.createElement('div', { className: 'login-card' },
            React.createElement('h1', null, 'Inventory Management System'),
            React.createElement('p', { className: 'login-subtitle' }, 'Please login to access the system'),

            error && React.createElement('div', { className: 'error-message' }, error),

            React.createElement('form', { onSubmit: handleSubmit },
                React.createElement('div', { className: 'form-group' },
                    React.createElement('label', { htmlFor: 'username' }, 'Username'),
                    React.createElement('input', {
                        type: 'text',
                        id: 'username',
                        value: username,
                        onChange: (e) => setUsername(e.target.value),
                        required: true
                    })
                ),
                React.createElement('div', { className: 'form-group' },
                    React.createElement('label', { htmlFor: 'password' }, 'Password'),
                    React.createElement('input', {
                        type: 'password',
                        id: 'password',
                        value: password,
                        onChange: (e) => setPassword(e.target.value),
                        required: true
                    })
                ),
                React.createElement('button', {
                    type: 'submit',
                    className: 'login-button',
                    disabled: loading
                }, loading ? 'Logging in...' : 'Login')
            ),

            // Admin login button
            React.createElement('div', { className: 'admin-login-help' },
                React.createElement('button', {
                    type: 'button',
                    className: 'admin-button',
                    onClick: setAdminCredentials
                }, 'Use Admin Credentials')
            ),

            // Help text
            React.createElement('div', { className: 'login-help-text' },
                React.createElement('p', null, 'Use admin/admin123 to log in')
            )
        )
    );
}

export default Login;