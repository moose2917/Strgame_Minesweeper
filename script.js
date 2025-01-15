console.log('Script loaded');

const gridSize = 10;
const mineCount = 5;
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
    '🍑': "對不起<br><span style='font-size: 0.8em'>我應該好好說話</span>",
    '🐲': "對不起<br><span style='font-size: 0.8em'>我不知道為什麼要對不起</span>",
    '🎤': "對不起<br><span style='font-size: 0.8em'>喜劇演員應該要承擔更多社會責任</span>",
    '🙇‍♂️': "對不起<br><span style='font-size: 0.8em'>目前還沒有做錯什麼，但我先道歉以備不時之需</span>"
};

let rankings = [];
const MAX_RANKINGS = 10; // Maximum number of rankings to display

// Load rankings immediately when script loads
const savedRankings = localStorage.getItem('minesweeperRankings');
if (savedRankings) {
    rankings = JSON.parse(savedRankings);
} else {
    // Initialize empty rankings array if none exists
    localStorage.setItem('minesweeperRankings', JSON.stringify([]));
}

// Add this helper function to format time
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

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
    
    // Stop the timer when winning
    clearInterval(timer);
    
    // Remove any existing win message first
    const existingWinMessage = document.getElementById('winMessage');
    if (existingWinMessage) {
        existingWinMessage.remove();
    }
    
    // Save the ranking and show message based on whether it was updated
    saveRanking(playerName, seconds).then(wasUpdated => {
        const winMessage = document.createElement('div');
        winMessage.id = 'winMessage';
        winMessage.style.position = 'fixed';
        winMessage.style.top = '50%';
        winMessage.style.left = '50%';
        winMessage.style.transform = 'translate(-50%, -50%)';
        winMessage.style.background = 'rgba(0, 0, 0, 0.5)';
        winMessage.style.padding = '40px';
        winMessage.style.borderRadius = '10px';
        winMessage.style.color = 'white';
        winMessage.style.textAlign = 'center';
        winMessage.style.zIndex = '1000';
        winMessage.style.minWidth = '300px';
        winMessage.style.width = '80%';
        winMessage.style.maxWidth = '400px';
        
        winMessage.innerHTML = `
            <h2>恭喜!<br>賀瓏又度過了平安的一集</h2>
            <p>完成時間: ${formatTime(seconds)}</p>
            ${wasUpdated ? '<p style="color: #ff0000; margin-top: 5px;">成功更新排行榜</p>' : ''}
            <button class="view-rankings-btn">查看排行榜</button>
            <button class="restart-btn">再玩一次</button>
        `;
        
        document.body.appendChild(winMessage);
        
        // Add event listeners
        document.querySelector('.view-rankings-btn').addEventListener('click', showRankings);
        document.querySelector('.restart-btn').addEventListener('click', () => {
            document.getElementById('winMessage').remove();
            initializeGame();
        });
    });
    
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
            <div class="banner-container">
                <div class="banner-wrapper">
                    <img src="image/TNNSS2_Banner.png" alt="TNNS Banner" class="ad-banner">
                </div>
            </div>
        </section>
    `;
    
    // Initialize game after DOM elements are created
    setTimeout(() => {
        initializeGame();
        setupEventListeners();
        updateDeviceSpecificElements();
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
    console.log('開始播放廣告');
    
    // 隱藏失敗訊息
    const loseMessage = document.getElementById('loseMessage');
    if (loseMessage) loseMessage.style.display = 'none';
    
    // 顯示廣告容器
    const adContainer = document.getElementById('adContainer');
    const video = document.getElementById('adVideo');
    const skipButton = document.getElementById('skipAdButton');
    
    adContainer.style.display = 'block';
    
    // 重置視頻
    video.currentTime = 0;
    video.load();
    
    // 設置視頻屬性
    video.playsInline = true;  // 防止全螢幕播放
    video.play();
    
    // 5秒後顯示跳過按鈕
    setTimeout(() => {
        skipButton.style.display = 'block';
    }, 5000);
    
    // 添加跳過按鈕事件
    skipButton.onclick = () => {
        video.pause();
        adContainer.style.display = 'none';
        skipButton.style.display = 'none';
        initializeGame();
    };
    
    // 視頻結束時的處理
    video.onended = () => {
        adContainer.style.display = 'none';
        initializeGame();
    };
}

const bannerData = [
    {
        image: 'image/TNNSS2_Banner.png',
        link: 'https://go.fansi.me/Tickets/events/210001'
    },
    /*{
        image: 'image/TheDriller_Banner.png',
        link: 'https://content.strnetwork.cc/courses/thedriller'
    },*/
    {
        image: 'image/G8_Banner.png',
        link: 'https://content.strnetwork.cc/courses/g8-2023'
    },
    {
        image: 'image/dotcome_Banner.png',
        link: 'https://content.strnetwork.cc/courses/dacon2023'
    },
    /*{
        image: 'image/BURNTGOP_Banner.png',
        link: 'https://content.strnetwork.cc/courses/burn-tgop'
    },*/
    {
        image: 'image/BBK_Banner.png',
        link: 'https://content.strnetwork.cc/courses/bbklucas2024'
    },
    {
        image: 'image/SIABTC_Banner.png',
        link: 'https://content.strnetwork.cc/courses/storminabubbleteacup'
    },
    {
        image: 'image/Merchandise_Banner.png',
        link: null  // 設為 null 表示無連結
    }
];

function initBannerRotation() {
    const bannerContainer = document.querySelector('.banner-container');
    bannerContainer.innerHTML = bannerData.map(banner => {
        if (banner.link) {
            return `
                <a href="${banner.link}" class="banner-link" target="_blank">
                    <img src="${banner.image}" alt="Banner" class="banner-image">
                </a>
            `;
        } else {
            return `
                <div class="banner-link">
                    <img src="${banner.image}" alt="Banner" class="banner-image">
                </div>
            `;
        }
    }).join('');

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
    
    // Load existing rankings from localStorage
    const savedRankings = localStorage.getItem('minesweeperRankings');
    if (savedRankings) {
        rankings = JSON.parse(savedRankings);
    }
    
    const startGameBtn = document.getElementById('startGameBtn');
    if (startGameBtn) {
        startGameBtn.addEventListener('click', validateAndStartGame);
    }
    
    const closeRankingBtn = document.querySelector('.close-ranking-btn');
    if (closeRankingBtn) {
        closeRankingBtn.addEventListener('click', () => {
            document.getElementById('rankingModal').style.display = 'none';
        });
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
    
    // Show all mines
    minePositions.forEach(([r, c]) => {
        const cellElement = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
        if (!board[r][c].revealed) {
            cellElement.textContent = board[r][c].mineImage;
            cellElement.style.fontSize = '16px';
            cellElement.classList.add('revealed');
        }
    });
    
    // 添加燃燒效果
    const gameBoard = document.getElementById('gameBoard');
    const burningEffect = document.createElement('div');
    burningEffect.className = 'burning-effect';
    gameBoard.appendChild(burningEffect);
    
    // 延遲 2 秒後顯示失敗訊息
    setTimeout(() => {
        // Create and show lose message
        const loseMessage = document.createElement('div');
        loseMessage.id = 'loseMessage';
        loseMessage.style.position = 'fixed';
        loseMessage.style.top = '50%';
        loseMessage.style.left = '50%';
        loseMessage.style.transform = 'translate(-50%, -50%)';
        loseMessage.style.background = 'rgba(0, 0, 0, 0.7)';
        loseMessage.style.padding = '40px';
        loseMessage.style.borderRadius = '10px';
        loseMessage.style.color = 'white';
        loseMessage.style.textAlign = 'center';
        loseMessage.style.zIndex = '1000';
        loseMessage.style.minWidth = '300px';
        loseMessage.style.width = '80%';
        loseMessage.style.maxWidth = '400px';
        
        loseMessage.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 10px;">${board[row][col].mineImage}</div>
            <h2>${MINE_MESSAGES[board[row][col].mineImage]}</h2>
            <button id="restartGameBtn" class="restart-btn">再次挑戰</button>
        `;
        
        document.body.appendChild(loseMessage);
        
        // Add click event for restart button
        document.getElementById('restartGameBtn').addEventListener('click', startAd);
    }, 2000); // 2秒延遲
}

