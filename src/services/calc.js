const { roundCurrency } = require('../utils/helpers');
const { COMMISSION_RATES } = require('../config/constants');

/**
 * Calculates the net monthly income after agency commission and annual fees.
 * @param {number} monthlyRent - Monthly rent of the property
 * @param {number} annualFee - Annual expenses (insurance, taxes, etc.)
 * @param {number} year - Simulation year (1, 2, 3...)
 * @returns {number} net monthly income (€)
 */
function netMonthlyIncome(monthlyRent, annualFee, year) {
    let commissionRate = COMMISSION_RATES.DEFAULT;

    if (year === 1) commissionRate = COMMISSION_RATES.YEAR_1;
    else if (year === 2) commissionRate = COMMISSION_RATES.YEAR_2;

    const grossAnnual = monthlyRent * 12;
    const netAnnual = grossAnnual * (1 - commissionRate) - annualFee;
    const netMonthly = netAnnual / 12;

    return roundCurrency(netMonthly);
}

/**
 * Calculates return on investment (%) relative to the purchase price over multiple years.
 * @param {number} purchasePrice - Purchase price of the property (must be > 0)
 * @param {number} monthlyRent - Monthly rent (must be >= 0)
 * @param {number} annualFee - Annual expenses (must be >= 0)
 * @param {number} years - Number of years to simulate (default: 3)
 * @returns {Array<Object>} Array containing return data for each year with structure:
 *   { year: number, netMonthly: number, annualNet: number, roi: number }
 * @throws {Error} If purchasePrice is invalid
 */
function returnOverYears(purchasePrice, monthlyRent, annualFee, years = 3) {
    // Validate inputs
    if (typeof purchasePrice !== 'number' || purchasePrice <= 0) {
        throw new Error('Purchase price must be a positive number');
    }
    if (typeof monthlyRent !== 'number' || monthlyRent < 0) {
        throw new Error('Monthly rent must be a non-negative number');
    }
    if (typeof annualFee !== 'number' || annualFee < 0) {
        throw new Error('Annual fee must be a non-negative number');
    }
    if (typeof years !== 'number' || years < 1 || !Number.isInteger(years)) {
        throw new Error('Years must be a positive integer');
    }

    const returns = [];

    for (let year = 1; year <= years; year++) {
        const netMonthly = netMonthlyIncome(monthlyRent, annualFee, year);
        const annualNet = netMonthly * 12;
        const roi = purchasePrice > 0 ? (annualNet / purchasePrice) * 100 : 0;

        returns.push({
            year,
            netMonthly,
            annualNet: roundCurrency(annualNet),
            roi: roundCurrency(roi)
        });
    }
    
    return returns;
}

module.exports = {
    netMonthlyIncome,
    returnOverYears,
    COMMISSION_RATES // Exported for testing purposes
};
