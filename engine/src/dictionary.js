/**
 * dictionary.js
 *
 * Pronunciation lookup using a CMUdict-derived dataset, optionally with
 * grapheme-phoneme alignment from Phonetisaurus.
 *
 * CMUdict stores pronunciations in ARPAbet (e.g. F IH0 L AA1 S AH0 F IY0
 * for "philosophy"). The loader converts ARPAbet to IPA, preserving
 * stress (0=unstressed, 1=primary, 2=secondary) on vowels.
 *
 * From phase 2 onward, each pronunciation also carries a `pairs` array
 * of {graphemes, phonemes} entries — the alignment between letters and
 * phonemes. This lets rules fire at specific positions instead of the
 * cruder "is the phoneme present anywhere?" check used in phase 1.
 *
 * The dictionary is keyed by lowercased word. Words with multiple
 * pronunciations are kept as an array; alt-pronunciations carry their
 * own alignments.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DICT_PATH = path.join(__dirname, '..', 'data', 'cmudict.json');

/**
 * ARPAbet → IPA mapping for General American English.
 * Each entry maps an ARPAbet phoneme (the dictionary's notation) to its
 * IPA equivalent. Vowels in ARPAbet carry a stress digit (0/1/2);
 * we strip that here and re-attach the stress as a prefix on the IPA.
 */
const ARPABET_TO_IPA = {
  // Vowels — General American
  AA: 'ɑ',   // odd, father, lot
  AE: 'æ',   // at, cat, hat
  AH: 'ʌ',   // hut, sun — stressed (AH1/AH2)
  // Unstressed AH (AH0) renders as schwa 'ə'; handled in conversion logic.
  AO: 'ɔ',   // ought, thought, law
  AW: 'aʊ',  // cow, out, now
  AY: 'aɪ',  // hide, my, ice
  EH: 'ɛ',   // ed, bed, head
  ER: 'ɝ',   // hurt, bird — stressed ER1/ER2
  // Unstressed ER (ER0) → 'ɚ'; handled in conversion logic.
  EY: 'eɪ',  // ate, face, day
  IH: 'ɪ',   // it, sit, bid
  IY: 'i',   // eat, fleece, see (we omit length mark here for simplicity)
  OW: 'oʊ',  // oat, go, boat
  OY: 'ɔɪ',  // toy, boy, voice
  UH: 'ʊ',   // hood, foot, put
  UW: 'u',   // two, food, boot

  // Consonants
  B:  'b',
  CH: 'tʃ',
  D:  'd',
  DH: 'ð',
  F:  'f',
  G:  'ɡ',
  HH: 'h',
  JH: 'dʒ',
  K:  'k',
  L:  'l',
  M:  'm',
  N:  'n',
  NG: 'ŋ',
  P:  'p',
  R:  'ɹ',
  S:  's',
  SH: 'ʃ',
  T:  't',
  TH: 'θ',
  V:  'v',
  W:  'w',
  Y:  'j',
  Z:  'z',
  ZH: 'ʒ',
};

/**
 * Convert an ARPAbet phoneme list to an IPA list.
 * Stress digit is stripped from each phoneme; unstressed AH/ER become ə/ɚ.
 * Returns array of IPA strings in order.
 */
export function arpabetToIpa(arpabetTokens) {
  return arpabetTokens.map((token) => {
    const stressMatch = token.match(/^([A-Z]+)([012])?$/);
    if (!stressMatch) {
      // Unrecognized token; pass through
      return token;
    }
    const [, base, stress] = stressMatch;

    // Special unstressed-vowel handling
    if (base === 'AH' && stress === '0') return 'ə';
    if (base === 'ER' && stress === '0') return 'ɚ';

    return ARPABET_TO_IPA[base] || token;
  });
}

/**
 * Load a dictionary from the prebuilt JSON form.
 * Returns a Dictionary instance.
 */
export function loadDictionary(filePath = DEFAULT_DICT_PATH) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);
  // JSON.parse produces objects with Object.prototype, which means
  // dict.entries['constructor'] would return the inherited method, not
  // the entry. Rehydrate onto a null-prototype object.
  const safeEntries = Object.create(null);
  for (const key of Object.keys(data.entries)) {
    safeEntries[key] = data.entries[key];
  }
  return new Dictionary({ version: data.version, entries: safeEntries });
}

/**
 * Parse a CMUdict-format string (the raw text format).
 * Each non-comment line is: WORD  AR P A BE T...
 * Returns { word: [arpabetArray, ...], ... }
 *
 * Words with multiple pronunciations in CMUdict are suffixed (1), (2)...;
 * we collapse those onto the base word.
 */
