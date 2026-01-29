// ========== 游戏配置 ==========
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const speedLevelElement = document.getElementById('speedLevel');
const gameOverElement = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');
const musicSelect = document.getElementById('musicSelect');

// 游戏常量
const GRID_SIZE = 20; // 每个格子的大小（像素）
const TILE_COUNT = canvas.width / GRID_SIZE; // 20x20 的格子

// ========== 游戏状态变量 ==========
let snake = [{ x: 10, y: 10 }]; // 蛇的初始位置（中心）
let food = { x: 15, y: 15 }; // 食物初始位置
let dx = 0; // 蛇的x方向速度
let dy = 0; // 蛇的y方向速度
let score = 0; // 当前得分
let highScore = localStorage.getItem('snakeHighScore') || 0; // 从本地存储获取最高分
let gameRunning = false; // 游戏是否正在运行
let gamePaused = false; // 游戏是否暂停
let gameLoop; // 游戏循环定时器
let gameSpeed = 200; // 初始游戏速度（毫秒）
let speedLevel = 1; // 速度等级

// 蛇的颜色配置
const snakeColors = {
    green: { head: '#00ff00', body: '#00cc00' },
    blue: { head: '#00bfff', body: '#0099cc' },
    purple: { head: '#9370db', body: '#7b68ee' },
    orange: { head: '#ff8c00', body: '#ff7f00' },
    pink: { head: '#ff69b4', body: '#ff1493' }
};
let currentSnakeColor = 'green'; // 当前蛇的颜色

// 背景音乐
const musicUrls = {
    music1: 'https://www.bensound.com/bensound-music/bensound-ukulele.mp3',
    music2: 'https://www.bensound.com/bensound-music/bensound-sunny.mp3',
    music3: 'https://www.bensound.com/bensound-music/bensound-dance.mp3'
};
let backgroundMusic = null;

// 初始化显示
highScoreElement.textContent = highScore;
speedLevelElement.textContent = speedLevel;

// ========== 音效功能 ==========
// 创建简单的音效（使用Web Audio API）
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playEatSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

function playGameOverSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 200;
    oscillator.type = 'sawtooth';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

// ========== 游戏核心函数 ==========

// 游戏主循环
function update() {
    if (!gameRunning || gamePaused) return;

    // 移动蛇：在头部添加新位置
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // 检查碰撞
    if (checkCollision(head)) {
        gameOver();
        return;
    }

    // 将新头部添加到蛇身
    snake.unshift(head);

    // 检查是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;

        // 播放吃到食物的音效
        playEatSound();

        // 更新最高分
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }

        // 根据分数增加游戏难度
        updateGameSpeed();

        // 生成新食物
        generateFood();
    } else {
        // 如果没吃到食物，移除尾部
        snake.pop();
    }

    // 绘制游戏画面
    draw();
}

// 更新游戏速度（难度递增）
function updateGameSpeed() {
    // 每30分增加一个速度等级
    const newSpeedLevel = Math.floor(score / 30) + 1;

    if (newSpeedLevel !== speedLevel && newSpeedLevel <= 10) {
        speedLevel = newSpeedLevel;
        speedLevelElement.textContent = speedLevel;

        // 速度递增公式：200ms -> 80ms（最快）
        gameSpeed = Math.max(80, 200 - (speedLevel - 1) * 12);

        // 重新设置游戏循环
        clearInterval(gameLoop);
        gameLoop = setInterval(update, gameSpeed);
    }
}

// 检查碰撞（墙壁和自身）
function checkCollision(head) {
    // 检查是否撞墙
    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        return true;
    }

    // 检查是否撞到自己
    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            return true;
        }
    }

    return false;
}

// 生成随机食物位置
function generateFood() {
    food.x = Math.floor(Math.random() * TILE_COUNT);
    food.y = Math.floor(Math.random() * TILE_COUNT);

    // 确保食物不会生成在蛇身上
    for (let segment of snake) {
        if (food.x === segment.x && food.y === segment.y) {
            generateFood(); // 递归重新生成
            return;
        }
    }
}

