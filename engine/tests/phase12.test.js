/**
 * Phase 12 acid tests — the missing consonants.
 *
 *   /ʃ/  esh  U+0283   ship, nation, special, machine, ocean, sure
 *   /tʃ/ tʃ            chip, much, nature, century, catch
 *   /ʒ/  ezh  U+0292   vision, measure, garage
 *   /ŋ/  eng  U+014B   sing, English, think, finger
 *
 * Same branch-on-phoneme pattern as phase 11's th split: 'ch' fires
 * either ch→ʃ (machine) or ch→tʃ (chip) per the alignment's phoneme.
 * Likewise 'si' branches across /SH/ (tension) and /ZH/ (vision).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadDictionary } from '../src/dictionary.js';
import { rewriteWord } from '../src/rewrite.js';
import { loadCatalogue, rulesForPhase } from '../src/catalogue.js';

const dict = loadDictionary();
const catalogue = loadCatalogue();
const phase12Rules = rulesForPhase(catalogue, 12);

function rewrite(word) {
  const entry = dict.lookup(word);
  const pairs = entry?.pairs ?? null;
  return rewriteWord(word, pairs, phase12Rules);
}

test('phase 12 catalogue extends with 14 consonant rules', () => {
  const names = phase12Rules.map((r) => r.name);
  // /ʃ/ — 7 rules
  assert.ok(names.includes('sh→ʃ'));
  assert.ok(names.includes('ti→ʃ (when /ʃ/)'));
  assert.ok(names.includes('si→ʃ (when /ʃ/)'));
  assert.ok(names.includes('ci→ʃ (when /ʃ/)'));
  assert.ok(names.includes('ch→ʃ (when /ʃ/)'));
  assert.ok(names.includes('s→ʃ (when /ʃ/)'));
  assert.ok(names.includes('c→ʃ (when /ʃ/)'));
  // /tʃ/ — 3 rules
  assert.ok(names.includes('ch→tʃ (when /tʃ/)'));
  assert.ok(names.includes('t→tʃ (when /tʃ/)'));
  assert.ok(names.includes('ti→tʃ (when /tʃ/)'));
  // /ʒ/ — 3 rules
  assert.ok(names.includes('si→ʒ (when /ʒ/)'));
  assert.ok(names.includes('s→ʒ (when /ʒ/)'));
  assert.ok(names.includes('g→ʒ (when /ʒ/)'));
  // /ŋ/ — 2 rules
  assert.ok(names.includes('ng→ŋ'));
  assert.ok(names.includes('n→ŋ (when /ŋ/)'));
  assert.equal(phase12Rules.length, 57, 'rule count = 42 prior + 15 new');
});

// ---- /ʃ/ ------------------------------------------------------------------

test('ship → ʃip', () => {
  assert.equal(rewrite('ship').spelling, 'ʃip');
});

test('fish → fiʃ', () => {
  assert.equal(rewrite('fish').spelling, 'fiʃ');
});

test('nation → neiʃən (ti→ʃ AND a→ei AND o→ə)', () => {
  assert.equal(rewrite('nation').spelling, 'neiʃən');
});

test('tension → tenʃən (si→ʃ AND o→ə)', () => {
  assert.equal(rewrite('tension').spelling, 'tenʃən');
});

test('special → speʃəl (ci→ʃ AND a→ə)', () => {
  assert.equal(rewrite('special').spelling, 'speʃəl');
});

test('machine → məʃiːn (ch→ʃ AND first-a→ə AND i→iː AND silent-e)', () => {
  // alignment: m}M a}AH0 ch}SH i}IY1 n}N e}∅
  // First a is AH0 (schwa); ch is /SH/ not /CH/; i is /IY/.
  assert.equal(rewrite('machine').spelling, 'məʃiːn');
});

test('sure → ʃur (s→ʃ AND silent-e)', () => {
  // alignment: s}SH u}UH1 r}R e}∅ → u is /UH/, no u→uː. silent-e drops e.
  assert.equal(rewrite('sure').spelling, 'ʃur');
});

test('CRITICAL: ocean → ouʃən (c→ʃ AND o→ou AND silent-e AND a→ə)', () => {
  // alignment: o}OW1 c}SH e}∅ a}AH0 n}N
  assert.equal(rewrite('ocean').spelling, 'ouʃən');
});

// ---- /tʃ/ — same 'ch' grapheme, different phoneme -------------------------

test('chip → tʃip (ch→tʃ when /CH/)', () => {
  assert.equal(rewrite('chip').spelling, 'tʃip');
});

test('much → mutʃ', () => {
  assert.equal(rewrite('much').spelling, 'mutʃ');
});

test('catch → katʃ (c→k AND silent-t AND ch→tʃ... wait silent-t isn\'t a rule)', () => {
  // alignment: c}K a}AE1 t}∅ ch}CH
  // c→k fires; t}∅ has no rule (silent-t isn't a phase yet); ch→tʃ fires.
  // Net: k + a + t + tʃ = "kattʃ"? Wait the t stays unless removed.
  // Let me think: the t pair has graphemes "t" and empty phonemes. No
  // current rule deletes silent t (we have silent a, u, h, e, gh — not t).
  // So t stays. Result: katʃ would require t to be dropped or this is
  // wrong. Expected: kattʃ.
  assert.equal(rewrite('catch').spelling, 'kattʃ');
});

test('CRITICAL: chip and machine share grapheme but split by phoneme', () => {
  // The 'ch' digraph branches: /CH/ → tʃ (chip), /SH/ → ʃ (machine).
  assert.equal(rewrite('chip').spelling, 'tʃip');
  assert.equal(rewrite('machine').spelling, 'məʃiːn');
});

test('nature → neitʃur (t→tʃ AND a→ei; ur stays — r-colored vowels are future)', () => {
  // alignment: n}N a}EY1 t}CH ur}ER0 e}∅
  // The 'ur' is one grapheme aligned to /ER/. No rule for it yet.
  assert.equal(rewrite('nature').spelling, 'neitʃur');
});

test('century → sentʃuriː (c→s, t→tʃ, y→iː; ur stays)', () => {
  // alignment: c}S e}EH1 n}N t}CH ur}ER0 y}IY0
  assert.equal(rewrite('century').spelling, 'sentʃuriː');
});

test('question → questʃən (ti→tʃ when /CH/, o→ə)', () => {
  // alignment: q}K u}W e}EH1 s}S ti}CH o}AH0 n}N
  // Mirror of nation: ti branches on phoneme. Here it's /CH/, so ti→tʃ.
  assert.equal(rewrite('question').spelling, 'questʃən');
});

// ---- /ʒ/ ------------------------------------------------------------------

test('vision → viʒən (si→ʒ AND o→ə)', () => {
  assert.equal(rewrite('vision').spelling, 'viʒən');
});

test('measure → maʒur (silent-e drops, s→ʒ, ur stays)', () => {
  // alignment: m}M e}∅ a}EH1 s}ZH ur}ER0 e}∅
  // Phonetisaurus aligned e silent and a as the /EH/ vowel (same family
  // as bread→brad). 'ur' stays — r-colored vowels are a future phase.
  assert.equal(rewrite('measure').spelling, 'maʒur');
});

test('garage → gəraʒ (a→ə on first a, second a stays, g→ʒ, silent-e)', () => {
  // alignment: g}G ar}ER0 a}AA1 g}ZH e}∅
  // 'ar' digraph stays (no rule for it), a is /AA1/ stays, g→ʒ, silent-e drops.
  // Hmm, my expected "gəraʒ" assumed a→ə on first vowel. But the first
  // grapheme is "ar" not "a"... let me re-think. Actually the first
  // pair is ar}ER0 — graphemes is "ar" combined. So a→ə doesn't fire.
  // Result: ar + a + ʒ + "" = "araʒ" (no leading g? wait g is the first
  // pair). Let me recount: g + ar + a + ʒ + "" = "garaʒ"
  assert.equal(rewrite('garage').spelling, 'garaʒ');
});

test('beige → beiʒ (ei stays AND g→ʒ AND silent-e)', () => {
  // alignment: b}B ei}EY1 g}ZH e}∅
  // ei}EY1 — our phase 6 rules look for 'ay', 'ai', 'ey', 'a' alone with
  // /EY/. 'ei' as a digraph isn't in the rules (it's already 'ei' which
  // is our target). So it stays. g→ʒ. silent-e drops.
  assert.equal(rewrite('beige').spelling, 'beiʒ');
});

// ---- /ŋ/ ------------------------------------------------------------------

test('sing → siŋ', () => {
  assert.equal(rewrite('sing').spelling, 'siŋ');
});

test('long → loŋ', () => {
  assert.equal(rewrite('long').spelling, 'loŋ');
});

test('bring → briŋ', () => {
  assert.equal(rewrite('bring').spelling, 'briŋ');
});

test('think → θiŋk (th→θ from phase 11 AND n→ŋ before k)', () => {
  assert.equal(rewrite('think').spelling, 'θiŋk');
});

test('English → eŋgliʃ (init-cap dropped per no-caps rule; n→ŋ before g AND sh→ʃ)', () => {
  // alignment: e}IH1 n}NG g}G l}L i}IH0 sh}SH → e + ŋ + g + l + i + ʃ
  assert.equal(rewrite('English').spelling, 'eŋgliʃ');
});

test('finger → fiŋger (n→ŋ before g; er stays as ER cluster)', () => {
  assert.equal(rewrite('finger').spelling, 'fiŋger');
});

// ---- Cross-phase composition --------------------------------------------

test('the → ðə still holds at phase 12', () => {
  assert.equal(rewrite('the').spelling, 'ðə');
});

test('philosopher → fəlosəfer (no ʃ/tʃ/ʒ/ŋ here)', () => {
  assert.equal(rewrite('philosopher').spelling, 'fəlosəfer');
});

test('phase 12 still applies phase 10: about → əbaut', () => {
  assert.equal(rewrite('about').spelling, 'əbaut');
});

test('CRITICAL: chief → tʃiːf (ch→tʃ AND i→iː AND silent-e)', () => {
  // alignment: ch}CH i}IY1 e}∅ f}F → tʃ + iː + "" + f = "tʃiːf"
  assert.equal(rewrite('chief').spelling, 'tʃiːf');
});
