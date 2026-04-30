const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const io = new Server(server, {
    cors: { 
        origin: frontendUrl, 
        methods: ["GET", "POST"] 
    }
});

let rooms = {};

const defaultSquadrons = {
    "Vanguard": { name: "Vanguard", active: true, formation: "Line Ahead", players: [] },
    "Center/Main Body": { name: "Center/Main Body", active: true, formation: "Line Ahead", players: [] },
    "Rear": { name: "Rear", active: true, formation: "Line Ahead", players: [] },
    "Screen": { name: "Screen", active: true, formation: "Line Ahead", players: [] },
    "Reserve": { name: "Reserve", active: true, formation: "Line Ahead", players: [] }
};

io.on('connection', (socket) => {
    let currentRoomId = null;
    let currentPlayerId = null;

    // SPRINT 2 FIX: Using an object payload to prevent argument shifting
    socket.on('join-room', (payload) => {
        const { roomId, name, tag, playerId } = payload;
        
        socket.join(roomId);
        currentRoomId = roomId;
        currentPlayerId = playerId;

        if (!rooms[roomId]) {
            rooms[roomId] = { 
                lobbyName: "",
                commanderId: playerId,
                roster: [], 
                squadrons: JSON.parse(JSON.stringify(defaultSquadrons)),
                currentMap: 'devios',
                markers: [],
                lines: [],
                squadronPositions: {}
            };
        }

        const existingPlayer = rooms[roomId].roster.find(p => p.id === playerId);
        if (!existingPlayer) {
            rooms[roomId].roster.push({ 
                id: playerId, name: name || "Unknown", tag: tag || "", status: 'online', 
                offers: [], ship: '', selected: false, role: 'Member'
            });
        } else {
            existingPlayer.status = 'online';
            existingPlayer.name = name || existingPlayer.name; 
            existingPlayer.tag = tag || existingPlayer.tag; 
        }

        socket.emit('room-joined', { 
            isCommander: playerId === rooms[roomId].commanderId, 
            commanderId: rooms[roomId].commanderId,
            lobbyName: rooms[roomId].lobbyName 
        });
        io.to(roomId).emit('roster-updated', rooms[roomId].roster);
        io.to(roomId).emit('squadrons-updated', rooms[roomId].squadrons);
        io.to(roomId).emit('map-updated', rooms[roomId].currentMap);
        
        rooms[roomId].markers.forEach(marker => socket.emit('marker-added', marker));
        socket.emit('lines-updated', rooms[roomId].lines);
        socket.emit('squadron-positions-updated', rooms[roomId].squadronPositions);
    });

    socket.on('toggle-selection', ({ roomId, playerId }) => {
        if (rooms[roomId]) {
            const player = rooms[roomId].roster.find(p => p.id === playerId);
            if (player) {
                player.selected = !player.selected;
                io.to(roomId).emit('roster-updated', rooms[roomId].roster);
            }
        }
    });

    socket.on('update-offers', ({ roomId, playerId, offers }) => {
        if (rooms[roomId]) {
            const player = rooms[roomId].roster.find(p => p.id === playerId);
            if (player) {
                player.offers = offers;
                io.to(roomId).emit('roster-updated', rooms[roomId].roster);
            }
        }
    });

    socket.on('commander-assign-ship', ({ roomId, playerId, ship }) => {
        if (rooms[roomId]) {
            const player = rooms[roomId].roster.find(p => p.id === playerId);
            if (player) {
                player.ship = ship;
                io.to(roomId).emit('roster-updated', rooms[roomId].roster);
            }
        }
    });

    socket.on('update-role', ({ roomId, playerId, role }) => {
        if (rooms[roomId]) {
            const player = rooms[roomId].roster.find(p => p.id === playerId);
            if (player) {
                player.role = role;
                io.to(roomId).emit('roster-updated', rooms[roomId].roster);
            }
        }
    });

    socket.on('update-squadrons', ({ roomId, newState }) => {
        if (rooms[roomId]) {
            rooms[roomId].squadrons = newState;
            io.to(roomId).emit('squadrons-updated', newState);
        }
    });

    socket.on('update-lobby-name', ({ roomId, name }) => {
        if (rooms[roomId]) {
            rooms[roomId].lobbyName = name;
            io.to(roomId).emit('lobby-name-updated', name);
        }
    });

    socket.on('change-map', ({ roomId, mapName }) => {
        if (rooms[roomId]) {
            rooms[roomId].currentMap = mapName;
            io.to(roomId).emit('map-updated', mapName);
        }
    });

    socket.on('add-marker', ({ roomId, markerData }) => {
        if (rooms[roomId]) {
            rooms[roomId].markers.push(markerData);
            io.to(roomId).emit('marker-added', markerData);
        }
    });

    socket.on('delete-marker', ({ roomId, markerId }) => {
        if (rooms[roomId]) {
            rooms[roomId].markers = rooms[roomId].markers.filter(m => m.id !== markerId);
            io.to(roomId).emit('marker-removed', markerId);
        }
    });

    socket.on('add-line', ({ roomId, line }) => {
        if (rooms[roomId]) {
            rooms[roomId].lines.push(line);
            io.to(roomId).emit('lines-updated', rooms[roomId].lines);
        }
    });

    socket.on('delete-line', ({ roomId, lineId }) => {
        if (rooms[roomId]) {
            rooms[roomId].lines = rooms[roomId].lines.filter(l => l.id !== lineId);
            io.to(roomId).emit('lines-updated', rooms[roomId].lines);
        }
    });

    socket.on('update-squadron-position', ({ roomId, sqKey, position }) => {
        if (rooms[roomId]) {
            rooms[roomId].squadronPositions[sqKey] = position;
            io.to(roomId).emit('squadron-positions-updated', rooms[roomId].squadronPositions);
        }
    });

    socket.on('clear-board', (roomId) => {
        if (rooms[roomId]) {
            rooms[roomId].markers = [];
            rooms[roomId].lines = [];
            io.to(roomId).emit('board-cleared');
            io.to(roomId).emit('lines-updated', []);
        }
    });

    socket.on('disconnect', () => {
        if (currentRoomId && rooms[currentRoomId]) {
            const player = rooms[currentRoomId].roster.find(p => p.id === currentPlayerId);
            if (player) {
                player.status = 'offline';
                io.to(currentRoomId).emit('roster-updated', rooms[currentRoomId].roster);
            }
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Guilliman's Server Running on port ${PORT}`);
});