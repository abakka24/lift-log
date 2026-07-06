// ── Lift Log: app logic ────────────────────────────────────────────────
'use strict';

const K = {
  program: 'll_program',
  sessions: 'll_sessions',
  draft: 'll_draft',
  feedback: 'll_feedback',
  checkins: 'll_checkins',
};

// ---- storage ----------------------------------------------------------
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
}
function saveJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* full */ }
}
function clone(o) { return JSON.parse(JSON.stringify(o)); }

let program  = loadJSON(K.program, null);
if (!program || (program.version || 0) < PROGRAM_VERSION) {
  // Template upgrade shipped: replace stored program (history/feedback untouched)
  program = clone(DEFAULT_PROGRAM);
  saveJSON(K.program, program);
}
let sessions = loadJSON(K.sessions, []);
let feedback = loadJSON(K.feedback, []);
let draft    = loadJSON(K.draft, null);
let checkins = loadJSON(K.checkins, []);

let view = { name: 'today' };   // today | workout | history | guide | feedback | edit
let editDraft = null;           // working copy while editing a workout
let ciDraft = { energy: null, legs: null, back: null, note: '' };
let ciEditing = false;
let restTimer = null;           // { endsAt, label, fired, hideAt }

// ---- dates / weeks ----------------------------------------------------
function todayISO() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function parseISO(iso) { const p = iso.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
function weekOf(date) {
  const start = parseISO(PROGRAM_START);
  const days = Math.floor((date - start) / 86400000);
  return Math.floor(days / 7) + 1; // can be <1 before start or >4 after
}
function weekLabel(w) {
  if (w < 1) return 'Pre-block';
  if (w > 4) return 'Wk 4+';
  return 'Week ' + w;
}
function progressionFor(w) { return PROGRESSION[Math.min(Math.max(w, 1), 4)]; }
function scheduleFor(w) { return w <= 1 ? SCHEDULE.week1 : SCHEDULE.week2plus; }
function monIdx(date) { return (date.getDay() + 6) % 7; }
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function fmtDate(iso) {
  const d = parseISO(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

// ---- helpers ----------------------------------------------------------
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function getWorkout(id) { return program.workouts.find(w => w.id === id); }

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2200);
}

// Last logged data for an exercise id (most recent session that has real sets)
function lastFor(exId) {
  for (let i = sessions.length - 1; i >= 0; i--) {
    const e = sessions[i].entries && sessions[i].entries[exId];
    if (!e) continue;
    const real = (e.sets || []).filter(s => s.w !== '' || s.r !== '');
    if (real.length) {
      return {
        date: sessions[i].date,
        summary: real.map(s => (s.w === '' ? 'bw' : s.w) + '×' + (s.r === '' ? '?' : s.r)).join(', '),
      };
    }
  }
  return null;
}
function bestFor(exId) {
  let best = null;
  sessions.forEach(sn => {
    const e = sn.entries && sn.entries[exId];
    if (!e) return;
    (e.sets || []).forEach(s => {
      const w = parseFloat(s.w);
      if (!isNaN(w) && (best === null || w > best)) best = w;
    });
  });
  return best;
}

// ---- rest timer ---------------------------------------------------------
let actx = null;
function initAudio() {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
  } catch (e) {}
}
function beep() {
  try {
    if (!actx) return;
    [0, 0.35].forEach(t => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.connect(g); g.connect(actx.destination);
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.25, actx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + t + 0.28);
      o.start(actx.currentTime + t); o.stop(actx.currentTime + t + 0.3);
    });
  } catch (e) {}
}
function startTimer(ex) {
  if (!ex.rest) return;
  initAudio();
  restTimer = { endsAt: Date.now() + ex.rest * 1000, label: ex.name, fired: false };
  if (!startTimer._iv) startTimer._iv = setInterval(timerTick, 400);
  timerTick();
}
function timerTick() {
  const bar = document.getElementById('timerbar');
  if (!bar) return;
  if (!restTimer) { bar.classList.add('hidden'); return; }
  const rem = Math.ceil((restTimer.endsAt - Date.now()) / 1000);
  bar.classList.remove('hidden');
  if (rem <= 0) {
    if (!restTimer.fired) {
      restTimer.fired = true;
      restTimer.hideAt = Date.now() + 6000;
      beep();
      bar.classList.add('done');
      document.getElementById('timer-time').textContent = 'GO';
      document.getElementById('timer-label').textContent = 'Rest done — next set';
    }
    if (Date.now() > (restTimer.hideAt || 0)) {
      restTimer = null;
      bar.classList.add('hidden');
      bar.classList.remove('done');
    }
    return;
  }
  bar.classList.remove('done');
  document.getElementById('timer-time').textContent = Math.floor(rem / 60) + ':' + String(rem % 60).padStart(2, '0');
  document.getElementById('timer-label').textContent = restTimer.label;
}

