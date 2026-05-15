/**
 * Phase 13 acid tests — the short vowels plus /dʒ/.
 *
 *   ɪ  U+026A   bit, sit, fish, this
 *   ʊ  U+028A   book, foot, put
 *   ɛ  U+025B   bed, head, said
 *   æ  U+00E6   cat, bat, black
 *   ʌ  U+028C   cup, run, love
 *   dʒ digraph  judge, age, bridge, gym
 *
 * Engine extension: "AH+" matches any stressed AH (AH1, AH2 — not AH0).
 * Used so u/o → ʌ doesn't collide with phase 10's schwa rule (AH0).
 *
 * Major cleanups via this phase:
 *   - eat (iːt) vs it (ɪt) — long/short i finally visually distinct
 *   - food (fuːd) vs foot (fʊt) — same for u
 *   - head → 'hɛd' (fixes the phase-6 alignment quirk)
 *   - bread → 'brɛd', many → 'mɛni'
 *   - said → 'sɛd' (resolves the phase-7 sighed/said collision)
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadDictionary } from '../src/dictionary.js';
import { rewriteWord, applyRuleToPairs } from '../src/rewrite.js';
import { loadCatalogue, rulesForPhase } from '../src/catalogue.js';

const dict = loadDictionary();
const catalogue = loadCatalogue();
const phase13Rules = rulesForPhase(catalogue, 13);

function rewrite(word) {
  const entry = dict.lookup(word);
  const pairs = entry?.pairs ?? null;
  return rewriteWord(word, pairs, phase13Rules);
}

test('phase 13 catalogue extends with 12 new rules', () => {
  const names = phase13Rules.map((r) => r.name);
  assert.ok(names.includes('i→ɪ (when /ɪ/)'));
  assert.ok(names.includes('oo→ʊ (when /ʊ/)'));
  assert.ok(names.includes('u→ʊ (when /ʊ/)'));
  assert.ok(names.includes('e→ɛ (when /ɛ/)'));
  assert.ok(names.includes('a→ɛ (when /ɛ/) — fixes the bread/head family'));
  assert.ok(names.includes('ai→ɛ (when /ɛ/) — fixes said/sighed'));
  assert.ok(names.includes('a→æ (when /æ/)'));
  assert.ok(names.includes('u→ʌ (when stressed /ʌ/)'));
  assert.ok(names.includes('o→ʌ (when stressed /ʌ/)'));
  assert.ok(names.includes('j→dʒ'));
  assert.ok(names.includes('g→dʒ (when /dʒ/)'));
  assert.ok(names.includes('dg→dʒ'));
  assert.equal(phase13Rules.length, 69, 'rule count = 57 prior + 12 new');
});

// ---- Engine extension: AH+ matches stressed AH only ----------------------

test('applyRuleToPairs: AH+ matches AH1', () => {
  const pair = { graphemes: 'u', phonemes: ['AH1'] };
  const rule = { from: 'u', to: 'ʌ', phoneme: 'AH+' };
  assert.equal(applyRuleToPairs([pair], rule).applied, true);
});

test('applyRuleToPairs: AH+ matches AH2', () => {
  const pair = { graphemes: 'u', phonemes: ['AH2'] };
  const rule = { from: 'u', to: 'ʌ', phoneme: 'AH+' };
  assert.equal(applyRuleToPairs([pair], rule).applied, true);
});

test('applyRuleToPairs: AH+ does NOT match AH0 (schwa)', () => {
  const pair = { graphemes: 'u', phonemes: ['AH0'] };
  const rule = { from: 'u', to: 'ʌ', phoneme: 'AH+' };
  assert.equal(applyRuleToPairs([pair], rule).applied, false);
});

// ---- /ɪ/ short-i ---------------------------------------------------------

test('bit → bɪt', () => {
  assert.equal(rewrite('bit').spelling, 'bɪt');
});

test('sit → sɪt', () => {
  assert.equal(rewrite('sit').spelling, 'sɪt');
});

test('it → ɪt', () => {
  assert.equal(rewrite('it').spelling, 'ɪt');
});

test('CRITICAL: eat (iːt) vs it (ɪt) — long/short i now distinct', () => {
  assert.equal(rewrite('eat').spelling, 'iːt');
  assert.equal(rewrite('it').spelling, 'ɪt');
});

test('this → ðɪs (th→ð AND i→ɪ)', () => {
  assert.equal(rewrite('this').spelling, 'ðɪs');
});

test('fish → fɪʃ', () => {
  assert.equal(rewrite('fish').spelling, 'fɪʃ');
});

// ---- /ʊ/ short-oo --------------------------------------------------------

test('book → bʊk', () => {
  assert.equal(rewrite('book').spelling, 'bʊk');
});

test('foot → fʊt', () => {
  assert.equal(rewrite('foot').spelling, 'fʊt');
});

test('CRITICAL: food (fuːd) vs foot (fʊt) — long/short u now distinct', () => {
  assert.equal(rewrite('food').spelling, 'fuːd');
  assert.equal(rewrite('foot').spelling, 'fʊt');
});

test('put → pʊt', () => {
  assert.equal(rewrite('put').spelling, 'pʊt');
});

// ---- /ɛ/ short-e ---------------------------------------------------------

test('bed → bɛd', () => {
  assert.equal(rewrite('bed').spelling, 'bɛd');
});

test('red → rɛd', () => {
  assert.equal(rewrite('red').spelling, 'rɛd');
});

test('CRITICAL: head → hɛd (fixes the phase-6 bread/head alignment quirk)', () => {
  // Previously: head → had (silent-e drops first e, stranded a). Now:
  // a → ɛ when /EH/ catches the stranded a. Result: hɛd.
  assert.equal(rewrite('head').spelling, 'hɛd');
});

test('bread → brɛd (same fix)', () => {
  assert.equal(rewrite('bread').spelling, 'brɛd');
});

test('CRITICAL: said → sɛd (fixes the phase-7 sighed/said collision)', () => {
  // Previously: said stayed 'said', sighed → 'said' (collision). Now:
  // ai → ɛ when /EH/ makes said → sɛd. sighed stays as 'said' (the
  // intended spelling for /saɪd/).
  assert.equal(rewrite('said').spelling, 'sɛd');
  assert.equal(rewrite('sighed').spelling, 'said');
});

// ---- /æ/ short-a ---------------------------------------------------------

test('cat → kæt (c→k AND a→æ)', () => {
  assert.equal(rewrite('cat').spelling, 'kæt');
});

test('bat → bæt', () => {
  assert.equal(rewrite('bat').spelling, 'bæt');
});

test('black → blæk (a→æ AND ck→k)', () => {
  assert.equal(rewrite('black').spelling, 'blæk');
});

// ---- /ʌ/ stressed --------------------------------------------------------

test('cup → kʌp (c→k AND u→ʌ)', () => {
  assert.equal(rewrite('cup').spelling, 'kʌp');
});

test('run → rʌn', () => {
  assert.equal(rewrite('run').spelling, 'rʌn');
});

test('sun → sʌn', () => {
  assert.equal(rewrite('sun').spelling, 'sʌn');
});

test('love → lʌv (o→ʌ AND silent-e)', () => {
  assert.equal(rewrite('love').spelling, 'lʌv');
});

test('done → dʌn', () => {
  assert.equal(rewrite('done').spelling, 'dʌn');
});

test('some → sʌm', () => {
  assert.equal(rewrite('some').spelling, 'sʌm');
});

test('CRITICAL: schwa stays schwa (AH+ does NOT collide with AH0)', () => {
  // 'about' alignment: a}AH0 b}B ou}AW1 t}T — first a is AH0 (schwa).
  // Phase 10 a→ə fires; phase 13 a→ʌ rule has phoneme "AH+" so it
  // doesn't fire here. Result: əbaut, not ʌbaut.
  assert.equal(rewrite('about').spelling, 'əbaut');
});

// ---- /dʒ/ ---------------------------------------------------------------

test('judge → dʒʌdʒ (j→dʒ AND u→ʌ AND dg→dʒ AND silent-e)', () => {
  // alignment: j}JH u}AH1 dg}JH e}∅
  assert.equal(rewrite('judge').spelling, 'dʒʌdʒ');
});

test('age → eidʒ (a→ei AND g→dʒ AND silent-e)', () => {
  // alignment: a}EY1 g}JH e}∅
  assert.equal(rewrite('age').spelling, 'eidʒ');
});

test('bridge → brɪdʒ (i→ɪ AND dg→dʒ AND silent-e)', () => {
  assert.equal(rewrite('bridge').spelling, 'brɪdʒ');
});

test('gym → dʒɪm (g→dʒ AND y→? — y is /IH/, no rule yet)', () => {
  // alignment: g}JH y}IH1 m}M
  // g→dʒ fires. y stays as y because we don't have y→ɪ for /IH/.
  // (Phase 5 y→ai is for /AY/; phase 9 y→iː is for /IY/.)
  // Result: dʒym.
  assert.equal(rewrite('gym').spelling, 'dʒym');
});

test('jump → dʒʌmp (j→dʒ AND u→ʌ)', () => {
  assert.equal(rewrite('jump').spelling, 'dʒʌmp');
});

// ---- Cross-phase composition --------------------------------------------

test('the → ðə (phase 11+10 still hold)', () => {
  assert.equal(rewrite('the').spelling, 'ðə');
});

test('about → əbaut (phase 10 still holds)', () => {
  assert.equal(rewrite('about').spelling, 'əbaut');
});

test('philosophy → fəlosəfiː (still holds; no short-vowel rules fire)', () => {
  // alignment: ph}F i}AH0 l}L o}AA1 s}S o}AH0 ph}F y}IY0
  // First i is AH0 (already → ə by phase 10). o}AA1 not /AH+/, stays.
  assert.equal(rewrite('philosophy').spelling, 'fəlosəfiː');
});

test('English → eŋglɪʃ (init-cap dropped; i→ɪ)', () => {
  assert.equal(rewrite('English').spelling, 'eŋglɪʃ');
});

test('thinking → θɪŋkɪŋ (think now adds i→ɪ; also -ing has its own i)', () => {
  assert.equal(rewrite('thinking').spelling, 'θɪŋkɪŋ');
});
