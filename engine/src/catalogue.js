/**
 * catalogue.js
 *
 * Loads the ambiguity catalogue (YAML) and provides access to phase rules.
 *
 * A rule is one substitution: given a word's spelling and pronunciation,
 * decide whether and how to rewrite it.
 *
 * Rules are organized into phases. Phase N applies rules from phases 1..N
 * cumulatively. Higher phase = more substitutions = more phonetic output.
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Default location of the runtime catalogue JSON, built by
 * scripts/build-catalogue.js from data/ambiguity-catalogue.yaml.
 */
const DEFAULT_CATALOGUE_PATH = path.join(__dirname, '..', 'data', 'catalogue.json');

/**
 * Load the runtime catalogue. The runtime form is a compiled JSON, but for
 * development we can also load directly from YAML.
 */
export function loadCatalogue(filePath = DEFAULT_CATALOGUE_PATH) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
    return yaml.load(raw);
  }
  return JSON.parse(raw);
}

/**
 * Given a catalogue and a phase number, return the flat list of rules that
 * should be active. Rules from phases 1..phaseNumber are all included.
 */
export function rulesForPhase(catalogue, phaseNumber) {
  const rules = [];
  for (const phase of catalogue.phases) {
    if (phase.number > phaseNumber) break;
    for (const rule of phase.rules || []) {
      rules.push({ ...rule, phase: phase.number, phaseName: phase.name });
    }
  }
  return rules;
}

/**
 * Get a phase's metadata by number.
 */
export function getPhase(catalogue, phaseNumber) {
  return catalogue.phases.find((p) => p.number === phaseNumber) || null;
}

/**
 * List all phases with their numbers, names, descriptions, and demo
 * text — for the UI slider and the auto-loaded sample text.
 */
export function listPhases(catalogue) {
  return catalogue.phases.map((p) => ({
    number: p.number,
    name: p.name,
    description: p.description,
    demoText: p.demoText || null,
  }));
}