// 绘制苹果（食物）
function drawApple(x, y) {
    const centerX = x * GRID_SIZE + GRID_SIZE / 2;
    const centerY = y * GRID_SIZE + GRID_SIZE / 2;
    const radius = GRID_SIZE / 2 - 2;

    // 绘制苹果身体（红色圆形）
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(centerX, centerY + 1, radius, 0, Math.PI * 2);
    ctx.fill();

    // 绘制高光
    ctx.fillStyle = '#ff6666';
    ctx.beginPath();
    ctx.arc(centerX - 3, centerY - 3, radius / 3, 0, Math.PI * 2);
    ctx.fill();

    // 绘制叶子（绿色）
    ctx.fillStyle = '#00aa00';
    ctx.beginPath();
    ctx.ellipse(centerX + 2, centerY - radius, 4, 6, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // 绘制果柄（棕色）
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius);
    ctx.lineTo(centerX + 2, centerY - radius - 2);
    ctx.stroke();
}

// 绘制蛇头（带眼睛）
function drawSnakeHead(x, y) {
    const colors = snakeColors[currentSnakeColor];

    // 绘制蛇头
    ctx.fillStyle = colors.head;
    ctx.fillRect(
        x * GRID_SIZE,
        y * GRID_SIZE,
        GRID_SIZE - 2,
        GRID_SIZE - 2
    );

    // 计算眼睛位置（根据移动方向）
    let eye1X, eye1Y, eye2X, eye2Y;

    if (dx === 1 && dy === 0) { // 向右
        eye1X = x * GRID_SIZE + GRID_SIZE - 6;
        eye1Y = y * GRID_SIZE + 5;
        eye2X = x * GRID_SIZE + GRID_SIZE - 6;
        eye2Y = y * GRID_SIZE + GRID_SIZE - 7;
    } else if (dx === -1 && dy === 0) { // 向左
        eye1X = x * GRID_SIZE + 4;
        eye1Y = y * GRID_SIZE + 5;
        eye2X = x * GRID_SIZE + 4;
        eye2Y = y * GRID_SIZE + GRID_SIZE - 7;
    } else if (dy === 1 && dx === 0) { // 向下
        eye1X = x * GRID_SIZE + 5;
        eye1Y = y * GRID_SIZE + GRID_SIZE - 6;
        eye2X = x * GRID_SIZE + GRID_SIZE - 7;
        eye2Y = y * GRID_SIZE + GRID_SIZE - 6;
    } else if (dy === -1 && dx === 0) { // 向上
        eye1X = x * GRID_SIZE + 5;
        eye1Y = y * GRID_SIZE + 4;
        eye2X = x * GRID_SIZE + GRID_SIZE - 7;
        eye2Y = y * GRID_SIZE + 4;
    } else { // 初始状态（没有移动）
        eye1X = x * GRID_SIZE + GRID_SIZE - 6;
        eye1Y = y * GRID_SIZE + 5;
        eye2X = x * GRID_SIZE + GRID_SIZE - 6;
        eye2Y = y * GRID_SIZE + GRID_SIZE - 7;
    }

    // 绘制眼睛（白色底）
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eye1X, eye1Y, 3, 0, Math.PI * 2);
    ctx.arc(eye2X, eye2Y, 3, 0, Math.PI * 2);
    ctx.fill();

    // 绘制眼珠（黑色）
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(eye1X, eye1Y, 1.5, 0, Math.PI * 2);
    ctx.arc(eye2X, eye2Y, 1.5, 0, Math.PI * 2);
    ctx.fill();
}

// 绘制游戏画面
function draw() {
    // 清空画布（黑色背景）
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制蛇身
    const colors = snakeColors[currentSnakeColor];
    snake.forEach((segment, index) => {
        if (index === 0) {
            // 绘制蛇头（带眼睛）
            drawSnakeHead(segment.x, segment.y);
        } else {
            // 绘制蛇身
            ctx.fillStyle = colors.body;
            ctx.fillRect(
                segment.x * GRID_SIZE,
                segment.y * GRID_SIZE,
                GRID_SIZE - 2,
                GRID_SIZE - 2
            );
        }
    });

    // 绘制苹果
    drawApple(food.x, food.y);

    // 绘制网格线（淡灰色）
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    for (let i = 0; i <= TILE_COUNT; i++) {
        // 垂直线
        ctx.beginPath();
        ctx.moveTo(i * GRID_SIZE, 0);
        ctx.lineTo(i * GRID_SIZE, canvas.height);
        ctx.stroke();

        // 水平线
        ctx.beginPath();
        ctx.moveTo(0, i * GRID_SIZE);
        ctx.lineTo(canvas.width, i * GRID_SIZE);
        ctx.stroke();
    }
}

