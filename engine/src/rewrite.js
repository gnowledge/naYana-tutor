/**
 * rewrite.js
 *
 * The core transformation: given a word, its grapheme→phoneme alignment,
 * and a list of active rules, produce the rewritten spelling.
 *
 * Each pair in `pairs` is `{ graphemes: 'ph', phonemes: ['F'] }` — a span
 * of one or more letters bound to one or more ARPAbet phonemes (stress
 * digit included, e.g. 'AE1'). A rule fires when both:
 *
 *   1. `pair.graphemes` equals `rule.from` (case-insensitive), AND
 *   2. `rule.phoneme` appears in `pair.phonemes` (after stripping the
 *      stress digit, so a rule targeting 'AE' matches 'AE1', 'AE0', etc.)
 *
 * Phase-1's "is the phoneme present anywhere?" heuristic is gone. With
 * positional alignment, words like `cycle` (`c}S y}AY1 c}K l}AH0|L e}_`)
 * resolve correctly: the first c becomes s, the second c becomes k, even
 * though both /s/ and /k/ are present.
 */

/**
 * Apply one rule to an aligned pair list.
 *
 * A rule's `phoneme` field selects which pairs match:
 *   - phoneme: "F" (or any ARPAbet symbol without a digit or +) — matches
 *     when that phoneme is present in pair.phonemes at any stress level.
 *     Stress digits are stripped before comparison ('AE' matches 'AE0',
 *     'AE1', 'AE2').
 *   - phoneme: "AH0" (ARPAbet with a stress digit) — exact match required,
 *     stress and all. Used to target schwa (AH0) without firing on the
 *     stressed /ʌ/ (AH1, AH2). Same pattern works for any vowel where
 *     stress matters.
 *   - phoneme: "AH+" (ARPAbet with trailing +) — matches that phoneme at
 *     any STRESSED level (digit 1-9), explicitly excluding the unstressed
 *     stress digit 0. Used to target /ʌ/ (stressed AH) without firing on
 *     schwa (AH0).
 *   - phoneme: null (or "") — epsilon rule: matches when pair.phonemes
 *     is empty. Used for silent letters (gh in 'night', silent h, etc.).
 *
 * `rule.to` is the replacement grapheme(s); an empty string deletes the
 * grapheme entirely.
 *
 * Returns { pairs, applied, count } — pairs is the (possibly modified)
 * pair list, applied is true if any pair changed, count is how many.
 * The pair list itself is never mutated; modified pairs are new objects.
 */
export function applyRuleToPairs(pairs, rule) {
  let applied = false;
  let count = 0;
  const isEpsilon = !rule.phoneme;
  const stressedOnly = !isEpsilon && /\+$/.test(rule.phoneme);
  const stressedBase = stressedOnly ? rule.phoneme.slice(0, -1) : null;
  const stressSpecific = !isEpsilon && !stressedOnly && /[0-9]$/.test(rule.phoneme);
  const newPairs = pairs.map((pair) => {
    if (pair.graphemes.toLowerCase() !== rule.from.toLowerCase()) return pair;
    if (isEpsilon) {
      if (pair.phonemes.length !== 0) return pair;
    } else if (stressSpecific) {
      if (!pair.phonemes.includes(rule.phoneme)) return pair;
    } else if (stressedOnly) {
      const hit = pair.phonemes.some((p) => {
        const m = p.match(/^([A-Z]+)([1-9])$/);
        return m && m[1] === stressedBase;
      });
      if (!hit) return pair;
    } else {
      const stripped = pair.phonemes.map((p) => p.replace(/[0-9]+$/, ''));
      if (!stripped.includes(rule.phoneme)) return pair;
    }
    applied = true;
    count++;
    return { ...pair, graphemes: rule.to };
  });
  return { pairs: newPairs, applied, count };
}

/**
 * Rewrite a single word. `pairs` is the alignment array for this word's
 * pronunciation, or null if the word is not in the dictionary or has no
 * alignment data — in either case the spelling passes through unchanged.
 *
 * The caller is responsible for handling unknown-word stats and for
 * picking which pronunciation's pairs to pass when the dictionary lists
 * alternates (first-wins is the default policy).
 *
 * Returns { spelling, rulesApplied, replacements }.
 */
export function rewriteWord(spelling, pairs, rules) {
  if (!/[a-zA-Z]/.test(spelling)) {
    return { spelling, rulesApplied: [], replacements: 0 };
  }
  if (!pairs) {
    return { spelling, rulesApplied: [], replacements: 0 };
  }

  let currentPairs = pairs;
  const rulesApplied = [];
  let totalReplacements = 0;

  for (const rule of rules) {
    const result = applyRuleToPairs(currentPairs, rule);
    if (result.applied) {
      currentPairs = result.pairs;
      rulesApplied.push(rule.name);
      totalReplacements += result.count;
    }
  }

  if (rulesApplied.length === 0) {
    return { spelling, rulesApplied: [], replacements: 0 };
  }

  const lowered = currentPairs.map((p) => p.graphemes).join('');
  const output = applyCaseFromOriginal(spelling, lowered);

  return { spelling: output, rulesApplied, replacements: totalReplacements };
}

// ---- Helpers ---------------------------------------------------------------

/**
 * Lift capitalization from the original word ONLY when it's an
 * abbreviation (multi-letter all-caps token). Everything else lowercases.
 *
 *   ALL CAPS (len ≥ 2)  → preserved   ("USA" → "USA", "NASA" → "NASA")
 *   Capitalized         → lowercased  ("Philosophy" → "filosofy", "The" → "ðə")
 *   lowercase           → lowercased  ("philosophy" → "filosofy")
 *   Single-letter caps  → lowercased  ("I" → "ai")
 *
 * Rationale: in a phonetic spelling reform, capital letters carry no
 * pronunciation information. Sentence-initial caps and proper-noun caps
 * are an English orthographic convention that Nayana lets go of. Only
 * all-caps abbreviations are kept, since their letter-by-letter caps
 * cue the reader to pronounce them as initialisms.
 */
function applyCaseFromOriginal(original, lowered) {
  if (original.length > 1 && original === original.toUpperCase() && /[A-Z]/.test(original)) {
    return lowered.toUpperCase();
  }
  return lowered;
}
