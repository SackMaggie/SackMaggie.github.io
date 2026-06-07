// ── EXPERIENCE CALCULATOR ──────────────────────────────────────
// First job: Game Square Interactive, Mar 2019
function calcExperience() {
  const start = new Date(2019, 2); // March 2019 (month is 0-indexed)
  const now   = new Date();
  let years  = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  if (months < 0) { years--; months += 12; }
  return months > 0 ? `${years}yr ${months}mos` : `${years}yr`;
}

const EXP = calcExperience();

// Inject into static elements after DOM ready
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#exp-dossier, #exp-about, #exp-hero').forEach(el => {
    el.textContent = el.id === 'exp-hero' ? `${EXP} EXP` : EXP;
  });
});

// ── BOOT TERMINAL ──────────────────────────────────────────────
const lines = [
  { text: '◈ SUPER EARTH DEFENSE NETWORK — INITIALIZING...',    class: 't-warn',  delay: 0 },
  { text: '',                                                    class: '',        delay: 300 },
  { text: '> AUTHENTICATING OPERATIVE...',                      class: 't-muted', delay: 500 },
  { text: '  IDENTITY CONFIRMED: ATAPHON SRILAKHAM',            class: 't-hi',    delay: 700 },
  { text: '',                                                    class: '',        delay: 200 },
  { text: '> LOADING PERSONNEL FILE...',                        class: 't-muted', delay: 500 },
  { text: '  DESIGNATION : Senior Software Engineer / Solution Architect', class: 't-info', delay: 600 },
  { text: '  LOCATION    : Bangkok, Thailand',                  class: 't-info',  delay: 400 },
  { text: `  EXPERIENCE  : ${EXP} Active Duty`,                 class: 't-info',  delay: 400 },
  { text: '',                                                    class: '',        delay: 200 },
  { text: '> SCANNING ARSENAL...',                              class: 't-muted', delay: 500 },
  { text: '  PRIMARY   ✔  C# · ASP.NET Core · YARP · BFF',     class: 't-hi',    delay: 600 },
  { text: '  SUPPORT   ✔  React · Docker · Ceph · Keycloak',   class: 't-hi',    delay: 400 },
  { text: '  RECON     ✔  SigNoz · Distributed Tracing',       class: 't-hi',    delay: 400 },
  { text: '  INCOMING  ⚡  Azure · AWS · Terraform',            class: 't-warn',  delay: 400 },
  { text: '',                                                    class: '',        delay: 200 },
  { text: '> CURRENT MISSION: 2C2P — ACQUIRING TEAM',          class: 't-cmd',   delay: 600 },
  { text: '',                                                    class: '',        delay: 200 },
  { text: '> LAUNCHING PORTFOLIO...',                           class: 't-muted', delay: 600 },
];

const output   = document.getElementById('terminal-output');
const overlay  = document.getElementById('terminal-overlay');
const mainSite = document.getElementById('main-site');

function launchSite() {
  overlay.style.opacity = '0';
  setTimeout(() => {
    overlay.style.display = 'none';
    mainSite.classList.remove('hidden');
    mainSite.style.animation = 'fadeIn 0.5s ease';
  }, 600);
}

// Skip on click or any keypress
overlay.addEventListener('click', launchSite);
document.addEventListener('keydown', function skipOnce(e) {
  // Don't intercept the stratagem code keys — but boot screen is gone by then anyway
  launchSite();
  document.removeEventListener('keydown', skipOnce);
}, { once: true });

let totalDelay = 300;

lines.forEach(line => {
  totalDelay += line.delay;
  const d = totalDelay;
  setTimeout(() => {
    const span = document.createElement('span');
    span.className = line.class;
    span.textContent = line.text || ' ';
    output.appendChild(span);
    output.appendChild(document.createElement('br'));
    output.scrollTop = output.scrollHeight;
  }, d);
});

