const { io } = require('socket.io-client');

const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected to server with ID:', socket.id);
  
  socket.emit('join-room', {
    roomId: 'TEST12',
    name: 'TestCommander',
    tag: 'TEST',
    playerId: 'cmd_1234'
  });
  
  setTimeout(() => {
    socket.disconnect();
    console.log('Test completed.');
    process.exit(0);
  }, 2000);
});

socket.on('connect_error', (err) => {
  console.error('Connection error:', err.message);
  process.exit(1);
});
