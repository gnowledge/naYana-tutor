/**
 * app.js — test harness client-side logic.
 *
 * Talks to the Node server's /api endpoints. The eventual extension will
 * do all this work client-side without a server.
 */

const $ = (sel) => document.querySelector(sel);

// State
let state = {
  phase: 1,
  maxPhase: 1,
  phases: [],
  // The demoText string most recently loaded into the textarea. Used to
  // tell whether the user has typed their own input — if so, we don't
  // clobber it when they move the phase slider.
  lastDemoText: '',
};

// Word preferences: lowercased word → preferred pronunciation index.
// Persisted to localStorage so the user's choices survive page reloads
// and (later) the browser extension can use the same model.
const PREFS_KEY = 'nayanaPrefs';
let prefs = {};

function loadPrefs() {
  try {
    prefs = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
  } catch {
    prefs = {};
  }
  updatePrefsBadge();
}

function savePrefs() {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  updatePrefsBadge();
}

function updatePrefsBadge() {
  const n = Object.keys(prefs).length;
  const badge = $('#prefs-count');
  if (badge) badge.textContent = n;
}

// Highest phase the reader has ever transformed at. A small persistent
// signal of progression — like a graduation badge. Only ever increases.
const PHASE_REACHED_KEY = 'nayanaPhaseReached';
let phaseReached = 0;

function loadPhaseReached() {
  const raw = parseInt(localStorage.getItem(PHASE_REACHED_KEY), 10);
  phaseReached = Number.isInteger(raw) && raw > 0 ? raw : 0;
  renderPhaseReached();
}

function bumpPhaseReachedIfNew() {
  if (state.phase > phaseReached) {
    phaseReached = state.phase;
    localStorage.setItem(PHASE_REACHED_KEY, String(phaseReached));
    renderPhaseReached(true);
  }
}

function renderPhaseReached(animate = false) {
  const el = $('#phase-reached-badge');
  if (!el) return;
  el.textContent = phaseReached === 0
    ? '★ phase 0'
    : `★ phase ${phaseReached}`;
  el.dataset.level = String(phaseReached);
  if (animate) {
    el.classList.remove('bump');
    void el.offsetWidth;  // force reflow so the animation restarts
    el.classList.add('bump');
  }
}

// ---- Phase metadata loading ------------------------------------------------

async function loadPhases() {
  const resp = await fetch('/api/phases');
  const data = await resp.json();
  state.phases = data.phases;
  state.maxPhase = data.maxPhase;
  // Update slider range
  const slider = $('#phase-slider');
  slider.min = 0;
  slider.max = state.maxPhase;
  slider.value = state.phase;
  updatePhaseDisplay();
}

function getPhase(num) {
  return state.phases.find((p) => p.number === num);
}

// Replace textarea content with the current phase's demo text — but only
// if the textarea is empty OR still shows the previously-loaded demo.
// If the user has typed their own text, leave it alone.
function maybeLoadDemoText() {
  const phase = getPhase(state.phase);
  if (!phase || !phase.demoText) return;
  const demo = phase.demoText.trimEnd();
  const ta = $('#input-text');
  if (ta.value === '' || ta.value === state.lastDemoText) {
    ta.value = demo;
    state.lastDemoText = demo;
  }
}

function updatePhaseDisplay() {
  const num = state.phase;
  $('#phase-value').textContent = num;
  const phase = getPhase(num);
  $('#phase-name').textContent = num === 0
    ? 'no rules'
    : phase
      ? phase.name
      : `phase ${num}`;

  // Description card
  const desc = $('#phase-description');
  if (num === 0 || !phase) {
    desc.innerHTML = '<p>Phase 0: original English spelling, no substitutions applied.</p>';
    return;
  }

  // Find the underlying rules to show examples
  let examplesHtml = '';
  if (phase.rules && phase.rules.length) {
    const examples = [];
    for (const rule of phase.rules) {
      if (rule.examples) examples.push(...rule.examples);
    }
    if (examples.length) {
      examplesHtml = '<div class="examples">' +
        examples.slice(0, 6).map((ex) =>
          `<span class="example"><span class="before">${ex.before}</span>` +
          `<span class="arrow">→</span>` +
          `<span class="after">${ex.after}</span></span>`
        ).join('') +
        '</div>';
    }
  }

  desc.innerHTML = `
    <h3>Phase ${num}: ${escapeHtml(phase.name)}</h3>
    <p>${escapeHtml(phase.description || '')}</p>
    ${examplesHtml}
  `;
}

// ---- Process actions -------------------------------------------------------

async function processText() {
  const text = $('#input-text').value;
  if (!text.trim()) return;
  const resp = await fetch('/api/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, phase: state.phase, prefs }),
  });
  const data = await resp.json();
  showOutput(data);
}

async function processUrl() {
  const url = $('#input-url').value.trim();
  if (!url) return;
  $('#output').innerHTML = '<p class="placeholder">Fetching...</p>';
  try {
    const resp = await fetch('/api/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, phase: state.phase, prefs }),
    });
    const data = await resp.json();
    if (data.error) {
      $('#output').innerHTML = `<p class="placeholder">Error: ${escapeHtml(data.error)}</p>`;
      return;
    }
    showOutput(data);
  } catch (err) {
    $('#output').innerHTML = `<p class="placeholder">Error: ${escapeHtml(err.message)}</p>`;
  }
}

function reprocessActive() {
  const activeTab = document.querySelector('.tab.active').dataset.tab;
  if (activeTab === 'text') processText();
  // URL tab requires explicit re-fetch — the URL input may have been edited.
}

