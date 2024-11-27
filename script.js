console.log('Script loaded');

const gridSize = 10;
const mineCount = 10;
let board = [];
let minePositions = [];
let timer;
let seconds = 0;
let remainingMines = mineCount;
let gameStarted = false;
let currentMode = 'dig';  // Default mode
let playerName = '';
let isFirstClose = true;  // 追踪是否第一次關閉
const REDIRECT_URL = "https://content.strnetwork.cc/courses/storminabubbleteacup";  // 在這裡設置要跳轉的網址

const EMOJI_STATES = {
    NORMAL: '🙂',
    SMILE: '😊',
    CRY: '😢'
};

// 在文件開頭添加圖片陣列
const mineImages = [
    'image/bump_bedroom.png',
    'image/bump_hot-spring.png',
    'image/bump_swwimming-pool.png'
];

function isTouchDevice() {
    return (('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            (navigator.msMaxTouchPoints > 0));
}

function updateDeviceSpecificElements() {
    console.log('Updating device specific elements');
    
    const desktopInstruction = document.querySelector('.desktop-instruction');
    const modeToggle = document.querySelector('.mode-toggle');
    
    if (isTouchDevice()) {
        if (desktopInstruction) desktopInstruction.style.display = 'none';
        if (modeToggle) modeToggle.style.display = 'flex';
    } else {
        if (desktopInstruction) desktopInstruction.style.display = 'inline-block';
        if (modeToggle) modeToggle.style.display = 'none';
    }
}

function initializeGame() {
    clearInterval(timer);
    seconds = 0;
    remainingMines = mineCount;
    gameStarted = false;
    
    document.querySelector('.reset-button').textContent = EMOJI_STATES.NORMAL;
    document.querySelector('.mine-counter').textContent = String(remainingMines).padStart(3, '0');
    document.querySelector('.timer').textContent = '00:00';
    
    document.getElementById('winMessage').style.display = 'none';
    document.getElementById('loseMessage').style.display = 'none';
    
    board = Array.from({ length: gridSize }, () => 
        Array(gridSize).fill().map(() => ({
            mine: false,
            revealed: false,
            flagged: false,
            adjacentMines: 0
        }))
    );
    
    minePositions = [];
    
    const gameBoard = document.getElementById("gameBoard");
    gameBoard.classList.remove('burning');
    gameBoard.innerHTML = '';
    
    // Add mode toggle handlers
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            modeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;
        });
    });
    
    // Update cell click handlers for mobile
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const cell = document.createElement("div");
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            // Single click handler for mobile
            cell.addEventListener('click', (e) => {
                if (currentMode === 'dig') {
                    revealCell(row, col);
                } else {
                    toggleFlag(row, col);
                }
            });
            
            // Keep right-click for desktop
            cell.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                toggleFlag(row, col);
            });
            
            gameBoard.appendChild(cell);
        }
    }
    
    placeMines();
    calculateAdjacentMines();
    
    // 初始化 banner 輪播
    initBannerRotation();
}

function placeMines() {
    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
        const row = Math.floor(Math.random() * gridSize);
        const col = Math.floor(Math.random() * gridSize);
        if (!board[row][col].mine) {
            board[row][col].mine = true;
            minePositions.push([row, col]);
            minesPlaced++;
        }
    }
}

function calculateAdjacentMines() {
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            if (!board[row][col].mine) {
                let count = 0;
                getNeighbors(row, col).forEach(([r, c]) => {
                    if (board[r][c].mine) count++;
                });
                board[row][col].adjacentMines = count;
            }
        }
    }
}

function getNeighbors(row, col) {
    const neighbors = [];
    for (let r = -1; r <= 1; r++) {
        for (let c = -1; c <= 1; c++) {
            const newRow = row + r;
            const newCol = col + c;
            if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
                neighbors.push([newRow, newCol]);
            }
        }
    }
    return neighbors;
}

function revealCell(row, col) {
    if (board[row][col].revealed || board[row][col].flagged) return;
    
    if (!gameStarted) {
        gameStarted = true;
        startTimer();
    }
    
    board[row][col].revealed = true;
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    cell.classList.add('revealed');
    
    if (board[row][col].mine) {
        cell.style.backgroundImage = "url('image/bump_hot-spring.png')";
        cell.style.backgroundSize = 'contain';
        cell.style.backgroundPosition = 'center';
        cell.style.backgroundRepeat = 'no-repeat';
        gameOver();
    } else if (board[row][col].adjacentMines > 0) {
        cell.textContent = board[row][col].adjacentMines;
        cell.dataset.mines = board[row][col].adjacentMines;
    } else {
        getNeighbors(row, col).forEach(([r, c]) => {
            if (!board[r][c].revealed) revealCell(r, c);
        });
    }
    
    checkWin();
}

