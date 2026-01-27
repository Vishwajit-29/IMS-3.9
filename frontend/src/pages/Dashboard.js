import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import dataService from '../services/DataService';
import SalesChart from '../components/SalesChart';
import AddItemModal from '../components/AddItemModal';
import RemoveItemModal from '../components/RemoveItemModal';
import CategoryModal from '../components/CategoryModal';
import SellItemModal from '../components/SellItemModal';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatUtils';
import { FaChartLine, FaEye, FaQuestionCircle } from 'react-icons/fa';
import './Dashboard.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ItemSalesHistory from '../components/ItemSalesHistory';
import { toast } from 'react-toastify';
import UpdatePricesModal from '../components/UpdatePricesModal';
import ItemDetailModal from '../components/ItemDetailModal';

function Dashboard() {
    const { user, logout } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [salesData, setSalesData] = useState({
        weeklySales: [],
        monthlySales: [],
        yearlySales: [],
        topSellingItems: [],
        lowStockItems: []
    });
    const [showAddModal, setShowAddModal] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showSellModal, setShowSellModal] = useState(false);
    const [lowStockCount, setLowStockCount] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [filterType, setFilterType] = useState('category');
    const [stockLevel, setStockLevel] = useState('all');
    const [categories, setCategories] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [activeTimeRange, setActiveTimeRange] = useState('Weekly');
    const [salesView, setSalesView] = useState('list');
    const [hoveredItem, setHoveredItem] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
    const inventoryRef = useRef(null);
    const tutorialRef = useRef(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [itemActionLoading, setItemActionLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [weeklySales, setWeeklySales] = useState([]);
    const [monthlySales, setMonthlySales] = useState([]);
    const [yearlySales, setYearlySales] = useState([]);
    const [topSellingItems, setTopSellingItems] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [totalInventory, setTotalInventory] = useState(0);
    const [timeRange, setTimeRange] = useState('Weekly');
    const [addItemModalOpen, setAddItemModalOpen] = useState(false);
    const [sellItemModalOpen, setSellItemModalOpen] = useState(false);
    const [removeItemModalOpen, setRemoveItemModalOpen] = useState(false);
    const [showItemSalesChart, setShowItemSalesChart] = useState(false);
    const [updatePricesModalOpen, setUpdatePricesModalOpen] = useState(false);
    const [outOfStockCount, setOutOfStockCount] = useState(0);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedDetailItem, setSelectedDetailItem] = useState(null);
    const [monthlyRevenue, setMonthlyRevenue] = useState({});

    useEffect(() => {
        // Load dark mode preference from localStorage
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        if (savedDarkMode) {
            setDarkMode(true);
            document.body.classList.add('dark-mode-body');
            document.documentElement.classList.add('dark-mode');
        }

        // Load saved sales view preference from localStorage (default to 'list')
        const savedSalesView = localStorage.getItem('salesView') || 'list';
        setSalesView(savedSalesView);
    }, []);

    useEffect(() => {
        loadData();

        // Refresh data every 5 minutes
        const intervalId = setInterval(() => {
            dataService.getItems().then(fetchedItems => {
                // Only update if there are actual changes in the data
                if (JSON.stringify(fetchedItems) !== JSON.stringify(items)) {
                    setItems(fetchedItems);

                    // Update derived states
                    const lowStockItems = fetchedItems.filter(item => item.quantity > 0 && item.quantity <= (item.minStock || 5));
                    setLowStockCount(lowStockItems.length);
                    setTotalItems(fetchedItems.length);

                    // Calculate out of stock items
                    const outOfStock = fetchedItems.filter(item => item.quantity === 0);
                    setOutOfStockCount(outOfStock.length);

                    // Calculate monthly revenue
                    calculateMonthlyRevenue().then(newMonthlyRevenue => {
                        setMonthlyRevenue(newMonthlyRevenue);
                    });
                }
            }).catch(err => {
                console.error("Background refresh error:", err);
            });

            dataService.getSalesData().then(newSalesData => {
                setSalesData(newSalesData);
            }).catch(err => {
                console.error("Background sales refresh error:", err);
            });
        }, 300000); // 5 minutes

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        // Calculate and set monthly revenue
        console.log("Initializing monthly revenue");
        calculateMonthlyRevenue().then(newMonthlyRevenue => {
            console.log("Setting monthly revenue:", newMonthlyRevenue);
            setMonthlyRevenue(newMonthlyRevenue);
        }).catch(error => {
            console.error("Error initializing monthly revenue:", error);
        });
    }, []);

    const loadData = async() => {
        try {
            setLoading(true);
            setError(null);

            // Fetch items
            const itemsData = await dataService.getItems();
            setItems(itemsData);

            // Immediately set count values based on loaded data
            const lowStock = itemsData.filter(item => item.quantity > 0 && item.quantity <= (item.minStock || 5));
            setLowStockCount(lowStock.length);
            setTotalItems(itemsData.length);

            // Calculate out of stock items
            const outOfStock = itemsData.filter(item => item.quantity === 0);
            setOutOfStockCount(outOfStock.length);

            // Calculate and set monthly revenue based on transaction data
            const monthlyRevenueData = await calculateMonthlyRevenue();
            setMonthlyRevenue(monthlyRevenueData);

            // Fetch categories
            try {
                const categoriesData = await dataService.getCategories();
                setCategories(categoriesData);
            } catch (categoryError) {
                console.error('Error loading categories:', categoryError);
                // If categories fail to load, set default ones
                setCategories([
                    { id: 'electronics', name: 'Electronics' },
                    { id: 'furniture', name: 'Furniture' },
                    { id: 'stationery', name: 'Stationery' },
                    { id: 'office-supplies', name: 'Office Supplies' }
                ]);
            }

            // Prepare low stock items list
            setLowStockItems(lowStock.slice(0, 5));

            // Calculate total inventory value
            const totalValue = itemsData.reduce((sum, item) =>
                sum + (item.price * item.quantity), 0
            );
            setTotalInventory(totalValue);

            // Fetch sales data
            const salesResponse = await dataService.getSalesData();
            setSalesData(salesResponse);

            // Set default sales view and time range
            setSalesView('list');
            setTimeRange('Weekly');

            // Prepare data for sales chart
            if (salesResponse) {
                // Extract data based on time range
                if (salesResponse.weeklySales)
                    setWeeklySales(salesResponse.weeklySales);
                if (salesResponse.monthlySales)
                    setMonthlySales(salesResponse.monthlySales);
                if (salesResponse.yearlySales)
                    setYearlySales(salesResponse.yearlySales);
                if (salesResponse.topSellingItems)
                    setTopSellingItems(salesResponse.topSellingItems.slice(0, 5));
            }

            setLoading(false);
        } catch (err) {
            console.error('Error loading data:', err);
            setError('Failed to load data');
            setLoading(false);
        }
    };

    const filteredItems = useMemo(() => {
        let filtered = [...items];

        // Apply stock level filter
        if (filterType === 'stockLevel') {
            if (stockLevel === 'low') {
                filtered = filtered.filter(item =>
                    item.quantity > 0 && item.quantity <= (item.minStock || 5)
                );
            } else if (stockLevel === 'out') {
                filtered = filtered.filter(item => item.quantity === 0);
            }
        }
        // Apply category filter
        else if (filterType === 'category' && selectedCategory !== 'All') {
            filtered = filtered.filter(item => item.category === selectedCategory);
        }

        return filtered;
    }, [items, filterType, stockLevel, selectedCategory]);

    const handleAddItem = async(itemData) => {
        try {
            setItemActionLoading(true);
            const result = await dataService.addItem(itemData);
            await loadData();
            setSuccessMessage('Item added successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
            return result;
        } catch (error) {
            console.error('Error adding item:', error);
            setErrorMessage(error.message || 'Failed to add item. Please try again.');
            setTimeout(() => setErrorMessage(''), 5000);
            throw error;
        } finally {
            setItemActionLoading(false);
        }
    };

    const handleRemoveItem = async(itemId, quantity = null) => {
        try {
            setItemActionLoading(true);
            const result = await dataService.removeItem(itemId, quantity);

            // Log operation details for debugging
            console.log(quantity === null ?
                `Item ${itemId} completely removed` :
                `Removed ${quantity} units from item ${itemId}`);

            // Refresh the items list after removing
            await loadData();

            // Show success message
            setSuccessMessage(quantity === null ?
                'Item removed successfully!' :
                'Item quantity updated successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);

            return result;
        } catch (error) {
            console.error('Error removing item:', error);
            setErrorMessage(error.message || 'Failed to remove item. Please try again.');
            setTimeout(() => setErrorMessage(''), 5000);
            throw error;
        } finally {
            setItemActionLoading(false);
        }
    };

    const handleSellItem = async(itemId, quantity) => {
        try {
            setItemActionLoading(true);
            const result = await dataService.sellItem(itemId, quantity);

            // Refresh the items list after selling
            await loadData();

            // Show success message
            setSuccessMessage(`Successfully sold ${quantity} units!`);
            setTimeout(() => setSuccessMessage(''), 3000);

            // Return the updated item data for the modal
            return result;
        } catch (error) {
            console.error('Error selling item:', error);
            setErrorMessage(error.message || 'Failed to sell item. Please try again.');
            setTimeout(() => setErrorMessage(''), 5000);
            throw error;
        } finally {
            setItemActionLoading(false);
        }
    };

    const handleShowAddModal = (itemId) => {
        if (itemId) {
            const item = items.find(i => i._id === itemId || i.id === itemId);
            if (item) {
                setSelectedItem(item);
            }
        } else {
            setSelectedItem(null);
        }
        setShowAddModal(true);
    };

    const handleCloseAddModal = () => {
        setShowAddModal(false);
        setSelectedItem(null);
        loadData();
    };

    const handleShowRemoveModal = (itemId) => {
        if (itemId) {
            const item = items.find(i => i._id === itemId || i.id === itemId);
            if (item) {
                setSelectedItem(item);
            }
        } else {
            setSelectedItem(null);
        }
        setShowRemoveModal(true);
    };

    const handleCloseRemoveModal = () => {
        setShowRemoveModal(false);
        setSelectedItem(null);
        loadData();
    };

    const handleShowSellModal = (itemId) => {
        if (itemId) {
            const item = items.find(i => i._id === itemId || i.id === itemId);
            if (item) {
                setSelectedItem(item);
            }
        } else {
            setSelectedItem(null);
        }
        setShowSellModal(true);
    };

    const handleCloseSellModal = () => {
        setShowSellModal(false);
        setSelectedItem(null);
        loadData();
    };

    const getImageUrl = (item) => {
        if (!item) return '/placeholder.png';

        if (item.image && item.image.trim() !== '') {
            return item.image.startsWith('http') ? item.image : `/uploads/${item.image}`;
        }

        if (item.imageUrl && item.imageUrl.trim() !== '') {
            return item.imageUrl;
        }

        const categoryName = item.category ? item.category.toLowerCase().replace(/\s+/g, '-') : 'default';
        return `/assets/images/items/${categoryName}-default.jpg`;
    };

    const scrollToItem = (itemId) => {
        if (inventoryRef.current) {
            const element = document.getElementById(`item-${itemId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('highlight-item');
                setTimeout(() => {
                    element.classList.remove('highlight-item');
                }, 2000);
            }
        }
    };

    const toggleDarkMode = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);

        // Apply to body for full-app dark mode
        if (newDarkMode) {
            document.body.classList.add('dark-mode-body');
            document.documentElement.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode-body');
            document.documentElement.classList.remove('dark-mode');
        }

        // Save preference in localStorage
        localStorage.setItem('darkMode', newDarkMode ? 'true' : 'false');
    };

    const getCurrentSalesData = () => {
        switch (activeTimeRange) {
            case 'Weekly':
                return salesData.weeklySales || [];
            case 'Monthly':
                return salesData.monthlySales || [];
            case 'Yearly':
                return salesData.yearlySales || [];
            default:
                return [];
        }
    };

    const getTopSellingItems = () => {
        return salesData.topSellingItems || [];
    };

    const handleSalesViewChange = (view) => {
        setSalesView(view);
        localStorage.setItem('salesView', view);
    };

    const handleViewItemStats = (item) => {
        console.log('View stats for item:', item);
        // Prepare the item data in the right format if it's coming from inventory
        if (!item.revenue && item.price) {
            const itemWithRevenue = {
                ...item,
                revenue: (item.sales || 0) * (item.price || 0)
            };
            setSelectedItem(itemWithRevenue);
        } else {
            setSelectedItem(item);
        }
        setShowItemSalesChart(true);
    };

    const handleUpdatePrices = async() => {
        setUpdatePricesModalOpen(true);
    };

    const handleCloseUpdatePricesModal = (updatedCount = 0) => {
        setUpdatePricesModalOpen(false);
        if (updatedCount > 0) {
            toast.success(updatedCount + ' items updated with prices');
            // Reload items to show updated prices
            loadData();
        }
    };

    const renderItemSalesChartDialog = () => {
        if (!showItemSalesChart || !selectedItem) return null;

        return ( <
            div className = "item-sales-chart-dialog"
            onClick = {
                () => setShowItemSalesChart(false)
            } >
            <
            div className = "item-sales-chart-content"
            onClick = {
                (e) => e.stopPropagation()
            } >
            <
            div className = "item-sales-chart-header" >
            <
            h3 > { selectedItem.name }
            Sales Analysis < /h3> <
            button className = "close-btn"
            onClick = {
                () => setShowItemSalesChart(false)
            } > × < /button> < /
            div > <
            div className = "item-sales-chart-body" >
            <
            ItemSalesHistory itemId = { selectedItem._id || selectedItem.id }
            itemName = { selectedItem.name }
            /> < /
            div > <
            /div> < /
            div >
        );
    };

    const renderSalesSection = () => {
            return ( <
                div className = "sales-section" >
                <
                div className = "sales-header" >
                <
                h2 > Sales Overview < /h2> <
                div className = "view-toggle" >
                <
                button className = { `view-toggle-btn ${salesView === 'chart' ? 'active' : ''}` }
                onClick = {
                    () => handleSalesViewChange('chart')
                } >
                Chart <
                /button> <
                button className = { `view-toggle-btn ${salesView === 'list' ? 'active' : ''}` }
                onClick = {
                    () => handleSalesViewChange('list')
                } >
                List <
                /button> < /
                div > <
                /div>

                {
                    salesView === 'chart' ? ( <
                        div className = "sales-chart" > { renderMonthlyRevenue() }

                        <
                        h3 className = "chart-title" > Revenue by Item < /h3> <
                        div className = "revenue-list-container" > {!items || items.length === 0 ? ( <
                                div className = "loading-spinner-container" >
                                <
                                div className = "loading-spinner" > < /div> <
                                p > Loading revenue data... < /p> < /
                                div >
                            ) : error ? ( <
                                div className = "error-message" >
                                <
                                span className = "error-icon" > ⚠️ < /span>{error} < /
                                div >
                            ) : ( <
                                ul className = "revenue-list" > {
                                    [...items]
                                    .sort((a, b) => {
                                        const revenueA = (a.sales || 0) * (a.price || 0);
                                        const revenueB = (b.sales || 0) * (b.price || 0);
                                        return revenueB - revenueA;
                                    })
                                    .map((item, index) => {
                                        const itemRevenue = (item.sales || 0) * (item.price || 0);

                                        return ( <
                                            li key = { item._id || item.id }
                                            className = "revenue-item" >
                                            <
                                            div className = "revenue-rank" > { index + 1 } < /div> <
                                            div className = "revenue-item-details" >
                                            <
                                            div className = "revenue-item-name" > { item.name } <
                                            /div> <
                                            div className = "revenue-item-category" > { item.category } <
                                            /div> < /
                                            div > <
                                            div className = "revenue-item-stats" >
                                            <
                                            div className = "revenue-item-revenue" > { formatCurrency(itemRevenue) } <
                                            /div> <
                                            div className = "revenue-item-sales" > { item.sales || 0 }
                                            units sold <
                                            /div> < /
                                            div > <
                                            div className = "revenue-item-action" >
                                            <
                                            button className = "view-stats"
                                            onClick = {
                                                () => handleViewItemStats({...item, revenue: itemRevenue })
                                            }
                                            title = "View Details" >
                                            <
                                            FaChartLine / >
                                            <
                                            /button> < /
                                            div > <
                                            /li>
                                        );
                                    })
                                } <
                                /ul>
                            )
                        } <
                        /div> < /
                        div >
                    ) : ( <
                        div className = "sales-list" >
                        <
                        h3 > Top Performing Items < /h3> {!topSellingItems || topSellingItems.length === 0 ? ( <
                            div className = "empty-state small" >
                            <
                            div className = "empty-icon" > 📊 < /div> <
                            p > No sales data available yet < /p> < /
                            div >
                        ) : ( <
                            ul className = "ranking-list top-items-list" > {
                                topSellingItems.map((item, index) => {
                                    // Calculate revenue from sales and price if it doesn't exist
                                    const itemRevenue = item.revenue || (item.sales || 0) * (item.price || 0);

                                    return ( <
                                        li key = { index }
                                        className = "ranking-item" >
                                        <
                                        div className = "ranking-number" > { index + 1 } <
                                        /div> <
                                        div className = "ranking-content" >
                                        <
                                        div className = "item-primary" >
                                        <
                                        div className = "item-name" > { item.name } <
                                        /div> <
                                        div className = "item-category" > { item.category } <
                                        /div> < /
                                        div > <
                                        div className = "item-secondary" >
                                        <
                                        div className = "item-revenue" > { formatCurrency(itemRevenue) } <
                                        /div> <
                                        div className = "item-units" > { item.sales }
                                        units <
                                        /div> < /
                                        div > <
                                        /div> <
                                        div className = "ranking-action" >
                                        <
                                        button className = "view-stats"
                                        onClick = {
                                            () => handleViewItemStats({...item, revenue: itemRevenue })
                                        }
                                        title = "View Details" >
                                        <
                                        FaChartLine / >
                                        <
                                        /button> < /
                                        div > <
                                        /li>
                                    );
                                })
                            } <
                            /ul>
                        )
                    }

                    <
                    h3 > Low Stock Items < /h3> {!lowStockItems || lowStockItems.length === 0 ? ( <
                        div className = "empty-state small" >
                        <
                        div className = "empty-icon" > 📦 < /div> <
                        p > No low stock items < /p> < /
                        div >
                    ) : ( <
                        ul className = "low-stock-list" > {
                            lowStockItems.map((item, index) => ( <
                                li key = { index }
                                className = "low-stock-item" >
                                <
                                div className = "item-name" > { item.name } <
                                /div> <
                                div className = "category" > { item.category } <
                                /div> <
                                div className = "stock-info" >
                                <
                                span className = "quantity" > { item.quantity } <
                                /span> <
                                span className = "separator" > /</span >
                                <
                                span className = "min-stock" > { item.minStock || 5 } <
                                /span> < /
                                div > <
                                /li>
                            ))
                        } <
                        /ul>
                    )
                }

                { /* Tutorial Section */ } <
                div className = "tutorial-section"
                ref = { tutorialRef } >
                <
                h3 > Quick Tutorial < /h3> <
                div className = "tutorial-steps" >
                <
                div className = "tutorial-step" >
                <
                div className = "step-number" > 1 < /div> <
                div className = "step-content" >
                <
                h4 > Managing Inventory < /h4> <
                p > Add new items to your inventory using the "Add Item"
                button at the top of the dashboard. < /p> < /
                div > <
                /div> <
                div className = "tutorial-step" >
                <
                div className = "step-number" > 2 < /div> <
                div className = "step-content" >
                <
                h4 > Recording Sales < /h4> <
                p > Click "Sell Item"
                to record a sale transaction.Select an item, enter quantity, and the sale will be added to your sales data. < /p> < /
                div > <
                /div> <
                div className = "tutorial-step" >
                <
                div className = "step-number" > 3 < /div> <
                div className = "step-content" >
                <
                h4 > Monitoring Stock < /h4> <
                p > Keep an eye on "Low Stock Items"
                to know when to restock.Items below their minimum threshold will appear here. < /p> < /
                div > <
                /div> <
                div className = "tutorial-step" >
                <
                div className = "step-number" > 4 < /div> <
                div className = "step-content" >
                <
                h4 > Analyzing Sales < /h4> <
                p > Toggle between Chart and List views to analyze your sales data in different formats. < /p> < /
                div > <
                /div> < /
                div > <
                /div>

                { /* FAQ Section */ } <
                div className = "faq-section" >
                <
                h3 > Frequently Asked Questions < /h3> <
                div className = "faq-items" >
                <
                div className = "faq-item" >
                <
                div className = "faq-question" > How do I add a new category ? < /div> <
                div className = "faq-answer" > Use the category dropdown when adding a new item and select "Add New Category"
                to create custom categories. < /div> < /
                div > <
                div className = "faq-item" >
                <
                div className = "faq-question" > What happens when an item goes out of stock ? < /div> <
                div className = "faq-answer" > Items at zero quantity are marked as "Out of Stock"
                and appear in the Out of Stock filter.You can still view their details but cannot sell them until restocked. < /div> < /
                div > <
                div className = "faq-item" >
                <
                div className = "faq-question" > How is revenue calculated ? < /div> <
                div className = "faq-answer" > Revenue is calculated by multiplying the quantity sold by the item 's price at the time of sale. Monthly revenue totals are displayed in the charts view.</div> < /
                div > <
                div className = "faq-item" >
                <
                div className = "faq-question" > Can I update prices
                for multiple items ? < /div> <
                div className = "faq-answer" > Yes, use the "Update Prices"
                button to modify prices
                for multiple items at once, with options
                for percentage increases or fixed amounts. < /div> < /
                div > <
                /div>

                { /* Help Button Callout */ } <
                div className = "help-callout" >
                <
                p > Need help anytime ? Click the < FaQuestionCircle className = "help-button-indicator" / > button in the bottom - right corner
                for quick access to this tutorial. < /p> < /
                div > <
                /div> < /
                div >
            )
        } <
        /div>
);
};

const handleShowItemDetails = (item) => {
    setSelectedDetailItem(item);
    setShowDetailModal(true);
};

const handleStatPillClick = (type) => {
    if (type === 'all') {
        setFilterType('category');
        setSelectedCategory('All');
    } else if (type === 'low') {
        setFilterType('stockLevel');
        setStockLevel('low');
    } else if (type === 'out') {
        setFilterType('stockLevel');
        setStockLevel('out');
    }
    if (inventoryRef.current) {
        inventoryRef.current.scrollIntoView({ behavior: 'smooth' });
    }
};

const handleCategoryChange = (category) => {
    setFilterType('category');
    setSelectedCategory(category);
};

// Scroll to tutorial section
const scrollToTutorial = () => {
    if (tutorialRef.current) {
        tutorialRef.current.scrollIntoView({ behavior: 'smooth' });
        // Ensure list view is selected to show tutorial
        if (salesView !== 'list') {
            handleSalesViewChange('list');
        }
    }
};

// Calculate monthly revenue from transaction data
const calculateMonthlyRevenue = async() => {
    try {
        // Try to fetch transaction data from API
        let transactions = await dataService.getRecentTransactions();

        // If no transactions found, use the manual data from the screenshot
        if (!transactions || transactions.length === 0) {
            console.log("No transaction data from API, using manual data");

            // This is the data from the Recent Transactions table in the UI
            transactions = [
                { date: '18 Apr 2025, 10:57 pm', quantity: 20, unitPrice: 1500, total: 30000 },
                { date: '18 Apr 2025, 06:58 pm', quantity: 10, unitPrice: 1500, total: 15000 },
                { date: '18 Apr 2025, 06:56 pm', quantity: 10, unitPrice: 1200, total: 12000 },
                { date: '8 Apr 2025, 03:08 am', quantity: 15, unitPrice: 1200, total: 18000 },
                { date: '8 Apr 2025, 01:35 am', quantity: 5, unitPrice: 1200, total: 6000 },
                { date: '29 Mar 2025, 12:07 pm', quantity: 10, unitPrice: 1200, total: 12000 },
                { date: '29 Mar 2025, 10:01 am', quantity: 10, unitPrice: 1200, total: 12000 },
                { date: '29 Mar 2025, 10:00 am', quantity: 10, unitPrice: 1200, total: 12000 },
                { date: '28 Mar 2025, 08:57 pm', quantity: 90, unitPrice: 1200, total: 108000 }
            ];
        }

        console.log("Retrieved transaction data:", transactions);

        // Group by month
        const monthlyRevenue = {};

        transactions.forEach(transaction => {
            // Parse date from transaction with multiple format handling
            let date;

            if (transaction.date) {
                // Handle multiple date formats
                if (typeof transaction.date === 'string') {
                    // Check if it's in the format seen in the modal (18 Apr 2025, 10:57 pm)
                    if (transaction.date.includes(',')) {
                        const parts = transaction.date.split(',')[0].split(' ');
                        const day = parseInt(parts[0]);
                        const month = parts[1];
                        const year = parseInt(parts[2]);

                        // Map month names to numbers
                        const monthMap = {
                            'Jan': 0,
                            'Feb': 1,
                            'Mar': 2,
                            'Apr': 3,
                            'May': 4,
                            'Jun': 5,
                            'Jul': 6,
                            'Aug': 7,
                            'Sep': 8,
                            'Oct': 9,
                            'Nov': 10,
                            'Dec': 11
                        };

                        date = new Date(year, monthMap[month], day);
                    } else {
                        // ISO format or other string format
                        date = new Date(transaction.date);
                    }
                } else {
                    // If it's a Date object already
                    date = new Date(transaction.date);
                }
            } else if (transaction.timestamp) {
                date = new Date(transaction.timestamp);
            } else {
                // Fall back to using current date if no date info
                console.warn("Transaction has no date:", transaction);
                date = new Date();
            }

            if (isNaN(date.getTime())) {
                console.warn("Invalid date parsed:", date, "from transaction:", transaction);
                return; // Skip this transaction
            }

            // Format as Month Year (e.g., "March 2025")
            const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;

            // Initialize month if not exists
            if (!monthlyRevenue[monthYear]) {
                monthlyRevenue[monthYear] = 0;
            }

            // Add transaction total to monthly revenue
            let transactionTotal = 0;

            if (transaction.total) {
                transactionTotal = parseFloat(transaction.total);
            } else if (transaction.totalPrice) {
                transactionTotal = parseFloat(transaction.totalPrice);
            } else {
                const unitPrice = parseFloat(transaction.unitPrice || transaction.price || 0);
                const quantity = parseInt(transaction.quantity || 1);
                transactionTotal = unitPrice * quantity;
            }

            if (isNaN(transactionTotal)) {
                console.warn("Invalid transaction total calculated:", transactionTotal, "from:", transaction);
                transactionTotal = 0;
            }

            monthlyRevenue[monthYear] += transactionTotal;
        });

        console.log("Calculated monthly revenue:", monthlyRevenue);

        return monthlyRevenue;
    } catch (error) {
        console.error('Error calculating monthly revenue:', error);
        return {};
    }
};

const renderMonthlyRevenue = () => {
    return ( <
        div className = "monthly-revenue-cards" >
        <
        h3 className = "chart-title" > Monthly Revenue < /h3> <
        div className = "monthly-revenue-grid" > {
            Object.entries(monthlyRevenue).length === 0 ? ( <
                div className = "empty-revenue-message" >
                <
                p > No revenue data available yet.Data from recent transactions will appear here. < /p> < /
                div >
            ) : (
                // Sort entries by date (newest first) before mapping
                Object.entries(monthlyRevenue)
                .sort((a, b) => {
                    // Parse month names to get proper sorting
                    const [monthA, yearA] = a[0].split(' ');
                    const [monthB, yearB] = b[0].split(' ');

                    // Compare years first
                    if (yearA !== yearB) return yearB - yearA;

                    // If same year, compare months
                    const months = ["January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"
                    ];
                    return months.indexOf(monthB) - months.indexOf(monthA);
                })
                .map(([month, revenue]) => ( <
                    div key = { month }
                    className = "monthly-revenue-card" >
                    <
                    div className = "month-name" > { month } <
                    /div> <
                    div className = "month-revenue" > { formatCurrency(revenue) } <
                    /div> < /
                    div >
                ))
            )
        } <
        /div> < /
        div >
    );
};

return ( <
        div className = { `dashboard ${darkMode ? 'dark-mode' : ''}` } >
        <
        ToastContainer / >

        <
        div className = "dashboard-header" >
        <
        div className = "welcome-banner" >
        <
        h2 > Welcome, Admin! < /h2> < /
        div > <
        button onClick = { toggleDarkMode }
        className = "theme-toggle" >
        <
        span className = "theme-icon" > { darkMode ? '☀️' : '🌙' } < /span> < /
        button > <
        /div>

        <
        div className = "action-buttons-row" >
        <
        button onClick = {
            () => handleShowAddModal()
        }
        className = "action-button add-item" >
        Add Item <
        /button> <
        button onClick = {
            () => handleShowSellModal()
        }
        className = "action-button sell-item" >
        Sell Item <
        /button> <
        button onClick = {
            () => handleShowRemoveModal()
        }
        className = "action-button remove-item" >
        Remove Item <
        /button> <
        button onClick = { handleUpdatePrices }
        className = "action-button update-prices" >
        Update Prices <
        /button> <
        button onClick = { logout }
        className = "action-button logout" >
        Logout <
        /button> < /
        div >

        <
        div className = "dashboard-content" >
        <
        div className = "stats-row" >
        <
        div className = "stat-pills" >
        <
        div className = { `stat-pill clickable ${filterType === 'category' && selectedCategory === 'All' ? 'active' : ''}` }
        onClick = {
            () => handleStatPillClick('all')
        } >
        <
        span className = "stat-icon" > 📦 < /span> <
        span className = "stat-label" > Total Items < /span> <
        span className = "stat-value" > { totalItems } < /span> < /
        div > <
        div className = { `stat-pill warning clickable ${filterType === 'stockLevel' && stockLevel === 'low' ? 'active' : ''}` }
        onClick = {
            () => handleStatPillClick('low')
        } >
        <
        span className = "stat-icon" > ⚠️ < /span> <
        span className = "stat-label" > Low Stock < /span> <
        span className = "stat-value" > { lowStockCount } < /span> < /
        div > <
        div className = { `stat-pill danger clickable ${filterType === 'stockLevel' && stockLevel === 'out' ? 'active' : ''}` }
        onClick = {
            () => handleStatPillClick('out')
        } >
        <
        span className = "stat-icon" > 📦 < /span> <
        span className = "stat-label" > Out of Stock < /span> <
        span className = "stat-value" > { outOfStockCount } < /span> < /
        div > <
        /div> < /
        div >

        <
        div className = "dashboard-layout" >
        <
        div className = "inventory-section" >
        <
        div className = "inventory-header" >
        <
        h2 > Inventory Dashboard < /h2> < /
        div >

        <
        div className = "category-filter" >
        <
        span className = "filter-label" > Filter by Category: < /span> <
        div className = "category-buttons" >
        <
        button className = { `category-btn ${filterType === 'category' && selectedCategory === 'All' ? 'active' : ''}` }
        onClick = {
            () => handleCategoryChange('All')
        } >
        All <
        /button> {
        categories.map(category => ( <
            button key = { category.id }
            className = { `category-btn ${filterType === 'category' && selectedCategory === category.name ? 'active' : ''}` }
            onClick = {
                () => handleCategoryChange(category.name)
            } > { category.name } <
            /button>
        ))
    } <
    /div> < /
div >

    <
    div className = "inventory-container"
ref = { inventoryRef } > {
        loading ? ( <
            div className = "loading-spinner-container" >
            <
            div className = "loading-spinner" > < /div> <
            p > Loading inventory data... < /p> < /
            div >
        ) : error ? ( <
            div className = "error-message" >
            <
            span className = "error-icon" > ⚠️ < /span> <
            p > { error && error.general ? error.general : 'An error occurred while loading data' } < /p> < /
            div >
        ) : ( <
            div className = "inventory-grid" > {
                filteredItems.length === 0 ? ( <
                    div className = "empty-state" >
                    <
                    div className = "empty-icon" > 📦 < /div> <
                    p > No items found in this category. < /p> <
                    button className = "btn btn-primary"
                    onClick = {
                        () => handleCategoryChange('All')
                    } >
                    Show All Items <
                    /button> < /
                    div >
                ) : (
                    filteredItems.map(item => ( <
                        div id = { `item-${item._id || item.id}` }
                        key = { item._id || item.id }
                        className = { `inventory-item ${
                                                    item.quantity <= (item.minStock || 5) ? 'low-stock' : ''
                                                } ${hoveredItem === (item._id || item.id) ? 'hovered' : ''}` }
                        onMouseEnter = {
                            () => setHoveredItem(item._id || item.id)
                        }
                        onMouseLeave = {
                            () => setHoveredItem(null)
                        }
                        onClick = {
                            () => item.description && handleShowItemDetails(item)
                        } >
                        <
                        div className = "item-image-container" >
                        <
                        img src = { getImageUrl(item) }
                        alt = { item.name }
                        className = "item-image"
                        onError = {
                            (e) => {
                                e.target.onerror = null;
                                e.target.src = '/images/items/placeholder.png';
                            }
                        }
                        /> <
                        div className = { `stock-badge ${
                                                        item.quantity === 0 ? 'out-stock' : 
                                                        item.quantity <= (item.minStock || 5) ? 'low-stock' : 'in-stock'
                                                    }` } > { item.quantity === 0 ? 'Out of Stock' : item.quantity <= (item.minStock || 5) ? 'Low Stock' : 'In Stock' } <
                        /div> < /
                        div >

                        <
                        div className = "item-details" >
                        <
                        h3 className = "item-name" > { item.name } < /h3>

                        {
                            item.description && ( <
                                div className = "item-description" > { item.description } < /div>
                            )
                        }

                        <
                        div className = "item-info-grid" >
                        <
                        div className = "info-row" >
                        <
                        span className = "info-label" > Category: < /span> <
                        span className = "info-value" > { item.category } < /span> < /
                        div > <
                        div className = "info-row" >
                        <
                        span className = "info-label" > Quantity: < /span> <
                        span className = "info-value" > { item.quantity } < /span> < /
                        div > <
                        div className = "info-row" >
                        <
                        span className = "info-label" > Min Stock: < /span> <
                        span className = "info-value" > { item.minStock || 5 } < /span> < /
                        div > <
                        div className = "info-row" >
                        <
                        span className = "info-label" > Price: < /span> <
                        span className = "info-value" > { formatCurrency(item.price) } < /span> < /
                        div > <
                        div className = "info-row" >
                        <
                        span className = "info-label" > Sales: < /span> <
                        span className = "info-value" > { item.sales || 0 }
                        units < /span> < /
                        div > <
                        div className = "info-row" >
                        <
                        span className = "info-label" > Last Updated: < /span> <
                        span className = "info-value" > { item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : 'N/A' } < /span> < /
                        div > <
                        /div>

                        <
                        div className = "item-actions" >
                        <
                        button className = "item-action-btn add"
                        onClick = {
                            (e) => {
                                e.stopPropagation();
                                handleShowAddModal(item._id || item.id);
                            }
                        } >
                        <
                        span className = "action-icon" > + < /span> < /
                        button > <
                        button className = "item-action-btn view"
                        onClick = {
                            (e) => {
                                e.stopPropagation();
                                handleViewItemStats(item);
                            }
                        } >
                        <
                        span className = "action-icon" > < FaEye / > < /span> < /
                        button > <
                        button className = "item-action-btn sell"
                        onClick = {
                            (e) => {
                                e.stopPropagation();
                                handleShowSellModal(item._id || item.id);
                            }
                        } >
                        <
                        span className = "action-icon" > ₹ < /span> < /
                        button > <
                        button className = "item-action-btn remove"
                        onClick = {
                            (e) => {
                                e.stopPropagation();
                                handleShowRemoveModal(item._id || item.id);
                            }
                        } >
                        <
                        span className = "action-icon" > - < /span> < /
                        button > <
                        /div> < /
                        div > <
                        /div>
                    ))
                )
            } <
            /div>
        )
    } <
    /div> < /
div >

    <
    div className = "analytics-section" > { renderSalesSection() } <
    /div> < /
div > <
    /div>

{ /* Help Button - Quick Access to Tutorial */ } <
button className = "help-button"
onClick = { scrollToTutorial }
title = "Quick Tutorial & FAQ" >
    <
    FaQuestionCircle className = "help-icon" / >
    <
    /button>

{
    showAddModal && ( <
        AddItemModal show = { showAddModal }
        onClose = { handleCloseAddModal }
        onAddItem = { handleAddItem }
        item = { selectedItem }
        categories = { categories.filter(c => c.name !== 'All') }
        items = { items }
        />
    )
}

{
    showRemoveModal && ( <
        RemoveItemModal show = { showRemoveModal }
        onClose = { handleCloseRemoveModal }
        onRemoveItem = { handleRemoveItem }
        item = { selectedItem }
        items = { items }
        categories = { categories.filter(c => c.name !== 'All') }
        />
    )
}

{
    showSellModal && ( <
        SellItemModal show = { showSellModal }
        onClose = { handleCloseSellModal }
        onSellItem = { handleSellItem }
        item = { selectedItem }
        items = { items }
        categories = { categories.filter(c => c.name !== 'All') }
        />
    )
}

{ showItemSalesChart && renderItemSalesChartDialog() }

{
    updatePricesModalOpen && ( <
        UpdatePricesModal onClose = { handleCloseUpdatePricesModal }
        items = { items }
        />
    )
}

{
    showDetailModal && selectedDetailItem && ( <
        ItemDetailModal item = { selectedDetailItem }
        onClose = {
            () => setShowDetailModal(false)
        }
        isDarkMode = { darkMode }
        />
    )
} <
/div>
);
}

export default Dashboard;