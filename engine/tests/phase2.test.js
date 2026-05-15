/**
 * Phase 2 acid tests — c → k or s.
 *
 * The c-ambiguity is the textbook case for position-based rewriting:
 * a single word can have multiple c's that resolve differently (cycle),
 * the spelling rule "c is /s/ before e/i/y, /k/ otherwise" has many
 * exceptions (Celtic, facade), and some c's are neither /k/ nor /s/
 * (cello /tʃ/, ocean /ʃ/). Alignment-aware rules handle all of these.
 *
 * If any of these tests fail, the c-ambiguity rule has regressed —
 * see docs/missing-alignments.md for the inverse problem.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadDictionary } from '../src/dictionary.js';
import { rewriteWord } from '../src/rewrite.js';
import { loadCatalogue, rulesForPhase } from '../src/catalogue.js';

const dict = loadDictionary();
const catalogue = loadCatalogue();
const phase2Rules = rulesForPhase(catalogue, 2);

function rewrite(word) {
  const entry = dict.lookup(word);
  const pairs = entry?.pairs ?? null;
  return rewriteWord(word, pairs, phase2Rules);
}

test('phase 2 catalogue has c→k, c→s, cc→k (plus phase 1\'s ph→f)', () => {
  const names = phase2Rules.map((r) => r.name);
  assert.deepEqual(names, ['ph→f', 'c→k', 'c→s', 'cc→k']);
});

test('cat → kat (c aligns to /k/)', () => {
  assert.equal(rewrite('cat').spelling, 'kat');
});

test('city → sity (c aligns to /s/)', () => {
  assert.equal(rewrite('city').spelling, 'sity');
});

test('CRITICAL: cycle → sykle (two c\'s resolve differently in the same word)', () => {
  // First c is /s/, second c is /k/. Presence-based matching would fail here.
  assert.equal(rewrite('cycle').spelling, 'sykle');
});

test('account → akount (cc aligns as one grapheme to /k/)', () => {
  assert.equal(rewrite('account').spelling, 'akount');
});

test('CRITICAL: cello is NOT rewritten (c aligns to /tʃ/, not /k/ or /s/)', () => {
  assert.equal(rewrite('cello').spelling, 'cello');
});

test('Celtic → seltik (CMUdict /s/ first-wins; init-cap dropped)', () => {
  // CMUdict has both /sɛltɪk/ (basketball team) and /kɛltɪk/ (everything else),
  // listed in that order. First-wins picks /s/. The alternate /k/ pronunciation
  // would yield "keltik" — surfaced as an alternate in the UI.
  assert.equal(rewrite('Celtic').spelling, 'seltik');
});

test('CRITICAL: ocean is NOT rewritten (c aligns to /ʃ/)', () => {
  assert.equal(rewrite('ocean').spelling, 'ocean');
});

test('facade → fasade (c aligns to /s/ despite preceding "a")', () => {
  assert.equal(rewrite('facade').spelling, 'fasade');
});

test('phase 2 still applies phase 1: philosophy → filosofy', () => {
  assert.equal(rewrite('philosophy').spelling, 'filosofy');
});

test('phase 2 still rejects phase 1 exceptions: shepherd unchanged', () => {
  assert.equal(rewrite('shepherd').spelling, 'shepherd');
});

test('combined rules on one word: cyclic → syklik (one c→s, two c→k)', () => {
  // Three c's: positions 1/3/6 align to S/K/K. Confirms multiple rules
  // and multiple firings of the same rule compose correctly in one word.
  const r = rewrite('cyclic');
  assert.equal(r.spelling, 'syklik');
  assert.equal(r.replacements, 3);
});
