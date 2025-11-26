/**
 * Rounds a number to a specified number of decimal places
 * @param {number} value - Number to round
 * @param {number} decimals - Number of decimal places (default 2)
 * @returns {number}
 */
function roundCurrency(value, decimals = 2) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

/**
 * Formats a number as currency with locale-specific formatting
 * @param {number} value - Number to format
 * @param {string} locale - Locale string (default: 'en-US')
 * @param {string} currency - Currency code (default: 'EUR')
 * @returns {string} Formatted currency string
 */
function formatCurrency(value, locale = 'en-US', currency = 'EUR') {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

/**
 * Formats a number with locale-specific number formatting
 * @param {number} value - Number to format
 * @param {string} locale - Locale string (default: 'en-US')
 * @param {number} minDecimals - Minimum decimal places (default: 2)
 * @param {number} maxDecimals - Maximum decimal places (default: 2)
 * @returns {string} Formatted number string
 */
function formatNumber(value, locale = 'en-US', minDecimals = 2, maxDecimals = 2) {
    return new Intl.NumberFormat(locale, {
        minimumFractionDigits: minDecimals,
        maximumFractionDigits: maxDecimals
    }).format(value);
}

module.exports = {
    roundCurrency,
    formatCurrency,
    formatNumber
};