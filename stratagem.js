// ── STRATAGEM MINI-GAME ────────────────────────────────────────
const STRATAGEMS = [
  { name: 'Eagle 500KG Bomb',         keys: ['up','right','down','down','down'],          icon: '💣' },
  { name: 'Eagle Airstrike',           keys: ['up','right','down','right'],                icon: '✈' },
  { name: 'Eagle Cluster Bomb',        keys: ['up','right','down','down','right'],         icon: '💥' },
  { name: 'Eagle Napalm Airstrike',    keys: ['up','right','down','up'],                   icon: '🔥' },
  { name: 'Orbital Laser',             keys: ['right','down','up','right','down'],         icon: '🔴' },
  { name: 'Orbital 380MM Barrage',     keys: ['right','down','up','left','down','down'],   icon: '🌋' },
  { name: 'Orbital Railcannon Strike', keys: ['right','up','down','down','right'],         icon: '⚡' },
  { name: 'Orbital Gatling Barrage',   keys: ['right','down','left','up','up'],            icon: '🔫' },
  { name: 'Reinforce',                 keys: ['up','down','right','left','up'],            icon: '🪂' },
  { name: 'SOS Beacon',                keys: ['up','down','right','up'],                   icon: '🆘' },
  { name: 'Shield Generator Relay',    keys: ['down','left','down','up','right'],          icon: '🛡' },
  { name: 'Autocannon Sentry',         keys: ['right','up','left','up','right','right'],   icon: '🤖' },
  { name: 'Machine Gun Sentry',        keys: ['right','up','down','right'],                icon: '🔩' },
  { name: 'Tesla Tower',               keys: ['right','up','right','down','right'],        icon: '⚡' },
  { name: 'Anti-Tank Mines',           keys: ['down','left','up','up'],                    icon: '💀' },
  { name: 'Mortar Sentry',             keys: ['right','up','right','down','down'],         icon: '🏹' },
];

const KEY_MAP = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right',
  W: 'up', S: 'down', A: 'left', D: 'right',
};

const DIR_ARROW = { up: '↑', down: '↓', left: '←', right: '→' };

let gameActive     = false;
let hardMode       = false;
let currentStrat   = null;
let inputProgress  = [];
let score          = 0;
let timeLeft       = 0;
let timerInterval  = null;
let gameKeyListener = null;