// ---- next-weight suggestion ----------------------------------------------
const NO_SUGGEST = ['drills', 'snatch', 'cleanjerk', 'frontsquat', 'boxjump', 'mcgill'];
function suggestFor(ex) {
  if (!ex || ex.core || NO_SUGGEST.indexOf(ex.id) >= 0) return null;
  const m = String(ex.reps).match(/^(\d+)(?:\s*[–—-]\s*(\d+))?$/);
  if (!m) return null;
  const lo = +m[1], hi = +(m[2] || m[1]);
  for (let i = sessions.length - 1; i >= 0; i--) {
    const e = sessions[i].entries && sessions[i].entries[ex.id];
    if (!e) continue;
    const real = (e.sets || []).filter(s => s.w !== '' && s.r !== '' && !isNaN(parseFloat(s.w)) && !isNaN(parseInt(s.r, 10)));
    if (!real.length) continue;
    const w = Math.max(...real.map(s => parseFloat(s.w)));
    const top = real.filter(s => parseFloat(s.w) === w);
    const minR = Math.min(...top.map(s => parseInt(s.r, 10)));
    const inc = ['squat', 'rdl', 'legpress'].indexOf(ex.id) >= 0 ? 10 : 5;
    const gated = ['squat', 'rdl'].indexOf(ex.id) >= 0;
    if (minR >= hi) {
      if (gated && sessions[i].pain != null && sessions[i].pain > 2) {
        return 'hold ' + w + ' lb — pain was ' + sessions[i].pain + '/10 last time';
      }
      return 'try ' + (w + inc) + ' lb (you hit ' + w + '×' + minR + ')';
    }
    if (minR >= lo) return w + ' lb again — add a rep (last: ' + w + '×' + minR + ')';
    return 'hold ' + w + ' lb, own ' + lo + '+ reps first';
  }
  return null;
}

// ---- plate calculator ------------------------------------------------------
function plateCalc() {
  const tEl = document.getElementById('plate-target');
  const out = document.getElementById('plate-result');
  if (!tEl || !out) return;
  const t = parseFloat(tEl.value);
  const bar = parseFloat(document.getElementById('plate-bar').value);
  if (isNaN(t) || t < bar) {
    out.innerHTML = '<span class="sub">Enter a total weight of ' + bar + ' lb or more</span>';
    return;
  }
  let per = (t - bar) / 2;
  const list = [];
  [45, 35, 25, 10, 5, 2.5].forEach(p => {
    const n = Math.floor(per / p + 1e-9);
    if (n > 0) { list.push(n > 1 ? p + '×' + n : String(p)); per -= n * p; }
  });
  per = Math.round(per * 100) / 100;
  out.innerHTML = '<b>Per side:</b> ' + (list.length ? list.join(' · ') : 'empty bar') +
    (per > 0 ? '<br><span class="sub">' + (per * 2) + ' lb unloadable — closest is ' + (t - per * 2) + ' lb</span>' : '');
}

// ---- daily check-ins ---------------------------------------------------------
function todaysCheckin() {
  const d = todayISO();
  return checkins.find(c => c.date === d) || null;
}

// ---- draft ------------------------------------------------------------
function newDraft(workoutId) {
  const w = getWorkout(workoutId);
  const entries = {};
  w.exercises.forEach(ex => {
    const last = lastFor(ex.id);
    let lastW = '';
    if (last) {
      const m = last.summary.split(', ').pop().split('×')[0];
      if (m !== 'bw') lastW = m;
    }
    entries[ex.id] = {
      sets: Array.from({ length: ex.sets }, () => ({ w: lastW, r: '', done: false })),
      note: '',
    };
  });
  return {
    workoutId,
    date: todayISO(),
    week: weekOf(new Date()),
    entries,
    pain: null,
    note: '',
  };
}
function saveDraft() { saveJSON(K.draft, draft); }

// ---- export for Claude -------------------------------------------------
function buildExport() {
  const lines = [];
  lines.push('LIFT LOG EXPORT — ' + todayISO());
  lines.push('Program: ' + program.name + ' · ' + weekLabel(weekOf(new Date())));
  lines.push('');
  lines.push('== SESSIONS ==');
  const recent = sessions.slice(-12);
  if (!recent.length) lines.push('(none logged yet)');
  recent.forEach(sn => {
    const w = getWorkout(sn.workoutId);
    const name = w ? w.name : sn.workoutId;
    let head = '[' + sn.date + ' · ' + weekLabel(sn.week) + '] ' + name.toUpperCase();
    if (sn.pain != null) head += ' — pain ' + sn.pain + '/10';
    lines.push(head);
    const exList = w ? w.exercises : [];
    Object.keys(sn.entries).forEach(exId => {
      const meta = exList.find(e => e.id === exId);
      const e = sn.entries[exId];
      const real = (e.sets || []).filter(s => s.w !== '' || s.r !== '');
      if (!real.length && !e.note) return;
      let line = '  ' + (meta ? meta.name : exId) + ': ' +
        real.map(s => (s.w === '' ? 'bw' : s.w) + '×' + (s.r === '' ? '?' : s.r) + (s.done ? '' : ' (unfinished)')).join(', ');
      if (e.note) line += ' — “' + e.note + '”';
      lines.push(line);
    });
    if (sn.note) lines.push('  Session feedback: “' + sn.note + '”');
    lines.push('');
  });
  lines.push('== DAILY CHECK-INS ==');
  if (!checkins.length) lines.push('(none yet)');
  checkins.slice(-14).forEach(c => {
    lines.push('[' + c.date + '] energy ' + (c.energy != null ? c.energy : '–') + '/5 · legs ' +
      (c.legs != null ? c.legs : '–') + '/5 · back ' + (c.back != null ? c.back : '–') + '/10' +
      (c.note ? ' — “' + c.note + '”' : ''));
  });
  lines.push('');
  lines.push('== GENERAL FEEDBACK ==');
  if (!feedback.length) lines.push('(none yet)');
  feedback.slice(-15).forEach(f => lines.push('[' + f.date + '] ' + f.text));
  lines.push('');
  lines.push('(Paste this to Claude to get the program adjusted.)');
  return lines.join('\n');
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e2) {}
    ta.remove();
    return ok;
  }
}

