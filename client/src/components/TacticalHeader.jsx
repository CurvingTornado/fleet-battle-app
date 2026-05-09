import React from 'react';

/**
 * TacticalHeader Component
 * 
 * Displays the main navigation, lobby name, and connection status.
 */
function TacticalHeader({
  activeRoom,
  isConnected,
  isCommander,
  lobbyName,
  handleRenameLobby,
  battleTime,
  handleBattleTimeChange,
  getLocalDatetimeString,
  onShowDiscordGuide
}) {
  return (
    <div className="app-header glass-panel">
      <div className="header-brand">
        <h1 className="app-title">Guilliman's Fleet Command</h1>
        <div className="header-subtitle-container">
          <p className="app-subtitle">Tactical Fleet Management</p>
          <button 
            onClick={onShowDiscordGuide}
            className="discord-bot-badge"
          >
            Join Discord Bot
          </button>
        </div>
      </div>

      <div className="header-status-area">
        <div className="status-row">
          <div className={`status-dot ${activeRoom === 'PLAYGROUND' ? 'connected' : (isConnected ? 'connected' : 'disconnected')}`}></div>
          {activeRoom === 'PLAYGROUND' && <span className="sandbox-badge">SANDBOX</span>}
          {isCommander && <span className="commander-badge">COMMANDER</span>}
          
          <div className="lobby-name-container">
            {isCommander ? (
              <input 
                type="text" 
                value={lobbyName} 
                onChange={(e) => handleRenameLobby(e.target.value)} 
                className="lobby-name-input text-mono" 
                placeholder="Operation Name"
              />
            ) : (
              <span className="lobby-name-display">{lobbyName || 'Operation Lobby'}</span>
            )}
          </div>
          <span className="room-id-tag">[{activeRoom}]</span>
        </div>

        {activeRoom !== 'PLAYGROUND' && (
          <div className="battle-time-row">
            <span className="battle-label">BATTLE TIME:</span>
            {isCommander ? (
              <input 
                type="datetime-local" 
                className="battle-time-input text-mono" 
                value={getLocalDatetimeString(battleTime)} 
                onChange={handleBattleTimeChange}
              />
            ) : (
              <span className="battle-time-value text-mono">
                {battleTime ? new Date(battleTime).toLocaleString() : 'TBD'}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TacticalHeader;
