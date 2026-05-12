/**
 * Phase 6 acid tests — the long-a family.
 *
 * Phase 6 unifies five different spellings of /eɪ/ to a single 'ei',
 * and removes silent e wherever Phonetisaurus marks it as unpronounced.
 * The silent-e rule is bundled because most a-as-/eɪ/ words use the
 * "a...e" pattern and would leave a useless trailing letter otherwise.
 *
 * Critical negatives confirm the alignment-based engine correctly
 * skips look-alikes: 'cat' (a is /AE/), 'said' (ai is /EH/), 'be'
 * (e is pronounced), 'money' (e silent + y separate, not 'ey' digraph).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadDictionary } from '../src/dictionary.js';
import { rewriteWord } from '../src/rewrite.js';
import { loadCatalogue, rulesForPhase } from '../src/catalogue.js';

const dict = loadDictionary();
const catalogue = loadCatalogue();
const phase6Rules = rulesForPhase(catalogue, 6);

function rewrite(word) {
  const entry = dict.lookup(word);
  const pairs = entry?.pairs ?? null;
  return rewriteWord(word, pairs, phase6Rules);
}

test('phase 6 catalogue extends through e→∅ and the four /eɪ/ rules', () => {
  const names = phase6Rules.map((r) => r.name);
  assert.deepEqual(names, [
    'ph→f', 'c→k', 'c→s', 'cc→k', 'ck→k',
    'kn→n', 'wr→r', 'mb→m',
    'i→ai (when /aɪ/)', 'y→ai (when /aɪ/)', 'gh→∅', 'gh→f',
    'a→ei (when /eɪ/)', 'ay→ei (when /eɪ/)', 'ai→ei (when /eɪ/)',
    'ey→ei (when /eɪ/)', 'e→∅',
  ]);
});

// ---- a → ei (when /eɪ/) ----------------------------------------------------

test('paper → peiper', () => {
  assert.equal(rewrite('paper').spelling, 'peiper');
});

test('data → deita (only first a fires; second is /AH/)', () => {
  assert.equal(rewrite('data').spelling, 'deita');
});

test('CRITICAL: cat is NOT rewritten (a is /AE/) — only c→k fires', () => {
  // cat alignment: c}K a}AE1 t}T. c→k fires (phase 2), a→ei does not.
  assert.equal(rewrite('cat').spelling, 'kat');
});

test('CRITICAL: about is NOT rewritten by a→ei (a is /AH/ schwa)', () => {
  assert.equal(rewrite('about').spelling, 'about');
});

// ---- ay → ei ---------------------------------------------------------------

test('day → dei', () => {
  assert.equal(rewrite('day').spelling, 'dei');
});

test('play → plei', () => {
  assert.equal(rewrite('play').spelling, 'plei');
});

test('away → awei', () => {
  assert.equal(rewrite('away').spelling, 'awei');
});

// ---- ai → ei ---------------------------------------------------------------

test('rain → rein', () => {
  assert.equal(rewrite('rain').spelling, 'rein');
});

test('train → trein', () => {
  assert.equal(rewrite('train').spelling, 'trein');
});

test('CRITICAL: said is NOT rewritten (ai is /EH/, not /EY/)', () => {
  assert.equal(rewrite('said').spelling, 'said');
});

test('CRITICAL: again is NOT rewritten (ai is /EH/)', () => {
  assert.equal(rewrite('again').spelling, 'again');
});

// ---- ey → ei ---------------------------------------------------------------

test('they → thei', () => {
  assert.equal(rewrite('they').spelling, 'thei');
});

test('grey → grei', () => {
  assert.equal(rewrite('grey').spelling, 'grei');
});

test('CRITICAL: money → mony (silent-e fires; ey rule does not, alignment is split)', () => {
  // alignment: m}M o}AH1 n}N e}∅ y}IY0
  // e→∅ fires on the silent e; ey→ei doesn't because no 'ey' pair exists.
  assert.equal(rewrite('money').spelling, 'mony');
});

test('CRITICAL: key → ky (same reason as money)', () => {
  assert.equal(rewrite('key').spelling, 'ky');
});

// ---- e → ∅ (silent-e) ------------------------------------------------------

test('give → giv', () => {
  assert.equal(rewrite('give').spelling, 'giv');
});

test('have → hav', () => {
  assert.equal(rewrite('have').spelling, 'hav');
});

test('great → greit (silent leading e + a→ei)', () => {
  // alignment: g}G r}R e}∅ a}EY1 t}T
  assert.equal(rewrite('great').spelling, 'greit');
});

test('break → breik (silent leading e + a→ei)', () => {
  assert.equal(rewrite('break').spelling, 'breik');
});

test('CRITICAL: be is NOT rewritten (e is pronounced /IY/)', () => {
  assert.equal(rewrite('be').spelling, 'be');
});

test('CRITICAL: she is NOT rewritten', () => {
  assert.equal(rewrite('she').spelling, 'she');
});

// ---- a→ei + silent-e composition (the canonical pattern) -------------------

test('face → feis (a→ei AND silent-e AND c→s all fire)', () => {
  const r = rewrite('face');
  assert.equal(r.spelling, 'feis');
  assert.equal(r.replacements, 3);
});

test('make → meik', () => {
  assert.equal(rewrite('make').spelling, 'meik');
});

test('cake → keik (c→k AND a→ei AND silent-e)', () => {
  assert.equal(rewrite('cake').spelling, 'keik');
});

test('name → neim', () => {
  assert.equal(rewrite('name').spelling, 'neim');
});

test('lake → leik', () => {
  assert.equal(rewrite('lake').spelling, 'leik');
});

// ---- Cross-phase composition with earlier phases ---------------------------

test('phase 6 cleans up phase 5: knife → naif (was naife at phase 5)', () => {
  // At phase 5: kn→n, i→ai gave 'naife'. At phase 6, silent-e drops
  // the trailing e for a clean 'naif'.
  assert.equal(rewrite('knife').spelling, 'naif');
});

test('phase 6 cleans up phase 5: die → dai (was daie)', () => {
  assert.equal(rewrite('die').spelling, 'dai');
});

test('phase 6 cleans up phase 5: type → taip (was taipe)', () => {
  assert.equal(rewrite('type').spelling, 'taip');
});

test('climbed → klaimd (c→k, mb→m, i→ai, silent-e all fire)', () => {
  // climbed alignment: c}K l}L i}AY1 mb}M e}∅ d}D — four rules fire,
  // four substitutions. Note CMUdict's alignment splits the past-tense
  // -ed here as e}∅ + d}D (silent e + d), so the silent-e rule applies.
  // Other -ed verbs (walked, kicked) align as ed}T and are untouched.
  const r = rewrite('climbed');
  assert.equal(r.spelling, 'klaimd');
  assert.equal(r.replacements, 4);
});

test('phase 6 still applies phase 1: philosophy → filosofy', () => {
  assert.equal(rewrite('philosophy').spelling, 'filosofy');
});

test('phase 6 still rejects phase 1 exception: shepherd unchanged', () => {
  assert.equal(rewrite('shepherd').spelling, 'shepherd');
});
