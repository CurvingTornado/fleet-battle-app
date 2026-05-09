require('dotenv').config();
const LobbyManager = require('./LobbyManager');

const ioMock = {
    to: () => ({ emit: () => {} }),
    in: () => ({ socketsLeave: () => {} })
};

const lobbyManager = new LobbyManager(ioMock);

// Create a mock room
const testId = "TEST01";
lobbyManager.createRoom(testId, "cmd_123", "Test Commander");

console.log("Current rooms:", Object.keys(lobbyManager.rooms));

const room = lobbyManager.getRoom(testId);
console.log("Room found:", room !== undefined);
console.log("Commander name:", room.commanderName);

// Mock what the discord bot does
const embedData = {
    title: `Fleet Command Operation: ${room.lobbyName || 'Untitled'}`,
    description: `Commander: **${room.commanderName || room.commanderId}**\n\nReact with 🚢 to sign up for this operation!`,
    footerText: `Lobby ID: ${testId}`
};

console.log("Embed data generated:", embedData);

// Test discordBot.js directly
const { initDiscordBot } = require('./discordBot');

const client = initDiscordBot(lobbyManager);
if (client) {
    console.log("Bot initialized.");
    setTimeout(() => {
        client.destroy();
        process.exit(0);
    }, 2000);
}
