const LobbyManager = require('../server/LobbyManager');
const logger = require('../server/logger');

// Mock Socket.io
const mockIo = {
    to: (roomId) => ({
        emit: (event, data) => {
            console.log(`[SOCKET EMIT] Room: ${roomId}, Event: ${event}, Data:`, JSON.stringify(data, null, 2));
        }
    })
};

async function runTest() {
    console.log('--- STARTING DISCORD INTEGRATION TEST ---');
    
    const lm = new LobbyManager(mockIo);
    const testRoomId = 'TEST_BOT';
    
    // 1. Create a Room
    console.log('\nStep 1: Creating Room...');
    lm.createRoom(testRoomId, 'cmd_123', 'Test Commander');
    
    // 2. Add Discord Applicant
    console.log('\nStep 2: Adding Discord Applicant (Simulating Reaction)...');
    const mockDiscordUser = {
        id: '123456789',
        name: 'DiscordUser_Test',
        avatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
        status: 'applicant'
    };
    lm.addDiscordApplicant(testRoomId, mockDiscordUser);
    
    // 3. Verify State
    const room = lm.getRoom(testRoomId);
    if (room.discordApplicants.length === 1 && room.discordApplicants[0].id === '123456789') {
        console.log('\nSUCCESS: Applicant correctly added to LobbyManager state.');
    } else {
        console.log('\nFAILURE: Applicant state mismatch.');
    }

    // 4. Remove Discord Applicant
    console.log('\nStep 3: Removing Discord Applicant (Simulating Reaction Removal)...');
    lm.removeDiscordApplicant(testRoomId, '123456789');
    
    if (room.discordApplicants.length === 0) {
        console.log('\nSUCCESS: Applicant correctly removed from LobbyManager state.');
    } else {
        console.log('\nFAILURE: Applicant removal failed.');
    }

    console.log('\n--- TEST COMPLETE ---');
}

runTest();
