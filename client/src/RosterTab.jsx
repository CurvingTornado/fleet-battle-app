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

const RosterTab = ({ fleetRoster, discordApplicants = [], localPlayerId, isCommander, onAddShipOffer, onRemoveShipOffer, onToggleSelection, onAssignShip }) => {
  const [selectedLocalRate, setSelectedLocalRate] = useState('');
  const [selectedLocalShip, setSelectedLocalShip] = useState('');
  const [selectedLocalBuild, setSelectedLocalBuild] = useState('Standard');
  const [isDiscordPoolOpen, setIsDiscordPoolOpen] = useState(true);
  
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
                      {/* Icy nautical blue for assigned vessel name — more legible than brass */}
                      <span style={{ fontWeight: 600, fontSize: '13px', color: p.ship ? 'var(--color-vessel)' : 'inherit' }}>
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

      {/* 3. Discord Applicant Pool */}
      {(isCommander || discordApplicants.length > 0) && (
        <div className="discord-pool-container glass-panel" style={{ marginTop: '8px' }}>
          <div 
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '10px' }}
            onClick={() => setIsDiscordPoolOpen(!isDiscordPoolOpen)}
          >
            <h2 style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.05em', color: 'rgba(185, 195, 255, 0.85)', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Discord Applicant Pool ({discordApplicants.length})
            </h2>
            <span style={{ fontSize: '14px', opacity: 0.7 }}>{isDiscordPoolOpen ? '▼' : '▶'}</span>
          </div>
          
          {isDiscordPoolOpen && (
            <div style={{ padding: '10px', paddingTop: 0 }}>
              {discordApplicants.length === 0 ? (
                <p style={{ fontSize: '11px', opacity: 0.5, fontStyle: 'italic', margin: 0 }}>No pending applications from Discord.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                  {discordApplicants.map(app => (
                    <div key={app.id} className="ship-pill" style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(130, 145, 255, 0.35)', background: 'rgba(88, 101, 242, 0.1)', padding: '6px 12px' }}>
                      {app.avatar && <img src={app.avatar} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />}
                      <span style={{ fontWeight: 'bold', fontSize: '12px' }}>{app.name}</span>
                      <span style={{ fontSize: '10px', opacity: 0.7, fontStyle: 'italic' }}>Awaiting Join</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default RosterTab;
