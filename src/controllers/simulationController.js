const { body, validationResult, matchedData } = require('express-validator');
const Simulation = require('../models/Simulation');
const { returnOverYears } = require('../services/calc');
const { predictReturnOverYears, getDatasetStats } = require('../services/prediction');

/**
 * Validation of the form fields
 */
const validateSimulation = [
    body('purchasePrice')
        .trim()
        .notEmpty().withMessage('Purchase price is required').bail()
        .isFloat({ min: 0.01 }).withMessage('Purchase price must be greater than 0')
        .toFloat(),
    body('monthlyRent')
        .trim()
        .notEmpty().withMessage('Monthly rent is required').bail()
        .isFloat({ min: 0 }).withMessage('Monthly rent must be 0 or greater')
        .toFloat(),
    body('annualFee')
        .trim()
        .notEmpty().withMessage('Annual fee is required').bail()
        .isFloat({ min: 0 }).withMessage('Annual fee must be 0 or greater')
        .toFloat(),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required').bail()
        .isLength({ min: 5, max: 254 }).withMessage('Email must be between 5 and 254 characters').bail()
        .isEmail().withMessage('Please provide a valid email address with proper format (e.g., user@example.com)')
        .normalizeEmail(),
];

/**
 * Processes the simulation and saves the results
 */
async function processSimulation(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(err => ({
            path: err.param,
            msg: err.msg
        }));
        return res.render('index', {
            title: 'Emerald Yield Simulator',
            errors: formattedErrors,
            formData: req.body
        });
    }

    try {
        const { purchasePrice, monthlyRent, annualFee, email } = matchedData(req);

        const results = returnOverYears(purchasePrice, monthlyRent, annualFee, 3);

        const simulation = new Simulation({
            purchasePrice,
            monthlyRent,
            annualFee,
            email: email.toLowerCase().trim(),
            results
        });

        await simulation.save();

        return res.redirect(`/results/${simulation._id}`);
    } catch (error) {
        console.error('Error processing simulation:', error);
        
        if (error.name === 'ValidationError') {
            const formattedErrors = Object.values(error.errors).map(err => ({
                path: err.path,
                msg: err.message
            }));
            return res.render('index', {
                title: 'Emerald Yield Simulator',
                errors: formattedErrors,
                formData: req.body
            });
        }

        res.render('index', {
            title: 'Emerald Yield Simulator',
            error: 'An error occurred while processing your simulation. Please try again.',
            formData: req.body
        });
    }
}

/**
 * Displays simulation results by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function showResults(req, res) {
    try {
        const { id } = req.params;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(404).render('404', {
                title: 'Simulation Not Found',
                error: 'Invalid simulation ID'
            });
        }

        const simulation = await Simulation.findById(id).lean();

        if (!simulation) {
            return res.status(404).render('404', {
                title: 'Simulation Not Found',
                error: 'The requested simulation could not be found'
            });
        }

        const hasNegativeIncome = simulation.results.some(r => r.netMonthly < 0 || r.annualNet < 0);

        const predictions = await predictReturnOverYears(
            simulation.purchasePrice,
            simulation.monthlyRent,
            simulation.annualFee,
            3
        );
        
        const datasetStats = await getDatasetStats();

        res.render('results', {
            title: 'Simulation Results',
            simulation: {
                purchasePrice: simulation.purchasePrice,
                monthlyRent: simulation.monthlyRent,
                annualFee: simulation.annualFee,
                email: simulation.email,
                results: simulation.results
            },
            predictions: predictions,
            datasetStats: datasetStats,
            hasNegativeIncome
        });
    } catch (error) {
        console.error('Error fetching simulation:', error);
        res.status(500).render('index', {
            title: 'Emerald Yield Simulator',
            error: 'An error occurred while loading the simulation results. Please try again.'
        });
    }
}

module.exports = {
    validateSimulation,
    processSimulation,
    showResults
};

