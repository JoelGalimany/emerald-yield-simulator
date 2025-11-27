const { roundCurrency } = require('../utils/helpers');
const { COMMISSION_RATES, PREDICTION_CONFIG } = require('../config/constants');
const { loadDataset, calculateDatasetStats, filterDatasetByPrice, calculateSegmentedAOR, getDatasetPath, getDatasetPathSync } = require('./dataLoader');
const logger = require('../utils/logger');

let cachedStats = null;
let cachedDataset = null;
let datasetLoaded = false;
let datasetLoadingPromise = null;

/**
 * Loads dataset and stats (cached after first load)
 * Uses a Promise-based approach to handle concurrent requests
 * @returns {Promise<Object>} Dataset statistics
 */
async function getDatasetStats() {
    if (cachedStats && datasetLoaded) return cachedStats;

    if (datasetLoadingPromise) return datasetLoadingPromise;

    datasetLoadingPromise = (async () => {
        try {
            const datasetPath = await getDatasetPath();
            
            if (!datasetPath) {
                logger.warn('Dataset file not found. Data-driven predictions will be disabled.');
                cachedStats = {
                    avgSurface: 0,
                    avgBedrooms: 0,
                    avgLocationScore: 0,
                    avgListingPrice: 0,
                    bookingRate: 0,
                    totalProperties: 0,
                    available: false
                };
                cachedDataset = [];
                datasetLoaded = true;
                return cachedStats;
            }

            cachedDataset = loadDataset(datasetPath);
            
            cachedStats = calculateDatasetStats(cachedDataset);
            cachedStats.available = true;
            datasetLoaded = true;

            return cachedStats;
        } catch (error) {
            logger.error('Error loading dataset stats', error);
            cachedStats = {
                avgSurface: 0,
                avgBedrooms: 0,
                avgLocationScore: 0,
                avgListingPrice: 0,
                bookingRate: 0,
                totalProperties: 0,
                available: false
            };
            cachedDataset = [];
            datasetLoaded = true;
            return cachedStats;
        } finally {
            datasetLoadingPromise = null;
        }
    })();

    return datasetLoadingPromise;
}

/**
 * Synchronous version for backward compatibility (uses cached stats)
 * @returns {Object} Dataset statistics
 */
function getDatasetStatsSync() {
    if (cachedStats && datasetLoaded) {
        return cachedStats;
    }

    const datasetPath = getDatasetPathSync();
    if (!datasetPath) {
        const emptyStats = {
            avgSurface: 0,
            avgBedrooms: 0,
            avgLocationScore: 0,
            avgListingPrice: 0,
            bookingRate: 0,
            totalProperties: 0,
            available: false
        };
        cachedStats = emptyStats;
        cachedDataset = [];
        datasetLoaded = true;
        return emptyStats;
    }

    cachedDataset = loadDataset(datasetPath);
    const stats = calculateDatasetStats(cachedDataset);
    stats.available = true;
    
    cachedStats = stats;
    datasetLoaded = true;
    
    return stats;
}

/**
 * Calculates segmented occupancy rate (AOR) based on similar properties
 * Filters dataset by price range (±15%) around the estimated daily price
 * @param {number} monthlyRent - User-provided monthly rent
 * @returns {Promise<Object>} Object with segmented AOR and filtered dataset info
 */
async function calculateSegmentedOccupancyRate(monthlyRent) {
    const stats = await getDatasetStats();
    
    if (!stats.available) {
        return null;
    }

    if (!cachedDataset || cachedDataset.length === 0) {
        return {
            segmentedAOR: stats.bookingRate,
            globalAOR: stats.bookingRate,
            filteredCount: 0,
            totalCount: 0,
            usedSegmentation: false
        };
    }

    const estimatedDailyPrice = monthlyRent / PREDICTION_CONFIG.AVERAGE_DAYS_PER_MONTH;
    
    const minPrice = estimatedDailyPrice * (1 - PREDICTION_CONFIG.PRICE_MARGIN);
    const maxPrice = estimatedDailyPrice * (1 + PREDICTION_CONFIG.PRICE_MARGIN);
    
    const filteredDataset = filterDatasetByPrice(cachedDataset, minPrice, maxPrice);
    
    if (filteredDataset.length === 0) {
        // If no similar properties found, fall back to global AOR
        return {
            segmentedAOR: stats.bookingRate,
            globalAOR: stats.bookingRate,
            filteredCount: 0,
            totalCount: cachedDataset.length,
            usedSegmentation: false
        };
    }
    
    const segmentedAOR = calculateSegmentedAOR(filteredDataset);
    
    return {
        segmentedAOR: segmentedAOR,
        globalAOR: stats.bookingRate,
        filteredCount: filteredDataset.length,
        totalCount: cachedDataset.length,
        usedSegmentation: true,
        estimatedDailyPrice: estimatedDailyPrice,
        priceRange: { min: minPrice, max: maxPrice }
    };
}

