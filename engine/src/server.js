/**
 * server.js — local test harness server.
 *
 * Run: npm start (or: node src/server.js)
 * Visit: http://localhost:3000
 *
 * Endpoints:
 *   GET  /              — serves public/index.html
 *   GET  /api/phases    — list available phases
 *   POST /api/process   — process text at a given phase
 *   POST /api/fetch     — fetch a URL and process its content (CORS-bypass proxy)
 *
 * This server exists only for local development. The eventual browser
 * extension does the same work entirely client-side; the server is here
 * so we can iterate on the engine without writing extension code first.
 */

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { parse as parseHtml } from 'node-html-parser';

import { loadDictionary } from './dictionary.js';
import { loadCatalogue, rulesForPhase, listPhases } from './catalogue.js';
import { processHtml, processText_ } from './process.js';
import { naYanaTextToEspeakInput, isPhonetic } from './xsampa.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const PORT = parseInt(process.env.PORT, 10) || 5000;
const app = express();

// Load engine resources once at startup
console.log('Loading dictionary...');
const dictionary = loadDictionary();
console.log(`  ${dictionary.size.toLocaleString()} words`);

console.log('Loading catalogue...');
const catalogue = loadCatalogue();
console.log(`  ${catalogue.phases.length} phase(s)`);

const lookup = (word) => dictionary.lookupAll(word);

// Middleware
app.use(express.json({ limit: '5mb' }));
// Static files: send `Cache-Control: no-cache` so browsers always revalidate
// before reusing a cached copy. Combined with express.static's default ETag
// support this gives 304 Not Modified for unchanged files (fast) but picks
// up edits to HTML/CSS/JS the moment they're saved (no stale-cache pain).
app.use(express.static(path.join(ROOT, 'public'), {
  setHeaders: (res) => res.setHeader('Cache-Control', 'no-cache'),
}));

// Clean URLs for top-level tutor pages — each maps /<slug> to public/<slug>.html
// so users see /learn instead of /learn.html. Express.static still serves the
// .html paths too (and assets, fonts), so links remain flexible.
const TUTOR_PAGES = ['learn', 'type', 'read', 'convert', 'download', 'faq', 'developer', 'harness'];
for (const slug of TUTOR_PAGES) {
  app.get(`/${slug}`, (req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.sendFile(path.join(ROOT, 'public', `${slug}.html`), (err) => {
      if (err) res.status(404).send('Not found');
    });
  });
}

// API routes
app.get('/api/phases', (req, res) => {
  res.json({
    phases: listPhases(catalogue),
    maxPhase: catalogue.phases.length,
  });
});

// ---------- TTS endpoint --------------------------------------------------
// Synthesise audio for a piece of text. Body: { text, engine?, voice?, speed? }.
// Response: audio/wav stream.
//
// Engine routing:
//   - If `engine` is provided, use it directly ('piper' | 'espeak').
//   - Otherwise, auto-detect: text containing IPA codepoints → espeak-ng
//     (it accepts phoneme input via [[…]]); plain English → Piper
//     (neural, much more natural).
//
// Speech caching: synth takes ~30 ms (espeak) or ~150 ms (Piper) per word;
// we cache by (engine|voice|speed|text) so repeat clicks are instant.
const TTS_CACHE = new Map();
const TTS_CACHE_MAX = 256;
const TTS_MAX_TEXT_LEN = 800;

// Piper paths — resolved relative to the repo root so they work regardless
// of where Node is launched. Override with NAYANA_PIPER_BIN /
// NAYANA_PIPER_VOICE if you want a different binary or voice model.
const REPO_ROOT = path.join(ROOT, '..');
const PIPER_BIN   = process.env.NAYANA_PIPER_BIN
  || path.join(REPO_ROOT, 'vendor', 'piper', 'piper');
const PIPER_VOICE = process.env.NAYANA_PIPER_VOICE
  || path.join(REPO_ROOT, 'vendor', 'piper-voices', 'en_US-lessac-high.onnx');

