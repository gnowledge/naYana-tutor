#!/usr/bin/env node
/**
 * validate-ipa-encoding.js — Acid test 2: prove Nayana output is real IPA.
 *
 * Takes input English text, runs it through the engine, then for each
 * rewritten word:
 *
 *   1. Extracts every non-ASCII character from the rewritten form
 *   2. Confirms each character is a known IPA codepoint
 *   3. Maps each character to its X-SAMPA equivalent (the format
 *      espeak-ng accepts for direct phoneme input)
 *   4. Prints a ready-to-run espeak-ng command per word
 *
 * If --tts <output.wav> is passed, also invokes espeak-ng directly to
 * synthesize each word into the named file (concatenated). Requires
 * espeak-ng on $PATH; install with `sudo apt install espeak-ng`.
 *
 * Usage:
 *   node engine/scripts/validate-ipa-encoding.js "<english text>"
 *   node engine/scripts/validate-ipa-encoding.js "<english text>" --tts out.wav
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Dictionary } from '../src/dictionary.js';
import { rewriteWord } from '../src/rewrite.js';
import { loadCatalogue, rulesForPhase } from '../src/catalogue.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DICT = path.join(__dirname, '..', 'data', 'cmudict.json');

// IPA → X-SAMPA mapping for every IPA character the engine emits.
// X-SAMPA is the ASCII-safe phonetic notation espeak-ng accepts via [[…]].
// Latin characters that aren't IPA-specific (a, b, c…) pass through as-is.
const IPA_TO_XSAMPA = {
  // vowels
  'æ': '{',     'ɑ': 'A',     'ə': '@',     'ʌ': 'V',
  'ɛ': 'E',     'ɪ': 'I',     'ʊ': 'U',     'ɔ': 'O',
  'ɝ': '3`',    'ɚ': '@`',
  // consonants
  'ð': 'D',     'θ': 'T',     'ʃ': 'S',     'ʒ': 'Z',     'ŋ': 'N',
  // length marker
  'ː': ':',
};

// Latin characters in Nayana output that map to a single phoneme (some
// have non-trivial X-SAMPA equivalents).
const LATIN_TO_XSAMPA = {
  'a': 'a', 'b': 'b', 'c': 'k',  // c only appears in liga (we map it to /k/ anyway)
  'd': 'd', 'e': 'e', 'f': 'f', 'g': 'g', 'h': 'h', 'i': 'i',
  'j': 'dZ',                      // j renders the dʒ ligature (so /dʒ/)
  'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n', 'o': 'o', 'p': 'p',
  'q': 'k', 'r': 'r', 's': 's', 't': 't', 'u': 'u', 'v': 'v',
  'w': 'w',
  'y': 'j',                       // y → /j/ per Nayana convention
  'z': 'z',
};

/**
 * Convert a Nayana spelling to an X-SAMPA phoneme string.
 * Iterates character-by-character, recognising the digraph ligatures
 * (tʃ, dʒ) when they appear so the X-SAMPA output reflects the single
 * phoneme rather than two consecutive ones.
 */
function nayanaToXsampa(spelling) {
  const out = [];
  let i = 0;
  while (i < spelling.length) {
    const c = spelling[i];
    const next = spelling[i + 1];
    // Two-char sequences first
    if (c === 't' && next === 'ʃ') { out.push('tS'); i += 2; continue; }
    if (c === 'd' && next === 'ʒ') { out.push('dZ'); i += 2; continue; }
    // Latin diphthong digraphs
    if (c === 'a' && next === 'i') { out.push('aI'); i += 2; continue; }
    if (c === 'e' && next === 'i') { out.push('eI'); i += 2; continue; }
    if (c === 'o' && next === 'u') { out.push('oU'); i += 2; continue; }
    if (c === 'a' && next === 'u') { out.push('aU'); i += 2; continue; }
    if (c === 'ɔ' && next === 'ɪ') { out.push('OI'); i += 2; continue; }
    // y+u(:)? for the engine's yuː convention → /juː/
    if (c === 'y' && next === 'u') { out.push('ju'); i += 2; continue; }
    // Single chars
    if (IPA_TO_XSAMPA[c] !== undefined) { out.push(IPA_TO_XSAMPA[c]); i++; continue; }
    if (LATIN_TO_XSAMPA[c] !== undefined) { out.push(LATIN_TO_XSAMPA[c]); i++; continue; }
    // Anything else (punctuation, unknown) — skip with a marker
    out.push(`<?${c}?>`);
    i++;
  }
  return out.join('');
}

