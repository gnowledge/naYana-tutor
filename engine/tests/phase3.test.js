/**
 * Phase 3 acid tests — ck → k.
 *
 * The cleanest possible rule: 'ck' aligns as a single grapheme to /k/
 * essentially everywhere it appears. The interesting cases are
 * combinations with phase 2 (clock, where c→k AND ck→k both fire) and
 * with phase 1 (none — ck and ph don't co-occur in significant words).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadDictionary } from '../src/dictionary.js';
import { rewriteWord } from '../src/rewrite.js';
import { loadCatalogue, rulesForPhase } from '../src/catalogue.js';

const dict = loadDictionary();
const catalogue = loadCatalogue();
const phase3Rules = rulesForPhase(catalogue, 3);

function rewrite(word) {
  const entry = dict.lookup(word);
  const pairs = entry?.pairs ?? null;
  return rewriteWord(word, pairs, phase3Rules);
}

test('phase 3 catalogue has all of ph→f, c→k, c→s, cc→k, ck→k', () => {
  const names = phase3Rules.map((r) => r.name);
  assert.deepEqual(names, ['ph→f', 'c→k', 'c→s', 'cc→k', 'ck→k']);
});

test('back → bak', () => {
  assert.equal(rewrite('back').spelling, 'bak');
});

test('pick → pik', () => {
  assert.equal(rewrite('pick').spelling, 'pik');
});

test('jacket → jaket', () => {
  assert.equal(rewrite('jacket').spelling, 'jaket');
});

test('rocket → roket', () => {
  assert.equal(rewrite('rocket').spelling, 'roket');
});

test('CRITICAL: clock → klok (c→k AND ck→k both fire in same word)', () => {
  const r = rewrite('clock');
  assert.equal(r.spelling, 'klok');
  assert.equal(r.replacements, 2);
});

test('backpack → bakpak (two ck→k firings in one word)', () => {
  const r = rewrite('backpack');
  assert.equal(r.spelling, 'bakpak');
  assert.equal(r.replacements, 2);
});

test('phase 3 still applies phase 2: city → sity', () => {
  assert.equal(rewrite('city').spelling, 'sity');
});

test('phase 3 still applies phase 1: philosophy → filosofy', () => {
  assert.equal(rewrite('philosophy').spelling, 'filosofy');
});

test('phase 3 still rejects phase 1 exception: shepherd unchanged', () => {
  assert.equal(rewrite('shepherd').spelling, 'shepherd');
});

test('phase 3 still rejects phase 2 exception: cello unchanged', () => {
  assert.equal(rewrite('cello').spelling, 'cello');
});
