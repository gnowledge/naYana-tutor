/**
 * Phase 11 acid tests — the two th sounds finally distinguished.
 *
 *   th -> θ   when /TH/ (voiceless)  thin, math, three, thought
 *   th -> ð   when /DH/ (voiced)     this, that, the, mother, breathe
 *
 * Phonetisaurus consistently aligns 'th' as one grapheme; the rule
 * branches purely on phoneme. Two new IPA codepoints introduced:
 * U+03B8 θ and U+00F0 ð. Nayana font will draw both with custom
 * shapes (separate ticket); data layer is canonical IPA.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadDictionary } from '../src/dictionary.js';
import { rewriteWord } from '../src/rewrite.js';
import { loadCatalogue, rulesForPhase } from '../src/catalogue.js';

const dict = loadDictionary();
const catalogue = loadCatalogue();
const phase11Rules = rulesForPhase(catalogue, 11);

function rewrite(word) {
  const entry = dict.lookup(word);
  const pairs = entry?.pairs ?? null;
  return rewriteWord(word, pairs, phase11Rules);
}

test('phase 11 catalogue extends with two th rules', () => {
  const names = phase11Rules.map((r) => r.name);
  assert.ok(names.includes('th→θ (voiceless)'));
  assert.ok(names.includes('th→ð (voiced)'));
  assert.equal(phase11Rules.length, 42, 'rule count = 40 prior + 2 new');
});

// ---- th → θ (voiceless) ---------------------------------------------------

test('thin → θin', () => {
  assert.equal(rewrite('thin').spelling, 'θin');
});

test('math → maθ', () => {
  assert.equal(rewrite('math').spelling, 'maθ');
});

test('path → paθ', () => {
  assert.equal(rewrite('path').spelling, 'paθ');
});

test('thumb → θum (th→θ AND mb→m)', () => {
  assert.equal(rewrite('thumb').spelling, 'θum');
});

test('thought → θout (th→θ AND gh→∅)', () => {
  // alignment: th}TH ou}AO1 gh}∅ t}T → ou is /AO/, phase 7 ou→au
  // requires /AW/, so ou stays as 'ou'. gh→∅. Result: θout.
  assert.equal(rewrite('thought').spelling, 'θout');
});

test('three → θriː (th→θ AND silent-e AND e→iː)', () => {
  // alignment: th}TH r}R e}∅ e}IY1 → θ + r + "" + iː = "θriː"
  assert.equal(rewrite('three').spelling, 'θriː');
});

test('through → θruː (th→θ AND ou→uː AND gh→∅)', () => {
  assert.equal(rewrite('through').spelling, 'θruː');
});

test('think → θink (n}NG stays as n; future phase will mark velar)', () => {
  // alignment: th}TH i}IH1 n}NG k}K — the n is aligned to /NG/ but
  // we haven't introduced ŋ yet. So n stays as 'n'.
  assert.equal(rewrite('think').spelling, 'θink');
});

// ---- th → ð (voiced) ------------------------------------------------------

test('this → ðis', () => {
  assert.equal(rewrite('this').spelling, 'ðis');
});

test('that → ðat', () => {
  assert.equal(rewrite('that').spelling, 'ðat');
});

test('them → ðem', () => {
  assert.equal(rewrite('them').spelling, 'ðem');
});

test('CRITICAL: the → ðə (the most common English word, th→ð AND e→ə)', () => {
  assert.equal(rewrite('the').spelling, 'ðə');
});

test('they → ðei (th→ð AND ey→ei from phase 6)', () => {
  assert.equal(rewrite('they').spelling, 'ðei');
});

test('though → ðou (th→ð AND silent-u AND gh→∅)', () => {
  // alignment: th}DH o}OW1 u}∅ gh}∅ → ð + ou + "" + "" = "ðou"
  // (o→ou from phase 7 makes the o "ou", then silent-u drops u}∅,
  // then gh→∅. Net: "ðou".)
  assert.equal(rewrite('though').spelling, 'ðou');
});

test('mother → moðer', () => {
  assert.equal(rewrite('mother').spelling, 'moðer');
});

test('brother → broðer', () => {
  assert.equal(rewrite('brother').spelling, 'broðer');
});

test('breathe → briːð (silent-e drops AND ea→iː AND th→ð)', () => {
  // alignment: b}B r}R ea}IY1 th}DH e}∅ → b + r + iː + ð + "" = "briːð"
  assert.equal(rewrite('breathe').spelling, 'briːð');
});

test('smooth → smuːð (oo→uː AND th→ð)', () => {
  assert.equal(rewrite('smooth').spelling, 'smuːð');
});

// ---- Mutual exclusion ----------------------------------------------------

test('CRITICAL: thin is NOT touched by th→ð (phoneme is /TH/, not /DH/)', () => {
  assert.equal(rewrite('thin').spelling, 'θin');
});

test('CRITICAL: mother is NOT touched by th→θ (phoneme is /DH/, not /TH/)', () => {
  assert.equal(rewrite('mother').spelling, 'moðer');
});

// ---- Cross-phase composition --------------------------------------------

test('philosophy → filosəfiː (no th, phase 10 still applies)', () => {
  assert.equal(rewrite('philosophy').spelling, 'filosəfiː');
});

test('phase 11 still applies phase 10: about → əbaut', () => {
  assert.equal(rewrite('about').spelling, 'əbaut');
});

test('phase 11 still applies phase 9: she → shiː', () => {
  assert.equal(rewrite('she').spelling, 'shiː');
});

test('phase 11 still respects phase 1: shepherd → sheperd (no ph→f; silent-h from phase 7 fires)', () => {
  // Phase 1's ph→f correctly doesn't fire (shepherd's alignment is
  // p}P h}∅, no 'ph' pair). Phase 7's silent-h rule drops the bare h.
  // Result: 'sheperd' — the silent letter gone.
  assert.equal(rewrite('shepherd').spelling, 'sheperd');
});
