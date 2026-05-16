/**
 * Backtick-pair escape sequence — text between matching backticks is
 * preserved verbatim, no phoneme lookup, no rewrite.
 *
 * Use cases: proper nouns whose CMUdict transcription is wrong (Nehru),
 * foreign loanwords, intentional IPA, code identifiers, URLs.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokenize, processText_ } from '../src/process.js';
import { loadDictionary } from '../src/dictionary.js';
import { loadCatalogue, rulesForPhase } from '../src/catalogue.js';

const dict = loadDictionary();
const catalogue = loadCatalogue();
const rules = rulesForPhase(catalogue, 18);

function run(text) {
  return processText_(text, (w) => dict.lookupAll(w), rules).html;
}

test('tokenize: single backtick-pair becomes a verbatim token', () => {
  const toks = tokenize('hello `Nehru` world');
  assert.deepEqual(toks, [
    { type: 'word',     value: 'hello' },
    { type: 'other',    value: ' ' },
    { type: 'verbatim', value: 'Nehru' },
    { type: 'other',    value: ' ' },
    { type: 'word',     value: 'world' },
  ]);
});

test('tokenize: multi-word verbatim segment is one token', () => {
  const toks = tokenize('the `New York Times` reported');
  assert.deepEqual(toks, [
    { type: 'word',     value: 'the' },
    { type: 'other',    value: ' ' },
    { type: 'verbatim', value: 'New York Times' },
    { type: 'other',    value: ' ' },
    { type: 'word',     value: 'reported' },
  ]);
});

test('tokenize: multiple verbatim segments in one string', () => {
  const toks = tokenize('`Nehru` and `Gandhi`');
  assert.deepEqual(toks.map((t) => t.type), ['verbatim', 'other', 'word', 'other', 'verbatim']);
  assert.equal(toks[0].value, 'Nehru');
  assert.equal(toks[4].value, 'Gandhi');
});

test('tokenize: unmatched backtick passes through as literal', () => {
  // A lone backtick with no closing partner should not eat the rest of
  // the string. Tokens stay normal, the backtick lives in an "other".
  const toks = tokenize('alpha `beta gamma');
  // No verbatim token should be produced.
  assert.equal(toks.some((t) => t.type === 'verbatim'), false);
});

test('tokenize: empty backticks produce no verbatim token', () => {
  // `` collapses to two backticks with nothing between — pattern
  // requires at least one character, so it falls through to literal.
  const toks = tokenize('foo `` bar');
  assert.equal(toks.some((t) => t.type === 'verbatim'), false);
});

test('processText: verbatim text is preserved exactly, no rewrite', () => {
  const html = run('`Nehru` visited');
  // The literal "Nehru" appears in the output, not "neruː".
  assert.match(html, /<span class="nayana-verbatim"[^>]*>Nehru<\/span>/);
  assert.doesNotMatch(html, /neruː/);
});

test('processText: word outside backticks still rewrites', () => {
  // "philosophy" should still get phonetic treatment around verbatim text.
  const html = run('the `Nehru` philosophy');
  assert.match(html, /<span class="nayana-verbatim"[^>]*>Nehru<\/span>/);
  // "philosophy" → fɪlɑːsəfiː (or similar) — confirm it was rewritten
  // (i.e. it ends up wrapped in a nayana-rewritten span).
  assert.match(html, /<span class="nayana-rewritten"[^>]*>[^<]*<\/span>/);
});

test('processText: HTML special chars inside verbatim are escaped', () => {
  const html = run('config `<key>` here');
  // < and > must be escaped, never emitted raw.
  assert.match(html, /&lt;key&gt;/);
  assert.doesNotMatch(html, /<key>/);
});

test('processText: backtick around an unknown word also preserves it', () => {
  // Confirms the escape works for words the dictionary doesn't know,
  // not just for words it knows-but-gets-wrong.
  const html = run('`flobberglax` is fictional');
  assert.match(html, /<span class="nayana-verbatim"[^>]*>flobberglax<\/span>/);
});

test('processText: backtick does not span newlines (paragraph boundary)', () => {
  // VERBATIM_RE excludes \n so a stray backtick at end-of-line can't
  // accidentally swallow the next paragraph.
  const html = run('alpha `beta\ngamma`');
  // "beta" and "gamma" should not end up inside a verbatim span.
  assert.doesNotMatch(html, /<span class="nayana-verbatim"[^>]*>beta/);
});

// ---- Alternate syntax: [[...]] (for keyboards where ` is a dead key) ----

test('tokenize: double-bracket syntax is recognised as verbatim', () => {
  const toks = tokenize('hello [[Nehru]] world');
  assert.deepEqual(toks, [
    { type: 'word',     value: 'hello' },
    { type: 'other',    value: ' ' },
    { type: 'verbatim', value: 'Nehru' },
    { type: 'other',    value: ' ' },
    { type: 'word',     value: 'world' },
  ]);
});

test('tokenize: double-bracket and backtick mix in one string', () => {
  const toks = tokenize('`Nehru` met [[Mahatma Gandhi]]');
  const verbs = toks.filter((t) => t.type === 'verbatim').map((t) => t.value);
  assert.deepEqual(verbs, ['Nehru', 'Mahatma Gandhi']);
});

test('processText: [[ … ]] preserves text verbatim', () => {
  const html = run('the [[Nehru]] philosophy');
  assert.match(html, /<span class="nayana-verbatim"[^>]*>Nehru<\/span>/);
  assert.doesNotMatch(html, /neruː/);
});

test('tokenize: single bracket pair stays literal', () => {
  // [single brackets] are common in prose (footnotes, citations) and
  // must NOT trigger the verbatim path.
  const toks = tokenize('see [1] for details');
  assert.equal(toks.some((t) => t.type === 'verbatim'), false);
});
