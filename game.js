const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gridSize = 20;
const canvasSize = 500;
canvas.width = canvasSize;
canvas.height = canvasSize;

const STORAGE_KEY = 'snakeGameHighScore';

const DIFFICULTY = {
    easy: 120,
    medium: 80,
    hard: 50
};

let gameState = {
    snake: [{ x: 10, y: 10 }],
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    food: { x: 15, y: 15 },
    score: 0,
    highScore: 0,
    gameLoop: null,
    isRunning: false,
    isPaused: false,
    speed: DIFFICULTY.medium
};

const elements = {
    startBtn: document.getElementById('startBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    resetBtn: document.getElementById('resetBtn'),
    restartBtn: document.getElementById('restartBtn'),
    currentScore: document.getElementById('current-score'),
    highScore: document.getElementById('high-score'),
    finalScore: document.getElementById('final-score'),
    gameStatus: document.getElementById('game-status'),
    gameOverOverlay: document.getElementById('gameOverOverlay'),
    difficulty: document.getElementById('difficulty')
};

function init() {
    loadHighScore();
    updateScoreDisplay();
    setupEventListeners();
    drawGame();
}

function setupEventListeners() {
    elements.startBtn.addEventListener('click', startGame);
    elements.pauseBtn.addEventListener('click', togglePause);
    elements.resetBtn.addEventListener('click', resetGame);
    elements.restartBtn.addEventListener('click', () => {
        elements.gameOverOverlay.classList.remove('show');
        resetGame();
        startGame();
    });
    
    elements.difficulty.addEventListener('change', (e) => {
        gameState.speed = DIFFICULTY[e.target.value];
        if (gameState.isRunning && !gameState.isPaused) {
            clearInterval(gameState.gameLoop);
            gameState.gameLoop = setInterval(gameUpdate, gameState.speed);
        }
    });
    
    document.addEventListener('keydown', handleKeyPress);
}

function handleKeyPress(e) {
    const key = e.key.toLowerCase();
    
    if (key === ' ') {
        e.preventDefault();
        if (gameState.isRunning) {
            togglePause();
        }
        return;
    }
    
    if (!gameState.isRunning || gameState.isPaused) return;
    
    const currentDir = gameState.direction;
    let newDirection = null;
    
    if ((key === 'arrowup' || key === 'w') && currentDir.y === 0) {
        newDirection = { x: 0, y: -1 };
    } else if ((key === 'arrowdown' || key === 's') && currentDir.y === 0) {
        newDirection = { x: 0, y: 1 };
    } else if ((key === 'arrowleft' || key === 'a') && currentDir.x === 0) {
        newDirection = { x: -1, y: 0 };
    } else if ((key === 'arrowright' || key === 'd') && currentDir.x === 0) {
        newDirection = { x: 1, y: 0 };
    }
    
    if (newDirection) {
        gameState.nextDirection = newDirection;
    }
}

function startGame() {
    if (gameState.isRunning) return;
    
    gameState.isRunning = true;
    gameState.isPaused = false;
    updateGameStatus('游戏进行中');
    
    elements.startBtn.disabled = true;
    elements.pauseBtn.disabled = false;
    elements.difficulty.disabled = true;
    
    gameState.gameLoop = setInterval(gameUpdate, gameState.speed);
}

function togglePause() {
    if (!gameState.isRunning) return;
    
    gameState.isPaused = !gameState.isPaused;
    
    if (gameState.isPaused) {
        clearInterval(gameState.gameLoop);
        elements.pauseBtn.textContent = '继续';
        updateGameStatus('已暂停');
    } else {
        gameState.gameLoop = setInterval(gameUpdate, gameState.speed);
        elements.pauseBtn.textContent = '暂停';
        updateGameStatus('游戏进行中');
    }
}

function resetGame() {
    clearInterval(gameState.gameLoop);
    
    gameState.snake = [{ x: 10, y: 10 }];
    gameState.direction = { x: 1, y: 0 };
    gameState.nextDirection = { x: 1, y: 0 };
    gameState.food = generateFood();
    gameState.score = 0;
    gameState.isRunning = false;
    gameState.isPaused = false;
    
    elements.startBtn.disabled = false;
    elements.pauseBtn.disabled = true;
    elements.pauseBtn.textContent = '暂停';
    elements.difficulty.disabled = false;
    elements.gameOverOverlay.classList.remove('show');
    
    updateScoreDisplay();
    updateGameStatus('准备开始');
    drawGame();
}

function gameUpdate() {
    gameState.direction = gameState.nextDirection;
    
    const head = gameState.snake[0];
    const newHead = {
        x: head.x + gameState.direction.x,
        y: head.y + gameState.direction.y
    };
    
    if (checkCollision(newHead)) {
        gameOver();
        return;
    }
    
    gameState.snake.unshift(newHead);
    
    if (newHead.x === gameState.food.x && newHead.y === gameState.food.y) {
        gameState.score++;
        updateScoreDisplay();
        gameState.food = generateFood();
        
        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            saveHighScore();
            updateScoreDisplay();
        }
    } else {
        gameState.snake.pop();
    }
    
    drawGame();
}

