const gridSize = 15;
const mineCount = 10;
let board = [];
let minePositions = [];
let timer;
let seconds = 0;
let remainingMines = mineCount;
let gameStarted = false;

const EMOJI_STATES = {
    NORMAL: '🙂',
    SMILE: '😊',
    CRY: '😢'
};

function initializeGame() {
  // Reset game state
  clearInterval(timer);
  seconds = 0;
  remainingMines = mineCount;
  gameStarted = false;
  
  // Reset emoji to normal state
  document.querySelector('.reset-button').textContent = EMOJI_STATES.NORMAL;
  
  // Update displays
  document.querySelector('.mine-counter').textContent = String(remainingMines).padStart(3, '0');
  document.querySelector('.timer').textContent = '00:00';
  
  // Hide messages
  document.getElementById('winMessage').style.display = 'none';
  document.getElementById('loseMessage').style.display = 'none';
  
  // Reset board
  board = Array.from({ length: gridSize }, () => 
    Array(gridSize).fill().map(() => ({
      mine: false,
      revealed: false,
      flagged: false,
      adjacentMines: 0
    }))
  );
  
  minePositions = [];
  
  // Get game board reference once
  const gameBoard = document.getElementById("gameBoard");
  // Remove burning effect if it exists
  gameBoard.classList.remove('burning');
  // Clear board
  gameBoard.innerHTML = '';
  
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const cell = document.createElement("div");
      cell.className = 'cell';
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.addEventListener("click", () => revealCell(row, col));
      cell.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        toggleFlag(row, col);
      });
      gameBoard.appendChild(cell);
    }
  }
  
  placeMines();
  calculateAdjacentMines();
}

function placeMines() {
  while (minePositions.length < mineCount) {
    const row = Math.floor(Math.random() * gridSize);
    const col = Math.floor(Math.random() * gridSize);
    if (!board[row][col].mine) {
      board[row][col].mine = true;
      minePositions.push({ row, col });
    }
  }
}

function calculateAdjacentMines() {
  minePositions.forEach(({ row, col }) => {
    getNeighbors(row, col).forEach(([nRow, nCol]) => {
      board[nRow][nCol].adjacentMines++;
    });
  });
}

function getNeighbors(row, col) {
  const neighbors = [];
  for (let r = row - 1; r <= row + 1; r++) {
    for (let c = col - 1; c <= col + 1; c++) {
      if (r >= 0 && r < gridSize && c >= 0 && c < gridSize && !(r === row && c === col)) {
        neighbors.push([r, c]);
      }
    }
  }
  return neighbors;
}

function startTimer() {
  timer = setInterval(() => {
    seconds++;
    updateTimerDisplay();
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeDisplay = document.querySelector('.timer');
  timeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function revealCell(row, col) {
  if (board[row][col].revealed || board[row][col].flagged) return;
  
  if (!gameStarted) {
    gameStarted = true;
    startTimer();
  }
  
  if (board[row][col].mine) {
    clearInterval(timer);
    // Change to cry emoji when losing
    document.querySelector('.reset-button').textContent = EMOJI_STATES.CRY;
    
    // Get game board reference
    const gameBoard = document.getElementById('gameBoard');
    gameBoard.classList.add('burning');
    
    setTimeout(() => {
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          if (board[r][c].mine) {
            const mineCell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
            mineCell.classList.add('revealed');
            mineCell.innerHTML = '💣';
          }
        }
      }
      
      const loseMessage = document.getElementById('loseMessage');
      loseMessage.style.display = 'flex';
      loseMessage.style.flexDirection = 'column';
    }, 1000);
    
    return;
  }
  
  board[row][col].revealed = true;
  const cellDiv = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
  cellDiv.classList.add('revealed');

  if (board[row][col].adjacentMines > 0) {
    cellDiv.setAttribute('data-mines', board[row][col].adjacentMines);
  } else {
    // Reveal neighboring cells only if current cell is empty
    getNeighbors(row, col).forEach(([nRow, nCol]) => {
      if (!board[nRow][nCol].revealed && !board[nRow][nCol].flagged) {
        revealCell(nRow, nCol);
      }
    });
  }

  checkWin();
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
    // Change to smile emoji when winning
    document.querySelector('.reset-button').textContent = EMOJI_STATES.SMILE;
    
    // Reveal all mines
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (board[r][c].mine) {
          const mineCell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
          mineCell.classList.add('revealed');
          mineCell.innerHTML = '💣';
        }
      }
    }
    
    // Show win message
    const winMessage = document.getElementById('winMessage');
    winMessage.style.display = 'flex';
    winMessage.style.flexDirection = 'column';
  }
}

function toggleFlag(row, col) {
  if (board[row][col].revealed) return;
  
  const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
  if (!board[row][col].flagged && remainingMines > 0) {
    board[row][col].flagged = true;
    cell.classList.add('flagged');
    remainingMines--;
  } else if (board[row][col].flagged) {
    board[row][col].flagged = false;
    cell.classList.remove('flagged');
    remainingMines++;
  }
  
  document.querySelector('.mine-counter').textContent = 
    String(remainingMines).padStart(3, '0');
}

// Initialize the game on page load
window.onload = initializeGame;
