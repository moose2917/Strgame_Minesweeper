const gridSize = 15;
const mineCount = 20;
let board = [];
let minePositions = [];

function initializeGame() {
  // Reset game state
  board = Array.from({ length: gridSize }, () => Array(gridSize).fill({}));
  minePositions = [];
  
  // Clear and generate new board
  const gameBoard = document.getElementById("gameBoard");
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
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        toggleFlag(row, col);
      });
      gameBoard.appendChild(cell);
      board[row][col] = { revealed: false, mine: false, adjacentMines: 0 };
    }
  }
  
  placeMines();
  calculateAdjacentMines();

  const winMessage = document.getElementById('winMessage');
  const loseMessage = document.getElementById('loseMessage');
  winMessage.style.display = 'none';
  loseMessage.style.display = 'none';
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

function revealCell(row, col) {
  if (board[row][col].revealed || board[row][col].flagged) return;
  
  // Check if it's a mine
  if (board[row][col].mine) {
    const loseMessage = document.getElementById('loseMessage');
    loseMessage.style.display = 'flex';
    
    loseMessage.onclick = () => {
      loseMessage.style.display = 'none';
      initializeGame();
    };
    return;
  }
  
  // Continue with regular cell reveal logic
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
    const winMessage = document.getElementById('winMessage');
    winMessage.style.display = 'flex';
    
    // 可選：點擊獲勝畫面後重新開始遊戲
    winMessage.onclick = () => {
      winMessage.style.display = 'none';
      initializeGame();
    };
  }
}

function toggleFlag(row, col) {
  if (board[row][col].revealed) return;
  
  const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
  board[row][col].flagged = !board[row][col].flagged;
  cell.classList.toggle('flagged');
}

// Initialize the game on page load
window.onload = initializeGame;
