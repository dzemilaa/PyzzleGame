const gridSize = 3;
const imageSrc = "images/puzzle.png";
let board = [];
let solving = false;
let paused = false;
let movesLeft = 0; 
let currentSolution = []; 
let currentMoveIndex = 0;

const gameBoard = document.getElementById("game-board");
const message = document.getElementById("message");
const movesLeftElement = document.getElementById("moves-left");

function initializeGame() {
    board = [...Array(gridSize * gridSize - 1).keys()].map(n => n + 1);
    board.push(0);
    shuffleBoard();
    renderBoard();
    movesLeft = 0; 
    updateMovesLeft();
}

function shuffleBoard() {
    do {
        board.sort(() => Math.random() - 0.5);
    } while (!isSolvable(board) || board[board.length - 1] !== 0);
}

function renderBoard() {
    gameBoard.innerHTML = "";
    board.forEach((num, index) => {
        const tile = document.createElement("div");
        tile.className = "tile";
        if (num === 0) {
            tile.classList.add("empty");
        } else {
            tile.style.backgroundImage = `url(${imageSrc})`;
            tile.style.backgroundPosition = `${-((num - 1) % gridSize) * 150}px ${-Math.floor((num - 1) / gridSize) * 150}px`;
            tile.textContent = num;
        }
        tile.dataset.index = index;
        tile.addEventListener("click", () => moveTile(index));
        gameBoard.appendChild(tile);
    });
}

function moveTile(index) {
    if (solving) return;  

    const emptyIndex = board.indexOf(0);
    const validMoves = [emptyIndex - 1, emptyIndex + 1, emptyIndex - gridSize, emptyIndex + gridSize];

    if (validMoves.includes(index)) {
        [board[emptyIndex], board[index]] = [board[index], board[emptyIndex]];
        renderBoard();
        checkWin();
        if (movesLeft > 0) {
            movesLeft--; 
            updateMovesLeft();
        }
    }
}

function checkWin() {
    const correctOrder = [...Array(gridSize * gridSize - 1).keys()].map(n => n + 1);
    correctOrder.push(0);
    if (board.every((val, i) => val === correctOrder[i])) {
        showWinModal(); 
        movesLeft = 0;
        updateMovesLeft();
    }
}
function showWinModal() {
    const modal = document.getElementById("winModal");
    modal.style.display = "block";

    document.getElementById("closeModal").addEventListener("click", () => {
        modal.style.display = "none";
    });
}

function updateMovesLeft() {
    movesLeftElement.textContent = `Moves left: ${movesLeft}`;
}

function isSolvable(arr) {
    let inversions = 0;
    for (let i = 0; i < arr.length - 1; i++) {
        for (let j = i + 1; j < arr.length; j++) {
            if (arr[i] && arr[j] && arr[i] > arr[j]) inversions++;
        }
    }
    return inversions % 2 === 0;
}

// Rešavanje igre
function solvePuzzle(algorithm, heuristic = "") {
    if (solving) return;

    solving = true;
    paused = false;
    currentMoveIndex = 0; 

    const stateStr = board.map(x => (x === 0 ? "0" : x)).join(",");

    fetch(`https://puzzlebackend-on82.onrender.com/puzzle/solve/?state=${stateStr}&algorithm=${algorithm}&heuristic=${heuristic}`)
        .then(response => response.json())
        .then(data => {
            if (data.solution) {
                movesLeft = data.solution.length;
                updateMovesLeft();
                currentSolution = data.solution;
                playSolution();
            } else {
                message.textContent = "Nema rešenja!";
                solving = false;
            }
        })
        .catch(error => {
            console.error("Greška pri povezivanju sa serverom:", error);
            message.textContent = "Došlo je do greške.";
            solving = false;
        });
}

// Animacija rešenja
function playSolution() {
    if (paused || !solving || currentMoveIndex >= currentSolution.length) return;

    let newState = [...board];
    let emptyIndex = newState.indexOf(0);
    let moveIndex = currentSolution[currentMoveIndex];

    if (typeof moveIndex === "number") {
        [newState[emptyIndex], newState[moveIndex]] = [newState[moveIndex], newState[emptyIndex]];
        board = newState;
    } else {
        console.error("Greška: loš podatak u rešenju:", moveIndex);
        solving = false;
        return;
    }

    renderBoard();
    movesLeft--; 
    updateMovesLeft();
    currentMoveIndex++;

    if (currentMoveIndex < currentSolution.length) {
        setTimeout(playSolution, 500);
    } else {
        showWinModal(); 
        solving = false;
        movesLeft = 0;
        updateMovesLeft();
    }
}

// ENTER: Prikazuje rešenu slagalicu BEZ pokretanja algoritma
function showSolvedPuzzle() {
    solving = false;  
    paused = false;
    board = [...Array(gridSize * gridSize - 1).keys()].map(n => n + 1);
    board.push(0);
    renderBoard();
    showWinModal(); 
    movesLeft = 0;
    updateMovesLeft();
}

// Dugmad
document.getElementById("start-game").addEventListener("click", () => {
    if (solving) return;

    const selectedAlgorithm = document.querySelector("input[name='algorithm']:checked").value;
    let heuristic = "";

    if (selectedAlgorithm.includes("bestfs")) {
        heuristic = selectedAlgorithm.includes("hamming") ? "hamming" : "manhattan";
        solvePuzzle("bestfs", heuristic);
    } else if (selectedAlgorithm.includes("astar")) {
        heuristic = selectedAlgorithm.includes("hamming") ? "hamming" : "manhattan";
        solvePuzzle("astar", heuristic);
    } else {
        solvePuzzle(selectedAlgorithm);
    }
});

document.getElementById("stop").addEventListener("click", () => {
    solving = false;
    paused = false;
});

document.getElementById("shuffle-btn").addEventListener("click", () => {
    solving = false;
    paused = false;
    shuffleBoard();
    renderBoard();
    movesLeft = 0;
    updateMovesLeft();
});

// Kontrole tastature
document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
        event.preventDefault();
        if (solving) {
            paused = !paused;
            if (!paused) {
                playSolution();
            }
        }
    }
    if (event.code === "Escape") {
        solving = false;
        paused = false;
        initializeGame();
    }
    if (event.code === "Enter") {
        showSolvedPuzzle();
    }
});

// Inicijalizacija igre
initializeGame();
