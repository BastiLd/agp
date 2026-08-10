// ---------------------------------------------------------------------------
// app.js — orchestrates navigation, i18n, and all signature animations.
// Loaded as an ES module; pulls in the games and comments modules.
// ---------------------------------------------------------------------------

import { setLanguage, getLanguage, detectLanguage, t } from './i18n.js';
import { initGames } from './games.js';
import { initComments } from './comments.js';
import { initAnalytics } from './analytics.js';
import { initAdmin } from './admin.js';
import { initEffects } from './effects.js';
import { initModsRender } from './modsRender.js';

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const isTouch =
  window.matchMedia('(hover: none), (pointer: coarse)').matches || 'ontouchstart' in window;

const reduced = () => prefersReduced.matches;

// ===========================================================================
// 1. Language
// ===========================================================================
function initLanguage() {
  setLanguage(detectLanguage());

  const toggle = document.getElementById('lang-toggle');
  toggle?.addEventListener('click', () => {
    setLanguage(getLanguage() === 'de' ? 'en' : 'de');
  });
}

// ===========================================================================
// 2. Hash router with View Transitions
// ===========================================================================
const SECTIONS = ['home', 'restoreinventory', 'games', 'mods', 'admin'];

function currentId() {
  const id = (location.hash || '#home').slice(1);
  return SECTIONS.includes(id) ? id : 'home';
}

function applyRoute(id) {
  document.querySelectorAll('main > .section').forEach((sec) => {
    sec.hidden = sec.id !== id;
  });
  document.querySelectorAll('[data-nav]').forEach((link) => {
    const target = (link.getAttribute('href') || '').slice(1);
    link.classList.toggle('active', target === id);
    if (target === id) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  const section = document.getElementById(id);
  // Move focus for screen-reader users without yanking the scroll on hash nav.
  if (section) section.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });

  document.dispatchEvent(new CustomEvent('sectionchange', { detail: { id } }));
}

function route() {
  const id = currentId();
  if (document.startViewTransition && !reduced()) {
    document.startViewTransition(() => applyRoute(id));
  } else {
    applyRoute(id);
  }
}

function initRouter() {
  window.addEventListener('hashchange', route);
  route();
}

// ===========================================================================
// 3. Signature heading hover effect (per-letter)
// ===========================================================================
function splitHeading(el) {
  const text = el.dataset.text || el.textContent;
  el.dataset.text = text;
  el.textContent = '';
  const frag = document.createDocumentFragment();
  for (const ch of text) {
    const span = document.createElement('span');
    span.className = ch === ' ' ? 'char space' : 'char';
    span.textContent = ch === ' ' ? ' ' : ch;
    frag.appendChild(span);
  }
  el.appendChild(frag);
}

function bindHeadingHover(el) {
  if (el.dataset.hoverBound) return;
  el.dataset.hoverBound = '1';

  let raf = 0;
  let lastEvent = null;

  const render = () => {
    raf = 0;
    if (!lastEvent) return;
    const chars = el.querySelectorAll('.char');
    chars.forEach((c) => {
      const r = c.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = lastEvent.clientX - cx;
      const dy = lastEvent.clientY - cy;
      const dist = Math.hypot(dx, dy);
      const radius = 120;
      if (dist < radius) {
        const power = 1 - dist / radius;
        const lift = -14 * power;
        const rot = (dx / radius) * 16 * power;
        c.style.transform = `translateY(${lift}px) rotate(${rot}deg)`;
        c.style.color = 'var(--accent-strong)';
      } else {
        c.style.transform = '';
        c.style.color = '';
      }
    });
  };

  el.addEventListener('mousemove', (e) => {
    if (reduced()) return;
    lastEvent = e;
    if (!raf) raf = requestAnimationFrame(render);
  });
  el.addEventListener('mouseleave', () => {
    lastEvent = null;
    el.querySelectorAll('.char').forEach((c) => {
      c.style.transform = '';
      c.style.color = '';
    });
  });
}

function initSignatureHeadings() {
  const split = () => {
    document.querySelectorAll('.sig-heading').forEach((el) => {
      splitHeading(el);
      bindHeadingHover(el);
    });
  };
  split();
  // i18n rewrites textContent, so re-split after every language change.
  document.addEventListener('languagechange', () => {
    document.querySelectorAll('.sig-heading').forEach((el) => delete el.dataset.text);
    split();
  });
}

// ===========================================================================
// 4. Magnetic buttons
// ===========================================================================
function initMagnets() {
  if (isTouch) return;
  document.querySelectorAll('.magnet').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      if (reduced()) return;
      const r = el.getBoundingClientRect();
      const mx = e.clientX - (r.left + r.width / 2);
      const my = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${mx * 0.25}px, ${my * 0.35}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });
}

// ===========================================================================
// 5. Spotlight cursor
// ===========================================================================
function initSpotlight() {
  if (isTouch) return;
  const root = document.documentElement;
  window.addEventListener(
    'mousemove',
    (e) => {
      root.style.setProperty('--mouse-x', `${e.clientX}px`);
      root.style.setProperty('--mouse-y', `${e.clientY}px`);
    },
    { passive: true }
  );
}

// ===========================================================================
// 6. Scroll reveal
// ===========================================================================
function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (reduced() || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('visible'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  items.forEach((el) => io.observe(el));
}

// ===========================================================================
// 7. 3D tilt cards
// ===========================================================================
function initTilt() {
  if (isTouch || reduced() || !window.VanillaTilt) return;
  const cards = document.querySelectorAll('.tilt');
  if (cards.length) {
    window.VanillaTilt.init(cards, {
      max: 8,
      speed: 400,
      glare: true,
      'max-glare': 0.18,
      scale: 1.015,
    });
  }
}

// ===========================================================================
// 8. Text scramble (GSAP)
// ===========================================================================
function scrambleSubtitle() {
  const el = document.getElementById('hero-subtitle');
  if (!el) return;
  const target = t('heroSubtitle');
  if (reduced() || !window.gsap || !window.ScrambleTextPlugin) {
    el.textContent = target;
    return;
  }
  gsap.registerPlugin(window.ScrambleTextPlugin);
  gsap.to(el, {
    duration: 1.4,
    scrambleText: { text: target, chars: 'upperAndLowerCase', speed: 0.5 },
  });
}

function initScramble() {
  scrambleSubtitle();
  // Re-run on language change (only when Home is visible).
  document.addEventListener('languagechange', () => {
    if (currentId() === 'home') scrambleSubtitle();
  });
  document.addEventListener('sectionchange', (e) => {
    if (e.detail.id === 'home') scrambleSubtitle();
  });
}

// ===========================================================================
// Boot
// ===========================================================================
// Run an init step in isolation: if one feature throws, the rest (and crucially
// the navigation) still work.
function safe(label, fn) {
  try {
    fn();
  } catch (e) {
    console.error(`[boot] ${label} failed:`, e);
  }
}

function boot() {
  if (isTouch) document.body.classList.add('is-touch');

  // Language + router first so navigation is guaranteed even if a later
  // feature module errors out. Analytics is set up before the router so it sees
  // the very first section view.
  safe('language', initLanguage);
  safe('analytics', initAnalytics);
  safe('router', initRouter);
  safe('signature-headings', initSignatureHeadings);
  safe('games', initGames);
  safe('comments', initComments);
  safe('mods-render', initModsRender);
  safe('admin', initAdmin);
  safe('magnets', initMagnets);
  safe('spotlight', initSpotlight);
  safe('reveal', initReveal);
  safe('tilt', initTilt);
  safe('scramble', initScramble);
  safe('effects', initEffects);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
