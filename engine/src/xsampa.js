/**
 * naYana spelling → X-SAMPA conversion.
 *
 * X-SAMPA is the ASCII-safe phonetic notation that espeak-ng accepts as
 * direct phoneme input via the [[…]] wrapper. This module is the single
 * source of truth for the conversion table — used by both the audio
 * acid-test (engine/scripts/validate-ipa-encoding.js) and the live
 * /api/tts endpoint.
 *
 * Add new mappings here when the engine starts emitting a new IPA
 * character.
 */

export const IPA_TO_XSAMPA = {
  // vowels
  'æ': '{',     'ɑ': 'A',     'ə': '@',     'ʌ': 'V',
  'ɛ': 'E',     'ɪ': 'I',     'ʊ': 'U',     'ɔ': 'O',
  'ɝ': '3`',    'ɚ': '@`',
  // consonants
  'ð': 'D',     'θ': 'T',     'ʃ': 'S',     'ʒ': 'Z',     'ŋ': 'N',
  // length marker
  'ː': ':',
};

export const LATIN_TO_XSAMPA = {
  'a': 'a', 'b': 'b', 'c': 'k',  // c only appears in liga (we map it to /k/ anyway)
  'd': 'd', 'e': 'e', 'f': 'f', 'g': 'g', 'h': 'h', 'i': 'i',
  'j': 'dZ',                      // j renders the dʒ ligature (so /dʒ/)
  'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n', 'o': 'o', 'p': 'p',
  'q': 'k', 'r': 'r', 's': 's', 't': 't', 'u': 'u', 'v': 'v',
  'w': 'w',
  'y': 'j',                       // y → /j/ per Nayana convention
  'z': 'z',
};

/**
 * Convert a Nayana spelling to an X-SAMPA phoneme string.
 * Iterates character-by-character, recognising the digraph ligatures
 * (tʃ, dʒ) and Latin diphthong pairs (ai, ei, ou, au, ɔɪ) so the
 * X-SAMPA reflects the single phoneme rather than two consecutive ones.
 */
export function nayanaToXsampa(spelling) {
  const out = [];
  let i = 0;
  while (i < spelling.length) {
    const c = spelling[i];
    const next = spelling[i + 1];
    // Two-char sequences first
    if (c === 't' && next === 'ʃ') { out.push('tS'); i += 2; continue; }
    if (c === 'd' && next === 'ʒ') { out.push('dZ'); i += 2; continue; }
    // Latin diphthong digraphs
    if (c === 'a' && next === 'i') { out.push('aI'); i += 2; continue; }
    if (c === 'e' && next === 'i') { out.push('eI'); i += 2; continue; }
    if (c === 'o' && next === 'u') { out.push('oU'); i += 2; continue; }
    if (c === 'a' && next === 'u') { out.push('aU'); i += 2; continue; }
    if (c === 'ɔ' && next === 'ɪ') { out.push('OI'); i += 2; continue; }
    // y+u(:)? for the engine's yuː convention → /juː/
    if (c === 'y' && next === 'u') { out.push('ju'); i += 2; continue; }
    // Single chars
    if (IPA_TO_XSAMPA[c] !== undefined) { out.push(IPA_TO_XSAMPA[c]); i++; continue; }
    if (LATIN_TO_XSAMPA[c] !== undefined) { out.push(LATIN_TO_XSAMPA[c]); i++; continue; }
    // Anything else (punctuation, unknown) — drop silently
    i++;
  }
  return out.join('');
}

/**
 * Heuristic: does this token look like phonetic text (contains any IPA
 * codepoint or the Nayana-specific length marker), or is it plain
 * English (a verbatim segment, an unknown word, a proper noun)?
 *
 * Used by /api/tts to decide whether to wrap a token in [[…]] (force
 * espeak-ng to treat it as phonemes) or pass it through as English
 * (let espeak-ng's letter-to-sound rules handle it).
 */
export function isPhonetic(token) {
  for (const c of token) {
    if (IPA_TO_XSAMPA[c] !== undefined) return true;
  }
  return false;
}

/**
 * Convert a full text (one or more space-separated tokens) into an
 * espeak-ng input string. Phonetic tokens get wrapped in [[…]];
 * plain-English tokens are passed through literally so espeak-ng's
 * letter-to-sound rules apply (this is the right call for verbatim
 * `[[Nehru]]`-style segments).
 */
export function naYanaTextToEspeakInput(text) {
  // Split on whitespace, preserving structure.
  return text
    .split(/(\s+)/)
    .map((tok) => {
      if (!tok.trim()) return tok;
      if (isPhonetic(tok)) {
        // Strip leading/trailing punctuation so it doesn't end up inside [[…]]
        const m = tok.match(/^([^A-Za-zæɑəʌɛɪʊɔɝɚðθʃʒŋː]*)(.*?)([^A-Za-zæɑəʌɛɪʊɔɝɚðθʃʒŋː]*)$/u);
        if (!m) return `[[${nayanaToXsampa(tok)}]]`;
        const [, lead, core, trail] = m;
        return lead + (core ? `[[${nayanaToXsampa(core)}]]` : '') + trail;
      }
      return tok;
    })
    .join('');
}
