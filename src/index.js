require('dotenv').config();
const http = require('http');
const app = require('./app');
const mongoose = require('mongoose');
const { initializeDataset } = require('./services/prediction');

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/emerald';

// MongoDB connection options
const mongoOptions = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
};

mongoose.connect(MONGO_URI, mongoOptions)
    .then(async () => {
        console.log(`✓ MongoDB connected successfully to ${MONGO_URI.replace(/\/\/.*@/, '//***@')}`);
        
        // Initialize dataset in background
        initializeDataset().catch(err => {
            console.error('Dataset initialization failed:', err.message);
        });
    })
    .catch((error) => {
        console.error('✗ MongoDB connection error:', error.message);
        process.exit(1);
    });

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
});

// Create HTTP server
const server = http.createServer(app);

// Start server
server.listen(PORT, () => {
    console.log(`✓ Server listening on http://localhost:${PORT}`);
    console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed');
            process.exit(0);
        });
    });
});
