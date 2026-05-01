import { useState } from 'react';

const shipRegistry = {
  "Rate 1": ["12 Apostolov", "Victory", "La Royale", "Santisima Trinidad", "Huracan"],
  "Rate 2": ["Ingermanland", "Sans Pareil", "Redoutable", "Adventure", "Octopus", "St. Pavel", "Firestorm", "Neptuno", "Vasa", "Montanes"],
  "Rate 3": ["Poltava", "Anson", "Bellona", "Kobukson", "Deadfish", "Le Saint Louis", "Azov", "Iberia", "Shen"],
  "Rate 4": ["Surprise", "Essex", "Constitution", "Devourer", "Red Arrow", "Sparrow", "Three Hierarchs", "Flying Cloud"],
  "Rate 5": ["La Creole", "Black Wind", "San Martin", "La Requin", "Black Prince", "Eagle", "Axel Thorson", "Kwee Song", "Southhampton"],
  "Rate 6": ["Le Serf", "La Salamandre", "Phoenix", "Polacca", "Balloon", "Savannah", "Golden Apostle", "Shunsen"],
  "Rate 7": ["Pickle", "Horizont", "Friede"]
};

const RosterTab = ({ fleetRoster, localPlayerId, isCommander, onAddShipOffer, onRemoveShipOffer, onToggleSelection, onAssignShip }) => {
  const [selectedLocalRate, setSelectedLocalRate] = useState('');
  const [selectedLocalShip, setSelectedLocalShip] = useState('');
  const [selectedLocalBuild, setSelectedLocalBuild] = useState('Standard');

  const handleAddClick = () => {
    if (selectedLocalShip && selectedLocalShip !== 'Pending Assignment') {
      const buildSuffix = selectedLocalBuild !== 'Standard' ? ` (${selectedLocalBuild})` : '';
      onAddShipOffer(`${selectedLocalShip}${buildSuffix}`);
    }
  };

  return (
    <div className="roster-tab">
      
      {/* Top Panel */}
      <div className="roster-top-panel">
        <div style={{ flex: 1, minWidth: 0, marginRight: '16px' }}>
          <h3 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', color: 'var(--text-main)' }}>Vessel Application</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {fleetRoster.find(p => p.id === localPlayerId)?.offers?.map((s, i) => (
              <div key={i} className="ship-pill ship-pill-my" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {s}
                <button onClick={() => onRemoveShipOffer(s)} style={{ color: 'var(--text-error)', background: 'rgba(214, 40, 40, 0.2)', borderRadius: '50%', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', border: '1px solid var(--text-error)', padding: 0 }}>✕</button>
              </div>
            ))}
          </div>
        </div>
        <div className="roster-controls">
          <select value={selectedLocalRate} onChange={(e) => setSelectedLocalRate(e.target.value)} className="input-field text-mono uppercase" style={{ padding: '10px' }}>
            <option value="">-- Rate --</option>
            {Object.keys(shipRegistry).map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={selectedLocalShip} onChange={(e) => setSelectedLocalShip(e.target.value)} disabled={!selectedLocalRate} className="input-field text-mono uppercase" style={{ width: '200px', padding: '10px' }}>
            <option value="Pending Assignment">{selectedLocalRate ? '-- Select Ship --' : '-- Select Rate First --'}</option>
            {selectedLocalRate && shipRegistry[selectedLocalRate].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={selectedLocalBuild} onChange={(e) => setSelectedLocalBuild(e.target.value)} className="input-field text-mono uppercase" style={{ padding: '10px' }}>
            <option value="Standard">Standard</option>
            <option value="Brawler">Brawler</option>
            <option value="Boarder">Boarder</option>
            <option value="Sniper">Sniper</option>
          </select>
          <button onClick={handleAddClick} className="btn-primary" style={{ padding: '10px 20px', fontSize: '11px' }}>Select Ship</button>
        </div>
      </div>

      {/* Table Container */}
      <div className="roster-table-container">
        <table className="roster-table">
          <thead>
            <tr>
              <th style={{ width: '100px' }}>Deploy<br/><span style={{ fontSize: '9px', opacity: 0.7 }}>(To Recruit Pool)</span></th>
              <th style={{ width: '120px' }}>Status</th>
              <th>Commander</th>
              <th>Guild</th>
              <th>Offered Ships</th>
              <th style={{ width: '200px' }}>Assigned Vessel</th>
            </tr>
          </thead>
          <tbody>
            {fleetRoster.map(p => (
              <tr key={p.id} className={p.selected ? 'roster-row-selected' : ''}>
                
                <td>
                  <input type="checkbox" checked={p.selected || false} onChange={() => onToggleSelection(p.id)} disabled={!isCommander} className="checkbox-custom"/>
                </td>
                
                <td className="text-mono uppercase" style={{ fontSize: '11px', fontWeight: 700, color: p.status === 'online' ? 'var(--text-success)' : 'var(--text-muted)' }}>
                  {p.status}
                </td>
                
                <td style={{ fontWeight: 600, color: p.id === localPlayerId ? 'var(--text-accent)' : 'var(--text-main)' }}>
                  {p.name}
                </td>
                
                <td className="text-mono uppercase" style={{ fontSize: '10px', color: 'var(--text-accent)', fontWeight: 700 }}>
                  {p.tag || '---'}
                </td>
                
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                    {(p.offers || []).map((s, i) => (
                      <div key={i} className="ship-pill" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {s}
                        {p.id === localPlayerId && (
                          <button onClick={() => onRemoveShipOffer(s)} style={{ color: 'var(--text-error)', background: 'rgba(214, 40, 40, 0.2)', borderRadius: '50%', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', border: '1px solid var(--text-error)', padding: 0 }}>✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                </td>
                
                <td>
                  {isCommander ? (
                    <select value={p.ship || ''} onChange={(e) => onAssignShip(p.id, e.target.value)} className="input-field text-mono uppercase" style={{ width: '100%', fontSize: '10px', padding: '8px', textAlign: 'center' }}>
                      <option value="">-- Assign --</option>
                      {(p.offers || []).map((s, i) => <option key={i} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <span className="text-cyan text-mono uppercase" style={{ fontSize: '11px', fontWeight: 700 }}>{p.ship || "---"}</span>
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