app.post('/api/tts', (req, res) => {
  const { text, engine: engineOverride, voice, speed = 130 } = req.body || {};
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Provide non-empty text' });
  }
  if (text.length > TTS_MAX_TEXT_LEN) {
    return res.status(400).json({ error: `text too long (max ${TTS_MAX_TEXT_LEN} chars)` });
  }

  const engine = engineOverride || (isPhonetic(text) ? 'espeak' : 'piper');
  const effectiveVoice = voice || (engine === 'piper' ? 'lessac' : 'en-us');
  const cacheKey = `${engine}|${effectiveVoice}|${speed}|${text}`;
  if (TTS_CACHE.has(cacheKey)) {
    res.set('Content-Type', 'audio/wav');
    res.set('Cache-Control', 'no-cache');
    return res.send(TTS_CACHE.get(cacheKey));
  }

  let r;
  if (engine === 'piper') {
    // Strip our verbatim markup so [[Nehru]] reads as "Nehru", not as the
    // brackets too. Backticks already parse cleanly through Piper's
    // text normaliser but we strip them for consistency.
    const cleanText = text
      .replace(/\[\[([^\]\n]+)\]\]/g, '$1')
      .replace(/`([^`\n]+)`/g, '$1');
    r = spawnSync(
      PIPER_BIN,
      ['--model', PIPER_VOICE, '--output_file', '-', '--quiet'],
      // Pass input as Buffer so `encoding: 'buffer'` (which applies to
      // both stdin and stdout) doesn't try to re-encode a string.
      { input: Buffer.from(cleanText, 'utf8'), encoding: 'buffer' }
    );
  } else {
    // espeak path — phonemic input via [[…]] wrappers
    const espeakInput = naYanaTextToEspeakInput(text);
    r = spawnSync(
      'espeak-ng',
      ['--stdout', '-v', String(effectiveVoice), '-s', String(speed), espeakInput],
      { encoding: 'buffer' }
    );
  }

  if (r.error || r.status !== 0) {
    const msg = r.error?.message || r.stderr?.toString().trim() || `exit ${r.status}`;
    return res.status(500).json({ error: `${engine} tts failed`, detail: msg });
  }
  if (!r.stdout || r.stdout.length === 0) {
    return res.status(500).json({ error: `${engine} produced empty output` });
  }

  // Cache (FIFO eviction)
  if (TTS_CACHE.size >= TTS_CACHE_MAX) {
    TTS_CACHE.delete(TTS_CACHE.keys().next().value);
  }
  TTS_CACHE.set(cacheKey, r.stdout);

  res.set('Content-Type', 'audio/wav');
  res.set('Cache-Control', 'no-cache');
  res.send(r.stdout);
});

// Hard cap on /api/process input length. The /type live-transform sends
// short snippets so this never trips; /convert pastes can be longer but
// 100K chars covers any reasonable single-document use. Defence in depth
// alongside the express.json 5 MB body limit.
const MAX_PROCESS_LEN = 100_000;

app.post('/api/process', (req, res) => {
  const { text, html, phase = 1, prefs = {} } = req.body;
  if (text === undefined && html === undefined) {
    return res.status(400).json({ error: 'Provide either text or html' });
  }
  const inputLen = (text ?? html).length;
  if (inputLen > MAX_PROCESS_LEN) {
    return res.status(413).json({
      error: `text too long (${inputLen} chars; max ${MAX_PROCESS_LEN})`,
    });
  }

  const rules = rulesForPhase(catalogue, Number(phase));
  const opts = { prefs: prefs && typeof prefs === 'object' ? prefs : {} };
  const result = html !== undefined
    ? processHtml(html, lookup, rules, opts)
    : processText_(text, lookup, rules, opts);

  res.json({
    phase: Number(phase),
    rulesActive: rules.map((r) => r.name),
    html: result.html,
    stats: result.stats,
  });
});

app.post('/api/fetch', async (req, res) => {
  const { url, phase = 1, prefs = {} } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Provide a url' });
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Nayana-Engine-Test/0.1' },
    });
    if (!response.ok) {
      return res.status(502).json({ error: `Upstream HTTP ${response.status}` });
    }
    // Cap the fetched body so we can't be forced to download huge files.
    // Read up to ~500 KB; abort beyond that.
    const MAX_FETCH_BYTES = 500_000;
    const reader = response.body.getReader();
    const chunks = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > MAX_FETCH_BYTES) {
        reader.cancel();
        return res.status(413).json({
          error: `upstream too large (>${MAX_FETCH_BYTES} bytes). Try copying the article text and using the Paste tab instead.`,
        });
      }
      chunks.push(value);
    }
    const html = Buffer.concat(chunks).toString('utf-8');

    // Extract main content. Many sites have noisy headers/footers/nav.
    // Try <article>, then <main>, then body — and strip common chrome
    // elements before processing so sidebars and tables of contents
    // don't get rewritten.
    const root = parseHtml(html);
    const article = root.querySelector('article') ||
                    root.querySelector('main') ||
                    root.querySelector('body');
    if (article) {
      const noise = article.querySelectorAll(
        'nav, aside, footer, header, form, ' +
        '.toc, .navbox, .sidebar, .infobox, .reference, ' +
        '#toc, #mw-navigation, #footer, [role="navigation"], [role="complementary"]'
      );
      for (const n of noise) n.remove();
    }
    const content = article ? article.toString() : html;

    const rules = rulesForPhase(catalogue, Number(phase));
    const opts = { prefs: prefs && typeof prefs === 'object' ? prefs : {} };
    const result = processHtml(content, lookup, rules, opts);

    res.json({
      url,
      phase: Number(phase),
      rulesActive: rules.map((r) => r.name),
      html: result.html,
      stats: result.stats,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log('');
  console.log(`Nayana engine test harness running at:`);
  console.log(`  http://localhost:${PORT}`);
  console.log('');
});