// ---- render: shell -----------------------------------------------------
function render() {
  const app = document.getElementById('app');
  let html = '';
  if (view.name === 'today')    html = renderToday();
  if (view.name === 'workout')  html = renderWorkout();
  if (view.name === 'stretch')  html = renderStretch();
  if (view.name === 'history')  html = renderHistory();
  if (view.name === 'guide')    html = renderGuide();
  if (view.name === 'feedback') html = renderFeedback();
  if (view.name === 'edit')     html = renderEdit();
  app.innerHTML = html;
  document.querySelectorAll('.tabbar button').forEach(b => {
    b.classList.toggle('on', b.dataset.tab === view.name ||
      (b.dataset.tab === 'today' && (view.name === 'workout' || view.name === 'edit')));
  });
  app.scrollTop = 0;
  window.scrollTo(0, 0);
}

// ---- render: today -----------------------------------------------------
function renderToday() {
  const now = new Date();
  const wk = weekOf(now);
  const sched = scheduleFor(wk);
  const dayIdx = monIdx(now);
  const todayEntry = sched[dayIdx];
  const prog = progressionFor(wk);

  let h = '<header class="page-head"><div>' +
    '<h1>Lift Log</h1>' +
    '<p class="sub">' + esc(program.name) + '</p></div>' +
    '<div class="weekpill">' + weekLabel(wk) + '<span>' + esc(prog.label.split('—')[1] || '') + '</span></div>' +
    '</header>';

  // resume banner
  if (draft) {
    const dw = getWorkout(draft.workoutId);
    h += '<div class="card resume" data-act="resume">▶ Resume <b>' + esc(dw ? dw.name : draft.workoutId) +
      '</b> — in progress from ' + fmtDate(draft.date) + '</div>';
  }

  // today's suggestion
  h += '<section class="card today-card">' +
    '<div class="kicker">Today · ' + now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) + '</div>';
  if (todayEntry && todayEntry.workout) {
    const w = getWorkout(todayEntry.workout);
    h += '<div class="today-row">' +
      '<div class="today-art">' + artFor(w.icon) + '</div>' +
      '<div class="grow"><h2>' + esc(w.name) + '</h2><p class="sub">' + esc(todayEntry.where) + '</p></div>' +
      '<button class="btn primary" data-act="start" data-id="' + w.id + '">Start</button></div>';
  } else if (todayEntry) {
    h += '<h2 class="restlabel">' + esc(todayEntry.label) + '</h2>' +
      '<p class="sub">Morning + night routines still count today — they’re on the Guide tab.</p>';
  }
  h += '</section>';

  // daily check-in
  const ci = todaysCheckin();
  if (ci && !ciEditing) {
    h += '<section class="card"><div class="kicker">Daily check-in ✓</div>' +
      '<div class="ci-compact"><span class="grow">⚡ Energy ' + (ci.energy != null ? ci.energy + '/5' : '–') +
      ' · 🦵 Legs ' + (ci.legs != null ? ci.legs + '/5' : '–') +
      ' · 🔙 Back ' + (ci.back != null ? ci.back + '/10' : '–') + '</span>' +
      '<button class="btn ghost sm" data-act="ciedit">Edit</button></div>' +
      (ci.note ? '<p class="hnote">“' + esc(ci.note) + '”</p>' : '') +
      '</section>';
  } else {
    h += '<section class="card"><div class="kicker">Daily check-in — 10 seconds, feeds the Claude export</div>';
    h += '<div class="ci-lab">⚡ Energy (1 = dead, 5 = charged)</div><div class="ci-row">';
    for (let i = 1; i <= 5; i++) h += '<button class="pain' + (ciDraft.energy === i ? ' on' : '') + '" data-act="ciset" data-f="energy" data-n="' + i + '">' + i + '</button>';
    h += '</div><div class="ci-lab">🦵 Legs (1 = wrecked, 5 = fresh)</div><div class="ci-row">';
    for (let i = 1; i <= 5; i++) h += '<button class="pain' + (ciDraft.legs === i ? ' on' : '') + '" data-act="ciset" data-f="legs" data-n="' + i + '">' + i + '</button>';
    h += '</div><div class="ci-lab">🔙 Back right now (0 = silent)</div><div class="ci-row">';
    for (let i = 0; i <= 10; i++) h += '<button class="pain' + (ciDraft.back === i ? ' on' : '') + '" data-act="ciset" data-f="back" data-n="' + i + '">' + i + '</button>';
    h += '</div>';
    h += '<input type="text" class="ci-note" id="citext" placeholder="Anything worth noting — sleep, soreness, hockey load…" value="' + esc(ciDraft.note) + '">';
    h += '<div class="finishrow tight"><button class="btn primary" data-act="cisave">Save check-in</button>' +
      (ciEditing ? '<button class="btn ghost" data-act="cicancel">Cancel</button>' : '') + '</div></section>';
  }

  // all workouts
  h += '<div class="kicker pad">All workouts</div><div class="wgrid">';
  program.workouts.forEach(w => {
    h += '<div class="card wcard">' +
      '<div class="wcard-art">' + artFor(w.icon) + '</div>' +
      '<div class="grow"><b>' + esc(w.name) + '</b><p class="sub">' + esc(w.where) + ' · ' + w.exercises.length + ' movements</p></div>' +
      '<div class="wcard-btns">' +
      '<button class="btn ghost" data-act="edit" data-id="' + w.id + '" title="Edit">✎</button>' +
      '<button class="btn" data-act="start" data-id="' + w.id + '">Start</button>' +
      '</div></div>';
  });
  h += '</div>';

  // week strip
  h += '<div class="kicker pad">This week (' + (wk <= 1 ? 'no hockey' : 'hockey Tue/Wed/Thu') + ')</div>' +
    '<section class="card weekstrip">';
  sched.forEach((s, i) => {
    h += '<div class="ws-row' + (i === dayIdx ? ' now' : '') + '">' +
      '<span class="ws-day">' + DAY_NAMES[i] + '</span>' +
      '<span class="grow">' + esc(s.label) + '</span>' +
      '<span class="ws-where">' + esc(s.where) + '</span></div>';
  });
  h += '</section>';
  return h;
}

