// ── STRATAGEM TERMINAL ─────────────────────────────────────────
// Assets from CombustibleToast/StratagemHeroOnline (fan site, not affiliated with Arrowhead)
const SND = 'assets/sounds/';
const IMG = 'assets/images/stratagems/';

const KEY_MAP   = { ArrowUp:'U', ArrowDown:'D', ArrowLeft:'L', ArrowRight:'R', w:'U', s:'D', a:'L', d:'R', W:'U', S:'D', A:'L', D:'R' };
const DIR_ARROW = { U:'↑', D:'↓', L:'←', R:'→' };
const SND_MAP   = { U:'4_U.mp3', D:'1_D.mp3', L:'2_L.mp3', R:'3_R.mp3' };

// Timer constants (matching the original game)
const TOTAL_TIME     = 10000;  // 10s start
const BONUS_NORMAL   = 500;    // +0.5s per key in normal
const BONUS_HARD     = 200;    // +0.2s per key in hard
const TICK           = 16;     // ~60fps

let stratagems    = [];
let current       = null;
let inputProgress = [];
let score         = parseInt(sessionStorage.getItem('stratScore') || '0');
let highScore     = parseInt(sessionStorage.getItem('stratHigh')  || '0');
let timeLeft      = TOTAL_TIME;
let timerRaf      = null;
let lastTick      = null;
let gameActive    = false;
let hardMode      = false;
let panelOpen     = false;
let gameKeyFn     = null;
let audioCtx      = null;

// ── AUDIO ─────────────────────────────────────────────────────
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

const audioCache = {};
async function loadSound(file) {
  if (audioCache[file]) return audioCache[file];
  try {
    const res  = await fetch(SND + file);
    const buf  = await res.arrayBuffer();
    const decoded = await getAudioCtx().decodeAudioData(buf);
    audioCache[file] = decoded;
    return decoded;
  } catch { return null; }
}

function playSound(file, volume = 1) {
  const ctx = getAudioCtx();
  const buf = audioCache[file];
  if (!buf) { loadSound(file); return; }
  const src  = ctx.createBufferSource();
  const gain = ctx.createGain();
  gain.gain.value = volume;
  src.buffer = buf;
  src.connect(gain);
  gain.connect(ctx.destination);
  src.start();
}

