/**
 * Unit tests for the rewrite engine.
 * Run: node --test tests/
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadDictionary } from '../src/dictionary.js';
import { rewriteWord } from '../src/rewrite.js';
import { loadCatalogue, rulesForPhase } from '../src/catalogue.js';

const dict = loadDictionary();
const catalogue = loadCatalogue();
const phase1Rules = rulesForPhase(catalogue, 1);

// Test helper: look up the first pronunciation's pairs and rewrite.
function rewrite(word, rules = phase1Rules) {
  const entry = dict.lookup(word);
  const pairs = entry?.pairs ?? null;
  return rewriteWord(word, pairs, rules);
}

test('phase 1 catalogue has the ph→f rule', () => {
  assert.equal(phase1Rules.length, 1);
  assert.equal(phase1Rules[0].name, 'ph→f');
  assert.equal(phase1Rules[0].from, 'ph');
  assert.equal(phase1Rules[0].to, 'f');
  assert.equal(phase1Rules[0].phoneme, 'F');
});

test('philosophy → filosofy (two ph→f substitutions)', () => {
  const result = rewrite('philosophy');
  assert.equal(result.spelling, 'filosofy');
  assert.equal(result.replacements, 2);
  assert.deepEqual(result.rulesApplied, ['ph→f']);
});

test('phone → fone', () => {
  assert.equal(rewrite('phone').spelling, 'fone');
});

test('graph → graf', () => {
  assert.equal(rewrite('graph').spelling, 'graf');
});

test('elephant → elefant', () => {
  assert.equal(rewrite('elephant').spelling, 'elefant');
});

test('photograph → fotograf (two substitutions)', () => {
  const result = rewrite('photograph');
  assert.equal(result.spelling, 'fotograf');
  assert.equal(result.replacements, 2);
});

test('CRITICAL: shepherd is NOT rewritten (h is silent in alignment)', () => {
  const result = rewrite('shepherd');
  assert.equal(result.spelling, 'shepherd');
  assert.deepEqual(result.rulesApplied, []);
});

test('CRITICAL: uphill is NOT rewritten (p and h align separately)', () => {
  assert.equal(rewrite('uphill').spelling, 'uphill');
});

test('CRITICAL: uphold is NOT rewritten', () => {
  assert.equal(rewrite('uphold').spelling, 'uphold');
});

test('CRITICAL: loophole is NOT rewritten', () => {
  assert.equal(rewrite('loophole').spelling, 'loophole');
});

test('initial-cap is dropped: Phone → fone (Nayana phonetic spelling has no caps)', () => {
  assert.equal(rewrite('Phone').spelling, 'fone');
});

test('all-caps preserved as abbreviation: PHONE → FONE', () => {
  assert.equal(rewrite('PHONE').spelling, 'FONE');
});

test('initial-cap is dropped: Philosophy → filosofy', () => {
  assert.equal(rewrite('Philosophy').spelling, 'filosofy');
});

test('unknown words pass through unchanged (no pairs available)', () => {
  // null pairs simulates an unknown word; rewriteWord just returns input
  const result = rewriteWord('xyzqq', null, phase1Rules);
  assert.equal(result.spelling, 'xyzqq');
  assert.deepEqual(result.rulesApplied, []);
});

test('words with no ph are unchanged', () => {
  assert.equal(rewrite('cat').spelling, 'cat');
});

test('punctuation passes through', () => {
  const result = rewriteWord('.', null, phase1Rules);
  assert.equal(result.spelling, '.');
});

test('phase 0 (no rules) rewrites nothing', () => {
  assert.equal(rewrite('philosophy', rulesForPhase(catalogue, 0)).spelling, 'philosophy');
});
