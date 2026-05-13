/**
 * Phase 9 acid tests — the long-e family.
 *
 * Three rules: e → i, ea → i, y → i (all when phoneme is /IY/).
 * The 'ee' digraph is handled by combining phase 6's silent-e with the
 * new e→i rule (CMUdict aligns ee as e}∅ e}IY1).
 *
 * Critical negatives confirm the alignment correctly skips look-alikes:
 * 'the' (e is schwa /AH/), 'bed' (e is /EH/), 'head' (ea is /EH/),
 * 'great' (ea is /EY/, handled by phase 6).
 *
 * Known accepted collision: /iː/ → 'i' visually overlaps with /ɪ/ words.
 * 'beat' and 'bit' both end up spelled 'bit'. Documented in the catalogue.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadDictionary } from '../src/dictionary.js';
import { rewriteWord } from '../src/rewrite.js';
import { loadCatalogue, rulesForPhase } from '../src/catalogue.js';

const dict = loadDictionary();
const catalogue = loadCatalogue();
const phase9Rules = rulesForPhase(catalogue, 9);

function rewrite(word) {
  const entry = dict.lookup(word);
  const pairs = entry?.pairs ?? null;
  return rewriteWord(word, pairs, phase9Rules);
}

test('phase 9 catalogue extends through the long-e rules', () => {
  const names = phase9Rules.map((r) => r.name);
  assert.ok(names.includes('e→iː (when /iː/)'));
  assert.ok(names.includes('ea→iː (when /iː/)'));
  assert.ok(names.includes('i→iː (when /iː/)'));
  assert.ok(names.includes('y→iː (when /iː/)'));
  assert.equal(phase9Rules.length, 35, 'rule count = 31 prior + 4 new');
});

// ---- e → i (when /iː/) ----------------------------------------------------

test('be → bi', () => {
  assert.equal(rewrite('be').spelling, 'biː');
});

test('he → hi', () => {
  assert.equal(rewrite('he').spelling, 'hiː');
});

test('she → shi', () => {
  assert.equal(rewrite('she').spelling, 'shiː');
});

test('we → wi', () => {
  assert.equal(rewrite('we').spelling, 'wiː');
});

test('me → mi', () => {
  assert.equal(rewrite('me').spelling, 'miː');
});

test('complete → komplit (c→k AND e→i AND silent-e)', () => {
  assert.equal(rewrite('complete').spelling, 'kompliːt');
});

test('CRITICAL: the stays the (e is schwa /AH/)', () => {
  assert.equal(rewrite('the').spelling, 'the');
});

test('CRITICAL: bed stays bed (e is /EH/)', () => {
  assert.equal(rewrite('bed').spelling, 'bed');
});

// ---- ee handled by silent-e (phase 6) + e→i (phase 9) --------------------

test('see → si (silent-e on first e, e→i on second)', () => {
  // alignment: s}S e}∅ e}IY1
  assert.equal(rewrite('see').spelling, 'siː');
});

test('three → thri', () => {
  assert.equal(rewrite('three').spelling, 'thriː');
});

test('meet → mit', () => {
  assert.equal(rewrite('meet').spelling, 'miːt');
});

test('feet → fit', () => {
  assert.equal(rewrite('feet').spelling, 'fiːt');
});

test('feel → fil', () => {
  assert.equal(rewrite('feel').spelling, 'fiːl');
});

// ---- ea → i (when /iː/) ---------------------------------------------------

test('sea → si', () => {
  assert.equal(rewrite('sea').spelling, 'siː');
});

test('eat → it', () => {
  assert.equal(rewrite('eat').spelling, 'iːt');
});

test('team → tim', () => {
  assert.equal(rewrite('team').spelling, 'tiːm');
});

test('leaf → lif', () => {
  assert.equal(rewrite('leaf').spelling, 'liːf');
});

test('CRITICAL: meat → mit (true homophone unification with meet)', () => {
  // Both meet and meat become 'miːt' — the reform reveals what was
  // always a true homophone in spoken English.
  assert.equal(rewrite('meat').spelling, 'miːt');
});

test('head → had — the ea→i rule correctly skips, but a phase 6 quirk fires', () => {
  // Alignment is e}∅ a}EH1: Phonetisaurus made the e silent and the a
  // the vowel. So phase 6's silent-e drops the e, leaving 'had'. This
  // is the same pre-existing alignment quirk we see in bread→brad and
  // jealous→jalous. The ea→i rule of phase 9 correctly does NOT fire
  // (no 'ea' grapheme in the alignment) — but the result still looks
  // wrong because of the upstream alignment choice.
  assert.equal(rewrite('head').spelling, 'had');
});

test('CRITICAL: great → greit (ea is /EY/; phase 6 handles)', () => {
  assert.equal(rewrite('great').spelling, 'greit');
});

// ---- y → i (when /iː/) ----------------------------------------------------

test('happy → happi', () => {
  assert.equal(rewrite('happy').spelling, 'happiː');
});

test('lucky → lukki (ck→k AND y→i)', () => {
  // alignment: l}L u}AH1 ck}K y}IY0 → l + u + k + i = "luki"
  // Wait: ck→k makes the ck pair "k", not "kk". So result is "luki".
  assert.equal(rewrite('lucky').spelling, 'lukiː');
});

test('baby → beibi (a→ei from phase 6 AND y→i)', () => {
  assert.equal(rewrite('baby').spelling, 'beibiː');
});

test('crazy → kreizi (c→k, a→ei, AND y→i — three rules)', () => {
  const r = rewrite('crazy');
  assert.equal(r.spelling, 'kreiziː');
  assert.equal(r.replacements, 3);
});

test('money → moni (silent-e drops middle e, y→i)', () => {
  // alignment: m}M o}AH1 n}N e}∅ y}IY0
  assert.equal(rewrite('money').spelling, 'moniː');
});

test('key → ki (silent-e drops e, y→i; cleaner than phase 8 "ky")', () => {
  // At phase 7/8 key was "ky" because silent-e dropped the e and
  // we had no rule for y. At phase 9 the y→i rule makes it "ki".
  assert.equal(rewrite('key').spelling, 'kiː');
});

test('CRITICAL: yes stays yes (y is consonant /j/, phoneme is Y not IY)', () => {
  assert.equal(rewrite('yes').spelling, 'yes');
});

test('CRITICAL: my → mai (y is /AY/; phase 5 handles)', () => {
  assert.equal(rewrite('my').spelling, 'mai');
});

// ---- ie split (handled by phase 6 silent-e + bare i) ---------------------

test('chief → chif (silent-e from phase 6, i stays)', () => {
  // alignment: ch}CH i}IY1 e}∅ f}F → ch + i + "" + f = "chif"
  assert.equal(rewrite('chief').spelling, 'chiːf');
});

test('field → fild', () => {
  assert.equal(rewrite('field').spelling, 'fiːld');
});

// ---- bare i for /iː/ — already correct (no rule needed) -------------------

test('ski → skiː (i→iː adds the length marker)', () => {
  assert.equal(rewrite('ski').spelling, 'skiː');
});

test('machine → machin (silent-e drops, i stays, ch stays)', () => {
  // alignment: m}M a}AH0 ch}SH i}IY1 n}N e}∅
  // No rule yet for ch}SH; i stays as i; silent-e drops final e.
  assert.equal(rewrite('machine').spelling, 'machiːn');
});

// ---- Cross-phase composition ---------------------------------------------

test('phase 9 still applies phase 1: philosophy → filosofi (y→i too!)', () => {
  // Wait — philosophy ends with y. With phase 9 y→i it becomes
  // 'filosofiː' instead of 'filosofy'. The girl's filosafi finally
  // matches phonetically — full circle to the manifesto.
  assert.equal(rewrite('philosophy').spelling, 'filosofiː');
});

test('phase 9 still applies phase 7: ghost → goust', () => {
  assert.equal(rewrite('ghost').spelling, 'goust');
});

test('phase 9 still applies phase 8: through → thruː', () => {
  assert.equal(rewrite('through').spelling, 'thruː');
});
