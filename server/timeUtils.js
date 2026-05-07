/**
 * Time utility functions for lobby management
 * 
 * Centralizes the logic for calculating lobby expiration based on battle times.
 */

const DEFAULT_LIFESPAN = 24 * 60 * 60 * 1000; // 24 hours
const BATTLE_LIFESPAN_BUFFER = 12 * 60 * 60 * 1000; // 12 hours after battle time

/**
 * Calculates the deletion time for a lobby.
 * If a battleTime is provided, the lobby expires 12 hours after that time.
 * Otherwise, it defaults to 24 hours from now.
 * 
 * @param {string|null} battleTime - The scheduled ISO string for the battle.
 * @returns {number} The timestamp (ms) when the lobby should be deleted.
 */
function calculateDeletionTime(battleTime) {
    if (battleTime) {
        return new Date(battleTime).getTime() + BATTLE_LIFESPAN_BUFFER;
    }
    return Date.now() + DEFAULT_LIFESPAN;
}

module.exports = {
    calculateDeletionTime
};
