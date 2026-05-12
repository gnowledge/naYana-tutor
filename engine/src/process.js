/**
 * process.js
 *
 * Section-level orchestration. Takes HTML, walks the DOM tree, and rewrites
 * text content using the phase rules.
 *
 * Section model:
 *   - <p>, <li>, <h1>-<h6>, <blockquote>, <figcaption> are sections
 *   - <article>, <section>, <main>, <div> are containers (recurse)
 *   - <code>, <pre>, <script>, <style> are skipped entirely
 *   - <a>, <em>, <strong>, <span>, etc. are inline (their text is part
 *     of the containing section)
 *
 * Output: HTML where each rewritten word is wrapped in a span carrying the
 * original spelling as a data-original attribute, and a class for styling.
 */

import { parse } from 'node-html-parser';
import { rewriteWord } from './rewrite.js';

// Block-level elements that constitute a "section" — the smallest unit
// for the visible-processing-highlight to apply to.
const SECTION_TAGS = new Set([
  'p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'figcaption', 'dt', 'dd', 'caption',
  'td', 'th', 'summary',
]);

// Containers — recurse but don't treat as a section themselves.
const CONTAINER_TAGS = new Set([
  'article', 'section', 'main', 'aside', 'div', 'header', 'footer',
  'nav', 'ul', 'ol', 'dl', 'table', 'tbody', 'thead', 'tfoot', 'tr',
  'figure', 'details', 'body', 'html',
]);

// Skip these and their entire contents.
const SKIP_TAGS = new Set([
  'script', 'style', 'code', 'pre', 'kbd', 'samp', 'var',
  'noscript', 'template', 'svg', 'math',
]);

/**
 * Tokenize a string of text into words, punctuation, and whitespace.
 * Returns an array of { type, value } objects.
 *
 * type is 'word' for alphabetic sequences (possibly with apostrophes for
 * contractions like don't, it's), and 'other' for everything else.
 */
