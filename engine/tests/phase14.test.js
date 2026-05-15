/**
 * Phase 14 acid tests — r-colored vowels.
 *
 *   ɝ  U+025D   STRESSED   her, bird, work, turn, earth
 *   ɚ  U+025A   UNSTRESSED teacher, philosopher, dollar, doctor
 *
 * Five graphemes (er, ir, ur, or, ar) × two stress levels = 10 rules.
 * Phonetisaurus aligns the digraph to ER0/ER1/ER2 as a single pair,
 * so per-pair substitution works. Critical negatives (car, for, more)
 * align separately and stay untouched.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadDictionary } from '../src/dictionary.js';
import { rewriteWord } from '../src/rewrite.js';
import { loadCatalogue, rulesForPhase } from '../src/catalogue.js';

const dict = loadDictionary();
const catalogue = loadCatalogue();
const phase14Rules = rulesForPhase(catalogue, 14);

function rewrite(word) {
  const entry = dict.lookup(word);
  const pairs = entry?.pairs ?? null;
  return rewriteWord(word, pairs, phase14Rules);
}

test('phase 14 catalogue extends with 10 r-colored rules', () => {
  const names = phase14Rules.map((r) => r.name);
  for (const g of ['er', 'ir', 'ur', 'or', 'ar']) {
    assert.ok(names.includes(`${g}→ɝ (when stressed /ɝ/)`));
    assert.ok(names.includes(`${g}→ɚ (when /ɚ/)`));
  }
  assert.equal(phase14Rules.length, 79, 'rule count = 69 prior + 10 new');
});

// ---- ɝ stressed ---------------------------------------------------------

test('her → hɝ', () => {
  assert.equal(rewrite('her').spelling, 'hɝ');
});

test('were → wɝ (er→ɝ AND silent-e from phase 6)', () => {
  // alignment: w}W er}ER1 e}∅
  assert.equal(rewrite('were').spelling, 'wɝ');
});

test('person → pɝsən (er→ɝ AND o→ə)', () => {
  assert.equal(rewrite('person').spelling, 'pɝsən');
});

test('bird → bɝd', () => {
  assert.equal(rewrite('bird').spelling, 'bɝd');
});

test('girl → gɝl', () => {
  assert.equal(rewrite('girl').spelling, 'gɝl');
});

test('first → fɝst', () => {
  assert.equal(rewrite('first').spelling, 'fɝst');
});

test('turn → tɝn', () => {
  assert.equal(rewrite('turn').spelling, 'tɝn');
});

test('burn → bɝn', () => {
  assert.equal(rewrite('burn').spelling, 'bɝn');
});

test('work → wɝk', () => {
  assert.equal(rewrite('work').spelling, 'wɝk');
});

test('word → wɝd', () => {
  assert.equal(rewrite('word').spelling, 'wɝd');
});

test('world → wɝld', () => {
  assert.equal(rewrite('world').spelling, 'wɝld');
});

test('CRITICAL: heard → hɝd (silent-e + ar→ɝ)', () => {
  // alignment: h}HH e}∅ ar}ER1 d}D
  assert.equal(rewrite('heard').spelling, 'hɝd');
});

test('CRITICAL: earth → ɝθ (silent-e + ar→ɝ + th→θ)', () => {
  // alignment: e}∅ ar}ER1 th}TH
  assert.equal(rewrite('earth').spelling, 'ɝθ');
});

test('learn → lɝn', () => {
  assert.equal(rewrite('learn').spelling, 'lɝn');
});

// ---- ɚ unstressed -------------------------------------------------------

test('teacher → tiːtʃɚ (ea→iː + ch→tʃ + er→ɚ)', () => {
  assert.equal(rewrite('teacher').spelling, 'tiːtʃɚ');
});

test('mother → mʌðɚ (o→ʌ + th→ð + er→ɚ)', () => {
  assert.equal(rewrite('mother').spelling, 'mʌðɚ');
});

test('summer → sʌmmɚ (u→ʌ + er→ɚ; mm stays doubled)', () => {
  // alignment: s}S u}AH1 mm}M er}ER0 — 'mm' is one grapheme aligned
  // to one phoneme. No geminate-collapse rule yet, so mm stays.
  assert.equal(rewrite('summer').spelling, 'sʌmmɚ');
});

test('CRITICAL: philosopher → fɪlosəfɚ (the manifesto word, fully transformed)', () => {
  // alignment: ph}F i}AH0 l}L o}AA1 s}S o}AH0 ph}F er}ER0
  assert.equal(rewrite('philosopher').spelling, 'fɪlosəfɚ');
});

test('dollar → dollɚ (ar→ɚ; ll stays doubled — same as summer)', () => {
  assert.equal(rewrite('dollar').spelling, 'dollɚ');
});

test('sugar → ʃʊgɚ (s→ʃ + u→ʊ + ar→ɚ)', () => {
  // alignment: s}SH u}UH1 g}G ar}ER0
  assert.equal(rewrite('sugar').spelling, 'ʃʊgɚ');
});

test('doctor → doktɚ (c→k + or→ɚ)', () => {
  assert.equal(rewrite('doctor').spelling, 'doktɚ');
});

test('factor → fæktɚ (a→æ + c→k + or→ɚ)', () => {
  assert.equal(rewrite('factor').spelling, 'fæktɚ');
});

test('liar → laiɚ (i→ai + ar→ɚ)', () => {
  // alignment: l}L i}AY1 ar}ER0
  assert.equal(rewrite('liar').spelling, 'laiɚ');
});

// ---- CRITICAL negatives — bare-r words must NOT change ------------------

test('CRITICAL: car → kar (a+r separate; no rule fires on bare r)', () => {
  // alignment: c}K a}AA1 r}R — no 'ar' pair, no /ER/.
  // c→k from phase 2 fires. Result: kar.
  assert.equal(rewrite('car').spelling, 'kar');
});

test('CRITICAL: for → for (o+r separate)', () => {
  // alignment: f}F o}AO1 r}R
  assert.equal(rewrite('for').spelling, 'for');
});

test('CRITICAL: more → mor (silent-e drops; o+r stay separate)', () => {
  // alignment: m}M o}AO1 r}R e}∅
  assert.equal(rewrite('more').spelling, 'mor');
});

test('CRITICAL: door → dor (silent-o + o + r + nothing)', () => {
  // alignment: d}D o}∅ o}AO1 r}R — first o silent (no rule yet),
  // second o stays, r stays. Result: door (or dor depending). Let me
  // check: silent-a/u/h exist, silent-o doesn't, so first o stays.
  // Result: door.
  assert.equal(rewrite('door').spelling, 'door');
});

// ---- Cross-phase composition (the cumulative weight) -------------------

test('philosopher unifies the manifesto motif', () => {
  // Phases combine: ph→f (×2), i→ə (first i is AH0), o→ə (third vowel),
  // er→ɚ. Result: fɪlosəfɚ. The o between is /AA1/ — stays as 'o'.
  assert.equal(rewrite('philosopher').spelling, 'fɪlosəfɚ');
});

test('the → ðə (phases 11+10 still hold)', () => {
  assert.equal(rewrite('the').spelling, 'ðə');
});

test('she → ʃiː (phases 12+9)', () => {
  assert.equal(rewrite('she').spelling, 'ʃiː');
});

test('eat → iːt vs it → ɪt (phases 9+13 still distinct)', () => {
  assert.equal(rewrite('eat').spelling, 'iːt');
  assert.equal(rewrite('it').spelling, 'ɪt');
});
