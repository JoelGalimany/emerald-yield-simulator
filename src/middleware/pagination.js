const { query, validationResult } = require('express-validator');
const { PAGINATION } = require('../config/constants');

/**
 * Middleware to validate and parse pagination query parameters
 */
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer')
        .toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: PAGINATION.MAX_LIMIT })
        .withMessage(`Limit must be between 1 and ${PAGINATION.MAX_LIMIT}`)
        .toInt()
];

/**
 * Middleware to parse and normalize pagination parameters
 */
function parsePagination(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).render('admin/simulations', {
            title: 'Admin - All Simulations',
            error: 'Invalid pagination parameters',
            simulations: [],
            pagination: {
                currentPage: PAGINATION.DEFAULT_PAGE,
                totalPages: 0,
                total: 0,
                limit: PAGINATION.DEFAULT_LIMIT,
                hasNext: false,
                hasPrev: false
            }
        });
    }

    const page = Math.max(1, parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    req.pagination = {
        page,
        limit,
        skip
    };

    next();
}

module.exports = {
    validatePagination,
    parsePagination
};

