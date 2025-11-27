/**
 * Wraps async route handlers to catch errors automatically
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped function that catches errors
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = asyncHandler;

