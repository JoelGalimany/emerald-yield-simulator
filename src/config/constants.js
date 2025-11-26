/**
 * Application constants
 */

// Simulation defaults
const SIMULATION_DEFAULTS = {
    YEARS: 3,
    LOCALE: 'en-US',
    CURRENCY: 'EUR'
};

// Commission rates
const COMMISSION_RATES = {
    YEAR_1: 0.30,
    YEAR_2: 0.25,
    DEFAULT: 0.20
};

// Validation limits
const VALIDATION_LIMITS = {
    EMAIL_MIN_LENGTH: 5,
    EMAIL_MAX_LENGTH: 254,
    PURCHASE_PRICE_MIN: 0.01
};

module.exports = {
    SIMULATION_DEFAULTS,
    COMMISSION_RATES,
    VALIDATION_LIMITS
};

