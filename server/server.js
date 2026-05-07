const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

/**
 * Guilliman's Fleet Command - Server
 * 
 * This server handles real-time coordination for fleet battles using Socket.io.
 * It manages room state including roster, squadrons, and tactical map data.
 */

const app = express();
app.use(cors());
app.use(express.json()); // Enable JSON parsing for log endpoint
const logger = require('./logger');

/**
 * Endpoint for receiving and logging client-side errors
 */
app.post('/api/log-client-error', (req, res) => {
    logger.clientError(req.body);
    res.status(200).send('Log received');
});

const server = http.createServer(app);

// Environment-based frontend URL configuration
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const io = new Server(server, {
    cors: { 
        origin: frontendUrl, 
        methods: ["GET", "POST"] 
    }
});

// In-memory storage for active rooms.
// In a production environment, this would ideally be moved to a database or Redis.
let rooms = {};

// Standard squadron configuration for new rooms.
const defaultSquadrons = {
    "Vanguard": { name: "Vanguard", active: true, formation: "Line Ahead", players: [] },
    "Center/Main Body": { name: "Center/Main Body", active: true, formation: "Line Ahead", players: [] },
    "Rear": { name: "Rear", active: true, formation: "Line Ahead", players: [] },
    "Screen": { name: "Screen", active: true, formation: "Line Ahead", players: [] },
    "Reserve": { name: "Reserve", active: true, formation: "Line Ahead", players: [] }
};

