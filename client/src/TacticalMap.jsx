import React, { useState, useEffect, useRef, Component } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Circle, Text, Group, Rect } from 'react-konva';
import useImage from 'use-image';

class MapErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }
  static getDerivedStateFromError(error) { return { hasError: true, errorMessage: error.toString() }; }
  componentDidCatch(error, errorInfo) { console.error("MAP CRASH CAUGHT:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(50, 0, 0, 0.5)', border: '2px solid var(--text-error)', margin: '24px', borderRadius: 'var(--radius-xl)', padding: '40px', textAlign: 'center', boxShadow: '0 0 50px rgba(214, 40, 40, 0.2)' }}>
          <h2 style={{ fontSize: '30px', fontWeight: 900, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Fatal Map Error</h2>
          <div style={{ background: 'rgba(0,0,0,0.9)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--text-error)', maxWidth: '768px', width: '100%', overflow: 'auto', marginTop: '16px' }}>
            <p className="text-mono" style={{ color: 'var(--text-error)', textAlign: 'left', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{this.state.errorMessage}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const VIRTUAL_WIDTH = 1920;
const VIRTUAL_HEIGHT = 1080;

const TacticalMapContent = ({ 
  socket, activeRoom, isCommander, squadrons, localPlayerId, fleetRoster, activeMap, 
  lines, markers, squadronPositions 
}) => {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  
  const [dimensions, setDimensions] = useState({ width: 800, height: 600, scale: 0.5 });
  const [mapImage] = useImage(activeMap !== 'Blank' ? `/maps/${activeMap}.png` : null, 'anonymous');
  
  const [mapTool, setMapTool] = useState('ping'); 
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState([]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        const h = containerRef.current.offsetHeight;
        if (w > 50 && h > 50) {
          const scale = Math.min(w / VIRTUAL_WIDTH, h / VIRTUAL_HEIGHT);
          setDimensions({ width: VIRTUAL_WIDTH * scale, height: VIRTUAL_HEIGHT * scale, scale: scale });
        }
      }
    };
    updateSize(); 
    const t = setTimeout(updateSize, 150); 
    window.addEventListener('resize', updateSize);
    return () => { clearTimeout(t); window.removeEventListener('resize', updateSize); };
  }, [activeMap]); 

  const getRelativePointerPosition = () => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pos = stage.getPointerPosition();
    if (!pos) return null; 
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    return transform.point(pos);
  };

  const isMyPing = (playerName) => {
    const me = (fleetRoster || []).find(p => p.id === localPlayerId);
    return me && me.name === playerName;
  };

  const distToSegmentSquared = (p, v, w) => {
    let l2 = Math.pow(v.x - w.x, 2) + Math.pow(v.y - w.y, 2);
    if (l2 === 0) return Math.pow(p.x - v.x, 2) + Math.pow(p.y - v.y, 2);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.pow(p.x - (v.x + t * (w.x - v.x)), 2) + Math.pow(p.y - (v.y + t * (w.y - v.y)), 2);
  };

  const mathEraseAtPosition = (pos) => {
    if (!pos) return;
    const ERASE_RADIUS_SQ = 35 * 35; 

    for (let line of (lines || [])) {
      if (!line.id) continue; 
      const pts = line.points || line;
      for (let i = 0; i < pts.length - 2; i += 2) {
        const v = { x: pts[i], y: pts[i+1] };
        const w = { x: pts[i+2], y: pts[i+3] };
        if (distToSegmentSquared(pos, v, w) <= ERASE_RADIUS_SQ) {
          socket.emit('delete-line', { roomId: activeRoom, lineId: line.id });
          break; 
        }
      }
    }

    for (let m of (markers || [])) {
      const distSq = Math.pow(pos.x - m.x, 2) + Math.pow(pos.y - m.y, 2);
      if (distSq <= ERASE_RADIUS_SQ) {
        socket.emit('delete-marker', { roomId: activeRoom, markerId: m.id });
      }
    }
  };

  const handleContextMenu = (e) => {
    e.evt.preventDefault(); 
    const pos = getRelativePointerPosition();
    if (!pos) return;

    for (let m of (markers || [])) {
      const distSq = Math.pow(pos.x - m.x, 2) + Math.pow(pos.y - m.y, 2);
      if (distSq <= 25 * 25) {
        if (isCommander || isMyPing(m.playerName)) {
          socket.emit('delete-marker', { roomId: activeRoom, markerId: m.id });
        }
        break; 
      }
    }
  };

  const handleMouseDown = (e) => {
    if (e.evt.button === 2 || e.evt.button === 1 || e.evt.ctrlKey) {
      return; 
    }

    const pos = getRelativePointerPosition();
    if (!pos) return;

    if (mapTool === 'erase' && isCommander) {
      setIsDrawing(true); 
      mathEraseAtPosition(pos); 
      return;
    }

    if (mapTool === 'draw' && isCommander) {
      setIsDrawing(true);
      setCurrentLine([pos.x, pos.y]);
    } else if (mapTool === 'ping') {
      const me = (fleetRoster || []).find(p => p.id === localPlayerId);
      socket.emit('add-marker', { roomId: activeRoom, markerData: { id: Date.now().toString(), x: pos.x, y: pos.y, playerName: me ? me.name : 'Unknown' } });
    }
  };

  const handleMouseMove = () => {
    if (!isDrawing) return;

    if (mapTool === 'erase' && isCommander) {
      const pos = getRelativePointerPosition();
      mathEraseAtPosition(pos); 
      return;
    }

    if (mapTool === 'draw' && isCommander) {
      const pos = getRelativePointerPosition();
      if (pos) setCurrentLine(prev => [...prev, pos.x, pos.y]);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    if (mapTool === 'draw' && currentLine.length > 2) {
      socket.emit('add-line', { roomId: activeRoom, line: { id: Date.now().toString() + Math.random(), points: currentLine } });
    }
    setCurrentLine([]);
  };

  const handleDragEnd = (e, sqKey) => {
    if (!isCommander) return;
    const x = e.target.x();
    const y = e.target.y();
    socket.emit('update-squadron-position', { roomId: activeRoom, sqKey, position: { x, y } });
  };

  return (
    <div className="map-tab" style={{ padding: '24px', background: 'var(--bg-main)' }}>
      
      <div className="map-controls glass-panel" style={{ position: 'relative', left: 'auto', right: 'auto', top: 'auto', marginBottom: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="text-cyan text-mono uppercase" style={{ fontSize: '10px', fontWeight: 700 }}>Theater:</span>
            {isCommander ? (
              <select value={activeMap} onChange={(e) => socket.emit('change-map', { roomId: activeRoom, mapName: e.target.value })} className="input-field text-mono uppercase" style={{ padding: '6px', fontSize: '11px', width: 'auto' }}>
                {["Blank", "Aruba", "Bord Radel", "Bridgetown", "Charlestown", "Cursed City", "Devios", "Everston", "Fiji", "Gelbion", "Gray Island", "La Navidad", "Laguna Blanco", "Los Catuano", "Masadora", "Nevis", "Nisogora", "North Bastion", "Northside", "Oneg", "San Cristobel", "San Martinas", "South Bastion", "Thermopylae"].map(m => (
                  <option key={m} value={m}>{m.toUpperCase()}</option>
                ))}
              </select>
            ) : (
              <span className="text-cyan text-mono uppercase" style={{ fontSize: '11px', fontWeight: 700, background: 'var(--bg-main)', padding: '6px 10px', borderRadius: 'var(--radius-md)' }}>{activeMap}</span>
            )}
          </div>
          
          <div className="map-tools" style={{ flex: 1, minWidth: '150px', justifyContent: 'center' }}>
            <button onClick={() => setMapTool('ping')} className={`map-tool-btn ${mapTool === 'ping' ? 'active' : ''}`} style={{ flex: 1 }}>📍 Ping</button>
            <button onClick={() => { if (isCommander) setMapTool('draw'); }} className={`map-tool-btn ${mapTool === 'draw' ? 'active' : ''}`} style={{ flex: 1, opacity: !isCommander ? 0.5 : 1, cursor: !isCommander ? 'not-allowed' : 'pointer' }} title={!isCommander ? "Commander Only" : ""}>✏️ Draw</button>
            <button onClick={() => { if (isCommander) setMapTool('erase'); }} className={`map-tool-btn ${mapTool === 'erase' ? 'active' : ''}`} style={{ flex: 1, display: isCommander ? 'block' : 'none' }}>🧽 Erase</button>
          </div>
        </div>
        
        {isCommander && (
          <button onClick={() => socket.emit('clear-board', activeRoom)} style={{ background: 'rgba(214, 40, 40, 0.2)', border: '1px solid var(--text-error)', color: '#E8DAB2', padding: '8px 16px', borderRadius: 'var(--radius-md)', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', width: '100%' }}>🗑️ Clear Map</button>
        )}
        
      </div>

      <div style={{ flex: 1, width: '100%', background: 'var(--bg-panel)', borderRadius: 'var(--radius-xl)', border: '2px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', overflow: 'hidden' }} ref={containerRef}>
        <Stage
          ref={stageRef}
          width={dimensions.width}
          height={dimensions.height}
          scaleX={dimensions.scale}
          scaleY={dimensions.scale}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onContextMenu={handleContextMenu} 
          style={{ cursor: mapTool === 'draw' && isCommander ? 'crosshair' : mapTool === 'erase' && isCommander ? 'pointer' : 'crosshair' }}
        >
          <Layer>
            {mapImage && (
              <KonvaImage image={mapImage} width={VIRTUAL_WIDTH} height={VIRTUAL_HEIGHT} opacity={0.8} />
            )}
          </Layer>

          <Layer>
            {(lines || []).map((lineObj, i) => (
              <Line 
                key={lineObj.id || i}
                points={lineObj.points || lineObj} 
                stroke="#D9A05B" 
                strokeWidth={6} 
                tension={0.5} 
                lineCap="round" 
                lineJoin="round" 
                opacity={0.8}
              />
            ))}
            {isDrawing && mapTool === 'draw' && currentLine.length > 0 && (
              <Line points={currentLine} stroke="#D9A05B" strokeWidth={6} tension={0.5} lineCap="round" lineJoin="round" opacity={0.8} />
            )}
          </Layer>

          <Layer>
            {(markers || []).map((m) => (
              <Group key={m.id} x={m.x} y={m.y}>
                <Circle radius={15} stroke="#D62828" strokeWidth={4} />
                <Circle radius={4} fill="#D62828" />
                <Rect x={-40} y={20} width={80} height={25} fill="rgba(26, 59, 92, 0.9)" stroke="#D62828" strokeWidth={1} cornerRadius={4} />
                <Text x={-40} y={27} width={80} text={m.playerName} fill="#E8DAB2" fontSize={12} fontFamily="monospace" align="center" fontStyle="bold" />
              </Group>
            ))}
          </Layer>

          <Layer>
            {Object.keys(squadrons || {}).filter(sqKey => (squadrons[sqKey] || {}).active).map((sqKey, index) => {
              const sq = squadrons[sqKey];
              const pos = (squadronPositions || {})[sqKey] || { x: 100, y: 100 + (index * 60) }; 
              return (
                <Group 
                  key={sqKey} x={pos.x} y={pos.y} draggable={isCommander}
                  onMouseDown={(e) => { e.cancelBubble = true; }} 
                  onDragStart={(e) => { e.cancelBubble = true; }} 
                  onDragEnd={(e) => handleDragEnd(e, sqKey)}
                >
                  <Rect x={-75} y={-20} width={150} height={40} fill="rgba(26, 59, 92, 0.9)" stroke="#D9A05B" strokeWidth={2} cornerRadius={5} shadowColor="rgba(217, 160, 91, 0.4)" shadowBlur={15} />
                  <Circle x={60} y={0} radius={6} fill="#F7B538" />
                  <Text x={-65} y={-6} width={110} text={sq.name.toUpperCase()} fill="#FDFDFD" fontSize={14} fontFamily="monospace" fontStyle="bold" align="left" />
                </Group>
              );
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

const TacticalMap = (props) => (
  <MapErrorBoundary>
    <TacticalMapContent {...props} />
  </MapErrorBoundary>
);

export default TacticalMap;
