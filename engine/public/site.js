/**
 * site.js — injects shared nav + footer into every public page.
 *
 * Pages link this script; on DOMContentLoaded it:
 *   1. Inserts a top navigation bar (sticky, with mobile hamburger).
 *   2. Highlights the menu link matching window.location.pathname.
 *   3. Inserts a footer with secondary links.
 *
 * Pages can override by placing their own <nav id="site-nav"> or
 * <footer id="site-footer"> in the DOM — site.js fills them if empty
 * or untouched.
 */

const NAV_LINKS = [
  { href: '/learn',            label: 'Learn' },
  { href: '/type',             label: 'Type' },
  { href: '/read',             label: 'Read' },
  { href: '/manifesto/',       label: 'Manifesto' },
  { href: '/download',         label: 'Download' },
  { href: '/developer',        label: 'Developer' },
];

const FOOTER_TOOL_LINKS = [
  { href: '/faq',                label: 'FAQ' },
  { href: '/ipa-inventory.html', label: 'IPA character inventory' },
  { href: '/ipa-keyboard.html',  label: 'IPA keyboard reference' },
  { href: '/harness',            label: 'Engine harness (rewrite English)' },
];

const FOOTER_ABOUT_LINKS = [
  { href: 'https://www.gnowledge.org/projects/naYana', label: 'About the gnowledge lab', external: true },
  { href: 'https://github.com/gnowledge/naYana-tutor', label: 'Source on GitHub', external: true },
  { href: 'https://github.com/gnowledge/naYana-tutor/issues/new', label: 'Report a bug / suggest a feature', external: true },
  { href: '/manifesto/', label: 'Read the manifesto' },
];

function isActive(href) {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const norm = href.replace(/\/$/, '') || '/';
  if (norm === '/' && path === '/') return true;
  // Match if path starts with the link href (so /learn/lesson-1 highlights /learn)
  return norm !== '/' && (path === norm || path.startsWith(norm + '/'));
}

function buildNav() {
  const links = NAV_LINKS.map((l) => {
    const cls = isActive(l.href) ? ' class="active"' : '';
    return `<a href="${l.href}"${cls}>${l.label}</a>`;
  }).join('');
  return `
    <nav class="site-nav" aria-label="Main">
      <div class="site-nav-inner">
        <a class="site-nav-brand" href="/">naYana<span class="site-nav-brand-scope">for English · v0.1</span></a>
        <button class="site-nav-burger" aria-label="Open menu" aria-expanded="false">☰</button>
        <div class="site-nav-menu" id="site-nav-menu">${links}</div>
      </div>
    </nav>
  `;
}

function buildFooter() {
  const tools = FOOTER_TOOL_LINKS.map((l) => `<li><a href="${l.href}">${l.label}</a></li>`).join('');
  const about = FOOTER_ABOUT_LINKS.map((l) => {
    const ext = l.external ? ' target="_blank" rel="noopener"' : '';
    return `<li><a href="${l.href}"${ext}>${l.label}</a></li>`;
  }).join('');
  return `
    <footer class="site-footer">
      <div class="site-footer-inner">
        <div class="site-footer-meta">
          <h4>naYana for English</h4>
          <p>Learn the International Phonetic Alphabet in a few easy steps.
             Read, type, and write English phonetically — fully IPA + Unicode
             compliant. v0.1 — General American dialect.</p>
          <p>Free + open source · SIL Open Font License 1.1 ·
             Built at the <a href="https://www.gnowledge.org" target="_blank" rel="noopener">gnowledge lab</a>.</p>
        </div>
        <div>
          <h4>Reference</h4>
          <ul>${tools}</ul>
        </div>
        <div>
          <h4>About</h4>
          <ul>${about}</ul>
        </div>
      </div>
    </footer>
  `;
}

function injectNav() {
  let nav = document.querySelector('nav.site-nav');
  if (nav) return;  // page provided its own
  document.body.insertAdjacentHTML('afterbegin', buildNav());
}

function injectFooter() {
  let footer = document.querySelector('footer.site-footer');
  if (footer) return;
  document.body.insertAdjacentHTML('beforeend', buildFooter());
}

function wireBurger() {
  const btn = document.querySelector('.site-nav-burger');
  const menu = document.getElementById('site-nav-menu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  // Close on link click (mobile)
  menu.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    injectNav();
    injectFooter();
    wireBurger();
  });
} else {
  injectNav();
  injectFooter();
  wireBurger();
}
