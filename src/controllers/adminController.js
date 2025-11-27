const Simulation = require('../models/Simulation');
const { getSimulationWithPredictions } = require('../services/simulationService');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * Lists all simulations with pagination, filtering, and sorting
 * @param {Object} req - Express request object (with req.pagination and req.filters)
 * @param {Object} res - Express response object
 */
const listSimulations = asyncHandler(async (req, res) => {
        const { page, limit, skip } = req.pagination;
        const { email, sortBy, sortOrder } = req.filters;

        const query = {};
        if (email) {
            query.email = { $regex: email, $options: 'i' };
        }

        const sort = {};
        sort[sortBy] = sortOrder;

        const [total, simulations] = await Promise.all([
            Simulation.countDocuments(query),
            Simulation.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean()
        ]);

        const totalPages = Math.ceil(total / limit);

        res.render('admin/simulations', {
            title: 'Admin - All Simulations',
            simulations: simulations,
            filters: {
                email: email || '',
                sortBy,
                sortOrder: sortOrder === 1 ? 'asc' : 'desc'
            },
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                total: total,
                limit: limit,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
});

/**
 * Gets a single simulation by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSimulation = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const { simulation, predictions, datasetStats, hasNegativeIncome } = 
        await getSimulationWithPredictions(id);

    res.render('admin/simulation-detail', {
        title: `Simulation Details - ${simulation.email}`,
        simulation: simulation,
        predictions,
        datasetStats,
        hasNegativeIncome
    });
});

module.exports = {
    listSimulations,
    getSimulation
};

