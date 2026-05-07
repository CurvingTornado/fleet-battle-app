/**
 * Client-side Tactical Logger
 * Captures errors and significant events to send to the server
 */

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const TacticalLogger = {
    /**
     * Send an error report to the server
     */
    logError: async (error, context = {}) => {
        try {
            const errorData = {
                message: error.message || error,
                stack: error.stack,
                context,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent
            };

            console.error('[TacticalLogger] Captured Error:', errorData);

            await fetch(`${API_URL}/api/log-client-error`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(errorData)
            });
        } catch (e) {
            console.error('[TacticalLogger] Failed to send log to server:', e);
        }
    },

    /**
     * Log a significant event (non-error)
     */
    logEvent: (event, details = {}) => {
        console.log(`[TacticalEvent] ${event}`, details);
        // Optionally send important events to server too
    }
};

/**
 * Initialize global error listeners
 */
export const initGlobalLogging = () => {
    window.onerror = (message, source, lineno, colno, error) => {
        TacticalLogger.logError(error || message, { source, lineno, colno });
    };

    window.onunhandledrejection = (event) => {
        TacticalLogger.logError(event.reason, { type: 'unhandled_rejection' });
    };
};

export default TacticalLogger;
