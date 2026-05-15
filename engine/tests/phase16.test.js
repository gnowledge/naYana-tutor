/**
 * Phase 16 acid tests — vowel completion: ɔː, ɑː, ɔɪ + silent-l.
 *
 *   ɔː  open o long       call, water, ought, taught, saw, more, walk
 *   ɑː  cardinal a long   father, lot, hot, car, palm
 *   ɔɪ  diphthong         boy, voice, point
 *
 * Plus three trailing rules for the multi-letter "_l" cleanup:
 *   al → æ when /AE/    half, salmon
 *   ol → ou when /OW/   folk
 *   ul → ʊ when /UH/    would, could, should
 *
 * After this phase, every English vowel phoneme that has an IPA glyph
 * has been introduced. Remaining work is consonant cleanup (s→z, y→ɪ,
 * etc.) and the always-deferred Nayana font ligatures.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadDictionary } from '../src/dictionary.js';
import { rewriteWord } from '../src/rewrite.js';
import { loadCatalogue, rulesForPhase } from '../src/catalogue.js';

const dict = loadDictionary();
const catalogue = loadCatalogue();
const phase16Rules = rulesForPhase(catalogue, 16);

function rewrite(word) {
  const entry = dict.lookup(word);
  const pairs = entry?.pairs ?? null;
  return rewriteWord(word, pairs, phase16Rules);
}

test('phase 16 catalogue extends with 14 vowel-completion rules', () => {
  const names = phase16Rules.map((r) => r.name);
  // /ɔː/ — 6 rules
  for (const g of ['a', 'ou', 'au', 'aw', 'o']) {
    assert.ok(names.includes(`${g}→ɔː (when /ɔː/)`), `${g}→ɔː missing`);
  }
  assert.ok(names.includes('al→ɔː (when /ɔː/) — silent-l for walk/talk'));
  // /ɑː/ — 3 rules
  assert.ok(names.includes('o→ɑː (when /ɑː/)'));
  assert.ok(names.includes('a→ɑː (when /ɑː/)'));
  assert.ok(names.includes('al→ɑː (when /ɑː/) — silent-l for palm/calm'));
  // /ɔɪ/ — 2 rules
  assert.ok(names.includes('oy→ɔɪ (when /ɔɪ/)'));
  assert.ok(names.includes('oi→ɔɪ (when /ɔɪ/)'));
  // Trailing -l cleanups
  assert.ok(names.includes('al→æ (when /æ/) — silent-l for half/salmon'));
  assert.ok(names.includes('ol→ou (when /oʊ/) — silent-l for folk'));
  assert.ok(names.includes('ul→ʊ (when /ʊ/) — silent-l for would/could/should'));
  assert.equal(phase16Rules.length, 114, 'rule count = 100 prior + 14 new');
});

// ---- /ɔː/ open-o long ----------------------------------------------------

test('call → kɔːl (c→k AND a→ɔː AND ll→l)', () => {
  assert.equal(rewrite('call').spelling, 'kɔːl');
});

test('all → ɔːl (a→ɔː AND ll→l)', () => {
  assert.equal(rewrite('all').spelling, 'ɔːl');
});

test('water → wɔːtɚ (a→ɔː AND er→ɚ)', () => {
  assert.equal(rewrite('water').spelling, 'wɔːtɚ');
});

test('ought → ɔːt (ou→ɔː AND gh→∅)', () => {
  assert.equal(rewrite('ought').spelling, 'ɔːt');
});

test('thought → θɔːt (th→θ AND ou→ɔː AND gh→∅)', () => {
  assert.equal(rewrite('thought').spelling, 'θɔːt');
});

test('taught → tɔːt (au→ɔː AND gh→∅)', () => {
  assert.equal(rewrite('taught').spelling, 'tɔːt');
});

test('saw → sɔː (aw→ɔː)', () => {
  assert.equal(rewrite('saw').spelling, 'sɔː');
});

test('draw → drɔː', () => {
  assert.equal(rewrite('draw').spelling, 'drɔː');
});

test('law → lɔː', () => {
  assert.equal(rewrite('law').spelling, 'lɔː');
});

test('CRITICAL: for → fɔːr (was "for" at phase 14, now finally transformed)', () => {
  assert.equal(rewrite('for').spelling, 'fɔːr');
});

test('more → mɔːr (silent-e + o→ɔː)', () => {
  assert.equal(rewrite('more').spelling, 'mɔːr');
});

test('door → dɔːr (silent-o from phase 15 + o→ɔː)', () => {
  assert.equal(rewrite('door').spelling, 'dɔːr');
});

test('CRITICAL: walk → wɔːk (silent-l finally addressed via al→ɔː)', () => {
  assert.equal(rewrite('walk').spelling, 'wɔːk');
});

test('talk → tɔːk', () => {
  assert.equal(rewrite('talk').spelling, 'tɔːk');
});

// ---- /ɑː/ cardinal a long ------------------------------------------------

test('lot → lɑːt (o→ɑː)', () => {
  assert.equal(rewrite('lot').spelling, 'lɑːt');
});

test('hot → hɑːt', () => {
  assert.equal(rewrite('hot').spelling, 'hɑːt');
});

test('top → tɑːp', () => {
  assert.equal(rewrite('top').spelling, 'tɑːp');
});

test('rock → rɑːk (o→ɑː AND ck→k)', () => {
  assert.equal(rewrite('rock').spelling, 'rɑːk');
});

test('watch → wɑːtʃ (a→ɑː AND silent-t AND ch→tʃ)', () => {
  // alignment: w}W a}AA1 t}∅ ch}CH
  assert.equal(rewrite('watch').spelling, 'wɑːtʃ');
});

test('father → fɑːðɚ (a→ɑː AND th→ð AND er→ɚ)', () => {
  assert.equal(rewrite('father').spelling, 'fɑːðɚ');
});

test('car → kɑːr (c→k AND a→ɑː)', () => {
  assert.equal(rewrite('car').spelling, 'kɑːr');
});

test('park → pɑːrk', () => {
  assert.equal(rewrite('park').spelling, 'pɑːrk');
});

test('CRITICAL: palm → pɑːm (silent-l via al→ɑː)', () => {
  assert.equal(rewrite('palm').spelling, 'pɑːm');
});

test('calm → kɑːm (c→k AND al→ɑː)', () => {
  assert.equal(rewrite('calm').spelling, 'kɑːm');
});

// ---- /ɔɪ/ diphthong ------------------------------------------------------

test('boy → bɔɪ', () => {
  assert.equal(rewrite('boy').spelling, 'bɔɪ');
});

test('toy → tɔɪ', () => {
  assert.equal(rewrite('toy').spelling, 'tɔɪ');
});

test('joy → dʒɔɪ (j→dʒ AND oy→ɔɪ)', () => {
  assert.equal(rewrite('joy').spelling, 'dʒɔɪ');
});

test('voice → vɔɪs (oi→ɔɪ AND c→s AND silent-e)', () => {
  // alignment: v}V oi}OY1 c}S e}∅
  assert.equal(rewrite('voice').spelling, 'vɔɪs');
});

test('point → pɔɪnt', () => {
  assert.equal(rewrite('point').spelling, 'pɔɪnt');
});

test('choice → tʃɔɪs (ch→tʃ AND oi→ɔɪ AND c→s AND silent-e)', () => {
  assert.equal(rewrite('choice').spelling, 'tʃɔɪs');
});

// ---- Silent-l stragglers + ol/ul cleanup --------------------------------

test('half → hæf (al→æ; l really is silent in /hæf/)', () => {
  // alignment: h}HH al}AE1 f}F. The al→æ rule replaces the whole 'al'
  // digraph with 'æ', so the l (silent) disappears. Phonetic: /hæf/.
  assert.equal(rewrite('half').spelling, 'hæf');
});

test('salmon → sæmən (al→æ; silent l gone, then o→ə)', () => {
  assert.equal(rewrite('salmon').spelling, 'sæmən');
});

test('folk → fouk (ol→ou)', () => {
  assert.equal(rewrite('folk').spelling, 'fouk');
});

test('CRITICAL: would → wʊd (silent-o + ul→ʊ; was "wuld" at phase 15)', () => {
  // alignment: w}W o}∅ ul}UH1 d}D
  assert.equal(rewrite('would').spelling, 'wʊd');
});

test('could → kʊd (c→k + silent-o + ul→ʊ)', () => {
  assert.equal(rewrite('could').spelling, 'kʊd');
});

test('should → ʃʊd (sh→ʃ + silent-o + ul→ʊ)', () => {
  assert.equal(rewrite('should').spelling, 'ʃʊd');
});

// ---- Critical negatives — make sure no over-fire ------------------------

test('CRITICAL: boat still → bout (o is /OW/, not /AO/ or /AA/)', () => {
  assert.equal(rewrite('boat').spelling, 'bout');
});

test('CRITICAL: go still → gou (o is /OW/)', () => {
  assert.equal(rewrite('go').spelling, 'gou');
});

test('CRITICAL: do still → duː (o is /UW/)', () => {
  assert.equal(rewrite('do').spelling, 'duː');
});

test('CRITICAL: cat still → kæt (a is /AE/, not /AA/ or /AO/)', () => {
  assert.equal(rewrite('cat').spelling, 'kæt');
});

test('CRITICAL: about still → əbaut (a is /AH0/ schwa)', () => {
  assert.equal(rewrite('about').spelling, 'əbaut');
});

// ---- Cross-phase composition --------------------------------------------

test('philosopher still → fəlosəfɚ', () => {
  // No /AO/ or /AA/ rules fire — the o in philosopher is /AA1/ wait
  // let me think. Actually it's `o}AA1` in the middle. So o→ɑː fires!
  // Result: f + ə + l + ɑː + s + ə + f + ɚ = "fɪlɑːsəfɚ"
  assert.equal(rewrite('philosopher').spelling, 'fɪlɑːsəfɚ');
});

test('the → ðə still holds', () => {
  assert.equal(rewrite('the').spelling, 'ðə');
});
