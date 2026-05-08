import React from 'react';

const DiscordGuide = ({ onBack }) => {
  const inviteUrl = "https://discord.com/oauth2/authorize?client_id=1502112708974215218&permissions=67648&integration_type=0&scope=bot+applications.commands";

  return (
    <div className="lobby-view">
      <div className="lobby-card glass-panel" style={{ maxWidth: '800px', textAlign: 'left' }}>
        <button onClick={onBack} className="ship-pill" style={{ marginBottom: '20px', cursor: 'pointer' }}>
          ← BACK TO COMMAND
        </button>
        
        <h1 className="app-title" style={{ fontSize: '28px', marginBottom: '10px' }}>Discord Integration Guide</h1>
        <p className="app-subtitle" style={{ marginBottom: '30px' }}>Bridging the gap between Discord and the Tactical Interface</p>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ color: 'var(--text-accent)', fontSize: '18px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
            1. Invite the Bot
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.6', marginTop: '10px' }}>
            To begin, click the button below to invite the **Guilliman's Fleet Command** bot to your Discord server. 
            Ensure you have "Manage Server" permissions in the target Discord.
          </p>
          <a 
            href={inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ display: 'inline-block', marginTop: '15px', textDecoration: 'none', background: '#5865F2' }}
          >
            INVITE DISCORD BOT TO YOUR SERVER!
          </a>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ color: 'var(--text-accent)', fontSize: '18px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
            2. Link Your Lobby
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.6', marginTop: '10px' }}>
            Once the bot is in your server, use the following slash command in any text channel to link it to your active operation:
          </p>
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '15px', borderRadius: '8px', fontFamily: 'monospace', marginTop: '10px', border: '1px solid #5865F2' }}>
            /link_lobby [YOUR_6_CHARACTER_TOKEN]
          </div>
          <p style={{ fontSize: '12px', opacity: 0.7, marginTop: '10px' }}>
            Example: <code style={{ color: '#5865F2' }}>/link_lobby PLAYGROUND</code>
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ color: 'var(--text-accent)', fontSize: '18px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
            3. Automated Signups
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.6', marginTop: '10px' }}>
            The bot will post an announcement in Discord with a 🚢 reaction emoji. 
            When members of your server react to that message, they will automatically appear in your webapp's **Roster Tab** under the "Discord Applicant Pool."
          </p>
          <p style={{ fontSize: '14px', lineHeight: '1.6', marginTop: '10px' }}>
            This allows you to see exactly who plans on arriving before they even open the webapp!
          </p>
        </section>

        <div style={{ marginTop: '40px', textAlign: 'center', opacity: 0.5, fontSize: '12px' }}>
          Guilliman's Fleet Command Bot v1.0 • Built for World of Sea Battles
        </div>
      </div>
    </div>
  );
};

export default DiscordGuide;