function startTimer() {
    timer = setInterval(() => {
        seconds++;
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        // Ensure the timer stays within bounds by limiting to 99:99
        if (seconds > 5999) {  // 99 minutes * 60 seconds
            clearInterval(timer);
        } else {
            document.querySelector('.timer').textContent = 
                `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
    }, 1000);
}

function toggleFlag(row, col) {
    if (board[row][col].revealed) return;
    
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    if (!board[row][col].flagged && remainingMines > 0) {
        board[row][col].flagged = true;
        cell.classList.add('flagged');
        cell.innerHTML = '🚩';
        remainingMines--;
    } else if (board[row][col].flagged) {
        board[row][col].flagged = false;
        cell.classList.remove('flagged');
        cell.innerHTML = '';
        remainingMines++;
    }
    
    document.querySelector('.mine-counter').textContent = 
        String(remainingMines).padStart(3, '0');
}

function checkWin() {
    let allNonMinesRevealed = true;
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            if (!board[row][col].mine && !board[row][col].revealed) {
                allNonMinesRevealed = false;
                break;
            }
        }
    }
    
    if (allNonMinesRevealed) {
        clearInterval(timer);
        document.querySelector('.reset-button').textContent = EMOJI_STATES.SMILE;
        
        minePositions.forEach(([row, col]) => {
            const mineCell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
            mineCell.classList.add('revealed');
            mineCell.innerHTML = '💣';
        });
        
        const winMessage = document.getElementById('winMessage');
        winMessage.style.display = 'flex';
        winMessage.style.flexDirection = 'column';
    }
}

// Reset mode when starting new game
function resetGame() {
    currentMode = 'dig';
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.mode === 'dig') {
            btn.classList.add('active');
        }
    });
    initializeGame();
}

function validateAndStartGame() {
    console.log('validateAndStartGame called');
    
    const nameInput = document.getElementById('playerName');
    const errorElement = document.getElementById('nameError');
    const name = nameInput.value.trim();
    
    if (name === '') {
        errorElement.textContent = '請輸入你的名字！';
        return;
    }
    
    playerName = name;
    errorElement.textContent = '';
    
    // 隱藏信息頁面
    const infoPage = document.getElementById('infoPage');
    infoPage.style.display = 'none';
    console.log('Info page hidden');
    
    // 顯示遊戲界面
    const gameWrapper = document.getElementById('gameWrapper');
    gameWrapper.style.display = 'block';
    console.log('Game wrapper displayed');
    
    // 重新初始化遊戲
    initializeGame();
    console.log('Game initialized');
}

function handleGameLose() {
    // 顯示失敗訊息
    const loseMessage = document.getElementById('loseMessage');
    loseMessage.style.display = 'flex';
    
    // 暫時註解掉 lottery 相關的代碼
    /*
    // 顯示抽獎容器
    const lotteryContainer = document.getElementById('lotteryContainer');
    if (lotteryContainer) {
        lotteryContainer.style.display = 'block';
    }
    
    // 添加關閉按鈕事件
    const closeBtn = document.querySelector('.close-lottery-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            lotteryContainer.style.display = 'none';
        });
    }
    */
    
    // 顯示觀看廣告按鈕
    const watchAdButton = document.getElementById('watchAdButton');
    if (watchAdButton) {
        watchAdButton.style.display = 'block';
    }
}

function startAd() {
    // 移除燃燒效果
    const gameBoard = document.getElementById('gameBoard');
    gameBoard.classList.remove('burning');
    
    // 隱藏觀看廣告按鈕和失敗訊息標題
    document.getElementById('watchAdButton').style.display = 'none';
    document.querySelector('#loseMessage h2').style.display = 'none';
    
    // 顯示廣告容器
    const adContainer = document.getElementById('adContainer');
    adContainer.style.display = 'block';
    
    const video = document.getElementById('adVideo');
    const timerDisplay = document.getElementById('adTimer');
    const skipButton = document.getElementById('skipAdButton');
    const closeButton = document.getElementById('closeAdButton');
    
    // 隱藏略過按鈕和關閉按鈕
    skipButton.style.display = 'none';
    closeButton.style.display = 'none';
    
    // 重置視頻
    video.currentTime = 0;
    video.load();
    
    // 設置視頻屬性
    video.playsInline = true;
    video.muted = false;
    video.controls = false;
    
    // 嘗試播放視頻
    const playPromise = video.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            console.log('視頻開始播放');
        }).catch(error => {
            console.error('視頻播放失敗:', error);
        });
    }
    
    // 更新計時器和檢查是否顯示略過按鈕
    const updateTimer = () => {
        const timeLeft = Math.ceil(video.duration - video.currentTime);
        timerDisplay.textContent = timeLeft;
        
        // 在播放 10 秒後顯示略過按鈕
        if (video.currentTime >= 10 && skipButton.style.display === 'none') {
            skipButton.style.display = 'block';
        }
    };
    
    // 監聽視頻播放時間更新
    video.addEventListener('timeupdate', updateTimer);
    
    // 設置略過廣告按鈕點擊事件
    skipButton.onclick = () => {
        // 停止視頻播放
        video.pause();
        
        // 關閉廣告並重新開始遊戲
        document.getElementById('loseMessage').style.display = 'none';
        adContainer.style.display = 'none';
        skipButton.style.display = 'none';
        closeButton.style.display = 'none';
        document.querySelector('#loseMessage h2').style.display = 'block';
        
        // 重新開始遊戲
        initializeGame();
    };
    
    // 視頻結束時的處理
    video.addEventListener('ended', () => {
        // 暫停在最後一幀
        video.pause();
        
        // 隱藏略過按鈕
        skipButton.style.display = 'none';
        
        // 顯示關閉按鈕
        closeButton.style.display = 'flex';
        
        // 設置關閉按鈕點擊事件
        closeButton.onclick = () => {
            if (isFirstClose) {
                // 第一次點擊：跳轉到指定站並關閉廣告
                isFirstClose = false;
                window.open(REDIRECT_URL, '_blank');
                
                // 關閉廣告並重新開始遊戲
                document.getElementById('loseMessage').style.display = 'none';
                adContainer.style.display = 'none';
                closeButton.style.display = 'none';
                document.querySelector('#loseMessage h2').style.display = 'block';
                isFirstClose = true;
                initializeGame();
            }
        };
    });
}

// Banner 輪播功能
function initBannerRotation() {
    const container = document.querySelector('.banner-container');
    let currentIndex = -1;  // 從 -1 開始，這樣第一次執行時會顯示第一張圖
    
    function rotateBanner() {
        currentIndex++;
        
        if (currentIndex >= 3) {
            // 當到第三張時，直接跳回第一張
            currentIndex = 0;
            // 關閉過渡效果
            container.style.transition = 'none';
            container.style.transform = 'translateX(0)';
            // 重新開啟過渡效果
            setTimeout(() => {
                container.style.transition = 'transform 0.5s ease';
            }, 50);
        } else {
            // 正常切換
            container.style.transition = 'transform 0.5s ease';
            container.style.transform = `translateX(-${currentIndex * 33.333}%)`;
        }
    }

    // 設置初始狀態
    container.style.transform = 'translateX(0)';  // 確保一開始顯示第一張圖
    container.style.transition = 'transform 0.5s ease';
    
    // 設置輪播間隔
    setInterval(rotateBanner, 3000);
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    // 確保遊戲界面一開始是隱藏的
    const gameWrapper = document.getElementById('gameWrapper');
    if (gameWrapper) {
        gameWrapper.style.display = 'none';
    }
    
    // 確保信息頁面一開始是顯示的
    const infoPage = document.getElementById('infoPage');
    if (infoPage) {
        infoPage.style.display = 'flex';
    }
    
    // 添加開始遊戲按鈕的事件監聽器
    const startGameBtn = document.getElementById('startGameBtn');
    if (startGameBtn) {
        startGameBtn.addEventListener('click', validateAndStartGame);
        console.log('Start game button listener added');
    }
    
    // 添加輸入框的 Enter 鍵支持
    const playerNameInput = document.getElementById('playerName');
    if (playerNameInput) {
        playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                validateAndStartGame();
            }
        });
    }
    
    // 更新設備特定元素
    updateDeviceSpecificElements();
    
    // 確保頁面加載完成後始化輪播
    initBannerRotation();
});

// 修改 gameOver 函數，顯示所有地雷時也使用隨機圖片
function gameOver() {
    clearInterval(timer);
    document.querySelector('.reset-button').textContent = EMOJI_STATES.CRY;
    
    // 顯示所有地雷
    minePositions.forEach(([row, col]) => {
        const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (!board[row][col].revealed) {
            cellElement.style.backgroundImage = "url('image/bump_hot-spring.png')";
            cellElement.style.backgroundSize = 'contain';
            cellElement.style.backgroundPosition = 'center';
            cellElement.style.backgroundRepeat = 'no-repeat';
            cellElement.classList.add('revealed');
        }
    });
    
    handleGameLose();
}
