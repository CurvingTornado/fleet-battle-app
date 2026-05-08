import React from 'react';
import { getShipIcon } from './constants';

/**
 * Assignment Tab Component
 * 
 * Provides a drag-and-drop interface for commanders to organize players into squadrons.
 * Features:
 * - Recruit Pool: All players who have applied (selected) but aren't in a squadron.
 * - Squadron Grid: Active and inactive squadron containers.
 * - Role Management: Quick dropdowns for assigning Squadron Lead or Alternate Lead roles.
 */

const AssignmentTab = ({ 
  unassignedPlayers, isCommander, squadrons, fleetRoster, 
  mySquadronKey, onDrop, onToggleSquadron, 
  onRenameSquadron, onChangeRole 
}) => {
  return (
    <div className="assignment-tab">
      
      {/* 1. Recruit Pool (Source of Dragging) */}
      <div 
        className="recruit-pool glass-panel" 
        onDragOver={(e) => e.preventDefault()} 
        onDrop={(e) => onDrop(e, 'unassigned')}
      >
        <h2 className="recruit-pool-title">Recruit Pool</h2>
        <div className="recruit-list custom-scrollbar">
          {unassignedPlayers.length === 0 && (
            <p style={{ textAlign: 'center', opacity: 0.5, fontSize: '12px', marginTop: '20px' }}>No unassigned recruits.</p>
          )}
          {unassignedPlayers.map(p => (
            <div 
              key={p.id} 
              draggable={isCommander} 
              onDragStart={(e) => e.dataTransfer.setData('playerId', p.id)} 
              className="recruit-card"
              title="Drag to a squadron"
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                <p className="text-cyan text-mono uppercase" style={{ fontSize: '10px', marginTop: '4px' }}>
                    <img src={`/${getShipIcon(p.ship)}`} alt="" className="mini-rate-icon" style={{width: '12px', height: '12px', verticalAlign: 'middle', marginRight: '4px'}} />
                    {p.ship || "NO VESSEL"}
                </p>
              </div>
              {/* Fallback dropdown for mobile/non-drag devices */}
              {isCommander && (
                <select 
                  value="" 
                  className="input-field mini" 
                  style={{ width: '80px', padding: '4px', fontSize: '10px' }}
                  onChange={(e) => onDrop({ preventDefault: () => {}, playerId: p.id }, e.target.value)}
                >
                  <option value="" disabled>MOVE TO...</option>
                  {Object.keys(squadrons).filter(sq => squadrons[sq].active).map(sq => (
                    <option key={sq} value={sq}>{sq.toUpperCase()}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2. Squadron Grid (Drop Targets) */}
      <div className="squadron-grid custom-scrollbar">
        {Object.keys(squadrons).map(sqName => {
          const sq = squadrons[sqName];
          const isMySq = mySquadronKey === sqName;
          
          return (
            <div 
              key={sqName} 
              className={`squadron-card ${!sq.active ? 'inactive' : ''}`}
              style={isMySq ? { borderColor: 'var(--border-active)', boxShadow: '0 0 20px rgba(217, 160, 91, 0.1)' } : {}}
            >
              {/* Header: Name and Activation Toggle */}
              <div className="squadron-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  {isCommander ? (
                    <input 
                      type="text" 
                      value={sq.name} 
                      onChange={(e) => onRenameSquadron(sqName, e.target.value)} 
                      className="input-field mini" 
                      style={{ fontSize: '12px', fontWeight: 700, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', padding: '4px 8px', width: '100%', maxWidth: '200px' }}
                    />
                  ) : (
                    <span style={{ fontSize: '12px', fontWeight: 700, color: isMySq ? 'var(--text-accent)' : 'var(--text-main)' }}>{sq.name.toUpperCase()}</span>
                  )}
                </div>
                {isCommander && (
                  <button onClick={() => onToggleSquadron(sqName)} className="squadron-toggle-btn">
                    {sq.active ? 'DEACTIVATE' : 'ACTIVATE'}
                  </button>
                )}
              </div>

              {/* Body: Player List and Drop Zones */}
              <div className="squadron-body-container">
                <div 
                  className="squadron-body custom-scrollbar" 
                  onDragOver={(e) => e.preventDefault()} 
                  onDrop={(e) => onDrop(e, sqName)}
                >
                  {sq.active ? (
                    <>
                      {sq.players.map(pid => {
                        const p = fleetRoster.find(r => r.id === pid);
                        if (!p) return null;
                        const isMini = sq.players.length > 8;
                        
                        return (
                          <div 
                            key={p.id} 
                            draggable={isCommander} 
                            onDragStart={(e) => e.dataTransfer.setData('playerId', p.id)} 
                            className={`assigned-player ${isMini ? 'mini' : ''}`}
                            title="Drag to another squadron or pool"
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontWeight: 600, fontSize: '12px', margin: 0 }}>{p.name}</p>
                              <p className="text-cyan text-mono uppercase" style={{ fontSize: '9px', margin: 0, opacity: 0.8 }}>
                                <img src={`/${getShipIcon(p.ship)}`} alt="" className="mini-rate-icon" style={{width: '10px', height: '10px', marginRight: '4px'}} />
                                {p.ship || "---"}
                              </p>
                            </div>

                            {/* Role Selection (Commander Only) */}
                            {isCommander && (
                              <select 
                                value={p.role || 'Member'} 
                                className="input-field mini" 
                                style={{ fontSize: '8px', padding: '2px', width: 'auto', background: 'rgba(0,0,0,0.5)' }}
                                onChange={(e) => onChangeRole(p.id, e.target.value)}
                              >
                                <option value="Member">MEMBER</option>
                                <option value="Squadron Lead">SQ LEAD</option>
                                <option value="Alternate Lead">ALT LEAD</option>
                              </select>
                            )}
                            {!isCommander && p.role && p.role !== 'Member' && (
                                <span style={{ fontSize: '8px', background: 'var(--text-accent)', color: '#000', padding: '2px 4px', borderRadius: '2px', fontWeight: 'bold' }}>{p.role.toUpperCase()}</span>
                            )}
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <div className="locked-overlay">
                      <span style={{ opacity: 0.3, letterSpacing: '0.2em', fontWeight: 'bold' }}>SQUADRON DEACTIVATED</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssignmentTab;
