import React from 'react';
import RosterTab from '../RosterTab';
import AssignmentTab from '../AssignmentTab';
import FormationTab from '../FormationTab';
import TacticalMap from '../TacticalMap';

/**
 * A React component representing the main tactical dashboard for managing fleet operations,
 * including roster management, squadron assignments, formation configuration, and a tactical map.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isConnected - Whether the client is connected to the server
 * @param {string} props.activeRoom - The current active room (e.g., 'PLAYGROUND')
 * @param {boolean} props.isCommander - Whether the user has commander privileges
 * @param {string} props.lobbyName - Name of the current lobby/operation
 * @param {Function} props.handleRenameLobby - Callback to rename the lobby
 * @param {Date|number|null} props.battleTime - Timestamp for the scheduled battle time
 * @param {Function} props.handleBattleTimeChange - Callback to update the battle time
 * @param {Function} props.getLocalDatetimeString - Converts a timestamp to local datetime string
 * @param {string} props.activeTab - Currently active tab (roster, assignment, formation, whiteboard)
 * @param {Function} props.setActiveTab - Sets the active tab
 * @param {string|null} props.viewingSquadron - Identifier of the currently viewed squadron
 * @param {Function} props.setViewingSquadron - Sets the currently viewed squadron
 * @param {string|null} props.mySquadronKey - Unique identifier for the user's squadron
 * @param {Object[]} props.fleetRoster - Array of fleet members with their details
 * @param {string} props.localPlayerId - ID of the local player
 * @param {Function} props.handleAddShipOffer - Adds a ship to the offer list
 * @param {Function} props.handleRemoveShipOffer - Removes a ship from the offer list
 * @param {Function} props.handleToggleSelection - Toggles selection state for a fleet member
 * @param {Function} props.handleCommanderSelectShip - Assigns a ship to a commander
 * @param {Object[]} props.unassignedPlayers - List of players not assigned to any squadron
 * @param {Object[]} props.squadrons - Array of squadron objects with members and configurations
 * @param {Object[]} props.INITIAL_SQUADRONS - Initial squadron configuration data
 * @param {Function} props.handleDrop - Handles drag-and-drop events for squadron assignments
 * @param {Function} props.handleToggleSquadron - Toggles a squadron's visibility or state
 * @param {Function} props.handleFormationChange - Updates formation settings for a squadron
 * @param {Function} props.handleRenameSquadron - Renames a squadron
 * @param {Function} props.handleChangeRole - Changes the role of a fleet member within a squadron
 * @param {string} props.activeMap - Identifier of the currently active map view
 * @param {Object[]} props.lines - Lines drawn on the tactical map (e.g., formation lines)
 * @param {Object[]} props.markers - Markers placed on the tactical map (e.g., ship positions)
 * @param {Object} props.squadronPositions - Position data for squadrons on the map
 * @param {Object} props.socket - WebSocket connection object for real-time communication
 */
import { useFleetContext } from '../hooks/FleetContext';

