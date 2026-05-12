/**
 * Phase 4 acid tests — silent letters (kn → n, wr → r, mb → m).
 *
 * The interesting cases are the negatives: words where the same letter
 * sequence appears but the letter ISN'T silent. The alignment-based
 * engine handles these by construction — Phonetisaurus aligns silent
 * cases as a single multigraph (e.g. mb}M) and pronounced cases as
 * separate pairs (m}M b}B), so the rule only fires on the silent ones.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadDictionary } from '../src/dictionary.js';
import { rewriteWord } from '../src/rewrite.js';
import { loadCatalogue, rulesForPhase } from '../src/catalogue.js';

const dict = loadDictionary();
const catalogue = loadCatalogue();
const phase4Rules = rulesForPhase(catalogue, 4);

function rewrite(word) {
  const entry = dict.lookup(word);
  const pairs = entry?.pairs ?? null;
  return rewriteWord(word, pairs, phase4Rules);
}

test('phase 4 catalogue has all phase 1-3 rules plus kn→n, wr→r, mb→m', () => {
  const names = phase4Rules.map((r) => r.name);
  assert.deepEqual(names, ['ph→f', 'c→k', 'c→s', 'cc→k', 'ck→k', 'kn→n', 'wr→r', 'mb→m']);
});

// ---- kn → n -----------------------------------------------------------------

test('knife → nife', () => {
  assert.equal(rewrite('knife').spelling, 'nife');
});

test('knock → nok (kn→n AND ck→k both fire)', () => {
  const r = rewrite('knock');
  assert.equal(r.spelling, 'nok');
  assert.equal(r.replacements, 2);
});

test('know → now (alignment keeps "ow" as a digraph)', () => {
  // alignment: kn}N ow}OW1 — kn→n plus the ow digraph survives, so the
  // result is "now" (visually colliding with the existing word /naʊ/,
  // a quirk that later vowel phases would resolve).
  assert.equal(rewrite('know').spelling, 'now');
});

test('knight → night (creates intentional homograph)', () => {
  assert.equal(rewrite('knight').spelling, 'night');
});

test('CRITICAL: acknowledge — kn does NOT fire (k aligns with ck, not n)', () => {
  // alignment: a}AE0 ck}K n}N o}AA1 w} l}L e}IH0 dg}JH e}
  // ck→k fires (phase 3); kn→n does NOT fire because there's no kn pair.
  const r = rewrite('acknowledge');
  // The c→k rule (graphemes "c") doesn't match either since the c is in ck.
  // So only ck→k fires: ack → ak.
  assert.equal(r.spelling, 'aknowledge');
});

test('unknown → unnown (mid-word kn DOES fire when aligned as kn}N)', () => {
  // alignment: u}AH0 n}N kn}N ow}OW1 n}N
  // kn→n fires: u + n + n + ow + n = "unnown"
  assert.equal(rewrite('unknown').spelling, 'unnown');
});

// ---- wr → r -----------------------------------------------------------------

test('write → rite', () => {
  assert.equal(rewrite('write').spelling, 'rite');
});

test('wrong → rong', () => {
  assert.equal(rewrite('wrong').spelling, 'rong');
});

test('wreck → rek (wr→r AND ck→k both fire)', () => {
  const r = rewrite('wreck');
  assert.equal(r.spelling, 'rek');
  assert.equal(r.replacements, 2);
});

test('playwright → playright (mid-word wr fires)', () => {
  assert.equal(rewrite('playwright').spelling, 'playright');
});

// ---- mb → m -----------------------------------------------------------------

test('comb → kom (mb→m AND c→k both fire)', () => {
  assert.equal(rewrite('comb').spelling, 'kom');
});

test('lamb → lam (only mb→m fires; no c)', () => {
  assert.equal(rewrite('lamb').spelling, 'lam');
});

test('climb → klim (mb→m AND c→k both fire)', () => {
  assert.equal(rewrite('climb').spelling, 'klim');
});

test('plumber → plumer (silent b in middle)', () => {
  assert.equal(rewrite('plumber').spelling, 'plumer');
});

test('CRITICAL: number — b is pronounced, mb→m does NOT fire', () => {
  // alignment: n}N u}AH1 m}M b}B er}ER0 — m and b are separate pairs.
  assert.equal(rewrite('number').spelling, 'number');
});

test('CRITICAL: member — b is pronounced, mb→m does NOT fire', () => {
  assert.equal(rewrite('member').spelling, 'member');
});

test('CRITICAL: lumber — b is pronounced, mb→m does NOT fire', () => {
  assert.equal(rewrite('lumber').spelling, 'lumber');
});

// ---- Cross-phase composition ------------------------------------------------

test('phase 4 still applies phase 1: philosophy → filosofy', () => {
  assert.equal(rewrite('philosophy').spelling, 'filosofy');
});

test('phase 4 still applies phase 3: clock → klok', () => {
  assert.equal(rewrite('clock').spelling, 'klok');
});

test('phase 4 still rejects phase 1 exception: shepherd unchanged', () => {
  assert.equal(rewrite('shepherd').spelling, 'shepherd');
});
