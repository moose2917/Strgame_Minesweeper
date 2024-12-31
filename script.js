console.log('Script loaded');

const gridSize = 10;
const mineCount = 15;
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
const mineImages = ['😞', '🍑', '🐲', '🎤', '🙇‍♂️'];

const MINE_MESSAGES = {
    '😞': "對不起<br><span style='font-size: 0.8em'>喜劇演員不該嘻嘻哈哈</span>",
    '🍑': "對不起<br><span style='font-size: 0.8em'>我應該好好講話</span>",
    '🐲': "對不起<br><span style='font-size: 0.8em'>我不知道為什麼要對不起</span>",
    '🎤': "對不起<br><span style='font-size: 0.8em'>喜劇演員應該要承擔更多社會責任</span>",
    '🙇‍♂️': "對不起<br><span style='font-size: 0.8em'>目前還沒有做錯什麼，但我先道歉以備不時之需</span>"
};

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
    console.log('Initializing game...');
    
    // Remove any existing win/lose messages
    const winMessage = document.getElementById('winMessage');
    const loseMessage = document.getElementById('loseMessage');
    if (winMessage) winMessage.remove();
    if (loseMessage) loseMessage.remove();
    
    clearInterval(timer);
    seconds = 0;
    remainingMines = mineCount;
    gameStarted = false;
    
    document.querySelector('.mine-counter').textContent = String(remainingMines).padStart(3, '0');
    document.querySelector('.reset-button').textContent = EMOJI_STATES.NORMAL;
    document.querySelector('.timer').textContent = '00:00';
    
    // Initialize board array
    board = Array.from({ length: gridSize }, () => 
        Array(gridSize).fill().map(() => ({
            mine: false,
            revealed: false,
            flagged: false,
            adjacentMines: 0,
            mineImage: null
        }))
    );
    
    minePositions = [];
    
    // Create game board cells
    const gameBoard = document.getElementById('gameBoard');
    if (!gameBoard) {
        console.error('找不到遊戲板元素');
        return;
    }
    
    gameBoard.classList.remove('burning');
    gameBoard.innerHTML = '';
    
    // Create cells
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const cell = document.createElement("div");
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            // Add click handlers
            cell.addEventListener('click', () => {
                if (currentMode === 'dig') {
                    revealCell(row, col);
                } else {
                    toggleFlag(row, col);
                }
            });
            
            // Add right-click handler for flagging
            cell.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                toggleFlag(row, col);
            });
            
            gameBoard.appendChild(cell);
        }
    }
    
    // Place mines after creating cells
    placeMines();
    calculateAdjacentMines();
    
    // 初始化 banner 輪播
    initBannerRotation();
    
    // 隱藏疫苗圖片
    const vaccineImage = document.querySelector('.vaccine-image');
    if (vaccineImage) {
        vaccineImage.style.display = 'none';
    }
    
    // Re-enable cell interactions
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.style.pointerEvents = 'auto';
    });
    
    setupEventListeners();
}

