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

/** Play a single utterance. Cancels any audio currently playing. */
export async function play(text, btn) {
  if (!text) return;

  // Stop anything currently playing
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (currentBtn) {
    currentBtn.classList.remove('tts-playing');
    currentBtn = null;
  }
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
      playableText = displayText;
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