// ---- render: workout session -------------------------------------------
function renderWorkout() {
  if (!draft) { view = { name: 'today' }; return renderToday(); }
  const w = getWorkout(draft.workoutId);
  if (!w) { draft = null; saveDraft(); view = { name: 'today' }; return renderToday(); }
  const prog = progressionFor(draft.week);
  const hint = w.id === 'oly' ? prog.oly : (w.id === 'legs' ? prog.lower : prog.upper);

  let h = '<header class="page-head">' +
    '<button class="btn ghost back" data-act="back">‹</button>' +
    '<div class="grow"><h1>' + esc(w.name) + '</h1><p class="sub">' + esc(w.where) + ' · ' + weekLabel(draft.week) + '</p></div>' +
    '<button class="btn ghost" data-act="plates">◎ Plates</button>' +
    '</header>';

  h += '<div class="card hintcard">🎯 <b>' + esc(progressionFor(draft.week).label) + ':</b> ' + esc(hint) + '</div>';

  if (w.warmup) {
    const wu = ROUTINES.find(r => r.id === 'warmup');
    h += '<details class="card warmup"><summary>🔥 ' + esc(wu.name) + ' — non-negotiable</summary><ul>' +
      wu.items.map(i => '<li>' + esc(i.name + ' ' + i.dose) + '</li>').join('') +
      '</ul><p class="sub">Full how-to with pictures on the 🧘 Stretch tab.</p></details>';
  }

  let lastLoc = null;
  w.exercises.forEach(ex => {
    if (ex.loc && ex.loc !== lastLoc) {
      if (lastLoc !== null) h += '<div class="locdiv">🚗 Drive to ' + esc(ex.loc) + '</div>';
      else if (w.where.indexOf('→') >= 0) h += '<div class="locdiv first">📍 ' + esc(ex.loc) + '</div>';
      lastLoc = ex.loc;
    }
    h += renderExercise(ex);
  });

  if (w.painTracked) {
    h += '<section class="card"><div class="kicker">Back pain during session (0 = none)</div><div class="painrow">';
    for (let i = 0; i <= 10; i++) {
      h += '<button class="pain' + (draft.pain === i ? ' on' : '') + '" data-act="pain" data-n="' + i + '">' + i + '</button>';
    }
    h += '</div></section>';
  }

  h += '<section class="card"><div class="kicker">Session feedback for Claude</div>' +
    '<textarea data-bind="session-note" placeholder="How did it go? Anything hurt, anything too easy, machines busy, want changes…">' +
    esc(draft.note) + '</textarea></section>';

  h += '<div class="finishrow">' +
    '<button class="btn ghost" data-act="discard">Discard</button>' +
    '<button class="btn primary big" data-act="finish">✓ Finish &amp; save</button></div>';
  return h;
}

