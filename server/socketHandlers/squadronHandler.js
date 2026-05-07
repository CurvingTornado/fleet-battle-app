/**
 * Registers Socket.io event handlers related to Squadron Management.
 * Handles updating squadron states, formations, and player assignments within them.
 * 
 * @param {import('socket.io').Server} io - The Socket.io server instance.
 * @param {import('socket.io').Socket} socket - The individual client socket connection.
 * @param {import('../LobbyManager')} lobbyManager - The centralized state manager.
 */
module.exports = function(io, socket, lobbyManager) {
    /**
     * Replaces the entire squadron configuration.
     * This handles dragging/dropping players into squadrons, toggling squadron active states,
     * renaming squadrons, and changing formations.
     */
    socket.on('update-squadrons', ({ roomId, newState }) => {
        const room = lobbyManager.getRoom(roomId);
        if (room) {
            room.squadrons = newState;
            lobbyManager.saveState();
            io.to(roomId).emit('squadrons-updated', newState);
        }
    });
};
