const { body, validationResult, matchedData } = require('express-validator');
const Simulation = require('../models/Simulation');
const { returnOverYears } = require('../services/calc');
const { getSimulationWithPredictions, formatSimulationForView } = require('../services/simulationService');
const asyncHandler = require('../middleware/asyncHandler');

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
const processSimulation = asyncHandler(async (req, res) => {
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
});

/**
 * Displays simulation results by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const showResults = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const { simulation, predictions, datasetStats, hasNegativeIncome } = 
        await getSimulationWithPredictions(id);

    res.render('results', {
        title: 'Simulation Results',
        simulation: formatSimulationForView(simulation),
        predictions,
        datasetStats,
        hasNegativeIncome
    });
});

module.exports = {
    validateSimulation,
    processSimulation,
    showResults
};

