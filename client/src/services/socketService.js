import { io } from 'socket.io-client';

/**
 * Socket Service Layer
 * 
 * Centralizes all WebSocket communication to keep components clean.
 * Handles room joining, roster updates, squadron management, and map events.
 */

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const socket = io(SOCKET_URL);

const socketService = {
    /**
     * Connection Status
     */
    onConnect: (callback) => socket.on('connect', callback),
    onDisconnect: (callback) => socket.on('disconnect', callback),

    /**
     * Room Management
     */
    joinRoom: (payload) => socket.emit('join-room', payload),
    updateOffers: (roomId, playerId, offers) => socket.emit('update-offers', { roomId, playerId, offers }),
    updateLobbyName: (roomId, name) => socket.emit('update-lobby-name', { roomId, name }),
    setBattleTime: (roomId, battleTime) => socket.emit('set-battle-time', { roomId, battleTime }),
    onRoomJoined: (callback) => socket.on('room-joined', callback),
    onLobbyNameUpdated: (callback) => socket.on('lobby-name-updated', callback),
    onBattleTimeUpdated: (callback) => socket.on('battle-time-updated', callback),
    onLobbyClosed: (callback) => socket.on('lobby-closed', callback),

    /**
     * Roster Management
     */
    toggleSelection: (roomId, playerId) => socket.emit('toggle-selection', { roomId, playerId }),
    updateRole: (roomId, playerId, role) => socket.emit('update-role', { roomId, playerId, role }),
    commanderAssignShip: (roomId, playerId, ship) => socket.emit('commander-assign-ship', { roomId, playerId, ship }),
    onRosterUpdated: (callback) => socket.on('roster-updated', callback),
    onDiscordApplicantsUpdated: (callback) => socket.on('discord-applicants-updated', callback),

    /**
     * Squadron Management
     */
    updateSquadrons: (roomId, newState) => socket.emit('update-squadrons', { roomId, newState }),
    updateSquadronPosition: (roomId, sqKey, position) => socket.emit('update-squadron-position', { roomId, sqKey, position }),
    onSquadronsUpdated: (callback) => socket.on('squadrons-updated', callback),
    onSquadronPositionsUpdated: (callback) => socket.on('squadron-positions-updated', callback),

    /**
     * Tactical Map Events
     */
    changeMap: (roomId, mapName) => socket.emit('change-map', { roomId, mapName }),
    addMarker: (roomId, markerData) => socket.emit('add-marker', { roomId, markerData }),
    deleteMarker: (roomId, markerId) => socket.emit('delete-marker', { roomId, markerId }),
    addLine: (roomId, line) => socket.emit('add-line', { roomId, line }),
    deleteLine: (roomId, lineId) => socket.emit('delete-line', { roomId, lineId }),
    clearBoard: (roomId) => socket.emit('clear-board', roomId),
    
    onMapUpdated: (callback) => socket.on('map-updated', callback),
    onMarkerAdded: (callback) => socket.on('marker-added', callback),
    onMarkerRemoved: (callback) => socket.on('marker-removed', callback),
    onLinesUpdated: (callback) => socket.on('lines-updated', callback),
    onBoardCleared: (callback) => socket.on('board-cleared', callback),

    /**
     * Internal Socket Instance
     * Only use this for cases where direct access is unavoidable.
     */
    getSocket: () => socket,

    /**
     * Cleanup Helpers
     */
    off: (event) => socket.off(event)
};

export default socketService;
