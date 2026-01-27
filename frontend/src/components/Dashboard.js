import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBox, FaBoxOpen, FaShoppingBag, FaChartLine, FaSignOutAlt, FaPlus, FaMinus, FaExchangeAlt, FaMoon, FaSun, FaExclamationTriangle } from 'react-icons/fa';
import AddItemModal from './AddItemModal';
import SellItemModal from './SellItemModal';
import RemoveItemModal from './RemoveItemModal';
import DataService from '../services/DataService';
import AuthService from '../services/AuthService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Dashboard = () => {
    const [items, setItems] = useState([]);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [addItemModalOpen, setAddItemModalOpen] = useState(false);
    const [sellItemModalOpen, setSellItemModalOpen] = useState(false);
    const [removeItemModalOpen, setRemoveItemModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [lowStockItems, setLowStockItems] = useState([]);
    const [outOfStockItems, setOutOfStockItems] = useState([]);
    const [totalInventory, setTotalInventory] = useState(0);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [filterType, setFilterType] = useState('category');
    const [stockLevel, setStockLevel] = useState('all');

    const inventoryRef = useRef(null);

    const navigate = useNavigate();
    const dataService = new DataService();
    const authService = new AuthService();

    useEffect(() => {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme') || 'dark';
        setIsDarkMode(savedTheme === 'dark');
        document.body.className = savedTheme === 'dark' ? '' : 'light-mode';

        fetchData();
    }, []);

    const fetchData = async() => {
        try {
            setLoading(true);

            // Fetch items
            const itemsData = await dataService.getItems();
            setItems(itemsData);

            // Calculate low stock items
            const lowStock = itemsData.filter(item =>
                item.quantity <= (item.lowStockThreshold || 5) && item.quantity > 0
            );
            setLowStockItems(lowStock);

            // Calculate out of stock items
            const outOfStock = itemsData.filter(item => item.quantity === 0);
            setOutOfStockItems(outOfStock);

            // Calculate total inventory value
            const totalValue = itemsData.reduce((sum, item) =>
                sum + (item.price * item.quantity), 0
            );
            setTotalInventory(totalValue);

            // Fetch sales (recent transactions)
            const salesData = await dataService.getRecentTransactions();
            setSales(salesData);

            setLoading(false);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load data. Please try again later.');
            setLoading(false);
            toast.error('Failed to load inventory data');
        }
    };

    const toggleTheme = () => {
        const newTheme = isDarkMode ? 'light' : 'dark';
        setIsDarkMode(!isDarkMode);
        document.body.className = !isDarkMode ? '' : 'light-mode';
        localStorage.setItem('theme', newTheme);
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const handleAddItem = async(itemData) => {
        try {
            await dataService.addItem(itemData);
            toast.success('Item added successfully!');
            fetchData(); // Refresh data
            setAddItemModalOpen(false);
        } catch (error) {
            console.error('Error adding item:', error);
            toast.error('Failed to add item');
        }
    };

    const handleSellItem = async(itemId, quantity) => {
        try {
            const result = await dataService.sellItem(itemId, quantity);
            console.log(`Sold ${quantity} of item ${itemId}`);
            toast.success('Item sold successfully!');
            fetchData(); // Refresh data
            setSellItemModalOpen(false);
            return result;
        } catch (error) {
            console.error('Error selling item:', error);
            toast.error('Failed to sell item');
            throw error;
        }
    };

    const handleRemoveItem = async(itemId, quantity = null) => {
        try {
            const action = quantity ? `partially removed (${quantity} units)` : 'completely removed';
            console.log(`Item ${itemId} being ${action}`);

            await dataService.removeItem(itemId, quantity);
            toast.success(`Item ${action} successfully!`);
            fetchData(); // Refresh data
            setRemoveItemModalOpen(false);
        } catch (error) {
            console.error('Error removing item:', error);
            toast.error('Failed to remove item');
        }
    };

    const scrollToInventory = () => {
        if (inventoryRef.current) {
            inventoryRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleStockLevelClick = (level) => {
        setStockLevel(level);
        setFilterType('stockLevel');
        scrollToInventory();
    };

    const handleStatPillClick = (type) => {
        if (type === 'all') {
            setFilterType('category');
            setSelectedCategory('all');
        } else if (type === 'lowStock') {
            setFilterType('stockLevel');
            setStockLevel('low');
        } else if (type === 'outOfStock') {
            setFilterType('stockLevel');
            setStockLevel('out');
        }
        scrollToInventory();
    };

    const getFilteredItems = () => {
        // Filter by stock level
        if (filterType === 'stockLevel') {
            if (stockLevel === 'low') {
                return items.filter(item =>
                    item.quantity <= (item.lowStockThreshold || 5) && item.quantity > 0
                );
            } else if (stockLevel === 'out') {
                return items.filter(item => item.quantity === 0);
            } else {
                return items; // all items
            }
        }

        // Default category filtering
        return selectedCategory === 'all' ?
            items :
            items.filter(item => item.category === selectedCategory);
    };

    const filteredItems = getFilteredItems();

    // Extract unique categories
    const categories = ['all', ...new Set(items.map(item => item.category))];

    if (loading) {
        return ( <
            div className = "loading-spinner-container" >
            <
            div className = "loading-spinner" > < /div> <
            p > Loading dashboard... < /p> < /
            div >
        );
    }

    if (error) {
        return <div className = "error-message" > { error } < /div>;
    }

    return ( <
        div className = "dashboard" >
        <
        style > { `
                .stat-pill.clickable {
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .stat-pill.clickable:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                }
                .stat-pill.danger {
                    background-color: #f44336;
                    color: white;
                }
                .stock-level-filter {
                    margin-bottom: 15px;
                    padding: 15px;
                    background: var(--card-bg);
                    border-radius: 10px;
                    box-shadow: var(--card-shadow);
                }
                
                .filter-section-title {
                    font-weight: 600;
                    margin-bottom: 8px;
                    color: var(--text-color);
                }
                
                .stock-level-buttons {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                
                .stock-level-btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 5px;
                    background: var(--bg-secondary);
                    color: var(--text-color);
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .stock-level-btn:hover {
                    background: var(--primary-color);
                    color: white;
                }
                
                .stock-level-btn.active {
                    background: var(--primary-color);
                    color: white;
                    font-weight: bold;
                }
                
                .stock-level-btn.low-stock {
                    border-left: 3px solid #ff9800;
                }
                
                .stock-level-btn.out-of-stock {
                    border-left: 3px solid #f44336;
                }
                
                .btn-icon {
                    font-size: 1rem;
                }
                ` } <
        /style>

        <
        ToastContainer position = "top-right"
        autoClose = { 3000 }
        />

        { /* Header */ } <
        div className = "dashboard-header" >
        <
        div className = "welcome-banner" >
        <
        h2 > Inventory Management Dashboard < /h2> < /
        div > <
        button className = "theme-toggle"
        onClick = { toggleTheme } > { isDarkMode ? < FaSun className = "theme-icon" / > : < FaMoon className = "theme-icon" / > } <
        /button> < /
        div >

        { /* Stats Row */ } <
        div className = "stats-row" >
        <
        div className = "stat-pills" >
        <
        div className = "stat-pill clickable"
        onClick = {
            () => handleStatPillClick('all')
        } >
        <
        FaBox className = "stat-icon" / >
        <
        div >
        <
        div className = "stat-label" > Total Items < /div> <
        div className = "stat-value" > { items.length } < /div> < /
        div > <
        /div>

        <
        div className = "stat-pill warning clickable"
        onClick = {
            () => handleStatPillClick('lowStock')
        } >
        <
        FaExclamationTriangle className = "stat-icon" / >
        <
        div >
        <
        div className = "stat-label" > Low Stock < /div> <
        div className = "stat-value" > { lowStockItems.length } < /div> < /
        div > <
        /div>

        <
        div className = "stat-pill danger clickable"
        onClick = {
            () => handleStatPillClick('outOfStock')
        } >
        <
        FaExclamationTriangle className = "stat-icon" / >
        <
        div >
        <
        div className = "stat-label" > Out of Stock < /div> <
        div className = "stat-value" > { outOfStockItems.length } < /div> < /
        div > <
        /div>

        <
        div className = "stat-pill" >
        <
        FaShoppingBag className = "stat-icon" / >
        <
        div >
        <
        div className = "stat-label" > Total Inventory Value < /div> <
        div className = "stat-value" > ₹{ totalInventory.toFixed(2) } < /div> < /
        div > <
        /div>

        <
        div className = "stat-pill" >
        <
        FaChartLine className = "stat-icon" / >
        <
        div >
        <
        div className = "stat-label" > Recent Sales < /div> <
        div className = "stat-value" > { sales.length } < /div> < /
        div > <
        /div> < /
        div > <
        /div>

        { /* Action Buttons */ } <
        div className = "action-buttons-row" >
        <
        button className = "action-button add-item"
        onClick = {
            () => setAddItemModalOpen(true)
        } >
        <
        FaPlus / > Add Item <
        /button>

        <
        button className = "action-button sell-item"
        onClick = {
            () => setSellItemModalOpen(true)
        } >
        <
        FaShoppingBag / > Sell Item <
        /button>

        <
        button className = "action-button remove-item"
        onClick = {
            () => setRemoveItemModalOpen(true)
        } >
        <
        FaMinus / > Remove Item <
        /button>

        <
        button className = "action-button logout"
        onClick = { handleLogout } >
        <
        FaSignOutAlt / > Logout <
        /button> < /
        div >

        { /* Main Content */ } <
        div className = "dashboard-layout" > { /* Inventory Section */ } <
        div className = "inventory-section"
        ref = { inventoryRef } >
        <
        div className = "inventory-header" >
        <
        h2 > Inventory Items < /h2> < /
        div >

        { /* Stock Level Filter */ } <
        div className = "stock-level-filter" >
        <
        div className = "filter-section-title" > Filter by Stock Level: < /div> <
        div className = "stock-level-buttons" >
        <
        button className = { `stock-level-btn ${filterType === 'stockLevel' && stockLevel === 'all' ? 'active' : ''}` }
        onClick = {
            () => handleStockLevelClick('all')
        } >
        <
        FaBox className = "btn-icon" / > All Items <
        /button> <
        button className = { `stock-level-btn low-stock ${filterType === 'stockLevel' && stockLevel === 'low' ? 'active' : ''}` }
        onClick = {
            () => handleStockLevelClick('low')
        } >
        <
        FaExclamationTriangle className = "btn-icon" / > Low Stock({ lowStockItems.length }) <
        /button> <
        button className = { `stock-level-btn out-of-stock ${filterType === 'stockLevel' && stockLevel === 'out' ? 'active' : ''}` }
        onClick = {
            () => handleStockLevelClick('out')
        } >
        <
        FaExclamationTriangle className = "btn-icon" / > Out of Stock({ outOfStockItems.length }) <
        /button> < /
        div > <
        /div>

        { /* Category Filter */ } <
        div className = "category-filter" >
        <
        div className = "filter-section-title" > Filter by Category: < /div> <
        div className = "category-buttons" > {
            categories.map(category => ( <
                button key = { category }
                className = { `category-btn ${filterType === 'category' && selectedCategory === category ? 'active' : ''}` }
                onClick = {
                    () => {
                        setFilterType('category');
                        setSelectedCategory(category);
                    }
                } > { category.charAt(0).toUpperCase() + category.slice(1) } <
                /button>
            ))
        } <
        /div> < /
        div >

        { /* Inventory Grid */ } <
        div className = "inventory-container" > {
            filteredItems.length === 0 ? ( <
                div className = "empty-state" >
                <
                div className = "empty-icon" > 📦 < /div> <
                h3 > No items found < /h3> <
                p > Try changing your category filter or add new items. < /p> < /
                div >
            ) : ( <
                div className = "inventory-grid" > {
                    filteredItems.map(item => ( <
                        div key = { item._id }
                        className = { `inventory-item ${item.quantity <= (item.lowStockThreshold || 5) ? 'low-stock' : ''}` } >
                        <
                        div className = "item-image-container" >
                        <
                        img src = { item.imageUrl || 'https://via.placeholder.com/150?text=No+Image' }
                        alt = { item.name }
                        className = "item-image" /
                        >
                        <
                        div className = { `stock-badge ${item.quantity > 0 ? 'in-stock' : 'out-stock'}` } > { item.quantity > 0 ? `In Stock: ${item.quantity}` : 'Out of Stock' } <
                        /div> < /
                        div >

                        <
                        div className = "item-details" >
                        <
                        h3 className = "item-name" > { item.name } < /h3> <
                        div className = "item-category" > { item.category } < /div>

                        <
                        div className = "item-info-grid" >
                        <
                        div className = "info-row" >
                        <
                        div className = "info-label" > Price: < /div> <
                        div className = "info-value" > ₹{ item.price.toFixed(2) } < /div> < /
                        div > <
                        div className = "info-row" >
                        <
                        div className = "info-label" > Value: < /div> <
                        div className = "info-value" > ₹{
                            (item.price * item.quantity).toFixed(2)
                        } <
                        /div> < /
                        div > {
                            item.location && ( <
                                div className = "info-row" >
                                <
                                div className = "info-label" > Location: < /div> <
                                div className = "info-value" > { item.location } < /div> < /
                                div >
                            )
                        } <
                        /div>

                        <
                        div className = "item-actions" >
                        <
                        button className = "action-btn add"
                        onClick = {
                            (e) => {
                                e.stopPropagation();
                                setSellItemModalOpen(true);
                            }
                        }
                        title = "Sell Item" >
                        <
                        FaShoppingBag / >
                        <
                        /button> <
                        button className = "action-btn"
                        onClick = {
                            (e) => {
                                e.stopPropagation();
                                setAddItemModalOpen(true);
                            }
                        }
                        title = "Edit Item" >
                        <
                        FaExchangeAlt / >
                        <
                        /button> <
                        button className = "action-btn remove"
                        onClick = {
                            (e) => {
                                e.stopPropagation();
                                setRemoveItemModalOpen(true);
                            }
                        }
                        title = "Remove Item" >
                        <
                        FaMinus / >
                        <
                        /button> < /
                        div > <
                        /div> < /
                        div >
                    ))
                } <
                /div>
            )
        } <
        /div> < /
        div >

        { /* Sales Section */ } <
        div className = "sales-section" >
        <
        div className = "sales-header" >
        <
        h2 > Sales Overview < /h2> <
        div className = "view-toggle" >
        <
        button className = "view-toggle-btn active" > Chart < /button> <
        button className = "view-toggle-btn" > List < /button> < /
        div > <
        /div>

        <
        div className = "sales-chart" >
        <
        div className = "chart-header" >
        <
        h3 className = "chart-title" > Recent Sales Performance < /h3> < /
        div >

        <
        div className = "chart-container" > {
            sales.length === 0 ? ( <
                div className = "empty-state" >
                <
                p > No sales data to display < /p> < /
                div >
            ) : ( <
                div > { /* Chart would go here */ } <
                div style = {
                    { textAlign: 'center', padding: '2rem 0' }
                } >
                <
                p > Sales chart visualization would appear here < /p> < /
                div > <
                /div>
            )
        } <
        /div>

        <
        div className = "time-period" >
        <
        button className = "period-btn active" > Week < /button> <
        button className = "period-btn" > Month < /button> <
        button className = "period-btn" > Year < /button> < /
        div > <
        /div>

        <
        div className = "top-selling" >
        <
        div className = "top-selling-header" >
        <
        h3 > Top Selling Items < /h3> < /
        div >

        <
        div className = "top-selling-list" > {
            sales.length === 0 ? ( <
                div className = "empty-state"
                style = {
                    { padding: '1rem' }
                } >
                <
                p > No sales data available < /p> < /
                div >
            ) : (
                sales.slice(0, 5).map((sale, index) => {
                    const item = items.find(i => i._id === sale.itemId);
                    return ( <
                        div key = { index }
                        className = "top-selling-item" >
                        <
                        div className = "item-info" >
                        <
                        div className = "item-name-top" > { item ? item.name : 'Unknown Item' } < /div> <
                        div className = "item-category-top" > { item ? item.category : 'N/A' } < /div> < /
                        div > <
                        div className = "item-sales" > ₹{ sale.totalPrice.toFixed(2) } < /div> < /
                        div >
                    );
                })
            )
        } <
        /div> < /
        div > <
        /div> < /
        div >

        { /* Modals */ } {
            addItemModalOpen && ( <
                AddItemModal onClose = {
                    () => setAddItemModalOpen(false)
                }
                onAddItem = { handleAddItem }
                items = { items }
                />
            )
        }

        {
            sellItemModalOpen && ( <
                SellItemModal onClose = {
                    () => setSellItemModalOpen(false)
                }
                onSellItem = { handleSellItem }
                items = { items }
                />
            )
        }

        {
            removeItemModalOpen && ( <
                RemoveItemModal onClose = {
                    () => setRemoveItemModalOpen(false)
                }
                onRemoveItem = { handleRemoveItem }
                items = { items }
                />
            )
        } <
        /div>
    );
};

export default Dashboard;