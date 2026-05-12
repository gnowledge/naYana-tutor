/**
 * Regression test for the prototype-pollution bug.
 *
 * CMUdict contains words like "constructor", "toString", "valueOf", and
 * "hasOwnProperty" — all of which collide with Object.prototype method
 * names. The dictionary must handle these without crashing on build and
 * must return correct results on lookup (not the inherited methods).
 *
 * History: the bug surfaced when a user ran `npm run build` with the full
 * CMUdict; parseCmudictText crashed with "result[word].push is not a
 * function" because `result['constructor']` returned the Object
 * constructor function. The fix is Object.create(null) for the keying
 * maps + hasOwnProperty guards on lookup.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCmudictText, buildDictionaryData, Dictionary } from '../src/dictionary.js';

// All lowercase to match the parser's internal key form (it lowercases).
// Display variants in comments only.
const PROBLEMATIC_WORDS = [
  'constructor',
  'tostring',           // toString
  'valueof',            // valueOf
  'hasownproperty',     // hasOwnProperty
  'isprototypeof',      // isPrototypeOf
  'propertyisenumerable', // propertyIsEnumerable
  'tolocalestring',     // toLocaleString
];

const CMUDICT_FRAGMENT = `
;;; test fragment
CONSTRUCTOR  K AH0 N S T R AH1 K T ER0
TOSTRING  T OW1 S T R IH0 NG
VALUEOF  V AE1 L Y UW0 AH0 V
HASOWNPROPERTY  HH AE2 Z OW1 N P R AA2 P ER0 T IY0
ISPROTOTYPEOF  IH2 S P R OW1 T OW0 T AY2 P AH0 V
PROPERTYISENUMERABLE  P R AA1 P ER0 T IY0 IH0 Z IH0 N UW1 M ER0 AH0 B AH0 L
TOLOCALESTRING  T OW2 L OW1 K AH0 L S T R IH0 NG
PHILOSOPHY  F IH0 L AA1 S AH0 F IY0
`;

test('parseCmudictText does not crash on prototype-name words', () => {
  // The reported failure was here: result[word].push() where result[word]
  // was the inherited Function/Method, not an Array.
  assert.doesNotThrow(() => parseCmudictText(CMUDICT_FRAGMENT));
});

test('parseCmudictText correctly stores prototype-name words', () => {
  const entries = parseCmudictText(CMUDICT_FRAGMENT);
  for (const word of PROBLEMATIC_WORDS) {
    assert.ok(
      Array.isArray(entries[word]),
      `${word}: expected Array, got ${typeof entries[word]}`,
    );
    assert.equal(entries[word].length, 1, `${word}: expected one pronunciation`);
  }
});

test('buildDictionaryData survives prototype-name words', () => {
  assert.doesNotThrow(() => buildDictionaryData(CMUDICT_FRAGMENT));
});

test('Dictionary.lookup returns null for missing words (not inherited methods)', () => {
  const data = buildDictionaryData(CMUDICT_FRAGMENT);
  // Re-key onto a null-prototype map to match loadDictionary's behavior
  const safe = Object.create(null);
  for (const k of Object.keys(data.entries)) safe[k] = data.entries[k];
  const dict = new Dictionary({ version: 1, entries: safe });

  // Words NOT in the dictionary
  assert.equal(dict.lookup('not_a_real_word'), null);
  assert.equal(dict.has('not_a_real_word'), false);
});

test('Dictionary.lookup works for prototype-name words that ARE in dict', () => {
  const data = buildDictionaryData(CMUDICT_FRAGMENT);
  const safe = Object.create(null);
  for (const k of Object.keys(data.entries)) safe[k] = data.entries[k];
  const dict = new Dictionary({ version: 1, entries: safe });

  for (const word of PROBLEMATIC_WORDS) {
    const result = dict.lookup(word);
    assert.ok(result, `${word}: expected pronunciation entry, got ${result}`);
    assert.ok(Array.isArray(result.ipa), `${word}: missing ipa array`);
    assert.equal(dict.has(word), true, `${word}: .has should return true`);
  }
});

test('Dictionary still returns null for prototype names even if loaded from plain JSON object', () => {
  // Simulate what JSON.parse produces (regular object, Object.prototype).
  // The Dictionary class must defend against this case too.
  const plainObj = { constructor: [{ ipa: ['k'], arpabet: ['K'] }] };
  const dict = new Dictionary({ version: 1, entries: plainObj });
  // Words actually in the dict resolve
  assert.ok(dict.lookup('constructor'));
  // Inherited method names that are NOT keys should not resolve
  assert.equal(dict.lookup('toString'), null);
  assert.equal(dict.has('toString'), false);
});
