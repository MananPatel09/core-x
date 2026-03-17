// ═══════════════════════════════════════════════
//  CoreX Fitness Tracker – app.js
// ═══════════════════════════════════════════════

// ── DATA ──
const exercises = [
  { name: 'Barbell Squat',     icon: '🏋️', sets: 4, reps: '5',  weight: '100kg', instruction: 'Stand with feet shoulder-width apart. Bar on upper traps. Brace your core, push hips back and down until thighs are parallel. Drive through heels to stand.' },
  { name: 'Bench Press',       icon: '💪', sets: 4, reps: '5',  weight: '80kg',  instruction: 'Lie flat on bench, grip bar slightly wider than shoulder-width. Lower bar to mid-chest with control. Press explosively upward. Keep shoulder blades retracted.' },
  { name: 'Deadlift',          icon: '⚡', sets: 3, reps: '5',  weight: '140kg', instruction: 'Feet hip-width apart, bar over mid-foot. Hinge at hips, grip bar. Brace core, drive through floor pushing hips forward. Keep bar close to body throughout.' },
  { name: 'Pull-Ups',          icon: '🔝', sets: 3, reps: '8',  weight: 'BW',    instruction: 'Hang from bar with overhand grip. Engage lats and pull chest to bar. Lower with control. Full extension at bottom. Keep core tight throughout movement.' },
  { name: 'Overhead Press',    icon: '🙌', sets: 3, reps: '8',  weight: '60kg',  instruction: 'Stand, bar at shoulder height. Grip slightly wider than shoulders. Press bar directly overhead, lock out arms. Lower with control. Keep core braced.' },
  { name: 'Romanian Deadlift', icon: '🦵', sets: 3, reps: '10', weight: '80kg',  instruction: 'Start standing. Hinge at hips with slight knee bend, lower bar along legs. Feel stretch in hamstrings. Drive hips forward to return. Keep back flat throughout.' },
];

const quotes = [
  { text: "The pain you feel today will be the strength you feel tomorrow.", author: "Unknown" },
  { text: "Don't limit your challenges. Challenge your limits.",              author: "Jerry Dunn" },
  { text: "Sweat is just fat crying.",                                        author: "CoreX" },
  { text: "It never gets easier. You just get stronger.",                     author: "Unknown" },
  { text: "Train insane or remain the same.",                                 author: "Jade Carey" },
  { text: "Your body can stand almost anything. It's your mind that you have to convince.", author: "Unknown" },
];

// ── STATE ──
let currentEx       = 0;
let completedSets   = [];
let sessionSeconds  = 0;
let sessionInterval = null;
let restInterval    = null;
let restSeconds     = 60;
let completedExercises = new Set();
let selectedPlan    = '';
let qSelections     = { level: '', goal: '' };

// ═══════════════════════════════════
//  INIT
// ═══════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  renderTodayExercises();
  renderQuote();
  renderBarChart();
  renderCalendar();
  renderExerciseSlide();
  updateDate();
});

function updateDate() {
  const d = new Date();
  const el = document.getElementById('dashDate');
  if (el) el.textContent = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) + ' · Power Builder – Week 2, Day 3';
}

// ═══════════════════════════════════
//  SCREEN NAVIGATION
// ═══════════════════════════════════
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  const el = document.getElementById(id);
  el.style.display = 'flex';
  requestAnimationFrame(() => el.classList.add('active'));
}

function showNav(screenId, btn) {
  showScreen(screenId);
  if (btn) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  if (screenId === 'workoutScreen' && !sessionInterval) {
    startSessionTimer();
  }
}

// ═══════════════════════════════════
//  AUTH
// ═══════════════════════════════════
function switchTab(tab) {
  document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('loginForm').style.display    = tab === 'login'    ? 'block' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
}

function doLogin() {
  showScreen('questionScreen');
}

function doGoogleLogin() {
  showScreen('questionScreen');
}

function logout() {
  if (sessionInterval) clearInterval(sessionInterval);
  sessionInterval = null;
  showScreen('loginScreen');
}