function renderExercise(ex) {
  const e = draft.entries[ex.id] || { sets: [], note: '' };
  const last = lastFor(ex.id);
  const best = bestFor(ex.id);

  let h = '<section class="card excard">' +
    '<div class="exhead">' +
    '<div class="exart">' + artFor(ex.art) + '</div>' +
    '<div class="grow"><h3>' + esc(ex.name) + (ex.core ? ' <span class="chip">core</span>' : '') + '</h3>' +
    '<p class="target">' + ex.sets + ' × ' + esc(ex.reps) + '</p>' +
    (last ? '<p class="last">Last: ' + esc(last.summary) + (best ? ' · Best: ' + best : '') + '</p>' : '') +
    (function () { const sg = suggestFor(ex); return sg ? '<p class="suggest">🎯 ' + esc(sg) + '</p>' : ''; })() +
    '</div></div>';

  h += '<details class="tip"><summary>💡 Tips &amp; video</summary>' +
    '<p>' + esc(ex.tip || '') + '</p>' +
    (ex.video ? '<a class="vlink" href="' + esc(ex.video) + '" target="_blank" rel="noopener">▶ Watch form videos</a>' : '') +
    '</details>';

  h += '<div class="sets">';
  e.sets.forEach((s, i) => {
    h += '<div class="setrow' + (s.done ? ' donerow' : '') + '">' +
      '<span class="setn">' + (i + 1) + '</span>' +
      '<input type="number" inputmode="decimal" step="2.5" min="0" placeholder="lb" value="' + esc(s.w) + '"' +
      ' data-bind="set" data-ex="' + ex.id + '" data-i="' + i + '" data-f="w">' +
      '<span class="x">×</span>' +
      '<input type="number" inputmode="numeric" step="1" min="0" placeholder="reps" value="' + esc(s.r) + '"' +
      ' data-bind="set" data-ex="' + ex.id + '" data-i="' + i + '" data-f="r">' +
      '<button class="donebtn' + (s.done ? ' on' : '') + '" data-act="done" data-ex="' + ex.id + '" data-i="' + i + '">✓</button>' +
      '</div>';
  });
  h += '</div><div class="setbtns">' +
    '<button class="btn ghost sm" data-act="addset" data-ex="' + ex.id + '">＋ set</button>' +
    (e.sets.length > 1 ? '<button class="btn ghost sm" data-act="rmset" data-ex="' + ex.id + '">－ set</button>' : '') +
    '</div>';

  h += '<input type="text" class="exnote" placeholder="Notes on this exercise… (goes into the Claude export)" value="' + esc(e.note) + '"' +
    ' data-bind="exnote" data-ex="' + ex.id + '">';
  h += '</section>';
  return h;
}

// ---- render: history ----------------------------------------------------
function renderHistory() {
  let h = '<header class="page-head"><div><h1>History</h1>' +
    '<p class="sub">' + sessions.length + ' session' + (sessions.length === 1 ? '' : 's') + ' logged</p></div></header>';
  if (!sessions.length) {
    h += '<section class="card empty">Nothing logged yet. Start a workout on the Today tab — every set you log lands here.</section>';
    return h;
  }
  sessions.slice().reverse().forEach(sn => {
    const w = getWorkout(sn.workoutId);
    const name = w ? w.name : sn.workoutId;
    h += '<section class="card hcard"><div class="hhead">' +
      '<b>' + esc(name) + '</b>' +
      '<span class="sub">' + fmtDate(sn.date) + ' · ' + weekLabel(sn.week) +
      (sn.pain != null ? ' · pain ' + sn.pain + '/10' : '') + '</span>' +
      '<button class="btn ghost sm del" data-act="delsession" data-id="' + sn.id + '">✕</button></div>';
    const exList = w ? w.exercises : [];
    Object.keys(sn.entries).forEach(exId => {
      const meta = exList.find(x => x.id === exId);
      const e = sn.entries[exId];
      const real = (e.sets || []).filter(s => s.w !== '' || s.r !== '');
      if (!real.length && !e.note) return;
      h += '<div class="hrow"><span class="hex">' + esc(meta ? meta.name : exId) + '</span>' +
        '<span class="hsets">' + real.map(s => (s.w === '' ? 'bw' : s.w) + '×' + (s.r === '' ? '?' : s.r)).join(', ') + '</span></div>';
      if (e.note) h += '<div class="hnote">↳ ' + esc(e.note) + '</div>';
    });
    if (sn.note) h += '<div class="hnote session">“' + esc(sn.note) + '”</div>';
    h += '</section>';
  });
  return h;
}

// ---- render: guide -------------------------------------------------------
function renderGuide() {
  const wk = weekOf(new Date());
  let h = '<header class="page-head"><div><h1>Guide</h1><p class="sub">Progression · guardrails · routines</p></div></header>';

  h += '<div class="kicker pad">4-week progression</div>';
  [1, 2, 3, 4].forEach(n => {
    const p = PROGRESSION[n];
    h += '<section class="card prog' + (n === Math.min(Math.max(wk, 1), 4) ? ' now' : '') + '">' +
      '<b>' + esc(p.label) + (n === wk ? ' — you are here' : '') + '</b>' +
      '<div class="hrow"><span class="hex">Upper</span><span class="hsets">' + esc(p.upper) + '</span></div>' +
      '<div class="hrow"><span class="hex">Lower</span><span class="hsets">' + esc(p.lower) + '</span></div>' +
      '<div class="hrow"><span class="hex">Oly</span><span class="hsets">' + esc(p.oly) + '</span></div>' +
      '</section>';
  });

  h += '<div class="kicker pad">Back-strain guardrails</div><section class="card"><ul class="plain">' +
    GUARDRAILS.map(g => '<li>' + esc(g) + '</li>').join('') + '</ul></section>';

  h += '<section class="card"><p class="sub" style="margin:0">🧘 The warm-up, morning, night, and Sunday routines — with pictures and how-tos — live on the <b>Stretch</b> tab.</p></section>';
  h += '<div class="finishrow"><button class="btn ghost" data-act="restoredefaults">Restore default program</button></div>';
  return h;
}

