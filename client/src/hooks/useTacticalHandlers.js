import { useState } from 'react';
import socketService from '../services/socketService';

/**
 * Custom Hook: useTacticalHandlers
 * 
 * Extracted user action handlers for the Fleet Command application.
 * Separates UI logic from the main App component.
 */
export const useTacticalHandlers = (fleetState) => {
  const {
    activeRoom, setActiveRoom, isCommander, setIsCommander,
    commanderName, playerTag, setCreatedRooms,
    savedShips, setSavedShips, setLobbyName,
    setBattleTime, setFleetRoster, squadrons, setSquadrons,
    localPlayerId, clearTacticalData, enterPlayground
  } = fleetState;

  const [joinToken, setJoinToken] = useState('');
  const [activeTab, setActiveTab] = useState('roster');
  const [viewingSquadron, setViewingSquadron] = useState('Vanguard');
  const [showDiscordGuide, setShowDiscordGuide] = useState(false);

  const handleCreateLobby = () => {
    if (!commanderName.trim()) return alert("Please enter a Commander Name");
    const newToken = Math.random().toString(36).substr(2, 6).toUpperCase();
    clearTacticalData();
    socketService.joinRoom({ roomId: newToken, name: commanderName, tag: playerTag, playerId: localPlayerId });
    socketService.updateOffers(newToken, localPlayerId, savedShips);
    setCreatedRooms(prev => Array.from(new Set([...prev, newToken])));
    setActiveRoom(newToken);
    setIsCommander(true);
  };

  const handleJoinLobby = (e, tokenOverride) => {
    if (e) e.preventDefault();
    const token = (tokenOverride || joinToken).trim().toUpperCase();
    if (!commanderName.trim() || token === '') return alert("Please enter a Name and Token");
    if (token === 'PLAYGROUND') return enterPlayground();

    clearTacticalData();
    setActiveRoom(token);
    socketService.joinRoom({ roomId: token, name: commanderName, tag: playerTag, playerId: localPlayerId });
    socketService.updateOffers(token, localPlayerId, savedShips);
  };

  const handleRenameLobby = (newName) => {
    setLobbyName(newName);
    if (activeRoom !== 'PLAYGROUND') socketService.updateLobbyName(activeRoom, newName);
  };

  const getLocalDatetimeString = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const handleBattleTimeChange = (e) => {
    const localString = e.target.value;
    if (!localString) {
      setBattleTime(null);
      if (activeRoom !== 'PLAYGROUND') socketService.setBattleTime(activeRoom, null);
      return;
    }
    const isoString = new Date(localString).toISOString();
    setBattleTime(isoString);
    if (activeRoom !== 'PLAYGROUND') socketService.setBattleTime(activeRoom, isoString);
  };

  const handleAddShipOffer = (ship) => {
    const newOffers = [...new Set([...savedShips, ship])];
    setSavedShips(newOffers);
    if (activeRoom === 'PLAYGROUND') {
      setFleetRoster(prev => prev.map(p => p.id === localPlayerId ? { ...p, offers: newOffers } : p));
    } else {
      socketService.updateOffers(activeRoom, localPlayerId, newOffers);
    }
  };

  const handleRemoveShipOffer = (ship) => {
    const newOffers = savedShips.filter(s => s !== ship);
    setSavedShips(newOffers);
    if (activeRoom === 'PLAYGROUND') {
      setFleetRoster(prev => prev.map(p => p.id === localPlayerId ? { ...p, offers: newOffers } : p));
    } else {
      socketService.updateOffers(activeRoom, localPlayerId, newOffers);
    }
  };

  const handleToggleSelection = (playerId) => {
    if (activeRoom === 'PLAYGROUND') setFleetRoster(prev => prev.map(p => p.id === playerId ? { ...p, selected: !p.selected } : p));
    else socketService.toggleSelection(activeRoom, playerId);
  };

  const handleChangeRole = (playerId, role) => {
    if (activeRoom === 'PLAYGROUND') setFleetRoster(prev => prev.map(p => p.id === playerId ? { ...p, role } : p));
    else socketService.updateRole(activeRoom, playerId, role);
  };

  const handleCommanderSelectShip = (playerId, shipName) => {
    if (activeRoom === 'PLAYGROUND') setFleetRoster(prev => prev.map(p => p.id === playerId ? { ...p, ship: shipName } : p));
    else socketService.commanderAssignShip(activeRoom, playerId, shipName);
  };

  const handleToggleSquadron = (sqName) => {
    const newSquadrons = { ...squadrons };
    newSquadrons[sqName].active = !newSquadrons[sqName].active;
    if (!newSquadrons[sqName].active) newSquadrons[sqName].players = [];
    setSquadrons(newSquadrons); 
    if (activeRoom !== 'PLAYGROUND') socketService.updateSquadrons(activeRoom, newSquadrons);
  };

  const handleRenameSquadron = (sqKey, newName) => {
    const newSquadrons = JSON.parse(JSON.stringify(squadrons));
    newSquadrons[sqKey].name = newName;
    setSquadrons(newSquadrons);
    if (activeRoom !== 'PLAYGROUND') socketService.updateSquadrons(activeRoom, newSquadrons);
  };

  const handleDrop = (e, targetSquadronName) => {
    if (e.preventDefault) e.preventDefault();
    if (!isCommander) return;
    let playerId = e.playerId || (e.dataTransfer ? e.dataTransfer.getData('playerId') : null);
    if (!playerId) return;
    const newSquadrons = JSON.parse(JSON.stringify(squadrons));
    Object.keys(newSquadrons).forEach(sq => {
      newSquadrons[sq].players = (newSquadrons[sq].players || []).filter(id => id !== playerId);
    });
    if (targetSquadronName !== 'unassigned') {
      if (!newSquadrons[targetSquadronName].players) newSquadrons[targetSquadronName].players = [];
      if (!newSquadrons[targetSquadronName].players.includes(playerId)) newSquadrons[targetSquadronName].players.push(playerId);
    }
    setSquadrons(newSquadrons);
    if (activeRoom !== 'PLAYGROUND') socketService.updateSquadrons(activeRoom, newSquadrons);
  };

  const handleFormationChange = (sqName, newFormation) => {
    const newSquadrons = JSON.parse(JSON.stringify(squadrons));
    newSquadrons[sqName].formation = newFormation;
    setSquadrons(newSquadrons);
    if (activeRoom !== 'PLAYGROUND') socketService.updateSquadrons(activeRoom, newSquadrons);
  };

  const handleReorderSquadron = (sqName, draggedId, targetId) => {
    const me = fleetState.fleetRoster.find(r => r.id === localPlayerId);
    const mySq = Object.keys(squadrons).find(key => squadrons[key].players.includes(localPlayerId));
    const isSquadLead = me && (me.role === 'Squadron Lead' || me.role === 'Alternate Lead') && mySq === sqName;
    if (!isCommander && !isSquadLead) return;
    const newSquadrons = JSON.parse(JSON.stringify(squadrons));
    const players = newSquadrons[sqName].players || [];
    const dragIdx = players.indexOf(draggedId);
    const targetIdx = players.indexOf(targetId);
    if (dragIdx === -1 || targetIdx === -1 || dragIdx === targetIdx) return;
    players.splice(dragIdx, 1);
    players.splice(targetIdx, 0, draggedId);
    setSquadrons(newSquadrons);
    if (activeRoom !== 'PLAYGROUND') socketService.updateSquadrons(activeRoom, newSquadrons);
  };

  return {
    joinToken, setJoinToken,
    activeTab, setActiveTab,
    viewingSquadron, setViewingSquadron,
    showDiscordGuide, setShowDiscordGuide,
    handleCreateLobby, handleJoinLobby, handleRenameLobby,
    getLocalDatetimeString, handleBattleTimeChange,
    handleAddShipOffer, handleRemoveShipOffer,
    handleToggleSelection, handleChangeRole,
    handleCommanderSelectShip, handleToggleSquadron,
    handleRenameSquadron, handleDrop,
    handleFormationChange, handleReorderSquadron
  };
};
