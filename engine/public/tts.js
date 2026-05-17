/**
 * tts.js — click-to-play audio for naYana / IPA text.
 *
 * Usage:
 *   import { play, attachPlayButtons } from './tts.js';
 *   play('hələʊ');                                    // play once
 *   attachPlayButtons(root, '.compare-table .nay');   // decorate matches
 */

let currentAudio = null;
let currentBtn   = null;
let currentSynth = null; // SpeechSynthesisUtterance in progress (Web Speech API)

/** Cancel any audio or synthesis currently playing (either engine). */
function cancelAll() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (currentSynth) {
    // speechSynthesis.cancel() also fires 'end' on the utterance which
    // would race our state cleanup; clear the handle first.
    currentSynth = null;
    try { speechSynthesis.cancel(); } catch (_) { /* not supported */ }
  }
  if (currentBtn) {
    currentBtn.classList.remove('tts-playing');
    currentBtn = null;
  }
}

/** Play a single utterance via the Piper /api/tts pipeline. Cancels any audio currently playing. */
export async function play(text, btn) {
  if (!text) return;

  cancelAll();
  if (btn) {
    btn.classList.add('tts-playing');
    currentBtn = btn;
  }

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error('tts failed: ' + res.status);
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;
    audio.addEventListener('ended', () => {
      URL.revokeObjectURL(url);
      if (currentBtn === btn) {
        btn?.classList.remove('tts-playing');
        currentBtn = null;
      }
    });
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      btn?.classList.remove('tts-playing');
    });
    await audio.play();
  } catch (e) {
    console.error('tts error', e);
    if (btn) btn.classList.remove('tts-playing');
  }
}

/**
 * Play `text` via the browser's Web Speech API at a slowed rate, firing
 * `onWord(index)` as each word boundary is crossed. Used by /read's
 * "Follow along" mode for synchronised word-by-word highlighting.
 *
 * Browser voices take English text (not IPA), so feed the English
 * version of the passage and use the word-index to highlight the
 * matching naYana word in parallel.
 *
 *   playFollowAlong("Reading is the most...", {
 *     rate: 0.7,
 *     onWord: (idx) => highlightNthWord(idx),
 *     onEnd:  () => clearHighlights(),
 *   });
 *
 * Returns true if synthesis started, false if the browser doesn't
 * support speechSynthesis (caller can fall back to /api/tts).
 */
export function playFollowAlong(text, opts = {}, btn) {
  if (!text || typeof speechSynthesis === 'undefined') {
    if (opts.onError) opts.onError('no-synth');
    return false;
  }

  // Linux Chromium frequently has zero installed speech voices. Detect
  // this upfront so the user gets an explanation rather than silent
  // failure. (Voices load asynchronously the first time you query, so
  // a non-empty list usually means we're good; an empty list usually
  // means the OS has no speech engine configured.)
  const voices = speechSynthesis.getVoices();
  if (voices.length === 0) {
    if (opts.onError) opts.onError('no-voices');
    return false;
  }

  cancelAll();
  if (btn) {
    btn.classList.add('tts-playing');
    currentBtn = btn;
  }

  const u = new SpeechSynthesisUtterance(text);
  u.rate = opts.rate ?? 0.75;
  if (opts.voice) u.voice = opts.voice;

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  let wordIdx = 0;
  let boundaryFired = false;
  let fallbackTimer = null;

  // Path A: native boundary events. Chrome/Edge fire these per word.
  u.addEventListener('boundary', (e) => {
    if (currentSynth !== u) return; // cancelled
    if (e.name && e.name !== 'word') return;
    boundaryFired = true;
    if (fallbackTimer) { clearInterval(fallbackTimer); fallbackTimer = null; }
    if (opts.onWord) opts.onWord(wordIdx);
    wordIdx++;
  });

  // Path B: timer-based fallback. Firefox fires boundary only at
  // sentence ends (Mozilla bug 1426310), so per-word highlighting
  // is impossible there via boundary events. Start a uniform-pace
  // timer when speech begins; cancel it if real boundary events
  // arrive.
  //
  // Pacing is deliberately biased toward "ahead of speech" rather
  // than "behind speech" — the eye should reach the next word
  // before the ear hears it (matches how natural reading works).
  // Firefox also frequently ignores the `rate` parameter and speaks
  // at its voice's default speed regardless, so we don't scale by
  // rate for slow values (just assume default ≈ 280 ms/word) — we
  // only speed the timer up when the caller asks for explicit faster
  // playback (rate > 1.0).
  u.addEventListener('start', () => {
    if (currentSynth !== u) return;
    const baseMs = 280;
    const r = opts.rate ?? 0.75;
    const msPerWord = r > 1 ? baseMs / r : baseMs;
    fallbackTimer = setInterval(() => {
      if (currentSynth !== u) {
        clearInterval(fallbackTimer); fallbackTimer = null; return;
      }
      // Real boundary events arrived after the timer started — yield
      if (boundaryFired) {
        clearInterval(fallbackTimer); fallbackTimer = null; return;
      }
      if (wordIdx >= wordCount) {
        clearInterval(fallbackTimer); fallbackTimer = null; return;
      }
      if (opts.onWord) opts.onWord(wordIdx);
      wordIdx++;
    }, msPerWord);
  });

  const finish = () => {
    if (currentSynth !== u) return;
    if (fallbackTimer) { clearInterval(fallbackTimer); fallbackTimer = null; }
    if (opts.onEnd) opts.onEnd();
    currentSynth = null;
    if (currentBtn === btn) {
      btn?.classList.remove('tts-playing');
      currentBtn = null;
    }
  };
  u.addEventListener('end', finish);
  u.addEventListener('error', finish);

  currentSynth = u;
  speechSynthesis.speak(u);
  return true;
}

/**
 * Decorate every element inside `container` matching `selector` with a
 * small inline 🔊 play button. Button text comes from each element's
 * textContent at the moment of attachment (so subsequent edits to the
 * element don't drift).
 *
 * Optional `getPlayableText(el) => string | null` chooses what to play
 * for each element:
 *   - return a string  → play that string (e.g. a sibling cell's
 *                        English so Piper gives a natural voice)
 *   - return null/''   → skip — no button attached for this element
 *   - omit the callback → fall back to the element's own textContent
 */
export function attachPlayButtons(container, selector, getPlayableText) {
  for (const el of container.querySelectorAll(selector)) {
    if (el.dataset.ttsAttached) continue;
    const displayText = el.textContent.trim();
    let playableText;
    if (getPlayableText) {
      // Explicit skip: callback chose not to attach a button here.
      playableText = getPlayableText(el);
      if (!playableText) continue;
    } else {
      // No callback — data-audio override wins if present (lets pages
      // pin Piper-friendly English to an IPA-only display element),
      // otherwise use the element's own text.
      playableText = el.dataset.audio || displayText;
    }
    if (!playableText) continue;
    el.dataset.ttsAttached = '1';
    const btn = document.createElement('button');
    btn.className = 'tts-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', `Listen: ${displayText}`);
    btn.title = `Listen`;
    btn.textContent = '🔊';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      play(playableText, btn);
    });
    el.appendChild(btn);
  }
}