// ═══════════════════════════════════
//  QUESTIONNAIRE
// ═══════════════════════════════════
function qNext(step) {
  document.querySelectorAll('[id^=qStep]').forEach(s => s.style.display = 'none');
  document.getElementById('qStep' + step).style.display = 'block';
  document.querySelectorAll('.q-step').forEach((s, i) => {
    s.classList.toggle('done', i < step);
  });
}

function selectOption(el, group, val) {
  document.querySelectorAll('[onclick*="' + group + '"]').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  qSelections[group] = val;
}

function generatePlans() {
  showScreen('planScreen');
}

function selectPlan(plan) {
  selectedPlan = plan;
  showScreen('dashScreen');
  startSessionTimer();
}

// ═══════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════
function renderTodayExercises() {
  const container = document.getElementById('todayExercises');
  if (!container) return;
  container.innerHTML = exercises.map((ex, i) => `
    <div class="exercise-row" onclick="toggleExercise(${i})">
      <div class="ex-icon">${ex.icon}</div>
      <div class="ex-info">
        <div class="ex-name">${ex.name}</div>
        <div class="ex-meta">${ex.sets} sets · ${ex.reps} reps · ${ex.weight}</div>
      </div>
      <div class="ex-status ${completedExercises.has(i) ? 'done' : ''}" id="check${i}">
        ${completedExercises.has(i) ? '✓' : ''}
      </div>
    </div>
  `).join('');
}

function toggleExercise(i) {
  if (completedExercises.has(i)) completedExercises.delete(i);
  else completedExercises.add(i);
  updateProgress();
  renderTodayExercises();
}

function updateProgress() {
  const pct = Math.round((completedExercises.size / exercises.length) * 100);
  const pctEl = document.getElementById('progressPct');
  const circle = document.getElementById('progressCircle');
  if (pctEl) pctEl.textContent = pct + '%';
  if (circle) circle.setAttribute('stroke-dashoffset', 345.4 * (1 - pct / 100));
}

function renderQuote() {
  const q = quotes[Math.floor(Math.random() * quotes.length)];
  const el = document.getElementById('motivationalQuote');
  if (el) el.innerHTML = `"${q.text}"<div class="quote-author">— ${q.author}</div>`;
}

// ═══════════════════════════════════
//  WORKOUT SESSION
// ═══════════════════════════════════
function startSessionTimer() {
  if (sessionInterval) clearInterval(sessionInterval);
  sessionSeconds = 0;
  sessionInterval = setInterval(() => {
    sessionSeconds++;
    const m  = String(Math.floor(sessionSeconds / 60)).padStart(2, '0');
    const s  = String(sessionSeconds % 60).padStart(2, '0');
    const el = document.getElementById('sessionTimer');
    if (el) el.textContent = m + ':' + s;
  }, 1000);
}

function renderExerciseSlide() {
  const ex    = exercises[currentEx];
  const slide = document.getElementById('exerciseSlide');
  if (!ex || !slide) return;

  slide.innerHTML = `
    <div class="exercise-hero-icon">${ex.icon}</div>
    <div class="exercise-title">${ex.name}</div>
    <div class="exercise-instruction">${ex.instruction}</div>
    <div style="display:flex;gap:16px;justify-content:center;">
      <div style="background:var(--card);border-radius:10px;padding:12px 24px;text-align:center;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:32px;color:var(--accent);">${ex.sets}</div>
        <div style="font-size:12px;color:var(--muted);">Sets</div>
      </div>
      <div style="background:var(--card);border-radius:10px;padding:12px 24px;text-align:center;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:32px;color:var(--accent);">${ex.reps}</div>
        <div style="font-size:12px;color:var(--muted);">Reps</div>
      </div>
      <div style="background:var(--card);border-radius:10px;padding:12px 24px;text-align:center;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:32px;color:var(--accent);">${ex.weight}</div>
        <div style="font-size:12px;color:var(--muted);">Weight</div>
      </div>
    </div>
  `;

  renderSets();
  const counter = document.getElementById('exCounter');
  if (counter) counter.textContent = `Exercise ${currentEx + 1} / ${exercises.length}`;
}

