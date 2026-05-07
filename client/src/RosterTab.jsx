import React, { useState } from 'react';
import { SHIP_REGISTRY, getShipIcon } from './constants';

/**
 * Roster Tab Component
 * 
 * Handles player self-registration and commander's fleet management.
 * Features:
 * - Vessel Registration: Players can select ships they are willing to bring to the battle.
 * - Live Roster Table: Displays all players, their status, ship offers, and assigned roles.
 * - Commander Controls: Lead can mark players as 'Deploying' (selected) and assign specific ships.
 */

const RosterTab = ({ fleetRoster, localPlayerId, isCommander, onAddShipOffer, onRemoveShipOffer, onToggleSelection, onAssignShip }) => {
  const [selectedLocalRate, setSelectedLocalRate] = useState('');
  const [selectedLocalShip, setSelectedLocalShip] = useState('');
  const [selectedLocalBuild, setSelectedLocalBuild] = useState('Standard');
  
  // Find the current player's data in the roster
  const me = fleetRoster.find(p => p.id === localPlayerId);

  const handleAddClick = () => {
    if (selectedLocalShip && selectedLocalShip !== 'Pending Assignment') {
      const buildSuffix = selectedLocalBuild !== 'Standard' ? ` (${selectedLocalBuild})` : '';
      onAddShipOffer(`${selectedLocalShip}${buildSuffix}`);
    }
  };

  return (
    <div className="roster-tab">
      
      {/* 1. Registration Panel (For all players) */}
      <div className="roster-top-panel glass-panel">
        <div style={{ flex: 1, minWidth: '250px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-accent)', textTransform: 'uppercase' }}>Vessel Application</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
            {me?.offers?.map(ship => (
              <span 
                key={ship} 
                className="ship-pill ship-pill-my"
                onClick={() => onRemoveShipOffer(ship)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {ship} <span style={{ opacity: 0.5 }}>✕</span>
              </span>
            ))}
            {(!me?.offers || me.offers.length === 0) && (
              <span style={{ fontSize: '11px', opacity: 0.5, fontStyle: 'italic' }}>No vessels registered for this operation.</span>
            )}
          </div>
        </div>
        
        <div className="roster-controls" style={{ flex: 1.5 }}>
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <select 
              value={selectedLocalRate} 
              onChange={(e) => setSelectedLocalRate(e.target.value)} 
              className="input-field text-mono uppercase"
              style={{ flex: 1, fontSize: '11px' }}
            >
              <option value="">-- RATE --</option>
              {Object.keys(SHIP_REGISTRY).map(rate => (
                <option key={rate} value={rate}>{rate.toUpperCase()}</option>
              ))}
            </select>

            <select 
              value={selectedLocalBuild} 
              onChange={(e) => setSelectedLocalBuild(e.target.value)} 
              className="input-field text-mono uppercase"
              style={{ flex: 1, fontSize: '11px' }}
            >
              <option value="Standard">STANDARD</option>
              <option value="Brawler">BRAWLER</option>
              <option value="Boarder">BOARDER</option>
              <option value="Sniper">SNIPER</option>
            </select>
          </div>

          <select 
            value={selectedLocalShip} 
            onChange={(e) => setSelectedLocalShip(e.target.value)} 
            disabled={!selectedLocalRate}
            className="input-field text-mono uppercase"
            style={{ width: '100%', fontSize: '12px' }}
          >
            <option value="Pending Assignment">{selectedLocalRate ? '-- SELECT VESSEL --' : '-- SELECT RATE FIRST --'}</option>
            {selectedLocalRate && SHIP_REGISTRY[selectedLocalRate].map(ship => (
              <option key={ship} value={ship}>{ship.toUpperCase()}</option>
            ))}
          </select>

          <button 
            onClick={handleAddClick}
            className="btn-primary"
            style={{ width: '100%', padding: '10px', fontSize: '12px' }}
          >
            APPLY TO OPERATION
          </button>
        </div>
      </div>

      {/* 2. Roster Table (Order of Battle) */}
      <div className="roster-table-container glass-panel">
        <table className="roster-table">
          <thead>
            <tr>
              {isCommander && <th style={{ width: '50px' }}>DEPLOY</th>}
              <th>COMMANDER / SHIP TAG</th>
              <th>AVAILABLE VESSELS (OFFERS)</th>
              <th>ASSIGNED ROLE</th>
              <th style={{ width: '250px' }}>ASSIGNED SHIP</th>
            </tr>
          </thead>
          <tbody>
            {fleetRoster.map(p => (
              <tr key={p.id} className={`${p.id === localPlayerId ? 'roster-row-selected' : ''} ${p.selected ? 'deployed' : ''}`}>
                
                {/* Deployment Checkbox (Commander Only) */}
                {isCommander && (
                  <td>
                    <input 
                      type="checkbox" 
                      checked={p.selected} 
                      onChange={() => onToggleSelection(p.id)}
                      className="checkbox-custom"
                    />
                  </td>
                )}

                {/* Identity & Status */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className={`status-dot ${p.status === 'online' ? 'connected' : 'disconnected'}`} style={{ width: '6px', height: '6px' }}></div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px' }}>{p.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{p.tag || 'NO TAG'}</div>
                    </div>
                  </div>
                </td>

                {/* Ship Offers List */}
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {(p.offers || []).map(ship => (
                      <span 
                        key={ship} 
                        className={`ship-pill ${p.id === localPlayerId ? 'ship-pill-my' : ''}`}
                        onClick={() => p.id === localPlayerId && onRemoveShipOffer(ship)}
                        style={{ cursor: p.id === localPlayerId ? 'pointer' : 'default' }}
                      >
                        {ship} {p.id === localPlayerId && '×'}
                      </span>
                    ))}
                    {(!p.offers || p.offers.length === 0) && <span style={{ opacity: 0.3, fontSize: '10px' }}>NO OFFERS</span>}
                  </div>
                </td>

                {/* Role Badge */}
                <td>
                  <span className={`ship-pill ${p.role !== 'Member' ? 'ship-pill-my' : ''}`} style={{ border: 'none', background: 'rgba(0,0,0,0.3)', fontSize: '9px' }}>
                    {(p.role || 'Member').toUpperCase()}
                  </span>
                </td>

                {/* Ship Assignment Dropdown (Commander Only) */}
                <td>
                  {isCommander ? (
                    <select 
                      value={p.ship || ''} 
                      onChange={(e) => onAssignShip(p.id, e.target.value)}
                      className="input-field text-mono mini"
                      style={{ width: '100%', fontSize: '11px', background: 'rgba(0,0,0,0.3)' }}
                    >
                      <option value="">-- UNASSIGNED --</option>
                      {(p.offers || []).map(ship => (
                        <option key={ship} value={ship}>{ship.toUpperCase()}</option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {p.ship && <img src={`/${getShipIcon(p.ship)}`} alt="" style={{ width: '16px', height: '16px' }} />}
                      <span style={{ fontWeight: 600, fontSize: '12px', color: p.ship ? 'var(--text-accent)' : 'inherit' }}>
                        {p.ship ? p.ship.toUpperCase() : '---'}
                      </span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RosterTab;
