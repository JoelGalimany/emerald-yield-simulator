require('dotenv').config();
const http = require('http');
const app = require('./app');
const mongoose = require('mongoose');
const { initializeDataset } = require('./services/prediction');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/emerald';

// MongoDB connection options
const mongoOptions = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
};

mongoose.connect(MONGO_URI, mongoOptions)
    .then(async () => {
        logger.info(`MongoDB connected successfully to ${MONGO_URI.replace(/\/\/.*@/, '//***@')}`);
        
        // Initialize dataset in background
        initializeDataset().catch(err => {
            logger.error('Dataset initialization failed', err);
        });
    })
    .catch((error) => {
        logger.error('MongoDB connection error', error);
        process.exit(1);
    });

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error', err);
});

mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
});

// Create HTTP server
const server = http.createServer(app);

// Start server
server.listen(PORT, () => {
    logger.info(`Server listening on http://localhost:${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', reason instanceof Error ? reason : new Error(String(reason)), { promise });
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
        mongoose.connection.close(false, () => {
            logger.info('MongoDB connection closed');
            process.exit(0);
        });
    });
});
