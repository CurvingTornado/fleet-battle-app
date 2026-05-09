const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const timeUtils = require('./timeUtils');

const DATA_DIR = path.join(__dirname, 'data');
const LOBBIES_FILE = path.join(DATA_DIR, 'lobbies.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * LobbyManager Class
 * 
 * Centralized manager for handling all multiplayer room (lobby) state.
 * Features:
 * - Creates and manages active lobbies in memory.
 * - Persists lobby state to a local JSON file (`lobbies.json`) to survive server restarts.
 * - Handles automatic cleanup of expired lobbies using exact `setTimeout` timers.
 */
class LobbyManager {
    /**
     * Initializes the LobbyManager and restores any persisted state.
     * @param {import('socket.io').Server} io - The Socket.io server instance to broadcast events.
     */
    constructor(io) {
        this.io = io;
        /** @type {Object.<string, Object>} In-memory dictionary of active rooms */
        this.rooms = {};
        /** @type {Object.<string, NodeJS.Timeout>} Dictionary of active deletion timers */
        this.deletionTimers = {};
        /** @type {NodeJS.Timeout|null} Debounce timer for saving state */
        this.saveTimer = null;
        
        // Restore state from disk immediately upon instantiation
        this.loadState();
    }

    /**
     * Returns the default tactical squadron configuration for a new room.
     * @returns {Object} A fresh dictionary of default squadrons.
     */
    getDefaultSquadrons() {
        return {
            "Vanguard": { name: "Vanguard", active: true, formation: "Line Ahead", players: [] },
            "Center/Main Body": { name: "Center/Main Body", active: true, formation: "Line Ahead", players: [] },
            "Rear": { name: "Rear", active: true, formation: "Line Ahead", players: [] },
            "Screen": { name: "Screen", active: true, formation: "Line Ahead", players: [] },
            "Reserve": { name: "Reserve", active: true, formation: "Line Ahead", players: [] }
        };
    }

    /**
     * Creates a new lobby room if it does not already exist.
     * @param {string} roomId - The unique token/ID for the room.
     * @param {string} commanderId - The dogtag ID of the player who created the room.
     * @param {string} name - The human-readable name of the commander.
     */
    createRoom(roomId, commanderId, name) {
        if (!this.rooms[roomId]) {
            this.rooms[roomId] = {
                lobbyName: "",
                commanderId: commanderId,
                commanderName: name || "Unknown",
                roster: [],
                squadrons: this.getDefaultSquadrons(),
                currentMap: 'Devios',
                markers: [],
                lines: [],
                squadronPositions: {},
                battleTime: null,
                discordApplicants: [],
                deletionTime: timeUtils.calculateDeletionTime(null)
            };
            this.scheduleDeletion(roomId);
            this.saveState(); // Persist immediately after creation
        }
    }

    /**
     * Retrieves the current state of a specific room.
     * @param {string} roomId - The unique token/ID for the room.
     * @returns {Object|undefined} The room state object, or undefined if it doesn't exist.
     */
    getRoom(roomId) {
        const room = this.rooms[roomId];
        if (!room) {
            logger.warn(`LOBBY: Room lookup failed for ID: ${roomId}. Active rooms: ${Object.keys(this.rooms).join(', ')}`);
        }
        return room;
    }

    /**
     * Serializes and saves the current state of all rooms to `data/lobbies.json`.
     * Called automatically after any state mutation.
     * Uses a debounced asynchronous write to avoid blocking the event loop.
     */
    saveState() {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
        }
        this.saveTimer = setTimeout(() => {
            try {
                const data = JSON.stringify(this.rooms, null, 2);
                fs.writeFile(LOBBIES_FILE, data, 'utf8', (error) => {
                    if (error) {
                        logger.error(`Failed to save lobbies state asynchronously: ${error.message}`);
                    }
                });
            } catch (error) {
                logger.error(`Failed to serialize lobbies state: ${error.message}`);
            }
        }, 2000); // 2-second debounce
    }

    /**
     * Reads the `data/lobbies.json` file and restores all lobbies into memory.
     * Also restarts the deletion timers for any lobbies that are still valid.
     */
    loadState() {
        if (fs.existsSync(LOBBIES_FILE)) {
            try {
                const data = fs.readFileSync(LOBBIES_FILE, 'utf8');
                this.rooms = JSON.parse(data);
                logger.info(`Loaded ${Object.keys(this.rooms).length} lobbies from storage.`);

                // Re-schedule timers for all loaded rooms
                const now = Date.now();
                for (const roomId in this.rooms) {
                    const room = this.rooms[roomId];
                    // Clean up players' online status on restart to prevent ghost connections
                    room.roster.forEach(p => p.status = 'offline');

                    if (now > room.deletionTime) {
                        // The lobby expired while the server was offline
                        this.deleteRoom(roomId);
                    } else {
                        // The lobby is still valid, resume its timer
                        this.scheduleDeletion(roomId);
                    }
                }
            } catch (error) {
                logger.error(`Failed to load lobbies state: ${error.message}`);
                this.rooms = {};
            }
        }
    }

    /**
     * Updates the scheduled battle time for a room and reschedules its deletion timer.
     * @param {string} roomId - The unique token/ID for the room.
     * @param {string|null} battleTime - The ISO datetime string for the battle, or null.
     */
    updateBattleTime(roomId, battleTime) {
        const room = this.getRoom(roomId);
        if (room) {
            room.battleTime = battleTime;
            room.deletionTime = timeUtils.calculateDeletionTime(battleTime);
            this.scheduleDeletion(roomId);
            this.saveState();
        }
    }

    /**
     * Adds a discord applicant to a specific room.
     */
    addDiscordApplicant(roomId, user) {
        const room = this.getRoom(roomId);
        if (room) {
            if (!room.discordApplicants) room.discordApplicants = [];
            const exists = room.discordApplicants.find(a => a.id === user.id);
            if (!exists) {
                room.discordApplicants.push(user);
                this.saveState();
                if (this.io) {
                    this.io.to(roomId).emit('discord-applicants-updated', room.discordApplicants);
                }
            }
        }
    }

    /**
     * Removes a discord applicant from a specific room.
     */
    removeDiscordApplicant(roomId, userId) {
        const room = this.getRoom(roomId);
        if (room) {
            if (!room.discordApplicants) room.discordApplicants = [];
            room.discordApplicants = room.discordApplicants.filter(a => a.id !== userId);
            this.saveState();
            if (this.io) {
                this.io.to(roomId).emit('discord-applicants-updated', room.discordApplicants);
            }
        }
    }

    /**
     * Schedules a precise `setTimeout` to automatically delete a room at its designated expiration time.
     * Clears any existing timer for the room before setting a new one.
     * @param {string} roomId - The unique token/ID for the room.
     */
    scheduleDeletion(roomId) {
        // Clear any existing timer to prevent duplicate triggers
        if (this.deletionTimers[roomId]) {
            clearTimeout(this.deletionTimers[roomId]);
        }

        const room = this.getRoom(roomId);
        if (!room) return;

        const delay = Math.max(0, room.deletionTime - Date.now());
        
        // Node's setTimeout max limit is 2147483647 ms (~24.8 days).
        // Since our max lifespan is 24h, we're well within limits.
        this.deletionTimers[roomId] = setTimeout(() => {
            this.deleteRoom(roomId);
        }, delay);
    }

    /**
     * Completely removes a room from memory, broadcasts closure to any connected clients, 
     * clears its timer, and saves the updated state to disk.
     * @param {string} roomId - The unique token/ID for the room.
     */
    deleteRoom(roomId) {
        if (this.rooms[roomId]) {
            logger.info(`SYSTEM: Deleting expired lobby ${roomId}`);
            if (this.io) {
                // Inform remaining clients they have been kicked due to closure
                this.io.to(roomId).emit('lobby-closed');
                // Drop all sockets from the room channel
                this.io.in(roomId).socketsLeave(roomId);
            }
            if (this.onRoomDeleted) {
                this.onRoomDeleted(this.rooms[roomId]);
            }
            delete this.rooms[roomId];
            
            if (this.deletionTimers[roomId]) {
                clearTimeout(this.deletionTimers[roomId]);
                delete this.deletionTimers[roomId];
            }
            this.saveState();
        }
    }
}

module.exports = LobbyManager;
