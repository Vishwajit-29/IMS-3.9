/**
 * Utility functions for formatting values in the application
 */

/**
 * Format a number as Indian Rupee (₹) currency
 * @param {number} amount - The amount to format
 * @param {boolean} showDecimal - Whether to show decimal places
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, showDecimal = true) => {
    if (amount === undefined || amount === null) return '₹0';

    try {
        // Convert to number if it's a string
        const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

        // Check if it's a valid number
        if (isNaN(numericAmount)) return '₹0';

        // Format with Indian numbering system (comma placement)
        const formatter = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: showDecimal ? 2 : 0,
            maximumFractionDigits: showDecimal ? 2 : 0
        });

        return formatter.format(numericAmount);
    } catch (error) {
        console.error('Error formatting currency:', error);
        return `₹${amount}`;
    }
};

/**
 * Format a date to a readable string
 * @param {Date|string} date - The date to format
 * @param {boolean} showTime - Whether to include the time
 * @returns {string} Formatted date string
 */
export const formatDate = (date, showTime = false) => {
    if (!date) return 'N/A';

    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;

        if (isNaN(dateObj.getTime())) return 'Invalid Date';

        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            ...(showTime && {
                hour: '2-digit',
                minute: '2-digit'
            })
        };

        return dateObj.toLocaleDateString('en-IN', options);
    } catch (error) {
        console.error('Error formatting date:', error);
        return String(date);
    }
};

/**
 * Format a number with commas for better readability
 * @param {number} value - The number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (value) => {
    if (value === undefined || value === null) return '0';

    try {
        // Convert to number if it's a string
        const numericValue = typeof value === 'string' ? parseFloat(value) : value;

        // Check if it's a valid number
        if (isNaN(numericValue)) return '0';

        // Format with Indian numbering system (comma placement)
        return new Intl.NumberFormat('en-IN').format(numericValue);
    } catch (error) {
        console.error('Error formatting number:', error);
        return String(value);
    }
};