const logger = require('../logger');

/**
 * Registers Socket.io event handlers related to Roster Management.
 * Handles player joins, role changes, ship assignments, and overall lobby metadata.
 * 
 * @param {import('socket.io').Server} io - The Socket.io server instance.
 * @param {import('socket.io').Socket} socket - The individual client socket connection.
 * @param {import('../LobbyManager')} lobbyManager - The centralized state manager.
 */
module.exports = function(io, socket, lobbyManager) {
    
    /**
     * Join Room Handler
     * Initializes a room if it doesn't exist and adds the player to the roster.
     */
    socket.on('join-room', (payload) => {
        const { roomId, name, tag, playerId } = payload;
        
        socket.join(roomId); // Subscribe the socket to the specific room channel
        socket.currentRoomId = roomId; // Track room on the socket object for disconnect handling
        socket.currentPlayerId = playerId;

        // Initialize a new lobby if this is the first person joining
        if (!lobbyManager.getRoom(roomId)) {
            logger.info(`LOBBY: Initializing new room: ${roomId} by ${name}`);
            lobbyManager.createRoom(roomId, playerId, name);
        }

        const room = lobbyManager.getRoom(roomId);

        // Check if player already exists in the roster (e.g., on reconnect)
        const existingPlayer = room.roster.find(p => p.id === playerId);
        if (!existingPlayer) {
            // First time joining: add a fresh player entry to the roster
            room.roster.push({ 
                id: playerId, name: name || "Unknown", tag: tag || "", status: 'online', 
                offers: [], ship: '', selected: false, role: 'Member'
            });
        } else {
            // Reconnecting player: update status and any name/tag changes
            existingPlayer.status = 'online';
            existingPlayer.name = name || existingPlayer.name; 
            existingPlayer.tag = tag || existingPlayer.tag; 
        }

        lobbyManager.saveState();
        logger.info(`LOBBY: Player ${name} joined Room: ${roomId}`);

        // Send current room state back to the joining player only
        socket.emit('room-joined', { 
            isCommander: playerId === room.commanderId, 
            commanderId: room.commanderId,
            lobbyName: room.lobbyName,
            battleTime: room.battleTime
        });
        
        // Broadcast updated state to all players in the room
        io.to(roomId).emit('roster-updated', room.roster);
        io.to(roomId).emit('squadrons-updated', room.squadrons);
        io.to(roomId).emit('map-updated', room.currentMap);
        
        // Send existing map markers and lines to the new player
        room.markers.forEach(marker => socket.emit('marker-added', marker));
        socket.emit('lines-updated', room.lines);
        socket.emit('squadron-positions-updated', room.squadronPositions);
    });

    /**
     * Toggles a player's 'Deploying' (selected) status.
     * This indicates if a player is actively participating in the upcoming operation.
     */
    socket.on('toggle-selection', ({ roomId, playerId }) => {
        const room = lobbyManager.getRoom(roomId);
        if (room) {
            const player = room.roster.find(p => p.id === playerId);
            if (player) {
                player.selected = !player.selected;
                lobbyManager.saveState();
                io.to(roomId).emit('roster-updated', room.roster);
            }
        }
    });

    /**
     * Updates the list of ships a player is offering to bring to the battle.
     */
    socket.on('update-offers', ({ roomId, playerId, offers }) => {
        const room = lobbyManager.getRoom(roomId);
        if (room) {
            const player = room.roster.find(p => p.id === playerId);
            if (player) {
                player.offers = offers;
                lobbyManager.saveState();
                io.to(roomId).emit('roster-updated', room.roster);
            }
        }
    });

    /**
     * Sets the exact ship a player is assigned to use.
     * Typically executed by the Commander.
     */
    socket.on('commander-assign-ship', ({ roomId, playerId, ship }) => {
        const room = lobbyManager.getRoom(roomId);
        if (room) {
            const player = room.roster.find(p => p.id === playerId);
            if (player) {
                player.ship = ship;
                lobbyManager.saveState();
                io.to(roomId).emit('roster-updated', room.roster);
            }
        }
    });

    /**
     * Updates a player's tactical role (e.g., 'Member', 'Squadron Lead').
     */
    socket.on('update-role', ({ roomId, playerId, role }) => {
        const room = lobbyManager.getRoom(roomId);
        if (room) {
            const player = room.roster.find(p => p.id === playerId);
            if (player) {
                player.role = role;
                lobbyManager.saveState();
                io.to(roomId).emit('roster-updated', room.roster);
            }
        }
    });

    /**
     * Updates the human-readable display name of the lobby.
     */
    socket.on('update-lobby-name', ({ roomId, name }) => {
        const room = lobbyManager.getRoom(roomId);
        if (room) {
            room.lobbyName = name;
            lobbyManager.saveState();
            io.to(roomId).emit('lobby-name-updated', name);
        }
    });

    /**
     * Sets the planned battle time. This automatically recalculates the lobby's deletion timer.
     */
    socket.on('set-battle-time', ({ roomId, battleTime }) => {
        lobbyManager.updateBattleTime(roomId, battleTime);
        io.to(roomId).emit('battle-time-updated', battleTime);
        const room = lobbyManager.getRoom(roomId);
        if (room) {
            logger.info(`LOBBY: Battle Time for ${roomId} updated to ${battleTime}. Deletes at ${new Date(room.deletionTime).toISOString()}`);
        }
    });
};
