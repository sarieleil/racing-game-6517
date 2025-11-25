const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Game state storage
const rooms = {};

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New player connected:', socket.id);

  // Create room
  socket.on('createRoom', (data) => {
    const roomCode = generateRoomCode();
    const player = {
      id: socket.id,
      name: data.playerName,
      x: 100,
      y: 200,
      angle: 0,
      speed: 0,
      lap: 0,
      checkpoint: 0,
      finished: false,
      color: '#FF0000'
    };

    rooms[roomCode] = {
      code: roomCode,
      players: [player],
      maxPlayers: 3,
      started: false,
      startTime: null
    };

    socket.join(roomCode);
    socket.emit('roomCreated', {
      roomCode: roomCode,
      playerId: socket.id,
      player: player
    });
    
    console.log(`Room created: ${roomCode}`);
  });

  // Join room
  socket.on('joinRoom', (data) => {
    console.log('🦋 JOIN ROOM EVENT RECEIVED!');
    console.log('Data:', data);
    
    const { roomCode, playerName } = data;
    console.log('Room code:', roomCode);
    console.log('Player name:', playerName);
    
    const room = rooms[roomCode];
    console.log('Room found?', !!room);

    if (!room) {
      console.log('❌ Room not found!');
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    console.log('Room players:', room.players.length, '/', room.maxPlayers);

    if (room.players.length >= room.maxPlayers) {
      console.log('❌ Room is full!');
      socket.emit('error', { message: 'Room is full' });
      return;
    }

    if (room.started) {
      console.log('❌ Race already started!');
      socket.emit('error', { message: 'Race already started' });
      return;
    }

    const colors = ['#FF0000', '#0000FF', '#00FF00'];
    const player = {
      id: socket.id,
      name: playerName,
      x: 100,
      y: 200 + (room.players.length * 80),
      angle: 0,
      speed: 0,
      lap: 0,
      checkpoint: 0,
      finished: false,
      color: colors[room.players.length]
    };

    room.players.push(player);
    socket.join(roomCode);

    socket.emit('roomJoined', {
      roomCode: roomCode,
      playerId: socket.id,
      player: player,
      players: room.players
    });

    // Notify other players
    socket.to(roomCode).emit('playerJoined', {
      player: player,
      players: room.players
    });

    console.log(`Player ${playerName} joined room ${roomCode}`);
  });

  // Start race
  socket.on('startRace', (data) => {
    console.log('🏁 START RACE EVENT RECEIVED!');
    console.log('Data:', data);
    
    const { roomCode } = data;
    console.log('Room code:', roomCode);
    
    const room = rooms[roomCode];
    console.log('Room found?', !!room);
    
    if (!room) {
      console.log('❌ Room not found!');
      return;
    }
    
    console.log('Players in room:', room.players.length);
    
    if (room.players.length < 1) {
      console.log('❌ Not enough players');
      socket.emit('error', { message: 'Need at least 1 player to start' });
      return;
    }

    room.started = true;
    room.startTime = Date.now();

    console.log('✅ Emitting raceStarted to room:', roomCode);
    io.to(roomCode).emit('raceStarted', {
      players: room.players,
      startTime: room.startTime
    });

    console.log(`✅ Race started in room ${roomCode}`);
  });

  // Player movement
  socket.on('playerMove', (data) => {
    const { roomCode, playerData } = data;
    const room = rooms[roomCode];

    if (!room || !room.started) return;

    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.x = playerData.x;
      player.y = playerData.y;
      player.angle = playerData.angle;
      player.speed = playerData.speed;
      player.lap = playerData.lap;
      player.checkpoint = playerData.checkpoint;
      player.finished = playerData.finished;
    }

    // Broadcast to other players
    socket.to(roomCode).emit('playerMoved', {
      playerId: socket.id,
      playerData: player
    });
  });

  // Player finished
  socket.on('playerFinished', (data) => {
    const { roomCode, playerId, time } = data;
    const room = rooms[roomCode];

    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.finished = true;
      player.finishTime = time;
    }

    // Check if all players finished
    const allFinished = room.players.every(p => p.finished);
    if (allFinished) {
      const rankings = room.players
        .sort((a, b) => a.finishTime - b.finishTime)
        .map((p, index) => ({
          rank: index + 1,
          name: p.name,
          time: p.finishTime
        }));

      io.to(roomCode).emit('raceFinished', { rankings });
    } else {
      io.to(roomCode).emit('playerFinishedRace', {
        playerId: playerId,
        playerName: player.name,
        time: time
      });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);

    // Remove player from all rooms
    Object.keys(rooms).forEach(roomCode => {
      const room = rooms[roomCode];
      const playerIndex = room.players.findIndex(p => p.id === socket.id);

      if (playerIndex !== -1) {
        const player = room.players[playerIndex];
        room.players.splice(playerIndex, 1);

        // Notify other players
        socket.to(roomCode).emit('playerLeft', {
          playerId: socket.id,
          playerName: player.name
        });

        // Delete room if empty
        if (room.players.length === 0) {
          delete rooms[roomCode];
          console.log(`Room ${roomCode} deleted`);
        }
      }
    });
  });
});

// Generate random room code
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    rooms: Object.keys(rooms).length,
    timestamp: new Date().toISOString() 
  });
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
server.listen(PORT, () => {
  console.log(`Racing game server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT}`);
});
