/**
 * Phase 5 acid tests — the long-i family.
 *
 * Phase 5 bundles four rules:
 *   i → ai   (when phoneme is /AY/)  — find → faind, night → nait
 *   y → ai   (when phoneme is /AY/)  — my → mai, sky → skai
 *   gh → ∅   (epsilon)               — through → throu, bought → bout
 *   gh → f                            — laugh → lauf, tough → touf
 *
 * The vowel rule is bundled with gh-removal on purpose: doing gh-removal
 * alone would produce 'nit' for 'night', visually colliding with the
 * unrelated /ɪ/ word. With i→ai active, 'night' becomes 'nait' and the
 * collision never appears for the reader.
 *
 * The epsilon rule (gh→∅) introduces a new engine capability: rules with
 * phoneme:null fire on pairs whose phoneme list is empty.
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

test('phase 5 catalogue extends through i→ai, y→ai, gh→∅, gh→f', () => {
  const names = phase5Rules.map((r) => r.name);
  assert.deepEqual(names, [
    'ph→f', 'c→k', 'c→s', 'cc→k', 'ck→k',
    'kn→n', 'wr→r', 'mb→m',
    'i→ai (when /aɪ/)', 'y→ai (when /aɪ/)', 'gh→∅', 'gh→f',
  ]);
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

// ---- i → ai (when /aɪ/) ----------------------------------------------------

test('find → faind', () => {
  assert.equal(rewrite('find').spelling, 'faind');
});

test('child → chaild', () => {
  assert.equal(rewrite('child').spelling, 'chaild');
});

test('mighty → maity (i→ai AND gh→∅ both fire)', () => {
  assert.equal(rewrite('mighty').spelling, 'maity');
});

test('CRITICAL: nit is NOT rewritten (i aligns to /IH/, not /AY/)', () => {
  assert.equal(rewrite('nit').spelling, 'nit');
});

test('CRITICAL: sit is NOT rewritten', () => {
  assert.equal(rewrite('sit').spelling, 'sit');
});

test('pronoun "I" → "ai" (single-letter cap is dropped)', () => {
  // Per Nayana's no-caps-except-abbreviations rule, the pronoun "I"
  // lowercases. (To keep it as "AI" you'd have to type "AI" — all-caps,
  // length ≥ 2 is the only thing that survives.)
  assert.equal(rewrite('I').spelling, 'ai');
});

// ---- y → ai (when /aɪ/) ----------------------------------------------------

test('my → mai', () => {
  assert.equal(rewrite('my').spelling, 'mai');
});

test('sky → skai', () => {
  assert.equal(rewrite('sky').spelling, 'skai');
});

test('fly → flai', () => {
  assert.equal(rewrite('fly').spelling, 'flai');
});

test('cry → krai (c→k AND y→ai both fire)', () => {
  assert.equal(rewrite('cry').spelling, 'krai');
});

test('CRITICAL: yes is NOT rewritten (consonant y, phoneme /Y/)', () => {
  assert.equal(rewrite('yes').spelling, 'yes');
});

test('CRITICAL: happy is NOT rewritten (y aligns to /IY/, not /AY/)', () => {
  assert.equal(rewrite('happy').spelling, 'happy');
});

// ---- gh → ∅ (silent) — combined with i→ai/y→ai ----------------------------

test('CRITICAL: night → nait (i→ai AND gh→∅, no collision with nit)', () => {
  const r = rewrite('night');
  assert.equal(r.spelling, 'nait');
  assert.equal(r.replacements, 2);
});

test('light → lait', () => {
  assert.equal(rewrite('light').spelling, 'lait');
});

test('bright → brait', () => {
  assert.equal(rewrite('bright').spelling, 'brait');
});

test('high → hai', () => {
  assert.equal(rewrite('high').spelling, 'hai');
});

test('through → throu (no /aɪ/; only gh→∅ fires)', () => {
  assert.equal(rewrite('through').spelling, 'throu');
});

test('though → thou', () => {
  assert.equal(rewrite('though').spelling, 'thou');
});

test('bought → bout', () => {
  assert.equal(rewrite('bought').spelling, 'bout');
});

test('straight → strait (true homophone unification; ai is for /EY/ here, not affected)', () => {
  assert.equal(rewrite('straight').spelling, 'strait');
});

test('daughter → dauter', () => {
  assert.equal(rewrite('daughter').spelling, 'dauter');
});

test('caught → kaut (c→k AND gh→∅)', () => {
  const r = rewrite('caught');
  assert.equal(r.spelling, 'kaut');
  assert.equal(r.replacements, 2);
});

test('climb → klaim (c→k, mb→m, AND i→ai all fire)', () => {
  const r = rewrite('climb');
  assert.equal(r.spelling, 'klaim');
  assert.equal(r.replacements, 3);
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

test('phase 5 still applies phase 4: knife → naife (kn→n AND i→ai)', () => {
  // At phase 4 alone, knife → nife. At phase 5, the i→ai rule also fires
  // because knife's i aligns to /aɪ/ — so the phase-5 output is naife.
  assert.equal(rewrite('knife').spelling, 'naife');
});

test('phase 5 still rejects phase 1 exception: shepherd unchanged', () => {
  assert.equal(rewrite('shepherd').spelling, 'shepherd');
});
