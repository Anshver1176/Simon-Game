const authContainer = document.getElementById("auth-container");
const gameContainer = document.getElementById("game-container");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");
const authMessage = document.getElementById("auth-message");

const pads = Array.from(document.querySelectorAll(".pad"));
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const levelDisplay = document.getElementById("level-display");
const highScoreDisplay = document.getElementById("high-score-display");
const statusText = document.getElementById("status-text");
const timerFill = document.getElementById("timer-fill");

const difficultyButtons = Array.from(
    document.querySelectorAll("[data-difficulty]")
);

const gameOverOverlay = document.getElementById("game-over-overlay");
const finalLevel = document.getElementById("final-level");
const finalHigh = document.getElementById("final-high");
const restartBtn = document.getElementById("restart-btn");

const pauseOverlay = document.getElementById("pause-overlay");
const resumeBtn = document.getElementById("resume-btn");

const DIFFICULTY_SETTINGS = {
    easy: {
        flashDuration: 600,
        gapDuration: 250,
        responseTime: 8000
    },
    medium: {
        flashDuration: 400,
        gapDuration: 150,
        responseTime: 5000
    },
    hard: {
        flashDuration: 250,
        gapDuration: 100,
        responseTime: 3000
    }
};

let sequence = [];
let playerStep = 0;
let level = 0;
let difficulty = "easy";
let highScore = Number(localStorage.getItem("simonHighScore")) || 0;

let gameRunning = false;
let acceptingInput = false;
let paused = false;

let responseTimer = null;
let timerInterval = null;

authContainer.style.display = "block";
gameContainer.style.display = "none";

highScoreDisplay.textContent = String(highScore).padStart(2, "0");

async function authenticate(url) {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        authMessage.textContent = "Enter email and password";
        return;
    }

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            authMessage.textContent = data.message || "Authentication failed";
            return;
        }

        localStorage.setItem("token", data.token);

        authMessage.textContent = data.message || "Success";

        authContainer.style.display = "none";
        gameContainer.style.display = "block";
    } catch (error) {
        console.error(error);
        authMessage.textContent = "Unable to connect to server";
    }
}

signupBtn.addEventListener("click", () => {
    authenticate("http://localhost:3000/auth/signup");
});

loginBtn.addEventListener("click", () => {
    authenticate("http://localhost:3000/auth/login");
});

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function flashPad(pad) {
    pad.classList.add("lit");

    setTimeout(() => {
        pad.classList.remove("lit");
    }, DIFFICULTY_SETTINGS[difficulty].flashDuration);
}

async function playSequence() {
    acceptingInput = false;

    statusText.textContent = "Watch carefully...";

    const settings = DIFFICULTY_SETTINGS[difficulty];

    for (const color of sequence) {
        if (paused) {
            await wait(100);
            continue;
        }

        const pad = pads.find(
            currentPad => currentPad.dataset.color === color
        );

        if (pad) {
            flashPad(pad);
            await wait(settings.flashDuration);
            await wait(settings.gapDuration);
        }
    }

    if (!gameRunning || paused) {
        return;
    }

    acceptingInput = true;
    playerStep = 0;

    statusText.textContent = "Your turn!";

    startResponseTimer();
}

function startResponseTimer() {
    clearTimeout(responseTimer);
    clearInterval(timerInterval);

    const totalTime = DIFFICULTY_SETTINGS[difficulty].responseTime;
    const startTime = Date.now();

    timerFill.style.width = "100%";

    timerInterval = setInterval(() => {
        if (paused || !acceptingInput) {
            return;
        }

        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, totalTime - elapsed);
        const percentage = (remaining / totalTime) * 100;

        timerFill.style.width = `${percentage}%`;

        if (remaining <= 0) {
            clearInterval(timerInterval);
        }
    }, 50);

    responseTimer = setTimeout(() => {
        if (acceptingInput && gameRunning && !paused) {
            gameOver();
        }
    }, totalTime);
}

function startGame() {
    clearTimeout(responseTimer);
    clearInterval(timerInterval);

    sequence = [];
    playerStep = 0;
    level = 0;

    gameRunning = true;
    acceptingInput = false;
    paused = false;

    gameOverOverlay.classList.add("hidden");
    pauseOverlay.classList.add("hidden");

    startBtn.disabled = true;
    pauseBtn.disabled = false;

    levelDisplay.textContent = "00";
    statusText.textContent = "Get ready...";

    nextRound();
}

async function nextRound() {
    if (!gameRunning || paused) {
        return;
    }

    level++;

    levelDisplay.textContent = String(level).padStart(2, "0");

    const randomPad = pads[Math.floor(Math.random() * pads.length)];
    sequence.push(randomPad.dataset.color);

    await wait(500);

    if (gameRunning && !paused) {
        playSequence();
    }
}

function handlePadClick(pad) {
    if (!gameRunning || !acceptingInput || paused) {
        return;
    }

    flashPad(pad);

    const selectedColor = pad.dataset.color;
    const correctColor = sequence[playerStep];

    if (selectedColor !== correctColor) {
        gameOver();
        return;
    }

    playerStep++;

    if (playerStep === sequence.length) {
        acceptingInput = false;

        clearTimeout(responseTimer);
        clearInterval(timerInterval);

        timerFill.style.width = "100%";

        if (level > highScore) {
            highScore = level;
            localStorage.setItem("simonHighScore", highScore);
            highScoreDisplay.textContent = String(highScore).padStart(2, "0");
        }

        statusText.textContent = "Correct!";

        setTimeout(() => {
            if (gameRunning && !paused) {
                nextRound();
            }
        }, 700);
    }
}

function gameOver() {
    clearTimeout(responseTimer);
    clearInterval(timerInterval);

    gameRunning = false;
    acceptingInput = false;
    paused = false;

    startBtn.disabled = false;
    pauseBtn.disabled = true;

    timerFill.style.width = "0%";

    if (level > highScore) {
        highScore = level;
        localStorage.setItem("simonHighScore", highScore);
    }

    highScoreDisplay.textContent = String(highScore).padStart(2, "0");

    finalLevel.textContent = level;
    finalHigh.textContent = highScore;

    statusText.textContent = "Game Over";

    gameOverOverlay.classList.remove("hidden");
}

function pauseGame() {
    if (!gameRunning || !acceptingInput) {
        return;
    }

    paused = true;

    pauseOverlay.classList.remove("hidden");

    statusText.textContent = "Game paused";
}

function resumeGame() {
    if (!gameRunning) {
        return;
    }

    paused = false;

    pauseOverlay.classList.add("hidden");

    statusText.textContent = "Your turn!";

    startResponseTimer();
}

startBtn.addEventListener("click", startGame);

restartBtn.addEventListener("click", startGame);

pauseBtn.addEventListener("click", pauseGame);

resumeBtn.addEventListener("click", resumeGame);

pads.forEach(pad => {
    pad.addEventListener("click", () => {
        handlePadClick(pad);
    });
});

difficultyButtons.forEach(button => {
    button.addEventListener("click", () => {
        if (gameRunning) {
            return;
        }

        difficulty = button.dataset.difficulty;

        difficultyButtons.forEach(currentButton => {
            currentButton.classList.remove("active");
        });

        button.classList.add("active");

        statusText.textContent = `Difficulty: ${difficulty}`;
    });
});