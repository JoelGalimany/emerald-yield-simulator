const Simulation = require('../models/Simulation');
const { validateObjectId } = require('../utils/validators');
const { predictReturnOverYears, getDatasetStats } = require('./prediction');

/**
 * Gets simulation data with predictions and statistics
 * Shared logic for both public results and admin detail views
 * @param {string} id - Simulation ID
 * @returns {Promise<Object>} Object containing simulation, predictions, datasetStats, and hasNegativeIncome
 * @throws {Error} If ID is invalid or simulation not found
 */
async function getSimulationWithPredictions(id) {
    validateObjectId(id);

    const simulation = await Simulation.findById(id).lean();

    if (!simulation) {
        const error = new Error('Simulation not found');
        error.statusCode = 404;
        throw error;
    }

    const predictions = await predictReturnOverYears(
        simulation.purchasePrice,
        simulation.monthlyRent,
        simulation.annualFee,
        3
    );

    const datasetStats = await getDatasetStats();

    const hasNegativeIncome = simulation.results.some(
        r => r.netMonthly < 0 || r.annualNet < 0
    );

    return {
        simulation,
        predictions,
        datasetStats,
        hasNegativeIncome
    };
}

/**
 * Formats simulation data for view rendering
 * @param {Object} simulation - Raw simulation object from database
 * @returns {Object} Formatted simulation object for views
 */
function formatSimulationForView(simulation) {
    return {
        purchasePrice: simulation.purchasePrice,
        monthlyRent: simulation.monthlyRent,
        annualFee: simulation.annualFee,
        email: simulation.email,
        results: simulation.results,
        ...(simulation.createdAt && { createdAt: simulation.createdAt }),
        ...(simulation._id && { _id: simulation._id })
    };
}

module.exports = {
    getSimulationWithPredictions,
    formatSimulationForView
};

