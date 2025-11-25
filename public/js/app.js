// Socket.io connection
const socket = io();
window.socket = socket;

// Game instance
let game = null;

// Current room
let currentRoomCode = null;
let currentPlayerId = null;
window.currentRoomCode = null;

// Screens
const screens = {
    lobby: document.getElementById('lobby-screen'),
    waiting: document.getElementById('waiting-screen'),
    game: document.getElementById('game-screen'),
    results: document.getElementById('results-screen')
};

// Show specific screen
function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
}

// Lobby Screen Handlers
document.getElementById('create-room-btn').addEventListener('click', () => {
    console.log('🌴 CREATE ROOM BUTTON CLICKED!');
    
    const playerName = document.getElementById('player-name').value.trim();
    console.log('Player name:', playerName);
    
    if (!playerName) {
        console.log('❌ No player name');
        showError('Please enter your name');
        return;
    }
    
    console.log('✅ Emitting createRoom event...');
    socket.emit('createRoom', { playerName });
    console.log('✅ Event emitted!');
});

document.getElementById('join-room-btn').addEventListener('click', () => {
    console.log('🦋 JOIN BUTTON CLICKED!');
    
    const playerName = document.getElementById('player-name').value.trim();
    const roomCode = document.getElementById('room-code-input').value.trim().toUpperCase();
    
    console.log('Player name:', playerName);
    console.log('Room code:', roomCode);
    
    if (!playerName) {
        console.log('❌ No player name');
        showError('Please enter your name');
        return;
    }
    
    if (!roomCode) {
        console.log('❌ No room code');
        showError('Please enter room code');
        return;
    }
    
    console.log('✅ Emitting joinRoom event...');
    socket.emit('joinRoom', { playerName, roomCode });
    console.log('✅ Event emitted!');
});

// Waiting Room Handlers
// FIXED START RACE BUTTON - Multiple event types for reliability
const startRaceBtn = document.getElementById('start-race-btn');

function handleStartRace(e) {
    if (e) e.preventDefault();
    
    console.log('🏁 START RACE BUTTON ACTIVATED!');
    console.log('Room:', currentRoomCode);
    console.log('Socket:', socket ? 'connected' : 'disconnected');
    
    if (!currentRoomCode) {
        alert('❌ No room code! Please create/join a room first.');
        return;
    }
    
    if (!socket || !socket.connected) {
        alert('❌ Not connected to server! Please refresh.');
        return;
    }
    
    // Disable button to prevent double-clicks
    startRaceBtn.disabled = true;
    startRaceBtn.textContent = '🏁 STARTING...';
    
    console.log('✅ Sending startRace event to server...');
    socket.emit('startRace', { roomCode: currentRoomCode });
    
    // Re-enable after 2 seconds in case it fails
    setTimeout(() => {
        if (startRaceBtn.textContent === '🏁 STARTING...') {
            startRaceBtn.disabled = false;
            startRaceBtn.textContent = '🏁 START RACE!';
        }
    }, 2000);
}

// Attach multiple event types for maximum compatibility
startRaceBtn.addEventListener('click', handleStartRace);
startRaceBtn.addEventListener('touchend', handleStartRace);
console.log('✅ Start race button handlers attached!');

document.getElementById('leave-room-btn').addEventListener('click', () => {
    location.reload();
});

// Results Screen Handlers
document.getElementById('play-again-btn').addEventListener('click', () => {
    location.reload();
});

document.getElementById('back-to-lobby-btn').addEventListener('click', () => {
    location.reload();
});

// Socket Event Handlers

socket.on('roomCreated', (data) => {
    currentRoomCode = data.roomCode;
    currentPlayerId = data.playerId;
    window.currentRoomCode = currentRoomCode;
    
    document.getElementById('room-code-display').textContent = currentRoomCode;
    updatePlayersList([data.player]);
    showScreen('waiting');
});

socket.on('roomJoined', (data) => {
    console.log('✅ ROOM JOINED EVENT RECEIVED!');
    console.log('Data:', data);
    
    currentRoomCode = data.roomCode;
    currentPlayerId = data.playerId;
    window.currentRoomCode = currentRoomCode;
    
    console.log('Setting room code display to:', currentRoomCode);
    document.getElementById('room-code-display').textContent = currentRoomCode;
    
    console.log('Updating players list...');
    updatePlayersList(data.players);
    
    console.log('Showing waiting screen...');
    showScreen('waiting');
    
    console.log('✅ Successfully joined room!');
});