function isIpaCodepoint(c) {
  const cp = c.codePointAt(0);
  return cp in {
    [0x00E6]: 1, [0x0251]: 1, [0x0259]: 1, [0x028C]: 1,
    [0x025B]: 1, [0x026A]: 1, [0x028A]: 1, [0x0254]: 1,
    [0x025D]: 1, [0x025A]: 1,
    [0x00F0]: 1, [0x03B8]: 1, [0x0283]: 1, [0x0292]: 1, [0x014B]: 1,
    [0x02D0]: 1,
  };
}

function main() {
  const args = process.argv.slice(2);
  const ttsIdx = args.indexOf('--tts');
  const ttsOutput = ttsIdx !== -1 ? args[ttsIdx + 1] : null;
  const skipIdx = ttsIdx === -1 ? new Set() : new Set([ttsIdx, ttsIdx + 1]);
  const text = args.filter((_, i) => !skipIdx.has(i)).join(' ');
  if (!text) {
    console.error('Usage: validate-ipa-encoding.js "<english text>" [--tts out.wav]');
    process.exit(1);
  }

  const dict = new Dictionary(JSON.parse(fs.readFileSync(DICT, 'utf-8')));
  const catalogue = loadCatalogue();
  const rules = rulesForPhase(catalogue, 18);

  const words = text.split(/\s+/).filter(Boolean);
  console.log(`\n=== Validating ${words.length} word(s) ===\n`);

  let badChars = 0;
  let espeakArgs = [];
  for (const word of words) {
    const lookup = dict.lookup(word.toLowerCase());
    if (!lookup) {
      console.log(`  ${word.padEnd(15)} (not in dictionary; skipped)`);
      continue;
    }
    const result = rewriteWord(word, lookup.pairs, rules);
    const spelling = result.spelling;

    // Audit non-ASCII characters
    const ipaChars = [...spelling].filter((c) => c.charCodeAt(0) > 127);
    const valid = ipaChars.every(isIpaCodepoint);
    if (!valid) badChars += ipaChars.filter((c) => !isIpaCodepoint(c)).length;

    const xsampa = nayanaToXsampa(spelling);
    const espeak = `[[${xsampa}]]`;
    espeakArgs.push(espeak);
    console.log(`  ${word.padEnd(15)} → ${spelling.padEnd(20)}  X-SAMPA: ${xsampa.padEnd(18)}  ${valid ? '✓ all IPA cps valid' : '✗ INVALID CODEPOINTS'}`);
  }

  console.log('');
  if (badChars > 0) {
    console.log(`⚠  Found ${badChars} character(s) outside the known IPA inventory.`);
  } else {
    console.log(`✓ Every IPA character is a valid Unicode IPA codepoint.`);
  }

  // Construct an espeak-ng invocation
  const espeakInput = espeakArgs.join(' ');
  console.log(`\nReady-to-run espeak-ng command:`);
  console.log(`  espeak-ng "${espeakInput.replace(/"/g, '\\"')}"`);
  if (ttsOutput) {
    console.log(`  espeak-ng -w ${ttsOutput} '${espeakInput}'`);
    // Use spawnSync with array args so backticks in X-SAMPA (e.g. @` for ɚ)
    // are passed verbatim, not interpreted by a shell.
    const r = spawnSync('espeak-ng', ['-w', ttsOutput, espeakInput],
                        { stdio: 'pipe' });
    if (r.error || r.status !== 0) {
      console.log(`\n✗ espeak-ng failed: ${r.error?.message || r.stderr?.toString().trim() || `exit ${r.status}`}`);
      console.log(`  Install with: sudo apt install espeak-ng`);
    } else {
      console.log(`\n✓ Wrote ${ttsOutput} — IPA → audio acid test passed.`);
    }
  }
}

main();
