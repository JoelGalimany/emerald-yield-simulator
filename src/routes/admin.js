const express = require('express');
const router = express.Router();
const { listSimulations, getSimulation } = require('../controllers/adminController');

router.get('/simulations', listSimulations);
router.get('/simulations/:id', getSimulation);

module.exports = router;

