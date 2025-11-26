const Simulation = require('../models/Simulation');

/**
 * Lists all simulations with pagination
 */
async function listSimulations(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const total = await Simulation.countDocuments();

        const simulations = await Simulation.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const totalPages = Math.ceil(total / limit);

        res.render('admin/simulations', {
            title: 'Admin - All Simulations',
            simulations: simulations,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                total: total,
                limit: limit,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Error listing simulations:', error);
        res.render('admin/simulations', {
            title: 'Admin - All Simulations',
            error: 'An error occurred while loading simulations.',
            simulations: [],
            pagination: {
                currentPage: 1,
                totalPages: 0,
                total: 0,
                limit: 20,
                hasNext: false,
                hasPrev: false
            }
        });
    }
}

/**
 * Gets a single simulation by ID
 */
async function getSimulation(req, res) {
    try {
        const simulation = await Simulation.findById(req.params.id).lean();

        if (!simulation) {
            return res.status(404).render('404', {
                title: 'Simulation Not Found'
            });
        }

        res.render('admin/simulation-detail', {
            title: `Simulation Details - ${simulation.email}`,
            simulation: simulation
        });
    } catch (error) {
        console.error('Error getting simulation:', error);
        res.status(500).render('404', {
            title: 'Error'
        });
    }
}

module.exports = {
    listSimulations,
    getSimulation
};

