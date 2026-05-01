const AssignmentTab = ({ unassignedPlayers, isCommander, squadrons, initialSquadrons, fleetRoster, localPlayerId, mySquadronKey, onDrop, onToggleSquadron, onFormationChange, onRenameSquadron, onChangeRole }) => {
  const me = fleetRoster.find(r => r.id === localPlayerId);
  const isLead = me && (me.role === 'Squadron Lead' || me.role === 'Alternate Lead');
  
  return (
    <div className="assignment-tab">
      
      {/* Recruit Pool */}
      <div className="recruit-pool glass-panel" onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, 'unassigned')}>
        <h3 className="recruit-pool-title">Recruit Pool</h3>
        <div className="recruit-list custom-scrollbar">
          {unassignedPlayers.map(p => (
            <div key={p.id} draggable={isCommander} onDragStart={(e) => e.dataTransfer.setData('playerId', p.id)} className="recruit-card">
              <div style={{ overflow: 'hidden' }}>
                <p style={{ fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                <p className="text-cyan text-mono uppercase" style={{ fontSize: '10px', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.ship || "NO VESSEL"}</p>
              </div>
              {isCommander && (
                <select 
                  onChange={(e) => onDrop({ preventDefault: () => {}, dataTransfer: { getData: () => p.id } }, e.target.value)}
                  className="input-field text-mono uppercase"
                  style={{ padding: '6px', fontSize: '10px', width: '90px' }}
                  value=""
                >
                  <option value="" disabled>Assign...</option>
                  {Object.keys(squadrons).filter(sq => squadrons[sq].active).map(sq => (
                    <option key={sq} value={sq}>{sq}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Squadron Grid */}
      <div className="squadron-grid custom-scrollbar">
        {["Vanguard", "Center/Main Body", "Rear", "Screen", "Reserve"].map(sqName => {
          const sq = squadrons[sqName] || initialSquadrons[sqName];
          const isReserve = sqName === 'Reserve';
          
          return (
            <div key={sqName} className={`squadron-card ${sq.active ? '' : 'inactive'}`} style={isReserve ? { gridColumn: '1 / -1' } : {}}>
              
              <div className="squadron-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {isCommander && (
                    <div onClick={() => onToggleSquadron(sqName)} className={`toggle-switch ${sq.active ? 'on' : 'off'}`} style={{ cursor: 'pointer' }}>
                      <div className="toggle-knob"></div>
                    </div>
                  )}
                  <h3 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', flex: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    {isCommander ? (
                      <input 
                        type="text" 
                        value={sq.name} 
                        onChange={(e) => onRenameSquadron(sqName, e.target.value)} 
                        className="input-field text-mono" 
                        style={{ padding: '4px', fontSize: '12px', background: 'rgba(0,0,0,0.5)', width: '100%', maxWidth: '150px' }} 
                      />
                    ) : (
                      sq.name
                    )}
                    <span style={{ color: sq.active ? 'var(--text-success)' : 'var(--text-error)' }}>{sq.active ? '(ON)' : '(OFF)'}</span>
                  </h3>
                </div>
                {sq.active && (
                  <select value={sq.formation} onChange={(e) => onFormationChange(sqName, e.target.value)} disabled={!isCommander && !(isLead && mySquadronKey === sqName)} className="input-field text-mono uppercase" style={{ padding: '6px 12px', fontSize: '10px' }}>
                    <option>Line Ahead</option>
                    <option>Line Abreast</option>
                    <option>Echelon Right</option>
                    <option>Echelon Left</option>
                  </select>
                )}
              </div>
              
              <div className="squadron-body" onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, sqName)}>
                {sq.active ? (
                  <>
                    {(sq.players || []).map(pid => {
                      const p = fleetRoster.find(r => r.id === pid);
                      if (!p) return null;
                      return (
                        <div key={p.id} draggable={isCommander} onDragStart={(e) => e.dataTransfer.setData('playerId', p.id)} className="assigned-player" style={{ display: 'flex', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={{ fontWeight: 600 }}>{p.name} {p.tag && <span style={{ fontSize: '10px', opacity: 0.6 }}>[{p.tag}]</span>}</span>
                            {isCommander && (
                              <select value={p.role || 'Member'} onChange={(e) => onChangeRole(p.id, e.target.value)} className="input-field text-mono uppercase" style={{ padding: '2px 4px', fontSize: '9px', width: 'auto', marginLeft: '8px' }}>
                                <option value="Member">Member</option>
                                <option value="Alternate Lead">Alt Lead</option>
                                <option value="Squadron Lead">Squad Lead</option>
                              </select>
                            )}
                          </div>
                          <span className="text-cyan text-mono uppercase" style={{ fontSize: '10px', marginTop: '4px', display: 'inline-block' }}>{p.ship || "---"}</span>
                          {!isCommander && p.role && p.role !== 'Member' && (
                            <span style={{ fontSize: '9px', color: 'var(--text-accent)', marginTop: '4px', fontWeight: 'bold' }}>{p.role}</span>
                          )}
                        </div>
                      );
                    })}
                    <div className="drop-zone">
                      [ Drop Recruit Here ]
                    </div>
                  </>
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Locked</div>
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
