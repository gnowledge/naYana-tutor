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
import { parse as parseHtml } from 'node-html-parser';

import { loadDictionary } from './dictionary.js';
import { loadCatalogue, rulesForPhase, listPhases } from './catalogue.js';
import { processHtml, processText_ } from './process.js';

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
app.use(express.static(path.join(ROOT, 'public')));

// Clean URLs for top-level tutor pages — each maps /<slug> to public/<slug>.html
// so users see /learn instead of /learn.html. Express.static still serves the
// .html paths too (and assets, fonts), so links remain flexible.
const TUTOR_PAGES = ['learn', 'type', 'read', 'download', 'faq', 'harness'];
for (const slug of TUTOR_PAGES) {
  app.get(`/${slug}`, (req, res) => {
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

app.post('/api/process', (req, res) => {
  const { text, html, phase = 1, prefs = {} } = req.body;
  if (text === undefined && html === undefined) {
    return res.status(400).json({ error: 'Provide either text or html' });
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
    const html = await response.text();

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
