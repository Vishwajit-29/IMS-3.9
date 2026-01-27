import React, { useState, useEffect } from 'react';
import { FaSearch, FaTimes, FaSave, FaArrowLeft, FaInfoCircle, FaBox, FaBoxOpen, FaTablet, FaHome, FaBoxes, FaBriefcase } from 'react-icons/fa';
import dataService from '../services/DataService';
import './Modals.css';

const UpdatePricesModal = ({ onClose, items: allItems }) => {
    // States for multi-step form
    const [step, setStep] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredItems, setFilteredItems] = useState([]);
    const [newPrice, setNewPrice] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [updatedItems, setUpdatedItems] = useState([]);

    // Extract unique categories
    const categories = ['all', ...new Set((allItems || []).map(item => item.category))];

    useEffect(() => {
        if (allItems) {
            filterItems();
        }
    }, [allItems, selectedCategory, searchTerm]);

    const filterItems = () => {
        if (!allItems) return;

        let filtered = [...allItems];

        // Filter by category
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(item => item.category === selectedCategory);
        }

        // Filter by search term
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(term) ||
                (item.description && item.description.toLowerCase().includes(term))
            );
        }

        setFilteredItems(filtered);
    };

    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        setSelectedItem(null);
        setStep(2); // Move to item selection
    };

    const handleItemSelect = (item) => {
        setSelectedItem(item);
        setNewPrice(item.price.toString());
        setStep(3); // Move to price update
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handlePriceChange = (e) => {
        setNewPrice(e.target.value);
    };

    const handleUpdatePrice = async() => {
        if (!selectedItem || !newPrice) {
            setError('Please select an item and enter a new price');
            return;
        }

        const priceValue = parseFloat(newPrice);
        if (isNaN(priceValue) || priceValue <= 0) {
            setError('Please enter a valid price greater than 0');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const itemId = selectedItem._id || selectedItem.id;
            console.log('Updating item with ID:', itemId);
            console.log('Current price:', selectedItem.price);
            console.log('New price:', priceValue);

            // Clone the selected item to avoid reference issues
            const itemToUpdate = {
                ...selectedItem,
                price: priceValue
            };

            // Make sure we're using the same property names as expected by the backend
            if (!itemToUpdate._id && itemToUpdate.id) {
                itemToUpdate._id = itemToUpdate.id;
            }

            console.log('Sending update with data:', itemToUpdate);

            // First try using the direct API call to update price
            try {
                const response = await fetch(`http://localhost:8080/api/items/${itemId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(itemToUpdate)
                });

                if (!response.ok) {
                    throw new Error(`Server responded with status: ${response.status}`);
                }

                const result = await response.json();
                console.log('Update successful via direct API call:', result);
            } catch (directApiError) {
                console.error('Direct API call failed, trying via dataService:', directApiError);
                // If direct API call fails, fall back to dataService
                const result = await dataService.updateItem(itemId, itemToUpdate);
                console.log('Update result via dataService:', result);
            }

            // Add to updated items
            setUpdatedItems(prev => [...prev, {
                id: itemId,
                name: selectedItem.name,
                oldPrice: selectedItem.price,
                newPrice: priceValue
            }]);

            setSuccess(`Price updated for ${selectedItem.name}`);

            // Update the price in the local state for all items
            const updatedAllItems = allItems.map(item => {
                if ((item._id || item.id) === itemId) {
                    return {...item, price: priceValue };
                }
                return item;
            });

            // Update filtered items based on the current category
            setFilteredItems(updatedAllItems.filter(item =>
                selectedCategory === 'all' || item.category === selectedCategory
            ));

            // Go back to item selection
            setSelectedItem(null);
            setStep(2);

        } catch (err) {
            console.error('Error updating price:', err);
            setError('Failed to update price: ' + (err.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (updatedItems.length > 0) {
            onClose(updatedItems.length);
        } else {
            onClose(0);
        }
    };

    const getImageUrl = (item) => {
        if (!item) return '/images/items/placeholder.png';

        if (item.imageUrl) return item.imageUrl;
        if (item.image) {
            if (typeof item.image === 'string') {
                if (item.image.startsWith('data:') ||
                    item.image.startsWith('http') ||
                    item.image.startsWith('/')) {
                    return item.image;
                }
                return `/images/items/${item.image}`;
            }
        }

        return '/images/items/placeholder.png';
    };

    const renderCategorySelection = () => {
        return ( <
            div className = "modal-body" >
            <
            h3 className = "category-selection-heading" > Select a Category < /h3> <
            div className = "categories-grid" > {
                categories.map((category) => {
                    let CategoryIcon;
                    switch (category.toLowerCase()) {
                        case 'all':
                            CategoryIcon = FaBoxOpen;
                            break;
                        case 'electronics':
                            CategoryIcon = FaTablet;
                            break;
                        case 'furniture':
                            CategoryIcon = FaHome;
                            break;
                        case 'stationery':
                            CategoryIcon = FaBoxes;
                            break;
                        case 'office supplies':
                            CategoryIcon = FaBriefcase;
                            break;
                        default:
                            CategoryIcon = FaBox;
                    }

                    return ( <
                        div key = { category }
                        className = { `category-item ${selectedCategory === category ? 'selected' : ''}` }
                        onClick = {
                            () => handleCategorySelect(category)
                        } >
                        <
                        div className = "category-icon" >
                        <
                        CategoryIcon size = { 24 }
                        /> < /
                        div > <
                        div className = "category-name" > { category === 'all' ? 'All Categories' : category } <
                        /div> < /
                        div >
                    );
                })
            } <
            /div> < /
            div >
        );
    };

    const renderItemSelection = () => {
        return ( <
                div className = "modal-body" >
                <
                div style = {
                    { display: 'flex', alignItems: 'center', marginBottom: '15px' }
                } >
                <
                h3 style = {
                    { margin: 0 }
                } > Select an Item to Update Price < /h3> < /
                div >

                <
                div className = "search-container"
                style = {
                    { marginBottom: '15px' }
                } >
                <
                div className = "search-input-container" >
                <
                FaSearch className = "search-icon" / >
                <
                input type = "text"
                className = "search-box"
                placeholder = "Search items..."
                value = { searchTerm }
                onChange = { handleSearchChange }
                /> {
                searchTerm && ( <
                    button className = "clear-search"
                    onClick = {
                        () => setSearchTerm('')
                    } >
                    <
                    FaTimes / >
                    <
                    /button>
                )
            } <
            /div> < /
        div >

            <
            div className = "items-grid" > {
                filteredItems.length === 0 ? ( <
                    div className = "empty-state" >
                    <
                    div className = "empty-icon" > 📦 < /div> <
                    h3 > No items found < /h3> <
                    p > Try changing your search term or category. < /p> < /
                    div >
                ) : (
                    filteredItems.map(item => ( <
                        div key = { item._id || item.id }
                        className = { `item-card ${selectedItem && selectedItem._id === item._id ? 'selected' : ''}` }
                        onClick = {
                            () => handleItemSelect(item)
                        } >
                        <
                        div className = "item-image" >
                        <
                        img src = { getImageUrl(item) }
                        alt = { item.name }
                        onError = {
                            (e) => {
                                e.target.onerror = null;
                                e.target.src = '/images/items/placeholder.png';
                            }
                        }
                        /> < /
                        div > <
                        div className = "item-name" > { item.name } < /div> <
                        div className = "item-price" > ₹{ item.price.toFixed(2) } < /div> <
                        div className = "item-stock" > Stock: { item.quantity } < /div> < /
                        div >
                    ))
                )
            } <
            /div>

        <
        div className = "modal-footer"
        style = {
                { position: 'sticky', bottom: 0, justifyContent: 'flex-end', marginTop: '15px' }
            } >
            <
            button className = "btn btn-secondary"
        onClick = {
                () => setStep(1)
            } >
            <
            FaArrowLeft / > Back <
            /button> < /
        div > <
            /div>
    );
};

const renderPriceUpdate = () => {
    if (!selectedItem) return null;

    return ( <
        div className = "modal-body" >
        <
        div style = {
            { display: 'flex', alignItems: 'center', marginBottom: '15px' }
        } >
        <
        h3 style = {
            { margin: 0 }
        } > Update Price < /h3> < /
        div >

        <
        div className = "item-detail" >
        <
        div className = "item-detail-image" >
        <
        img src = { getImageUrl(selectedItem) }
        alt = { selectedItem.name }
        onError = {
            (e) => {
                e.target.onerror = null;
                e.target.src = '/images/items/placeholder.png';
            }
        }
        /> < /
        div > <
        div className = "item-detail-info" >
        <
        h3 className = "item-detail-name" > { selectedItem.name } < /h3>

        <
        div className = "item-detail-row" >
        <
        div className = "item-detail-label" > Category: < /div> <
        div className = "item-detail-value" > { selectedItem.category } < /div> < /
        div >

        <
        div className = "item-detail-row" >
        <
        div className = "item-detail-label" > Current Price: < /div> <
        div className = "item-detail-value" > ₹{ selectedItem.price.toFixed(2) } < /div> < /
        div >

        <
        div className = "item-detail-row" >
        <
        div className = "item-detail-label" > In Stock: < /div> <
        div className = "item-detail-value" > { selectedItem.quantity } < /div> < /
        div > <
        /div> < /
        div >

        <
        div className = "form-group"
        style = {
            { marginTop: '20px' }
        } >
        <
        label className = "form-label" > New Price(₹) < /label> <
        input type = "number"
        className = "form-input"
        value = { newPrice }
        onChange = { handlePriceChange }
        step = "0.01"
        min = "0" /
        >
        <
        /div>

        {
            error && ( <
                div className = "error-message" >
                <
                FaInfoCircle className = "error-icon" / > { error } <
                /div>
            )
        }

        {
            success && ( <
                div className = "modal-message success" > { success } <
                /div>
            )
        }

        <
        div className = "modal-footer"
        style = {
            { position: 'sticky', bottom: 0, justifyContent: 'space-between', marginTop: '15px' }
        } >
        <
        button className = "btn btn-secondary"
        onClick = {
            () => setStep(2)
        } >
        <
        FaArrowLeft / > Back <
        /button> <
        button className = "btn btn-primary"
        onClick = { handleUpdatePrice }
        disabled = { loading } > {
            loading ? 'Updating...' : < > < FaSave / > Update Price < />} < /
            button > <
            /div> < /
            div >
        );
    };

    return ( <
        div className = "modal-backdrop" >
        <
        div className = "modal-content" >
        <
        div className = "modal-header" >
        <
        h2 className = "modal-title" > { step === 1 && 'Update Prices' } { step === 2 && `Update Prices - ${selectedCategory === 'all' ? 'All Categories' : selectedCategory}` } { step === 3 && 'Update Price - ' + (selectedItem ? selectedItem.name : '') } <
        /h2> <
        button className = "modal-close"
        onClick = { handleClose } >
        <
        FaTimes / >
        <
        /button> < /
        div >

        { step === 1 && renderCategorySelection() } { step === 2 && renderItemSelection() } { step === 3 && renderPriceUpdate() }

        <
        div className = "modal-footer" > {
            step === 1 && ( <
                button className = "btn btn-secondary"
                onClick = { handleClose } >
                Cancel <
                /button>
            )
        }

        {
            updatedItems.length > 0 && ( <
                div className = "modal-message success"
                style = {
                    { marginRight: 'auto' }
                } > { updatedItems.length } { updatedItems.length === 1 ? 'item' : 'items' }
                updated <
                /div>
            )
        } <
        /div>

        {
            loading && ( <
                div className = "loading-overlay" >
                <
                div className = "loading-spinner" > < /div> <
                div className = "loading-text" > Updating price... < /div> < /
                div >
            )
        } <
        /div> < /
        div >
    );
};

export default UpdatePricesModal;