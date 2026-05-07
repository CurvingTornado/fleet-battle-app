const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, 'logs');
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR);
}

const serverLogPath = path.join(LOG_DIR, 'server_activity.log');
const clientLogPath = path.join(LOG_DIR, 'client_errors.log');

/**
 * Tactical Logger Utility
 */
const logger = {
    /**
     * Log a server-side event
     */
    info: (message, context = '') => {
        const timestamp = new Date().toISOString();
        const logLine = `[${timestamp}] INFO: ${message} ${context ? JSON.stringify(context) : ''}\n`;
        console.log(logLine.trim());
        fs.appendFileSync(serverLogPath, logLine);
    },

    /**
     * Log a server-side error
     */
    error: (message, error = null) => {
        const timestamp = new Date().toISOString();
        const errorStack = error ? (error.stack || error) : '';
        const logLine = `[${timestamp}] ERROR: ${message}\n${errorStack}\n`;
        console.error(logLine.trim());
        fs.appendFileSync(serverLogPath, logLine);
    },

    /**
     * Log an error received from the client
     */
    clientError: (errorData) => {
        const timestamp = new Date().toISOString();
        const logLine = `[${timestamp}] CLIENT_ERROR: ${JSON.stringify(errorData, null, 2)}\n---\n`;
        fs.appendFileSync(clientLogPath, logLine);
    }
};

module.exports = logger;
