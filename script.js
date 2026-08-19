const padButtons = Array.from(document.querySelectorAll('.pad'));
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const levelDisplay = document.getElementById('level-display');
const highScoreDisplay = document.getElementById('high-score-display');
const statusText = document.getElementById('status-text');
const timerFill = document.getElementById('timer-fill');

const difficultyControl = document.getElementById('difficulty-control');
const difficultyButtons = Array.from(difficultyControl.querySelectorAll('.seg'));

const gameOverOverlay = document.getElementById('game-over-overlay');
const finalLevelEl = document.getElementById('final-level');
const finalHighEl = document.getElementById('final-high');
const restartBtn = document.getElementById('restart-btn');

const pauseOverlay = document.getElementById('pause-overlay');
const resumeBtn = document.getElementById('resume-btn');

const DIFFICULTY_SETTINGS = {
  easy: { flashDuration: 600, gapDuration: 250, responseTime: 8000 },
  medium: { flashDuration: 400, gapDuration: 150, responseTime: 5000 },
  hard: { flashDuration: 250, gapDuration: 100, responseTime: 3000 },
};

const COLORS = ['green', 'red', 'blue', 'yellow'];

const TONES = {
  green: 329.63,
  red: 277.18,
  blue: 164.81,
  yellow: 220.00,
};

let sequence = [];
let playerStep = 0;
let level = 0;
let difficulty = 'easy';
let highScore = Number(localStorage.getItem('simonHighScore')) || 0;

let isSequencePlaying = false;
let isPaused = false;
let isGameActive = false;
let acceptingInput = false;

let sequenceTimeouts = [];

let responseTimer = {
  startTime: 0,
  duration: 0,
  timeoutId: null,
  intervalId: null,
  remaining: 0,
};

let audioCtx = null;

highScoreDisplay.textContent = padScore(highScore);
levelDisplay.textContent = padScore(0);

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(color, duration = 300) {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = TONES[color] || 220;

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    gainNode.gain.linearRampToValueAtTime(
      0,
      ctx.currentTime + duration / 1000
    );

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration / 1000);
  } catch (err) {
    console.warn('Audio unavailable:', err);
  }
}

function playErrorTone() {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.value = 110;

    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.5);
  } catch (err) {
    console.warn('Audio unavailable:', err);
  }
}

function padScore(n) {
  return String(n).padStart(2, '0');
}

function getPad(color) {
  return padButtons.find((btn) => btn.dataset.color === color);
}

function setStatus(text) {
  statusText.textContent = text;
}

function startGame() {
  getAudioContext();

  sequence = [];
  playerStep = 0;
  level = 0;
  isGameActive = true;
  isPaused = false;

  levelDisplay.textContent = padScore(level);
  gameOverOverlay.classList.add('hidden');
  pauseOverlay.classList.add('hidden');

  startBtn.disabled = true;
  setDifficultyLocked(true);

  nextRound();
}

function nextRound() {
  level += 1;
  levelDisplay.textContent = padScore(level);
  playerStep = 0;
  acceptingInput = false;

  const nextColor = COLORS[Math.floor(Math.random() * COLORS.length)];
  sequence.push(nextColor);

  setStatus(`Level ${level} — watch closely...`);
  pauseBtn.disabled = true;

  playSequence();
}

function playSequence() {
  isSequencePlaying = true;
  clearResponseTimer();

  sequenceTimeouts.forEach(clearTimeout);
  sequenceTimeouts = [];

  timerFill.style.transition = 'none';
  timerFill.style.width = '100%';

  const { flashDuration, gapDuration } = DIFFICULTY_SETTINGS[difficulty];
  let delay = 300;

  sequence.forEach((color) => {
    sequenceTimeouts.push(
      setTimeout(() => flashPad(color, flashDuration), delay)
    );

    delay += flashDuration + gapDuration;
  });

  sequenceTimeouts.push(
    setTimeout(() => {
      isSequencePlaying = false;
      acceptingInput = true;
      pauseBtn.disabled = false;
      setStatus('Your turn — repeat the sequence');
      startResponseTimer(DIFFICULTY_SETTINGS[difficulty].responseTime);
    }, delay)
  );
}

function flashPad(color, duration) {
  const pad = getPad(color);

  pad.classList.add('lit');
  playTone(color, duration);

  setTimeout(() => {
    pad.classList.remove('lit');
  }, duration);
}

function handlePadClick(color) {
  if (!acceptingInput || isPaused) return;

  const pad = getPad(color);

  pad.classList.add('pressed');

  setTimeout(() => {
    pad.classList.remove('pressed');
  }, 150);

  flashPad(color, 200);

  const expectedColor = sequence[playerStep];

  if (color !== expectedColor) {
    acceptingInput = false;
    clearResponseTimer();
    gameOver();
    return;
  }

  playerStep += 1;

  startResponseTimer(
    DIFFICULTY_SETTINGS[difficulty].responseTime
  );

  if (playerStep === sequence.length) {
    acceptingInput = false;
    clearResponseTimer();

    setStatus('Nice! Get ready for the next level...');

    setTimeout(() => {
      if (isGameActive) nextRound();
    }, 800);
  }
}

