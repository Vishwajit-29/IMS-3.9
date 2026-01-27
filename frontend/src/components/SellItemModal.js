import React, { useState, useEffect } from 'react';
import { FaTimes, FaSearch, FaMinus, FaPlus, FaReceipt, FaPrint, FaDownload, FaCheck, FaExclamationCircle, FaTablet, FaHome, FaTshirt, FaUtensils, FaTools, FaCube, FaCubes, FaBox, FaBoxOpen } from 'react-icons/fa';
import { jsPDF } from "jspdf";
import './Modals.css';

const SellItemModal = ({ show, onClose, onSellItem, item, items = [], categories = [] }) => {
    // State variables
    const [selectedItem, setSelectedItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredItems, setFilteredItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [step, setStep] = useState(1); // 1: Category Selection, 2: Item Selection, 3: Quantity & Confirmation
    const [quantityToSell, setQuantityToSell] = useState(1);
    const [receiptData, setReceiptData] = useState(null);
    const [showReceipt, setShowReceipt] = useState(false);
    const [originalValue, setOriginalValue] = useState(0); // New state for original value
    const [remainingValue, setRemainingValue] = useState(0); // New state for remaining value

    // Initialize when modal opens or item prop changes
    useEffect(() => {
        if (show) {
            // Reset form
            resetForm();

            // Filter items
            setFilteredItems(items.filter(i => i.quantity > 0));

            // If an item is passed, pre-select it and skip to confirmation step
            if (item) {
                setSelectedItem(item);
                setSelectedCategory(item.category || 'All');
                setStep(3);
                setQuantityToSell(1);

                // Calculate original value
                const itemPrice = item.price || 0;
                setOriginalValue(itemPrice * item.quantity);
                setRemainingValue(itemPrice * (item.quantity - 1)); // Subtract 1 as default quantity to sell
            } else {
                setSelectedItem(null);
                setSelectedCategory('All');
                setStep(1);
                setOriginalValue(0);
                setRemainingValue(0);
            }
        }
    }, [show, item, items]);

    // Filter items based on search term and selected category
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

    // Reset form to initial state
    const resetForm = () => {
        setSelectedItem(null);
        setSearchTerm('');
        setSelectedCategory('All');
        setStep(1);
        setError('');
        setSuccess(false);
        setQuantityToSell(1);
        setReceiptData(null);
        setShowReceipt(false);
    };

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Handle category selection
    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        setStep(2); // Move to item selection step after selecting category
    };

    // Handle item selection
    const handleItemSelect = (item) => {
        setSelectedItem(item);
        // Default quantity to 1
        setQuantityToSell(1);
        setStep(3);

        // Calculate original value and remaining value
        const itemPrice = item.price || 0;
        const originalVal = itemPrice * item.quantity;
        setOriginalValue(originalVal);
        setRemainingValue(originalVal - itemPrice); // Subtract price for 1 item
    };

    // Handle quantity change
    const handleQuantityChange = (e) => {
        const value = parseInt(e.target.value);
        const maxQuantity = selectedItem ? selectedItem.quantity : 0;
        if (!isNaN(value) && value >= 1 && value <= maxQuantity) {
            setQuantityToSell(value);

            // Update remaining value based on new quantity
            if (selectedItem) {
                const itemPrice = selectedItem.price || 0;
                const originalVal = itemPrice * selectedItem.quantity;
                setRemainingValue(originalVal - (itemPrice * value));
            }
        }
    };

    // Handle quantity increment/decrement
    const adjustQuantity = (amount) => {
        const newValue = quantityToSell + amount;
        const maxQuantity = selectedItem ? selectedItem.quantity : 0;
        if (newValue >= 1 && newValue <= maxQuantity) {
            setQuantityToSell(newValue);

            // Update remaining value based on new quantity
            if (selectedItem) {
                const itemPrice = selectedItem.price || 0;
                const originalVal = itemPrice * selectedItem.quantity;
                setRemainingValue(originalVal - (itemPrice * newValue));
            }
        }
    };

    // Handle quick quantity set
    const handleQuickQuantitySet = (amount) => {
        const maxQuantity = selectedItem ? selectedItem.quantity : 0;
        const newValue = Math.min(amount, maxQuantity);
        setQuantityToSell(newValue);

        // Update remaining value based on new quantity
        if (selectedItem) {
            const itemPrice = selectedItem.price || 0;
            const originalVal = itemPrice * selectedItem.quantity;
            setRemainingValue(originalVal - (itemPrice * newValue));
        }
    };

    // Handle item sale
    const handleSellItem = async() => {
        if (!selectedItem) {
            setError('Please select an item to sell');
            return;
        }

        if (quantityToSell <= 0) {
            setError('Please specify a valid quantity to sell');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Call the parent's onSellItem function and get the updated item
            const updatedItem = await onSellItem(selectedItem._id || selectedItem.id, quantityToSell);
            console.log("Updated item after sale:", updatedItem);

            // Calculate sale amount
            const saleAmount = (selectedItem.price || 0) * quantityToSell;

            // Calculate original and new values
            const originalItemValue = (selectedItem.price || 0) * selectedItem.quantity;
            const newQuantity = updatedItem ? updatedItem.quantity : (selectedItem.quantity - quantityToSell);
            const newItemValue = (selectedItem.price || 0) * newQuantity;

            // Generate receipt data
            const receipt = {
                itemName: selectedItem.name,
                category: selectedItem.category,
                quantity: quantityToSell,
                price: selectedItem.price || 0,
                totalPrice: saleAmount,
                originalValue: originalItemValue,
                remainingValue: newItemValue,
                date: new Date().toISOString(),
                transactionId: `TR-${Date.now()}`
            };

            // Update state with the correct values
            setOriginalValue(originalItemValue);
            setRemainingValue(newItemValue);

            // Update the selected item with the new quantity
            if (updatedItem) {
                setSelectedItem({
                    ...selectedItem,
                    quantity: updatedItem.quantity
                });
            } else {
                // Fallback if updatedItem not returned
                setSelectedItem({
                    ...selectedItem,
                    quantity: selectedItem.quantity - quantityToSell
                });
            }

            setReceiptData(receipt);
            setSuccess(true);
            setShowReceipt(true);
        } catch (err) {
            console.error('Error selling item:', err);
            setError(err.message || 'Failed to sell item. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Get image URL for an item
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

    // Calculate total price
    const calculateTotal = () => {
        if (!selectedItem) return 0;
        const price = selectedItem.price || 0;
        return price * quantityToSell;
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

    // Handle receipt download
    const handleDownloadReceipt = () => {
        if (!receiptData) return;

        try {
            // Create PDF document
            const doc = new jsPDF();

            // Set font size and styles
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('SALE RECEIPT', 105, 20, { align: 'center' });

            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');

            // Add receipt content
            doc.text(`Transaction ID: ${receiptData.transactionId}`, 20, 40);
            doc.text(`Date: ${new Date(receiptData.date).toLocaleString()}`, 20, 50);

            doc.line(20, 60, 190, 60); // Horizontal line

            doc.text(`Item: ${receiptData.itemName}`, 20, 70);
            doc.text(`Category: ${receiptData.category}`, 20, 80);
            doc.text(`Quantity: ${receiptData.quantity}`, 20, 90);
            doc.text(`Price per unit: ₹${parseFloat(receiptData.price).toFixed(2)}`, 20, 100);
            doc.text(`Total sale amount: ₹${parseFloat(receiptData.totalPrice).toFixed(2)}`, 20, 110);

            // Add inventory value information
            doc.text(`Original inventory value: ₹${parseFloat(receiptData.originalValue).toFixed(2)}`, 20, 130);
            doc.text(`Remaining inventory value: ₹${parseFloat(receiptData.remainingValue).toFixed(2)}`, 20, 140);
            doc.text(`Value reduction: ₹${parseFloat(receiptData.totalPrice).toFixed(2)}`, 20, 150);

            doc.line(20, 170, 190, 170); // Horizontal line

            doc.setFontSize(10);
            doc.text('Thank you for your purchase!', 105, 180, { align: 'center' });
            doc.text(`Inventory Management System Receipt - Generated ${new Date().toLocaleString()}`, 105, 190, { align: 'center' });

            // Save PDF
            doc.save(`receipt-${receiptData.transactionId}.pdf`);
        } catch (pdfError) {
            console.error('Error generating PDF receipt:', pdfError);

            // Fallback to text download if PDF generation fails
            try {
                const receiptText = `
SALE RECEIPT
--------------------
Transaction ID: ${receiptData.transactionId}
Date: ${new Date(receiptData.date).toLocaleString()}

Item: ${receiptData.itemName}
Category: ${receiptData.category}
Quantity: ${receiptData.quantity}
Price per unit: ₹${parseFloat(receiptData.price).toFixed(2)}
Total sale amount: ₹${parseFloat(receiptData.totalPrice).toFixed(2)}

Original inventory value: ₹${parseFloat(receiptData.originalValue).toFixed(2)}
Remaining inventory value: ₹${parseFloat(receiptData.remainingValue).toFixed(2)}
Value reduction: ₹${parseFloat(receiptData.totalPrice).toFixed(2)}

Thank you for your purchase!
Inventory Management System Receipt - Generated ${new Date().toLocaleString()}
                `;

                const blob = new Blob([receiptText], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `receipt-${receiptData.transactionId}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (textError) {
                console.error('Fallback receipt download also failed:', textError);
                alert('Could not generate receipt. Please try again.');
            }
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
                div className = "category-icon" > { getCategoryIcon(category.name) } <
                /div> <
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
        placeholder = "Search items..."
        value = { searchTerm }
        onChange = { handleSearchChange }
        className = "search-box" / >
        <
        FaSearch className = "search-icon" / >
        <
        /div>

        <
        div className = { `items-grid ${selectedItem ? 'has-selection' : ''}` } > {
            filteredItems.length === 0 ? ( <
                div className = "empty-message" >
                <
                p > No items found.Try a different search or category. < /p> < /
                div >
            ) : (
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
                    title = { item.name } > { item.name } <
                    /div> <
                    div className = "item-price" > ₹{ item.price ? parseFloat(item.price).toFixed(2) : '0.00' } < /div> <
                    div className = "item-stock" > Stock: { item.quantity } < /div> < /
                    div >
                ))
            )
        } <
        /div> <
        div className = "filter-hint" >
        <
        span > { filteredItems.length }
        items found { selectedCategory !== 'All' ? `in ${selectedCategory}` : '' } < /span> < /
        div > <
        /div>
    );

    // Render quantity selection step
    const renderQuantitySelectionStep = () => {
        if (!selectedItem) return null;

        return ( <
            div className = "sell-item-step" >
            <
            h3 > Confirm Sale < /h3>

            <
            div className = "item-details-card" >
            <
            div className = "item-detail-img-container" >
            <
            img src = { getImageUrl(selectedItem) }
            alt = { selectedItem.name }
            className = "item-detail-img"
            onError = {
                (e) => {
                    console.warn(`Image failed to load for ${selectedItem.name}`);
                    e.target.src = '/images/items/placeholder.png';
                }
            }
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
            span className = "item-detail-label" > Available: < /span> <
            span className = "item-detail-value" > { selectedItem.quantity || 0 } < /span> < /
            div > <
            div className = "item-detail-row" >
            <
            span className = "item-detail-label" > Price: < /span> <
            span className = "item-detail-value" > ₹{ parseFloat(selectedItem.price || 0).toFixed(2) } < /span> < /
            div > <
            div className = "item-detail-row" >
            <
            span className = "item-detail-label" > Total Value: < /span> <
            span className = "item-detail-value" > ₹{ parseFloat(originalValue).toFixed(2) } < /span> < /
            div > <
            /div> < /
            div >

            <
            div className = "quantity-controls" >
            <
            button className = "quantity-btn decrease"
            onClick = {
                () => adjustQuantity(-1)
            }
            disabled = { quantityToSell <= 1 } >
            -
            <
            /button> <
            input type = "number"
            className = "quantity-input"
            value = { quantityToSell }
            onChange = { handleQuantityChange }
            min = "1"
            max = { selectedItem.quantity }
            /> <
            button className = "quantity-btn increase"
            onClick = {
                () => adjustQuantity(1)
            }
            disabled = { quantityToSell >= selectedItem.quantity } >
            +
            <
            /button> < /
            div >

            <
            div className = "quick-quantity-buttons" > {
                [1, 5, 10, 25, 50].map(qty => ( <
                    button key = { qty }
                    className = { `quick-qty-btn ${quantityToSell === qty ? 'active' : ''}` }
                    onClick = {
                        () => handleQuickQuantitySet(qty)
                    }
                    disabled = { qty > selectedItem.quantity } > { qty } <
                    /button>
                ))
            } <
            button className = { `quick-qty-btn ${quantityToSell === selectedItem.quantity ? 'active' : ''}` }
            onClick = {
                () => handleQuickQuantitySet(selectedItem.quantity)
            } >
            All <
            /button> < /
            div >

            <
            div className = "sale-summary" >
            <
            div className = "summary-row" >
            <
            span className = "summary-label" > Price per item: < /span> <
            span className = "summary-value" > ₹{ parseFloat(selectedItem.price || 0).toFixed(2) } < /span> < /
            div > <
            div className = "summary-row" >
            <
            span className = "summary-label" > Quantity to sell: < /span> <
            span className = "summary-value" > { quantityToSell } < /span> < /
            div > <
            div className = "summary-row total" >
            <
            span className = "summary-label" > Total Sale Amount: < /span> <
            span className = "summary-value" > ₹{ parseFloat(calculateTotal()).toFixed(2) } < /span> < /
            div > <
            div className = "summary-row" >
            <
            span className = "summary-label" > Original Inventory Value: < /span> <
            span className = "summary-value" > ₹{ parseFloat(originalValue).toFixed(2) } < /span> < /
            div > <
            div className = "summary-row" >
            <
            span className = "summary-label" > Remaining Inventory Value: < /span> <
            span className = "summary-value" > ₹{ parseFloat(remainingValue).toFixed(2) } < /span> < /
            div > <
            div className = "summary-row highlight" >
            <
            span className = "summary-label" > Value Reduction: < /span> <
            span className = "summary-value" > ₹{ parseFloat(calculateTotal()).toFixed(2) } < /span> < /
            div > <
            /div>

            <
            div className = "modal-actions" >
            <
            button className = "btn secondary"
            onClick = {
                () => setStep(2)
            }
            disabled = { loading } >
            Back <
            /button> <
            button className = "btn primary"
            onClick = { handleSellItem }
            disabled = { loading } > { loading ? 'Processing...' : 'Complete Sale' } <
            /button> < /
            div > <
            /div>
        );
    };

    // Render receipt after successful sale
    const renderReceipt = () => ( <
        div className = "receipt" >
        <
        div className = "receipt-header" >
        <
        FaReceipt size = { 32 }
        /> <
        h3 > Sale Receipt < /h3> < /
        div >

        <
        div className = "receipt-content" >
        <
        div className = "receipt-item" >
        <
        span > Transaction ID: < /span> <
        span > { receiptData.transactionId } < /span> < /
        div > <
        div className = "receipt-item" >
        <
        span > Date: < /span> <
        span > { new Date(receiptData.date).toLocaleString() } < /span> < /
        div > <
        div className = "receipt-item" >
        <
        span > Item: < /span> <
        span > { receiptData.itemName } < /span> < /
        div > <
        div className = "receipt-item" >
        <
        span > Category: < /span> <
        span > { receiptData.category } < /span> < /
        div > <
        div className = "receipt-item" >
        <
        span > Quantity: < /span> <
        span > { receiptData.quantity } < /span> < /
        div > <
        div className = "receipt-item" >
        <
        span > Price Per Unit: < /span> <
        span > ₹{ parseFloat(receiptData.price).toFixed(2) } < /span> < /
        div > <
        div className = "receipt-item total" >
        <
        span > Total Amount: < /span> <
        span > ₹{ parseFloat(receiptData.totalPrice).toFixed(2) } < /span> < /
        div >

        <
        div className = "receipt-item" >
        <
        span > Original Inventory Value: < /span> <
        span > ₹{ parseFloat(receiptData.originalValue).toFixed(2) } < /span> < /
        div > <
        div className = "receipt-item" >
        <
        span > Remaining Inventory Value: < /span> <
        span > ₹{ parseFloat(receiptData.remainingValue).toFixed(2) } < /span> < /
        div > <
        div className = "receipt-item highlight" >
        <
        span > Value Reduction: < /span> <
        span > ₹{ parseFloat(receiptData.totalPrice).toFixed(2) } < /span> < /
        div > <
        /div>

        <
        div className = "receipt-actions no-print" >
        <
        button className = "btn btn-outline"
        onClick = {
            () => window.print()
        } >
        <
        FaPrint / > Print <
        /button> <
        button className = "btn btn-outline"
        onClick = { handleDownloadReceipt } >
        <
        FaDownload / > Download <
        /button> < /
        div >

        <
        div className = "modal-footer no-print" >
        <
        button type = "button"
        className = "btn btn-success"
        onClick = {
            () => {
                onClose();
                resetForm();
            }
        } >
        <
        FaCheck / > Done <
        /button> < /
        div > <
        /div>
    );

    // Get modal title based on current state
    const getModalTitle = () => {
        if (showReceipt) return 'Sale Complete';
        if (step === 1) return 'Select Category';
        if (step === 2) return 'Select Item to Sell';
        return 'Complete Sale';
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
            showReceipt ? (
                renderReceipt()
            ) : ( <
                >
                { renderStepIndicator() } { step === 1 && renderCategorySelection() } { step === 2 && renderItemSelection() } { step === 3 && renderQuantitySelectionStep() } <
                />
            )
        } <
        /div> < /
        div > <
        /div>
    );
};

export default SellItemModal;