// ---- render: stretch --------------------------------------------------------
function renderStretch() {
  const now = new Date();
  const hr = now.getHours();
  const isSunday = monIdx(now) === 6;
  let h = '<header class="page-head"><div><h1>Stretch &amp; Mobility</h1>' +
    '<p class="sub">Tap through each routine — pictures, cues, and example videos</p></div></header>';

  h += '<section class="card hintcard">🦶 ' + esc(WALKING_CUE) + '</section>';

  ROUTINES.forEach(r => {
    const open = (r.id === 'morning' && hr < 12) || (r.id === 'night' && hr >= 19) || (r.id === 'sunday' && isSunday);
    h += '<details class="card routine"' + (open ? ' open' : '') + '><summary><b>' + esc(r.name) + '</b><span class="sub"> · ' + esc(r.when) + '</span></summary>';
    let sec = null;
    r.items.forEach(it => {
      if (it.sec && it.sec !== sec) { sec = it.sec; h += '<div class="st-sec">' + esc(sec) + '</div>'; }
      h += '<div class="st-item">' +
        '<input type="checkbox" class="st-cb">' +
        '<div class="exart st">' + artFor(it.art) + '</div>' +
        '<div class="grow"><b>' + esc(it.name) + '</b><span class="st-dose">' + esc(it.dose) + '</span>' +
        '<p class="st-tip">' + esc(it.tip) + '</p>' +
        (it.video ? '<a class="vlink stv" href="' + esc(it.video) + '" target="_blank" rel="noopener">▶ example video</a>' : '') +
        '</div></div>';
    });
    h += '</details>';
  });
  return h;
}

// ---- render: feedback -----------------------------------------------------
function renderFeedback() {
  let h = '<header class="page-head"><div><h1>Feedback</h1>' +
    '<p class="sub">Notes for Claude — export &amp; paste into chat to tune the program</p></div></header>';

  h += '<section class="card"><div class="kicker">New note</div>' +
    '<textarea id="fbtext" placeholder="e.g. squats felt fine at 135 but 155 pinched · Thursday pull is too rushed before hockey · want more arm work…"></textarea>' +
    '<div class="finishrow tight"><button class="btn primary" data-act="savefeedback">Save note</button></div></section>';

  h += '<section class="card exportcard"><div class="kicker">Send to Claude</div>' +
    '<p class="sub">Bundles your last 12 sessions + all notes into text. Copy it, then paste it to Claude in chat.</p>' +
    '<div class="finishrow tight">' +
    '<button class="btn primary" data-act="copyexport">📋 Copy for Claude</button>' +
    (navigator.share ? '<button class="btn" data-act="shareexport">Share…</button>' : '') +
    '</div></section>';

  if (feedback.length) {
    h += '<div class="kicker pad">Saved notes</div>';
    feedback.slice().reverse().forEach(f => {
      h += '<section class="card hcard"><div class="hhead"><span class="sub">' + fmtDate(f.date) + '</span>' +
        '<button class="btn ghost sm del" data-act="delfeedback" data-id="' + f.id + '">✕</button></div>' +
        '<p class="fbody">' + esc(f.text) + '</p></section>';
    });
  }

  h += '<div class="kicker pad">Backup</div><section class="card">' +
    '<p class="sub">Everything lives on this iPad only. Back it up occasionally.</p>' +
    '<div class="finishrow tight">' +
    '<button class="btn" data-act="backup">Download backup</button>' +
    '<button class="btn ghost" data-act="importclick">Import backup</button>' +
    '<input type="file" id="importfile" accept="application/json" hidden></div></section>';
  return h;
}

// ---- render: edit ----------------------------------------------------------
function renderEdit() {
  const w = editDraft;
  let h = '<header class="page-head">' +
    '<button class="btn ghost back" data-act="canceledit">‹</button>' +
    '<div class="grow"><h1>Edit: ' + esc(w.name) + '</h1><p class="sub">Changes apply to future sessions</p></div>' +
    '</header>';

  w.exercises.forEach((ex, i) => {
    h += '<section class="card editcard">' +
      '<div class="editrow1">' +
      '<div class="exart sm">' + artFor(ex.art) + '</div>' +
      '<input type="text" class="editname" value="' + esc(ex.name) + '" data-ebind="name" data-i="' + i + '">' +
      '<div class="wcard-btns">' +
      '<button class="btn ghost sm" data-act="moveex" data-i="' + i + '" data-dir="-1"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
      '<button class="btn ghost sm" data-act="moveex" data-i="' + i + '" data-dir="1"' + (i === w.exercises.length - 1 ? ' disabled' : '') + '>↓</button>' +
      '<button class="btn ghost sm del" data-act="delex" data-i="' + i + '">✕</button>' +
      '</div></div>' +
      '<div class="editrow2">' +
      '<label>Sets <input type="number" min="1" max="10" value="' + ex.sets + '" data-ebind="sets" data-i="' + i + '"></label>' +
      '<label>Reps <input type="text" value="' + esc(ex.reps) + '" data-ebind="reps" data-i="' + i + '"></label>' +
      '<label>Picture <select data-ebind="art" data-i="' + i + '">' +
      Object.keys(ART).map(k => '<option value="' + k + '"' + (ex.art === k ? ' selected' : '') + '>' + k + '</option>').join('') +
      '</select></label>' +
      '<label>Location <input type="text" value="' + esc(ex.loc || '') + '" data-ebind="loc" data-i="' + i + '"></label>' +
      '<label>Rest (sec) <input type="number" min="0" max="600" step="15" value="' + (ex.rest || 0) + '" data-ebind="rest" data-i="' + i + '"></label>' +
      '</div>' +
      '<label class="editfull">Tip<textarea data-ebind="tip" data-i="' + i + '">' + esc(ex.tip || '') + '</textarea></label>' +
      '<label class="editfull">Video link<input type="text" value="' + esc(ex.video || '') + '" data-ebind="video" data-i="' + i + '"></label>' +
      '</section>';
  });

  h += '<div class="finishrow">' +
    '<button class="btn" data-act="addex">＋ Add exercise</button>' +
    '<button class="btn primary big" data-act="saveprogram">Save changes</button></div>';
  return h;
}

