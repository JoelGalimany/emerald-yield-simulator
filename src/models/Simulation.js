const mongoose = require('mongoose');

const simulationSchema = new mongoose.Schema({
    purchasePrice: { type: Number, required: true },
    monthlyRent: { type: Number, required: true },
    annualFee: { type: Number, required: true },
    email: { type: String, required: true },
    results: [{
        year: Number,
        netMonthly: Number,
        annualNet: Number,
        roi: Number
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Simulation', simulationSchema);
