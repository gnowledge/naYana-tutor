/**
 * fetch-cmudict.js — download the full CMUdict.
 *
 * Run: node scripts/fetch-cmudict.js
 *
 * Downloads CMUdict from the upstream Carnegie Mellon source and
 * writes it to data/cmudict.txt. After this, run `npm run build`
 * to compile it to data/cmudict.json.
 *
 * Network required. The source is large but stable; this script
 * runs once during setup.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'cmudict.txt');

// Primary source — GitHub mirror of the CMU Sphinx CMUdict
const PRIMARY = 'https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict';
// Fallback — direct CMU mirror (different format, would need adapting)
const FALLBACK = 'https://raw.githubusercontent.com/Alexir/CMUdict/master/cmudict-0.7b';

async function fetchUrl(url) {
  console.log(`Fetching ${url}...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return await response.text();
}

async function main() {
  let text;
  try {
    text = await fetchUrl(PRIMARY);
  } catch (err) {
    console.warn(`Primary source failed: ${err.message}`);
    console.warn('Trying fallback...');
    text = await fetchUrl(FALLBACK);
  }

  // CMUdict sometimes ships with comments at the top. The cmusphinx version
  // uses '#' style; the cmudict-0.7b uses ';;;'. Convert '#' lines to ';;;'
  // for consistency with our parser.
  text = text.split('\n').map((line) => {
    if (line.startsWith('#')) return ';;; ' + line.slice(1).trim();
    return line;
  }).join('\n');

  // Also: cmusphinx format uses lowercase words; cmudict-0.7b uses uppercase.
  // The parser handles both because it lowercases on insert.

  fs.writeFileSync(OUTPUT, text);
  const lineCount = text.split('\n').filter((l) => l && !l.startsWith(';;;')).length;
  console.log(`Wrote ${OUTPUT}`);
  console.log(`  ~${lineCount.toLocaleString()} pronunciation entries`);
  console.log('');
  console.log('Next: run `npm run build` to compile to JSON.');
}

main().catch((err) => {
  console.error('Failed:', err.message);
  console.error('You can still use the engine with the sample dictionary.');
  console.error('Just run `npm run build` and it will use data/cmudict-sample.txt.');
  process.exit(1);
});
