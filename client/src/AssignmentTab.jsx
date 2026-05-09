import React from 'react';
import { getShipIcon } from './constants';

/**
 * Assignment Tab Component
 * 
 * Provides a drag-and-drop interface for commanders to organize players into squadrons.
 */
const AssignmentTab = ({ 
  unassignedPlayers, isCommander, squadrons, fleetRoster, 
  mySquadronKey, onDrop, onToggleSquadron, 
  onRenameSquadron, onChangeRole 
}) => {
  return (
    <div className="assignment-tab">
      
      {/* 1. Recruit Pool */}
      <div 
        className="recruit-pool glass-panel" 
        onDragOver={(e) => e.preventDefault()} 
        onDrop={(e) => onDrop(e, 'unassigned')}
      >
        <h2 className="recruit-pool-title">Recruit Pool</h2>
        <div className="recruit-list">
          {unassignedPlayers.length === 0 && (
            <p className="no-recruits-hint">No unassigned recruits.</p>
          )}
          {unassignedPlayers.map(p => (
            <div 
              key={p.id} 
              draggable={isCommander} 
              onDragStart={(e) => e.dataTransfer.setData('playerId', p.id)} 
              className="recruit-card"
              title="Drag to a squadron"
            >
              <div className="recruit-info">
                <p className="recruit-name">{p.name}</p>
                <div className="recruit-vessel">
                    <img src={`/${getShipIcon(p.ship)}`} alt="" className="ship-icon-mini" />
                    {p.ship || "NO VESSEL"}
                </div>
              </div>
              
              {isCommander && (
                <select 
                  value="" 
                  className="input-field mini-select" 
                  onChange={(e) => onDrop({ preventDefault: () => {}, playerId: p.id }, e.target.value)}
                >
                  <option value="" disabled>MOVE</option>
                  {Object.keys(squadrons).filter(sq => squadrons[sq].active).map(sq => (
                    <option key={sq} value={sq}>{sq.toUpperCase()}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2. Squadron Grid */}
      <div className="squadron-grid">
        {Object.keys(squadrons).map(sqName => {
          const sq = squadrons[sqName];
          const isMySq = mySquadronKey === sqName;
          
          return (
            <div 
              key={sqName} 
              className={`squadron-card ${!sq.active ? 'inactive' : ''} ${isMySq ? 'active-sq' : ''}`}
            >
              {/* Header */}
              <div className="squadron-header">
                <div className="squadron-title-area">
                  {isCommander ? (
                    <input 
                      type="text" 
                      value={sq.name} 
                      onChange={(e) => onRenameSquadron(sqName, e.target.value)} 
                      className="squadron-name-input"
                    />
                  ) : (
                    <span className="squadron-name-label">{sq.name.toUpperCase()}</span>
                  )}
                </div>
                {isCommander && (
                  <button onClick={() => onToggleSquadron(sqName)} className="btn-ghost mini-btn">
                    {sq.active ? 'DEACTIVATE' : 'ACTIVATE'}
                  </button>
                )}
              </div>

              {/* Body */}
              <div 
                className="squadron-body" 
                onDragOver={(e) => e.preventDefault()} 
                onDrop={(e) => onDrop(e, sqName)}
              >
                {sq.active ? (
                  <>
                    {sq.players.map(pid => {
                      const p = fleetRoster.find(r => r.id === pid);
                      if (!p) return null;
                      
                      return (
                        <div 
                          key={p.id} 
                          draggable={isCommander} 
                          onDragStart={(e) => e.dataTransfer.setData('playerId', p.id)} 
                          className="assigned-player"
                        >
                          <div className="player-meta">
                            <p className="player-name">{p.name}</p>
                            <div className="player-vessel">
                              <img src={`/${getShipIcon(p.ship)}`} alt="" className="ship-icon-mini" />
                              {p.ship || "---"}
                            </div>
                          </div>

                          {isCommander ? (
                            <select 
                              value={p.role || 'Member'} 
                              className="input-field role-select-mini" 
                              onChange={(e) => onChangeRole(p.id, e.target.value)}
                            >
                              <option value="Member">MEMBER</option>
                              <option value="Squadron Lead">SQ LEAD</option>
                              <option value="Alternate Lead">ALT LEAD</option>
                            </select>
                          ) : (
                            p.role && p.role !== 'Member' && (
                              <span className="player-role-tag">{p.role}</span>
                            )
                          )}
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="locked-overlay">
                    <span>SQUADRON DEACTIVATED</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssignmentTab;
