const logger = require('../utils/logger');

/**
 * Centralized error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, next) {
    logger.error('Request error', err, {
        path: req.path,
        method: req.method
    });

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const formattedErrors = Object.values(err.errors).map(error => ({
            path: error.path,
            msg: error.message
        }));
        return res.status(400).render('index', {
            title: 'Validation Error',
            errors: formattedErrors,
            formData: req.body
        });
    }

    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).render('404', {
            title: 'Invalid ID',
            error: 'The provided ID is not valid.'
        });
    }

    // MongoDB duplicate key error
    if (err.code === 11000) {
        return res.status(400).render('index', {
            title: 'Duplicate Entry',
            error: 'This record already exists.',
            formData: req.body
        });
    }

    // Default error response
    const statusCode = err.statusCode || 500;
    const isAdminRoute = req.path.startsWith('/admin');
    
    if (isAdminRoute) {
        return res.status(statusCode).render('404', {
            title: 'Error',
            message: err.message || 'An error occurred. Please try again later.'
        });
    }

    res.status(statusCode).render('index', {
        title: 'Emerald Yield Simulator',
        error: err.message || 'An error occurred. Please try again.'
    });
}

module.exports = errorHandler;

