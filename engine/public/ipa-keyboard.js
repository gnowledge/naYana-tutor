/**
 * ipa-keyboard.js — substitute typed digraphs into IPA codepoints, in place.
 *
 * Attach to any <textarea> or <input>:
 *
 *   import { attachIpaKeyboard } from './ipa-keyboard.js';
 *   attachIpaKeyboard(document.getElementById('my-input'));
 *
 * The substitution map mirrors the X-SAMPA convention where reasonable
 * (so users with phonetics background recognise it), with English-spelling
 * shortcuts where X-SAMPA isn't friendly.
 */

// Map design — IPA is caseless, so the Shift-key-pressed slots (which would
// otherwise duplicate lowercase letters) carry the IPA character that's
// "thematically related" to that letter. T → θ, D → ð, S → ʃ, etc.
// Lowercase letters keep their Latin meaning so users can still spell
// digraphs like ai, ei, ou, au (the Nayana diphthongs).
//
// Order matters: longer patterns checked first so "ər" wins over "ə".
//
// Schwa note: typing `q` and typing `@` both produce ə. `q` is the
// no-modifier shortcut (q is unused in Nayana output, so no conflict),
// `@` is kept for X-SAMPA muscle memory. Either way, typing an `r` after
// triggers the follow-up substitution `ər` → ɚ.
export const IPA_SUBSTITUTIONS = [
  // ---- 2-char patterns (multi-codepoint outputs or compositions) ----
  ['ər', 'ɚ',   'rhotic schwa — fires after q→ə or @→ə when r is typed next'],
  ['@r', 'ɚ',   'rhotic schwa — direct typing'],
  ['ch', 'tʃ',  'voiceless affricate — renders as Nayana c via liga'],
  ['jh', 'dʒ',  'voiced affricate — renders as Nayana j via liga (bare j stays /j/)'],
  ['ae', 'æ',   'ash — A is taken for ɑ'],
  ['i:', 'iː',  'long i (meet)'],
  ['u:', 'uː',  'long u (food)'],
  ['o:', 'ɔː',  'long open o (call)'],
  ['a:', 'ɑː',  'long open a (hot)'],

  // ---- 1-char patterns: capital letters → IPA characters ----
  // Consonants (capital matches the lowercase initial of the English digraph
  // it replaces — T for θ ("th"in), D for ð ("d"his), etc.)
  ['T',  'θ',   'voiceless th (think)'],
  ['D',  'ð',   'voiced th (this)'],
  ['S',  'ʃ',   'sh (ship)'],
  ['Z',  'ʒ',   'zh (vision)'],
  ['N',  'ŋ',   'ng (sing)'],
  ['R',  'ɝ',   'stressed r-coloured schwa'],

  // Short vowels (capital matches the IPA letter's lowercase visual)
  ['I',  'ɪ',   'short i (bit)'],
  ['U',  'ʊ',   'short oo (book)'],
  ['E',  'ɛ',   'short e (bed)'],
  ['O',  'ɔ',   'open o'],
  ['A',  'ɑ',   'open a'],

  // Special-character shortcuts
  ['q',  'ə',   'schwa — single keystroke, no modifier (q is unused in Nayana)'],
  ['@',  'ə',   'schwa — X-SAMPA convention (alternate)'],
  ['^',  'ʌ',   'wedge (cup)'],
  [':',  'ː',   'length marker — also fires inside vowel digraphs i:, u:, etc.'],
];

const MAX_PATTERN_LEN = Math.max(...IPA_SUBSTITUTIONS.map(([s]) => s.length));

/**
 * Try to apply a substitution at the cursor. Returns true if one fired.
 */
function trySubstitute(el) {
  const pos = el.selectionStart;
  if (pos === null || pos !== el.selectionEnd) return false;  // skip if selection
  const text = el.value;
  // Check longest patterns first (already sorted)
  for (const [src, dst] of IPA_SUBSTITUTIONS) {
    const start = pos - src.length;
    if (start < 0) continue;
    if (text.substring(start, pos) !== src) continue;
    // Match — replace
    el.value = text.substring(0, start) + dst + text.substring(pos);
    const newPos = start + dst.length;
    el.selectionStart = el.selectionEnd = newPos;
    el.dispatchEvent(new Event('input', { bubbles: true }));  // notify listeners
    return true;
  }
  return false;
}

/**
 * Attach the IPA-input layer to a textarea/input element.
 * Substitution fires on every input event after a typed character.
 */
export function attachIpaKeyboard(el) {
  if (!el || el.dataset.ipaKeyboard === 'on') return;
  el.dataset.ipaKeyboard = 'on';

  // We hook into 'input' but guard against re-firing from our own value-set
  // by tagging the element while we substitute.
  el.addEventListener('input', (ev) => {
    if (el.dataset.ipaSubstituting === '1') return;
    // Only act on insertion (typing/paste), not deletion
    if (ev.inputType && ev.inputType.startsWith('delete')) return;
    el.dataset.ipaSubstituting = '1';
    try { trySubstitute(el); }
    finally { el.dataset.ipaSubstituting = '0'; }
  });
}
