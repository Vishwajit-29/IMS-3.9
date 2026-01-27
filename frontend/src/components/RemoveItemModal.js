import React, { useState, useEffect } from 'react';
import { FaTimes, FaMinus, FaPlus, FaTrash, FaExclamationCircle, FaCheck, FaTablet, FaHome, FaTshirt, FaUtensils, FaTools, FaCube, FaCubes, FaBox, FaBoxOpen, FaSearch } from 'react-icons/fa';
import './Modals.css';

const RemoveItemModal = ({ show, onClose, onRemoveItem, item, items = [], categories = [] }) => {
    // State variables
    const [selectedItem, setSelectedItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [quantityToRemove, setQuantityToRemove] = useState(1);
    const [removeAll, setRemoveAll] = useState(false);
    const [confirmStep, setConfirmStep] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredItems, setFilteredItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [step, setStep] = useState(1); // 1: Category Selection, 2: Item Selection, 3: Quantity & Confirmation

    // Initialize when modal opens or item changes
    useEffect(() => {
        if (show) {
            resetForm();

            // Filter items
            if (items && items.length > 0) {
                setFilteredItems(items.filter(i => i.quantity > 0));
            }

            // If an item is passed, pre-select it and skip to confirmation step
            if (item) {
                setSelectedItem(item);
                setSelectedCategory(item.category || 'All');
                setStep(3);
                setQuantityToRemove(1);
                setRemoveAll(false);
            } else {
                setSelectedItem(null);
                setSelectedCategory('All');
                setStep(1);
            }
        }
    }, [show, item, items]);

    // Filter items when search term or category changes
    useEffect(() => {
        if (items && items.length > 0) {
            let filtered = items.filter(i => i.quantity > 0);

            // Filter by category
            if (selectedCategory !== 'All') {
                filtered = filtered.filter(item => item.category === selectedCategory);
            }

            // Filter by search term
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                filtered = filtered.filter(
                    item =>
                    (item.name && item.name.toLowerCase().includes(term)) ||
                    (item.description && item.description.toLowerCase().includes(term))
                );
            }

            setFilteredItems(filtered);
        }
    }, [searchTerm, items, selectedCategory]);

    // Reset form state
    const resetForm = () => {
        setSelectedItem(null);
        setQuantityToRemove(1);
        setRemoveAll(false);
        setConfirmStep(false);
        setError('');
        setSuccess(false);
        setSearchTerm('');
        setSelectedCategory('All');
        setStep(1);
    };

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Handle category selection
    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        setStep(2); // Move to item selection after category is selected
    };

    // Handle item selection
    const handleItemSelect = (item) => {
        setSelectedItem(item);
        setQuantityToRemove(1);
        setRemoveAll(false);
        setStep(3); // Move to quantity confirmation
    };

    // Toggle between partial and complete removal
    const toggleRemoveAll = () => {
        setRemoveAll(!removeAll);
        if (!removeAll) {
            // If switching to remove all, set quantity to max
            setQuantityToRemove(selectedItem ? selectedItem.quantity : 0);
        } else {
            // If switching to partial, reset to 1
            setQuantityToRemove(1);
        }
    };

    // Increment or decrement quantity
    const handleQuantityChange = (amount) => {
        if (selectedItem) {
            const newValue = Math.max(1, Math.min(selectedItem.quantity, quantityToRemove + amount));
            setQuantityToRemove(newValue);

            // Update removeAll flag if we reach the maximum
            setRemoveAll(newValue >= selectedItem.quantity);
        }
    };

    // Handle direct input of quantity
    const handleQuantityInput = (e) => {
        const value = parseInt(e.target.value) || 0;
        if (selectedItem) {
            const newValue = Math.max(0, Math.min(selectedItem.quantity, value));
            setQuantityToRemove(newValue);
            setRemoveAll(newValue >= selectedItem.quantity);
        }
    };

    // Submit the removal
    const handleSubmit = async() => {
        if (!selectedItem) {
            setError('Please select an item to remove');
            return;
        }

        if (quantityToRemove <= 0) {
            setError('Please specify a valid quantity to remove');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // If removing all, pass null as quantity to use the backend's full removal logic
            const quantity = removeAll ? null : quantityToRemove;

            await onRemoveItem(selectedItem._id || selectedItem.id, quantity);

            setSuccess(removeAll ?
                `${selectedItem.name} has been completely removed from inventory` :
                `${quantityToRemove} units of ${selectedItem.name} have been removed from inventory`
            );

            // Reset after success
            setTimeout(() => {
                resetForm();
                onClose();
            }, 2000);
        } catch (err) {
            console.error("Error removing item:", err);
            setError(err.message || 'Failed to remove item. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Get image URL helper
    const getImageUrl = (item) => {
        if (!item) {
            console.log("No item provided for image");
            return '/images/items/placeholder.png';
        }

        // For debugging
        console.log("Getting image for item:", item.name, "Image data:", item.image ? (typeof item.image === 'string' ? item.image.substring(0, 30) + '...' : 'non-string image') : 'no image');

        try {
            // If it's a base64 image
            if (item.image && typeof item.image === 'string') {
                if (item.image.startsWith('data:image')) {
                    return item.image;
                }

                // If it starts with slash, assume it's a local path
                if (item.image.startsWith('/')) {
                    return item.image;
                }

                // If image is a URL
                if (item.image.startsWith('http') || item.image.startsWith('https')) {
                    return item.image;
                }

                // Try to handle relative paths
                if (!item.image.includes('://') && !item.image.startsWith('data:')) {
                    // Try to construct a relative path
                    return `/images/items/${item.image.replace(/^\/+/, '')}`;
                }

                // If we can't determine format but have string data, assume it's valid
                return item.image;
            }

            // If the image is stored as an object with url or src property
            if (item.image && typeof item.image === 'object') {
                if (item.image.url) return item.image.url;
                if (item.image.src) return item.image.src;
                if (item.image.data) return item.image.data;
            }

            // Try item.imageUrl if it exists
            if (item.imageUrl && typeof item.imageUrl === 'string') {
                return item.imageUrl;
            }

            // If category exists, try a category-based placeholder
            if (item.category && typeof item.category === 'string') {
                return `/images/categories/${item.category.toLowerCase().replace(/\s+/g, '-')}.png`;
            }

            // If no valid image found
            return '/images/items/placeholder.png';
        } catch (err) {
            console.error("Error processing image URL:", err);
            return '/images/items/placeholder.png';
        }
    };

    // Handle complete item removal directly
    const handleCompleteRemoval = async(itemId) => {
        setLoading(true);
        setError('');

        try {
            await onRemoveItem(itemId, null);
            setSuccess(`Item has been completely removed from inventory`);

            setTimeout(() => {
                resetForm();
                onClose();
            }, 2000);
        } catch (err) {
            console.error("Error removing item:", err);
            setError(err.message || 'Failed to remove item. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Render step indicator
    const renderStepIndicator = () => {
        const totalSteps = 3;

        return ( <
            div className = "steps-container" > {
                [...Array(totalSteps)].map((_, i) => ( <
                    React.Fragment key = { i } >
                    <
                    div className = "step-item" >
                    <
                    div className = { `step-number ${step > i + 1 ? 'completed' : (step === i + 1 ? 'active' : '')}` } > { i + 1 } <
                    /div> < /
                    div > {
                        i < totalSteps - 1 && ( <
                            div className = { `step-line ${step > i + 1 ? 'active' : ''}` } > < /div>
                        )
                    } <
                    /React.Fragment>
                ))
            } <
            /div>
        );
    };

    // Return appropriate icon for category
    const getCategoryIcon = (category) => {
        if (!category) return <FaBoxOpen size = { 24 }
        />;

        switch (category.toLowerCase()) {
            case 'electronics':
                return <FaTablet size = { 24 }
                />;
            case 'furniture':
                return <FaHome size = { 24 }
                />;
            case 'clothing':
                return <FaTshirt size = { 24 }
                />;
            case 'food':
                return <FaUtensils size = { 24 }
                />;
            case 'tools':
                return <FaTools size = { 24 }
                />;
            case 'stationery':
                return <FaCube size = { 24 }
                />;
            case 'appliances':
                return <FaCubes size = { 24 }
                />;
            case 'office supplies':
                return <FaBox size = { 24 }
                />;
            default:
                return <FaBoxOpen size = { 24 }
                />;
        }
    };

    // Render category selection step
    const renderCategorySelection = () => ( <
        div >
        <
        h3 className = "category-selection-heading" > Select Category < /h3> <
        div className = "categories-grid" >
        <
        div className = { `category-item ${selectedCategory === 'All' ? 'selected' : ''}` }
        onClick = {
            () => handleCategorySelect('All')
        } >
        <
        div className = "category-icon" >
        <
        FaBoxOpen size = { 24 }
        /> < /
        div > <
        div className = "category-name" > All Items < /div> < /
        div >

        {
            categories.map(category => ( <
                div key = { category.id || category._id || category.name }
                className = { `category-item ${selectedCategory === category.name ? 'selected' : ''}` }
                onClick = {
                    () => handleCategorySelect(category.name)
                } >
                <
                div className = "category-icon" > { getCategoryIcon(category.name) } < /div> <
                div className = "category-name" > { category.name } < /div> < /
                div >
            ))
        } <
        /div> < /
        div >
    );

    // Render item selection step
    const renderItemSelection = () => ( <
        div >
        <
        div className = "search-container" >
        <
        input type = "text"
        className = "search-box"
        placeholder = "Search items..."
        value = { searchTerm }
        onChange = { handleSearchChange }
        /> <
        FaSearch className = "search-icon" / >
        <
        /div>

        {
            filteredItems && filteredItems.length > 0 ? ( <
                div className = { `items-grid ${selectedItem ? 'has-selection' : ''}` } > {
                    filteredItems.map(item => ( <
                        div key = { item._id || item.id }
                        className = { `item-card ${selectedItem && (selectedItem._id === item._id || selectedItem.id === item.id) ? 'selected' : ''}` }
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
                                console.log("Failed to load image for:", item.name);
                                e.target.onerror = null;
                                e.target.src = '/images/items/placeholder.png';
                            }
                        }
                        /> < /
                        div > <
                        div className = "item-name"
                        title = { item.name } > { item.name } < /div> <
                        div className = "item-price" > ₹{ item.price ? parseFloat(item.price).toFixed(2) : '0.00' } < /div> <
                        div className = "item-stock" > Stock: { item.quantity || 0 } < /div>

                        <
                        div className = "quick-actions" >
                        <
                        button className = "quick-action-btn remove"
                        onClick = {
                            (e) => {
                                e.stopPropagation(); // Prevent item selection
                                if (window.confirm(`Are you sure you want to completely remove "${item.name}" from inventory?`)) {
                                    handleCompleteRemoval(item._id || item.id);
                                }
                            }
                        }
                        title = "Remove completely" > ×
                        <
                        /button> < /
                        div > <
                        /div>
                    ))
                } <
                /div>
            ) : ( <
                div className = "empty-message" >
                No items found in this category or all items are out of stock. <
                /div>
            )
        }

        <
        div className = "filter-hint" >
        <
        span > { filteredItems.length }
        items found { selectedCategory !== 'All' ? `in ${selectedCategory}` : '' } < /span> < /
        div >

        <
        div className = "modal-footer" >
        <
        button type = "button"
        className = "btn btn-secondary"
        onClick = {
            () => setStep(1)
        } >
        Back <
        /button> < /
        div > <
        /div>
    );

    // Render quantity and confirmation step
    const renderQuantityConfirmation = () => {
        if (!selectedItem) return null;

        return ( <
            div >
            <
            h3 className = "option-selection-heading" > Remove Item < /h3> <
            div className = "item-detail" >
            <
            div className = "item-detail-image" >
            <
            img src = { getImageUrl(selectedItem) }
            alt = { selectedItem.name }
            /> < /
            div > <
            div className = "item-detail-info" >
            <
            h4 className = "item-detail-name" > { selectedItem.name } < /h4> <
            div className = "item-detail-row" >
            <
            span className = "item-detail-label" > Category: < /span> <
            span className = "item-detail-value" > { selectedItem.category } < /span> < /
            div > <
            div className = "item-detail-row" >
            <
            span className = "item-detail-label" > Current Stock: < /span> <
            span className = "item-detail-value" > { selectedItem.quantity || 0 } < /span> < /
            div > <
            div className = "item-detail-row" >
            <
            span className = "item-detail-label" > Price: < /span> <
            span className = "item-detail-value" > ₹{ parseFloat(selectedItem.price || 0).toFixed(2) } < /span> < /
            div > <
            /div> < /
            div >

            <
            div className = "removal-options" >
            <
            label className = "remove-all-option" >
            <
            input type = "checkbox"
            checked = { removeAll }
            onChange = { toggleRemoveAll }
            /> <
            span > Remove all from inventory < /span> < /
            label > <
            /div>

            {
                !removeAll && ( <
                    div className = "quantity-controls" >
                    <
                    button className = "quantity-btn decrease"
                    onClick = {
                        () => handleQuantityChange(-1)
                    }
                    disabled = { quantityToRemove <= 1 } >
                    -
                    <
                    /button> <
                    input type = "number"
                    className = "quantity-input"
                    value = { quantityToRemove }
                    onChange = { handleQuantityInput }
                    min = "1"
                    max = { selectedItem.quantity }
                    /> <
                    button className = "quantity-btn increase"
                    onClick = {
                        () => handleQuantityChange(1)
                    }
                    disabled = { quantityToRemove >= selectedItem.quantity } >
                    +
                    <
                    /button> < /
                    div >
                )
            }

            <
            div className = "warning-message" >
            <
            FaExclamationCircle / >
            <
            span > {
                removeAll ?
                `This will permanently remove ${selectedItem.name} from inventory.` : `This will remove ${quantityToRemove} of ${selectedItem.name} from inventory.`
            } <
            /span> < /
            div >

            <
            div className = "modal-footer" >
            <
            button type = "button"
            className = "btn btn-secondary"
            onClick = {
                () => setStep(2)
            } >
            Back <
            /button> <
            button type = "button"
            className = "btn btn-danger"
            onClick = { handleSubmit }
            disabled = { loading } > { loading ? 'Removing...' : 'Remove Item' } <
            /button> < /
            div > <
            /div>
        );
    };

    // Get modal title based on current step
    const getModalTitle = () => {
        if (success) return 'Item Removed';
        if (step === 1) return 'Select Category';
        if (step === 2) return 'Select Item to Remove';
        return 'Confirm Item Removal';
    };

    if (!show) return null;

    return ( <
        div className = "modal-backdrop" >
        <
        div className = "modal-content" >
        <
        div className = "modal-header" >
        <
        h2 className = "modal-title" > { getModalTitle() } < /h2> <
        button className = "modal-close"
        onClick = { onClose } >
        <
        FaTimes / >
        <
        /button> < /
        div >

        <
        div className = "modal-body" > {
            error && ( <
                div className = "error-message" >
                <
                FaExclamationCircle className = "error-icon" / > { error } <
                /div>
            )
        }

        {
            success && ( <
                div className = "success-message" >
                <
                FaCheck className = "success-icon" / > { success } <
                /div>
            )
        }

        { renderStepIndicator() }

        { step === 1 && renderCategorySelection() } { step === 2 && renderItemSelection() } { step === 3 && renderQuantityConfirmation() } <
        /div> < /
        div > <
        /div>
    );
};

export default RemoveItemModal;