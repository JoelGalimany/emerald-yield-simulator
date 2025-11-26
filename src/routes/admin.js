const express = require('express');
const router = express.Router();
const { listSimulations, getSimulation } = require('../controllers/adminController');
const { validatePagination, parsePagination } = require('../middleware/pagination');
const { validateFilters, parseFilters } = require('../middleware/filters');

// Admin routes
router.get('/simulations', 
    validatePagination,
    validateFilters,
    parsePagination,
    parseFilters,
    listSimulations
);
router.get('/simulations/:id', getSimulation);

module.exports = router;

