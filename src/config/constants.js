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

// Pagination defaults
const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
};

// Dataset configuration
const DATASET_CONFIG = {
    // Google Drive file ID
    GOOGLE_DRIVE_FILE_ID: '17zwQBXYvawGyM48jyVRSCrlXRubQ3Oa3',
    getDownloadUrl: function() {
        return `https://drive.google.com/uc?export=download&id=${this.GOOGLE_DRIVE_FILE_ID}`;
    },
    // Cache duration in milliseconds (24 hours)
    CACHE_DURATION: 24 * 60 * 60 * 1000,
    LOCAL_FILE_PATH: 'data/dataset.csv'
};

// Prediction configuration
const PREDICTION_CONFIG = {
    // Average days per month (365.25 / 12)
    AVERAGE_DAYS_PER_MONTH: 30.42,
    // Price margin for property segmentation (±15%)
    PRICE_MARGIN: 0.15
};

module.exports = {
    SIMULATION_DEFAULTS,
    COMMISSION_RATES,
    VALIDATION_LIMITS,
    PAGINATION,
    DATASET_CONFIG,
    PREDICTION_CONFIG
};