// ========== 游戏控制函数 ==========

// 开始游戏
function startGame() {
    if (gameRunning) return;

    // 重置游戏状态
    snake = [{ x: 10, y: 10 }];
    dx = 1; // 初始向右移动
    dy = 0;
    score = 0;
    speedLevel = 1;
    gameSpeed = 200;
    scoreElement.textContent = score;
    speedLevelElement.textContent = speedLevel;
    gameRunning = true;
    gamePaused = false;
    gameOverElement.classList.add('hidden');

    // 生成初始食物
    generateFood();

    // 开始游戏循环
    gameLoop = setInterval(update, gameSpeed);

    // 绘制初始画面
    draw();
}

// 游戏结束
function gameOver() {
    gameRunning = false;
    clearInterval(gameLoop);

    // 播放游戏结束音效
    playGameOverSound();

    // 显示游戏结束界面
    finalScoreElement.textContent = score;
    gameOverElement.classList.remove('hidden');
}

// 重新开始游戏
function restartGame() {
    clearInterval(gameLoop);
    gameRunning = false;
    startGame();
}

// 切换暂停状态
function togglePause() {
    if (!gameRunning) return;
    gamePaused = !gamePaused;
}

// ========== 背景音乐控制 ==========
musicSelect.addEventListener('change', (e) => {
    const selectedMusic = e.target.value;

    // 停止当前音乐
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic = null;
    }

    // 播放新音乐
    if (selectedMusic !== 'none') {
        backgroundMusic = new Audio(musicUrls[selectedMusic]);
        backgroundMusic.loop = true;
        backgroundMusic.volume = 0.3;
        backgroundMusic.play().catch(err => {
            console.log('音乐播放失败（可能需要用户交互）:', err);
        });
    }
});

// ========== 蛇颜色切换 ==========
const colorButtons = document.querySelectorAll('.color-btn');
colorButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // 移除所有active类
        colorButtons.forEach(b => b.classList.remove('active'));

        // 添加active类到当前按钮
        btn.classList.add('active');

        // 更新蛇的颜色
        currentSnakeColor = btn.dataset.color;

        // 重新绘制
        draw();
    });
});

// ========== 键盘控制 ==========
document.addEventListener('keydown', (e) => {
    // 防止方向键滚动页面
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }

    switch (e.key) {
        case 'ArrowUp':
            if (dy === 0) { // 防止反向移动
                dx = 0;
                dy = -1;
            }
            break;
        case 'ArrowDown':
            if (dy === 0) {
                dx = 0;
                dy = 1;
            }
            break;
        case 'ArrowLeft':
            if (dx === 0) {
                dx = -1;
                dy = 0;
            }
            break;
        case 'ArrowRight':
            if (dx === 0) {
                dx = 1;
                dy = 0;
            }
            break;
        case ' ':
            togglePause();
            break;
    }
});

// ========== 按钮事件监听 ==========
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', restartGame);
document.getElementById('playAgainBtn').addEventListener('click', restartGame);

// 方向控制按钮事件
document.getElementById('upBtn').addEventListener('click', () => {
    if (dy === 0) { // 防止反向移动
        dx = 0;
        dy = -1;
    }
});

document.getElementById('downBtn').addEventListener('click', () => {
    if (dy === 0) {
        dx = 0;
        dy = 1;
    }
});

document.getElementById('leftBtn').addEventListener('click', () => {
    if (dx === 0) {
        dx = -1;
        dy = 0;
    }
});

document.getElementById('rightBtn').addEventListener('click', () => {
    if (dx === 0) {
        dx = 1;
        dy = 0;
    }
});

// ========== 初始化 ==========
// 绘制初始静态画面
draw();