function showOutput(data) {
  $('#output').innerHTML = data.html;
  const { wordsTotal, wordsChanged, unknownWords } = data.stats;
  $('#stats').textContent = `${wordsChanged} of ${wordsTotal} words changed · ` +
    `${unknownWords.length} unknown · ` +
    `rules: ${data.rulesActive.join(', ') || 'none'}`;
  attachAlternateHandlers();
  bumpPhaseReachedIfNew();
}

// ---- Alternate-pronunciation popover --------------------------------------

let openPopover = null;

function attachAlternateHandlers() {
  for (const span of document.querySelectorAll('.nayana-has-alternates')) {
    span.addEventListener('click', (e) => {
      e.stopPropagation();
      openAltPopover(span);
    });
  }
}

function openAltPopover(span) {
  closeAltPopover();

  const original = span.dataset.original;
  const wordKey = original.toLowerCase();
  const currentIdx = parseInt(span.dataset.pronIndex, 10);
  let alternates = [];
  try { alternates = JSON.parse(span.dataset.alternates || '[]'); } catch {}

  // Build the option list: current spelling + alternates, in pronIndex order.
  const opts = [
    { spelling: span.textContent, pronIndex: currentIdx, current: true },
    ...alternates.map((a) => ({ spelling: a.spelling, pronIndex: a.pronIndex })),
  ].sort((a, b) => a.pronIndex - b.pronIndex);

  const pop = document.createElement('div');
  pop.className = 'nayana-popover';
  pop.innerHTML =
    `<div class="popover-title">${escapeHtml(original)}</div>` +
    opts.map((o) => `
      <button class="popover-option ${o.current ? 'is-current' : ''}" data-pron-index="${o.pronIndex}">
        <span class="popover-mark">${o.current ? '●' : '○'}</span>
        <span class="popover-spelling">${escapeHtml(o.spelling)}</span>
      </button>
    `).join('') +
    `<div class="popover-hint">Pick the pronunciation Nayana should use for this word.</div>`;

  document.body.appendChild(pop);

  // Position below the span (or above if not enough room below).
  const rect = span.getBoundingClientRect();
  pop.style.left = `${Math.max(8, rect.left)}px`;
  const popRect = pop.getBoundingClientRect();
  const fitsBelow = rect.bottom + popRect.height + 8 < window.innerHeight;
  pop.style.top = fitsBelow
    ? `${rect.bottom + 6}px`
    : `${rect.top - popRect.height - 6}px`;

  for (const btn of pop.querySelectorAll('.popover-option')) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const pronIdx = parseInt(btn.dataset.pronIndex, 10);
      if (pronIdx === currentIdx) {
        closeAltPopover();
        return;
      }
      // Pron 0 is the default; no need to store it. Storing only non-default
      // prefs keeps localStorage tidy and the prefs-count meaningful.
      if (pronIdx === 0) delete prefs[wordKey];
      else prefs[wordKey] = pronIdx;
      savePrefs();
      closeAltPopover();
      reprocessActive();
    });
  }

  openPopover = pop;
}

function closeAltPopover() {
  if (openPopover) {
    openPopover.remove();
    openPopover = null;
  }
}

// One-time global handlers for closing the popover.
document.addEventListener('click', (e) => {
  if (openPopover && !openPopover.contains(e.target) && !e.target.closest('.nayana-has-alternates')) {
    closeAltPopover();
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeAltPopover();
});

function resetPrefs() {
  const n = Object.keys(prefs).length;
  if (n === 0) return;
  if (!confirm(`Clear all ${n} word preference(s)?`)) return;
  prefs = {};
  savePrefs();
  reprocessActive();
}

// ---- Tab switching ---------------------------------------------------------

function setupTabs() {
  for (const tab of document.querySelectorAll('.tab')) {
    tab.addEventListener('click', () => {
      const name = tab.dataset.tab;
      for (const t of document.querySelectorAll('.tab')) {
        t.classList.toggle('active', t === tab);
      }
      for (const p of document.querySelectorAll('.tab-panel')) {
        p.classList.toggle('hidden', p.id !== `tab-${name}`);
      }
    });
  }
}

// ---- Event wiring ----------------------------------------------------------

function setupEvents() {
  $('#phase-slider').addEventListener('input', (e) => {
    state.phase = parseInt(e.target.value, 10);
    updatePhaseDisplay();
    maybeLoadDemoText();
    // Reprocess if there's output already
    if (!$('#output').querySelector('.placeholder')) {
      const activeTab = document.querySelector('.tab.active').dataset.tab;
      if (activeTab === 'text') processText();
      // URL tab requires explicit re-fetch
    }
  });

  $('#vowel-toggle').addEventListener('change', (e) => {
    document.body.classList.toggle('no-vowel-marker', !e.target.checked);
  });

  $('#process-text-btn').addEventListener('click', processText);
  $('#process-url-btn').addEventListener('click', processUrl);
  $('#prefs-button').addEventListener('click', resetPrefs);

  // Cmd/Ctrl-Enter in textarea to process
  $('#input-text').addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      processText();
    }
  });
}

// ---- Utilities -------------------------------------------------------------

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ---- Init ------------------------------------------------------------------

(async function init() {
  loadPrefs();
  loadPhaseReached();
  // Mark whatever is currently in the textarea (the HTML default) as
  // the "last demo" — if the API returns the same text for phase 1,
  // there's no visible change; if it's different, the JS demo wins.
  state.lastDemoText = $('#input-text').value;
  setupTabs();
  setupEvents();
  await loadPhases();
  maybeLoadDemoText();
})();
