import { useState } from 'react';
import { useFleetState } from './hooks/useFleetState';
import socketService from './services/socketService';
import { SHIP_REGISTRY, INITIAL_SQUADRONS } from './constants';
import TacticalLogger, { initGlobalLogging } from './TacticalLogger';
import TacticalMap from './TacticalMap';
import RosterTab from './RosterTab';
import AssignmentTab from './AssignmentTab';
import FormationTab from './FormationTab';
import './App.css';

// Initialize global error capturing
initGlobalLogging();

/**
 * Main Application Component
 * 
 * Orchestrates the lobby and main tactical interface using modular hooks and services.
 */
function App() {
  const {
    isConnected, activeRoom, setActiveRoom, isCommander, setIsCommander,
    commanderName, setCommanderName, playerTag, setPlayerTag,
    recentLobbies, setCreatedRooms,
    savedShips, setSavedShips, lobbyName, setLobbyName,
    fleetRoster, setFleetRoster, squadrons, setSquadrons,
    activeMap, setActiveMap, markers, setMarkers,
    lines, setLines, squadronPositions, setSquadronPositions,
    localPlayerId, clearTacticalData, enterPlayground
  } = useFleetState();

  const [joinToken, setJoinToken] = useState('');
  const [activeTab, setActiveTab] = useState('roster');
  const [viewingSquadron, setViewingSquadron] = useState('Vanguard');

  // --- Mock Socket for Playground Mode ---
  // Simulates the real socket.io socket API locally so TacticalMap
  // can operate without a server connection when in PLAYGROUND mode.
  const mockSocket = {
    emit: (event, data) => {
      if (event === 'add-marker') setMarkers(prev => [...prev, data.markerData]);
      else if (event === 'delete-marker') setMarkers(prev => prev.filter(m => m.id !== data.markerId));
      else if (event === 'add-line') setLines(prev => [...prev, data.line]);
      else if (event === 'delete-line') setLines(prev => prev.filter(l => l.id !== data.lineId));
      else if (event === 'update-squadron-position') setSquadronPositions(prev => ({ ...prev, [data.sqKey]: data.position }));
      else if (event === 'change-map') setActiveMap(data.mapName);
      else if (event === 'clear-board') { setMarkers([]); setLines([]); }
    }
  };

  // Determine which squadron (if any) the local player is currently assigned to.
  // Used to conditionally show the Formation tab for non-commanders.
  const mySquadronKey = Object.keys(squadrons).find(key => 
    (squadrons[key]?.players || []).includes(localPlayerId)
  );

  // --- Handlers ---

  /**
   * Handles the creation of a new operation lobby.
   * Generates a random 6-character token, clears stale state, joins the
   * new room as commander, and syncs any pre-saved ship offers.
   */
  const handleCreateLobby = () => {
    if (!commanderName.trim()) return alert("Please enter a Commander Name");
    // Generate a short, uppercase alphanumeric token for the room ID
    const newToken = Math.random().toString(36).substr(2, 6).toUpperCase();

    // Clear any stale data from a previous operation before entering the new room
    clearTacticalData();

    socketService.joinRoom({ roomId: newToken, name: commanderName, tag: playerTag, playerId: localPlayerId });
    socketService.updateOffers(newToken, localPlayerId, savedShips);
    // Track this room as one we created (used for commander status detection on reconnect)
    setCreatedRooms(prev => Array.from(new Set([...prev, newToken])));
    setActiveRoom(newToken);
    setIsCommander(true);
  };

  /**
   * Handles joining an existing operation lobby by token.
   * Accepts an optional tokenOverride for direct joins from the recent-lobbies list.
   * @param {Event|null} e - The form submit event (may be null for programmatic joins).
   * @param {string|null} tokenOverride - A token to use instead of the joinToken input.
   */
  const handleJoinLobby = (e, tokenOverride) => {
    if (e) e.preventDefault();
    const token = (tokenOverride || joinToken).trim().toUpperCase();
    if (!commanderName.trim() || token === '') return alert("Please enter a Name and Token");
    
    // Special token: enters offline Playground (Sandbox) mode
    if (token === 'PLAYGROUND') return enterPlayground();

    // Clear stale data BEFORE emitting join so we start fresh when server responds
    clearTacticalData();
    setActiveRoom(token);

    socketService.joinRoom({ roomId: token, name: commanderName, tag: playerTag, playerId: localPlayerId });
    socketService.updateOffers(token, localPlayerId, savedShips);
  };

  /**
   * Updates the lobby display name locally and broadcasts it to the server.
   * No-ops on server emit when in PLAYGROUND mode.
   * @param {string} newName - The new lobby name entered by the commander.
   */
  const handleRenameLobby = (newName) => {
    setLobbyName(newName);
    if (activeRoom !== 'PLAYGROUND') socketService.updateLobbyName(activeRoom, newName);
  };

  /**
   * Adds a ship to the local player's offer list (deduplicated).
   * In PLAYGROUND mode, updates the local roster directly.
   * In live mode, syncs the offers list to the server.
   * @param {string} ship - Ship name string to add.
   */
  const handleAddShipOffer = (ship) => {
    // Use Set to prevent duplicate ship entries
    const newOffers = [...new Set([...savedShips, ship])];
    setSavedShips(newOffers);
    if (activeRoom === 'PLAYGROUND') {
      setFleetRoster(prev => prev.map(p => p.id === localPlayerId ? { ...p, offers: newOffers } : p));
    } else {
      socketService.updateOffers(activeRoom, localPlayerId, newOffers);
    }
  };

  /**
   * Removes a ship from the local player's offer list.
   * Mirrors handleAddShipOffer — updates locally in PLAYGROUND, remotely otherwise.
   * @param {string} ship - Ship name string to remove.
   */
  const handleRemoveShipOffer = (ship) => {
    const newOffers = savedShips.filter(s => s !== ship);
    setSavedShips(newOffers);
    if (activeRoom === 'PLAYGROUND') {
      setFleetRoster(prev => prev.map(p => p.id === localPlayerId ? { ...p, offers: newOffers } : p));
    } else {
      socketService.updateOffers(activeRoom, localPlayerId, newOffers);
    }
  };

  /**
   * Toggles a player's 'Deploying' (selected) status.
   * The commander uses this to mark which players are participating in the operation.
   * @param {string} playerId - The ID of the player to toggle.
   */
  const handleToggleSelection = (playerId) => {
    if (activeRoom === 'PLAYGROUND') setFleetRoster(prev => prev.map(p => p.id === playerId ? { ...p, selected: !p.selected } : p));
    else socketService.toggleSelection(activeRoom, playerId);
  };

  /**
   * Updates a player's tactical role (e.g., 'Member', 'Squadron Lead', 'Alternate Lead').
   * @param {string} playerId - The player whose role to change.
   * @param {string} role - The new role string to assign.
   */
  const handleChangeRole = (playerId, role) => {
    if (activeRoom === 'PLAYGROUND') setFleetRoster(prev => prev.map(p => p.id === playerId ? { ...p, role } : p));
    else socketService.updateRole(activeRoom, playerId, role);
  };

  /**
   * Commander-only: assigns a specific ship from the player's offers to their confirmed slot.
   * @param {string} playerId - The player being assigned a ship.
   * @param {string} shipName - The ship name to assign (must be in their offers list).
   */
  const handleCommanderSelectShip = (playerId, shipName) => {
    if (activeRoom === 'PLAYGROUND') setFleetRoster(prev => prev.map(p => p.id === playerId ? { ...p, ship: shipName } : p));
    else socketService.commanderAssignShip(activeRoom, playerId, shipName);
  };

  /**
   * Activates or deactivates a squadron. Deactivating also removes all players from it
   * to prevent ghost assignments.
   * @param {string} sqName - The squadron key to toggle.
   */
  const handleToggleSquadron = (sqName) => {
    const newSquadrons = { ...squadrons };
    newSquadrons[sqName].active = !newSquadrons[sqName].active;
    // Evict all players when deactivating to keep assignment state clean
    if (!newSquadrons[sqName].active) newSquadrons[sqName].players = [];
    setSquadrons(newSquadrons); 
    if (activeRoom !== 'PLAYGROUND') socketService.updateSquadrons(activeRoom, newSquadrons);
  };

  /**
   * Renames a squadron. Uses a deep clone to avoid mutating shared state.
   * @param {string} sqKey - The internal key of the squadron (e.g., 'Vanguard').
   * @param {string} newName - The custom display name to assign.
   */
  const handleRenameSquadron = (sqKey, newName) => {
    // Deep clone to avoid mutating the existing squadrons state object directly
    const newSquadrons = JSON.parse(JSON.stringify(squadrons));
    newSquadrons[sqKey].name = newName;
    setSquadrons(newSquadrons);
    if (activeRoom !== 'PLAYGROUND') socketService.updateSquadrons(activeRoom, newSquadrons);
  };

  /**
   * Handles drag-and-drop player assignment between squadrons.
   * Supports both native HTML5 drag events and the mobile fallback select onChange.
   * Dropping onto 'unassigned' removes the player from all squadrons.
   * @param {Event|Object} e - Drag event or synthetic event object with a playerId property.
   * @param {string} targetSquadronName - Name of the target squadron, or 'unassigned'.
   */
  const handleDrop = (e, targetSquadronName) => {
    if (e.preventDefault) e.preventDefault();
    if (!isCommander) return;
    // Support both native drag dataTransfer and mobile-fallback synthetic events
    let playerId = e.playerId || (e.dataTransfer ? e.dataTransfer.getData('playerId') : null);
    if (!playerId) return;
    const newSquadrons = JSON.parse(JSON.stringify(squadrons));
    // Remove player from ALL squadrons first to prevent them being in multiple at once
    Object.keys(newSquadrons).forEach(sq => {
      newSquadrons[sq].players = (newSquadrons[sq].players || []).filter(id => id !== playerId);
    });
    if (targetSquadronName !== 'unassigned') {
      if (!newSquadrons[targetSquadronName].players) newSquadrons[targetSquadronName].players = [];
      // Guard against accidental duplicate entries
      if (!newSquadrons[targetSquadronName].players.includes(playerId)) newSquadrons[targetSquadronName].players.push(playerId);
    }
    setSquadrons(newSquadrons);
    if (activeRoom !== 'PLAYGROUND') socketService.updateSquadrons(activeRoom, newSquadrons);
  };

  /**
   * Changes the tactical formation of a squadron (e.g., 'Line Ahead', 'Echelon Right').
   * @param {string} sqName - The squadron key whose formation is being changed.
   * @param {string} newFormation - The new formation string.
   */
  const handleFormationChange = (sqName, newFormation) => {
    const newSquadrons = JSON.parse(JSON.stringify(squadrons));
    newSquadrons[sqName].formation = newFormation;
    setSquadrons(newSquadrons);
    if (activeRoom !== 'PLAYGROUND') socketService.updateSquadrons(activeRoom, newSquadrons);
  };

  /**
   * Reorders players within their squadron via drag-and-drop on the Formation tab.
   * Only the commander or the squadron's own Lead/Alt-Lead may reorder.
   * Uses array splice to swap the dragged player into the target position.
   * @param {string} sqName - The squadron in which reordering is happening.
   * @param {string} draggedId - Player ID being dragged.
   * @param {string} targetId - Player ID of the drop slot target.
   */
  const handleReorderSquadron = (sqName, draggedId, targetId) => {
    const me = fleetRoster.find(r => r.id === localPlayerId);
    const mySq = Object.keys(squadrons).find(key => squadrons[key].players.includes(localPlayerId));
    // Check if the local player is a lead of THIS specific squadron
    const isSquadLead = me && (me.role === 'Squadron Lead' || me.role === 'Alternate Lead') && mySq === sqName;
    if (!isCommander && !isSquadLead) return;
    const newSquadrons = JSON.parse(JSON.stringify(squadrons));
    const players = newSquadrons[sqName].players || [];
    const dragIdx = players.indexOf(draggedId);
    const targetIdx = players.indexOf(targetId);
    // Abort if either player isn't found or they're already in the same position
    if (dragIdx === -1 || targetIdx === -1 || dragIdx === targetIdx) return;
    players.splice(dragIdx, 1);
    players.splice(targetIdx, 0, draggedId);
    setSquadrons(newSquadrons);
    if (activeRoom !== 'PLAYGROUND') socketService.updateSquadrons(activeRoom, newSquadrons);
  };

  // Players who are marked as Deploying (selected) but not yet placed in any squadron.
  // These populate the 'Recruit Pool' in the Assignment tab.
  const unassignedPlayers = fleetRoster.filter(p => p.selected && !Object.values(squadrons).flatMap(sq => sq?.players || []).includes(p.id));

  // --- Lobby View ---
  if (!activeRoom) {
    return (
      <div className="lobby-view">
        <div className="lobby-card glass-panel" style={{ maxWidth: '600px' }}>
          <div>
            <h1 className="lobby-title app-title">Guilliman's Fleet Command</h1>
            <p className="app-subtitle">Tactical Maritime Command Interface</p>
          </div>
          <div className="lobby-input-group">
            <input type="text" placeholder="ENTER COMMANDER NAME" className="input-field text-mono uppercase" style={{textAlign: 'center', fontSize: '18px'}} value={commanderName} onChange={(e) => setCommanderName(e.target.value.toUpperCase())} onFocus={(e) => e.target.select()} />
            <input type="text" placeholder="ASSOCIATED GUILD (TAG)" className="input-field text-mono uppercase" style={{textAlign: 'center', fontSize: '14px'}} value={playerTag} onChange={(e) => setPlayerTag(e.target.value.toUpperCase())} onFocus={(e) => e.target.select()} />
          </div>
          <div className="glass-panel" style={{ margin: '20px 0', padding: '15px', background: 'rgba(0,0,0,0.3)', textAlign: 'left' }}>
            <h3 style={{ fontSize: '10px', color: 'var(--text-accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '10px' }}>Persistent Fleet Configuration</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '15px', minHeight: '30px' }}>
              {savedShips.map(ship => (
                <span key={ship} className="ship-pill ship-pill-my" onClick={() => handleRemoveShipOffer(ship)} style={{ cursor: 'pointer', fontSize: '10px' }}>{ship} ×</span>
              ))}
              {savedShips.length === 0 && <span style={{ opacity: 0.3, fontSize: '10px' }}>No ships saved. Add vessels below to auto-apply when joining.</span>}
            </div>
            <select className="input-field text-mono uppercase" style={{ fontSize: '10px', flex: 1 }} onChange={(e) => { if(e.target.value) { handleAddShipOffer(e.target.value); e.target.value = ''; } }}>
              <option value="">+ ADD SHIP TO PERSISTENT LIST</option>
              {Object.entries(SHIP_REGISTRY).map(([rate, ships]) => (
                <optgroup key={rate} label={rate.toUpperCase()}>
                  {ships.map(ship => <option key={ship} value={ship}>{ship.toUpperCase()}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button onClick={handleCreateLobby} className="btn-primary">START OPERATION</button>
            <div style={{ position: 'relative' }}>
               <input type="text" placeholder="JOIN TOKEN" maxLength={10} className="input-field text-mono uppercase" style={{textAlign: 'center', fontSize: '16px', height: '100%'}} value={joinToken} onChange={(e) => setJoinToken(e.target.value.toUpperCase())} onFocus={(e) => e.target.select()} />
               <button onClick={(e) => handleJoinLobby(e, null)} className="btn-primary" style={{ position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', padding: '5px 15px', fontSize: '10px', height: 'auto' }}>JOIN</button>
            </div>
          </div>
          {recentLobbies.length > 0 && (
            <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
              <p style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Recent Operations</p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {recentLobbies.map(lobby => {
                  const token = typeof lobby === 'string' ? lobby : lobby.token;
                  const name = typeof lobby === 'string' ? lobby : (lobby.name || lobby.token);
                  return <button key={token} type="button" onClick={() => { setJoinToken(token); handleJoinLobby(null, token); }} className="ship-pill" style={{ cursor: 'pointer', padding: '6px 12px', fontSize: '10px' }}>{name}</button>;
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Main Application View ---
  return (
    <div className="app-container">
      <div className="app-header glass-panel">
        <div><h1 className="app-title">Guilliman's Fleet Command</h1><p className="app-subtitle">for World of Sea Battles</p></div>
        <div className="connection-status">
          <div className={`status-dot ${activeRoom === 'PLAYGROUND' ? 'connected' : (isConnected ? 'connected' : 'disconnected')}`}></div>
          {activeRoom === 'PLAYGROUND' && <span className="sandbox-badge">SANDBOX MODE</span>}
          {isCommander && <span className="commander-badge">COMMANDER</span>}
          {isCommander ? <input type="text" value={lobbyName} onChange={(e) => handleRenameLobby(e.target.value)} className="input-field text-mono" /> : <span className="room-id">{lobbyName || 'Operation Lobby'}</span>}
          <span className="room-id" style={{ opacity: 0.5 }}>[{activeRoom}]</span>
        </div>
      </div>
      <div className="tabs-container">
        <button onClick={() => setActiveTab('roster')} className={`tab-btn ${activeTab === 'roster' ? 'active' : ''}`}>1. ROSTER</button>
        <button onClick={() => setActiveTab('assignment')} className={`tab-btn ${activeTab === 'assignment' ? 'active' : ''}`}>2. SQUADRON ASSIGNMENT</button>
        {(isCommander || mySquadronKey) && <button onClick={() => setActiveTab('formation')} className={`tab-btn ${activeTab === 'formation' ? 'active' : ''}`}>3. FORMATION ASSIGNMENT</button>}
        <button onClick={() => setActiveTab('whiteboard')} className={`tab-btn ${activeTab === 'whiteboard' ? 'active' : ''}`}>4. MAP</button>
      </div>
      <div className="main-content glass-panel">
        {activeTab === 'roster' && <RosterTab fleetRoster={fleetRoster} localPlayerId={localPlayerId} isCommander={isCommander} onAddShipOffer={handleAddShipOffer} onRemoveShipOffer={handleRemoveShipOffer} onToggleSelection={handleToggleSelection} onAssignShip={handleCommanderSelectShip} />}
        {activeTab === 'assignment' && <AssignmentTab unassignedPlayers={unassignedPlayers} isCommander={isCommander} squadrons={squadrons} initialSquadrons={INITIAL_SQUADRONS} fleetRoster={fleetRoster} localPlayerId={localPlayerId} mySquadronKey={mySquadronKey} onDrop={handleDrop} onToggleSquadron={handleToggleSquadron} onFormationChange={handleFormationChange} onRenameSquadron={handleRenameSquadron} onChangeRole={handleChangeRole} />}
        {activeTab === 'formation' && <FormationTab isCommander={isCommander} squadrons={squadrons} viewingSquadron={viewingSquadron} setViewingSquadron={setViewingSquadron} mySquadronKey={mySquadronKey} fleetRoster={fleetRoster} localPlayerId={localPlayerId} onReorder={handleReorderSquadron} />}
        {activeTab === 'whiteboard' && <TacticalMap socket={activeRoom === 'PLAYGROUND' ? mockSocket : socketService.getSocket()} activeRoom={activeRoom} isCommander={isCommander} squadrons={squadrons} localPlayerId={localPlayerId} fleetRoster={fleetRoster} activeMap={activeMap} lines={lines} markers={markers} squadronPositions={squadronPositions} />}
      </div>
    </div>
  );
}

export default App;
