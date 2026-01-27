import axios from 'axios';

// Auth token key
const AUTH_TOKEN_KEY = 'authToken';

class DataService {
    constructor() {
        // Configure API URLs using environment variables
        this.apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
        this.api = axios.create({
            baseURL: this.apiBaseUrl,
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 15000 // Increased timeout for slower connections
        });

        // Add request interceptor to include auth token
        this.api.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers['Authorization'] = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Improved error handling in response interceptor
        this.api.interceptors.response.use(
            (response) => response,
            (error) => {
                console.error('API error:', error);

                // Provide detailed error information
                if (error.response) {
                    console.error('Response status:', error.response.status);
                    console.error('Response data:', error.response.data);
                } else if (error.request) {
                    console.error('No response received. Request:', error.request);
                }

                // Always reject to allow components to handle errors
                return Promise.reject(error);
            }
        );

        console.log('DataService initialized with baseURL:', this.apiBaseUrl);
    }

    // Get all items directly from MongoDB
    async getItems() {
        try {
            console.log('Fetching items from MongoDB...');

            // Try multiple endpoints in sequence
            const endpoints = [
                '/items',
                '/api/items',
                'items'
            ];

            let response = null;
            let lastError = null;

            // Try each endpoint until one works
            for (const endpoint of endpoints) {
                try {
                    console.log(`Trying endpoint: ${endpoint}`);
                    response = await this.api.get(endpoint);
                    if (response.data) {
                        console.log('Items fetched successfully:', response.data);
                        break;
                    }
                } catch (err) {
                    lastError = err;
                    console.error(`Failed with endpoint ${endpoint}:`, err);
                }
            }

            // If all endpoints failed, try direct call without baseURL
            if (!response) {
                try {
                    console.log('Trying direct endpoint call...');
                    response = await axios.get('http://localhost:8080/api/items');
                    console.log('Direct endpoint successful:', response.data);
                } catch (directErr) {
                    console.error('Direct call also failed:', directErr);
                    throw lastError || directErr;
                }
            }

            // Make sure we don't lose any data, like item ID
            if (!Array.isArray(response.data)) {
                console.error('Response is not an array:', response.data);
                throw new Error('Invalid data format received from server');
            }

            return response.data.map(item => {
                // Ensure id is set for frontend operations
                const id = item._id || item.id;
                const sales = item.sales || 0;
                const price = item.price || 0;

                // Make sure all expected fields are present with defaults
                return {
                    ...item,
                    id: id,
                    _id: id,
                    quantity: item.quantity || 0,
                    price: price,
                    sales: sales,
                    revenue: sales * price, // Calculate revenue based on sales and price
                    minStock: item.minStock || 5,
                    imageUrl: item.imageUrl || this.getDefaultImageForCategory(item.category)
                };
            });
        } catch (error) {
            console.error('Error fetching items:', error.message);
            throw error; // Re-throw to allow component to handle it
        }
    }

    // Get all categories from MongoDB
    async getCategories() {
        try {
            console.log('Fetching categories from MongoDB...');

            // Try multiple endpoints in sequence
            const endpoints = [
                '/categories',
                '/api/categories',
                'categories'
            ];

            let response = null;
            let lastError = null;

            // Try each endpoint until one works
            for (const endpoint of endpoints) {
                try {
                    console.log(`Trying endpoint: ${endpoint}`);
                    response = await this.api.get(endpoint);
                    if (response.data) {
                        console.log('Categories fetched successfully:', response.data);
                        break;
                    }
                } catch (err) {
                    lastError = err;
                    console.error(`Failed with endpoint ${endpoint}:`, err);
                }
            }

            // If all endpoints failed, try direct call without baseURL
            if (!response) {
                try {
                    console.log('Trying direct endpoint call...');
                    response = await axios.get('http://localhost:8080/api/categories');
                    console.log('Direct endpoint successful:', response.data);
                } catch (directErr) {
                    console.error('Direct call also failed:', directErr);
                    throw lastError || directErr;
                }
            }

            if (!Array.isArray(response.data)) {
                console.error('Response is not an array:', response.data);
                throw new Error('Invalid category data format received from server');
            }

            return response.data;
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw error; // Re-throw to allow component to handle it
        }
    }

