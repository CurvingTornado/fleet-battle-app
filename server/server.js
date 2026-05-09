const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const logger = require('./logger');
const LobbyManager = require('./LobbyManager');
const rosterHandler = require('./socketHandlers/rosterHandler');
const squadronHandler = require('./socketHandlers/squadronHandler');
const mapHandler = require('./socketHandlers/mapHandler');
const { initDiscordBot } = require('./discordBot');

/**
 * Guilliman's Fleet Command - Server
 * 
 * This server handles real-time coordination for fleet battles using Socket.io.
 * It manages room state including roster, squadrons, and tactical map data.
 */

const app = express();
app.use(cors());
app.use(express.json()); // Enable JSON parsing for log endpoint

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

// Initialize the Lobby Manager which handles state persistence and timers
const lobbyManager = new LobbyManager(io);

// Initialize Discord Bot
initDiscordBot(lobbyManager);

io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Register modular event handlers
    rosterHandler(io, socket, lobbyManager);
    squadronHandler(io, socket, lobbyManager);
    mapHandler(io, socket, lobbyManager);

    /**
     * Connection Management
     */
    socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id}`);
        if (socket.currentRoomId) {
            const room = lobbyManager.getRoom(socket.currentRoomId);
            if (room) {
                const player = room.roster.find(p => p.id === socket.currentPlayerId);
                if (player) {
                    player.status = 'offline'; // Mark player as offline instead of removing them
                    lobbyManager.saveState();
                    io.to(socket.currentRoomId).emit('roster-updated', room.roster);
                }
            }
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
    logger.info(`Tactical Server online on port ${PORT}`);
});