function checkCollision(head) {
    if (head.x < 0 || head.x >= canvasSize / gridSize || 
        head.y < 0 || head.y >= canvasSize / gridSize) {
        return true;
    }
    
    for (let segment of gameState.snake) {
        if (head.x === segment.x && head.y === segment.y) {
            return true;
        }
    }
    
    return false;
}

function generateFood() {
    let food;
    let validPosition = false;
    
    while (!validPosition) {
        food = {
            x: Math.floor(Math.random() * (canvasSize / gridSize)),
            y: Math.floor(Math.random() * (canvasSize / gridSize))
        };
        
        validPosition = !gameState.snake.some(segment => 
            segment.x === food.x && segment.y === food.y
        );
    }
    
    return food;
}

function drawGame() {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    
    drawGrid();
    drawFood();
    drawSnake();
}

function drawGrid() {
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= canvasSize / gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvasSize);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvasSize, i * gridSize);
        ctx.stroke();
    }
}

function drawSnake() {
    gameState.snake.forEach((segment, index) => {
        if (index === 0) {
            const gradient = ctx.createLinearGradient(
                segment.x * gridSize, 
                segment.y * gridSize,
                segment.x * gridSize + gridSize, 
                segment.y * gridSize + gridSize
            );
            gradient.addColorStop(0, '#4ecdc4');
            gradient.addColorStop(1, '#44a9a3');
            ctx.fillStyle = gradient;
        } else {
            const intensity = 1 - (index / gameState.snake.length) * 0.4;
            ctx.fillStyle = `rgba(78, 205, 196, ${intensity})`;
        }
        
        ctx.fillRect(
            segment.x * gridSize + 1,
            segment.y * gridSize + 1,
            gridSize - 2,
            gridSize - 2
        );
        
        if (index === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(
                segment.x * gridSize + gridSize * 0.35,
                segment.y * gridSize + gridSize * 0.35,
                2,
                0,
                Math.PI * 2
            );
            ctx.fill();
            ctx.beginPath();
            ctx.arc(
                segment.x * gridSize + gridSize * 0.65,
                segment.y * gridSize + gridSize * 0.35,
                2,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    });
}

function drawFood() {
    const gradient = ctx.createRadialGradient(
        gameState.food.x * gridSize + gridSize / 2,
        gameState.food.y * gridSize + gridSize / 2,
        gridSize * 0.1,
        gameState.food.x * gridSize + gridSize / 2,
        gameState.food.y * gridSize + gridSize / 2,
        gridSize * 0.5
    );
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(1, '#ee5a6f');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(
        gameState.food.x * gridSize + gridSize / 2,
        gameState.food.y * gridSize + gridSize / 2,
        gridSize * 0.4,
        0,
        Math.PI * 2
    );
    ctx.fill();
    
    ctx.fillStyle = '#90ee90';
    ctx.fillRect(
        gameState.food.x * gridSize + gridSize / 2 - 1,
        gameState.food.y * gridSize + gridSize * 0.2,
        2,
        gridSize * 0.2
    );
}

function gameOver() {
    clearInterval(gameState.gameLoop);
    gameState.isRunning = false;
    gameState.isPaused = false;
    
    elements.startBtn.disabled = false;
    elements.pauseBtn.disabled = true;
    elements.pauseBtn.textContent = '暂停';
    elements.difficulty.disabled = false;
    
    elements.finalScore.textContent = gameState.score;
    elements.gameOverOverlay.classList.add('show');
    
    updateGameStatus('游戏结束');
}

function updateScoreDisplay() {
    elements.currentScore.textContent = gameState.score;
    elements.highScore.textContent = gameState.highScore;
}

function updateGameStatus(status) {
    elements.gameStatus.textContent = status;
}

function saveHighScore() {
    localStorage.setItem(STORAGE_KEY, gameState.highScore.toString());
}

function loadHighScore() {
    const savedScore = localStorage.getItem(STORAGE_KEY);
    if (savedScore) {
        gameState.highScore = parseInt(savedScore, 10);
    }
}

init();