/**
 * Calculates predicted net monthly income with segmented occupancy rate adjustment
 * Uses price-based segmentation to find similar properties and calculate more accurate AOR
 * @param {number} monthlyRent - User-provided monthly rent
 * @param {number} annualFee - Annual expenses
 * @param {number} year - Simulation year (1, 2, 3...)
 * @returns {Promise<Object>} Predicted income with segmented occupancy rate adjustment
 */
async function predictNetMonthlyIncome(monthlyRent, annualFee, year) {
    const stats = await getDatasetStats();
    
    if (!stats.available) {
        return null;
    }

    // Calculate segmented occupancy rate based on similar properties
    const segmentation = await calculateSegmentedOccupancyRate(monthlyRent);
    
    if (!segmentation) return null;

    // Use segmented AOR if available, otherwise fall back to global AOR
    const occupancyRate = segmentation.segmentedAOR;
    
    // Calculate data-driven gross monthly income
    const adjustedMonthlyRent = monthlyRent * occupancyRate;
    
    // Calculate commission rate based on year
    let commissionRate = COMMISSION_RATES.DEFAULT;
    if (year === 1) commissionRate = COMMISSION_RATES.YEAR_1;
    else if (year === 2) commissionRate = COMMISSION_RATES.YEAR_2;

    // Calculate net income with segmented occupancy rate adjustment
    const grossAnnual = adjustedMonthlyRent * 12;
    const netAnnual = grossAnnual * (1 - commissionRate) - annualFee;
    const netMonthly = netAnnual / 12;

    // Calculate booked days per month based on occupancy rate
    const bookedDaysPerMonth = occupancyRate * PREDICTION_CONFIG.AVERAGE_DAYS_PER_MONTH;

    return {
        netMonthly: roundCurrency(netMonthly),
        adjustedMonthlyRent: roundCurrency(adjustedMonthlyRent),
        bookingRate: occupancyRate,
        occupancyRate: occupancyRate * 100,
        bookedDaysPerMonth: roundCurrency(bookedDaysPerMonth),
        segmentedAOR: segmentation.segmentedAOR,
        globalAOR: segmentation.globalAOR,
        filteredCount: segmentation.filteredCount,
        totalCount: segmentation.totalCount,
        usedSegmentation: segmentation.usedSegmentation
    };
}

/**
 * Calculates data-driven return predictions over multiple years
 * @param {number} purchasePrice - Purchase price of the property
 * @param {number} monthlyRent - User-provided monthly rent
 * @param {number} annualFee - Annual expenses
 * @param {number} years - Number of years to simulate (default: 3)
 * @returns {Promise<Array<Object>>} Array of predicted returns for each year
 */
async function predictReturnOverYears(purchasePrice, monthlyRent, annualFee, years = 3) {
    const predictions = [];

    for (let year = 1; year <= years; year++) {
        const prediction = await predictNetMonthlyIncome(monthlyRent, annualFee, year);
        
        if (!prediction) return null;

        const annualNet = prediction.netMonthly * 12;
        const roi = purchasePrice > 0 ? (annualNet / purchasePrice) * 100 : 0;

        predictions.push({
            year,
            netMonthly: prediction.netMonthly,
            annualNet: roundCurrency(annualNet),
            roi: roundCurrency(roi),
            adjustedMonthlyRent: prediction.adjustedMonthlyRent,
            bookingRate: prediction.bookingRate,
            occupancyRate: prediction.occupancyRate,
            bookedDaysPerMonth: prediction.bookedDaysPerMonth,
            segmentedAOR: prediction.segmentedAOR,
            globalAOR: prediction.globalAOR,
            filteredCount: prediction.filteredCount,
            totalCount: prediction.totalCount,
            usedSegmentation: prediction.usedSegmentation
        });
    }

    return predictions;
}

/**
 * Initializes the dataset by downloading and loading it
 * Should be called at application startup
 * @returns {Promise<void>}
 */
async function initializeDataset() {
    try {
        logger.info('Initializing dataset...');
        const stats = await getDatasetStats();
        if (stats.available && stats.totalProperties > 0) {
            logger.info(`Dataset initialized successfully: ${stats.totalProperties} properties loaded`);
        } else {
            logger.warn('Dataset initialized but no data available. Data-driven predictions will be disabled.');
        }
    } catch (error) {
        logger.error('Error initializing dataset', error);
    }
}

/**
 * Resets the cached dataset and stats (useful for testing or reloading)
 */
function resetCache() {
    cachedStats = null;
    cachedDataset = null;
    datasetLoaded = false;
    datasetLoadingPromise = null;
}

module.exports = {
    getDatasetStats,
    getDatasetStatsSync,
    calculateSegmentedOccupancyRate,
    predictNetMonthlyIncome,
    predictReturnOverYears,
    initializeDataset,
    resetCache
};