// ---- actions ------------------------------------------------------------
function newId() { return 'x' + Math.random().toString(36).slice(2, 9); }

const ACTIONS = {
  nav(el)    { view = { name: el.dataset.tab }; render(); },
  start(el)  {
    const id = el.dataset.id;
    if (draft && draft.workoutId !== id) {
      if (!confirm('You have an unfinished ' + (getWorkout(draft.workoutId) || {}).name + ' session. Discard it and start ' + (getWorkout(id) || {}).name + '?')) return;
      draft = null;
    }
    if (!draft) draft = newDraft(id);
    saveDraft();
    view = { name: 'workout' };
    render();
  },
  resume()   { view = { name: 'workout' }; render(); },
  back()     { view = { name: 'today' }; render(); },
  done(el)   {
    const exId = el.dataset.ex;
    const s = draft.entries[exId].sets[+el.dataset.i];
    s.done = !s.done;
    if (s.done) {
      const w = getWorkout(draft.workoutId);
      const ex = w && w.exercises.find(x => x.id === exId);
      const wt = parseFloat(s.w);
      const best = bestFor(exId);
      if (!isNaN(wt) && best !== null && wt > best) {
        toast('🎉 PR — ' + (ex ? ex.name : exId) + ' ' + wt + ' lb (previous best ' + best + ')');
      }
      if (ex) startTimer(ex);
    }
    saveDraft(); render();
  },
  addset(el) {
    const sets = draft.entries[el.dataset.ex].sets;
    const prev = sets[sets.length - 1];
    sets.push({ w: prev ? prev.w : '', r: '', done: false });
    saveDraft(); render();
  },
  rmset(el)  {
    const sets = draft.entries[el.dataset.ex].sets;
    if (sets.length > 1) sets.pop();
    saveDraft(); render();
  },
  pain(el)   { draft.pain = +el.dataset.n; saveDraft(); render(); },
  finish()   {
    const logged = Object.values(draft.entries).some(e => e.sets.some(s => s.w !== '' || s.r !== '' || s.done));
    if (!logged && !confirm('No sets logged — save anyway?')) return;
    sessions.push(Object.assign({ id: newId() }, draft));
    saveJSON(K.sessions, sessions);
    draft = null; saveDraft();
    restTimer = null; timerTick();
    view = { name: 'history' };
    render();
    toast('Session saved 💪');
  },
  discard()  {
    if (!confirm('Discard this session? Logged sets will be lost.')) return;
    draft = null; saveDraft();
    restTimer = null; timerTick();
    view = { name: 'today' };
    render();
  },
  timeradd() {
    if (!restTimer) return;
    if (restTimer.fired) { restTimer.endsAt = Date.now() + 30000; restTimer.fired = false; }
    else restTimer.endsAt += 30000;
    timerTick();
  },
  timerx()   { restTimer = null; timerTick(); },
  plates()   { document.getElementById('platemodal').classList.remove('hidden'); plateCalc(); },
  platesclose() { document.getElementById('platemodal').classList.add('hidden'); },
  noop()     {},
  ciset(el)  { ciDraft[el.dataset.f] = +el.dataset.n; render(); },
  ciedit()   {
    const ci = todaysCheckin();
    ciDraft = { energy: ci.energy, legs: ci.legs, back: ci.back, note: ci.note || '' };
    ciEditing = true;
    render();
  },
  cicancel() { ciEditing = false; ciDraft = { energy: null, legs: null, back: null, note: '' }; render(); },
  cisave()   {
    if (ciDraft.energy == null && ciDraft.legs == null && ciDraft.back == null && !ciDraft.note.trim()) {
      toast('Tap a number first'); return;
    }
    const d = todayISO();
    checkins = checkins.filter(c => c.date !== d);
    checkins.push({ id: newId(), date: d, energy: ciDraft.energy, legs: ciDraft.legs, back: ciDraft.back, note: ciDraft.note.trim() });
    checkins.sort((a, b) => a.date < b.date ? -1 : 1);
    saveJSON(K.checkins, checkins);
    ciEditing = false;
    ciDraft = { energy: null, legs: null, back: null, note: '' };
    render();
    toast('Checked in ✓');
  },
  delsession(el) {
    if (!confirm('Delete this session from history?')) return;
    sessions = sessions.filter(s => s.id !== el.dataset.id);
    saveJSON(K.sessions, sessions);
    render();
  },
  savefeedback() {
    const ta = document.getElementById('fbtext');
    const text = ta.value.trim();
    if (!text) { toast('Write something first'); return; }
    feedback.push({ id: newId(), date: todayISO(), text });
    saveJSON(K.feedback, feedback);
    render();
    toast('Note saved');
  },
  delfeedback(el) {
    feedback = feedback.filter(f => f.id !== el.dataset.id);
    saveJSON(K.feedback, feedback);
    render();
  },
  async copyexport() {
    const ok = await copyText(buildExport());
    toast(ok ? 'Copied — paste it to Claude' : 'Copy failed — try Share instead');
  },
  shareexport() {
    navigator.share({ title: 'Lift Log export', text: buildExport() }).catch(() => {});
  },
  backup() {
    const blob = new Blob([JSON.stringify({ program, sessions, feedback, checkins }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'liftlog-backup-' + todayISO() + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
  },
  importclick() { document.getElementById('importfile').click(); },
  edit(el)   {
    editDraft = clone(getWorkout(el.dataset.id));
    view = { name: 'edit' };
    render();
  },
  canceledit() { editDraft = null; view = { name: 'today' }; render(); },
  addex()    {
    editDraft.exercises.push({
      id: newId(), name: 'New exercise', sets: 3, reps: '8', art: 'bar', rest: 90,
      loc: editDraft.exercises.length ? editDraft.exercises[editDraft.exercises.length - 1].loc : '',
      tip: '', video: '',
    });
    render();
  },
  delex(el)  {
    if (!confirm('Remove this exercise?')) return;
    editDraft.exercises.splice(+el.dataset.i, 1);
    render();
  },
  moveex(el) {
    const i = +el.dataset.i, d = +el.dataset.dir, arr = editDraft.exercises;
    const j = i + d;
    if (j < 0 || j >= arr.length) return;
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    render();
  },
  saveprogram() {
    const idx = program.workouts.findIndex(w => w.id === editDraft.id);
    if (idx >= 0) program.workouts[idx] = editDraft;
    saveJSON(K.program, program);
    editDraft = null;
    view = { name: 'today' };
    render();
    toast('Program updated');
  },
  restoredefaults() {
    if (!confirm('Restore the original 4-week program? Your custom edits are replaced (history and feedback are kept).')) return;
    program = clone(DEFAULT_PROGRAM);
    saveJSON(K.program, program);
    render();
    toast('Default program restored');
  },
};

// ---- events ---------------------------------------------------------------
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act],[data-tab]');
  if (!el) return;
  if (el.dataset.act && ACTIONS[el.dataset.act]) ACTIONS[el.dataset.act](el);
  else if (el.dataset.tab) ACTIONS.nav(el);
});

