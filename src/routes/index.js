const express = require('express');
const router = express.Router();
const { validateSimulation, processSimulation, showResults } = require('../controllers/simulationController');

router.get('/', (req, res) => {
    res.render('index', { title: 'Emerald Yield Simulator' });
});

router.post('/simulate', validateSimulation, processSimulation);
router.get('/results/:id', showResults);

module.exports = router;
