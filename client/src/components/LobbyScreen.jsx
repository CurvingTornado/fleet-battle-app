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
 * @param {function} onShowDiscordGuide - Callback to open the Discord bot invite/guide modal.
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
  recentLobbies,
  onShowDiscordGuide
}) {
  return (
    <div className="lobby-view">
      {/* Main container: centered glass card */}
      <div className="lobby-card glass-panel" style={{ maxWidth: '560px' }}>

        {/* ── Header: anchor icon, title, subtitle, Discord invite ── */}
        <div>
          {/* Decorative nautical anchor icon */}
          <div style={{ fontSize: '30px', marginBottom: '6px', opacity: 0.65, letterSpacing: '0.3em' }}>
            ⚓
          </div>

          <h1 className="lobby-title app-title">Guilliman's Fleet Command</h1>
          <p className="app-subtitle">Tactical Maritime Command Interface</p>

          {/* Thin decorative brass divider below subtitle */}
          <div style={{
            width: '70px',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #D9A05B, transparent)',
            margin: '14px auto 0'
          }} />

          {/* Discord bot invite button — styled in Discord purple, separate from primary CTA */}
          <button
            onClick={onShowDiscordGuide}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 20px',
              fontSize: '11px',
              marginTop: '16px',
              /* Frosted ghost style: subtle purple wash, blends against the blue glass panel */
              background: 'rgba(88, 101, 242, 0.15)',
              color: 'rgba(185, 195, 255, 0.95)',
              border: '1px solid rgba(88, 101, 242, 0.45)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 10px rgba(88, 101, 242, 0.12)'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = 'rgba(88, 101, 242, 0.28)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(88,101,242,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(88, 101, 242, 0.15)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(88,101,242,0.12)'; }}
          >
            ⚓ INVITE MY DISCORD BOT TO YOUR SERVER!
          </button>
        </div>

        {/* ── Commander name + guild tag inputs ── */}
        <div className="lobby-input-group">
          <input
            type="text"
            placeholder="ENTER COMMANDER NAME"
            className="input-field text-mono uppercase"
            style={{ textAlign: 'center', fontSize: '18px' }}
            value={commanderName}
            onChange={(e) => setCommanderName(e.target.value.toUpperCase())}
            onFocus={(e) => e.target.select()}
          />
          <input
            type="text"
            placeholder="ASSOCIATED GUILD (TAG)"
            className="input-field text-mono uppercase"
            style={{ textAlign: 'center', fontSize: '14px' }}
            value={playerTag}
            onChange={(e) => setPlayerTag(e.target.value.toUpperCase())}
            onFocus={(e) => e.target.select()}
          />
        </div>

        {/* ── Persistent Fleet Configuration ── */}
        <div className="glass-panel" style={{ margin: '20px 0', padding: '16px', background: 'rgba(0,0,0,0.35)', textAlign: 'left' }}>
          <h3 style={{ fontSize: '10px', color: 'var(--text-accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '10px' }}>
            Persistent Fleet Configuration
          </h3>

          {/* Saved ship pills — click to remove */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px', minHeight: '30px' }}>
            {savedShips.map(ship => (
              <span
                key={ship}
                className="ship-pill ship-pill-my"
                onClick={() => handleRemoveShipOffer(ship)}
                style={{ cursor: 'pointer', fontSize: '10px' }}
              >
                {ship} ×
              </span>
            ))}
            {/* Fallback if no ships saved yet */}
            {savedShips.length === 0 && (
              <span style={{ opacity: 0.35, fontSize: '10px', fontStyle: 'italic' }}>
                No ships saved. Add vessels below to auto-apply when joining.
              </span>
            )}
          </div>

          {/* Dropdown to add ships to the persistent list */}
          <select
            className="input-field text-mono uppercase"
            style={{ fontSize: '10px', width: '100%' }}
            onChange={(e) => { if (e.target.value) { handleAddShipOffer(e.target.value); e.target.value = ''; } }}
          >
            <option value="">+ ADD SHIP TO PERSISTENT LIST</option>
            {/* Ships grouped by rate from SHIP_REGISTRY */}
            {Object.entries(SHIP_REGISTRY).map(([rate, ships]) => (
              <optgroup key={rate} label={rate.toUpperCase()}>
                {ships.map(ship => <option key={ship} value={ship}>{ship.toUpperCase()}</option>)}
              </optgroup>
            ))}
          </select>
        </div>

        {/* ── Action Buttons: Start Operation + Join Token ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

          {/* Primary CTA — full brass gradient button */}
          <button
            onClick={handleCreateLobby}
            className="btn-primary"
            style={{ width: '100%', fontSize: '13px', padding: '14px 24px', letterSpacing: '0.15em' }}
          >
            START OPERATION
          </button>

          {/* Join token input with ghost JOIN button overlaid */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="JOIN TOKEN"
              maxLength={10}
              className="input-field text-mono uppercase"
              style={{ textAlign: 'center', fontSize: '16px', height: '100%', paddingRight: '60px' }}
              value={joinToken}
              onChange={(e) => setJoinToken(e.target.value.toUpperCase())}
              onFocus={(e) => e.target.select()}
            />
            {/* Ghost outlined JOIN button — contrasts cleanly against the solid primary */}
            <button
              onClick={(e) => handleJoinLobby(e, null)}
              style={{
                position: 'absolute',
                right: '5px',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: '5px 12px',
                fontSize: '10px',
                height: 'auto',
                background: 'transparent',
                border: '1px solid rgba(217,160,91,0.55)',
                color: 'var(--text-accent)',
                borderRadius: '8px',
                fontWeight: 'bold',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,160,91,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              JOIN
            </button>
          </div>
        </div>

        {/* ── Recent Operations Quick-Join ── */}
        {recentLobbies.length > 0 && (
          <div style={{ marginTop: '20px', borderTop: '1px solid rgba(217,160,91,0.12)', paddingTop: '15px' }}>
            <p style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'center' }}>
              Recent Operations
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {recentLobbies.map(lobby => {
                // Support both string tokens and lobby objects
                const token = typeof lobby === 'string' ? lobby : lobby.token;
                const name  = typeof lobby === 'string' ? lobby : (lobby.name || lobby.token);
                return (
                  <button
                    key={token}
                    type="button"
                    onClick={() => { setJoinToken(token); handleJoinLobby(null, token); }}
                    className="ship-pill"
                    style={{ cursor: 'pointer', padding: '6px 14px', fontSize: '10px' }}
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