totalDelay += 900;
setTimeout(launchSite, totalDelay);

// ── FUN FACTS ──────────────────────────────────────────────────
const facts = [
  '"A good API design is a love letter to future developers." — Me, to my team.',
  'Debugged a race condition in a matchmaking server at 2 AM using nothing but logs and intuition. Shipped at 9 AM.',
  'Went from Unity physics glitches to distributed system consistency issues. Both haunt you equally.',
  'Ceph RGW was introduced to me via a production incident. Best way to learn distributed storage.',
  'I believe architecture diagrams should be maintained like code — not just written and forgotten.',
  'Started career building virtual battles. Now I build the infrastructure that keeps real money moving.',
  'My first production incident taught me more about observability than any textbook ever could.',
  'Hackathon Winner at 2C2P — deploying under pressure is just another deployment.',
];

let factIndex = Math.floor(Math.random() * facts.length);
const factText = document.getElementById('fun-fact-text');
const nextBtn  = document.getElementById('next-fact');

function showFact() {
  factText.style.opacity = '0';
  setTimeout(() => {
    factText.textContent = facts[factIndex];
    factText.style.opacity = '1';
    factIndex = (factIndex + 1) % facts.length;
  }, 150);
}

showFact();
nextBtn.addEventListener('click', showFact);

// ── EASTER EGG — EAGLE 500KG BOMB STRATAGEM ───────────────────
// Arrow keys: ↑ → ↓ ↓ ↓  |  WASD: W D S S S
const stratagemArrow = ['ArrowUp','ArrowRight','ArrowDown','ArrowDown','ArrowDown'];
const stratagemWASD  = ['w','d','s','s','s'];
let   konamiPos = 0;

document.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  const arrowMatch = e.key === stratagemArrow[konamiPos];
  const wasdMatch  = key    === stratagemWASD[konamiPos];

  if (arrowMatch || wasdMatch) {
    konamiPos++;
    if (konamiPos === stratagemArrow.length) {
      konamiPos = 0;
      document.getElementById('easter-egg').classList.remove('hidden');
    }
  } else {
    konamiPos = 0;
  }
});

document.getElementById('close-easter').addEventListener('click', () => {
  document.getElementById('easter-egg').classList.add('hidden');
});

// ── GITHUB ACTIVITY FEED ───────────────────────────────────────
function esc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

const EVENT_LABELS = {
  PushEvent:                  { icon: '⬆', label: 'Pushed to' },
  CreateEvent:                { icon: '✦', label: 'Created' },
  PullRequestEvent:           { icon: '⇄', label: 'Pull request on' },
  IssuesEvent:                { icon: '!', label: 'Issue on' },
  WatchEvent:                 { icon: '★', label: 'Starred' },
  ForkEvent:                  { icon: '⑂', label: 'Forked' },
  IssueCommentEvent:          { icon: '»', label: 'Commented on' },
  PullRequestReviewEvent:     { icon: '✔', label: 'Reviewed PR on' },
  DeleteEvent:                { icon: '✕', label: 'Deleted branch in' },
  ReleaseEvent:               { icon: '▲', label: 'Released on' },
};

function timeAgo(dateStr) {
  const diff = (new Date() - new Date(dateStr)) / 1000;
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}

