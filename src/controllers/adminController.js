const Simulation = require('../models/Simulation');
const { PAGINATION } = require('../config/constants');

const { DEFAULT_PAGE, DEFAULT_LIMIT } = PAGINATION;

/**
 * Lists all simulations with pagination, filtering, and sorting
 * @param {Object} req - Express request object (with req.pagination and req.filters)
 * @param {Object} res - Express response object
 */
async function listSimulations(req, res) {
    try {
        const { page, limit, skip } = req.pagination;
        const { email, sortBy, sortOrder } = req.filters;

        // Build query
        const query = {};
        if (email) {
            query.email = { $regex: email, $options: 'i' }; // Case-insensitive search
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder;

        // Get total count and simulations in parallel for better performance
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
    } catch (error) {
        console.error('Error listing simulations:', error);
        res.render('admin/simulations', {
            title: 'Admin - All Simulations',
            error: 'An error occurred while loading simulations. Please try again later.',
            simulations: [],
            filters: {
                email: '',
                sortBy: 'createdAt',
                sortOrder: 'desc'
            },
            pagination: {
                currentPage: DEFAULT_PAGE,
                totalPages: 0,
                total: 0,
                limit: DEFAULT_LIMIT,
                hasNext: false,
                hasPrev: false
            }
        });
    }
}

/**
 * Gets a single simulation by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getSimulation(req, res) {
    try {
        const { id } = req.params;

        // Validate MongoDB ObjectId format
        if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
            return res.status(400).render('404', {
                title: 'Invalid Simulation ID'
            });
        }

        const simulation = await Simulation.findById(id).lean();

        if (!simulation) {
            return res.status(404).render('404', {
                title: 'Simulation Not Found',
                message: 'The requested simulation could not be found.'
            });
        }

        res.render('admin/simulation-detail', {
            title: `Simulation Details - ${simulation.email}`,
            simulation: simulation
        });
    } catch (error) {
        console.error('Error getting simulation:', error);
        
        // Handle specific MongoDB errors
        if (error.name === 'CastError') {
            return res.status(400).render('404', {
                title: 'Invalid Simulation ID',
                message: 'The provided simulation ID is not valid.'
            });
        }

        res.status(500).render('404', {
            title: 'Error',
            message: 'An error occurred while loading the simulation. Please try again later.'
        });
    }
}

module.exports = {
    listSimulations,
    getSimulation
};

