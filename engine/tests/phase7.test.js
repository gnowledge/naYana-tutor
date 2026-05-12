/**
 * Phase 7 acid tests — the o-family diphthongs and the cleanup epsilons.
 *
 *   /oʊ/  →  ou       go → gou, snow → snou, boat → bout
 *   /aʊ/  →  au       cow → kau, about → abaut, our → aur
 *   silent a/u/h dropped
 *
 * The two diphthongs are bundled to avoid the collision: /oʊ/ alone
 * would land 'boat' on 'bout', colliding with the unrelated /aʊ/ word.
 * With both rules active, 'boat' → 'bout' and 'bout' → 'baut'.
 *
 * Notable unification: our and hour both become 'aur' — true homophones.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadDictionary } from '../src/dictionary.js';
import { rewriteWord } from '../src/rewrite.js';
import { loadCatalogue, rulesForPhase } from '../src/catalogue.js';

const dict = loadDictionary();
const catalogue = loadCatalogue();
const phase7Rules = rulesForPhase(catalogue, 7);

function rewrite(word) {
  const entry = dict.lookup(word);
  const pairs = entry?.pairs ?? null;
  return rewriteWord(word, pairs, phase7Rules);
}

test('phase 7 catalogue extends through the o-family rules', () => {
  const names = phase7Rules.map((r) => r.name);
  assert.ok(names.includes('o→ou (when /oʊ/)'));
  assert.ok(names.includes('ow→ou (when /oʊ/)'));
  assert.ok(names.includes('ow→au (when /aʊ/)'));
  assert.ok(names.includes('ou→au (when /aʊ/)'));
  assert.ok(names.includes('a→∅ (silent)'));
  assert.ok(names.includes('u→∅ (silent)'));
  assert.ok(names.includes('h→∅ (silent)'));
  assert.equal(phase7Rules.length, 24, 'rule count = 17 prior + 7 new');
});

// ---- o → ou (when /oʊ/) ---------------------------------------------------

test('go → gou', () => {
  assert.equal(rewrite('go').spelling, 'gou');
});

test('old → ould', () => {
  assert.equal(rewrite('old').spelling, 'ould');
});

test('home → houm (o→ou AND silent-e)', () => {
  assert.equal(rewrite('home').spelling, 'houm');
});

test('most → moust', () => {
  assert.equal(rewrite('most').spelling, 'moust');
});

test('CRITICAL: on is NOT rewritten (o is /AA/)', () => {
  assert.equal(rewrite('on').spelling, 'on');
});

test('CRITICAL: do is NOT rewritten (o is /UW/)', () => {
  assert.equal(rewrite('do').spelling, 'do');
});

test('CRITICAL: some → som (o is /AH/, only silent-e fires)', () => {
  assert.equal(rewrite('some').spelling, 'som');
});

// ---- ow → ou (when /oʊ/) --------------------------------------------------

test('snow → snou', () => {
  assert.equal(rewrite('snow').spelling, 'snou');
});

test('low → lou', () => {
  assert.equal(rewrite('low').spelling, 'lou');
});

test('window → windou', () => {
  assert.equal(rewrite('window').spelling, 'windou');
});

test('yellow → yellou', () => {
  assert.equal(rewrite('yellow').spelling, 'yellou');
});

test('know → nou (kn→n AND ow→ou)', () => {
  // know aligns as kn}N ow}OW1. Earlier phases had this landing on
  // 'now' (the kn→n made the surface match the AW word 'now'). With
  // phase 7's ow→ou, know finally lands on 'nou' — distinct from
  // the /aʊ/ word 'now' which becomes 'nau'.
  assert.equal(rewrite('know').spelling, 'nou');
});

// ---- ow → au (when /aʊ/) --------------------------------------------------

test('CRITICAL: now → nau (the /aʊ/ word, distinct from know→nou)', () => {
  assert.equal(rewrite('now').spelling, 'nau');
});

test('how → hau', () => {
  assert.equal(rewrite('how').spelling, 'hau');
});

test('cow → kau (c→k AND ow→au)', () => {
  assert.equal(rewrite('cow').spelling, 'kau');
});

test('town → taun', () => {
  assert.equal(rewrite('town').spelling, 'taun');
});

// ---- ou → au (when /aʊ/) --------------------------------------------------

test('about → abaut', () => {
  assert.equal(rewrite('about').spelling, 'abaut');
});

test('out → aut', () => {
  assert.equal(rewrite('out').spelling, 'aut');
});

test('sound → saund', () => {
  assert.equal(rewrite('sound').spelling, 'saund');
});

test('our → aur', () => {
  assert.equal(rewrite('our').spelling, 'aur');
});

test('CRITICAL: bout → baut (the /aʊ/ word, distinct from boat→bout)', () => {
  assert.equal(rewrite('bout').spelling, 'baut');
});

// ---- silent a/u/h ---------------------------------------------------------

test('boat → bout (o→ou AND silent-a)', () => {
  assert.equal(rewrite('boat').spelling, 'bout');
});

test('road → roud', () => {
  assert.equal(rewrite('road').spelling, 'roud');
});

test('toast → toust', () => {
  assert.equal(rewrite('toast').spelling, 'toust');
});

test('build → bild (silent-u, no other rules fire)', () => {
  assert.equal(rewrite('build').spelling, 'bild');
});

test('soul stays soul (o→ou AND silent-u combine to no visible change)', () => {
  // alignment: s}S o}OW1 u}∅ l}L → after rules: s + ou + "" + l = "soul"
  assert.equal(rewrite('soul').spelling, 'soul');
});

test('hour → aur (silent-h AND ou→au)', () => {
  // Becomes a true homophone of "our".
  assert.equal(rewrite('hour').spelling, 'aur');
});

test('honest → onest (silent-h)', () => {
  assert.equal(rewrite('honest').spelling, 'onest');
});

test('ghost → goust (silent-h AND o→ou)', () => {
  // Phase 5 spared ghost because alignment is g}G h}∅ o}OW1 s}S t}T —
  // no 'gh' pair to match. At phase 7, silent-h drops the h AND o→ou
  // fires on the /OW/ vowel. Spelling: g + "" + ou + s + t = "goust".
  assert.equal(rewrite('ghost').spelling, 'goust');
});

test('what → wat (silent-h after w)', () => {
  assert.equal(rewrite('what').spelling, 'wat');
});

test('where → wer (silent-h AND silent-e)', () => {
  assert.equal(rewrite('where').spelling, 'wer');
});

// ---- Cross-phase composition ---------------------------------------------

test('rhyme → raim (silent-h AND y→ai AND silent-e all fire)', () => {
  const r = rewrite('rhyme');
  assert.equal(r.spelling, 'raim');
  assert.equal(r.replacements, 3);
});

test('though → thou (gh→∅ from phase 5, plus phase 7 cleanups)', () => {
  // alignment: th}DH o}OW1 u}∅ gh}∅
  // gh→∅, o→ou, u→∅ all fire. Spelling: th + ou + "" + "" = "thou"
  assert.equal(rewrite('though').spelling, 'thou');
});

test('phase 7 still applies phase 1: philosophy → filosofy', () => {
  assert.equal(rewrite('philosophy').spelling, 'filosofy');
});

test('phase 7 still applies phase 6: face → feis', () => {
  assert.equal(rewrite('face').spelling, 'feis');
});