function playTone(freq, duration, type = 'square', vol = 0.15) {
  try {
    const ctx  = getAudioCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

function sfxKey()     { playTone(880, 0.08, 'square', 0.12); }
function sfxSuccess() { [523,659,784].forEach((f,i) => setTimeout(() => playTone(f, 0.15, 'sine', 0.18), i * 100)); }
function sfxFail()    { [200,150].forEach((f,i)    => setTimeout(() => playTone(f, 0.25, 'sawtooth', 0.2), i * 120)); }
function sfxHard()    { [300,400,600,800,1000].forEach((f,i) => setTimeout(() => playTone(f, 0.12, 'square', 0.2), i * 60)); }

// Preload all direction sounds
function preloadSounds() {
  Object.values(SND_MAP).forEach(f => loadSound(f));
  loadSound('GameOver1.mp3');
  loadSound('GameOver2.mp3');
}

// ── DATA ──────────────────────────────────────────────────────
async function loadStratagems() {
  try {
    const res  = await fetch('assets/HD2-Sequences.json');
    const data = await res.json();
    const parsed = data.map(s => ({
      name: s.name || '???',
      keys: normaliseKeys(s.sequence || []),
      img:  s.image || null,
    })).filter(s => s.keys.length >= 2);
    if (parsed.length > 0) stratagems = parsed;
  } catch {
    // keep FALLBACK
  }
}

function normaliseKeys(raw) {
  if (Array.isArray(raw)) {
    return raw.map(k => {
      if (['U','D','L','R'].includes(k)) return k;
      const map = { up:'U', down:'D', left:'L', right:'R' };
      return map[String(k).toLowerCase()] || null;
    }).filter(Boolean);
  }
  if (typeof raw === 'string') {
    return raw.toUpperCase().split('').filter(c => 'UDLR'.includes(c));
  }
  return [];
}

// Fallback stratagem list (from gist.github.com/nvigneux)
const FALLBACK = [
  { name:'Reinforce',                keys:['U','D','R','L','U'],              img:null },
  { name:'Resupply',                  keys:['D','D','U','R'],                  img:null },
  { name:'SOS Beacon',                keys:['U','D','R','U'],                  img:null },
  { name:'Eagle Airstrike',           keys:['U','R','D','R'],                  img:null },
  { name:'Eagle Cluster Bomb',        keys:['U','R','D','D','R'],              img:null },
  { name:'Eagle Napalm Airstrike',    keys:['U','R','D','U'],                  img:null },
  { name:'Eagle 500KG Bomb',          keys:['U','R','D','D','D'],              img:null },
  { name:'Eagle Strafing Run',        keys:['U','R','R'],                      img:null },
  { name:'Eagle 110MM Rocket Pods',   keys:['U','R','U','L'],                  img:null },
  { name:'Eagle Smoke Strike',        keys:['U','R','U','D'],                  img:null },
  { name:'Orbital Precision Strike',  keys:['R','R','U'],                      img:null },
  { name:'Orbital Airburst Strike',   keys:['R','R','R'],                      img:null },
  { name:'Orbital Gatling Barrage',   keys:['R','D','L','U','U'],              img:null },
  { name:'Orbital Laser',             keys:['R','D','U','R','D'],              img:null },
  { name:'Orbital Railcannon Strike', keys:['R','U','D','D','R'],              img:null },
  { name:'Orbital Gas Strike',        keys:['R','R','D','R'],                  img:null },
  { name:'Orbital EMS Strike',        keys:['R','R','L','D'],                  img:null },
  { name:'Orbital 120MM HE Barrage',  keys:['R','R','D','L','R','D'],          img:null },
  { name:'Orbital 380MM HE Barrage',  keys:['R','D','U','U','L','D','D'],      img:null },
  { name:'Machine Gun',               keys:['D','L','D','U','R'],              img:null },
  { name:'Autocannon',                keys:['D','L','D','U','U','R'],          img:null },
  { name:'Railgun',                   keys:['D','R','D','U','L','R'],          img:null },
  { name:'Flamethrower',              keys:['D','L','U','D','U'],              img:null },
  { name:'Machine Gun Sentry',        keys:['D','U','R','R','U'],              img:null },
  { name:'Mortar Sentry',             keys:['D','U','R','R','D'],              img:null },
  { name:'Autocannon Sentry',         keys:['D','U','R','U','L','U'],          img:null },
  { name:'Tesla Tower',               keys:['D','U','R','U','L','R'],          img:null },
  { name:'Shield Generator Relay',    keys:['D','D','L','R','L','R'],          img:null },
  { name:'Shield Generator Pack',     keys:['D','U','L','R','L','R'],          img:null },
  { name:'Anti-Personnel Minefield',  keys:['D','L','U','R'],                  img:null },
  { name:'Guard Dog Rover',           keys:['D','U','L','U','R','R'],          img:null },
  { name:'Arc Thrower',               keys:['D','R','D','U','L','L'],          img:null },
  { name:'Hellbomb',                  keys:['D','U','L','D','U','R','D','U'],  img:null },
];

const EAGLE_500 = 'Eagle 500KG Bomb';

// ── DOM BUILD ─────────────────────────────────────────────────
function buildUI() {
  const btn = document.createElement('div');
  btn.id = 'strat-trigger';
  btn.innerHTML = `<span class="strat-trigger-icon">📡</span><span class="strat-trigger-label">CALL FOR<br>SUPPORT</span>`;
  document.body.appendChild(btn);

  const panel = document.createElement('div');
  panel.id = 'strat-panel';
  panel.classList.add('hidden');
  panel.innerHTML = `
    <div class="strat-panel-inner" id="strat-inner">
      <div class="strat-header">
        <span id="strat-mode-label">◈ STRATAGEM TERMINAL</span>
        <button id="strat-close" aria-label="Close">✕</button>
      </div>
      <div id="strat-game-area">
        <div id="strat-score-row">
          <span>SCORE: <strong id="strat-score">0</strong></span>
          <span>BEST: <strong id="strat-high">0</strong></span>
        </div>
        <div id="strat-timer-bar-wrap">
          <div id="strat-timer-bar"></div>
        </div>
        <div id="strat-img-wrap">
          <img id="strat-img" src="" alt="" style="display:none" />
          <span id="strat-emoji" class="strat-emoji">📡</span>
        </div>
        <div id="strat-name">AWAITING ORDERS</div>
        <div id="strat-sequence"></div>
        <div id="strat-input-row"></div>
        <div id="strat-feedback"></div>
        <button id="strat-start-btn">[ DEPLOY ]</button>
        <p class="strat-hint">WASD or ARROW KEYS · Eagle 500KG unlocks HARD MODE</p>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  btn.addEventListener('click', () => { getAudioCtx(); preloadSounds(); openPanel(false); });
  document.getElementById('strat-close').addEventListener('click', closePanel);
}

function openPanel(hard) {
  hardMode   = hard;
  panelOpen  = true;
  const panel = document.getElementById('strat-panel');
  panel.classList.remove('hidden');
  updateModeLabel();
  resetUI();
  if (!gameKeyFn) {
    gameKeyFn = e => handleKey(e);
    document.addEventListener('keydown', gameKeyFn, true); // capture phase beats easter egg
  }
}

function closePanel() {
  panelOpen = false;
  document.getElementById('strat-panel').classList.add('hidden');
  stopTimer();
  gameActive = false;
  if (gameKeyFn) { document.removeEventListener('keydown', gameKeyFn, true); gameKeyFn = null; }
}

function updateModeLabel() {
  const inner = document.getElementById('strat-inner');
  const label = document.getElementById('strat-mode-label');
  if (hardMode) {
    label.textContent = '⚠ HARD MODE';
    inner.style.borderColor = 'var(--red2)';
    inner.style.boxShadow   = '0 0 40px rgba(192,57,43,0.25)';
  } else {
    label.textContent = '◈ STRATAGEM TERMINAL';
    inner.style.borderColor = 'var(--yellow2)';
    inner.style.boxShadow   = '0 0 40px rgba(245,194,0,0.12)';
  }
}

// ── GAME LOGIC ────────────────────────────────────────────────
function resetUI() {
  score = parseInt(sessionStorage.getItem('stratScore') || '0');
  highScore = parseInt(sessionStorage.getItem('stratHigh') || '0');
  gameActive = false;
  stopTimer();
  setEl('strat-score', score);
  setEl('strat-high', highScore);
  setEl('strat-name', 'AWAITING ORDERS');
  setEl('strat-feedback', '');
  document.getElementById('strat-sequence').innerHTML = '';
  document.getElementById('strat-input-row').innerHTML = '';
  document.getElementById('strat-start-btn').style.display = 'block';
  document.getElementById('strat-img').style.display = 'none';
  document.getElementById('strat-emoji').textContent = '📡';
  setTimerBar(TOTAL_TIME, TOTAL_TIME);
}

function startRound() {
  document.getElementById('strat-start-btn').style.display = 'none';
  setEl('strat-feedback', '');
  pick();
  timeLeft  = TOTAL_TIME;
  lastTick  = performance.now();
  gameActive = true;
  tickTimer();
}

function pick() {
  current       = stratagems[Math.floor(Math.random() * stratagems.length)];
  inputProgress = [];
  setEl('strat-name', current.name);
  renderImg();
  renderSeq();
  renderInput();
}

function renderImg() {
  const imgEl   = document.getElementById('strat-img');
  const emojiEl = document.getElementById('strat-emoji');
  if (current.img) {
    imgEl.src   = IMG + current.img;
    imgEl.style.display = 'block';
    emojiEl.style.display = 'none';
    imgEl.onerror = () => { imgEl.style.display='none'; emojiEl.style.display='block'; };
  } else {
    imgEl.style.display = 'none';
    emojiEl.style.display = 'block';
    emojiEl.textContent = categoryEmoji(current.name);
  }
}

function categoryEmoji(name) {
  if (/eagle/i.test(name))    return '✈';
  if (/orbital/i.test(name))  return '🔴';
  if (/reinforce/i.test(name))return '🪂';
  if (/resupply/i.test(name)) return '📦';
  if (/sentry/i.test(name))   return '🤖';
  if (/shield/i.test(name))   return '🛡';
  if (/hellbomb/i.test(name)) return '☢';
  if (/rail/i.test(name))     return '⚡';
  if (/tesla/i.test(name))    return '⚡';
  if (/flame/i.test(name))    return '🔥';
  if (/mine/i.test(name))     return '💀';
  if (/beacon|sos/i.test(name))return '🆘';
  return '📡';
}

function renderSeq() {
  document.getElementById('strat-sequence').innerHTML =
    current.keys.map((k,i) => `<span class="strat-key" id="sk-${i}">${DIR_ARROW[k]}</span>`).join('');
}

function renderInput() {
  document.getElementById('strat-input-row').innerHTML =
    current.keys.map((_,i) =>
      `<span class="strat-slot ${i < inputProgress.length ? 'filled' : ''}" id="si-${i}">${
        i < inputProgress.length ? DIR_ARROW[inputProgress[i]] : '·'
      }</span>`
    ).join('');
}

function handleKey(e) {
  if (!panelOpen) return;
  const dir = KEY_MAP[e.key];
  if (!dir) return;
  e.stopPropagation(); // suppress easter egg listener
  e.preventDefault();
  if (!gameActive) return;

  // Play directional sound
  if (SND_MAP[dir]) playSound(SND_MAP[dir], 0.7);
  else sfxKey();

  inputProgress.push(dir);
  const idx = inputProgress.length - 1;

  // Highlight
  const sk = document.getElementById(`sk-${idx}`);
  if (sk) sk.classList.add('active');
  renderInput();

  if (dir !== current.keys[idx]) {
    onFail();
    return;
  }

  if (inputProgress.length === current.keys.length) {
    onSuccess();
  }
}

function onSuccess() {
  gameActive = false;
  stopTimer();
  score++;
  sessionStorage.setItem('stratScore', score);
  if (score > highScore) { highScore = score; sessionStorage.setItem('stratHigh', highScore); }
  setEl('strat-score', score);
  setEl('strat-high', highScore);

  // Time bonus only on full stratagem completion
  const bonus = hardMode ? BONUS_HARD : BONUS_NORMAL;
  timeLeft = Math.min(timeLeft + bonus, TOTAL_TIME * 1.5);

  current.keys.forEach((_,i) => { const el=document.getElementById(`sk-${i}`); if(el) el.classList.add('correct'); });

  // Check Eagle 500KG → trigger hard mode
  const wasEagle = current.name === EAGLE_500 || current.name.includes('500KG');
  if (wasEagle && !hardMode) {
    setFeedback('⚠ HARD MODE ACTIVATED', 'hard');
    sfxHard();
    setTimeout(() => {
      clearFeedback();
      hardMode = true;
      updateModeLabel();
      document.querySelectorAll('.strat-key').forEach(el => el.classList.remove('correct','active'));
      gameActive = true;
      timeLeft = TOTAL_TIME;
      lastTick = performance.now();
      pick();
      tickTimer();
    }, 1500);
  } else {
    setFeedback('✔ STRATAGEM CONFIRMED', 'success');
    sfxSuccess();
    setTimeout(() => {
      clearFeedback();
      document.querySelectorAll('.strat-key').forEach(el => el.classList.remove('correct','active'));
      gameActive = true;
      pick();
      tickTimer();
    }, 700);
  }
}

function onFail() {
  gameActive = false;
  stopTimer();
  sfxFail();
  playSound('GameOver1.mp3', 0.8);

  current.keys.forEach((_,i) => { const el=document.getElementById(`sk-${i}`); if(el) el.classList.add('wrong'); });
  setFeedback(`✕ FAILED — SCORE: ${score}`, 'fail');

  // Reset score on fail
  score = 0;
  sessionStorage.setItem('stratScore', score);
  setEl('strat-score', score);

  // Hard mode resets to normal on fail
  if (hardMode) {
    hardMode = false;
    updateModeLabel();
  }

  setTimeout(() => {
    clearFeedback();
    document.querySelectorAll('.strat-key').forEach(el => el.classList.remove('wrong','active'));
    timeLeft  = TOTAL_TIME;
    lastTick  = performance.now();
    gameActive = true;
    pick();
    tickTimer();
  }, 1400);
}

function onTimeOut() {
  gameActive = false;
  stopTimer();
  sfxFail();
  current.keys.forEach((_,i) => { const el=document.getElementById(`sk-${i}`); if(el) el.classList.add('wrong'); });
  setFeedback(`⏱ TIME OUT — SCORE: ${score}`, 'fail');

  score = 0;
  sessionStorage.setItem('stratScore', score);
  setEl('strat-score', score);
  if (hardMode) { hardMode = false; updateModeLabel(); }

  setTimeout(() => {
    clearFeedback();
    document.querySelectorAll('.strat-key').forEach(el => el.classList.remove('wrong','active'));
    timeLeft  = TOTAL_TIME;
    lastTick  = performance.now();
    gameActive = true;
    pick();
    tickTimer();
  }, 1400);
}

// ── TIMER ─────────────────────────────────────────────────────
function tickTimer() {
  stopTimer();
  timerRaf = requestAnimationFrame(function loop(now) {
    if (!gameActive) return;
    const dt = now - (lastTick || now);
    lastTick = now;
    timeLeft -= dt;
    setTimerBar(timeLeft, TOTAL_TIME * 1.5);
    if (timeLeft <= 0) { onTimeOut(); return; }
    timerRaf = requestAnimationFrame(loop);
  });
}

function stopTimer() {
  if (timerRaf) { cancelAnimationFrame(timerRaf); timerRaf = null; }
}

function setTimerBar(current, max) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const bar = document.getElementById('strat-timer-bar');
  if (!bar) return;
  bar.style.width = pct + '%';
  bar.style.background = pct > 50 ? 'var(--yellow)' : pct > 25 ? '#f5a000' : 'var(--red2)';
}

// ── HELPERS ───────────────────────────────────────────────────
function setEl(id, val) { const el=document.getElementById(id); if(el) el.textContent=val; }
function setFeedback(msg, type) {
  const el = document.getElementById('strat-feedback');
  if (!el) return;
  el.textContent = msg;
  el.className = type ? `strat-fb-${type}` : '';
}
function clearFeedback() { setFeedback('',''); }

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  stratagems = FALLBACK; // available immediately
  buildUI();
  loadStratagems(); // enrich in background, no await
  // sounds preloaded on first open, not on page load

  document.getElementById('strat-start-btn').addEventListener('click', () => {
    getAudioCtx(); // resume on user gesture
    startRound();
  });

  // Hook easter egg: after closing, open in hard mode
  const easterClose = document.getElementById('close-easter');
  const easterPanel = document.getElementById('easter-egg');
  if (easterClose && easterPanel) {
    easterClose.addEventListener('click', () => {
      easterPanel.classList.add('hidden');
      setTimeout(() => { getAudioCtx(); openPanel(true); sfxHard(); }, 300);
    });
  }
});