    // Add helper function for trying multiple API endpoints
    async tryMultipleEndpoints(apiCall, endpoints) {
        let lastError = null;
        for (const endpoint of endpoints) {
            try {
                console.log(`Trying endpoint: ${endpoint}`);
                const result = await apiCall(endpoint);
                return result;
            } catch (error) {
                console.error(`Failed with endpoint ${endpoint}:`, error);
                lastError = error;
            }
        }
        throw lastError || new Error('All endpoints failed');
    }

    // Add new item to MongoDB
    async addItem(itemData) {
        try {
            console.log('Processing item:', itemData);

            // Check if this is an update to an existing item (has _id)
            if (itemData._id) {
                console.log('Found item ID, updating existing item instead of adding new one:', itemData._id);
                return await this.updateItem(itemData._id, itemData);
            }

            console.log('Adding new item to MongoDB:', itemData);

            // Make sure we have the correct fields for the backend
            const formattedItem = {
                name: itemData.name,
                category: itemData.category,
                description: itemData.description || '',
                quantity: parseInt(itemData.quantity) || 0,
                minStock: parseInt(itemData.minStock) || 5,
                sales: parseInt(itemData.sales) || 0,
                imageUrl: itemData.imageUrl || itemData.image || this.getDefaultImageForCategory(itemData.category),
                price: parseFloat(itemData.price) || 0
            };

            console.log('Formatted item for API:', formattedItem);

            // Try multiple endpoints to add item
            const response = await this.tryMultipleEndpoints(
                (endpoint) => this.api.post(endpoint, formattedItem), ['/items', '/api/items', 'items']
            );

            console.log('Item added to MongoDB:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error adding item:', error);

            // Try direct API call as last resort
            try {
                console.log('Trying direct API call to add item...');
                const formattedItem = {
                    name: itemData.name,
                    category: itemData.category,
                    description: itemData.description || '',
                    quantity: parseInt(itemData.quantity) || 0,
                    minStock: parseInt(itemData.minStock) || 5,
                    sales: parseInt(itemData.sales) || 0,
                    imageUrl: itemData.imageUrl || itemData.image || this.getDefaultImageForCategory(itemData.category),
                    price: parseFloat(itemData.price) || 0
                };

                const directResponse = await axios.post('http://localhost:8080/api/items', formattedItem);
                console.log('Item added with direct API call:', directResponse.data);
                return directResponse.data;
            } catch (directError) {
                console.error('Direct API call also failed:', directError);
            }

            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
                throw new Error(`Failed to add item: ${error.response.data.error || error.message}`);
            }
            throw new Error('Failed to add item to MongoDB database');
        }
    }

    // Add a new method to update an existing item
    async updateItem(itemId, itemData) {
        try {
            console.log('Updating item in MongoDB:', { itemId, itemData });

            // Format the item data for the update operation
            const formattedItem = {
                name: itemData.name,
                category: itemData.category,
                description: itemData.description || '',
                quantity: parseInt(itemData.quantity) || 0,
                minStock: parseInt(itemData.minStock) || 5,
                // Don't modify sales when updating normally
                imageUrl: itemData.imageUrl || itemData.image || this.getDefaultImageForCategory(itemData.category),
                price: parseFloat(itemData.price) || 0
            };

            // If the original item had an _id, make sure we include it
            if (itemData._id) {
                formattedItem._id = itemData._id;
            }

            console.log('Formatted item for update API:', formattedItem);

            // Try multiple endpoints for the update operation
            const endpoints = [
                `/items/${itemId}`,
                `/api/items/${itemId}`
            ];

            let response = null;
            let lastError = null;

            // Try each endpoint until one works
            for (const endpoint of endpoints) {
                try {
                    console.log(`Trying to update item with endpoint: ${endpoint}`);
                    response = await this.api.put(endpoint, formattedItem);
                    if (response.data) {
                        console.log('Item updated successfully with endpoint:', endpoint, response.data);
                        break;
                    }
                } catch (err) {
                    lastError = err;
                    console.error(`Failed with endpoint ${endpoint}:`, err);
                }
            }

            if (!response) {
                throw lastError || new Error('All update endpoints failed');
            }

            return response.data;
        } catch (error) {
            console.error('Error updating item:', error);

            // Try direct API call as last resort
            try {
                console.log('Trying direct API call to update item...');
                const formattedItem = {
                    name: itemData.name,
                    category: itemData.category,
                    description: itemData.description || '',
                    quantity: parseInt(itemData.quantity) || 0,
                    minStock: parseInt(itemData.minStock) || 5,
                    imageUrl: itemData.imageUrl || itemData.image || this.getDefaultImageForCategory(itemData.category),
                    price: parseFloat(itemData.price) || 0
                };

                // Again, include the _id if it exists
                if (itemData._id) {
                    formattedItem._id = itemData._id;
                }

                console.log('Direct API call with formatted item:', formattedItem);

                const directResponse = await axios.put(`http://localhost:8080/api/items/${itemId}`, formattedItem);
                console.log('Item updated with direct API call:', directResponse.data);
                return directResponse.data;
            } catch (directError) {
                console.error('Direct API call also failed:', directError);
                if (directError.response) {
                    console.error('Response status:', directError.response.status);
                    console.error('Response data:', directError.response.data);
                }
            }

            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
                throw new Error(`Failed to update item: ${error.response.data.error || error.message}`);
            }
            throw new Error('Failed to update item in MongoDB database');
        }
    }

    // Update item quantity in MongoDB
    async updateItemQuantity(itemId, quantityChange) {
        try {
            console.log('Updating quantity in MongoDB:', { itemId, quantityChange });

            // Ensure quantityChange is an integer
            const change = parseInt(quantityChange);
            if (isNaN(change)) {
                throw new Error('Quantity change must be a number');
            }

            // Try multiple endpoints
            const endpoints = [
                `/items/${itemId}/quantity`,
                `/api/items/${itemId}/quantity`
            ];

            const response = await this.tryMultipleEndpoints(
                (endpoint) => this.api.patch(endpoint, { quantity: change }),
                endpoints
            );

            console.log('Quantity updated in MongoDB:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error updating quantity:', error);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
                throw new Error(`Failed to update quantity: ${error.response.data.error || error.message}`);
            }
            throw new Error('Failed to update quantity in MongoDB database');
        }
    }

    // Remove item from MongoDB (supporting both complete removal and partial quantity removal)
    async removeItem(itemId, quantity = null) {
        try {
            console.log('Removing item from MongoDB:', itemId, quantity ? `(Quantity: ${quantity})` : '(Complete removal)');

            // If quantity is provided, update item quantity instead of removing it completely
            if (quantity !== null) {
                return await this.updateItemQuantity(itemId, -quantity);
            }

            // Try multiple endpoints for complete item removal
            const endpoints = [
                `/items/${itemId}`,
                `/api/items/${itemId}`
            ];

            const response = await this.tryMultipleEndpoints(
                (endpoint) => this.api.delete(endpoint),
                endpoints
            );

            console.log('Item removed from MongoDB:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error removing item:', error);

            // Try direct API call as last resort
            try {
                if (quantity !== null) {
                    // For partial removal, try direct API call to update quantity
                    console.log('Trying direct API call to update quantity...');
                    const directResponse = await axios.patch(`http://localhost:8080/api/items/${itemId}/quantity`, {
                        quantity: -quantity
                    });
                    console.log('Item quantity updated with direct API call:', directResponse.data);
                    return directResponse.data;
                } else {
                    // For complete removal, try direct API call to delete
                    console.log('Trying direct API call to remove item...');
                    const directResponse = await axios.delete(`http://localhost:8080/api/items/${itemId}`);
                    console.log('Item removed with direct API call:', directResponse.data);
                    return directResponse.data;
                }
            } catch (directError) {
                console.error('Direct API call also failed:', directError);
            }

            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
                throw new Error(`Failed to remove item: ${error.response.data.error || error.message}`);
            }
            throw new Error('Failed to remove item from MongoDB database');
        }
    }

    // Get sales data from MongoDB
    async getSalesData() {
        try {
            console.log('Fetching sales data from MongoDB...');

            // Try multiple endpoints in sequence
            const endpoints = [
                '/sales',
                '/api/sales',
                'sales'
            ];

            let response = null;
            let lastError = null;

            // Try each endpoint until one works
            for (const endpoint of endpoints) {
                try {
                    console.log(`Trying endpoint: ${endpoint}`);
                    response = await this.api.get(endpoint);
                    if (response.data) {
                        console.log('Sales data fetched successfully:', response.data);
                        break;
                    }
                } catch (err) {
                    lastError = err;
                    console.error(`Failed with endpoint ${endpoint}:`, err);
                }
            }

            // If all endpoints failed, try direct call without baseURL
            if (!response) {
                try {
                    console.log('Trying direct endpoint call...');
                    response = await axios.get('http://localhost:8080/api/sales');
                    console.log('Direct endpoint successful:', response.data);
                } catch (directErr) {
                    console.error('Direct call also failed, generating mock data instead:', directErr);

                    // Generate realistic mock data
                    return await this.generateMockSalesData();
                }
            }

            return response.data;
        } catch (error) {
            console.error('Error fetching sales data:', error);

            // Fallback to mock data in case of any error
            return await this.generateMockSalesData();
        }
    }

    // Generate realistic mock sales data for visualization
    async generateMockSalesData() {
        // Get current date
        const now = new Date();

        // Generate weekly data (past 7 days)
        const weeklySales = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];

            // Generate realistic sales data with some variability
            // Higher sales on weekends, lower on weekdays
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const baseSales = isWeekend ? 15 : 8;
            const randomFactor = Math.random() * 0.5 + 0.75; // 0.75 to 1.25 random factor
            const sales = Math.round(baseSales * randomFactor);

            // Stock data tends to be added before weekends
            const stockAdded = date.getDay() === 5 ? Math.round(sales * 1.5) :
                (date.getDay() === 1 ? Math.round(sales * 0.8) :
                    Math.round(sales * 0.3 * Math.random()));

            weeklySales.push({
                day: dayName,
                date: date.toISOString().split('T')[0],
                sales: sales,
                stockAdded: stockAdded
            });
        }

        // Generate monthly data (past 30 days, by week)
        const monthlySales = [];
        for (let i = 0; i < 4; i++) {
            const weekStart = new Date(now);
            weekStart.setDate(weekStart.getDate() - (7 * (3 - i) + 6));
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);

            // Sum the sales for each week with some randomness
            const baseSales = 60 + i * 10; // Trending upward
            const randomFactor = Math.random() * 0.3 + 0.85; // 0.85 to 1.15 random factor
            const sales = Math.round(baseSales * randomFactor);

            // Stock data added with some correlation to sales
            const stockAdded = Math.round(sales * (0.7 + Math.random() * 0.6));

            monthlySales.push({
                day: `Week ${i+1}`,
                date: `${weekStart.toISOString().split('T')[0]} - ${weekEnd.toISOString().split('T')[0]}`,
                sales: sales,
                stockAdded: stockAdded
            });
        }

        // Generate yearly data (past 12 months)
        const yearlySales = [];
        const currentMonth = now.getMonth();
        for (let i = 11; i >= 0; i--) {
            const monthIndex = (currentMonth - i + 12) % 12;
            const year = now.getFullYear() - (currentMonth < i ? 1 : 0);
            const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][monthIndex];

            // Seasonal patterns
            let seasonalFactor = 1;
            if (monthIndex === 11) seasonalFactor = 1.6; // December (holiday season)
            else if (monthIndex === 0) seasonalFactor = 0.7; // January (post-holiday slump)
            else if (monthIndex >= 5 && monthIndex <= 7) seasonalFactor = 1.2; // Summer months
            else if (monthIndex >= 9 && monthIndex <= 10) seasonalFactor = 1.1; // Fall months

            // Add a growth trend over the year
            const trendFactor = 1 + (i * 0.01);

            // Base monthly sales with randomness
            const baseSales = 200 * seasonalFactor * trendFactor;
            const randomFactor = Math.random() * 0.2 + 0.9; // 0.9 to 1.1 random factor
            const sales = Math.round(baseSales * randomFactor);

            // Stock data follows a pattern relative to sales
            const stockAdded = Math.round(sales * (0.8 + Math.random() * 0.4));

            yearlySales.push({
                month: monthName,
                year: year.toString(),
                sales: sales,
                stockAdded: stockAdded
            });
        }

        // Generate top selling items based on current item inventory
        const topSellingItems = await this.generateTopSellingMockData();

        // Generate low stock items
        const lowStockItems = this.getRandomLowStockItems();

        return {
            weeklySales,
            monthlySales,
            yearlySales,
            topSellingItems,
            lowStockItems
        };
    }

    // Generate realistic top selling items based on inventory
    async generateTopSellingMockData() {
        try {
            // First, try to get the actual inventory items
            const items = await this.getItems();

            if (items && items.length > 0) {
                // Create a copy of items and add revenue calculation
                const itemsWithRevenue = items.map(item => ({
                    ...item,
                    sales: item.sales || 0,
                    revenue: (item.sales || 0) * (item.price || 0)
                }));

                // Sort by sales count (highest first)
                const sortedItems = itemsWithRevenue.sort((a, b) => b.sales - a.sales);

                // Return top 5 items (or all if less than 5)
                return sortedItems.slice(0, 5);
            }
        } catch (error) {
            console.error('Error generating top selling items from inventory:', error);
            // If error occurs, fall back to mock data
        }

        // Fallback to mock data if no items or error occurred
        const topCategories = ['Electronics', 'Clothing', 'Food', 'Stationery', 'Furniture'];
        const topItemNames = [
            'Laptop', 'Smartphone', 'Headphones', 'T-shirt', 'Jeans',
            'Bread', 'Milk', 'Notebook', 'Pen Set', 'Desk Chair'
        ];

        const topItems = [];
        for (let i = 0; i < 5; i++) {
            const randomSales = Math.floor(Math.random() * 80) + 20;
            const randomPrice = Math.floor(Math.random() * 50) + 10;
            const category = topCategories[i % topCategories.length];
            const name = topItemNames[i];

            topItems.push({
                name: name,
                category: category,
                price: randomPrice,
                sales: randomSales,
                revenue: randomSales * randomPrice
            });
        }

        // Sort by sales (highest first)
        return topItems.sort((a, b) => b.sales - a.sales);
    }

    // Get random low stock items
    getRandomLowStockItems() {
        // This would ideally be based on real inventory
        const lowStockCategories = ['Electronics', 'Stationery', 'Food'];
        const lowStockNames = [
            'Printer Ink', 'USB Drive', 'AAA Batteries', 'Sticky Notes',
            'Paper Clips', 'Fresh Apples', 'Granola Bars'
        ];

        const lowStockItems = [];
        for (let i = 0; i < 3; i++) {
            const minStock = Math.floor(Math.random() * 5) + 5;
            const currentStock = Math.floor(Math.random() * 4) + 1;
            const category = lowStockCategories[i % lowStockCategories.length];
            const name = lowStockNames[i];

            lowStockItems.push({
                name: name,
                category: category,
                quantity: currentStock,
                minStock: minStock
            });
        }

        return lowStockItems;
    }

    // Helper methods that use the above data
    async getLowStockItems() {
        try {
            const items = await this.getItems();
            return items.filter(item => item.quantity <= (item.minStock || 5));
        } catch (error) {
            console.error('Error getting low stock items:', error);
            throw error;
        }
    }

    async getTotalInventoryCount() {
        try {
            const items = await this.getItems();
            return items.length;
        } catch (error) {
            console.error('Error getting total inventory count:', error);
            throw error;
        }
    }

    async getItemsByCategory(category) {
        try {
            const items = await this.getItems();
            return category === 'All' ?
                items :
                items.filter(item => item.category === category);
        } catch (error) {
            console.error('Error getting items by category:', error);
            throw error;
        }
    }

    // Sell items from inventory
    async sellItem(itemId, quantityToSell) {
        try {
            console.log('Selling item from MongoDB:', { itemId, quantityToSell });

            // Ensure quantity is an integer
            const quantity = parseInt(quantityToSell);
            if (isNaN(quantity) || quantity <= 0) {
                throw new Error('Quantity to sell must be a positive number');
            }

            // Try multiple endpoints to sell item
            const endpoints = [
                `/items/${itemId}/sell`,
                `/api/items/${itemId}/sell`
            ];

            const response = await this.tryMultipleEndpoints(
                (endpoint) => this.api.post(endpoint, { quantity }),
                endpoints
            );

            console.log('Item sold in MongoDB:', response.data);

            // Process and return the updated item with all necessary data
            const updatedItem = response.data;

            // Ensure all expected fields are present for value calculations
            if (updatedItem) {
                const id = updatedItem._id || updatedItem.id;
                return {
                    ...updatedItem,
                    id: id,
                    _id: id,
                    quantity: updatedItem.quantity || 0,
                    price: updatedItem.price || 0,
                    sales: updatedItem.sales || 0
                };
            }

            return updatedItem;
        } catch (error) {
            console.error('Error selling item:', error);

            // Try direct API call as last resort
            try {
                console.log('Trying direct API call to sell item...');
                const directResponse = await axios.post(`http://localhost:8080/api/items/${itemId}/sell`, {
                    quantity: quantityToSell
                });
                console.log('Item sold with direct API call:', directResponse.data);

                // Process and return the updated item
                const updatedItem = directResponse.data;
                if (updatedItem) {
                    const id = updatedItem._id || updatedItem.id;
                    return {
                        ...updatedItem,
                        id: id,
                        _id: id,
                        quantity: updatedItem.quantity || 0,
                        price: updatedItem.price || 0,
                        sales: updatedItem.sales || 0
                    };
                }

                return directResponse.data;
            } catch (directError) {
                console.error('Direct API call also failed:', directError);
            }

            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
                throw new Error(`Failed to sell item: ${error.response.data.error || error.message}`);
            }
            throw new Error('Failed to sell item from MongoDB database');
        }
    }

    // Helper method to get default image URL for a category
    getDefaultImageForCategory(category) {
        if (!category) return '/assets/images/categories/default.jpg';

        const categoryName = category.toLowerCase().replace(/\s+/g, '-');
        const imageMap = {
            'electronics': '/assets/images/categories/electronics.jpg',
            'furniture': '/assets/images/categories/furniture.jpg',
            'stationery': '/assets/images/categories/default.jpg',
            'office-supplies': '/assets/images/categories/office-supplies.jpg'
        };

        return imageMap[categoryName] || '/assets/images/categories/default.jpg';
    }

    // Category Management
    async addCategory(categoryData) {
        try {
            const endpoints = [
                '/categories',
                '/api/categories'
            ];

            const response = await this.tryMultipleEndpoints(
                (endpoint) => this.api.post(endpoint, categoryData),
                endpoints
            );

            return response.data;
        } catch (error) {
            console.error('Error adding category:', error);
            throw error; // Re-throw to allow handling in components
        }
    }

    async updateCategory(categoryId, categoryData) {
        try {
            const endpoints = [
                `/categories/${categoryId}`,
                `/api/categories/${categoryId}`
            ];

            const response = await this.tryMultipleEndpoints(
                (endpoint) => this.api.put(endpoint, categoryData),
                endpoints
            );

            return response.data;
        } catch (error) {
            console.error('Error updating category:', error);
            throw error; // Re-throw to allow handling in components
        }
    }

    async removeCategory(categoryId) {
        try {
            const endpoints = [
                `/categories/${categoryId}`,
                `/api/categories/${categoryId}`
            ];

            const response = await this.tryMultipleEndpoints(
                (endpoint) => this.api.delete(endpoint),
                endpoints
            );

            return response.data;
        } catch (error) {
            console.error('Error removing category:', error);
            throw error; // Re-throw to allow handling in components
        }
    }

    // Get default image URL based on category
    getDefaultImageUrl(category) {
        const categoryMap = {
            'electronics': '/images/categories/electronics.jpg',
            'groceries': '/images/categories/groceries.jpg',
            'clothing': '/images/categories/clothing.jpg',
            'home appliances': '/images/categories/home-appliances.jpg',
            'stationery': '/images/categories/stationery.jpg'
        };

        if (!category) return '/images/placeholder.jpg';

        const key = category.toLowerCase();
        return categoryMap[key] || '/images/placeholder.jpg';
    }

    // Add a method to fetch sales history for a specific item
    async getItemSalesHistory(itemId) {
        try {
            console.log('Fetching sales history for item:', itemId);

            const endpoints = [
                `/sales/history/${itemId}`,
                `/api/sales/history/${itemId}`
            ];

            let response = null;
            let lastError = null;

            // Try each endpoint until one works
            for (const endpoint of endpoints) {
                try {
                    console.log(`Trying to fetch sales history with: ${endpoint}`);
                    response = await this.api.get(endpoint);
                    if (response.data) {
                        console.log('Sales history fetched successfully:', response.data.length, 'records');
                        break;
                    }
                } catch (err) {
                    lastError = err;
                    console.error(`Failed with endpoint ${endpoint}:`, err);
                }
            }

            if (!response) {
                // If all endpoints failed, try direct call without baseURL
                console.log('Trying direct endpoint call for sales history...');
                response = await axios.get(`http://localhost:8080/api/sales/history/${itemId}`);
                console.log('Direct endpoint successful:', response.data);
            }

            return response.data;
        } catch (error) {
            console.error('Error fetching item sales history:', error);
            throw error;
        }
    }

    // Add a method to update all item prices
    async updateAllItemPrices() {
        try {
            console.log('Updating all item prices');

            const endpoints = [
                '/items/update-prices',
                '/api/items/update-prices'
            ];

            let response = null;
            let lastError = null;

            // Try each endpoint until one works
            for (const endpoint of endpoints) {
                try {
                    console.log(`Trying to update prices with: ${endpoint}`);
                    response = await this.api.patch(endpoint);
                    if (response.data) {
                        console.log('Prices updated successfully:', response.data);
                        break;
                    }
                } catch (err) {
                    lastError = err;
                    console.error(`Failed to update prices with endpoint ${endpoint}:`, err);
                }
            }

            if (!response) {
                // If all endpoints failed, try direct call without baseURL
                console.log('Trying direct endpoint call to update prices...');
                response = await axios.patch('http://localhost:8080/api/items/update-prices');
                console.log('Direct endpoint successful:', response.data);
            }

            return response.data;
        } catch (error) {
            console.error('Error updating prices:', error);
            throw error;
        }
    }

    // Add a method to fetch recent transactions
    async getRecentTransactions() {
        try {
            console.log('Fetching recent transactions');

            const endpoints = [
                '/transactions',
                '/api/transactions',
                '/sales/transactions',
                '/api/sales/transactions',
                '/api/sales/history'
            ];

            let response = null;

            // Try each endpoint until one works
            for (const endpoint of endpoints) {
                try {
                    console.log(`Trying to fetch transactions with: ${endpoint}`);
                    response = await this.api.get(endpoint);
                    if (response.data) {
                        console.log('Transactions fetched successfully:', response.data.length, 'records');
                        return response.data;
                    }
                } catch (err) {
                    console.error(`Failed with endpoint ${endpoint}:`, err);
                }
            }

            // If all API endpoints failed, try to get transaction data from item sales history
            try {
                // Get all items to find those with sales
                const items = await this.getItems();
                const itemsWithSales = items.filter(item => item.sales && item.sales > 0);

                let allTransactions = [];

                // For each item with sales, get its sales history
                for (const item of itemsWithSales.slice(0, 3)) { // Limit to 3 items to avoid too many requests
                    try {
                        const itemHistory = await this.getItemSalesHistory(item._id || item.id);
                        if (itemHistory && itemHistory.length > 0) {
                            allTransactions = allTransactions.concat(itemHistory);
                        }
                    } catch (err) {
                        console.error(`Failed to get sales history for item ${item.name}:`, err);
                    }
                }

                // If we found transactions, return them
                if (allTransactions.length > 0) {
                    console.log('Retrieved transactions from item sales history:', allTransactions.length, 'records');
                    return allTransactions;
                }
            } catch (err) {
                console.error('Failed to retrieve transactions from item sales history:', err);
            }

            console.error('Failed to retrieve any transaction data');
            return [];
        } catch (error) {
            console.error('Error fetching recent transactions:', error);
            return [];
        }
    }
}

// Create and export a singleton instance
const dataService = new DataService();
export default dataService;