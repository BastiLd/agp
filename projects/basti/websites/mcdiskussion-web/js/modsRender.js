// ---------------------------------------------------------------------------
// modsRender.js — renders the public Mods grid from the Supabase `mods` cache.
//
// Lazy-loads when the #mods section becomes active (same pattern as the
// comments block). Falls back to the hand-written static card if the table is
// empty or unreachable, so nothing ever breaks for visitors.
//
// The card itself (renderModCard) and the layout config (normalizeLayout) are
// exported so the mod editor (mod-editor.html) shows a live preview with the
// exact same code path.
// ---------------------------------------------------------------------------

import { getSupabase } from './supabaseClient.js';
import { t, getLanguage } from './i18n.js';
import { observeReveal } from './effects.js';

/** The building blocks of a mod card, in default order. */
export const BLOCKS = ['head', 'summary', 'stats', 'actions'];

/** Quick presets (dashboard dropdown); stored as a string in mods.data.layout. */
export const MOD_LAYOUTS = {
  standard: ['head', 'summary', 'stats', 'actions'],
  downloads_top: ['stats', 'head', 'summary', 'actions'],
  downloads_under_title: ['head', 'stats', 'summary', 'actions'],
  buttons_top: ['head', 'actions', 'summary', 'stats'],
};

/**
 * Normalise whatever is stored in mods.data.layout into one full config:
 *   { mode: 'grid'|'free', order: [...], hidden: [...],
 *     align: {block: 'left'|'center'|'right'}, pos: {block:{x,y,w}}, height }
 * Accepts: nothing (default), a preset string (dashboard dropdown), or a
 * config object (mod editor).
 */
export function normalizeLayout(raw) {
  const base = {
    mode: 'grid',
    order: [...MOD_LAYOUTS.standard],
    hidden: [],
    align: {},
    pos: {},
    height: 280,
  };
  if (typeof raw === 'string' && MOD_LAYOUTS[raw]) {
    base.order = [...MOD_LAYOUTS[raw]];
    return base;
  }
  if (raw && typeof raw === 'object') {
    if (raw.mode === 'free') base.mode = 'free';
    if (Array.isArray(raw.order)) {
      const order = raw.order.filter((b) => BLOCKS.includes(b));
      BLOCKS.forEach((b) => { if (!order.includes(b)) order.push(b); });
      base.order = order;
    }
    if (Array.isArray(raw.hidden)) base.hidden = raw.hidden.filter((b) => BLOCKS.includes(b));
    if (raw.align && typeof raw.align === 'object') base.align = raw.align;
    if (raw.pos && typeof raw.pos === 'object') base.pos = raw.pos;
    if (Number.isFinite(raw.height)) base.height = Math.max(140, Math.min(700, raw.height));
  }
  return base;
}

/**
 * Build a complete card element for a mod, honouring its layout config.
 * opts.classes — extra class string (the public grid adds 'beam').
 * opts.counts  — when true, downloads count up on reveal (public grid only).
 */
