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

module.exports = {
    roundCurrency
};