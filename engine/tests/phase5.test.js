/**
 * Phase 5 acid tests — gh deletion + gh→f.
 *
 * Phase 5 introduces the first epsilon rule: gh→∅ fires on pairs where
 * graphemes are "gh" and the phoneme list is empty (silent gh). The
 * sibling gh→f rule fires on pairs where graphemes are "gh" and the
 * phoneme list contains /F/. The two are mutually exclusive per pair.
 *
 * Critical negative cases — words where the alignment splits gh into
 * separate g}G h}∅ pairs (ghost, spaghetti) — confirm the rule
 * correctly does not fire there.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadDictionary } from '../src/dictionary.js';
import { rewriteWord, applyRuleToPairs } from '../src/rewrite.js';
import { loadCatalogue, rulesForPhase } from '../src/catalogue.js';

const dict = loadDictionary();
const catalogue = loadCatalogue();
const phase5Rules = rulesForPhase(catalogue, 5);

function rewrite(word) {
  const entry = dict.lookup(word);
  const pairs = entry?.pairs ?? null;
  return rewriteWord(word, pairs, phase5Rules);
}

test('phase 5 catalogue extends through gh→∅ and gh→f', () => {
  const names = phase5Rules.map((r) => r.name);
  assert.deepEqual(names, ['ph→f', 'c→k', 'c→s', 'cc→k', 'ck→k', 'kn→n', 'wr→r', 'mb→m', 'gh→∅', 'gh→f']);
});

// ---- Engine: epsilon-rule plumbing -----------------------------------------

test('applyRuleToPairs: epsilon rule fires when pair.phonemes is empty', () => {
  const pairs = [
    { graphemes: 'gh', phonemes: [] },
    { graphemes: 't',  phonemes: ['T'] },
  ];
  const rule = { name: 'gh→∅', from: 'gh', to: '', phoneme: null };
  const { pairs: out, applied, count } = applyRuleToPairs(pairs, rule);
  assert.equal(applied, true);
  assert.equal(count, 1);
  assert.equal(out[0].graphemes, '');
  assert.equal(out[1].graphemes, 't');
});

test('applyRuleToPairs: epsilon rule does NOT fire on pair with phonemes', () => {
  const pairs = [
    { graphemes: 'gh', phonemes: ['G'] },
  ];
  const rule = { name: 'gh→∅', from: 'gh', to: '', phoneme: null };
  const { applied } = applyRuleToPairs(pairs, rule);
  assert.equal(applied, false);
});

// ---- gh → ∅ (silent) -------------------------------------------------------

test('night → nit', () => {
  assert.equal(rewrite('night').spelling, 'nit');
});

test('light → lit', () => {
  assert.equal(rewrite('light').spelling, 'lit');
});

test('through → throu', () => {
  assert.equal(rewrite('through').spelling, 'throu');
});

test('though → thou', () => {
  assert.equal(rewrite('though').spelling, 'thou');
});

test('bought → bout (with silent u retained from alignment)', () => {
  assert.equal(rewrite('bought').spelling, 'bout');
});

test('straight → strait (true homophone unification)', () => {
  assert.equal(rewrite('straight').spelling, 'strait');
});

test('daughter → dauter', () => {
  assert.equal(rewrite('daughter').spelling, 'dauter');
});

test('caught → kaut (c→k AND gh→∅ both fire)', () => {
  const r = rewrite('caught');
  assert.equal(r.spelling, 'kaut');
  assert.equal(r.replacements, 2);
});

// ---- gh → f ----------------------------------------------------------------

test('laugh → lauf', () => {
  assert.equal(rewrite('laugh').spelling, 'lauf');
});

test('tough → touf', () => {
  assert.equal(rewrite('tough').spelling, 'touf');
});

test('enough → enouf', () => {
  assert.equal(rewrite('enough').spelling, 'enouf');
});

test('rough → rouf', () => {
  assert.equal(rewrite('rough').spelling, 'rouf');
});

// ---- Critical negatives: ghost-type cases ---------------------------------

test('CRITICAL: ghost is NOT rewritten (alignment is g}G h}∅, no gh pair)', () => {
  assert.equal(rewrite('ghost').spelling, 'ghost');
});

test('CRITICAL: spaghetti is NOT rewritten (gh is the g-h boundary)', () => {
  assert.equal(rewrite('spaghetti').spelling, 'spaghetti');
});

test('CRITICAL: ghoul is NOT rewritten', () => {
  assert.equal(rewrite('ghoul').spelling, 'ghoul');
});

// ---- Cross-phase composition ----------------------------------------------

test('phase 5 still applies phase 1: philosophy → filosofy', () => {
  assert.equal(rewrite('philosophy').spelling, 'filosofy');
});

test('phase 5 still applies phase 4: knife → nife', () => {
  assert.equal(rewrite('knife').spelling, 'nife');
});

test('phase 5 still rejects phase 1 exception: shepherd unchanged', () => {
  assert.equal(rewrite('shepherd').spelling, 'shepherd');
});