export function renderModCard(mod, opts = {}) {
  const card = document.createElement('article');
  card.className = 'card mod-card' + (opts.classes ? ' ' + opts.classes : '');
  card.setAttribute('data-mod-card', '');

  const head = document.createElement('div');
  head.className = 'mod-head';
  if (mod.icon_url) {
    const img = document.createElement('img');
    img.src = mod.icon_url;
    img.alt = '';
    img.loading = 'lazy';
    img.className = 'mod-icon';
    head.appendChild(img);
  } else {
    const ph = document.createElement('span');
    ph.className = 'mod-icon mod-icon-ph';
    ph.textContent = '📦';
    head.appendChild(ph);
  }
  const title = document.createElement('h3');
  title.textContent = mod.name;
  head.appendChild(title);

  const summary = document.createElement('p');
  const lang = getLanguage();
  summary.textContent =
    (lang === 'de' && mod.summary_de) ? mod.summary_de : (mod.summary_en || mod.summary_de || '');

  const stats = document.createElement('div');
  stats.className = 'mod-stats';
  let countEl = null;
  if (mod.downloads > 0) {
    const dl = document.createElement('span');
    dl.className = 'mod-stat';
    const num = document.createElement('strong');
    if (opts.counts) {
      num.dataset.count = String(mod.downloads);
      num.textContent = '0';
      countEl = num;
    } else {
      num.textContent = Number(mod.downloads).toLocaleString();
    }
    dl.append(num, ' ⬇ ', document.createTextNode(t('modDownloads')));
    stats.appendChild(dl);
  }
  if (mod.latest_version) {
    const v = document.createElement('span');
    v.className = 'mod-stat mod-version';
    v.textContent = mod.latest_version;
    stats.appendChild(v);
  }
  if (Array.isArray(mod.game_versions) && mod.game_versions.length) {
    const gv = document.createElement('span');
    gv.className = 'mod-stat';
    gv.textContent = `MC ${mod.game_versions[0]} – ${mod.game_versions[mod.game_versions.length - 1]}`;
    stats.appendChild(gv);
  }

  const actions = document.createElement('div');
  actions.className = 'card-actions';
  if (mod.modrinth_url) actions.appendChild(linkBtn(mod.modrinth_url, t('btnModrinth'), 'btn btn-primary', mod.slug));
  if (mod.github_url) actions.appendChild(linkBtn(mod.github_url, 'GitHub', 'btn btn-ghost', mod.slug));

  const blocks = { head, summary, stats, actions };
  const layout = normalizeLayout(mod.data && mod.data.layout);

  if (layout.mode === 'free') {
    card.classList.add('mod-card-free');
    card.style.minHeight = layout.height + 'px';
    layout.order.forEach((key) => {
      if (layout.hidden.includes(key)) return;
      const el = blocks[key];
      const pos = layout.pos[key] || { x: 0, y: 0, w: 100 };
      el.classList.add('mod-block-free');
      el.dataset.block = key;
      el.style.left = (pos.x || 0) + '%';
      el.style.top = (pos.y || 0) + '%';
      el.style.width = (pos.w || 100) + '%';
      applyAlign(el, key, layout.align[key]);
      card.appendChild(el);
    });
  } else {
    layout.order.forEach((key) => {
      if (layout.hidden.includes(key)) return;
      const el = blocks[key];
      el.dataset.block = key;
      applyAlign(el, key, layout.align[key]);
      card.appendChild(el);
    });
  }

  if (countEl && opts.counts) observeReveal(countEl);
  return card;
}

function applyAlign(el, key, align) {
  if (!align || align === 'left') return;
  el.style.textAlign = align;
  // flex rows align via justify-content instead
  if (key === 'actions' || key === 'stats' || key === 'head') {
    el.style.justifyContent = align === 'center' ? 'center' : 'flex-end';
  }
}

function linkBtn(href, label, cls, slug) {
  const a = document.createElement('a');
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener';
  a.className = cls;
  a.textContent = label;
  a.dataset.track = 'download';
  a.dataset.trackLabel = `mod:${slug}`;
  return a;
}

export function initModsRender() {
  const grid = document.querySelector('[data-mods-grid]');
  if (!grid) return;

  let loaded = false;
  let cached = null;

  async function load() {
    if (loaded) return;
    loaded = true;
    const sb = getSupabase();
    if (!sb) { loaded = false; return; }

    const { data, error } = await sb
      .from('mods')
      .select('*')
      .eq('visible', true)
      .order('sort', { ascending: true })
      .order('created_at', { ascending: true });

    if (error || !data || !data.length) {
      // keep the static fallback card; retry on next visit if it was an error
      if (error) { console.warn('[mods] load failed:', error.message); loaded = false; }
      return;
    }
    cached = data;
    render(data);
  }

  function render(mods) {
    // Remove the static fallback card; keep the "coming soon" card at the end.
    grid.querySelectorAll('[data-mods-fallback]').forEach((el) => el.remove());
    grid.querySelectorAll('[data-mod-card]').forEach((el) => el.remove());
    const soon = grid.querySelector('[data-mods-soon]');

    mods.forEach((mod) => {
      const card = renderModCard(mod, { classes: 'beam', counts: true });
      if (soon) grid.insertBefore(card, soon);
      else grid.appendChild(card);
    });
  }

  document.addEventListener('sectionchange', (e) => {
    if (e.detail.id === 'mods') load();
  });
  document.addEventListener('languagechange', () => {
    if (cached) render(cached);
  });
  if ((location.hash || '').slice(1) === 'mods') load();
}