// Get Firestore instance
const db = firebase.firestore();

function saveRanking(name, time) {
    if (time === 0) return;
    
    // Get current rankings to check if new score qualifies
    return db.collection('rankings')
        .orderBy('time', 'desc')
        .limit(10)
        .get()
        .then((querySnapshot) => {
            const currentRankings = querySnapshot.docs.map(doc => doc.data());
            const shouldAddScore = currentRankings.length < 10 || time < currentRankings[currentRankings.length - 1].time;
            
            if (shouldAddScore) {
                // Add new ranking if it qualifies
                return db.collection('rankings').add({
                    name: name,
                    time: time,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => true); // Return true if ranking was updated
            }
            return false; // Return false if ranking wasn't updated
        });
}

function showRankings() {
    // Get rankings from Firestore
    db.collection('rankings')
        .orderBy('time', 'asc')
        .limit(10)
        .get()
        .then((querySnapshot) => {
            const tableBody = document.querySelector('#rankingTable tbody');
            tableBody.innerHTML = '';
            
            querySnapshot.docs.forEach((doc, index) => {
                const data = doc.data();
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${data.name}</td>
                    <td>${formatTime(data.time)}</td>
                `;
                tableBody.appendChild(row);
            });
            
            document.getElementById('rankingModal').style.display = 'flex';
        })
        .catch((error) => {
            console.error('Error getting rankings:', error);
        });
}

// Test connection
async function testFirebase() {
    try {
        await db.collection('rankings').get();
        console.log('Successfully connected to Firebase!');
    } catch (error) {
        console.error('Error connecting to Firebase:', error);
    }
}

// Call test function when page loads
document.addEventListener('DOMContentLoaded', testFirebase);
