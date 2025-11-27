const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for simulation submissions
 * Limits to 10 requests per 15 minutes per IP
 */
const simulationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many simulation requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false, 
});

/**
 * General API rate limiter
 * Limits to 100 requests per 15 minutes per IP
 */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    simulationLimiter,
    generalLimiter
};