document.addEventListener('input', e => {
  const el = e.target;
  const bind = el.dataset.bind;
  if (bind === 'set' && draft) {
    draft.entries[el.dataset.ex].sets[+el.dataset.i][el.dataset.f] = el.value;
    saveDraft();
  } else if (bind === 'exnote' && draft) {
    draft.entries[el.dataset.ex].note = el.value;
    saveDraft();
  } else if (bind === 'session-note' && draft) {
    draft.note = el.value;
    saveDraft();
  } else if (el.id === 'citext') {
    ciDraft.note = el.value;
  } else if (el.id === 'plate-target' || el.id === 'plate-bar') {
    plateCalc();
  } else if (el.dataset.ebind && editDraft) {
    const ex = editDraft.exercises[+el.dataset.i];
    const f = el.dataset.ebind;
    if (f === 'sets') ex[f] = Math.max(1, parseInt(el.value, 10) || 1);
    else if (f === 'rest') ex[f] = Math.max(0, parseInt(el.value, 10) || 0);
    else ex[f] = el.value;
  }
});

document.addEventListener('change', e => {
  if (e.target.id === 'plate-bar') { plateCalc(); return; }
  if (e.target.dataset && e.target.dataset.ebind && editDraft && e.target.tagName === 'SELECT') {
    editDraft.exercises[+e.target.dataset.i][e.target.dataset.ebind] = e.target.value;
    return;
  }
  if (e.target.id === 'importfile' && e.target.files.length) {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const data = JSON.parse(fr.result);
        if (!data.program || !Array.isArray(data.sessions)) throw new Error('bad file');
        program = data.program; sessions = data.sessions; feedback = data.feedback || []; checkins = data.checkins || [];
        saveJSON(K.program, program); saveJSON(K.sessions, sessions); saveJSON(K.feedback, feedback); saveJSON(K.checkins, checkins);
        render();
        toast('Backup imported');
      } catch (err) { toast('Couldn’t read that file'); }
    };
    fr.readAsText(e.target.files[0]);
    e.target.value = '';
  }
});

// ---- boot -------------------------------------------------------------------
render();
