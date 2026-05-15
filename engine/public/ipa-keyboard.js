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
// Three-way split for the "a" family:
//   a → ə (schwa, most frequent vowel; default unshifted shortcut)
//   q → a (literal Latin a; q is free because engine rewrites qu → kw)
//   A → ɑ (IPA open back unrounded vowel)
//
// Consequence: diphthongs and ash type via the q route to keep schwa+vowel
// sequences typeable literally. Type `qi` for /aɪ/, `qu` for /aʊ/, `qe` for æ.
// Type `ai` (slow a-then-i) and you get literal "əi" — schwa followed by i.
//
// Length marker: `H` (capital) marks long vowels — `:` stays free as
// punctuation. Long-vowel digraphs: iH, uH, OH, AH.
export const IPA_SUBSTITUTIONS = [
  // ---- 2-char patterns ----
  // Rhotic schwa is single codepoint, so we always prefer ɚ over literal ər.
  // (For literal Latin a+r, type `qr` → "ar".)
  ['ər', 'ɚ',   'rhotic schwa — fires after a→ə when r is typed'],
  ['@r', 'ɚ',   'rhotic schwa — direct typing (X-SAMPA muscle memory)'],

  // (affricate ligatures collapsed to single-letter shortcuts below —
  // see "c" and "j" in the 1-char section)

  // ash digraph — fires when "ae" appears at cursor in one event
  // (paste, or after typing `qe` which produces "a" then "ae")
  ['ae', 'æ',   'ash — composed; same outcome as qe (q→a then e)'],

  // length-marked vowels (use H, the new length marker)
  ['iH', 'iː',  'long i (meet)'],
  ['uH', 'uː',  'long u (food)'],
  ['OH', 'ɔː',  'long open o (call)'],
  ['AH', 'ɑː',  'long open a (hot)'],

  // ---- 1-char patterns: capital letters → IPA characters ----
  // Consonants (capital matches the lowercase initial of the English digraph
  // it replaces — T for θ ("th"in), D for ð ("d"his), etc.)
  ['T',  'θ',   'voiceless th (think)'],
  ['D',  'ð',   'voiced th (this)'],
  ['S',  'ʃ',   'sh (ship)'],
  ['Z',  'ʒ',   'zh (vision)'],
  ['N',  'ŋ',   'ng (sing)'],
  ['R',  'ɝ',   'stressed r-coloured schwa'],
  ['H',  'ː',   'length marker — frees `:` for punctuation'],

  // Short vowels (capital matches the IPA letter's lowercase visual)
  ['I',  'ɪ',   'short i (bit)'],
  ['U',  'ʊ',   'short oo (book)'],
  ['E',  'ɛ',   'short e (bed)'],
  ['O',  'ɔ',   'open o'],
  ['A',  'ɑ',   'open a'],

  // Affricate single-letter shortcuts. Lowercase c and j are free keys
  // in Nayana — neither appears standalone in engine output (c only via
  // tʃ ligature, j only via dʒ ligature). So they can directly produce
  // the two-codepoint affricate sequences, which the font's `liga` GSUB
  // then renders as the c-shape and dotless-j ligature glyphs.
  ['c',  'tʃ',  'voiceless affricate — renders as Nayana c via liga'],
  ['j',  'dʒ',  'voiced affricate — renders as Nayana j via liga (y types /j/)'],

  // Special-character shortcuts
  ['a',  'ə',   'schwa — most frequent vowel; default lowercase shortcut'],
  ['q',  'a',   'literal Latin a — for diphthongs (qi=ai, qu=au, qe=æ) and Latin ar (qr)'],
  ['@',  'ə',   'schwa — X-SAMPA convention (alternate)'],
  ['^',  'ʌ',   'wedge (cup)'],
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
