/**
 * Authentication Test Script
 * 
 * This file provides a direct test of the authentication system
 * You can run it directly with Node.js to test the backend authentication
 * without going through the React app
 * 
 * Usage: 
 * 1. Install axios: npm install axios
 * 2. Run: node auth-test.js
 */

const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:8080';
const LOGIN_ENDPOINT = '/api/auth/login';
const HEALTH_ENDPOINT = '/api/public/health';

// Test admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

// Colors for output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

// Utility for logging
const log = {
    info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
    data: (label, data) => console.log(`${colors.cyan}[DATA: ${label}]${colors.reset}`, data),
};

// Test health endpoint
async function testHealth() {
    log.info(`Testing health endpoint: ${API_URL}${HEALTH_ENDPOINT}`);

    try {
        const response = await axios.get(`${API_URL}${HEALTH_ENDPOINT}`);
        log.success('Health check successful');
        log.data('Response', response.data);
        return true;
    } catch (error) {
        log.error('Health check failed');
        if (error.response) {
            log.data('Error Response', {
                status: error.response.status,
                data: error.response.data
            });
        } else if (error.request) {
            log.error('No response from server. Is the backend running?');
        } else {
            log.error(`Error: ${error.message}`);
        }
        return false;
    }
}

// Test login with admin credentials
async function testAdminLogin() {
    log.info(`Testing admin login: ${API_URL}${LOGIN_ENDPOINT}`);

    try {
        const response = await axios.post(`${API_URL}${LOGIN_ENDPOINT}`, {
            username: ADMIN_USERNAME,
            password: ADMIN_PASSWORD
        });

        log.success('Admin login successful');
        log.data('Response', {
            token: response.data.token ? `${response.data.token.substring(0, 20)}...` : undefined,
            username: response.data.username,
            roles: response.data.roles
        });

        return response.data;
    } catch (error) {
        log.error('Admin login failed');
        if (error.response) {
            log.data('Error Response', {
                status: error.response.status,
                data: error.response.data
            });
        } else if (error.request) {
            log.error('No response from server. Is the backend running?');
        } else {
            log.error(`Error: ${error.message}`);
        }
        return null;
    }
}

// Run all tests
async function runTests() {
    log.info('Starting authentication tests...');

    const healthCheck = await testHealth();
    if (!healthCheck) {
        log.warn('Health check failed. Backend may not be running.');
        log.warn('Make sure the Spring Boot server is running at ' + API_URL);
        return;
    }

    await testAdminLogin();

    log.info('Tests completed.');
}

// Execute tests
runTests().catch(error => {
    log.error('Test failed with an unhandled exception:');
    console.error(error);
});