export function parseCmudictText(text) {
  // IMPORTANT: use Object.create(null) so word keys can't collide with
  // built-in property names. Without this, words like "constructor",
  // "toString", "hasOwnProperty" would resolve to inherited Object methods
  // and crash when we try to push onto them.
  const result = Object.create(null);
  for (const line of text.split('\n')) {
    if (!line || line.startsWith(';;;')) continue;
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Format: WORD  P1 P2 P3 ...
    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) continue;
    let word = parts[0];
    const phones = parts.slice(1);
    // Strip alternate-pronunciation markers like "(2)"
    const altMatch = word.match(/^(.+)\(\d+\)$/);
    if (altMatch) word = altMatch[1];
    word = word.toLowerCase();
    if (!result[word]) result[word] = [];
    result[word].push(phones);
  }
  return result;
}

/**
 * Parse a Phonetisaurus alignment corpus.
 *
 * Each line: `g1}p1 g2}p2 ...` where `g` is one or more graphemes (joined
 * with `|`) and `p` is one or more ARPAbet phonemes (joined with `|`).
 * `_` denotes epsilon. The word is implicit — reconstructed by
 * concatenating graphemes (stripping `|`).
 *
 * Returns { word: [pairsArray, ...] } in the order entries appear, so
 * alt-pronunciations align positionally with parseCmudictText output.
 */
export function parseAlignedCorpus(text) {
  const result = Object.create(null);
  for (const line of text.split('\n')) {
    if (!line || line.startsWith(';')) continue;
    const trimmed = line.trim();
    if (!trimmed) continue;
    const tokens = trimmed.split(/\s+/);
    const pairs = [];
    for (const token of tokens) {
      const idx = token.indexOf('}');
      if (idx === -1) continue;
      const left = token.slice(0, idx);
      const right = token.slice(idx + 1);
      const graphemes = left.split('|').join('');
      const phonemes = right === '_' ? [] : right.split('|');
      pairs.push({ graphemes, phonemes });
    }
    if (!pairs.length) continue;
    const word = pairs.map((p) => p.graphemes).join('').toLowerCase();
    if (!result[word]) result[word] = [];
    result[word].push(pairs);
  }
  return result;
}

/**
 * Build the dictionary's JSON form.
 *
 * Each pronunciation gets `arpabet` and `ipa`. If alignedCorpusText is
 * provided, each pronunciation also gets `pairs` (positional alignment).
 *
 * Pairing assumes alt-pronunciations appear in the same order in both
 * sources — true for our pipeline because build-aligned-cmudict.js feeds
 * cmudict.txt to phonetisaurus-align line-by-line, preserving order.
 * If a pronunciation has no matching alignment (offline sample case for
 * a missing word), `pairs` is omitted.
 */
export function buildDictionaryData(cmudictText, alignedCorpusText = null) {
  const entries = parseCmudictText(cmudictText);
  const alignments = alignedCorpusText ? parseAlignedCorpus(alignedCorpusText) : null;
  // Same prototype-pollution defense as parseCmudictText.
  const data = Object.create(null);
  for (const word of Object.keys(entries)) {
    const pronList = entries[word];
    const alignedList = alignments ? (alignments[word] || []) : [];
    data[word] = pronList.map((arpa, i) => {
      const entry = {
        arpabet: arpa,
        ipa: arpabetToIpa(arpa),
      };
      if (alignedList[i]) entry.pairs = alignedList[i];
      return entry;
    });
  }
  return { version: 2, entries: data };
}

export class Dictionary {
  constructor(data) {
    this.version = data.version;
    this.entries = data.entries;
  }

  /**
   * Look up a word. Returns the first pronunciation (most common) or null.
   * Use lookupAll() to get all pronunciations.
   *
   * Uses hasOwnProperty defensively in case the entries map is constructed
   * with Object.prototype (e.g. by a caller passing in plain JSON).
   */
  lookup(word) {
    const key = word.toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(this.entries, key)) return null;
    const entry = this.entries[key];
    return entry ? entry[0] : null;
  }

  /**
   * Look up all pronunciations for a word. Returns array (possibly empty).
   */
  lookupAll(word) {
    const key = word.toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(this.entries, key)) return [];
    return this.entries[key] || [];
  }

  /**
   * Check if a word is in the dictionary.
   */
  has(word) {
    return Object.prototype.hasOwnProperty.call(this.entries, word.toLowerCase());
  }

  /**
   * Number of words in the dictionary.
   */
  get size() {
    return Object.keys(this.entries).length;
  }
}