// ── DOM REFS ──────────────────────────────────────────────────
function buildUI() {
  // Floating trigger button
  const btn = document.createElement('div');
  btn.id = 'strat-trigger';
  btn.innerHTML = `<span class="strat-trigger-icon">📡</span><span class="strat-trigger-label">CALL FOR<br>SUPPORT</span>`;
  btn.title = 'Call for Stratagem Support';
  document.body.appendChild(btn);

  // Game panel
  const panel = document.createElement('div');
  panel.id = 'strat-panel';
  panel.classList.add('hidden');
  panel.innerHTML = `
    <div class="strat-panel-inner">
      <div class="strat-header">
        <span id="strat-mode-label">◈ STRATAGEM TERMINAL</span>
        <button id="strat-close">✕</button>
      </div>
      <div id="strat-game-area">
        <div id="strat-score-row">
          <span>SCORE: <strong id="strat-score">0</strong></span>
          <span id="strat-timer-wrap">TIME: <strong id="strat-timer">--</strong>s</span>
        </div>
        <div id="strat-icon">📡</div>
        <div id="strat-name">AWAITING ORDERS</div>
        <div id="strat-sequence"></div>
        <div id="strat-input-row"></div>
        <div id="strat-feedback"></div>
        <button id="strat-start-btn">[ DEPLOY ]</button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  // Wire events
  btn.addEventListener('click', () => togglePanel(false));
  document.getElementById('strat-close').addEventListener('click', closePanel);
  document.getElementById('strat-start-btn').addEventListener('click', startRound);
}

function togglePanel(hard) {
  hardMode = hard;
  const panel = document.getElementById('strat-panel');
  const isHidden = panel.classList.contains('hidden');
  if (isHidden) {
    panel.classList.remove('hidden');
    document.getElementById('strat-mode-label').textContent = hard
      ? '⚠ STRATAGEM TERMINAL — HARD MODE'
      : '◈ STRATAGEM TERMINAL';
    panel.querySelector('.strat-panel-inner').style.borderColor = hard ? 'var(--red2)' : 'var(--yellow2)';
    resetGame();
  } else {
    closePanel();
  }
}

function closePanel() {
  document.getElementById('strat-panel').classList.add('hidden');
  stopGame();
}

function resetGame() {
  score = 0;
  inputProgress = [];
  gameActive = false;
  document.getElementById('strat-score').textContent = '0';
  document.getElementById('strat-timer').textContent = '--';
  document.getElementById('strat-icon').textContent = '📡';
  document.getElementById('strat-name').textContent = 'AWAITING ORDERS';
  document.getElementById('strat-sequence').innerHTML = '';
  document.getElementById('strat-input-row').innerHTML = '';
  document.getElementById('strat-feedback').textContent = '';
  document.getElementById('strat-start-btn').style.display = 'block';
  document.getElementById('strat-timer-wrap').style.display = hardMode ? 'inline' : 'none';
  if (timerInterval) clearInterval(timerInterval);
}

function startRound() {
  document.getElementById('strat-start-btn').style.display = 'none';
  document.getElementById('strat-feedback').textContent = '';
  pickStratagem();
  gameActive = true;

  if (hardMode) {
    timeLeft = Math.max(5, 12 - Math.floor(score / 3));
    document.getElementById('strat-timer').textContent = timeLeft;
    timerInterval = setInterval(() => {
      timeLeft--;
      document.getElementById('strat-timer').textContent = timeLeft;
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        failRound('TIME OUT');
      }
    }, 1000);
  }

  if (!gameKeyListener) {
    gameKeyListener = (e) => handleGameKey(e);
    document.addEventListener('keydown', gameKeyListener);
  }
}

function pickStratagem() {
  const pool = hardMode ? STRATAGEMS : STRATAGEMS.filter(s => s.keys.length <= 5);
  currentStrat = pool[Math.floor(Math.random() * pool.length)];
  inputProgress = [];

  document.getElementById('strat-icon').textContent = currentStrat.icon;
  document.getElementById('strat-name').textContent = currentStrat.name;
  renderSequence();
  renderInput();
}

function renderSequence() {
  const el = document.getElementById('strat-sequence');
  el.innerHTML = currentStrat.keys.map((k, i) =>
    `<span class="strat-key" id="sk-${i}">${DIR_ARROW[k]}</span>`
  ).join('');
}

function renderInput() {
  const el = document.getElementById('strat-input-row');
  el.innerHTML = currentStrat.keys.map((_, i) =>
    `<span class="strat-slot ${i < inputProgress.length ? 'filled' : ''}" id="si-${i}">
      ${i < inputProgress.length ? DIR_ARROW[inputProgress[i]] : '·'}
    </span>`
  ).join('');
}

function handleGameKey(e) {
  if (!gameActive) return;
  const dir = KEY_MAP[e.key];
  if (!dir) return;
  e.preventDefault();

  inputProgress.push(dir);
  const idx = inputProgress.length - 1;

  // Highlight sequence key
  const skEl = document.getElementById(`sk-${idx}`);
  if (skEl) skEl.classList.add('active');

  renderInput();

  if (dir !== currentStrat.keys[idx]) {
    failRound('WRONG INPUT');
    return;
  }

  if (inputProgress.length === currentStrat.keys.length) {
    successRound();
  }
}

function successRound() {
  if (timerInterval) clearInterval(timerInterval);
  gameActive = false;
  score++;
  document.getElementById('strat-score').textContent = score;
  setFeedback('✔ STRATAGEM CONFIRMED', 'success');

  // Flash all keys green
  currentStrat.keys.forEach((_, i) => {
    const el = document.getElementById(`sk-${i}`);
    if (el) el.classList.add('correct');
  });

  setTimeout(() => {
    setFeedback('', '');
    document.querySelectorAll('.strat-key').forEach(el => el.classList.remove('correct', 'active'));
    startRound();
  }, 900);
}

function failRound(reason) {
  if (timerInterval) clearInterval(timerInterval);
  gameActive = false;

  // Flash wrong
  currentStrat.keys.forEach((_, i) => {
    const el = document.getElementById(`sk-${i}`);
    if (el) el.classList.add('wrong');
  });

  const finalScore = score;
  setFeedback(`✕ ${reason} — SCORE: ${finalScore}`, 'fail');
  score = 0;
  document.getElementById('strat-score').textContent = '0';

  setTimeout(() => {
    document.querySelectorAll('.strat-key').forEach(el => el.classList.remove('wrong', 'active'));
    setFeedback('', '');
    pickStratagem();
    gameActive = true;

    if (hardMode) {
      timeLeft = 12;
      document.getElementById('strat-timer').textContent = timeLeft;
      timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('strat-timer').textContent = timeLeft;
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          failRound('TIME OUT');
        }
      }, 1000);
    }
  }, 1200);
}

function setFeedback(msg, type) {
  const el = document.getElementById('strat-feedback');
  el.textContent = msg;
  el.className = type ? `strat-fb-${type}` : '';
}

function stopGame() {
  gameActive = false;
  if (timerInterval) clearInterval(timerInterval);
  if (gameKeyListener) {
    document.removeEventListener('keydown', gameKeyListener);
    gameKeyListener = null;
  }
}

// ── INIT & EASTER EGG HOOK ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildUI();

  // Replace old easter egg close with new stratagem trigger for hard mode
  const oldEaster = document.getElementById('easter-egg');
  if (oldEaster) {
    // Override close button to launch hard mode
    document.getElementById('close-easter').addEventListener('click', () => {
      oldEaster.classList.add('hidden');
      setTimeout(() => togglePanel(true), 300);
    });
  }
});
