/**
 * Phase 8 acid tests — the long-u family.
 *
 * Five graphemes spell /uː/ in English: o, oo, ew, ou, ui. All converge
 * on a single 'u'. The bare-u case (blue, true) is already handled by
 * phase 6's silent-e rule — drop the e and the u remains.
 *
 * Critical negatives confirm the alignment correctly skips look-alikes:
 * 'go' (o is /OW/, phase 7 handles), 'on' (o is /AA/), 'book' (oo is /UH/),
 * 'about' (ou is /AW/, phase 7 handles).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadDictionary } from '../src/dictionary.js';
import { rewriteWord } from '../src/rewrite.js';
import { loadCatalogue, rulesForPhase } from '../src/catalogue.js';

const dict = loadDictionary();
const catalogue = loadCatalogue();
const phase8Rules = rulesForPhase(catalogue, 8);

function rewrite(word) {
  const entry = dict.lookup(word);
  const pairs = entry?.pairs ?? null;
  return rewriteWord(word, pairs, phase8Rules);
}

test('phase 8 catalogue extends through the long-u rules', () => {
  const names = phase8Rules.map((r) => r.name);
  assert.ok(names.includes('o→uː (when /uː/)'));
  assert.ok(names.includes('oo→uː (when /uː/)'));
  assert.ok(names.includes('u→uː (when /uː/)'));
  assert.ok(names.includes('ew→uː (when /uː/)'));
  assert.ok(names.includes('ou→uː (when /uː/)'));
  assert.ok(names.includes('ui→uː (when /uː/)'));
  assert.ok(names.includes('w→uː (when /uː/)'));
  assert.equal(phase8Rules.length, 31, 'rule count = 24 prior + 7 new');
});

// ---- o → u (when /uː/) ----------------------------------------------------

test('do → du', () => {
  assert.equal(rewrite('do').spelling, 'duː');
});

test('to → tu', () => {
  assert.equal(rewrite('to').spelling, 'tuː');
});

test('move → muv (o→u AND silent-e)', () => {
  assert.equal(rewrite('move').spelling, 'muːv');
});

test('lose → lus (o→u AND silent-e; s stays s pending future s→z rule)', () => {
  // alignment: l}L o}UW1 s}Z e}∅. s is /Z/ phonetically but no s→z rule
  // yet, so the spelling keeps 's'. Future phase will fix.
  assert.equal(rewrite('lose').spelling, 'luːs');
});

test('CRITICAL: go → gou (o is /OW/, phase 7 fires not phase 8)', () => {
  assert.equal(rewrite('go').spelling, 'gou');
});

test('CRITICAL: on stays on (o is /AA/)', () => {
  assert.equal(rewrite('on').spelling, 'on');
});

// ---- oo → u (when /uː/) ---------------------------------------------------

test('food → fud', () => {
  assert.equal(rewrite('food').spelling, 'fuːd');
});

test('moon → mun', () => {
  assert.equal(rewrite('moon').spelling, 'muːn');
});

test('soon → sun', () => {
  // True homophone unification with the existing word "sun" /sʌn/?
  // No — soon is /suːn/, sun is /sʌn/. Different vowels but now the
  // same spelling. A short-u phase would later distinguish them.
  assert.equal(rewrite('soon').spelling, 'suːn');
});

test('spoon → spun', () => {
  assert.equal(rewrite('spoon').spelling, 'spuːn');
});

test('CRITICAL: book stays book (oo is /UH/, not /UW/)', () => {
  assert.equal(rewrite('book').spelling, 'book');
});

test('CRITICAL: wood stays wood (oo is /UH/)', () => {
  assert.equal(rewrite('wood').spelling, 'wood');
});

// ---- ew → u (when /uː/) ---------------------------------------------------

test('new → nu', () => {
  assert.equal(rewrite('new').spelling, 'nuː');
});

test('blew → blu', () => {
  assert.equal(rewrite('blew').spelling, 'bluː');
});

test('flew → flu', () => {
  assert.equal(rewrite('flew').spelling, 'fluː');
});

test('CRITICAL: knew → nu (kn→n AND ew→u; true homophone with new)', () => {
  // Both new and knew become 'nuː' — the spelling reform reveals what
  // was always a true homophone in spoken English.
  assert.equal(rewrite('knew').spelling, 'nuː');
});

// ---- ou → u (when /uː/) ---------------------------------------------------

test('through → thru (gh→∅ AND ou→u; informal spelling becomes canonical)', () => {
  assert.equal(rewrite('through').spelling, 'thruː');
});

test('group → grup', () => {
  assert.equal(rewrite('group').spelling, 'gruːp');
});

test('soup → sup', () => {
  assert.equal(rewrite('soup').spelling, 'suːp');
});

test('CRITICAL: about → abaut (ou is /AW/, phase 7 handles)', () => {
  assert.equal(rewrite('about').spelling, 'abaut');
});

// ---- ui → u (when /uː/) ---------------------------------------------------

test('fruit → frut', () => {
  assert.equal(rewrite('fruit').spelling, 'fruːt');
});

test('suit → sut', () => {
  assert.equal(rewrite('suit').spelling, 'suːt');
});

test('juice → jus (ui→u AND c→s AND silent-e)', () => {
  // alignment: j}JH ui}UW1 c}S e}∅ → j + u + s + "" = "jus"
  assert.equal(rewrite('juice').spelling, 'juːs');
});

// ---- w → u (when /uː/) — orphaned-w cleanup -------------------------------

test('few → fu (silent-e from phase 6 AND w→u)', () => {
  // alignment: f}F e}∅ w}Y|UW1. CMUdict splits the 'ew' rather than
  // treating it as one grapheme; silent-e drops the e, w→u turns the
  // orphaned w into the vowel.
  assert.equal(rewrite('few').spelling, 'fuː');
});

test('anew → anu', () => {
  assert.equal(rewrite('anew').spelling, 'anuː');
});

// ---- u + silent-e (already handled by phase 6) ----------------------------

test('blue → blu (silent-e from phase 6, no new rule needed)', () => {
  assert.equal(rewrite('blue').spelling, 'bluː');
});

test('true → tru (silent-e from phase 6)', () => {
  assert.equal(rewrite('true').spelling, 'truː');
});

test('rule → rul (silent-e from phase 6)', () => {
  assert.equal(rewrite('rule').spelling, 'ruːl');
});

test('flute → flut (silent-e from phase 6)', () => {
  assert.equal(rewrite('flute').spelling, 'fluːt');
});

// ---- Cross-phase composition ---------------------------------------------

test('phase 8 still applies phase 1: philosophy → filosofy', () => {
  assert.equal(rewrite('philosophy').spelling, 'filosofy');
});

test('phase 8 still applies phase 7: ghost → goust', () => {
  assert.equal(rewrite('ghost').spelling, 'goust');
});

test('phase 8 still applies phase 5: knight → nait', () => {
  assert.equal(rewrite('knight').spelling, 'nait');
});
