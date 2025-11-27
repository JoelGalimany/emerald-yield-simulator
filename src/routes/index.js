const express = require('express');
const router = express.Router();
const { validateSimulation, processSimulation, showResults } = require('../controllers/simulationController');
const { simulationLimiter } = require('../middleware/rateLimiter');

router.get('/', (req, res) => {
    res.render('index', { title: 'Emerald Yield Simulator' });
});

router.post('/simulate', simulationLimiter, validateSimulation, processSimulation);
router.get('/results/:id', showResults);

module.exports = router;
