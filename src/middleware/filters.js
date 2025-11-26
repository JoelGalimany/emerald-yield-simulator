const { query } = require('express-validator');

/**
 * Validates filter query parameters
 */
const validateFilters = [
    query('email')
        .optional()
        .trim()
        .isLength({ min: 1, max: 254 })
        .withMessage('Email filter must be between 1 and 254 characters'),
    query('sortBy')
        .optional()
        .isIn(['createdAt', 'email', 'purchasePrice', 'monthlyRent', 'annualFee'])
        .withMessage('Invalid sort field'),
    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be "asc" or "desc"')
];

/**
 * Parses and normalizes filter parameters
 */
function parseFilters(req, res, next) {
    const emailFilter = req.query.email ? req.query.email.trim() : null;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    req.filters = {
        email: emailFilter,
        sortBy,
        sortOrder
    };

    next();
}

module.exports = {
    validateFilters,
    parseFilters
};

