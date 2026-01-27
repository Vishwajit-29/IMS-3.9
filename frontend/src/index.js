import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import './index.css';
import App from './App';

// Configure axios defaults using environment variables
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
axios.defaults.baseURL = apiUrl; // Base URL for direct API calls
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.timeout = 15000; // 15 seconds timeout for slower connections

// Enhanced debug logging for all requests
axios.interceptors.request.use(request => {
    console.log('Axios Request:', request.method, request.url, 'Full URL:', request.baseURL + request.url);
    return request;
});

// Add response interceptor for better error handling
axios.interceptors.response.use(
    response => {
        console.log('Axios Response:', response.status, 'for', response.config.method, response.config.url);
        return response;
    },
    error => {
        console.error('Axios Error:', error.message);

        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
        } else if (error.request) {
            console.error('No response received. Request:', error.request);
            console.error('Is MongoDB server running?');
        }

        return Promise.reject(error);
    }
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    React.createElement(
        React.StrictMode,
        null,
        React.createElement(App)
    )
);