function gameOver() {
  isGameActive = false;
  acceptingInput = false;
  isSequencePlaying = false;

  clearResponseTimer();
  sequenceTimeouts.forEach(clearTimeout);
  sequenceTimeouts = [];

  playErrorTone();

  padButtons.forEach((pad) => {
    pad.classList.add('pressed');
  });

  setTimeout(() => {
    padButtons.forEach((pad) => {
      pad.classList.remove('pressed');
    });
  }, 300);

  const finalScore = level - 1 >= 0 ? level - 1 : 0;

  if (finalScore > highScore) {
    highScore = finalScore;
    localStorage.setItem('simonHighScore', String(highScore));
  }

  highScoreDisplay.textContent = padScore(highScore);

  finalLevelEl.textContent = String(finalScore);
  finalHighEl.textContent = String(highScore);

  setStatus('Game Over');

  startBtn.disabled = false;
  pauseBtn.disabled = true;

  setDifficultyLocked(false);

  gameOverOverlay.classList.remove('hidden');
}

function restartGame() {
  gameOverOverlay.classList.add('hidden');
  startGame();
}

function pauseGame() {
  if (!isGameActive || !acceptingInput || isPaused) return;

  isPaused = true;
  acceptingInput = false;

  freezeResponseTimer();

  pauseOverlay.classList.remove('hidden');
  setStatus('Paused');
}

function resumeGame() {
  if (!isPaused) return;

  isPaused = false;
  acceptingInput = true;

  pauseOverlay.classList.add('hidden');
  setStatus('Your turn — repeat the sequence');

  resumeResponseTimer();
}

function startResponseTimer(duration) {
  clearResponseTimer();

  responseTimer.startTime = Date.now();
  responseTimer.duration = duration;

  timerFill.classList.remove('warning', 'danger');
  timerFill.style.transition = 'none';
  timerFill.style.width = '100%';

  void timerFill.offsetWidth;

  timerFill.style.transition = `width ${duration}ms linear`;
  timerFill.style.width = '0%';

  responseTimer.timeoutId = setTimeout(
    onResponseTimeout,
    duration
  );

  responseTimer.intervalId = setInterval(() => {
    const elapsed = Date.now() - responseTimer.startTime;
    const fraction = 1 - elapsed / responseTimer.duration;

    if (fraction <= 0.2) {
      timerFill.classList.add('danger');
      timerFill.classList.remove('warning');
    } else if (fraction <= 0.45) {
      timerFill.classList.add('warning');
    }
  }, 150);
}

function clearResponseTimer() {
  if (responseTimer.timeoutId) {
    clearTimeout(responseTimer.timeoutId);
  }

  if (responseTimer.intervalId) {
    clearInterval(responseTimer.intervalId);
  }

  responseTimer.timeoutId = null;
  responseTimer.intervalId = null;
}

function freezeResponseTimer() {
  const computedWidth = getComputedStyle(timerFill).width;

  const elapsed = Date.now() - responseTimer.startTime;

  responseTimer.remaining = Math.max(
    responseTimer.duration - elapsed,
    0
  );

  clearResponseTimer();

  timerFill.style.transition = 'none';
  timerFill.style.width = computedWidth;
}

function resumeResponseTimer() {
  const remaining = responseTimer.remaining || 0;

  if (remaining <= 0) {
    onResponseTimeout();
    return;
  }

  startResponseTimer(remaining);
}

function onResponseTimeout() {
  if (!acceptingInput) return;

  acceptingInput = false;
  gameOver();
}

function setDifficultyLocked(locked) {
  difficultyButtons.forEach((btn) => {
    btn.disabled = locked;
  });
}

function selectDifficulty(newDifficulty) {
  difficulty = newDifficulty;

  difficultyButtons.forEach((btn) => {
    btn.classList.toggle(
      'active',
      btn.dataset.difficulty === newDifficulty
    );
  });
}

padButtons.forEach((pad) => {
  pad.addEventListener('click', () => {
    handlePadClick(pad.dataset.color);
  });
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', restartGame);
pauseBtn.addEventListener('click', pauseGame);
resumeBtn.addEventListener('click', resumeGame);

difficultyButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.disabled) return;

    selectDifficulty(btn.dataset.difficulty);
  });
});

window.addEventListener('keydown', (e) => {
  const map = {
    '1': 'green',
    '2': 'red',
    '3': 'blue',
    '4': 'yellow',
  };

  if (map[e.key]) {
    handlePadClick(map[e.key]);
  }
});