function renderSets() {
  const ex      = exercises[currentEx];
  const tracker = document.getElementById('setsTracker');
  if (!ex || !tracker) return;
  if (!completedSets[currentEx]) completedSets[currentEx] = [];

  tracker.innerHTML = Array.from({ length: ex.sets }, (_, i) => `
    <div class="set-box ${completedSets[currentEx].includes(i) ? 'done' : ''}" onclick="toggleSet(${i})">
      <div class="set-num">${i + 1}</div>
      <div class="set-lbl">${completedSets[currentEx].includes(i) ? '✓ Done' : 'Set'}</div>
    </div>
  `).join('');
}

function toggleSet(i) {
  if (!completedSets[currentEx]) completedSets[currentEx] = [];
  const idx = completedSets[currentEx].indexOf(i);
  if (idx >= 0) completedSets[currentEx].splice(idx, 1);
  else completedSets[currentEx].push(i);
  renderSets();
}

function completeSet() {
  const ex = exercises[currentEx];
  if (!completedSets[currentEx]) completedSets[currentEx] = [];
  const next = completedSets[currentEx].length;
  if (next < ex.sets) {
    completedSets[currentEx].push(next);
    renderSets();
    if (completedSets[currentEx].length === ex.sets) {
      completedExercises.add(currentEx);
    }
  }
}

function nextExercise() {
  if (currentEx < exercises.length - 1) { currentEx++; renderExerciseSlide(); }
}
function prevExercise() {
  if (currentEx > 0) { currentEx--; renderExerciseSlide(); }
}

function startRest() {
  const rt = document.getElementById('restTimer');
  if (!rt) return;
  rt.classList.add('visible');
  restSeconds = 60;
  document.getElementById('restCount').textContent = restSeconds;
  if (restInterval) clearInterval(restInterval);
  restInterval = setInterval(() => {
    restSeconds--;
    document.getElementById('restCount').textContent = restSeconds;
    if (restSeconds <= 0) { clearInterval(restInterval); rt.classList.remove('visible'); }
  }, 1000);
}

function finishWorkout() {
  if (sessionInterval) clearInterval(sessionInterval);
  const mins = Math.floor(sessionSeconds / 60);
  document.getElementById('modalDuration').textContent  = mins || 1;
  document.getElementById('modalExercises').textContent = completedExercises.size;
  document.getElementById('modalStreak').textContent    = 8;
  document.getElementById('completeModal').classList.add('visible');

  const streak = document.getElementById('streakCount');
  if (streak) streak.textContent = 8;

  const sw = document.getElementById('statWorkouts');
  if (sw) sw.textContent = parseInt(sw.textContent) + 1;

  completedExercises = new Set(exercises.map((_, i) => i));
  updateProgress();
}

function goToDash() {
  document.getElementById('completeModal').classList.remove('visible');
  renderTodayExercises();
  showNav('dashScreen', document.querySelectorAll('.nav-btn')[0]);
}

// ═══════════════════════════════════
//  PROGRESS SCREEN
// ═══════════════════════════════════
function renderBarChart() {
  const data  = [8400, 11200, 9800, 13500, 10200, 14800, 12400];
  const days  = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'];
  const max   = Math.max(...data);
  const chart = document.getElementById('barChart');
  if (!chart) return;

  chart.innerHTML = data.map((v, i) => `
    <div class="bar-col">
      <div class="bar" style="height:${(v / max) * 110}px;" title="${v}kg"></div>
      <div class="bar-label">${days[i]}</div>
    </div>
  `).join('');
}

function renderCalendar() {
  const grid   = document.getElementById('calendarGrid');
  if (!grid) return;
  const worked = [1, 3, 5, 6, 8, 10, 12, 13, 15, 17, 19, 20, 22, 24, 26, 27, 29, 31, 33, 35];

  grid.innerHTML = Array.from({ length: 35 }, (_, i) => `
    <div class="cal-day ${worked.includes(i) ? 'worked' : ''} ${i === 34 ? 'today' : ''}">${(i % 31) + 1}</div>
  `).join('');
}
