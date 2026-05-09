import React from 'react';
import RosterTab from '../RosterTab';
import AssignmentTab from '../AssignmentTab';
import FormationTab from '../FormationTab';
import TacticalMap from '../TacticalMap';
import { useFleetContext } from '../hooks/FleetContext';
import TacticalHeader from './TacticalHeader';
import TacticalLayout from './TacticalLayout';

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

  const header = (
    <TacticalHeader 
      activeRoom={activeRoom}
      isConnected={isConnected}
      isCommander={isCommander}
      lobbyName={lobbyName}
      handleRenameLobby={handleRenameLobby}
      battleTime={battleTime}
      handleBattleTimeChange={handleBattleTimeChange}
      getLocalDatetimeString={getLocalDatetimeString}
      onShowDiscordGuide={onShowDiscordGuide}
    />
  );

  return (
    <TacticalLayout header={header}>
      {/* Tab navigation for different sections of the dashboard */}
      <nav className="tabs-container">
        <button onClick={() => setActiveTab('roster')} className={`tab-btn ${activeTab === 'roster' ? 'active' : ''}`}>1. ROSTER</button>
        <button onClick={() => setActiveTab('assignment')} className={`tab-btn ${activeTab === 'assignment' ? 'active' : ''}`}>2. SQUADRONS</button>
        {(isCommander || mySquadronKey) && (
          <button onClick={() => setActiveTab('formation')} className={`tab-btn ${activeTab === 'formation' ? 'active' : ''}`}>3. FORMATIONS</button>
        )}
        <button onClick={() => setActiveTab('whiteboard')} className={`tab-btn ${activeTab === 'whiteboard' ? 'active' : ''}`}>4. MAP</button>
      </nav>

      {/* Main content area that changes based on active tab */}
      <section className="main-content glass-panel">
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
      </section>
    </TacticalLayout>
  );
}

export default TacticalDashboard;
