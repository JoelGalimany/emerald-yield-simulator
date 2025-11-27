/**
 * Validates MongoDB ObjectId format
 * @param {string} id - ID to validate
 * @returns {boolean} True if valid ObjectId format
 */
function isValidObjectId(id) {
    return id && /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Validates MongoDB ObjectId and throws error if invalid
 * @param {string} id - ID to validate
 * @throws {Error} If ID is not valid
 */
function validateObjectId(id) {
    if (!isValidObjectId(id)) {
        const error = new Error('Invalid ID format');
        error.statusCode = 400;
        throw error;
    }
}

module.exports = {
    isValidObjectId,
    validateObjectId
};