socket.on('playerJoined', (data) => {
    updatePlayersList(data.players);
});

socket.on('playerLeft', (data) => {
    showMessage(`${data.playerName} left the room`);
});

socket.on('raceStarted', (data) => {
    console.log('🏁 RACE STARTED EVENT RECEIVED!');
    console.log('Data:', data);
    
    // Initialize game
    const canvas = document.getElementById('game-canvas');
    console.log('Canvas:', canvas);
    
    game = new RacingGame(canvas);
    game.myPlayerId = currentPlayerId;
    
    console.log('Game created, adding players...');
    
    // Add all players to game
    data.players.forEach(player => {
        console.log('Adding player:', player);
        game.addPlayer(player.id, player);
    });
    
    // === ADD AI COMPUTER PLAYERS (always 3) ===
    console.log('Adding 3 AI opponents...');
    for (let i = 0; i < 3; i++) {
        game.addAIPlayer(i);
        console.log(`  → Added AI ${i + 1}`);
    }
    console.log(`✅ Added 3 AI players - should see 4 karts total`);
    
    console.log('Showing game screen...');
    showScreen('game');
    
    // SHOW MOBILE CONTROLS
    const mobileControls = document.getElementById('mobile-controls');
    if (mobileControls) {
        mobileControls.classList.add('active');
        console.log('✅ Mobile controls activated!');
    }
    
    console.log('Starting race...');
    // Start game loop
    game.startRace(data.startTime);
    game.gameLoop();
    
    console.log('✅ Race started successfully!');
});

socket.on('playerMoved', (data) => {
    if (game) {
        game.updatePlayer(data.playerId, data.playerData);
    }
});

socket.on('playerFinishedRace', (data) => {
    showMessage(`${data.playerName} finished! Time: ${formatTime(data.time)}`);
});

socket.on('raceFinished', (data) => {
    showResults(data.rankings);
});

socket.on('error', (data) => {
    showError(data.message);
});

// Helper Functions

function updatePlayersList(players) {
    const list = document.getElementById('players-list');
    list.innerHTML = players.map(player => `
        <div class="player-item">
            <div class="player-color" style="background-color: ${player.color}"></div>
            <div class="player-name">${player.name}</div>
        </div>
    `).join('');
    
    // Enable start button always (allow solo testing)
    const startBtn = document.getElementById('start-race-btn');
    startBtn.disabled = false;
}

function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    setTimeout(() => {
        errorElement.textContent = '';
    }, 3000);
}

function showMessage(message) {
    // Could add a toast notification here
    console.log(message);
}

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;
    return `${seconds}.${milliseconds.toString().padStart(3, '0')}s`;
}

function showResults(rankings) {
    const resultsList = document.getElementById('results-list');
    resultsList.innerHTML = rankings.map((rank, index) => `
        <div class="result-item ${index === 0 ? 'winner' : ''}">
            <div class="result-rank">${rank.rank === 1 ? '🏆' : rank.rank}</div>
            <div class="result-name">${rank.name}</div>
            <div class="result-time">${formatTime(rank.time)}</div>
        </div>
    `).join('');
    
    showScreen('results');
}

// Send player movement to server (throttled)
let lastSendTime = 0;
const sendInterval = 50; // Send every 50ms

function sendPlayerUpdate() {
    if (!game || !game.isRacing) return;
    
    const now = Date.now();
    if (now - lastSendTime < sendInterval) return;
    
    const myPlayer = game.players[currentPlayerId];
    if (!myPlayer) return;
    
    socket.emit('playerMove', {
        roomCode: currentRoomCode,
        playerData: {
            x: myPlayer.x,
            y: myPlayer.y,
            angle: myPlayer.angle,
            speed: myPlayer.speed,
            lap: myPlayer.lap,
            checkpoint: myPlayer.checkpoint,
            finished: myPlayer.finished
        }
    });
    
    lastSendTime = now;
}

// Update loop
setInterval(sendPlayerUpdate, 50);

// Prevent page refresh during game
window.addEventListener('beforeunload', (e) => {
    if (currentRoomCode && game && game.isRacing) {
        e.preventDefault();
        e.returnValue = '';
    }
});

console.log('🏎️ Racing game client loaded!');
