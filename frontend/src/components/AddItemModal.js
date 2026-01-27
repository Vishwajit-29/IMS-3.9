import React, { useState, useEffect } from 'react';
import { FaPlus, FaMinus, FaSearch, FaTimes, FaCheck, FaExclamationCircle, FaBoxOpen, FaBox, FaCube, FaCubes, FaShoppingCart, FaTablet, FaUtensils, FaTshirt, FaTools, FaHome } from 'react-icons/fa';
import dataService from '../services/DataService';
import './Modals.css';

const AddItemModal = ({ show, onClose, onAddItem, item, categories, items }) => {
    // States for multi-step form
    const [step, setStep] = useState(1);
    const [addType, setAddType] = useState('new'); // 'new' or 'existing'

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        price: '',
        quantity: '',
        image: ''
    });

    // UI states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);

    // For existing items
    const [existingItems, setExistingItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedExistingItem, setSelectedExistingItem] = useState(null);
    const [quantityToAdd, setQuantityToAdd] = useState(1);

    // Reset form when modal is opened/closed
    useEffect(() => {
        if (show) {
            resetForm();

            // If editing an item
            if (item) {
                setFormData({
                    name: item.name || '',
                    description: item.description || '',
                    category: item.category || '',
                    price: item.price ? item.price.toString() : '',
                    quantity: item.quantity ? item.quantity.toString() : '',
                    image: item.image || ''
                });
                setSelectedCategory(item.category);
                setStep(3); // Skip to details form for editing
                setAddType('new');
                if (item.image) {
                    setPreviewImage(getImageUrl(item));
                }
            } else {
                // New item
                setStep(1);
            }

            // Prepare existing items if available
            if (items && items.length > 0) {
                setExistingItems(items);
                setFilteredItems(items);
            }
        }
    }, [show, item, items]);

    // Get filtered items based on category selection
    useEffect(() => {
        if (existingItems && existingItems.length > 0) {
            let filtered = [...existingItems];

            // Filter by category if one is selected
            if (selectedCategory && selectedCategory !== 'All') {
                filtered = filtered.filter(item => item.category === selectedCategory);
            }

            // Filter by search term
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                filtered = filtered.filter(item =>
                    item.name.toLowerCase().includes(term) ||
                    (item.description && item.description.toLowerCase().includes(term))
                );
            }

            setFilteredItems(filtered);
        }
    }, [existingItems, selectedCategory, searchTerm]);

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle image selection
    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();

            reader.onloadend = () => {
                setPreviewImage(reader.result);
                setFormData(prev => ({
                    ...prev,
                    image: reader.result
                }));
            };

            reader.readAsDataURL(file);
        }
    };

    // Reset form to initial state
    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            category: '',
            price: '',
            quantity: '',
            image: ''
        });
        setSelectedCategory(null);
        setStep(1);
        setAddType('new');
        setError(null);
        setSuccess(null);
        setPreviewImage(null);
        setSelectedExistingItem(null);
        setQuantityToAdd(1);
        setSearchTerm('');
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

    // Handle form submission
    const handleSubmit = async(e) => {
        if (e) e.preventDefault();

        setLoading(true);
        setError(null);

        try {
            console.log("Form submission with data:", formData);

            if (addType === 'new') {
                // Validate form
                if (!formData.name || !formData.category || !formData.price || !formData.quantity) {
                    throw new Error('Please fill in all required fields');
                }

                // Convert price and quantity to numbers
                const itemData = {
                    ...formData,
                    price: parseFloat(formData.price),
                    quantity: parseInt(formData.quantity)
                };

                // Ensure _id is included if it exists
                if (item && (item._id || item.id)) {
                    itemData._id = item._id || item.id;
                }

                console.log("Calling onAddItem with:", itemData);

                // Call parent component's add/update handler
                if (typeof onAddItem === 'function') {
                    await onAddItem(itemData);
                    setSuccess('Item has been successfully added to inventory');

                    // Reset form after 2 seconds
                    setTimeout(() => {
                        resetForm();
                        onClose();
                    }, 2000);
                } else {
                    console.error("onAddItem is not a function");
                    throw new Error('Add item function not available. Please try again later.');
                }
            } else if (addType === 'existing' && selectedExistingItem) {
                // Add quantity to existing item
                const updatedItem = {
                    ...selectedExistingItem,
                    quantity: parseInt(selectedExistingItem.quantity || 0) + parseInt(quantityToAdd)
                };

                console.log("Updating existing item with quantity:", updatedItem);

                // Call parent component's add/update handler
                if (typeof onAddItem === 'function') {
                    await onAddItem(updatedItem);
                    setSuccess(`Added ${quantityToAdd} ${updatedItem.name}(s) to inventory`);

                    // Reset form after 2 seconds
                    setTimeout(() => {
                        resetForm();
                        onClose();
                    }, 2000);
                } else {
                    console.error("onAddItem is not a function");
                    throw new Error('Add item function not available. Please try again later.');
                }
            } else {
                throw new Error('Please select an item and specify quantity');
            }
        } catch (err) {
            console.error("Error adding item:", err);
            setError(err.message || 'Failed to add item. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle type selection (new or existing item)
    const handleTypeSelect = (type) => {
        setAddType(type);
        setStep(2);
    };

    // Handle category selection
    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        setFormData(prev => ({
            ...prev,
            category: category
        }));
        setStep(addType === 'new' ? 3 : 3);
    };

    // Handle existing item selection
    const handleItemSelect = (item) => {
        setSelectedExistingItem(item);
    };

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Increment or decrement quantity
    const handleQuantityChange = (amount) => {
        if (addType === 'existing') {
            const newQuantity = Math.max(1, parseInt(quantityToAdd) + amount);
            setQuantityToAdd(newQuantity);
        }
    };

    // Handle quantity change with quick buttons
    const handleQuickQuantitySet = (amount) => {
        setQuantityToAdd(amount);
    };

    // Return appropriate icon for category
    const getCategoryIcon = (category) => {
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

    // Render option selection step
    const renderTypeSelection = () => ( <
        div >
        <
        h3 className = "option-selection-heading" > Select an option < /h3> <
        div className = "options-grid" >
        <
        div className = { `option-card ${addType === 'new' ? 'selected' : ''}` }
        onClick = {
            () => handleTypeSelect('new')
        } >
        <
        div className = "option-icon" > < FaPlus / > < /div> <
        h4 className = "option-title" > Add New Item < /h4> <
        p className = "option-description" > Create a new item in your inventory < /p> < /
        div > <
        div className = { `option-card ${addType === 'existing' ? 'selected' : ''}` }
        onClick = {
            () => handleTypeSelect('existing')
        } >
        <
        div className = "option-icon" > < FaBoxOpen / > < /div> <
        h4 className = "option-title" > Add Existing Item < /h4> <
        p className = "option-description" > Add quantity to an item already in inventory < /p> < /
        div > <
        /div> < /
        div >
    );

    // Render category selection step
    const renderCategorySelection = () => ( <
        div >
        <
        h3 className = "category-selection-heading" > Select a category
        for the item < /h3> <
        div className = "categories-grid" > {
            categories && categories.map(category => ( <
                div key = { category.id || category._id || category.name }
                className = { `category-item ${selectedCategory === category.name ? 'selected' : ''}` }
                onClick = {
                    () => handleCategorySelect(category.name)
                } >
                <
                div className = "category-icon" > { getCategoryIcon(category.name) } < /div> <
                span className = "category-name" > { category.name } < /span> < /
                div >
            ))
        } <
        /div>

        <
        div className = "modal-footer" >
        <
        button type = "button"
        className = "btn btn-secondary"
        onClick = {
            () => setStep(1)
        } >
        Back <
        /button> <
        button type = "button"
        className = "btn btn-primary"
        onClick = {
            () => setStep(3)
        }
        disabled = {!selectedCategory } >
        Next <
        /button> < /
        div > <
        /div>
    );

    // Render item details form step
    const renderItemDetailsForm = () => ( <
        form onSubmit = { handleSubmit } >
        <
        div className = "form-group" >
        <
        label className = "form-label"
        htmlFor = "name" > Item Name * < /label> <
        input type = "text"
        id = "name"
        name = "name"
        className = "form-input"
        value = { formData.name }
        onChange = { handleInputChange }
        required /
        >
        <
        /div>

        <
        div className = "form-group" >
        <
        label className = "form-label"
        htmlFor = "category" > Category * < /label> <
        input type = "text"
        id = "category"
        name = "category"
        className = "form-input"
        value = { formData.category }
        readOnly /
        >
        <
        /div>

        <
        div className = "form-group" >
        <
        label className = "form-label"
        htmlFor = "price" > Price * < /label> <
        input type = "number"
        id = "price"
        name = "price"
        className = "form-input"
        min = "0"
        step = "0.01"
        value = { formData.price }
        onChange = { handleInputChange }
        required /
        >
        <
        /div>

        <
        div className = "form-group" >
        <
        label className = "form-label"
        htmlFor = "quantity" > Quantity * < /label> <
        input type = "number"
        id = "quantity"
        name = "quantity"
        className = "form-input"
        min = "0"
        value = { formData.quantity }
        onChange = { handleInputChange }
        required /
        >
        <
        /div>

        <
        div className = "form-group" >
        <
        label className = "form-label"
        htmlFor = "description" > Description < /label> <
        textarea className = "form-input"
        name = "description"
        value = { formData.description }
        onChange = { handleInputChange }
        rows = { 4 }
        placeholder = "Add item description here. For specifications, use format: key:value; (e.g., processor:Intel i5; ram:16GB;)" >
        < /textarea> <
        div className = "form-hint" >
        <
        small > Tip: Use key: value; format
        for structured data(e.g., processor: Intel i5; ram: 16 GB;) < /small> <
        /div> <
        /div>

        <
        div className = "form-group" >
        <
        label className = "form-label"
        htmlFor = "image" > Image < /label> <
        input type = "file"
        id = "image"
        name = "image"
        className = "form-input"
        onChange = { handleImageChange }
        accept = "image/*" /
        >
        <
        /div>

        {
            previewImage && ( <
                div className = "form-group" >
                <
                label className = "form-label" > Image Preview < /label> <
                div className = "image-preview" >
                <
                img src = { previewImage }
                alt = "Preview"
                onError = {
                    (e) => {
                        console.log("Error loading preview image");
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                    }
                }
                / > < /
                div > < /
                div >
            )
        }

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
        button type = "submit"
        className = "btn btn-primary"
        disabled = { loading } > { loading ? 'Saving...' : 'Save Item' } <
        /button> < /
        div > <
        /form>
    );

    // Render existing item selection step
    const renderExistingItemSelection = () => ( <
        div >
        <
        input type = "text"
        className = "search-box"
        placeholder = "Search items..."
        value = { searchTerm }
        onChange = { handleSearchChange }
        />

        {
            filteredItems && filteredItems.length > 0 ? ( <
                div className = { `items-grid ${selectedExistingItem ? 'has-selection' : ''}` } > {
                    filteredItems.map(item => ( <
                        div key = { item._id || item.id }
                        className = { `item-card ${selectedExistingItem && (selectedExistingItem._id === item._id || selectedExistingItem.id === item.id) ? 'selected' : ''}` }
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
                                e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                            }
                        }
                        /> < /
                        div > <
                        div className = "item-name" > { item.name } < /div> <
                        div className = "item-price" > ₹{
                            item.price ? parseFloat(item.price).toFixed(2) : '0.00'
                        } < /div> <
                        div className = "item-stock" > Stock: { item.quantity || 0 } < /div> < /
                        div >
                    ))
                } <
                /div>
            ) : ( <
                div className = "empty-message" >
                No items found in this category.Try another category or create a new item. <
                /div>
            )
        }

        {
            !selectedExistingItem && ( <
                div className = "modal-footer" >
                <
                button type = "button"
                className = "btn btn-secondary"
                onClick = {
                    () => setStep(2)
                } >
                Back to Categories <
                /button> < /
                div >
            )
        }

        {
            selectedExistingItem && ( <
                div >
                <
                h3 className = "option-selection-heading" > Add Quantity < /h3> <
                div className = "item-detail" >
                <
                div className = "item-detail-image" >
                <
                img src = { getImageUrl(selectedExistingItem) }
                alt = { selectedExistingItem.name }
                onError = {
                    (e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                    }
                }
                /> < /
                div > <
                div className = "item-detail-info" >
                <
                h4 className = "item-detail-name" > { selectedExistingItem.name } < /h4> <
                div className = "item-detail-row" >
                <
                span className = "item-detail-label" > Category: < /span> <
                span className = "item-detail-value" > { selectedExistingItem.category } < /span> < /
                div > <
                div className = "item-detail-row" >
                <
                span className = "item-detail-label" > Current Stock: < /span> <
                span className = "item-detail-value" > { selectedExistingItem.quantity || 0 } < /span> < /
                div > <
                div className = "item-detail-row" >
                <
                span className = "item-detail-label" > Price: < /span> <
                span className = "item-detail-value" > ₹{ parseFloat(selectedExistingItem.price || 0).toFixed(2) } < /span> < /
                div > <
                /div> < /
                div >

                <
                div className = "quantity-controls" >
                <
                button className = "quantity-btn decrease"
                onClick = {
                    () => handleQuantityChange(-1)
                }
                disabled = { quantityToAdd <= 1 } >
                -
                <
                /button> <
                input type = "number"
                className = "quantity-input"
                value = { quantityToAdd }
                onChange = {
                    (e) => setQuantityToAdd(parseInt(e.target.value) || 1)
                }
                min = "1" /
                >
                <
                button className = "quantity-btn increase"
                onClick = {
                    () => handleQuantityChange(1)
                } >
                +
                <
                /button> < /
                div >

                <
                div className = "quick-quantity-buttons" >
                <
                button type = "button"
                className = "quick-quantity-btn"
                onClick = {
                    () => handleQuickQuantitySet(5)
                } >
                +5 <
                /button> <
                button type = "button"
                className = "quick-quantity-btn"
                onClick = {
                    () => handleQuickQuantitySet(10)
                } >
                +10 <
                /button> <
                button type = "button"
                className = "quick-quantity-btn"
                onClick = {
                    () => handleQuickQuantitySet(20)
                } >
                +20 <
                /button> <
                button type = "button"
                className = "quick-quantity-btn"
                onClick = {
                    () => handleQuickQuantitySet(50)
                } >
                +50 <
                /button> < /
                div >

                <
                div className = "modal-footer" >
                <
                button type = "button"
                className = "btn btn-secondary"
                onClick = {
                    () => {
                        setSelectedExistingItem(null);
                        setQuantityToAdd(1);
                        setStep(2);
                    }
                } >
                Back <
                /button> <
                button type = "button"
                className = "btn btn-success"
                onClick = { handleSubmit }
                disabled = { loading } > { loading ? 'Updating...' : 'Update Quantity' } <
                /button> < /
                div > <
                /div>
            )
        } <
        /div>
    );

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

    // Get modal title based on current step and selected type
    const getModalTitle = () => {
        if (item) return 'Edit Item';

        if (step === 1) return 'Add Item';

        if (addType === 'new') return 'Add New Item';

        return 'Add Existing Item';
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

        { step === 1 && renderTypeSelection() } { step === 2 && renderCategorySelection() } { step === 3 && (addType === 'new' ? renderItemDetailsForm() : renderExistingItemSelection()) } <
        /div> < /
        div > <
        /div>
    );
};

export default AddItemModal;