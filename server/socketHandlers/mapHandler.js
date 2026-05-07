/**
 * Registers Socket.io event handlers related to Tactical Map Interactions.
 * Handles the synchronized whiteboard features including maps, markers, lines, and draggable elements.
 * 
 * @param {import('socket.io').Server} io - The Socket.io server instance.
 * @param {import('socket.io').Socket} socket - The individual client socket connection.
 * @param {import('../LobbyManager')} lobbyManager - The centralized state manager.
 */
module.exports = function(io, socket, lobbyManager) {
    /**
     * Changes the background map image for the entire room.
     */
    socket.on('change-map', ({ roomId, mapName }) => {
        const room = lobbyManager.getRoom(roomId);
        if (room) {
            room.currentMap = mapName;
            lobbyManager.saveState();
            io.to(roomId).emit('map-updated', mapName);
        }
    });

    /**
     * Adds a generic ping marker to the tactical map.
     */
    socket.on('add-marker', ({ roomId, markerData }) => {
        const room = lobbyManager.getRoom(roomId);
        if (room) {
            room.markers.push(markerData);
            lobbyManager.saveState();
            io.to(roomId).emit('marker-added', markerData);
        }
    });

    /**
     * Removes a specific ping marker from the map.
     */
    socket.on('delete-marker', ({ roomId, markerId }) => {
        const room = lobbyManager.getRoom(roomId);
        if (room) {
            room.markers = room.markers.filter(m => m.id !== markerId);
            lobbyManager.saveState();
            io.to(roomId).emit('marker-removed', markerId);
        }
    });

    /**
     * Adds a freehand drawn line segment to the tactical map.
     */
    socket.on('add-line', ({ roomId, line }) => {
        const room = lobbyManager.getRoom(roomId);
        if (room) {
            room.lines.push(line);
            lobbyManager.saveState();
            io.to(roomId).emit('lines-updated', room.lines);
        }
    });

    /**
     * Deletes a specific drawn line segment.
     */
    socket.on('delete-line', ({ roomId, lineId }) => {
        const room = lobbyManager.getRoom(roomId);
        if (room) {
            room.lines = room.lines.filter(l => l.id !== lineId);
            lobbyManager.saveState();
            io.to(roomId).emit('lines-updated', room.lines);
        }
    });

    /**
     * Updates the custom X/Y coordinates of a draggable squadron label.
     */
    socket.on('update-squadron-position', ({ roomId, sqKey, position }) => {
        const room = lobbyManager.getRoom(roomId);
        if (room) {
            room.squadronPositions[sqKey] = position;
            lobbyManager.saveState();
            io.to(roomId).emit('squadron-positions-updated', room.squadronPositions);
        }
    });

    /**
     * Wipes all markers, lines, and custom positions from the tactical map.
     * Typically executed by the Commander to reset the strategy board.
     */
    socket.on('clear-board', (roomId) => {
        const room = lobbyManager.getRoom(roomId);
        if (room) {
            room.markers = [];
            room.lines = [];
            lobbyManager.saveState();
            io.to(roomId).emit('board-cleared');
            io.to(roomId).emit('lines-updated', []);
        }
    });
};