function TacticalDashboard({
  handleRenameLobby,
  handleBattleTimeChange,
  getLocalDatetimeString,
  activeTab,
  setActiveTab,
  viewingSquadron,
  setViewingSquadron,
  handleAddShipOffer,
  handleRemoveShipOffer,
  handleToggleSelection,
  handleCommanderSelectShip,
  handleDrop,
  handleToggleSquadron,
  handleFormationChange,
  handleRenameSquadron,
  handleChangeRole,
  handleReorderSquadron,
  socket,
  onShowDiscordGuide
}) {
  const {
    isConnected,
    activeRoom,
    isCommander,
    lobbyName,
    battleTime,
    fleetRoster,
    discordApplicants,
    localPlayerId,
    squadrons,
    activeMap,
    lines,
    markers,
    squadronPositions
  } = useFleetContext();

  const mySquadronKey = Object.keys(squadrons).find(key => 
    (squadrons[key]?.players || []).includes(localPlayerId)
  );
  
  const INITIAL_SQUADRONS = {
      "Vanguard": { name: "Vanguard", active: true, formation: "Line Ahead", players: [] },
      "Center/Main Body": { name: "Center/Main Body", active: true, formation: "Line Ahead", players: [] },
      "Rear": { name: "Rear", active: true, formation: "Line Ahead", players: [] },
      "Screen": { name: "Screen", active: true, formation: "Line Ahead", players: [] },
      "Reserve": { name: "Reserve", active: true, formation: "Line Ahead", players: [] }
  };
  const unassignedPlayers = fleetRoster.filter(p => p.selected && !Object.values(squadrons).flatMap(sq => sq?.players || []).includes(p.id));

  return (
    <div className="app-container">
      {/* Header section with lobby name, connection status, and battle time */}
      <div className="app-header glass-panel">
        <div>
          <h1 className="app-title">Guilliman's Fleet Command</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <p className="app-subtitle" style={{ margin: 0 }}>for World of Sea Battles</p>
            <button 
              onClick={onShowDiscordGuide}
              style={{
                display: 'inline-block',
                fontSize: '9px',
                textDecoration: 'none',
                /* Frosted ghost: subtle purple wash that blends against the blue glass header */
                background: 'rgba(88, 101, 242, 0.15)',
                color: 'rgba(185, 195, 255, 0.9)',
                padding: '3px 8px',
                borderRadius: '4px',
                fontWeight: 'bold',
                border: '1px solid rgba(88, 101, 242, 0.4)',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Invite my Discord Bot to your Server!
            </button>
          </div>
        </div>
        <div className="connection-status" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          {/* Connection status indicator and lobby name input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className={`status-dot ${activeRoom === 'PLAYGROUND' ? 'connected' : (isConnected ? 'connected' : 'disconnected')}`}></div>
            {activeRoom === 'PLAYGROUND' && <span className="sandbox-badge">SANDBOX MODE</span>}
            {isCommander && <span className="commander-badge">COMMANDER</span>}
            {/* Lobby name is editable only by commanders */}
            {isCommander ? (
              /* Styled lobby name input — matches design system */
              <input 
                type="text" 
                value={lobbyName} 
                onChange={(e) => handleRenameLobby(e.target.value)} 
                className="input-field text-mono" 
                style={{ padding: '6px 12px', fontSize: '14px', fontWeight: 700, width: '180px', background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border-active)', letterSpacing: '0.1em' }}
              />
            ) : (
              <span className="room-id">{lobbyName || 'Operation Lobby'}</span>
            )}
            {/* Displays active room identifier */}
            <span className="room-id" style={{ opacity: 0.5 }}>[{activeRoom}]</span>
          </div>
          {/* Battle time input or display, only visible in non-playground rooms */}
          {activeRoom !== 'PLAYGROUND' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>BATTLE TIME:</span>
              {/* Commander can edit battle time, others see it as read-only */}
              {isCommander ? (
                /* Styled battle time picker — compact to fit in header */
                <input 
                  type="datetime-local" 
                  className="input-field text-mono" 
                  value={getLocalDatetimeString(battleTime)} 
                  onChange={handleBattleTimeChange}
                  style={{ padding: '5px 10px', fontSize: '12px', background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border-subtle)', width: 'auto', colorScheme: 'dark' }}
                />
              ) : (
                <span className="text-accent text-mono" style={{ fontWeight: 'bold' }}>
                  {battleTime ? new Date(battleTime).toLocaleString() : 'TBD'}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tab navigation for different sections of the dashboard */}
      <div className="tabs-container">
        {/* Roster tab: displays fleet members and allows selection/assignment */}
        <button onClick={() => setActiveTab('roster')} className={`tab-btn ${activeTab === 'roster' ? 'active' : ''}`}>1. ROSTER</button>
        {/* Assignment tab: manages squadron assignments for players */}
        <button onClick={() => setActiveTab('assignment')} className={`tab-btn ${activeTab === 'assignment' ? 'active' : ''}`}>2. SQUADRON ASSIGNMENT</button>
        {/* Formation tab: visible only to commanders or users with a squadron key */}
        {(isCommander || mySquadronKey) && (
          <button onClick={() => setActiveTab('formation')} className={`tab-btn ${activeTab === 'formation' ? 'active' : ''}`}>3. FORMATION ASSIGNMENT</button>
        )}
        {/* Map tab: displays the tactical map with squadron positions and markers */}
        <button onClick={() => setActiveTab('whiteboard')} className={`tab-btn ${activeTab === 'whiteboard' ? 'active' : ''}`}>4. MAP</button>
      </div>

      {/* Main content area that changes based on active tab */}
      <div className="main-content glass-panel">
        {/* RosterTab is rendered when the "Roster" tab is active */}
        {activeTab === 'roster' && (
          <RosterTab 
            fleetRoster={fleetRoster} 
            discordApplicants={discordApplicants}
            localPlayerId={localPlayerId} 
            isCommander={isCommander} 
            onAddShipOffer={handleAddShipOffer} 
            onRemoveShipOffer={handleRemoveShipOffer} 
            onToggleSelection={handleToggleSelection} 
            onAssignShip={handleCommanderSelectShip} 
          />
        )}
        {/* AssignmentTab is rendered when the "Squadron Assignment" tab is active */}
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
        {/* FormationTab is rendered when the "Formation Assignment" tab is active */}
        {activeTab === 'formation' && (
          <FormationTab 
            isCommander={isCommander} 
            squadrons={squadrons} 
            viewingSquadron={viewingSquadron} 
            setViewingSquadron={setViewingSquadron} 
            mySquadronKey={mySquadronKey} 
            fleetRoster={fleetRoster} 
            localPlayerId={localPlayerId} 
            onReorder={handleReorderSquadron} 
          />
        )}
        {/* TacticalMap is rendered when the "MAP" tab is active */}
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

export default TacticalDashboard;
