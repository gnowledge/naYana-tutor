/**
 * Phase 10 acid tests — schwa /ə/.
 *
 * The landmark phase: the most common vowel in English finally gets its
 * own grapheme (U+0259). Five rules unify all five vowel letters under
 * one IPA codepoint, but ONLY when the alignment marks the phoneme as
 * AH0 (unstressed AH = schwa). Stressed /ʌ/ (AH1, AH2 — cup, run, sun)
 * stays as written.
 *
 * Also tests the engine extension: stress-specific phoneme matching.
 * A rule with `phoneme: "AH0"` matches AH0 exactly, not stress-stripped
 * "AH" (which would also catch AH1/AH2).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadDictionary } from '../src/dictionary.js';
import { rewriteWord, applyRuleToPairs } from '../src/rewrite.js';
import { loadCatalogue, rulesForPhase } from '../src/catalogue.js';

const dict = loadDictionary();
const catalogue = loadCatalogue();
const phase10Rules = rulesForPhase(catalogue, 10);

function rewrite(word) {
  const entry = dict.lookup(word);
  const pairs = entry?.pairs ?? null;
  return rewriteWord(word, pairs, phase10Rules);
}

test('phase 10 catalogue extends through five schwa rules', () => {
  const names = phase10Rules.map((r) => r.name);
  assert.ok(names.includes('a→ə (when /ə/)'));
  assert.ok(names.includes('e→ə (when /ə/)'));
  assert.ok(names.includes('i→ə (when /ə/)'));
  assert.ok(names.includes('o→ə (when /ə/)'));
  assert.ok(names.includes('u→ə (when /ə/)'));
  assert.equal(phase10Rules.length, 40, 'rule count = 35 prior + 5 new');
});

// ---- Engine extension: stress-specific phoneme matching -------------------

test('applyRuleToPairs: stress-specific rule fires on AH0 only', () => {
  const pair = { graphemes: 'a', phonemes: ['AH0'] };
  const rule = { from: 'a', to: 'ə', phoneme: 'AH0' };
  const { applied } = applyRuleToPairs([pair], rule);
  assert.equal(applied, true);
});

test('applyRuleToPairs: stress-specific rule does NOT fire on AH1', () => {
  const pair = { graphemes: 'u', phonemes: ['AH1'] };
  const rule = { from: 'u', to: 'ə', phoneme: 'AH0' };
  const { applied } = applyRuleToPairs([pair], rule);
  assert.equal(applied, false);
});

test('applyRuleToPairs: stress-AGNOSTIC rule (no digit) still fires on AH0 and AH1', () => {
  const pair0 = { graphemes: 'u', phonemes: ['AH0'] };
  const pair1 = { graphemes: 'u', phonemes: ['AH1'] };
  const rule = { from: 'u', to: 'X', phoneme: 'AH' };  // no digit
  assert.equal(applyRuleToPairs([pair0], rule).applied, true);
  assert.equal(applyRuleToPairs([pair1], rule).applied, true);
});

// ---- a → ə (when /ə/) ----------------------------------------------------

test('about → əbaut', () => {
  assert.equal(rewrite('about').spelling, 'əbaut');
});

test('around stays araund — ar aligns as one grapheme to /ER/', () => {
  // alignment: ar}ER0 ou}AW1 n}N d}D — the "ar" is treated as a digraph.
  // Phase 10's a→ə rule requires graphemes 'a' alone, so it doesn't fire.
  // Phase 7's ou→au fires on the second pair. Result: araund.
  // R-colored vowels would be a future phase.
  assert.equal(rewrite('around').spelling, 'araund');
});

test('sofa → soufə (o→ou AND a→ə)', () => {
  assert.equal(rewrite('sofa').spelling, 'soufə');
});

test('banana → bənanə (two schwas, middle a stays /AE/)', () => {
  // alignment: b}B a}AH0 n}N a}AE1 n}N a}AH0
  // First and third a are schwa; middle is stressed /AE/.
  assert.equal(rewrite('banana').spelling, 'bənanə');
});

// ---- e → ə (when /ə/) ----------------------------------------------------

test('the → thə (the most common English word)', () => {
  // alignment: th}DH e}AH0
  assert.equal(rewrite('the').spelling, 'thə');
});

test('taken → teikən (a→ei AND e→ə)', () => {
  // alignment: t}T a}EY1 k}K e}AH0 n}N
  assert.equal(rewrite('taken').spelling, 'teikən');
});

test('open → oupən (o→ou AND e→ə)', () => {
  assert.equal(rewrite('open').spelling, 'oupən');
});

test('given → givən (silent-e from phase 6 only on terminal e... wait)', () => {
  // alignment: g}G i}IH1 v}V e}AH0 n}N
  // The e here is AH0 (schwa), not silent. So phase 6's silent-e rule
  // doesn't fire (it requires empty phonemes). Phase 10's e→ə fires.
  assert.equal(rewrite('given').spelling, 'givən');
});

// ---- i → ə (when /ə/) ----------------------------------------------------

test('pencil → pensəl (c→s AND i→ə)', () => {
  assert.equal(rewrite('pencil').spelling, 'pensəl');
});

test('animal → anəməl (i→ə AND second-a→ə)', () => {
  // alignment: a}AE1 n}N i}AH0 m}M a}AH0 l}L — first a is stressed AE,
  // i is AH0, second a is AH0.
  assert.equal(rewrite('animal').spelling, 'anəməl');
});

// ---- o → ə (when /ə/) ----------------------------------------------------

test('lemon → leməN — wait, capitalization', () => {
  // alignment: l}L e}EH1 m}M o}AH0 n}N — e is EH1 (stays as e), o is AH0 (→ ə)
  assert.equal(rewrite('lemon').spelling, 'leməN'.toLowerCase());
});

test('wagon → wagən', () => {
  assert.equal(rewrite('wagon').spelling, 'wagən');
});

test('reason → riːzən (ea→iː from phase 9 AND o→ə)', () => {
  // alignment: r}R ea}IY1 s}Z o}AH0 n}N
  // The s is /Z/ but no s→z rule yet, stays as s.
  assert.equal(rewrite('reason').spelling, 'riːsən');
});

// ---- u → ə (when /ə/) ----------------------------------------------------

test('album → albəm', () => {
  assert.equal(rewrite('album').spelling, 'albəm');
});

test('focus → foukəs (o→ou AND u→ə)', () => {
  // alignment: f}F o}OW1 c}K u}AH0 s}S
  assert.equal(rewrite('focus').spelling, 'foukəs');
});

test('circus → sirkəs (c→s, c→k, u→ə)', () => {
  // alignment: c}S ir}ER1 c}K u}AH0 s}S
  assert.equal(rewrite('circus').spelling, 'sirkəs');
});

// ---- CRITICAL: stressed /ʌ/ (AH1) stays unchanged ------------------------

test('CRITICAL: cup stays kup (u is AH1, c→k still fires)', () => {
  assert.equal(rewrite('cup').spelling, 'kup');
});

test('CRITICAL: run stays run (u is AH1)', () => {
  assert.equal(rewrite('run').spelling, 'run');
});

test('CRITICAL: sun stays sun (u is AH1)', () => {
  assert.equal(rewrite('sun').spelling, 'sun');
});

test('CRITICAL: love → luv (o→AH1 stressed; silent-e drops; o stays)', () => {
  // alignment: l}L o}AH1 v}V e}∅ → silent-e + o stays (AH1 doesn't match AH0)
  assert.equal(rewrite('love').spelling, 'lov');
});

// ---- Cross-phase composition: the milestone ------------------------------

test('philosophy → fəlosəfiː (the manifesto word, now with TWO schwas)', () => {
  // alignment: ph}F i}AH0 l}L o}AA1 s}S o}AH0 ph}F y}IY0
  // The first i is AH0 (schwa!), not IH1 — so phase 10 fires on it too.
  // Phase 1 ph→f x2, phase 10 i→ə + second-o→ə, phase 9 y→iː.
  // Final: f + ə + l + o + s + ə + f + iː = "fəlosəfiː".
  assert.equal(rewrite('philosophy').spelling, 'fəlosəfiː');
});

test('phase 10 still applies phase 5: knight → nait', () => {
  assert.equal(rewrite('knight').spelling, 'nait');
});

test('phase 10 still applies phase 7: ghost → goust', () => {
  assert.equal(rewrite('ghost').spelling, 'goust');
});

test('phase 10 still applies phase 8: through → thruː', () => {
  assert.equal(rewrite('through').spelling, 'thruː');
});

test('phase 10 still applies phase 9: she → shiː', () => {
  assert.equal(rewrite('she').spelling, 'shiː');
});
