/**
 * Simple logger utility
 * In production, this could be replaced with winston, pino, etc.
 */

const isDevelopment = process.env.NODE_ENV === 'development';

const logger = {
    info: (message, ...args) => {
        if (isDevelopment) {
            console.log(`[INFO] ${message}`, ...args);
        }
    },
    
    warn: (message, ...args) => {
        console.warn(`[WARN] ${message}`, ...args);
    },
    
    error: (message, error, ...args) => {
        const errorInfo = error instanceof Error 
            ? { message: error.message, stack: isDevelopment ? error.stack : undefined }
            : error;
        console.error(`[ERROR] ${message}`, errorInfo, ...args);
    },
    
    debug: (message, ...args) => {
        if (isDevelopment) {
            console.log(`[DEBUG] ${message}`, ...args);
        }
    }
};

module.exports = logger;

