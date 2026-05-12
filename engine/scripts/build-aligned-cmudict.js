/**
 * build-aligned-cmudict.js — produce a grapheme-phoneme alignment of CMUdict.
 *
 * Run: node scripts/build-aligned-cmudict.js
 *
 * Reads data/cmudict.txt (downloaded by `npm run fetch-cmudict`), feeds it
 * to `phonetisaurus-align` from the rhasspy `phonetisaurus` PyPI package,
 * and writes data/aligned-cmudict.corpus.
 *
 * Setup once per machine:
 *   python3 -m venv .venv
 *   .venv/bin/pip install phonetisaurus
 *
 * The alignment runs an EM algorithm over ~135k entries. On a modern CPU
 * it takes 10-15 minutes. The output is deterministic given identical
 * input, so the corpus only needs to be regenerated when CMUdict updates.
 */

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const VENV_PY = path.join(ROOT, '.venv', 'bin', 'python');
const CMUDICT = path.join(ROOT, 'data', 'cmudict.txt');
const OUTPUT = path.join(ROOT, 'data', 'aligned-cmudict.corpus');

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function locatePhonetisaurus() {
  if (!fs.existsSync(VENV_PY)) {
    fail(
      `Phonetisaurus venv not found at ${VENV_PY}\n` +
      `Set up with:\n` +
      `  python3 -m venv .venv\n` +
      `  .venv/bin/pip install phonetisaurus`
    );
  }
  const result = spawnSync(VENV_PY, [
    '-c',
    'import phonetisaurus, os; print(os.path.dirname(phonetisaurus.__file__))',
  ], { encoding: 'utf-8' });
  if (result.status !== 0) {
    fail(
      `Could not import phonetisaurus from ${VENV_PY}.\n` +
      `Install it with: ${VENV_PY} -m pip install phonetisaurus`
    );
  }
  const pkgDir = result.stdout.trim();
  // The wheel ships binaries and libs under bin/<arch>/ and lib/<arch>/.
  // Detect the arch dir present (currently only x86_64 ships).
  const binParent = path.join(pkgDir, 'bin');
  const archs = fs.readdirSync(binParent);
  if (!archs.length) fail(`No arch dir under ${binParent}`);
  const arch = archs[0];
  return {
    bin: path.join(pkgDir, 'bin', arch, 'phonetisaurus-align'),
    lib: path.join(pkgDir, 'lib', arch),
  };
}

function toTsv(cmudictText) {
  // CMUdict uses single-space between word and phonemes, and adds (N)
  // suffixes for alternate pronunciations. Phonetisaurus expects tab
  // between the two columns and treats the word verbatim, so the (N)
  // would be aligned as graphemes if left in.
  const lines = cmudictText.split('\n');
  const out = [];
  for (const line of lines) {
    if (!line || line.startsWith(';;;') || line.startsWith('#')) continue;
    const sp = line.indexOf(' ');
    if (sp === -1) continue;
    const word = line.slice(0, sp).replace(/\([0-9]+\)$/, '');
    const phons = line.slice(sp + 1).trim();
    if (!word || !phons) continue;
    out.push(`${word}\t${phons}`);
  }
  return out.join('\n') + '\n';
}

async function main() {
  if (!fs.existsSync(CMUDICT)) {
    fail(`Missing ${CMUDICT}. Run \`npm run fetch-cmudict\` first.`);
  }

  const { bin, lib } = locatePhonetisaurus();

  console.log(`Preparing input from ${CMUDICT}...`);
  const tsv = toTsv(fs.readFileSync(CMUDICT, 'utf-8'));
  const tmpInput = path.join(os.tmpdir(), `nayana-cmudict-${process.pid}.tsv`);
  fs.writeFileSync(tmpInput, tsv);
  const entryCount = tsv.split('\n').filter(Boolean).length;
  console.log(`  ${entryCount.toLocaleString()} entries`);

  console.log(`Running phonetisaurus-align (10-15 min for full CMUdict)...`);
  const result = await runAlign(bin, lib, tmpInput, OUTPUT);
  fs.unlinkSync(tmpInput);

  if (result.code !== 0) fail(`phonetisaurus-align exited ${result.code}`);

  const outLines = fs.readFileSync(OUTPUT, 'utf-8').split('\n').filter(Boolean).length;
  console.log(`Wrote ${OUTPUT}`);
  console.log(`  ${outLines.toLocaleString()} aligned entries`);
}

function runAlign(bin, lib, input, output) {
  return new Promise((resolve) => {
    const child = spawn(bin, [`--input=${input}`, `--ofile=${output}`], {
      env: { ...process.env, LD_LIBRARY_PATH: lib },
      stdio: 'inherit',
    });
    child.on('exit', (code) => resolve({ code }));
  });
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
