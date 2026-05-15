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

// Order matters: longer patterns checked first so "@r" wins over "@".
export const IPA_SUBSTITUTIONS = [
  // r-coloured + length (3-char patterns)
  ['@r', 'ɚ',  'unstressed r-coloured schwa'],
  ['3:', 'ɝ',  'stressed r-coloured schwa'],

  // consonant digraphs (2-char)
  ['th', 'θ',  'voiceless th (think)'],
  ['dh', 'ð',  'voiced th (this)'],
  ['sh', 'ʃ',  'sh (ship)'],
  ['zh', 'ʒ',  'zh (vision)'],
  ['ng', 'ŋ',  'ng (sing)'],
  ['ch', 'tʃ', 'ch (chip) — renders as ligature'],
  ['jh', 'dʒ', 'j (judge) — renders as ligature; "j" alone stays /j/'],

  // vowel digraphs
  ['ae', 'æ',  'short a (cat)'],
  ['i:', 'iː', 'long i (meet)'],
  ['u:', 'uː', 'long u (food)'],
  ['o:', 'ɔː', 'long open o (call)'],
  ['a:', 'ɑː', 'long open a (hot)'],

  // single chars (X-SAMPA convention: caps for short vowels, special chars for schwa/wedge)
  ['@',  'ə',  'schwa (about)'],
  ['^',  'ʌ',  'wedge (cup)'],
  ['I',  'ɪ',  'short i (bit)'],
  ['U',  'ʊ',  'short oo (book)'],
  ['E',  'ɛ',  'short e (bed)'],
  ['O',  'ɔ',  'open o'],
  ['A',  'ɑ',  'open a'],
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
