// ── Lift Log: app logic ────────────────────────────────────────────────
'use strict';

const K = {
  program: 'll_program',
  sessions: 'll_sessions',
  draft: 'll_draft',
  feedback: 'll_feedback',
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

let view = { name: 'today' };   // today | workout | history | guide | feedback | edit
let editDraft = null;           // working copy while editing a workout

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
    '</header>';

  h += '<div class="card hintcard">🎯 <b>' + esc(progressionFor(draft.week).label) + ':</b> ' + esc(hint) + '</div>';

  if (w.warmup) {
    const wu = ROUTINES.find(r => r.id === 'warmup');
    h += '<details class="card warmup"><summary>🔥 ' + esc(wu.name) + ' — non-negotiable</summary><ul>' +
      wu.items.map(i => '<li>' + esc(i) + '</li>').join('') + '</ul></details>';
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

  h += '<div class="kicker pad">Routines</div>';
  ROUTINES.forEach(r => {
    h += '<details class="card routine"><summary><b>' + esc(r.name) + '</b><span class="sub"> · ' + esc(r.when) + '</span></summary><ul class="checks">' +
      r.items.map((it, i) => '<li><label><input type="checkbox"> <span>' + esc(it) + '</span></label></li>').join('') +
      '</ul></details>';
  });

  h += '<section class="card hintcard">🦶 ' + esc(WALKING_CUE) + '</section>';
  h += '<div class="finishrow"><button class="btn ghost" data-act="restoredefaults">Restore default program</button></div>';
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
    const s = draft.entries[el.dataset.ex].sets[+el.dataset.i];
    s.done = !s.done;
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
    view = { name: 'history' };
    render();
    toast('Session saved 💪');
  },
  discard()  {
    if (!confirm('Discard this session? Logged sets will be lost.')) return;
    draft = null; saveDraft();
    view = { name: 'today' };
    render();
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
    const blob = new Blob([JSON.stringify({ program, sessions, feedback }, null, 2)], { type: 'application/json' });
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
      id: newId(), name: 'New exercise', sets: 3, reps: '10', art: 'bar',
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
  } else if (el.dataset.ebind && editDraft) {
    const ex = editDraft.exercises[+el.dataset.i];
    const f = el.dataset.ebind;
    ex[f] = f === 'sets' ? Math.max(1, parseInt(el.value, 10) || 1) : el.value;
  }
});

document.addEventListener('change', e => {
  if (e.target.id === 'importfile' && e.target.files.length) {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const data = JSON.parse(fr.result);
        if (!data.program || !Array.isArray(data.sessions)) throw new Error('bad file');
        program = data.program; sessions = data.sessions; feedback = data.feedback || [];
        saveJSON(K.program, program); saveJSON(K.sessions, sessions); saveJSON(K.feedback, feedback);
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