async function loadActivity() {
  const feed  = document.getElementById('activity-feed');
  const count = document.getElementById('activity-count');
  try {
    const res    = await fetch('https://api.github.com/users/SackMaggie/events/public?per_page=20');
    const events = await res.json();

    if (!events.length) { feed.innerHTML = '<p class="repo-error">[ NO RECENT ACTIVITY ]</p>'; return; }

    count.textContent = `${events.length} EVENTS`;
    feed.innerHTML = '';

    events.forEach(ev => {
      const info   = EVENT_LABELS[ev.type] || { icon: '◈', label: 'Activity on' };
      const repo   = ev.repo?.name || '—';
      const repoUrl = `https://github.com/${repo}`;
      const when   = timeAgo(ev.created_at);

      let detail = '';
      if (ev.type === 'PushEvent') {
        const commits = ev.payload?.commits || [];
        const branch  = esc((ev.payload?.ref || '').replace('refs/heads/', ''));
        detail = commits.length
          ? `${commits.length} commit${commits.length > 1 ? 's' : ''} to <span class="act-branch">${branch}</span>`
          : `<span class="act-branch">${branch}</span>`;
      } else if (ev.type === 'CreateEvent') {
        detail = `${esc(ev.payload?.ref_type)} <span class="act-branch">${esc(ev.payload?.ref || repo)}</span>`;
      } else if (ev.type === 'PullRequestEvent') {
        detail = `${esc(ev.payload?.action)} — ${esc(ev.payload?.pull_request?.title)}`;
      } else if (ev.type === 'IssuesEvent') {
        detail = `${esc(ev.payload?.action)} — ${esc(ev.payload?.issue?.title)}`;
      }

      const row = document.createElement('div');
      row.className = 'activity-row';
      row.innerHTML = `
        <span class="act-icon">${esc(info.icon)}</span>
        <span class="act-label">${esc(info.label)}</span>
        <a href="${esc(repoUrl)}" target="_blank" class="act-repo">${esc(repo.split('/')[1] || repo)}</a>
        ${detail ? `<span class="act-detail">${detail}</span>` : ''}
        <span class="act-when">${esc(when)}</span>
      `;
      feed.appendChild(row);
    });
  } catch (e) {
    feed.innerHTML = '<p class="repo-error">[ ACTIVITY LOG UNAVAILABLE ]</p>';
    count.textContent = 'OFFLINE';
  }
}

loadActivity();

// ── GITHUB REPOS ───────────────────────────────────────────────
const LANG_COLORS = {
  'C#': '#178600', 'Python': '#3572A5', 'JavaScript': '#f1e05a',
  'TypeScript': '#2b7489', 'Shell': '#89e051', 'HTML': '#e34c26',
  'CSS': '#563d7c', 'default': '#8892b0'
};

async function loadRepos() {
  const grid = document.getElementById('repo-grid');
  try {
    const res  = await fetch('https://api.github.com/users/SackMaggie/repos?sort=updated&per_page=6');
    const repos = await res.json();

    const own = repos.filter(r => !r.fork).slice(0, 6);
    const all = own.length ? own : repos.slice(0, 6);

    grid.innerHTML = '';
    all.forEach(repo => {
      const langColor = LANG_COLORS[repo.language] || LANG_COLORS['default'];
      const updated   = new Date(repo.updated_at).toLocaleDateString('en-GB', { year:'numeric', month:'short' });
      const desc      = repo.description || 'No description provided.';

      const card = document.createElement('a');
      card.href   = repo.html_url;
      card.target = '_blank';
      card.className = 'repo-card';
      card.innerHTML = `
        <div class="repo-top">
          <span class="repo-icon">📁</span>
          <span class="repo-name">${repo.name}</span>
          ${repo.fork ? '<span class="repo-fork-badge">FORK</span>' : ''}
        </div>
        <p class="repo-desc">${desc}</p>
        <div class="repo-meta">
          ${repo.language ? `<span class="repo-lang"><span class="lang-dot" style="background:${langColor}"></span>${repo.language}</span>` : ''}
          <span class="repo-stat">★ ${repo.stargazers_count}</span>
          <span class="repo-stat">⑂ ${repo.forks_count}</span>
          <span class="repo-date">${updated}</span>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (e) {
    grid.innerHTML = '<p class="repo-error">[ MISSION DATA UNAVAILABLE — CHECK NETWORK ]</p>';
  }
}

loadRepos();

// ── FOOTER YEAR ────────────────────────────────────────────────
document.getElementById('year').textContent = new Date().getFullYear();
