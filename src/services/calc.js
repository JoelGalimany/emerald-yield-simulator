const { roundCurrency } = require('../utils/helpers');

const COMMISSION_RATES = {
    YEAR_1: 0.30,
    YEAR_2: 0.25,
    DEFAULT: 0.20
};

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
 * Calculates return (%) relative to the purchase price.
 * @param {number} purchasePrice - Purchase price of the property
 * @param {number} monthlyRent - Monthly rent
 * @param {number} annualFee - Annual expenses
 * @param {number} years - Number of years to simulate
 * @returns {Array} Array containing return data for each year
 */
function returnOverYears(purchasePrice, monthlyRent, annualFee, years = 3) {
    const returns = [];

    // Avoid division by zero
    if (!purchasePrice || purchasePrice <= 0) return returns;

    for (let year = 1; year <= years; year++) {
        const netMonthly = netMonthlyIncome(monthlyRent, annualFee, year);
        const annualNet = netMonthly * 12;
        const roi = (annualNet / purchasePrice) * 100;

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
