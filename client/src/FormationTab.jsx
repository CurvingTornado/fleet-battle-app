import { SHIP_REGISTRY, getShipIcon } from './constants';

const ShipUnit = ({ playerId, fleetRoster, localPlayerId, isCompact, onDragStart, canDrag }) => {
  const p = fleetRoster.find(r => r.id === playerId);
  if (!p) return null;
  const isMe = p.id === localPlayerId;
  const icon = getShipIcon(p.ship);
  const rateClass = icon.split('.')[0]; 
  
  return (
    <div 
      className={`tactical-unit ${isCompact ? 'compact' : ''} ${rateClass}`}
      draggable={canDrag}
      onDragStart={onDragStart}
      style={{ cursor: canDrag ? 'grab' : 'default' }}
    >
      <div className="unit-icon-wrapper">
        <img src={`/${icon}`} alt="ship" className="unit-icon" />
        {isMe && <div className="unit-me-tag">YOU</div>}
      </div>
      <div className="unit-label glass-panel">
        <p className="unit-name">
          {p.name}
        </p>
        <p className="unit-ship text-cyan text-mono uppercase">{p.ship || "---"}</p>
        <p className="unit-role">{p.role || "Member"}</p>
      </div>
    </div>
  );
};

const FormationTab = ({ isCommander, squadrons, viewingSquadron, setViewingSquadron, mySquadronKey, fleetRoster, localPlayerId, onReorder }) => {
  
  const renderTacticalView = (sqName) => {
    const sq = squadrons[sqName];
    if (!sq || !sq.active) return <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontStyle: 'italic' }}>SQUADRON OFFLINE</div>;
    
    const players = sq.players || [];
    const formation = sq.formation || 'Line Ahead';
    const isCompact = players.length >= 10;
    const echelonOffset = isCompact ? 80 : 120;

    const me = fleetRoster.find(r => r.id === localPlayerId);
    const isLeadOfThisSquadron = me && (me.role === 'Squadron Lead' || me.role === 'Alternate Lead') && mySquadronKey === sqName;
    const canEdit = isCommander || isLeadOfThisSquadron;

    return (
      <div className="tactical-viewport">
        {/* Tactical Forward Indicator */}
        <div className="tactical-header">
          <span className="forward-arrow">▲</span>
          <span className="forward-text">Tactical Forward</span>
        </div>
        
        <div 
          className="formation-container custom-scrollbar"
          onWheel={(e) => {
            if (formation === 'Line Abreast' || formation.includes('Echelon')) {
              if (e.deltaY !== 0) {
                e.currentTarget.scrollLeft += e.deltaY;
              }
            }
          }}
        >
          <div className={`formation-layout formation-${formation.toLowerCase().replace(' ', '-')} ${isCompact ? 'compact' : ''}`}>
            {players.map((pid, idx) => (
              <div 
                key={pid} 
                className="formation-slot" 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const draggedId = e.dataTransfer.getData('playerId');
                  if (draggedId && canEdit) onReorder(sqName, draggedId, pid);
                }}
                style={
                  formation === 'Echelon Right' ? { transform: `translateX(${idx * echelonOffset}px)` } :
                  formation === 'Echelon Left' ? { transform: `translateX(-${idx * echelonOffset}px)` } :
                  {}
                }
              >
                <ShipUnit 
                  playerId={pid} 
                  fleetRoster={fleetRoster} 
                  localPlayerId={localPlayerId} 
                  isCompact={isCompact} 
                  onDragStart={(e) => e.dataTransfer.setData('playerId', pid)}
                  canDrag={canEdit}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="formation-tab">
      {isCommander && (
        <div className="formation-nav">
          {Object.keys(squadrons).map(name => (
            <button key={name} onClick={() => setViewingSquadron(name)} className={viewingSquadron === name ? 'active' : ''}>
              {name}
            </button>
          ))}
        </div>
      )}
      <div className="formation-content">
        {renderTacticalView(isCommander ? viewingSquadron : mySquadronName)}
      </div>
    </div>
  );
};

export default FormationTab;
