import React, { useState } from 'react';
import { SHIP_REGISTRY, getShipIcon } from './constants';

/**
 * Roster Tab Component
 * 
 * Handles player self-registration and commander's fleet management.
 */
const RosterTab = ({ fleetRoster, discordApplicants = [], localPlayerId, isCommander, onAddShipOffer, onRemoveShipOffer, onToggleSelection, onAssignShip }) => {
  const [selectedLocalRate, setSelectedLocalRate] = useState('');
  const [selectedLocalShip, setSelectedLocalShip] = useState('');
  const [selectedLocalBuild, setSelectedLocalBuild] = useState('Standard');
  const [isDiscordPoolOpen, setIsDiscordPoolOpen] = useState(true);
  
  const me = fleetRoster.find(p => p.id === localPlayerId);

  const handleAddClick = () => {
    if (selectedLocalShip && selectedLocalShip !== 'Pending Assignment') {
      const buildSuffix = selectedLocalBuild !== 'Standard' ? ` (${selectedLocalBuild})` : '';
      onAddShipOffer(`${selectedLocalShip}${buildSuffix}`);
    }
  };

  return (
    <div className="roster-tab">
      
      {/* 1. Registration Panel */}
      <div className="roster-registration-panel glass-panel">
        <div className="registration-info">
          <h2 className="registration-title">Vessel Application</h2>
          <div className="applied-vessels-list">
            {me?.offers?.map(ship => (
              <button 
                key={ship} 
                className="ship-pill ship-pill-my"
                onClick={() => onRemoveShipOffer(ship)}
                title="Click to remove"
              >
                {ship} <span className="remove-icon">✕</span>
              </button>
            ))}
            {(!me?.offers || me.offers.length === 0) && (
              <p className="no-offers-hint">No vessels registered for this operation.</p>
            )}
          </div>
        </div>
        
        <div className="registration-controls">
          <div className="controls-row">
            <select 
              value={selectedLocalRate} 
              onChange={(e) => setSelectedLocalRate(e.target.value)} 
              className="input-field text-mono uppercase"
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
          >
            <option value="Pending Assignment">{selectedLocalRate ? '-- SELECT VESSEL --' : '-- SELECT RATE FIRST --'}</option>
            {selectedLocalRate && SHIP_REGISTRY[selectedLocalRate].map(ship => (
              <option key={ship} value={ship}>{ship.toUpperCase()}</option>
            ))}
          </select>

          <button 
            onClick={handleAddClick}
            className="btn-primary"
          >
            APPLY TO OPERATION
          </button>
        </div>
      </div>

      {/* 2. Roster Table */}
      <div className="roster-table-container">
        <table className="roster-table">
          <thead>
            <tr>
              {isCommander && <th style={{ width: '50px' }}>DEPLOY</th>}
              <th>COMMANDER</th>
              <th>AVAILABLE VESSELS</th>
              <th>ROLE</th>
              <th style={{ width: '250px' }}>ASSIGNED SHIP</th>
            </tr>
          </thead>
          <tbody>
            {fleetRoster.map(p => (
              <tr key={p.id} className={`${p.id === localPlayerId ? 'roster-row-selected' : ''}`}>
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

                <td>
                  <div className="commander-cell">
                    <div className={`status-dot ${p.status === 'online' ? 'connected' : 'disconnected'}`} />
                    <div className="name-stack">
                      <div className="p-name">{p.name}</div>
                      <div className="p-tag">{p.tag || 'NO TAG'}</div>
                    </div>
                  </div>
                </td>

                <td>
                  <div className="vessel-pool">
                    {(p.offers || []).map(ship => (
                      <span 
                        key={ship} 
                        className={`ship-pill ${p.id === localPlayerId ? 'ship-pill-my' : ''}`}
                      >
                        {ship}
                      </span>
                    ))}
                    {(!p.offers || p.offers.length === 0) && <span className="no-offers">NO OFFERS</span>}
                  </div>
                </td>

                <td>
                  <span className={`ship-pill role-pill ${p.role !== 'Member' ? 'ship-pill-my' : ''}`}>
                    {(p.role || 'Member').toUpperCase()}
                  </span>
                </td>

                <td>
                  {isCommander ? (
                    <select 
                      value={p.ship || ''} 
                      onChange={(e) => onAssignShip(p.id, e.target.value)}
                      className="input-field text-mono"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                      <option value="">-- UNASSIGNED --</option>
                      {(p.offers || []).map(ship => (
                        <option key={ship} value={ship}>{ship.toUpperCase()}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="assigned-ship-cell">
                      {p.ship && <img src={`/${getShipIcon(p.ship)}`} alt="" className="ship-icon-small" />}
                      <span className={`assigned-ship-name ${p.ship ? 'active' : ''}`}>
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

      {/* 3. Discord Pool */}
      {(isCommander || discordApplicants.length > 0) && (
        <div className="discord-pool-container glass-panel">
          <div className="discord-pool-header" onClick={() => setIsDiscordPoolOpen(!isDiscordPoolOpen)}>
            <h2 className="discord-pool-title">
              Discord Applicant Pool ({discordApplicants.length})
            </h2>
            <span className="toggle-icon">{isDiscordPoolOpen ? '▼' : '▶'}</span>
          </div>
          
          {isDiscordPoolOpen && (
            <div className="discord-pool-body">
              {discordApplicants.length === 0 ? (
                <p className="no-applicants">No pending applications from Discord.</p>
              ) : (
                <div className="applicants-grid">
                  {discordApplicants.map(app => (
                    <div key={app.id} className="ship-pill applicant-card">
                      {app.avatar && <img src={app.avatar} alt="" className="avatar-small" />}
                      <span className="applicant-name">{app.name}</span>
                      <span className="applicant-status">Awaiting Join</span>
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