io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);
    // Track the room and player for this specific socket connection,
    // used during disconnect to update status without needing room/player IDs from the client.
    let currentRoomId = null;
    let currentPlayerId = null;

    /**
     * Join Room Handler
     * Initializes room state if it doesn't exist and adds the player to the roster.
     */
    socket.on('join-room', (payload) => {
        const { roomId, name, tag, playerId } = payload;
        
        socket.join(roomId); // Join the socket to the specified room.
        currentRoomId = roomId;
        currentPlayerId = playerId;

        if (!rooms[roomId]) {
            logger.info(`LOBBY: Initializing new room: ${roomId} by ${name}`);
            // Deep clone defaultSquadrons to ensure each room gets its own independent copy
            rooms[roomId] = { 
                lobbyName: "",
                commanderId: playerId, // First player to join/create becomes the Commander
                roster: [], 
                squadrons: JSON.parse(JSON.stringify(defaultSquadrons)),
                currentMap: 'Devios',
                markers: [],
                lines: [],
                squadronPositions: {}
            };
        }

        // Check if player already exists in the roster (e.g., on reconnect)
        const existingPlayer = rooms[roomId].roster.find(p => p.id === playerId);
        if (!existingPlayer) {
            // First time joining: add a fresh player entry to the roster
            rooms[roomId].roster.push({ 
                id: playerId, name: name || "Unknown", tag: tag || "", status: 'online', 
                offers: [], ship: '', selected: false, role: 'Member'
            });
        } else {
            // Reconnecting player: update status and any name/tag changes
            existingPlayer.status = 'online';
            existingPlayer.name = name || existingPlayer.name; 
            existingPlayer.tag = tag || existingPlayer.tag; 
        }

        logger.info(`LOBBY: Player ${name} joined Room: ${roomId}`);

        // Send current room state back to the joining player
        socket.emit('room-joined', { 
            isCommander: playerId === rooms[roomId].commanderId, 
            commanderId: rooms[roomId].commanderId,
            lobbyName: rooms[roomId].lobbyName 
        });
        
        // Broadcast updated state to all players in the room
        io.to(roomId).emit('roster-updated', rooms[roomId].roster);
        io.to(roomId).emit('squadrons-updated', rooms[roomId].squadrons);
        io.to(roomId).emit('map-updated', rooms[roomId].currentMap);
        
        // Send existing map markers and lines to the new player
        // (emitted only to the joining socket, not broadcast to the whole room)
        rooms[roomId].markers.forEach(marker => socket.emit('marker-added', marker));
        socket.emit('lines-updated', rooms[roomId].lines);
        socket.emit('squadron-positions-updated', rooms[roomId].squadronPositions);
    });

    /**
     * Roster Management
     */
    socket.on('toggle-selection', ({ roomId, playerId }) => {
        // Handles toggling a player's 'Deploying' (selected) status for the commander.
        if (rooms[roomId]) {
            const player = rooms[roomId].roster.find(p => p.id === playerId);
            if (player) {
                player.selected = !player.selected;
                io.to(roomId).emit('roster-updated', rooms[roomId].roster);
            }
        }
    });

    socket.on('update-offers', ({ roomId, playerId, offers }) => {
        // Updates a player's list of ships they are willing to bring to the battle.
        if (rooms[roomId]) {
            const player = rooms[roomId].roster.find(p => p.id === playerId);
            if (player) {
                player.offers = offers;
                io.to(roomId).emit('roster-updated', rooms[roomId].roster);
            }
        }
    });

    socket.on('commander-assign-ship', ({ roomId, playerId, ship }) => {
        // Assigns a confirmed ship to a player, typically set by the commander.
        if (rooms[roomId]) {
            const player = rooms[roomId].roster.find(p => p.id === playerId);
            if (player) {
                player.ship = ship;
                io.to(roomId).emit('roster-updated', rooms[roomId].roster);
            }
        }
    });

    socket.on('update-role', ({ roomId, playerId, role }) => {
        // Updates a player's tactical role (e.g., 'Member', 'Squadron Lead', 'Commander').
        if (rooms[roomId]) {
            const player = rooms[roomId].roster.find(p => p.id === playerId);
            if (player) {
                player.role = role;
                io.to(roomId).emit('roster-updated', rooms[roomId].roster);
            }
        }
    });

    /**
     * Squadron Management
     */
    socket.on('update-squadrons', ({ roomId, newState }) => {
        // Replaces the entire squadron configuration (handles formations, activation, and rosters).
        if (rooms[roomId]) {
            rooms[roomId].squadrons = newState;
            io.to(roomId).emit('squadrons-updated', newState);
        }
    });

    socket.on('update-lobby-name', ({ roomId, name }) => {
        // Updates the lobby's human-readable display name.
        if (rooms[roomId]) {
            rooms[roomId].lobbyName = name;
            io.to(roomId).emit('lobby-name-updated', name);
        }
    });

    /**
     * Tactical Map Events
     */
    socket.on('change-map', ({ roomId, mapName }) => {
        // Changes the active theater/map background for the entire room.
        if (rooms[roomId]) {
            rooms[roomId].currentMap = mapName;
            io.to(roomId).emit('map-updated', mapName);
        }
    });

    socket.on('add-marker', ({ roomId, markerData }) => {
        // Adds a ping marker to the tactical map (visible to all players in the room).
        if (rooms[roomId]) {
            rooms[roomId].markers.push(markerData);
            io.to(roomId).emit('marker-added', markerData);
        }
    });

    socket.on('delete-marker', ({ roomId, markerId }) => {
        // Removes a ping marker from the tactical map by ID.
        if (rooms[roomId]) {
            rooms[roomId].markers = rooms[roomId].markers.filter(m => m.id !== markerId);
            io.to(roomId).emit('marker-removed', markerId);
        }
    });

    socket.on('add-line', ({ roomId, line }) => {
        // Adds a freehand drawn line to the tactical map (commander only on client).
        if (rooms[roomId]) {
            rooms[roomId].lines.push(line);
            io.to(roomId).emit('lines-updated', rooms[roomId].lines);
        }
    });

    socket.on('delete-line', ({ roomId, lineId }) => {
        // Removes a line from the tactical map by ID (via eraser tool).
        if (rooms[roomId]) {
            rooms[roomId].lines = rooms[roomId].lines.filter(l => l.id !== lineId);
            io.to(roomId).emit('lines-updated', rooms[roomId].lines);
        }
    });

    socket.on('update-squadron-position', ({ roomId, sqKey, position }) => {
        // Updates the draggable squadron label position on the tactical map.
        if (rooms[roomId]) {
            rooms[roomId].squadronPositions[sqKey] = position;
            io.to(roomId).emit('squadron-positions-updated', rooms[roomId].squadronPositions);
        }
    });

    socket.on('clear-board', (roomId) => {
        // Wipes all markers and lines from the tactical map (commander only on client).
        if (rooms[roomId]) {
            rooms[roomId].markers = [];
            rooms[roomId].lines = [];
            io.to(roomId).emit('board-cleared');
            // Also emit lines-updated with empty array to ensure client state is fully cleared
            io.to(roomId).emit('lines-updated', []);
        }
    });

    /**
     * Connection Management
     */
    socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id}`);
        if (currentRoomId && rooms[currentRoomId]) {
            const player = rooms[currentRoomId].roster.find(p => p.id === currentPlayerId);
            if (player) {
                player.status = 'offline'; // Mark player as offline instead of removing them
                io.to(currentRoomId).emit('roster-updated', rooms[currentRoomId].roster);
            }
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
    logger.info(`Tactical Server online on port ${PORT}`);
});