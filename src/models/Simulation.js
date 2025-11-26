const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    year: { type: Number, required: true, min: 1 },
    netMonthly: { type: Number, required: true },
    annualNet: { type: Number, required: true },
    roi: { type: Number, required: true }
}, { _id: false });

const simulationSchema = new mongoose.Schema({
    purchasePrice: { 
        type: Number, 
        required: true,
        min: 0.01
    },
    monthlyRent: { 
        type: Number, 
        required: true,
        min: 0
    },
    annualFee: { 
        type: Number, 
        required: true,
        min: 0
    },
    email: { 
        type: String, 
        required: true,
        lowercase: true,
        trim: true
    },
    results: {
        type: [resultSchema],
        required: true,
        validate: {
            validator: function(v) {
                return v && v.length > 0;
            },
            message: 'Results array cannot be empty'
        }
    },
    createdAt: { 
        type: Date, 
        default: Date.now,
        index: true
    }
}, {
    timestamps: false
});

simulationSchema.index({ email: 1, createdAt: -1 });

module.exports = mongoose.model('Simulation', simulationSchema);
