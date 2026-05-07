import { SHIP_REGISTRY, getShipIcon } from './constants';

/**
 * ShipUnit Component
 * 
 * Represents a single vessel in the tactical formation view.
 * Displays ship icon, name, assigned vessel, and role.
 */
const ShipUnit = ({ playerId, fleetRoster, localPlayerId, isCompact, onDragStart, canDrag }) => {
  const p = fleetRoster.find(r => r.id === playerId);
  if (!p) return null;
  const isMe = p.id === localPlayerId;
  const icon = getShipIcon(p.ship);
  
  // Determine CSS class based on ship rate for specific styling/sizing
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

/**
 * Formation Tab Component
 * 
 * Displays a visual "Order of Battle" for a specific squadron.
 * Features:
 * - Tactical Layout: Supports Line Ahead, Line Abreast, and Echelon formations.
 * - Reordering: Commanders and Squadron Leads can drag ships to change their position in the line.
 * - Automatic Scaling: Switches to a compact view when player counts are high (>= 10).
 */
const FormationTab = ({ isCommander, squadrons, viewingSquadron, setViewingSquadron, mySquadronKey, fleetRoster, localPlayerId, onReorder }) => {
  
  /**
   * Renders the tactical viewport for a given squadron.
   * Calculates offsets and transformations based on the selected formation.
   */
  const renderTacticalView = (sqName) => {
    const sq = squadrons[sqName];
    if (!sq || !sq.active) return <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontStyle: 'italic' }}>SQUADRON OFFLINE</div>;
    
    const players = sq.players || [];
    const formation = sq.formation || 'Line Ahead';
    
    // Switch to compact mode for high-density fleets to maintain visibility
    const isCompact = players.length >= 10;
    const echelonOffset = isCompact ? 80 : 120;

    const me = fleetRoster.find(r => r.id === localPlayerId);
    
    // Determine if the local user has permissions to reorder this squadron
    const isLeadOfThisSquadron = me && (me.role === 'Squadron Lead' || me.role === 'Alternate Lead') && mySquadronKey === sqName;
    const canEdit = isCommander || isLeadOfThisSquadron;

    return (
      <div className="tactical-viewport">
        {/* Tactical Forward Indicator - Shows direction of travel */}
        <div className="tactical-header">
          <span className="forward-arrow">▲</span>
          <span className="forward-text">Tactical Forward</span>
        </div>
        
        <div 
          className="formation-container custom-scrollbar"
          onWheel={(e) => {
            // Support horizontal scrolling with mouse wheel for Abreast/Echelon formations
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
                  // Apply dynamic horizontal offsets for Echelon formations
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
      {/* Navigation for Commanders to switch between squadrons */}
      {isCommander && (
        <div className="formation-nav">
          {Object.keys(squadrons).map(name => (
            <button key={name} onClick={() => setViewingSquadron(name)} className={viewingSquadron === name ? 'active' : ''}>
              {name.toUpperCase()}
            </button>
          ))}
        </div>
      )}
      
      <div className="formation-content">
        {/* Render the selected squadron (for commander) or the user's own squadron (for members) */}
        {renderTacticalView(isCommander ? viewingSquadron : mySquadronKey)}
      </div>
    </div>
  );
};

export default FormationTab;
