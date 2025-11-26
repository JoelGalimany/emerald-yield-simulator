const { body, validationResult, matchedData } = require('express-validator');
const Simulation = require('../models/Simulation');
const { returnOverYears } = require('../services/calc');

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
        .isEmail().withMessage('Please provide a valid email address with proper format (e.g., user@example.com)').bail()
        .withMessage('Please provide a valid email address with proper format (e.g., user@example.com)')
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
            email: email.trim().toLowerCase(),
            results
        });

        await simulation.save();

        res.render('results', {
            title: 'Simulation Results',
            simulation: {
                purchasePrice,
                monthlyRent,
                annualFee,
                email,
                results
            },
        });
    } catch (error) {
        console.error('Error processing simulation:', error);
        res.render('index', {
            title: 'Emerald Yield Simulator',
            error: 'An error occurred while processing your simulation. Please try again.',
            formData: req.body
        });
    }
}

module.exports = {
    validateSimulation,
    processSimulation
};

