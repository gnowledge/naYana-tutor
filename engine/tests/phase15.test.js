/**
 * Phase 15 acid tests — the spelling cleanup landmark.
 *
 *   9 geminate-collapse rules:    mm nn ll tt pp ss ff rr dd → single
 *   4 silent-letter epsilon rules: t o w d
 *   2 multi-letter silent rules:  bt → t, mn → m
 *   5 small wins:                 f→v, wh→h, x→ks, x→gz, uː→yuː
 *
 * Skipped (require future vowel intros): silent-l (walk, talk, half).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadDictionary } from '../src/dictionary.js';
import { rewriteWord } from '../src/rewrite.js';
import { loadCatalogue, rulesForPhase } from '../src/catalogue.js';

const dict = loadDictionary();
const catalogue = loadCatalogue();
const phase15Rules = rulesForPhase(catalogue, 15);

function rewrite(word) {
  const entry = dict.lookup(word);
  const pairs = entry?.pairs ?? null;
  return rewriteWord(word, pairs, phase15Rules);
}

test('phase 15 catalogue extends with 21 cleanup rules', () => {
  const names = phase15Rules.map((r) => r.name);
  // Geminates
  for (const c of ['mm', 'nn', 'll', 'tt', 'pp', 'ss', 'ff', 'rr', 'dd']) {
    assert.ok(names.includes(`${c}→${c[0]}`), `${c}→${c[0]} missing`);
  }
  // Silents (5 epsilon rules + 2 multi-letter)
  assert.ok(names.includes('t→∅ (silent)'));
  assert.ok(names.includes('o→∅ (silent)'));
  assert.ok(names.includes('w→∅ (silent)'));
  assert.ok(names.includes('d→∅ (silent)'));
  assert.ok(names.includes('r→∅ (silent)'));
  assert.ok(names.includes('bt→t (silent b)'));
  assert.ok(names.includes('mn→m (silent n)'));
  // Small wins
  assert.ok(names.includes('f→v (when /v/)'));
  assert.ok(names.includes('wh→h (when /h/)'));
  assert.ok(names.includes('x→ks (when /k/)'));
  assert.ok(names.includes('x→gz (when /g/)'));
  assert.ok(names.includes('uː→yuː (when /j/+/uː/)'));
  assert.equal(phase15Rules.length, 100, 'rule count = 79 prior + 21 new');
});

// ---- Geminates ----------------------------------------------------------

test('summer → sʌmɚ (mm collapses)', () => {
  assert.equal(rewrite('summer').spelling, 'sʌmɚ');
});

test('running → rʌnɪŋ (nn collapses, ng→ŋ, i→ɪ)', () => {
  assert.equal(rewrite('running').spelling, 'rʌnɪŋ');
});

test('dollar → dolɚ (ll collapses)', () => {
  assert.equal(rewrite('dollar').spelling, 'dolɚ');
});

test('letter → lɛtɚ (tt collapses, e→ɛ, er→ɚ)', () => {
  assert.equal(rewrite('letter').spelling, 'lɛtɚ');
});

test('happy → hæpiː (pp collapses, a→æ, y→iː)', () => {
  assert.equal(rewrite('happy').spelling, 'hæpiː');
});

test('miss → mɪs (ss collapses)', () => {
  assert.equal(rewrite('miss').spelling, 'mɪs');
});

test('off → of (ff collapses)', () => {
  assert.equal(rewrite('off').spelling, 'of');
});

test('carry → kæriː (c→k, rr collapses, a→æ, y→iː)', () => {
  assert.equal(rewrite('carry').spelling, 'kæriː');
});

test('add → æd (dd collapses)', () => {
  assert.equal(rewrite('add').spelling, 'æd');
});

// ---- Silent letters -----------------------------------------------------

test('catch → kætʃ (silent-t before tʃ)', () => {
  assert.equal(rewrite('catch').spelling, 'kætʃ');
});

test('watch → watʃ (silent-t)', () => {
  // 'watch' alignment: w}W a}AA1 t}∅ ch}CH — the a is /AA1/, no rule
  // for /AA/ yet. So a stays as a. silent-t drops, ch→tʃ. Result: watʃ.
  assert.equal(rewrite('watch').spelling, 'watʃ');
});

test('listen → lɪsən (silent-t)', () => {
  // alignment: l}L i}IH1 s}S t}∅ e}AH0 n}N
  assert.equal(rewrite('listen').spelling, 'lɪsən');
});

test('often → ofən (silent-t)', () => {
  // alignment: o}AO1 f}F t}∅ e}AH0 n}N — o is /AO/, stays as o.
  assert.equal(rewrite('often').spelling, 'ofən');
});

test('two → tuː (silent-w)', () => {
  // alignment: t}T w}∅ o}UW1 — silent-w drops, o→uː from phase 8.
  assert.equal(rewrite('two').spelling, 'tuː');
});

test('answer → ænsɚ (silent-w)', () => {
  assert.equal(rewrite('answer').spelling, 'ænsɚ');
});

test('door → dor (silent-o; second o stays AO1)', () => {
  // alignment: d}D o}∅ o}AO1 r}R — first o silent (drops), second
  // stays as o (no AO rule), r stays. Result: dor.
  assert.equal(rewrite('door').spelling, 'dor');
});

test('Wednesday → Wɛnsdiː (silent-d AND silent-e; s stays s pending future s→z)', () => {
  // alignment: w}W e}EH1 d}∅ n}N e}∅ s}Z d}D a}∅ y}IY0
  // s is /Z/ but no s→z rule yet, so s stays.
  assert.equal(rewrite('Wednesday').spelling, 'Wɛnsdiː');
});

test('handsome → hænsəm (silent-d)', () => {
  // alignment: h}HH a}AE1 n}N d}∅ s}S o}AH0 m}M e}∅
  // a→æ, silent-d, o→ə, silent-e
  assert.equal(rewrite('handsome').spelling, 'hænsəm');
});

// ---- Multi-letter silent ------------------------------------------------

test('doubt → daut (bt→t silent-b)', () => {
  // alignment: d}D ou}AW1 bt}T → d + au + t = "daut"
  assert.equal(rewrite('doubt').spelling, 'daut');
});

test('debt → dɛt (bt→t)', () => {
  assert.equal(rewrite('debt').spelling, 'dɛt');
});

test('hymn → hym (mn→m; y stays y because no y→ɪ for /IH/ yet)', () => {
  // alignment: h}HH y}IH1 mn}M — mn→m fires, y stays as y (vowel-y
  // for /IH/ is uncovered; would need a future rule).
  assert.equal(rewrite('hymn').spelling, 'hym');
});

test('column → koləm (mn→m)', () => {
  assert.equal(rewrite('column').spelling, 'koləm');
});

// ---- Small wins ---------------------------------------------------------

test('CRITICAL: of → ʌv (f→v when /V/)', () => {
  assert.equal(rewrite('of').spelling, 'ʌv');
});

test('CRITICAL: whole → houl (wh→h, o→ou, silent-e; unifies with hole)', () => {
  assert.equal(rewrite('whole').spelling, 'houl');
});

test('CRITICAL: who → huː (wh→h, o→uː from phase 8)', () => {
  assert.equal(rewrite('who').spelling, 'huː');
});

test('box → boks (x→ks)', () => {
  assert.equal(rewrite('box').spelling, 'boks');
});

test('six → sɪks (x→ks AND i→ɪ)', () => {
  assert.equal(rewrite('six').spelling, 'sɪks');
});

test('exit → ɛgzɪt (x→gz AND e→ɛ AND i→ɪ)', () => {
  assert.equal(rewrite('exit').spelling, 'ɛgzɪt');
});

test('CRITICAL: use → yuːs (uː→yuː after phase 8)', () => {
  // alignment: u}Y|UW1 s}S e}∅
  // Phase 8 u→uː fires (UW present): graphemes "uː", phonemes still [Y, UW1].
  // Phase 15 uː→yuː fires (Y present): graphemes "yuː".
  // Phase 6 silent-e drops trailing e.
  // Result: yuːs. Resolves the use/us collision flagged since phase 8.
  // (Per Nayana convention, /j/ is the consonant `y`, not `j`.)
  assert.equal(rewrite('use').spelling, 'yuːs');
});

test('cute → kyuːt', () => {
  assert.equal(rewrite('cute').spelling, 'kyuːt');
});

test('few → fyuː (silent-e from phase 6, w→uː from phase 8, then uː→yuː)', () => {
  assert.equal(rewrite('few').spelling, 'fyuː');
});

test('music → myuːsɪk (s stays s; future s→z phase will give myuːzɪk)', () => {
  // alignment: m}M u}Y|UW1 s}Z i}IH0 c}K — c→k, i→ɪ, uː→yuː
  // s is /Z/ but no s→z rule yet.
  assert.equal(rewrite('music').spelling, 'myuːsɪk');
});

// ---- Cross-phase composition --------------------------------------------

test('philosopher still → fəlosəfɚ at phase 15', () => {
  assert.equal(rewrite('philosopher').spelling, 'fəlosəfɚ');
});

test('the → ðə still holds', () => {
  assert.equal(rewrite('the').spelling, 'ðə');
});

test('she → ʃiː still holds', () => {
  assert.equal(rewrite('she').spelling, 'ʃiː');
});

// ---- CRITICAL negatives -------------------------------------------------

test('CRITICAL: walk stays walk (silent-l skipped this phase, alignment is al)', () => {
  // alignment: w}W al}AO1 k}K — 'al' is one grapheme, no rule fires.
  assert.equal(rewrite('walk').spelling, 'walk');
});

test('CRITICAL: ghost still → goust (no over-fire from new silent rules)', () => {
  assert.equal(rewrite('ghost').spelling, 'goust');
});
