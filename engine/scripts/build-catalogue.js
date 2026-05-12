/**
 * build-catalogue.js — compile the YAML catalogue to runtime JSON.
 *
 * Run: node scripts/build-catalogue.js
 *
 * Reads:  data/ambiguity-catalogue.yaml
 * Writes: data/catalogue.json
 *
 * The runtime form is identical in structure to the YAML; we just convert
 * format for faster loading and to remove dev-only comments. Later we may
 * preprocess rules (compile regexes, etc.) here.
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const INPUT = path.join(ROOT, 'data', 'ambiguity-catalogue.yaml');
const OUTPUT = path.join(ROOT, 'data', 'catalogue.json');

const raw = fs.readFileSync(INPUT, 'utf-8');
const catalogue = yaml.load(raw);

// Basic validation
if (!Array.isArray(catalogue.phases)) {
  console.error('catalogue.phases must be an array');
  process.exit(1);
}
for (const phase of catalogue.phases) {
  if (typeof phase.number !== 'number') {
    console.error(`phase missing number: ${JSON.stringify(phase).slice(0, 80)}`);
    process.exit(1);
  }
  if (!Array.isArray(phase.rules)) {
    console.error(`phase ${phase.number} missing rules array`);
    process.exit(1);
  }
}

fs.writeFileSync(OUTPUT, JSON.stringify(catalogue, null, 2) + '\n');
console.log(`Wrote ${OUTPUT}`);
console.log(`  ${catalogue.phases.length} phase(s)`);
const ruleCount = catalogue.phases.reduce((a, p) => a + p.rules.length, 0);
console.log(`  ${ruleCount} rule(s) total`);
