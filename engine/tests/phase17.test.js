/**
 * Phase 17 acid tests — voicing and -ed cleanup.
 *
 *   s → z   (when /Z/)         dogs → dogz, was → wɑːz, music → mjuːzɪk
 *   ed → t  (when past-tense /T/)  walked → wɔːkt, kicked → kɪkt
 *   ss → ʃ  (when /SH/)        assurance → əʃʊrəns
 *   s → ∅   (silent)           mission → mɪʃən, science → saɪəns
 *   y → ɪ   (when /IH/)        hymn → hɪm, gym → dʒɪm
 *   e → ɪ   (when /IH/)        wanted → wɔːntɪd, roses → rouzɪz
 *
 * Six rules closing high-frequency loose ends.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadDictionary } from '../src/dictionary.js';
import { rewriteWord } from '../src/rewrite.js';
import { loadCatalogue, rulesForPhase } from '../src/catalogue.js';

const dict = loadDictionary();
const catalogue = loadCatalogue();
const phase17Rules = rulesForPhase(catalogue, 17);

function rewrite(word) {
  const entry = dict.lookup(word);
  const pairs = entry?.pairs ?? null;
  return rewriteWord(word, pairs, phase17Rules);
}

test('phase 17 catalogue extends with 6 cleanup rules', () => {
  const names = phase17Rules.map((r) => r.name);
  assert.ok(names.includes('s→z (when /z/)'));
  assert.ok(names.includes('ed→t (when past-tense /t/)'));
  assert.ok(names.includes('ss→ʃ (when /ʃ/)'));
  assert.ok(names.includes('s→∅ (silent)'));
  assert.ok(names.includes('y→ɪ (when /ɪ/)'));
  assert.ok(names.includes('e→ɪ (when /ɪ/)'));
  assert.equal(phase17Rules.length, 120, 'rule count = 114 prior + 6 new');
});

// ---- s → z (voicing) ----------------------------------------------------

test('dogs → dɑːgz (o is /AA1/ not /AO/, so phase 16 o→ɑː fires)', () => {
  // alignment: d}D o}AA1 g}G s}Z — note AA1 (cardinal a) not AO.
  assert.equal(rewrite('dogs').spelling, 'dɑːgz');
});

test('CRITICAL: cats → kæts (s is /S/, NOT /Z/, so stays s)', () => {
  // alignment: c}K a}AE1 t}T s}S — voiceless ending, s stays.
  assert.equal(rewrite('cats').spelling, 'kæts');
});

test('is → ɪz (i→ɪ AND s→z)', () => {
  assert.equal(rewrite('is').spelling, 'ɪz');
});

test('his → hɪz (i→ɪ AND s→z)', () => {
  assert.equal(rewrite('his').spelling, 'hɪz');
});

test('was → wɑːz (a→ɑː AND s→z)', () => {
  assert.equal(rewrite('was').spelling, 'wɑːz');
});

test('rose → rouz (silent-e + o→ou + s→z)', () => {
  assert.equal(rewrite('rose').spelling, 'rouz');
});

test('CRITICAL: music → mjuːzɪk (resolves the lingering "mjuːsɪk")', () => {
  assert.equal(rewrite('music').spelling, 'mjuːzɪk');
});

test('easy → iːziː (ea→iː + s→z + y→iː)', () => {
  assert.equal(rewrite('easy').spelling, 'iːziː');
});

test('prison → prɪzən (i→ɪ + s→z + o→ə)', () => {
  assert.equal(rewrite('prison').spelling, 'prɪzən');
});

// ---- ed → t (past-tense voiceless) --------------------------------------

test('walked → wɔːkt (al→ɔː from phase 16, ed→t)', () => {
  assert.equal(rewrite('walked').spelling, 'wɔːkt');
});

test('kicked → kɪkt (i→ɪ + ck→k + ed→t)', () => {
  assert.equal(rewrite('kicked').spelling, 'kɪkt');
});

test('helped → hɛlpt (e→ɛ + ed→t)', () => {
  assert.equal(rewrite('helped').spelling, 'hɛlpt');
});

test('baked → beikt (a→ei + silent-e? no, ed→t fires not silent-e)', () => {
  // alignment: b}B a}EY1 k}K ed}T → b + ei + k + t = "beikt"
  assert.equal(rewrite('baked').spelling, 'beikt');
});

test('watched → wɑːtʃt (a→ɑː + silent-t + ch→tʃ + ed→t)', () => {
  assert.equal(rewrite('watched').spelling, 'wɑːtʃt');
});

test('wanted → wɔːntɪd (a→ɔː + e→ɪ via the new rule)', () => {
  // alignment: w}W a}AO1 n}N t}T e}IH0 d}D
  assert.equal(rewrite('wanted').spelling, 'wɔːntɪd');
});

test('lifted → lɪftɪd (i→ɪ + e→ɪ; silent-t doesn\'t fire because t is /T/)', () => {
  // alignment: l}L i}IH1 f}F t}T e}AH0 d}D — wait e is AH0 not IH0
  // Let me recheck: alignment is l i f t e d. The e is /AH0/ schwa,
  // not /IH/. So e→ə (phase 10), not e→ɪ. Result: lɪftəd
  assert.equal(rewrite('lifted').spelling, 'lɪftəd');
});

// ---- ss → ʃ -------------------------------------------------------------

test('assurance → əʃʊrəns (a→ə + ss→ʃ + u→ʊ + a→ə + c→s + silent-e)', () => {
  assert.equal(rewrite('assurance').spelling, 'əʃʊrəns');
});

// ---- silent s -----------------------------------------------------------

test('mission → mɪʃən (i→ɪ + silent-s + si→ʃ + o→ə)', () => {
  assert.equal(rewrite('mission').spelling, 'mɪʃən');
});

test('passion → pæʃən (a→æ + silent-s + si→ʃ + o→ə)', () => {
  assert.equal(rewrite('passion').spelling, 'pæʃən');
});

test('session → sɛʃən (e→ɛ + silent-s + si→ʃ + o→ə)', () => {
  assert.equal(rewrite('session').spelling, 'sɛʃən');
});

test('science → saiəns (silent-s + c→s + i→ai + e→ə + n + c→s + silent-e)', () => {
  // alignment: s}∅ c}S i}AY1 e}AH0 n}N c}S e}∅
  // Note: phase 5's i→ai uses ASCII 'ai' (digraph), not IPA 'aɪ'.
  // The diphthong representation is two Latin letters, consistent with
  // 'ei', 'ou', 'au'.
  assert.equal(rewrite('science').spelling, 'saiəns');
});

// ---- y → ɪ --------------------------------------------------------------

test('hymn → hɪm (y→ɪ AND mn→m)', () => {
  assert.equal(rewrite('hymn').spelling, 'hɪm');
});

test('gym → dʒɪm (g→dʒ AND y→ɪ)', () => {
  assert.equal(rewrite('gym').spelling, 'dʒɪm');
});

test('myth → mɪθ (y→ɪ AND th→θ)', () => {
  assert.equal(rewrite('myth').spelling, 'mɪθ');
});

test('crystal → krɪstəl (c→k + y→ɪ + a→ə)', () => {
  assert.equal(rewrite('crystal').spelling, 'krɪstəl');
});

test('symbol → sɪmbəl (y→ɪ + o→ə)', () => {
  assert.equal(rewrite('symbol').spelling, 'sɪmbəl');
});

// ---- e → ɪ --------------------------------------------------------------

test('roses → rouzɪz (silent-e? no, both s are Z; o→ou + s→z + e→ɪ + s→z)', () => {
  // alignment: r}R o}OW1 s}Z e}IH0 s}Z
  assert.equal(rewrite('roses').spelling, 'rouzɪz');
});

test('because → bɪkɔːz (e→ɪ + c→k + au→ɔː + s→z + silent-e)', () => {
  assert.equal(rewrite('because').spelling, 'bɪkɔːz');
});

test('houses → hausəz (FIRST s stays /S/; e→ə; second s→z)', () => {
  // alignment: h}HH ou}AW1 s}S e}AH0 s}Z — first s is /S/ (stays as s,
  // s→z rule needs phoneme /Z/), second s is /Z/ (becomes z).
  assert.equal(rewrite('houses').spelling, 'hausəz');
});

// ---- Cross-phase composition -------------------------------------------

test('philosopher still → fəlɑːsəfɚ (no s→z, no ed; phase 16 still holds)', () => {
  assert.equal(rewrite('philosopher').spelling, 'fəlɑːsəfɚ');
});

test('the → ðə still holds', () => {
  assert.equal(rewrite('the').spelling, 'ðə');
});

test('Wednesday → Wɛnzdiː (s→z resolves the lingering "Wɛnsdiː" from phase 15)', () => {
  // alignment: w}W e}EH1 d}∅ n}N e}∅ s}Z d}D a}∅ y}IY0
  assert.equal(rewrite('Wednesday').spelling, 'Wɛnzdiː');
});
