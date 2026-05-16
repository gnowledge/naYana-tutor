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
 * Optional `getPlayableText(el) => string` chooses what to play for
 * each element. Default: the element's textContent. Use this to prefer
 * a sibling cell's English text (so Piper gives a natural voice) over
 * the IPA text shown.
 */
export function attachPlayButtons(container, selector, getPlayableText) {
  for (const el of container.querySelectorAll(selector)) {
    if (el.dataset.ttsAttached) continue;
    const displayText  = el.textContent.trim();
    const playableText = (getPlayableText && getPlayableText(el)) || displayText;
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
