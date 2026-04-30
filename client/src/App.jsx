import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import TacticalMap from './TacticalMap';
import RosterTab from './RosterTab';
import AssignmentTab from './AssignmentTab';
import FormationTab from './FormationTab';
import './App.css';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const socket = io(SOCKET_URL);

const INITIAL_SQUADRONS = {
  "Vanguard": { name: "Vanguard", active: true, formation: "Line Ahead", players: [] },
  "Center/Main Body": { name: "Center/Main Body", active: true, formation: "Line Ahead", players: [] },
  "Rear": { name: "Rear", active: true, formation: "Line Ahead", players: [] },
  "Screen": { name: "Screen", active: true, formation: "Line Ahead", players: [] },
  "Reserve": { name: "Reserve", active: true, formation: "Line Ahead", players: [] }
};

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [joinToken, setJoinToken] = useState('');
  const [activeRoom, setActiveRoom] = useState(null);
  const [isCommander, setIsCommander] = useState(false);
  const [lobbyName, setLobbyName] = useState('');
  const [commanderName, setCommanderName] = useState(() => localStorage.getItem('commanderName') || '');
  const [playerTag, setPlayerTag] = useState(() => localStorage.getItem('playerTag') || '');
  const [recentLobbies, setRecentLobbies] = useState(() => JSON.parse(localStorage.getItem('recentLobbies') || '[]'));
  const [createdRooms, setCreatedRooms] = useState(() => JSON.parse(localStorage.getItem('createdRooms') || '[]'));
  const [savedShips, setSavedShips] = useState(() => JSON.parse(localStorage.getItem('savedShips') || '[]'));
  const [fleetRoster, setFleetRoster] = useState([]);
  const [activeTab, setActiveTab] = useState('roster'); 
  const [viewingSquadron, setViewingSquadron] = useState('Vanguard');
  const [squadrons, setSquadrons] = useState(INITIAL_SQUADRONS);
  const [activeMap, setActiveMap] = useState('devios');
  
  const [markers, setMarkers] = useState([]);
  const [lines, setLines] = useState([]);
  const [squadronPositions, setSquadronPositions] = useState({});
  const [isLightMode, setIsLightMode] = useState(() => localStorage.getItem('theme') === 'light');

  const [localPlayerId] = useState(() => {
    let id = localStorage.getItem('fleet_dogtag');
    if (!id) {
      id = 'cmd_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('fleet_dogtag', id);
    }
    return id;
  });

  useEffect(() => {
    document.body.classList.toggle('light-theme', isLightMode);
    localStorage.setItem('theme', isLightMode ? 'light' : 'dark');
  }, [isLightMode]);

  useEffect(() => { localStorage.setItem('commanderName', commanderName); }, [commanderName]);
  useEffect(() => { localStorage.setItem('playerTag', playerTag); }, [playerTag]);
  useEffect(() => { localStorage.setItem('recentLobbies', JSON.stringify(recentLobbies)); }, [recentLobbies]);
  useEffect(() => { localStorage.setItem('createdRooms', JSON.stringify(createdRooms)); }, [createdRooms]);
  useEffect(() => { localStorage.setItem('savedShips', JSON.stringify(savedShips)); }, [savedShips]);

  useEffect(() => {
    if (activeRoom) {
      setRecentLobbies(prev => {
        const existing = prev.filter(l => (typeof l === 'string' ? l : l.token) !== activeRoom);
        return [{ token: activeRoom, name: lobbyName }, ...existing].slice(0, 3);
      });
    }
  }, [activeRoom, lobbyName]);

  useEffect(() => {
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('room-joined', ({ isCommander: serverIsCommander, commanderId: serverCommanderId, lobbyName }) => { 
      setIsCommander(serverIsCommander || localPlayerId === serverCommanderId || createdRooms.includes(activeRoom)); 
      setLobbyName(lobbyName || ''); 
    });
    socket.on('lobby-name-updated', (newName) => setLobbyName(newName));
    socket.on('roster-updated', (updatedRoster) => setFleetRoster(updatedRoster || []));
    socket.on('squadrons-updated', (newState) => {
      if (newState && typeof newState === 'object' && Object.keys(newState).length > 0) {
        setSquadrons(newState);
      }
    });
    socket.on('map-updated', (mapName) => setActiveMap(mapName));
    socket.on('marker-added', (newMarker) => setMarkers((prev) => [...prev, newMarker]));
    socket.on('marker-removed', (markerId) => setMarkers((prev) => prev.filter(m => m.id !== markerId)));
    socket.on('lines-updated', (newLines) => setLines(newLines || []));
    socket.on('squadron-positions-updated', (positions) => setSquadronPositions(positions || {}));
    socket.on('board-cleared', () => { setMarkers([]); setLines([]); });

    return () => {
      socket.off('connect'); socket.off('disconnect');
      socket.off('room-joined'); socket.off('lobby-name-updated');
      socket.off('roster-updated'); socket.off('squadrons-updated');
      socket.off('map-updated'); socket.off('marker-added'); socket.off('marker-removed');
      socket.off('lines-updated'); socket.off('squadron-positions-updated');
      socket.off('board-cleared');
    }
  }, []);

  const mySquadronKey = Object.keys(squadrons).find(key => 
    (squadrons[key]?.players || []).includes(localPlayerId)
  );

  const handleCreateLobby = () => {
    if (!commanderName.trim()) return alert("Please enter a Commander Name");
    const newToken = Math.random().toString(36).substr(2, 6).toUpperCase();
    
    socket.emit('join-room', { 
      roomId: newToken, 
      name: commanderName, 
      tag: playerTag, 
      playerId: localPlayerId 
    });
    socket.emit('update-offers', { roomId: newToken, playerId: localPlayerId, offers: savedShips });
    
    setRecentLobbies(prev => Array.from(new Set([newToken, ...prev])).slice(0, 3));
    setCreatedRooms(prev => Array.from(new Set([...prev, newToken])));
    setActiveRoom(newToken);
    setIsCommander(true);
  };

  const handleJoinLobby = (e, tokenOverride) => {
    if (e) e.preventDefault();
    const token = tokenOverride || joinToken;
    if (!commanderName.trim() || token.trim() === '') return alert("Please enter a Name and Token");
    
    socket.emit('join-room', { 
      roomId: token, 
      name: commanderName, 
      tag: playerTag, 
      playerId: localPlayerId 
    });
    socket.emit('update-offers', { roomId: token, playerId: localPlayerId, offers: savedShips });
    
    setRecentLobbies(prev => Array.from(new Set([token, ...prev])).slice(0, 3));
    setActiveRoom(token);
    if (createdRooms.includes(token)) {
      setIsCommander(true);
    }
  };

  const handleRenameLobby = (newName) => {
    setLobbyName(newName);
    socket.emit('update-lobby-name', { roomId: activeRoom, name: newName });
  };

  const handleAddShipOffer = (ship) => {
    const newOffers = [...new Set([...savedShips, ship])];
    setSavedShips(newOffers);
    socket.emit('update-offers', { roomId: activeRoom, playerId: localPlayerId, offers: newOffers });
  };

  const handleRemoveShipOffer = (ship) => {
    const newOffers = savedShips.filter(s => s !== ship);
    setSavedShips(newOffers);
    socket.emit('update-offers', { roomId: activeRoom, playerId: localPlayerId, offers: newOffers });
  };

  const handleToggleSelection = (playerId) => {
    socket.emit('toggle-selection', { roomId: activeRoom, playerId });
  };

  const handleChangeRole = (playerId, role) => {
    socket.emit('update-role', { roomId: activeRoom, playerId, role });
  };

  const handleCommanderSelectShip = (playerId, shipName) => {
    socket.emit('commander-assign-ship', { roomId: activeRoom, playerId, ship: shipName });
  };

  const handleToggleSquadron = (sqName) => {
    const newSquadrons = { ...squadrons };
    newSquadrons[sqName].active = !newSquadrons[sqName].active;
    if (!newSquadrons[sqName].active) newSquadrons[sqName].players = [];
    setSquadrons(newSquadrons); 
    socket.emit('update-squadrons', { roomId: activeRoom, newState: newSquadrons });
  };

  const handleRenameSquadron = (sqKey, newName) => {
    const newSquadrons = JSON.parse(JSON.stringify(squadrons));
    newSquadrons[sqKey].name = newName;
    setSquadrons(newSquadrons);
    socket.emit('update-squadrons', { roomId: activeRoom, newState: newSquadrons });
  };

  const handleDrop = (e, targetSquadronName) => {
    e.preventDefault();
    if (!isCommander) return;
    const playerId = e.dataTransfer?.getData('playerId') || e.playerId;
    if (!playerId) return; 

    const newSquadrons = JSON.parse(JSON.stringify(squadrons));
    Object.keys(newSquadrons).forEach(sq => {
      newSquadrons[sq].players = (newSquadrons[sq].players || []).filter(id => id !== playerId);
    });
    
    if (targetSquadronName !== 'unassigned') {
      if (!newSquadrons[targetSquadronName].players) newSquadrons[targetSquadronName].players = [];
      newSquadrons[targetSquadronName].players.push(playerId);
    }
    
    setSquadrons(newSquadrons);
    socket.emit('update-squadrons', { roomId: activeRoom, newState: newSquadrons });
  };

  const handleFormationChange = (sqName, newFormation) => {
    const newSquadrons = JSON.parse(JSON.stringify(squadrons));
    newSquadrons[sqName].formation = newFormation;
    setSquadrons(newSquadrons);
    socket.emit('update-squadrons', { roomId: activeRoom, newState: newSquadrons });
  };

  const unassignedPlayers = fleetRoster.filter(p => p.selected && !Object.values(squadrons).flatMap(sq => sq?.players || []).includes(p.id));

  if (!activeRoom) {
    return (
      <div className="lobby-view">
        <div className="lobby-card glass-panel">
          <div>
            <h1 className="lobby-title app-title">Guilliman's Fleet Command</h1>
            <p className="app-subtitle">for World of Sea Battles</p>
          </div>
          
          <div className="lobby-input-group">
            <input type="text" placeholder="ENTER COMMANDER NAME" className="input-field text-mono uppercase" style={{textAlign: 'center', fontSize: '18px'}} value={commanderName} onChange={(e) => setCommanderName(e.target.value.toUpperCase())} />
            <input type="text" placeholder="ASSOCIATED GUILD (TAG)" className="input-field text-mono uppercase" style={{textAlign: 'center', fontSize: '14px'}} value={playerTag} onChange={(e) => setPlayerTag(e.target.value.toUpperCase())} />
            <button onClick={handleCreateLobby} className="btn-primary">Create Operation</button>
          </div>
          
          <div className="lobby-divider"></div>
          
          <form onSubmit={(e) => handleJoinLobby(e, null)} className="lobby-input-group" style={{marginTop: 0}}>
            <input type="text" placeholder="6-DIGIT TOKEN" maxLength={6} className="input-field text-mono uppercase" style={{textAlign: 'center', fontSize: '20px', letterSpacing: '0.3em'}} value={joinToken} onChange={(e) => setJoinToken(e.target.value.toUpperCase())} />
            <button type="submit" className="btn-primary" style={{background: 'var(--bg-panel)', color: 'var(--text-main)', border: '1px solid var(--border-active)', boxShadow: 'none'}}>JOIN LOBBY</button>
            
            {recentLobbies.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Recent Operations:</p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  {recentLobbies.map(lobby => {
                    const token = typeof lobby === 'string' ? lobby : lobby.token;
                    const name = typeof lobby === 'string' ? lobby : (lobby.name || lobby.token);
                    return (
                      <button key={token} type="button" onClick={() => { setJoinToken(token); handleJoinLobby(null, token); }} className="ship-pill" style={{ cursor: 'pointer', padding: '6px 12px' }}>
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      
      <div className="app-header glass-panel">
        <div>
            <h1 className="app-title">Guilliman's Fleet Command</h1>
            <p className="app-subtitle">for World of Sea Battles</p>
        </div>
        <div className="connection-status" style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={() => setIsLightMode(!isLightMode)} style={{ fontSize: '18px', marginRight: '8px', background: 'transparent', border: 'none', cursor: 'pointer' }} title="Toggle Theme">
            {isLightMode ? '☀️' : '🌙'}
          </button>
          <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></div>
          {isCommander && (
            <span style={{ background: 'var(--text-accent)', color: '#000', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', marginRight: '8px' }}>COMMANDER</span>
          )}
          {isCommander ? (
            <input type="text" value={lobbyName} onChange={(e) => handleRenameLobby(e.target.value)} placeholder="Name this Operation..." className="input-field text-mono" style={{ background: 'rgba(0,0,0,0.5)', padding: '4px 8px', fontSize: '14px', width: '200px', marginRight: '8px' }} />
          ) : (
            <span className="room-id" style={{ marginRight: '8px', fontWeight: 'bold' }}>{lobbyName || 'Operation Lobby'}</span>
          )}
          <span className="room-id" style={{ opacity: 0.5 }}>[{activeRoom}]</span>
        </div>
      </div>

      <div className="tabs-container">
        <button onClick={() => setActiveTab('roster')} className={`tab-btn ${activeTab === 'roster' ? 'active' : ''}`}>1. ROSTER</button>
        <button onClick={() => setActiveTab('assignment')} className={`tab-btn ${activeTab === 'assignment' ? 'active' : ''}`}>2. SQUADRON ASSIGNMENT</button>
        {(isCommander || mySquadronKey) && <button onClick={() => setActiveTab('view')} className={`tab-btn ${activeTab === 'view' ? 'active' : ''}`}>3. FORMATION ASSIGNMENT</button>}
        <button onClick={() => setActiveTab('whiteboard')} className={`tab-btn ${activeTab === 'whiteboard' ? 'active' : ''}`}>4. MAP</button>
      </div>

      <div className="main-content glass-panel" style={{ borderRadius: '0 0 var(--radius-xl) var(--radius-xl)' }}>
        
        {activeTab === 'roster' && (
           <RosterTab 
             fleetRoster={fleetRoster} 
             localPlayerId={localPlayerId} 
             isCommander={isCommander}
             onAddShipOffer={handleAddShipOffer}
             onRemoveShipOffer={handleRemoveShipOffer}
             onToggleSelection={handleToggleSelection}
             onAssignShip={handleCommanderSelectShip}
           />
        )}

        {activeTab === 'assignment' && (
          <AssignmentTab 
             unassignedPlayers={unassignedPlayers}
             isCommander={isCommander}
             squadrons={squadrons}
             initialSquadrons={INITIAL_SQUADRONS}
             fleetRoster={fleetRoster}
             localPlayerId={localPlayerId}
             mySquadronKey={mySquadronKey}
             onDrop={handleDrop}
             onToggleSquadron={handleToggleSquadron}
             onFormationChange={handleFormationChange}
             onRenameSquadron={handleRenameSquadron}
             onChangeRole={handleChangeRole}
          />
        )}

        {activeTab === 'view' && (
          <FormationTab 
             isCommander={isCommander}
             squadrons={squadrons}
             viewingSquadron={viewingSquadron}
             setViewingSquadron={setViewingSquadron}
             mySquadronKey={mySquadronKey}
             fleetRoster={fleetRoster}
             localPlayerId={localPlayerId}
          />
        )}

        {activeTab === 'whiteboard' && (
          <TacticalMap 
            socket={socket} 
            activeRoom={activeRoom} 
            isCommander={isCommander} 
            squadrons={squadrons} 
            localPlayerId={localPlayerId} 
            fleetRoster={fleetRoster} 
            activeMap={activeMap}
            lines={lines}
            markers={markers}
            squadronPositions={squadronPositions}
          />
        )}
      </div>
    </div>
  );
}

export default App;