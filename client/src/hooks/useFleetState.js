import { useState, useEffect, useRef } from 'react';
import { INITIAL_SQUADRONS, FAKE_PLAYERS } from '../constants';
import socketService from '../services/socketService';

/**
 * Custom Hook: useFleetState
 *
 * Manages the core tactical state of the application, including:
 * - Real-time synchronization with the server via Socket.io
 * - Identity and fleet persistence in localStorage
 * - Playground (Sandbox) mode initialization
 *
 * ARCHITECTURE NOTE:
 * Socket listeners are registered ONCE on mount (empty dependency array).
 * To avoid stale closures (where a callback captures an old value of a variable
 * like `activeRoom` or `createdRooms`), we use `useRef` to maintain a
 * "live pointer" to the latest values. Callbacks read from the ref,
 * not from the stale closure variable.
 */
export const useFleetState = () => {
    // --- Connectivity State ---
    const [isConnected, setIsConnected] = useState(false);
    const [activeRoom, setActiveRoom] = useState(null);
    const [isCommander, setIsCommander] = useState(false);

    // --- Identity State (Persisted in LocalStorage) ---
    const [commanderName, setCommanderName] = useState(() => localStorage.getItem('commanderName') || '');
    const [playerTag, setPlayerTag] = useState(() => localStorage.getItem('playerTag') || '');
    const [recentLobbies, setRecentLobbies] = useState(() => JSON.parse(localStorage.getItem('recentLobbies') || '[]'));
    const [createdRooms, setCreatedRooms] = useState(() => JSON.parse(localStorage.getItem('createdRooms') || '[]'));
    const [savedShips, setSavedShips] = useState(() => JSON.parse(localStorage.getItem('savedShips') || '[]'));

    // --- Application State ---
    const [lobbyName, setLobbyName] = useState('');
    const [fleetRoster, setFleetRoster] = useState([]);
    const [squadrons, setSquadrons] = useState(INITIAL_SQUADRONS);
    const [activeMap, setActiveMap] = useState('Devios');

    // --- Tactical Map Data ---
    const [markers, setMarkers] = useState([]);
    const [lines, setLines] = useState([]);
    const [squadronPositions, setSquadronPositions] = useState({});

    // Persistent Dogtag ID — stable across sessions for reconnect handling
    const [localPlayerId] = useState(() => {
        let id = localStorage.getItem('fleet_dogtag');
        if (!id) {
            id = 'cmd_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('fleet_dogtag', id);
        }
        return id;
    });

    // --- Refs for use inside socket callbacks (avoids stale closures) ---
    // When a socket listener is registered once on mount, it captures the values
    // of state variables at that moment. If those variables later change, the
    // listener still sees the old values (a "stale closure"). Refs solve this
    // by providing a mutable container that always points to the latest value.
    const activeRoomRef = useRef(activeRoom);
    const createdRoomsRef = useRef(createdRooms);

    // Keep refs in sync using an effect.
    // This is the idiomatic pattern to avoid stale closures in event listeners
    // while satisfying React's rule against mutating refs during render.
    useEffect(() => {
        activeRoomRef.current = activeRoom;
        createdRoomsRef.current = createdRooms;
    }, [activeRoom, createdRooms]);

    // --- Persistence Effects ---
    useEffect(() => { localStorage.setItem('commanderName', commanderName); }, [commanderName]);
    useEffect(() => { localStorage.setItem('playerTag', playerTag); }, [playerTag]);
    useEffect(() => { localStorage.setItem('recentLobbies', JSON.stringify(recentLobbies)); }, [recentLobbies]);
    useEffect(() => { localStorage.setItem('createdRooms', JSON.stringify(createdRooms)); }, [createdRooms]);
    useEffect(() => { localStorage.setItem('savedShips', JSON.stringify(savedShips)); }, [savedShips]);

    // Update recent lobbies when the active room or its name changes
    useEffect(() => {
        if (activeRoom) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setRecentLobbies(prev => {
                const existing = prev.filter(l => (typeof l === 'string' ? l : l.token) !== activeRoom);
                return [{ token: activeRoom, name: lobbyName }, ...existing].slice(0, 3);
            });
        }
    }, [activeRoom, lobbyName]);

    // --- Socket Event Listeners ---
    // Registered ONCE on mount. Reads activeRoom/createdRooms via refs to avoid
    // stale closure issues without needing to re-register on every state change.
    useEffect(() => {
        socketService.onConnect(() => setIsConnected(true));
        socketService.onDisconnect(() => setIsConnected(false));

        socketService.onRoomJoined(({ isCommander: serverIsCommander, commanderId: serverCommanderId, lobbyName: serverLobbyName }) => {
            // Use refs here — these hold the CURRENT values even though this
            // callback was defined at mount time when they were empty/initial.
            const isCmd = serverIsCommander
                || localPlayerId === serverCommanderId
                || createdRoomsRef.current.includes(activeRoomRef.current);
            setIsCommander(isCmd);
            setLobbyName(serverLobbyName || '');
        });

        socketService.onLobbyNameUpdated(setLobbyName);

        socketService.onRosterUpdated((updatedRoster) => setFleetRoster(updatedRoster || []));

        socketService.onSquadronsUpdated((newState) => {
            if (newState && typeof newState === 'object' && Object.keys(newState).length > 0) {
                setSquadrons(newState);
            }
        });

        socketService.onMapUpdated(setActiveMap);
        socketService.onMarkerAdded((newMarker) => setMarkers((prev) => [...prev, newMarker]));
        socketService.onMarkerRemoved((markerId) => setMarkers((prev) => prev.filter(m => m.id !== markerId)));
        socketService.onLinesUpdated((newLines) => setLines(newLines || []));
        socketService.onSquadronPositionsUpdated((positions) => setSquadronPositions(positions || {}));
        socketService.onBoardCleared(() => { setMarkers([]); setLines([]); });

        // Cleanup: remove all listeners when the component unmounts.
        // This runs exactly once, preventing any double-registration.
        return () => {
            socketService.off('connect');
            socketService.off('disconnect');
            socketService.off('room-joined');
            socketService.off('lobby-name-updated');
            socketService.off('roster-updated');
            socketService.off('squadrons-updated');
            socketService.off('map-updated');
            socketService.off('marker-added');
            socketService.off('marker-removed');
            socketService.off('lines-updated');
            socketService.off('squadron-positions-updated');
            socketService.off('board-cleared');
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    // Empty deps array is intentional — listeners are registered once only.

    // --- Utility Actions ---

    /**
     * Wipes all tactical state when switching rooms to prevent data bleed-over.
     * Should be called before setActiveRoom() in any join or create operation.
     */
    const clearTacticalData = () => {
        setFleetRoster([]);
        setMarkers([]);
        setLines([]);
        setSquadronPositions({});
        setSquadrons(INITIAL_SQUADRONS);
        setIsCommander(false);
        setLobbyName('');
    };

    /**
     * Initializes the local Sandbox (Playground) mode.
     * Populates the roster with FAKE_PLAYERS and assigns them to a squadron.
     * No server connection is used.
     */
    const enterPlayground = () => {
        clearTacticalData();
        setActiveRoom('PLAYGROUND');
        setIsCommander(true);
        setLobbyName('Tactical Playground');
        setFleetRoster([
            { id: localPlayerId, name: commanderName.toUpperCase(), tag: playerTag.toUpperCase(), status: 'online', offers: savedShips, ship: '', selected: true, role: 'Commander' },
            ...FAKE_PLAYERS
        ]);

        const newSquadrons = JSON.parse(JSON.stringify(INITIAL_SQUADRONS));
        newSquadrons['Center/Main Body'].players = FAKE_PLAYERS.map(p => p.id);
        setSquadrons(newSquadrons);
    };

    return {
        isConnected, activeRoom, setActiveRoom, isCommander, setIsCommander,
        commanderName, setCommanderName, playerTag, setPlayerTag,
        recentLobbies, setRecentLobbies, createdRooms, setCreatedRooms,
        savedShips, setSavedShips, lobbyName, setLobbyName,
        fleetRoster, setFleetRoster, squadrons, setSquadrons,
        activeMap, setActiveMap, markers, setMarkers,
        lines, setLines, squadronPositions, setSquadronPositions,
        localPlayerId, clearTacticalData, enterPlayground
    };
};
