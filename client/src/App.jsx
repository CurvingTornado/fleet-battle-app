import { useFleetContext } from './hooks/FleetContext';
import { useTacticalHandlers } from './hooks/useTacticalHandlers';
import socketService from './services/socketService';
import { initGlobalLogging } from './TacticalLogger';
import LobbyScreen from './components/LobbyScreen';
import TacticalDashboard from './components/TacticalDashboard';
import DiscordGuide from './components/DiscordGuide';
import './App.css';

// Initialize global error capturing
initGlobalLogging();

/**
 * Main Application Component
 * 
 * Orchestrates the lobby and main tactical interface using modular hooks and services.
 */
function App() {
  const fleetState = useFleetContext();
  const handlers = useTacticalHandlers(fleetState);

  const {
    activeRoom, isCommander, commanderName, setCommanderName,
    playerTag, setPlayerTag, recentLobbies, savedShips, localPlayerId
  } = fleetState;

  const {
    joinToken, setJoinToken, activeTab, setActiveTab,
    viewingSquadron, setViewingSquadron, showDiscordGuide, setShowDiscordGuide,
    handleCreateLobby, handleJoinLobby, handleRenameLobby,
    getLocalDatetimeString, handleBattleTimeChange,
    handleAddShipOffer, handleRemoveShipOffer,
    handleToggleSelection, handleChangeRole,
    handleCommanderSelectShip, handleToggleSquadron,
    handleRenameSquadron, handleDrop,
    handleFormationChange, handleReorderSquadron
  } = handlers;

  // --- Mock Socket for Playground Mode ---
  const mockSocket = {
    emit: (event, data) => {
      if (event === 'add-marker') fleetState.setMarkers(prev => [...prev, data.markerData]);
      else if (event === 'delete-marker') fleetState.setMarkers(prev => prev.filter(m => m.id !== data.markerId));
      else if (event === 'add-line') fleetState.setLines(prev => [...prev, data.line]);
      else if (event === 'delete-line') fleetState.setLines(prev => prev.filter(l => l.id !== data.lineId));
      else if (event === 'update-squadron-position') fleetState.setSquadronPositions(prev => ({ ...prev, [data.sqKey]: data.position }));
      else if (event === 'change-map') fleetState.setActiveMap(data.mapName);
      else if (event === 'clear-board') { fleetState.setMarkers([]); fleetState.setLines([]); }
    }
  };

  if (showDiscordGuide) {
    return <DiscordGuide onBack={() => setShowDiscordGuide(false)} />;
  }

  if (!activeRoom) {
    return (
      <LobbyScreen 
        commanderName={commanderName}
        setCommanderName={setCommanderName}
        playerTag={playerTag}
        setPlayerTag={setPlayerTag}
        savedShips={savedShips}
        handleRemoveShipOffer={handleRemoveShipOffer}
        handleAddShipOffer={handleAddShipOffer}
        handleCreateLobby={handleCreateLobby}
        joinToken={joinToken}
        setJoinToken={setJoinToken}
        handleJoinLobby={handleJoinLobby}
        recentLobbies={recentLobbies}
        onShowDiscordGuide={() => setShowDiscordGuide(true)}
      />
    );
  }

  return (
    <TacticalDashboard 
      handleRenameLobby={handleRenameLobby}
      handleBattleTimeChange={handleBattleTimeChange}
      getLocalDatetimeString={getLocalDatetimeString}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      viewingSquadron={viewingSquadron}
      setViewingSquadron={setViewingSquadron}
      handleAddShipOffer={handleAddShipOffer}
      handleRemoveShipOffer={handleRemoveShipOffer}
      handleToggleSelection={handleToggleSelection}
      handleCommanderSelectShip={handleCommanderSelectShip}
      handleDrop={handleDrop}
      handleToggleSquadron={handleToggleSquadron}
      handleFormationChange={handleFormationChange}
      handleRenameSquadron={handleRenameSquadron}
      handleChangeRole={handleChangeRole}
      handleReorderSquadron={handleReorderSquadron}
      socket={activeRoom === 'PLAYGROUND' ? mockSocket : socketService.getSocket()}
      onShowDiscordGuide={() => setShowDiscordGuide(true)}
    />
  );
}

export default App;

