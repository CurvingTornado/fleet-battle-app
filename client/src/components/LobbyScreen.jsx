import React from 'react';
import { SHIP_REGISTRY } from '../constants';

/**
 * React component rendering the lobby screen UI for managing a commander's profile,
 * saved ships, and joining/creating lobbies. This is the main interface for users
 * to configure their fleet before engaging in operations or joining existing ones.
 *
 * @param {string} commanderName - The current value of the commander's name input field.
 * @param {function} setCommanderName - Function to update the commander's name state.
 * @param {string} playerTag - The current value of the associated guild (player) tag input field.
 * @param {function} setPlayerTag - Function to update the player tag state.
 * @param {Array<string>} savedShips - Array of ship names that are currently persisted in the user's fleet configuration.
 * @param {function} handleRemoveShipOffer - Callback function to remove a specific ship from the saved ships list.
 * @param {function} handleAddShipOffer - Callback function to add a new ship to the saved ships list.
 * @param {function} handleCreateLobby - Function triggered when the user clicks "START OPERATION" to create a new lobby.
 * @param {string} joinToken - The current value of the join token input field used for joining existing lobbies.
 * @param {function} setJoinToken - Function to update the join token state.
 * @param {function} handleJoinLobby - Callback function triggered when the user attempts to join a lobby using a token.
 * @param {Array<string|Object>} recentLobbies - Array of recently joined or created lobbies, used for quick access.
 */
function LobbyScreen({
  commanderName,
  setCommanderName,
  playerTag,
  setPlayerTag,
  savedShips,
  handleRemoveShipOffer,
  handleAddShipOffer,
  handleCreateLobby,
  joinToken,
  setJoinToken,
  handleJoinLobby,
  recentLobbies
}) {
  return (
    <div className="lobby-view">
      {/* Main container for the lobby screen, centered and styled with a glass panel effect */}
      <div className="lobby-card glass-panel" style={{ maxWidth: '600px' }}>
        {/* Header section with title and subtitle */}
        <div>
          <h1 className="lobby-title app-title">Guilliman's Fleet Command</h1>
          <p className="app-subtitle">Tactical Maritime Command Interface</p>
        </div>

        {/* Input group for commander name and player tag */}
        <div className="lobby-input-group">
          <input 
            type="text" 
            placeholder="ENTER COMMANDER NAME" 
            className="input-field text-mono uppercase" 
            style={{textAlign: 'center', fontSize: '18px'}} 
            value={commanderName} 
            onChange={(e) => setCommanderName(e.target.value.toUpperCase())} 
            onFocus={(e) => e.target.select()} 
          />
          <input 
            type="text" 
            placeholder="ASSOCIATED GUILD (TAG)" 
            className="input-field text-mono uppercase" 
            style={{textAlign: 'center', fontSize: '14px'}} 
            value={playerTag} 
            onChange={(e) => setPlayerTag(e.target.value.toUpperCase())} 
            onFocus={(e) => e.target.select()} 
          />
        </div>

        {/* Section for managing persistent fleet configuration */}
        <div className="glass-panel" style={{ margin: '20px 0', padding: '15px', background: 'rgba(0,0,0,0.3)', textAlign: 'left' }}>
          <h3 style={{ fontSize: '10px', color: 'var(--text-accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '10px' }}>Persistent Fleet Configuration</h3>
          
          {/* Display saved ships as clickable pills; clicking removes them */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '15px', minHeight: '30px' }}>
            {savedShips.map(ship => (
              <span key={ship} className="ship-pill ship-pill-my" onClick={() => handleRemoveShipOffer(ship)} style={{ cursor: 'pointer', fontSize: '10px' }}>{ship} ×</span>
            ))}
            {/* Fallback message if no ships are saved */}
            {savedShips.length === 0 && <span style={{ opacity: 0.3, fontSize: '10px' }}>No ships saved. Add vessels below to auto-apply when joining.</span>}
          </div>

          {/* Dropdown for selecting and adding new ships to the persistent list */}
          <select 
            className="input-field text-mono uppercase" 
            style={{ fontSize: '10px', flex: 1 }} 
            onChange={(e) => { if(e.target.value) { handleAddShipOffer(e.target.value); e.target.value = ''; } }}
          >
            <option value="">+ ADD SHIP TO PERSISTENT LIST</option>
            {/* Group ships by rate from the SHIP_REGISTRY constant */}
            {Object.entries(SHIP_REGISTRY).map(([rate, ships]) => (
              <optgroup key={rate} label={rate.toUpperCase()}>
                {ships.map(ship => <option key={ship} value={ship}>{ship.toUpperCase()}</option>)}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Action buttons for creating a lobby and joining via token */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button onClick={handleCreateLobby} className="btn-primary">START OPERATION</button>
          <div style={{ position: 'relative' }}>
             {/* Input for entering a join token */}
             <input 
               type="text" 
               placeholder="JOIN TOKEN" 
               maxLength={10} 
               className="input-field text-mono uppercase" 
               style={{textAlign: 'center', fontSize: '16px', height: '100%'}} 
               value={joinToken} 
               onChange={(e) => setJoinToken(e.target.value.toUpperCase())} 
               onFocus={(e) => e.target.select()} 
             />
             {/* Join button positioned absolutely within the token input container */}
             <button 
               onClick={(e) => handleJoinLobby(e, null)} 
               className="btn-primary" 
               style={{ position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', padding: '5px 15px', fontSize: '10px', height: 'auto' }}
             >
               JOIN
             </button>
          </div>
        </div>

        {/* Section for displaying recent lobbies as quick join buttons */}
        {recentLobbies.length > 0 && (
          <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
            <p style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Recent Operations</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {recentLobbies.map(lobby => {
                // Extract token and name from lobby object or string
                const token = typeof lobby === 'string' ? lobby : lobby.token;
                const name = typeof lobby === 'string' ? lobby : (lobby.name || lobby.token);
                return (
                  <button 
                    key={token} 
                    type="button" 
                    onClick={() => { setJoinToken(token); handleJoinLobby(null, token); }} 
                    className="ship-pill" 
                    style={{ cursor: 'pointer', padding: '6px 12px', fontSize: '10px' }}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LobbyScreen;