export function tokenize(text) {
  const tokens = [];
  const re = /([A-Za-z]+(?:['’][A-Za-z]+)?|[^A-Za-z]+)/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    const value = match[1];
    const type = /^[A-Za-z]/.test(value) ? 'word' : 'other';
    tokens.push({ type, value });
  }
  return tokens;
}

/**
 * Process a single section's text content. Returns the rewritten HTML
 * (as a string of HTML, since changed words get wrapped in spans).
 *
 * stats is mutated: { wordsTotal, wordsChanged, unknownWords }
 */
function processText(text, lookup, rules, stats, prefs) {
  const tokens = tokenize(text);
  const out = [];

  for (const token of tokens) {
    if (token.type === 'other') {
      out.push(escapeHtml(token.value));
      continue;
    }
    stats.wordsTotal++;
    const entries = lookup(token.value);
    if (!entries || entries.length === 0) {
      stats.unknownWords.push(token.value);
      out.push(escapeHtml(token.value));
      continue;
    }

    // Pick the preferred pron for this word (default 0 = first-wins).
    // Clamp to a valid index in case prefs is stale and the dictionary
    // shrank for that word.
    const wordKey = token.value.toLowerCase();
    const requested = prefs[wordKey];
    const currentIdx = (Number.isInteger(requested) && requested < entries.length)
      ? requested
      : 0;

    // Rewrite under each pron. The current one drives the visible spelling;
    // others become alternates if their rewrite differs.
    const rewrites = entries.map((e) => rewriteWord(token.value, e.pairs ?? null, rules));
    const current = rewrites[currentIdx];
    const alternates = [];
    const seen = new Set([current.spelling]);
    for (let i = 0; i < rewrites.length; i++) {
      if (i === currentIdx) continue;
      const r = rewrites[i];
      if (seen.has(r.spelling)) continue;
      seen.add(r.spelling);
      alternates.push({ spelling: r.spelling, rules: r.rulesApplied, pronIndex: i });
    }

    const isChanged = current.spelling !== token.value;
    const hasAlternates = alternates.length > 0;

    if (!isChanged && !hasAlternates) {
      out.push(escapeHtml(token.value));
      continue;
    }
    if (isChanged) stats.wordsChanged++;
    out.push(wrapChangedWord({
      rewritten: current.spelling,
      original: token.value,
      rulesApplied: current.rulesApplied,
      pronIndex: currentIdx,
      pronCount: entries.length,
      alternates,
    }));
  }

  return out.join('');
}

function wrapChangedWord({ rewritten, original, rulesApplied, pronIndex, pronCount, alternates }) {
  const classes = ['nayana-rewritten'];
  if (rewritten === original) classes.push('nayana-unchanged');
  if (alternates.length) classes.push('nayana-has-alternates');

  const altDesc = alternates.length
    ? ' — also: ' + alternates.map((a) => a.spelling).join(', ')
    : '';
  const titleAttr = `Original: ${original}` +
    (rulesApplied.length ? ` (rules: ${rulesApplied.join(', ')})` : '') +
    altDesc;

  const attrs = [
    `class="${escapeAttr(classes.join(' '))}"`,
    `data-original="${escapeAttr(original)}"`,
    `data-rules="${escapeAttr(rulesApplied.join(','))}"`,
    `data-pron-index="${pronIndex}"`,
    `data-pron-count="${pronCount}"`,
    `title="${escapeAttr(titleAttr)}"`,
  ];
  if (alternates.length) {
    attrs.push(`data-alternates="${escapeAttr(JSON.stringify(alternates))}"`);
  }
  return `<span ${attrs.join(' ')}>${escapeHtml(rewritten)}</span>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Walk a node tree, rewriting text content. Mutates the node tree in place.
 * Adds `nayana-section` class to elements that are processed sections, so
 * the UI can apply the brief-highlight effect.
 */
function walkNode(node, lookup, rules, stats, opts, prefs) {
  if (!node) return;

  // Text node — rewrite. node-html-parser uses nodeType 3 with no
  // tagName for text nodes.
  if (node.nodeType === 3) {
    if (node.rawText && node.rawText.trim()) {
      const newHtml = processText(node.rawText, lookup, rules, stats, prefs);
      // Replace the text node's content with the rewritten HTML by
      // setting it on the parent's innerHTML segment. node-html-parser
      // doesn't have a great API for this; we'll do it via a marker.
      node._nayana_replacement = newHtml;
    }
    return;
  }

  // Element node — possibly the document root (tagName null) or a real
  // element. Either way: recurse into its children, but skip the SKIP_TAGS
  // and mark sections on the way down.
  const tag = node.tagName ? node.tagName.toLowerCase() : null;
  if (tag && SKIP_TAGS.has(tag)) return;

  if (tag && SECTION_TAGS.has(tag) && opts.markSections) {
    const cls = node.getAttribute('class') || '';
    node.setAttribute('class', (cls + ' nayana-section').trim());
  }

  for (const child of node.childNodes || []) {
    walkNode(child, lookup, rules, stats, opts, prefs);
  }
}

/**
 * Reconstruct HTML from a parsed tree, applying any text-node replacements
 * recorded during walkNode.
 */
function serializeNode(node) {
  if (!node) return '';
  // Text node
  if (node.nodeType === 3) {
    if (node._nayana_replacement !== undefined) {
      return node._nayana_replacement;
    }
    return escapeHtml(node.rawText);
  }
  // Element node
  if (!node.tagName) {
    // Document or fragment root
    return node.childNodes.map(serializeNode).join('');
  }
  const tag = node.tagName.toLowerCase();
  const attrs = Object.entries(node.attributes || {})
    .map(([k, v]) => ` ${k}="${escapeAttr(v)}"`)
    .join('');

  // Self-closing tags
  const voidTags = new Set([
    'br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base',
    'col', 'embed', 'param', 'source', 'track', 'wbr',
  ]);
  if (voidTags.has(tag)) {
    return `<${tag}${attrs}>`;
  }

  const inner = node.childNodes.map(serializeNode).join('');
  return `<${tag}${attrs}>${inner}</${tag}>`;
}

/**
 * Public API: process an HTML fragment string.
 *
 * Returns: { html, stats: { wordsTotal, wordsChanged, unknownWords[] } }
 */
export function processHtml(html, lookup, rules, options = {}) {
  const opts = { markSections: true, ...options };
  const prefs = options.prefs || {};
  const root = parse(html, {
    blockTextElements: { script: false, style: false, pre: false, code: false },
  });

  const stats = {
    wordsTotal: 0,
    wordsChanged: 0,
    unknownWords: [],
  };

  walkNode(root, lookup, rules, stats, opts, prefs);
  const outputHtml = root.childNodes.map(serializeNode).join('');
  return { html: outputHtml, stats };
}

/**
 * Public API: process a plain text string (no HTML).
 * Returns the same shape as processHtml, with html containing escaped
 * text and spans around changed words.
 */
export function processText_(text, lookup, rules, options = {}) {
  const prefs = options.prefs || {};
  const stats = {
    wordsTotal: 0,
    wordsChanged: 0,
    unknownWords: [],
  };
  const html = processText(text, lookup, rules, stats, prefs);
  return { html, stats };
}
