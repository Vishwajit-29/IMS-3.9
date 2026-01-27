const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
    // Get backend URL from environment variable or use default
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

    console.log('Setting up proxy middleware to forward to backend at', apiUrl);

    // Debug middleware to log all requests
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
        next();
    });

    // Create a proxy middleware that forwards requests to the Spring Boot backend
    const apiProxy = createProxyMiddleware({
        target: apiUrl,
        changeOrigin: true,
        pathRewrite: {
            '^/api': '/api', // Keep /api prefix when forwarding to backend
        },
        logLevel: 'debug',
        onProxyRes: (proxyRes, req, res) => {
            console.log(`Proxy response: ${proxyRes.statusCode} for ${req.method} ${req.path}`);
        },
        onProxyError: (err, req, res) => {
            console.error('Proxy error:', err);

            // Send a more informative error response
            res.writeHead(500, {
                'Content-Type': 'application/json'
            });

            // Create a structured error response
            res.end(JSON.stringify({
                error: 'MongoDB Connection Error',
                message: 'Could not connect to the database server. Please check if MongoDB is running.',
                details: err.message,
                status: 500,
                path: req.path
            }));
        },
        // Increase timeout for slower connections
        proxyTimeout: 15000,
        timeout: 15000
    });

    // Apply the proxy middleware to /api routes
    app.use('/api', apiProxy);

    // Add alternative routes without the /api prefix to handle both patterns
    const backendUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
    const altApiProxy = createProxyMiddleware({
        target: backendUrl,
        changeOrigin: true,
        logLevel: 'debug',
        onProxyError: (err, req, res) => {
            console.error('Alt proxy error:', err);

            res.writeHead(500, {
                'Content-Type': 'application/json'
            });
            res.end(JSON.stringify({
                error: 'MongoDB Connection Error',
                message: 'Could not connect to the database server. Please check if MongoDB is running.',
                details: err.message,
                status: 500,
                path: req.path
            }));
        },
        // Increase timeout for slower connections
        proxyTimeout: 15000,
        timeout: 15000
    });

    // Apply alternative proxy to direct endpoint paths
    app.use('/items', altApiProxy);
    app.use('/categories', altApiProxy);
    app.use('/sales', altApiProxy);
};