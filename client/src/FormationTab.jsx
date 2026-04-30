const ShipUnit = ({ playerId, fleetRoster, localPlayerId }) => {
  const p = fleetRoster.find(r => r.id === playerId);
  if (!p) return null;
  const isMe = p.id === localPlayerId;
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontSize: '96px', filter: 'drop-shadow(0 0 20px rgba(0, 212, 255, 0.5))' }}>⛵</div>
      <div className="glass-panel" style={{ marginTop: '16px', textAlign: 'center', padding: '16px', minWidth: '170px' }}>
        <p style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '0.05em', whiteSpace: 'nowrap', color: 'var(--text-main)' }}>
          {p.name} {isMe && <span style={{ color: 'var(--text-error)', fontWeight: 700, fontStyle: 'italic', marginLeft: '10px' }}>(YOU)</span>}
        </p>
        <p className="text-cyan text-mono uppercase" style={{ fontSize: '11px', marginTop: '4px', whiteSpace: 'nowrap' }}>{p.ship || "---"}</p>
      </div>
    </div>
  );
};

const FormationTab = ({ isCommander, squadrons, viewingSquadron, setViewingSquadron, mySquadronName, fleetRoster, localPlayerId }) => {
  
  const renderTacticalView = (sqName) => {
    const sq = squadrons[sqName];
    if (!sq || !sq.active) return <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontStyle: 'italic' }}>SQUADRON OFFLINE</div>;
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%', overflow: 'hidden' }}>
        
        {/* Tactical Forward Indicator */}
        <div style={{ height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', opacity: 0.3, flexShrink: 0 }}>
          <span style={{ color: 'var(--text-accent)', fontSize: '48px', lineHeight: 1 }}>▲</span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>Tactical Forward</span>
        </div>
        
        {/* Grid Area */}
        <div className="custom-scrollbar" style={{ flex: 1, width: '100%', overflow: 'auto', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1.5px, transparent 1.5px)', backgroundSize: '60px 60px' }}>
          <div style={{ minWidth: '100%', minHeight: '100%', display: 'grid', placeItems: 'center', padding: '80px' }}>
            <table style={{ borderCollapse: 'separate', borderSpacing: '40px' }}>
              <tbody>
                {sq.formation === 'Line Abreast' ? (
                  <tr>
                    {(sq.players || []).map((pid) => (
                      <td key={pid} style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                        <ShipUnit playerId={pid} fleetRoster={fleetRoster} localPlayerId={localPlayerId} />
                      </td>
                    ))}
                  </tr>
                ) : (
                  (sq.players || []).map((pid, idx) => (
                    <tr key={pid}>
                      <td style={{ verticalAlign: 'middle', textAlign: 'center', paddingLeft: sq.formation === 'Echelon Right' ? `${idx * 140}px` : '0px', paddingRight: sq.formation === 'Echelon Left' ? `${idx * 140}px` : '0px' }}>
                        <ShipUnit playerId={pid} fleetRoster={fleetRoster} localPlayerId={localPlayerId} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    );
  };

  return (
    <div className="formation-tab glass-panel">
      {isCommander && (
        <div className="formation-nav">
          {Object.keys(squadrons).map(name => (
            <button key={name} onClick={() => setViewingSquadron(name)} className={viewingSquadron === name ? 'active' : ''}>
              {name}
            </button>
          ))}
        </div>
      )}
      {renderTacticalView(isCommander ? viewingSquadron : mySquadronName)}
    </div>
  );
};

export default FormationTab;