function placeMines() {
    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
        const row = Math.floor(Math.random() * gridSize);
        const col = Math.floor(Math.random() * gridSize);
        if (!board[row][col].mine) {
            board[row][col].mine = true;
            board[row][col].mineImage = mineImages[Math.floor(Math.random() * mineImages.length)];
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
    
    // Start timer on first click
    if (!gameStarted) {
        gameStarted = true;
        timer = setInterval(() => {
            seconds++;
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            document.querySelector('.timer').textContent = 
                `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
        }, 1000);
    }
    
    if (board[row][col].mine) {
        gameOver(row, col);
        return;
    }
    
    board[row][col].revealed = true;
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    cell.classList.add('revealed');
    
    if (board[row][col].adjacentMines > 0) {
        cell.textContent = board[row][col].adjacentMines;
        cell.dataset.mines = board[row][col].adjacentMines;
    } else {
        // Reveal adjacent cells
        getNeighbors(row, col).forEach(([r, c]) => {
            if (!board[r][c].revealed) revealCell(r, c);
        });
    }
    
    // Check for win after successful reveal
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
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            if (!board[row][col].mine && !board[row][col].revealed) {
                return false;
            }
        }
    }
    
    // Remove any existing win message first
    const existingWinMessage = document.getElementById('winMessage');
    if (existingWinMessage) {
        existingWinMessage.remove();
    }
    
    // Display win message
    const winMessage = document.createElement('div');
    winMessage.id = 'winMessage';
    winMessage.style.position = 'fixed';
    winMessage.style.top = '50%';
    winMessage.style.left = '50%';
    winMessage.style.transform = 'translate(-50%, -50%)';
    winMessage.style.background = 'rgba(0, 0, 0, 0.9)';
    winMessage.style.padding = '40px';
    winMessage.style.borderRadius = '10px';
    winMessage.style.color = 'white';
    winMessage.style.textAlign = 'center';
    winMessage.style.zIndex = '1000';
    winMessage.style.minWidth = '300px';
    winMessage.style.width = '80%';
    winMessage.style.maxWidth = '400px';
    
    winMessage.innerHTML = `
        <h2>恭喜你又讓賀瓏度過平安的一集!</h2>
        <button class="restart-btn">再玩一次</button>
    `;
    
    // Create a new button and replace the existing one to avoid event listener stacking
    const restartBtn = winMessage.querySelector('.restart-btn');
    const newRestartBtn = restartBtn.cloneNode(true);
    restartBtn.parentNode.replaceChild(newRestartBtn, restartBtn);
    
    // Add event listener to the new button
    newRestartBtn.addEventListener('click', () => {
        document.getElementById('winMessage').remove();
        initializeGame();
    });
    
    document.body.appendChild(winMessage);
    return true;
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
    
    // Clear main content but keep the structure
    const main = document.querySelector('main');
    main.style.height = '80vh';
    main.className = 'game-page-main';
    main.innerHTML = `
        <section class="gameplay-section">
            <div class="game-wrapper">
                <div class="game-container">
                    <div class="status-bar">
                        <div class="mine-counter">010</div>
                        <button class="reset-button">🙂</button>
                        <div class="timer">00:00</div>
                    </div>
                    <div id="gameBoard"></div>
                    <div class="mode-toggle">
                        <button class="mode-btn active" data-mode="dig">⛏️挖掘</button>
                        <button class="mode-btn" data-mode="flag">🚩標記</button>
                    </div>
                </div>
            </div>
        </section>
        <section class="game-ad-section">
            <img src="image/TNNS_Banner.png" alt="TNNS Banner" class="ad-banner">
        </section>
    `;
    
    setTimeout(() => {
        initializeGame();
        setupEventListeners();
    }, 0);
}

function setupEventListeners() {
    // Mode toggle buttons
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(button => {
        // Remove any existing event listeners
        button.replaceWith(button.cloneNode(true));
    });

    // Re-add event listeners to the fresh buttons
    document.querySelectorAll('.mode-btn').forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            document.querySelectorAll('.mode-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            // Add active class to clicked button
            button.classList.add('active');
            // Update current mode
            currentMode = button.dataset.mode;
            console.log('Mode changed to:', currentMode); // Debug log
        });
    });

    // Add reset button handler
    const resetButton = document.querySelector('.reset-button');
    if (resetButton) {
        resetButton.addEventListener('click', resetGame);
    }
}

function handleGameLose(clickedCell) {
    const loseMessage = document.getElementById('loseMessage');
    const messages = loseMessage.querySelectorAll('h2');
    
    // 獲取點擊的地雷圖片
    const mineImage = clickedCell.style.backgroundImage;
    
    // 隱藏所有訊息
    messages.forEach(msg => msg.style.display = 'none');
    
    // 根據地雷圖片顯示對應訊息
    if (mineImage.includes('bump_bedroom.png')) {
        messages[0].style.display = 'block';
    } 
    else if (mineImage.includes('bump_hot-spring.png') || mineImage.includes('bump_swimming-pool.png')) {
        messages[1].style.display = 'block';
    }
    else if (mineImage.includes('bump_vaccine.png')) {
        messages[2].style.display = 'block';
    }
    
    loseMessage.style.display = 'flex';
    
    // 移除舊的事件監聽器（如果有的話）
    const learnMoreBtn = document.getElementById('learnMoreBtn');
    const restartGameBtn = document.getElementById('restartGameBtn');
    
    learnMoreBtn.replaceWith(learnMoreBtn.cloneNode(true));
    restartGameBtn.replaceWith(restartGameBtn.cloneNode(true));
    
    // 重新添加事件監聽器
    document.getElementById('learnMoreBtn').addEventListener('click', showAd);
    document.getElementById('restartGameBtn').addEventListener('click', () => {
        loseMessage.style.display = 'none';
        initializeGame();
    });
    
    // 显示疫苗图片
    const vaccineImage = document.getElementById('vaccineImage');
    if (vaccineImage) {
        vaccineImage.style.display = 'block';
    }
}

function showAd() {
    const adContainer = document.getElementById('adContainer');
    const adVideo = document.getElementById('adVideo');
    const adTimer = document.getElementById('adTimer');
    const skipAdButton = document.getElementById('skipAdButton');
    const closeAdButton = document.getElementById('closeAdButton');
    let timeLeft = 29; // 廣告總時長

    // 重置按鈕狀態
    skipAdButton.style.display = 'none';
    closeAdButton.style.display = 'none';

    // 示廣告容器
    adContainer.style.display = 'block';
    
    // 重置並播放影片
    adVideo.currentTime = 0;
    adVideo.play();

    // 5秒後顯示略過按鈕
    setTimeout(() => {
        skipAdButton.style.display = 'block';
    }, 5000);

    // 計時器
    const timerInterval = setInterval(() => {
        timeLeft--;
        adTimer.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            closeAdButton.style.display = 'block';
        }
    }, 1000);

    // 影片結束時的處理
    adVideo.onended = () => {
        clearInterval(timerInterval);
        closeAdButton.style.display = 'block';
    };

    // 略過廣告按鈕事件
    skipAdButton.onclick = () => {
        adContainer.style.display = 'none';
        adVideo.pause();
        clearInterval(timerInterval);
        initializeGame();
    };

    // 關閉廣告按鈕事件
    closeAdButton.onclick = () => {
        adContainer.style.display = 'none';
        adVideo.pause();
        clearInterval(timerInterval);
        initializeGame();
    };
}

function startAd() {
    console.log('開始播放廣告'); // 添加調試日誌
    
    // 移除燃燒果
    const gameBoard = document.getElementById('gameBoard');
    gameBoard.classList.remove('burning');
    
    // 隱藏觀看廣告按鈕和失敗訊息標題
    const watchAdButton = document.getElementById('watchAdButton');
    const loseMessageTitle = document.querySelector('#loseMessage h2');
    
    if (watchAdButton) watchAdButton.style.display = 'none';
    if (loseMessageTitle) loseMessageTitle.style.display = 'none';
    
    // 顯示廣告容器
    const adContainer = document.getElementById('adContainer');
    if (adContainer) adContainer.style.display = 'block';
    
    const video = document.getElementById('adVideo');
    const timerDisplay = document.getElementById('adTimer');
    const skipButton = document.getElementById('skipAdButton');
    const closeButton = document.getElementById('closeAdButton');
    
    if (!video) {
        console.error('找不到視頻元素');
        return;
    }
    
    // 隱藏略過按鈕和關閉按鈕
    if (skipButton) skipButton.style.display = 'none';
    if (closeButton) closeButton.style.display = 'none';
    
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
            // 如果播放失敗，可以顯示錯誤訊息或直接重新開始遊戲
            initializeGame();
        });
    }
    
    // 更新計時器和檢查是否顯示略過按鈕
    const updateTimer = () => {
        if (!video.duration) return;
        const timeLeft = Math.ceil(video.duration - video.currentTime);
        if (timerDisplay) timerDisplay.textContent = timeLeft;
        
        // 在播放 5 秒後顯示略過按鈕
        if (video.currentTime >= 5 && skipButton) {
            skipButton.style.display = 'block';
        }
    };
    
    // 監聽視頻播放時間更新
    video.addEventListener('timeupdate', updateTimer);
    
    // 設置略過廣告按鈕點擊事件
    if (skipButton) {
        skipButton.onclick = () => {
            video.pause();
            document.getElementById('loseMessage').style.display = 'none';
            adContainer.style.display = 'none';
            skipButton.style.display = 'none';
            closeButton.style.display = 'none';
            if (loseMessageTitle) loseMessageTitle.style.display = 'block';
            initializeGame();
        };
    }
    
    // 視頻結束時的處理
    video.addEventListener('ended', () => {
        video.pause();
        if (skipButton) skipButton.style.display = 'none';
        if (closeButton) closeButton.style.display = 'flex';
        
        if (closeButton) {
            closeButton.onclick = () => {
                if (isFirstClose) {
                    isFirstClose = false;
                    window.open(REDIRECT_URL, '_blank');
                    
                    document.getElementById('loseMessage').style.display = 'none';
                    adContainer.style.display = 'none';
                    closeButton.style.display = 'none';
                    if (loseMessageTitle) loseMessageTitle.style.display = 'block';
                    isFirstClose = true;
                    initializeGame();
                }
            };
        }
    });
}

// Banner 輪播功能
function initBannerRotation() {
    const bannerLinks = document.querySelectorAll('.banner-link');
    let currentIndex = 0;
    let lastRotationTime = Date.now();
    
    bannerLinks.forEach(banner => {
        banner.style.display = 'none';
    });
    
    if (bannerLinks.length > 0) {
        bannerLinks[0].style.display = 'block';
    }
    
    function rotateBanner() {
        const currentTime = Date.now();
        if (currentTime - lastRotationTime >= 5000) {
            bannerLinks[currentIndex].style.display = 'none';
            currentIndex = (currentIndex + 1) % bannerLinks.length;
            bannerLinks[currentIndex].style.display = 'block';
            lastRotationTime = currentTime;
        }
    }
    
    setInterval(rotateBanner, 100);
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
        startGameBtn.addEventListener('click', function() {
            console.log('Start button clicked');
            // Replace main content with game interface
            const main = document.querySelector('main');
            main.style.height = '80vh';
            main.className = 'game-page-main';
            main.innerHTML = `
                <section class="gameplay-section">
                    <div class="game-wrapper">
                        <div class="game-container">
                            <div class="status-bar">
                                <div class="mine-counter">010</div>
                                <button class="reset-button">🙂</button>
                                <div class="timer">00:00</div>
                            </div>
                            <div id="gameBoard"></div>
                            <div class="mode-toggle">
                                <button class="mode-btn active" data-mode="dig">⛏️挖掘</button>
                                <button class="mode-btn" data-mode="flag">🚩標記</button>
                            </div>
                        </div>
                    </div>
                </section>
            `;
            
            // Initialize the game
            setTimeout(() => {
                initializeGame();
                setupEventListeners();
            }, 0);
        });
    }
    
    // 更新設備特定元素
    updateDeviceSpecificElements();
    
    // Initialize banner rotation if it exists
    if (document.querySelector('.banner-link')) {
        initBannerRotation();
    }
});

// Simplified start game function
function startGame() {
    const gameWrapper = document.getElementById('gameWrapper');
    const infoPage = document.getElementById('infoPage');
    
    if (gameWrapper && infoPage) {
        infoPage.style.display = 'none';
        gameWrapper.style.display = 'flex';
        // Add any additional game initialization logic here
    }
}

// 修改 gameOver 函數，顯示所有地雷時也使用隨機圖片
function gameOver(row, col) {
    clearInterval(timer);
    document.querySelector('.reset-button').textContent = EMOJI_STATES.CRY;
    
    // Disable all cell interactions
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.style.pointerEvents = 'none';
    });
    
    // Get the clicked mine's emoji and message
    const clickedMineEmoji = board[row][col].mineImage;
    const message = MINE_MESSAGES[clickedMineEmoji] || "遊戲結束!";
    
    // Show all mines
    minePositions.forEach(([r, c]) => {
        const cellElement = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
        if (!board[r][c].revealed) {
            cellElement.textContent = board[r][c].mineImage;
            cellElement.style.fontSize = '16px';
            cellElement.classList.add('revealed');
        }
    });
    
    // Display lose message with the touched mine
    const loseMessage = document.createElement('div');
    loseMessage.id = 'loseMessage';
    loseMessage.style.position = 'fixed';
    loseMessage.style.top = '50%';
    loseMessage.style.left = '50%';
    loseMessage.style.transform = 'translate(-50%, -50%)';
    loseMessage.style.background = 'rgba(0, 0, 0, 0.9)';
    loseMessage.style.padding = '40px';
    loseMessage.style.borderRadius = '10px';
    loseMessage.style.color = 'white';
    loseMessage.style.textAlign = 'center';
    loseMessage.style.zIndex = '1000';
    loseMessage.style.minWidth = '300px';
    loseMessage.style.width = '80%';
    loseMessage.style.maxWidth = '400px';
    
    loseMessage.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 10px;">${clickedMineEmoji}</div>
        <h2>${message}</h2>
        <button onclick="initializeGame()" class="restart-btn">重新開始</button>
    `;
    document.body.appendChild(loseMessage);
}
