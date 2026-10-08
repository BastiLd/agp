'use strict';

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const SEC = 1000;
  const MIN = 60 * SEC;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;
  const BLOCK = 5 * HOUR;
  const ACTIVE_MS = 90 * SEC;

  // Compact event layout sent by server.js: [t, session, model, input, output, thinking, cacheWrite, cacheRead, subagent]
  const T = 0, S = 1, M = 2, I = 3, O = 4, TH = 5, CW = 6, CR = 7, SUB = 8;

  // ---------- Formatting ----------
  const nf = new Intl.NumberFormat('de-AT');
  const df = new Intl.NumberFormat('de-AT', { maximumFractionDigits: 1 });
  const usd = new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmt = (n) => nf.format(Math.round(n));
  // German Intl "compact" has no thousands abbreviation, so this is done by hand.
  const fmtC = (n) => {
    const a = Math.abs(n);
    if (a >= 1e9) return `${df.format(n / 1e9)} Mrd.`;
    if (a >= 1e6) return `${df.format(n / 1e6)} Mio.`;
    if (a >= 1e4) return `${df.format(n / 1e3)} Tsd.`;
    return nf.format(Math.round(n));
  };
  const fmtUSD = (n) => usd.format(n);
  const say = (n) => {
    const a = Math.abs(n);
    if (a >= 1e9) return `${df.format(n / 1e9)} Milliarden`;
    if (a >= 1e6) return `${df.format(n / 1e6)} Millionen`;
    if (a >= 1e4) return `${df.format(n / 1e3)} Tausend`;
    return nf.format(Math.round(n));
  };
  const pct = (a, b) => (b ? (a / b) * 100 : 0);
  const pctStr = (a, b) => `${pct(a, b).toLocaleString('de-AT', { maximumFractionDigits: 1 })} %`;
  const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const WD_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const LIMIT_LABEL = { '5h': '5-Stunden-Limit', weekly: 'Wochenlimit', monthly: 'Monatl. Ausgabenlimit', other: 'Limit' };
  const fmtTime = (ts, sec) => new Date(ts).toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit', second: sec ? '2-digit' : undefined });
  const fmtDate = (ts, year) => new Date(ts).toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: year ? 'numeric' : undefined });
  const fmtDT = (ts) => `${WD[new Date(ts).getDay()]} ${fmtDate(ts)} ${fmtTime(ts)}`;
  function fmtDur(ms) {
    const m = Math.max(0, Math.round(ms / MIN));
    const d = Math.floor(m / 1440);
    const h = Math.floor((m % 1440) / 60);
    if (d) return `${d} T ${h} Std`;
    if (h) return `${h}:${String(m % 60).padStart(2, '0')} h`;
    return `${m} Min`;
  }
  function fmtAgo(ts, now) {
    const s = Math.round((now - ts) / SEC);
    if (s < 45) return 'gerade eben';
    if (s < 3600) return `vor ${Math.max(1, Math.round(s / 60))} Min.`;
    if (s < 86400) return `vor ${Math.round(s / 3600)} Std.`;
    return `vor ${Math.round(s / 86400)} T.`;
  }
  function prettyModel(name) {
    if (!name) return 'Unbekannt';
    const m = name.replace(/^claude-/, '').replace(/-\d{8}$/, '');
    const parts = m.split('-');
    if (parts.length < 2 || !/^[a-z]+$/.test(parts[0])) return name;
    return `${parts[0][0].toUpperCase()}${parts[0].slice(1)} ${parts.slice(1).join('.')}`;
  }

  const SERIES = [
    { key: 'i', label: 'Input', cls: 'c-i', fill: 'f-i', color: 'var(--c-i)' },
    { key: 'cw', label: 'Cache schreiben', cls: 'c-cw', fill: 'f-cw', color: 'var(--c-cw)' },
    { key: 'ot', label: 'Output', cls: 'c-o', fill: 'f-ot', color: 'var(--c-o)' },
    { key: 'th', label: 'Thinking', cls: 'c-th', fill: 'f-th', color: 'var(--c-th)' },
    { key: 'cr', label: 'Cache lesen', cls: 'c-cr', fill: 'f-cr', color: 'var(--c-cr)' },
  ];

  const METRICS = {
    all: { label: 'Alle Tokens', short: 'Tokens gesamt', hidden: [], hint: 'Alles zusammen – inklusive „Cache lesen“, das bei langen Chats riesig wird.' },
    nocache: { label: 'Ohne Cache-Lesen', short: 'Tokens ohne Cache-Lesen', hidden: ['cr'], hint: 'Input + Cache schreiben + Output. Cache-Lesen ist extrem billig (bei der API 10 %) und bläht die Zahl sonst auf.' },
    output: { label: 'Nur Output', short: 'Output-Tokens', hidden: ['i', 'cw', 'cr'], hint: 'Nur was Claude selbst geschrieben hat (inkl. Thinking).' },
  };

  const VIEWS = [
    ['usage', 'Nutzung'],
    ['credit', 'Guthaben'],
    ['both', 'Beides'],
  ];

  // Anthropic API list prices in USD per 1M tokens: [input, output, cache read]. Cache writes: 2× input (1-hour cache, used by Claude Code).
  const PRICE_TABLE = [
    [/fable-5-1|mythos-5-1/, 10, 50, 0.25],
    [/fable|mythos/, 10, 50, 1],
    [/opus-(5|4-[5-9])/, 5, 25, 0.5],
    [/opus/, 15, 75, 1.5],
    [/sonnet-5/, 2, 10, 0.2],
    [/sonnet/, 3, 15, 0.3],
    [/haiku-4/, 1, 5, 0.1],
    [/haiku/, 0.8, 4, 0.08],
  ];

  // ---------- Storage ----------
  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(`td-${key}`);
        return v === null ? fallback : JSON.parse(v);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(`td-${key}`, JSON.stringify(value));
      } catch {
        /* storage unavailable */
      }
    },
  };

  // Time range: { kind: 'hours' | 'days', n } | { kind: 'span', from, to } | { kind: 'all' }
  function normalizeRange(r) {
    if (typeof r === 'number') return r ? { kind: 'days', n: r } : { kind: 'all' };
    if (r && (r.kind === 'all' || ((r.kind === 'days' || r.kind === 'hours') && r.n > 0) || (r.kind === 'span' && r.to > r.from))) return r;
    return { kind: 'days', n: 30 };
  }

  const initialView = store.get('view', 'usage');
  const state = {
    data: null,
    loadedAt: 0,
    offline: false,
    manualProject: null, // null = auto (latest project); '' = all projects; otherwise project key
    view: VIEWS.some(([k]) => k === initialView) ? initialView : 'usage',
    metric: METRICS[store.get('metric', 'nocache')] ? store.get('metric', 'nocache') : 'nocache',
    range: normalizeRange(store.get('range', { kind: 'days', n: 30 })),
    planPrice: Number(store.get('planPrice', 20)),
    notify: { finish: false, limit: false, reset: false, limitPct: 80, ...store.get('notify', {}) },
    prevActive: false,
    notified: {},
    hidden: new Set(store.get('hidden', ['cr'])),
    weekDay: store.get('weekDay', ''),
    weekHour: Number(store.get('weekHour', 0)),
    refreshSec: Number(store.get('refreshSec', 10)),
    live: true,
    limitRef: store.get('limitRef', {}),
    creditBudget: Number(store.get('creditBudget', 0)),
    planQuota: Number(store.get('planQuota', 0)),
    voiceURI: store.get('voice', ''),
    voiceRate: Number(store.get('voiceRate', 1.02)),
    bootMode: store.get('bootMode', 'session'),
    sound: Boolean(store.get('sound', false)),
    sortKey: 'last',
    sortDir: -1,
    search: '',
    sessionLimit: 60,
    granularity: store.get('granularity', 'day'),
    lastMaxT: 0,
    newKeys: new Set(),
    animateChart: true,
    briefing: false,
    scoped: [],
    accountBlocks: new Map(),
    credit: null,
  };
  const isCredit = () => state.view === 'credit';
  const showMoney = () => state.view !== 'usage';

  // ---------- DOM helpers ----------
  function h(tag, props, ...children) {
    const el = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'style') el.style.cssText = v;
        else if (k === 'text') el.textContent = v;
        else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const c of children.flat()) if (c != null && c !== false) el.append(c instanceof Node ? c : String(c));
    return el;
  }
  function svg(tag, attrs, ...children) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, v);
    for (const c of children.flat()) if (c != null) el.append(c instanceof Node ? c : String(c));
    return el;
  }
  const icon = (d) => svg('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' }, svg('path', { d, fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  const ICON_OPEN = 'M14 4h6v6M20 4l-8 8M10 5H5v14h14v-5';

  // Value formatting follows the view: tokens or US dollars (API value).
  const fmtV = (n) => (isCredit() ? fmtUSD(n) : fmtC(n));
  const fmtVFull = (n) => (isCredit() ? fmtUSD(n) : fmt(n));

  function countTo(el, value, format = fmtV, duration = 900) {
    const from = Number(el.dataset.v || 0);
    const sameUnit = el.dataset.u === state.view;
    el.dataset.v = String(value);
    el.dataset.u = state.view;
    el.title = format === fmt ? fmt(value) : fmtVFull(value);
    if (from === value || !sameUnit || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = format(value);
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / duration);
      el.textContent = format(from + (value - from) * (1 - (1 - p) ** 3));
      if (p < 1 && el.dataset.v === String(value)) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  let toastTimer = 0;
  function toast(text, isError) {
    document.querySelectorAll('.toast').forEach((t) => t.remove());
    const el = h('div', { class: `toast${isError ? ' err' : ''}`, role: 'status', text });
    document.body.append(el);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.remove(), 3200);
  }

  async function copyText(text, label) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = h('textarea', { style: 'position:fixed;opacity:0' });
      ta.value = text;
      document.body.append(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    toast(`${label} kopiert`);
    blip(990, 0.05);
  }

  function downloadCSV(name, rows) {
    const cell = (v) => {
      let s = v == null ? '' : String(v);
      if (/^[=+\-@]/.test(s)) s = `'${s}`; // no formulas when opened in Excel
      return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = rows.map((r) => r.map(cell).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }));
    const a = h('a', { href: url, download: name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast(`${name} gespeichert`);
  }

  async function openFolder(sessionId) {
    try {
      const res = await fetch('/api/open', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Token-Dashboard': '1' }, body: JSON.stringify({ sessionId }) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || res.status);
      toast(`Ordner geöffnet: ${body.path}`);
    } catch (err) {
      toast(`Ordner konnte nicht geöffnet werden: ${err.message}`, true);
    }
  }

  // ---------- Prices ----------
  const priceCache = new Map();
  function priceOf(modelIdx) {
    if (priceCache.has(modelIdx)) return priceCache.get(modelIdx);
    const name = (state.data && state.data.models[modelIdx]) || '';
    const row = PRICE_TABLE.find(([re]) => re.test(name));
    const p = row ? { in: row[1], out: row[2], cr: row[3], known: true } : { in: 5, out: 25, cr: 0.5, known: false };
    priceCache.set(modelIdx, p);
    return p;
  }
  function evCost(e) {
    const p = priceOf(e[M]);
    return (e[I] * p.in + e[CW] * p.in * 2 + e[CR] * p.cr + e[O] * p.out) / 1e6;
  }
  const costSum = (events) => events.reduce((s, e) => s + evCost(e), 0);

  // ---------- Aggregation ----------
  const newAcc = () => ({ i: 0, o: 0, th: 0, ot: 0, cw: 0, cr: 0, total: 0, n: 0, sub: 0 });
  // In the "Guthaben" view every category is summed in US dollars instead of tokens.
  function add(acc, e) {
    let i = e[I];
    let cw = e[CW];
    let cr = e[CR];
    let th = e[TH];
    let ot = e[O] - e[TH];
    if (isCredit()) {
      const p = priceOf(e[M]);
      i = (i * p.in) / 1e6;
      cw = (cw * p.in * 2) / 1e6;
      cr = (cr * p.cr) / 1e6;
      th = (th * p.out) / 1e6;
      ot = (ot * p.out) / 1e6;
    }
    acc.i += i;
    acc.cw += cw;
    acc.cr += cr;
    acc.th += th;
    acc.ot += ot;
    acc.o += ot + th;
    const t = i + cw + cr + ot + th;
    acc.total += t;
    if (e[SUB]) acc.sub += t;
    acc.n++;
    return acc;
  }
  const mAcc = (a) => (isCredit() || state.metric === 'all' ? a.i + a.o + a.cw + a.cr : state.metric === 'nocache' ? a.i + a.o + a.cw : a.o);
  const mEv = (e) => (isCredit() ? evCost(e) : state.metric === 'all' ? e[I] + e[O] + e[CW] + e[CR] : state.metric === 'nocache' ? e[I] + e[O] + e[CW] : e[O]);
  const unitLabel = () => (isCredit() ? 'API-Wert (USD)' : METRICS[state.metric].short);
  const projectKey = (s) => s.cwd || s.project;
  const dayKey = (ts) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  };
  const startOfDay = (ts) => {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const startOfMonth = (ts) => {
    const d = new Date(ts);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  function rangeStart(now) {
    const r = state.range;
    if (r.kind === 'all') return -Infinity;
    if (r.kind === 'hours') return now - r.n * HOUR;
    if (r.kind === 'span') return r.from;
    const d = new Date(startOfDay(now));
    d.setDate(d.getDate() - (r.n - 1));
    return d.getTime();
  }
  const rangeEnd = (now) => (state.range.kind === 'span' ? state.range.to : now + MIN);
  // Up to 3 days the charts switch from days to hours.
  const hourlyRange = (now) => Number.isFinite(rangeStart(now)) && Math.min(rangeEnd(now), now) - rangeStart(now) <= 72 * HOUR;
  const fmtDTshort = (ts) => `${fmtDate(ts)} ${fmtTime(ts)}`;
  function rangeLabel() {
    const r = state.range;
    if (r.kind === 'all') return 'gesamter Zeitraum';
    if (r.kind === 'hours') return `letzte ${fmt(r.n)} ${r.n === 1 ? 'Stunde' : 'Stunden'}`;
    if (r.kind === 'days') return `letzte ${fmt(r.n)} ${r.n === 1 ? 'Tag' : 'Tage'}`;
    return `${fmtDTshort(r.from)} – ${fmtDTshort(r.to)}`;
  }
  const inRangeOf = (events, now) => {
    const start = rangeStart(now);
    const end = rangeEnd(now);
    return events.filter((e) => e[T] >= start && e[T] <= end);
  };
  function lastWeeklyReset(now) {
    if (state.weekDay === '' || state.weekDay == null) return now - 7 * DAY;
    const d = new Date(now);
    d.setHours(state.weekHour, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() - Number(state.weekDay) + 7) % 7));
    if (d.getTime() > now) d.setDate(d.getDate() - 7);
    return d.getTime();
  }
  const allEvents = () => state.data.events;
  const latestOf = (events) => (events.length ? events[events.length - 1] : null);
  function currentProject() {
    if (state.manualProject !== null) return state.manualProject;
    const last = latestOf(allEvents());
    return last ? projectKey(state.data.sessions[last[S]]) : '';
  }
  function projectLabel(key) {
    if (!key) return 'Alle Projekte';
    const s = state.data.sessions.find((x) => projectKey(x) === key);
    return s ? s.project : key;
  }
  const scopeName = () => (currentProject() ? projectLabel(currentProject()).toUpperCase() : 'ALLE PROJEKTE');
  function activeBlock(now) {
    const b = state.data.blocks[state.data.blocks.length - 1];
    return b && now < b.end ? b : null;
  }
  // Sums of the given events per 5h block. Blocks and events are both sorted by time.
  function blocksFor(events) {
    const out = [];
    let k = 0;
    for (const b of state.data.blocks) {
      const acc = newAcc();
      while (k < events.length && events[k][T] < b.start) k++;
      let j = k;
      while (j < events.length && events[j][T] < b.end) add(acc, events[j++]);
      k = j;
      out.push({ b, acc });
    }
    return out;
  }
  const accountAcc = (b) => state.accountBlocks.get(b.start) || newAcc();
  const limitInBlock = (b) => Boolean(b && b.limit && b.limit.type === '5h');
  // Account-level reference for the load gauge (limits apply per account, not per project).
  function referenceBlock(now) {
    const custom = state.limitRef[isCredit() ? 'credit' : state.metric];
    if (custom > 0) return { value: custom, label: 'dein Limit-Wert' };
    const current = activeBlock(now);
    const earlier = state.data.blocks.filter((b) => b !== current);
    const limits = earlier.filter(limitInBlock);
    if (limits.length) return { value: mAcc(accountAcc(limits[limits.length - 1])), label: 'letztes 5-Std-Limit' };
    return { value: earlier.reduce((m, b) => Math.max(m, mAcc(accountAcc(b))), 0), label: 'größter Block' };
  }
  const isActive = (now, events = allEvents()) => {
    const last = latestOf(events);
    return Boolean(last && now - last[T] < ACTIVE_MS);
  };
  const filteredEvents = (now) => inRangeOf(state.scoped, now);
  function sessionRows(events) {
    const by = new Map();
    for (const e of events) {
      if (!by.has(e[S])) by.set(e[S], { idx: e[S], s: state.data.sessions[e[S]], acc: newAcc(), first: e[T], last: 0, models: new Set(), cost: 0 });
      const r = by.get(e[S]);
      add(r.acc, e);
      r.cost += evCost(e);
      r.last = Math.max(r.last, e[T]);
      r.first = Math.min(r.first, e[T]);
      r.models.add(e[M]);
    }
    return [...by.values()];
  }

  // ---------- Credit ("Guthaben") estimate ----------
  // Claude Code logs contain no billing data. Estimate: every 5h block includes a plan quota
  // (API value in USD); whatever a block uses beyond that counts as paid extra usage.
  function planQuota() {
    if (state.planQuota > 0) return { value: state.planQuota, auto: false };
    const limited = state.data.blocks.filter(limitInBlock);
    const b = limited[limited.length - 1];
    if (!b) return { value: 0, auto: true };
    const v = state.data.events.reduce((s, e) => (e[T] >= b.start && e[T] <= b.limit.t ? s + evCost(e) : s), 0);
    return { value: v, auto: true };
  }
  function computeCredit(now) {
    const quota = planQuota();
    const monthStart = startOfMonth(now);
    const perBlock = new Map();
    let k = 0;
    const events = state.data.events;
    let monthCredit = 0;
    let monthValue = 0;
    for (const b of state.data.blocks) {
      while (k < events.length && events[k][T] < b.start) k++;
      let v = 0;
      let j = k;
      while (j < events.length && events[j][T] < b.end) v += evCost(events[j++]);
      k = j;
      const credit = quota.value > 0 ? Math.max(0, v - quota.value) : 0;
      perBlock.set(b.start, { value: v, credit });
      if (b.start >= monthStart) monthCredit += credit;
    }
    for (let x = events.length - 1; x >= 0 && events[x][T] >= monthStart; x--) monthValue += evCost(events[x]);
    return { quota, perBlock, monthCredit, monthValue, budget: state.creditBudget, monthStart };
  }

  // ---------- Sound (optional, off by default) ----------
  let audio = null;
  function blip(freq = 880, dur = 0.07, vol = 0.04) {
    if (!state.sound) return;
    try {
      audio = audio || new AudioContext();
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.frequency.setValueAtTime(freq, audio.currentTime);
      o.frequency.exponentialRampToValueAtTime(freq * 1.5, audio.currentTime + dur);
      g.gain.setValueAtTime(vol, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur * 2.5);
      o.connect(g).connect(audio.destination);
      o.start();
      o.stop(audio.currentTime + dur * 3);
    } catch {
      /* audio not available */
    }
  }

  // ---------- Dropdown (listbox) ----------
  let ddCounter = 0;
  function createDropdown(root, { label, onSelect, small }) {
    const id = `dd${++ddCounter}`;
    let options = [];
    let value = null;
    let active = 0;
    const vEl = h('span', { class: 'dd-v', text: '—' });
    const badge = h('span', { class: 'dd-badge', text: 'AUTO', hidden: true });
    const caret = svg('svg', { class: 'dd-caret', viewBox: '0 0 12 12', 'aria-hidden': 'true' }, svg('path', { d: 'M2 4l4 4 4-4', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round' }));
    const btn = h('button', { class: 'dd-btn', type: 'button', 'aria-haspopup': 'listbox', 'aria-expanded': 'false', 'aria-label': label }, h('span', { class: 'dd-text' }, small ? null : h('span', { class: 'dd-k', text: label }), vEl), badge, caret);
    const list = h('ul', { class: 'dd-list', role: 'listbox', tabindex: '-1', id: `${id}-list`, hidden: true, 'aria-label': label });
    root.replaceChildren(btn, list);
    const isOpen = () => !list.hidden;
    function paintActive() {
      [...list.children].forEach((li, i) => li.classList.toggle('active', i === active));
      const li = list.children[active];
      if (li) {
        list.setAttribute('aria-activedescendant', li.id);
        li.scrollIntoView({ block: 'nearest' });
      }
    }
    function open() {
      if (isOpen()) return;
      document.querySelectorAll('.dd.open').forEach((d) => d !== root && d.__close && d.__close());
      list.replaceChildren(
        ...options.map((o, i) =>
          h(
            'li',
            {
              id: `${id}-o${i}`,
              role: 'option',
              class: `dd-opt${o.sep ? ' sep' : ''}${o.auto ? ' auto' : ''}`,
              'aria-selected': String(o.value === value),
              onmousedown: (e) => e.preventDefault(),
              onclick: () => choose(i),
              onmousemove: () => {
                if (active !== i) {
                  active = i;
                  paintActive();
                }
              },
            },
            h('span', { class: 'lbl', text: o.label }),
            o.hint ? h('small', { text: o.hint }) : null,
          ),
        ),
      );
      list.hidden = false;
      root.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      active = Math.max(0, options.findIndex((o) => o.value === value));
      paintActive();
      list.focus();
    }
    function close(focusBtn) {
      if (!isOpen()) return;
      list.hidden = true;
      root.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      if (focusBtn) btn.focus();
    }
    function choose(i) {
      const o = options[i];
      close(true);
      if (o) onSelect(o.value);
    }
    root.__close = () => close(false);
    btn.addEventListener('click', () => (isOpen() ? close(true) : open()));
    btn.addEventListener('keydown', (e) => {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        open();
      }
    });
    list.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') active = Math.min(options.length - 1, active + 1);
      else if (e.key === 'ArrowUp') active = Math.max(0, active - 1);
      else if (e.key === 'Home') active = 0;
      else if (e.key === 'End') active = options.length - 1;
      else if (e.key === 'Enter' || e.key === ' ') return e.preventDefault(), choose(active);
      else if (e.key === 'Escape' || e.key === 'Tab') return close(e.key === 'Escape');
      else return;
      e.preventDefault();
      paintActive();
    });
    list.addEventListener('blur', () => setTimeout(() => !root.contains(document.activeElement) && close(false), 0));
    document.addEventListener('pointerdown', (e) => {
      if (!root.contains(e.target)) close(false);
    });
    return {
      set(opts, val, { text, auto } = {}) {
        options = opts;
        value = val;
        const cur = opts.find((o) => o.value === val);
        vEl.textContent = text || (cur ? cur.label : '—');
        badge.hidden = !auto;
      },
      disable(flag) {
        btn.disabled = flag;
      },
    };
  }

  // ---------- Tooltip & charts ----------
  const tooltip = $('#tooltip');
  function showTip(content, x, y) {
    tooltip.replaceChildren(content);
    tooltip.hidden = false;
    const r = tooltip.getBoundingClientRect();
    let left = x + 14;
    let top = y - r.height - 12;
    if (left + r.width > innerWidth - 8) left = x - r.width - 14;
    if (left < 8) left = 8;
    if (top < 8) top = y + 16;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }
  const hideTip = () => (tooltip.hidden = true);
  document.addEventListener('scroll', hideTip, { passive: true });
  function accTip(title, acc, extra) {
    return h(
      'div',
      null,
      h('div', { class: 'tt-title', text: title }),
      SERIES.map((s) => h('div', { class: 'tt-row' }, h('span', null, h('i', { class: `dot ${s.cls}` }), s.label), h('b', { text: fmtVFull(acc[s.key]) }))),
      h('div', { class: 'tt-row tt-sum' }, h('span', { text: `${unitLabel()} · ${fmt(acc.n)} Nachr.` }), h('b', { text: fmtVFull(mAcc(acc)) })),
      extra ? h('div', { class: 'tt-row' }, h('span', { text: extra })) : null,
    );
  }

  function niceScale(max) {
    if (max <= 0) return { step: 1, count: 1 };
    const raw = max / 4;
    const exp = 10 ** Math.floor(Math.log10(raw));
    const f = raw / exp;
    const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * exp;
    return { step, count: Math.max(1, Math.ceil(max / step)) };
  }

  /** Stacked bar chart. buckets: [{ acc, label, title, today, extra, mark, onClick }] */
  function stackedChart(el, buckets, { height = 250, animate = false, emptyText = 'Keine Daten im gewählten Zeitraum.' } = {}) {
    const visible = SERIES.filter((s) => !state.hidden.has(s.key));
    if (!buckets.length || !visible.length || !buckets.some((b) => b.acc.n)) {
      el.replaceChildren(h('div', { class: 'empty', text: visible.length ? emptyText : 'Alle Kategorien ausgeblendet – in der Legende eine einblenden.' }));
      return;
    }
    const width = Math.max(280, el.clientWidth || 600);
    const hgt = innerWidth <= 720 ? Math.min(height, 220) : height;
    const pad = { l: 56, r: 8, t: 10, b: 26 };
    const plotW = width - pad.l - pad.r;
    const plotH = hgt - pad.t - pad.b;
    const stackTotal = (d) => visible.reduce((s, v) => s + d.acc[v.key], 0);
    const scale = niceScale(Math.max(...buckets.map(stackTotal)));
    const yMax = scale.step * scale.count;
    const band = plotW / buckets.length;
    const barW = Math.max(1.2, Math.min(30, band * 0.68));
    const y = (v) => pad.t + plotH - (v / yMax) * plotH;
    const root = svg('svg', { viewBox: `0 0 ${width} ${hgt}`, class: animate ? 'anim' : null, role: 'img', 'aria-label': 'Balkendiagramm' });
    for (let k = 0; k <= scale.count; k++) {
      const v = scale.step * k;
      root.append(svg('line', { class: 'grid-line', x1: pad.l, x2: width - pad.r, y1: y(v), y2: y(v) }), svg('text', { class: 'axis-label', x: pad.l - 8, y: y(v) + 4, 'text-anchor': 'end' }, fmtV(v)));
    }
    const labelEvery = Math.max(1, Math.ceil(buckets.length / Math.max(1, Math.floor(plotW / 62))));
    const last = buckets.length - 1;
    buckets.forEach((d, idx) => {
      const x = pad.l + idx * band;
      const g = svg('g', { class: `bar-g${d.today ? ' today' : ''}` });
      const hit = svg('rect', { class: 'bar-hit', x, y: pad.t, width: band, height: plotH, tabindex: 0, style: d.onClick ? 'cursor:pointer' : null });
      const bars = svg('g', { class: 'bars', style: `animation-delay:${Math.min(0.6, idx * 0.01)}s` });
      let acc = 0;
      for (const s of visible) {
        const v = d.acc[s.key];
        if (v <= 0) continue;
        bars.append(svg('rect', { class: `seg ${s.fill}`, x: x + (band - barW) / 2, y: y(acc + v), width: barW, height: Math.max(0.5, y(acc) - y(acc + v)), 'pointer-events': 'none' }));
        acc += v;
      }
      if (d.mark) bars.append(svg('rect', { x: x + (band - barW) / 2, y: pad.t, width: barW, height: 3, fill: 'var(--pink)' }));
      g.append(hit, bars);
      if (d.label && (d.today || idx === last || (idx % labelEvery === 0 && last - idx >= Math.ceil(labelEvery * 0.9)))) {
        const tx = Math.min(Math.max(x + band / 2, pad.l + 16), width - pad.r - 18);
        g.append(svg('text', { class: `axis-label${d.today ? ' today-label' : ''}`, x: tx, y: hgt - 8, 'text-anchor': 'middle' }, d.label));
      }
      const show = (ev) => showTip(accTip(d.title, d.acc, d.extra), ev.clientX, ev.clientY);
      hit.addEventListener('pointermove', show);
      hit.addEventListener('pointerleave', hideTip);
      hit.addEventListener('focus', () => {
        const r = hit.getBoundingClientRect();
        showTip(accTip(d.title, d.acc, d.extra), r.left + r.width / 2, r.top + 40);
      });
      hit.addEventListener('blur', hideTip);
      if (d.onClick) {
        hit.addEventListener('click', () => {
          hideTip();
          d.onClick();
        });
        hit.addEventListener('keydown', (e) => e.key === 'Enter' && d.onClick());
      } else hit.addEventListener('pointerdown', show);
      root.append(g);
    });
    el.replaceChildren(root);
  }

  function legendInto(el) {
    el.replaceChildren(
      ...SERIES.map((s) =>
        h(
          'button',
          {
            type: 'button',
            'aria-pressed': String(!state.hidden.has(s.key)),
            onclick: () => {
              if (state.hidden.has(s.key)) state.hidden.delete(s.key);
              else state.hidden.add(s.key);
              store.set('hidden', [...state.hidden]);
              state.animateChart = true;
              render();
            },
          },
          h('i', { class: `dot ${s.cls}` }),
          s.label,
        ),
      ),
    );
  }

  function stack(acc, scale) {
    const wrap = h('div', { class: 'stack' });
    if (scale) for (const s of SERIES) if (acc[s.key] > 0 && !state.hidden.has(s.key)) wrap.append(h('i', { style: `width:${(acc[s.key] / scale) * 100}%;background:${s.color}` }));
    return wrap;
  }
  const visibleSum = (acc) => SERIES.reduce((s, x) => s + (state.hidden.has(x.key) ? 0 : acc[x.key]), 0);

  function compareRow(label, value, max, strong, cls) {
    return h(
      'div',
      { class: `compare-row${cls ? ` ${cls}` : ''}` },
      h('span', { text: label }),
      h('div', { class: 'compare-bar' }, h('i', { style: `width:${max ? Math.min(100, (value / max) * 100) : 0}%;${strong ? '' : 'opacity:.5'}` })),
      h('span', { class: 'num', title: fmtVFull(value), text: fmtV(value) }),
    );
  }

  // ---------- Reactor ----------
  const orb = window.Orb ? new window.Orb($('#orb')) : null;
  const reactor = $('#reactor');
  const GAUGE = { time: 2 * Math.PI * 256, load: 2 * Math.PI * 242 };
  $('#gaugeTime').style.strokeDasharray = `${GAUGE.time}`;
  $('#gaugeLoad').style.strokeDasharray = `${GAUGE.load}`;
  let tickKey;
  function drawTicks(key, labels) {
    if (tickKey === key) return;
    tickKey = key;
    const parts = [];
    for (let k = 0; k < 60; k++) {
      const a = (k / 60) * Math.PI * 2 - Math.PI / 2;
      const major = k % 12 === 0;
      const r1 = major ? 222 : 225;
      parts.push(svg('line', { class: `tick${major ? ' major' : ''}`, x1: 300 + Math.cos(a) * r1, y1: 300 + Math.sin(a) * r1, x2: 300 + Math.cos(a) * 231, y2: 300 + Math.sin(a) * 231 }));
    }
    labels.forEach((label, k) => {
      const a = (k / labels.length) * Math.PI * 2 - Math.PI / 2;
      parts.push(svg('line', { class: 'notch', x1: 300 + Math.cos(a) * 234, y1: 300 + Math.sin(a) * 234, x2: 300 + Math.cos(a) * 264, y2: 300 + Math.sin(a) * 264 }));
      parts.push(svg('text', { class: 'hour-lbl', x: 300 + Math.cos(a) * 206, y: 300 + Math.sin(a) * 206 + 4, 'text-anchor': 'middle' }, label));
    });
    $('#tickMarks').replaceChildren(...parts);
  }
  function setGauge(id, headId, frac, circumference) {
    const f = Math.max(0, Math.min(1, frac));
    $(id).style.strokeDashoffset = `${circumference * (1 - f)}`;
    $(headId).style.transform = `rotate(${f * 360}deg)`;
    $(headId).style.opacity = f > 0 ? '1' : '0';
  }
  function orbState(now) {
    if (state.briefing) return 'briefing';
    if (state.offline) return 'offline';
    return isActive(now, state.scoped) ? 'active' : 'idle';
  }
  function setHot(on) {
    $('#gaugeLoad').classList.toggle('hot', on);
    $('.rtag.load').classList.toggle('hot', on);
  }

  function renderReactorCredit(now) {
    const c = state.credit;
    const ms = c.monthStart;
    const d = new Date(ms);
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const monthEnd = ms + daysInMonth * DAY;
    drawTicks(`m-${ms}`, [0, 1, 2, 3, 4].map((k) => `${Math.round(1 + (k / 5) * daysInMonth)}.`));
    countTo($('#roValue'), c.monthCredit, fmtUSD);
    $('#roLabel').textContent = 'Guthaben · dieser Monat (geschätzt)';
    $('#roSub').textContent = `API-Wert Monat ${fmtUSD(c.monthValue)}${c.budget ? ` · Limit ${fmtUSD(c.budget)}` : ''}`;
    setGauge('#gaugeTime', '#timeHead', (now - ms) / (monthEnd - ms), GAUGE.time);
    const load = c.budget ? c.monthCredit / c.budget : 0;
    setGauge('#gaugeLoad', '#loadHead', load, GAUGE.load);
    setHot(load > 0.85);
    $('#tagTime').textContent = `noch ${Math.max(0, Math.ceil((monthEnd - now) / DAY))} Tage`;
    $('#tagTimeSub').textContent = `Monatsende ${fmtDate(monthEnd - 1)}`;
    $('#tagLoad').textContent = c.budget ? `${Math.round(load * 100)} %` : '—';
    $('#tagLoadSub').textContent = c.budget ? `von ${fmtUSD(c.budget)} Ausgabenlimit` : 'Limit unter Einstellungen setzen';
  }

  function renderReactor(now) {
    const st = orbState(now);
    reactor.dataset.state = st;
    if (orb) orb.setState(st);
    $('#roState').textContent = { idle: 'BEREIT', active: 'AKTIV · CLAUDE ARBEITET', briefing: 'BRIEFING', offline: 'OFFLINE' }[st];
    const anyActive = state.data && isActive(now);
    $('#sysDot').className = `sys-dot ${st === 'offline' ? 'off' : anyActive ? 'active' : 'on'}`;
    $('#sysState').textContent = st === 'offline' ? 'KEINE VERBINDUNG' : !state.live ? 'PAUSIERT' : anyActive ? 'CLAUDE AKTIV' : 'SYSTEM ONLINE';
    if (!state.data) return;

    let v5 = 0;
    let n5 = 0;
    for (let k = state.scoped.length - 1; k >= 0; k--) {
      const e = state.scoped[k];
      if (e[T] < now - 5 * MIN) break;
      v5 += mEv(e);
      n5++;
    }
    $('#tagRate').textContent = `${fmtV(v5 / 5)}/min`;
    $('#tagRateSub').textContent = n5 ? `${n5} Nachr. · ${isCredit() ? 'API-Wert' : METRICS[state.metric].label}` : 'Ruhe';
    const last = latestOf(state.scoped);
    $('#tagModel').textContent = last ? prettyModel(state.data.models[last[M]]) : '—';
    $('#tagModelSub').textContent = last ? fmtAgo(last[T], now) : ' ';
    if (isCredit()) return renderReactorCredit(now);

    const block = activeBlock(now);
    const ref = referenceBlock(now);
    const proj = currentProject();
    drawTicks(`b-${block ? block.start : 0}`, [0, 1, 2, 3, 4].map((hr) => (block ? fmtTime(block.start + hr * HOUR) : `+${hr}h`)));
    if (block) {
      const blockEvents = state.scoped.filter((e) => e[T] >= block.start && e[T] < block.end);
      const scopedAcc = blockEvents.reduce(add, newAcc());
      const accountValue = mAcc(accountAcc(block));
      countTo($('#roValue'), mAcc(scopedAcc));
      $('#roLabel').textContent = `${METRICS[state.metric].short} · aktueller Block`;
      const subParts = [];
      if (proj) subParts.push(`${projectLabel(proj)} · Konto ${fmtC(accountValue)}`);
      if (showMoney()) subParts.push(`≈ ${fmtUSD(costSum(blockEvents))} API-Wert · Guthaben Monat ≈ ${fmtUSD(state.credit.monthCredit)}`);
      $('#roSub').textContent = subParts.join(' · ');
      setGauge('#gaugeTime', '#timeHead', (now - block.start) / BLOCK, GAUGE.time);
      const hitNow = limitInBlock(block);
      const load = hitNow ? 1 : ref.value ? accountValue / ref.value : 0;
      setGauge('#gaugeLoad', '#loadHead', load, GAUGE.load);
      setHot(load > 0.85);
      $('#tagTime').textContent = `noch ${fmtDur(block.end - now)}`;
      $('#tagTimeSub').textContent = `Reset ≈ ${fmtTime(block.end)}`;
      $('#tagLoad').textContent = hitNow ? 'LIMIT' : ref.value ? `${Math.round(load * 100)} %` : '—';
      $('#tagLoadSub').textContent = hitNow ? `erreicht um ${fmtTime(block.limit.t)}` : ref.value ? `Konto vs. ${ref.label} (${fmtC(ref.value)})` : 'noch kein Vergleich';
    } else {
      $('#roValue').textContent = '—';
      $('#roValue').dataset.v = '0';
      $('#roLabel').textContent = 'KEIN AKTIVER 5-STD-BLOCK';
      $('#roSub').textContent = proj ? projectLabel(proj) : '';
      setGauge('#gaugeTime', '#timeHead', 0, GAUGE.time);
      setGauge('#gaugeLoad', '#loadHead', 0, GAUGE.load);
      setHot(false);
      $('#tagTime').textContent = 'bereit';
      $('#tagTimeSub').textContent = 'startet mit nächster Nachricht';
      $('#tagLoad').textContent = '0 %';
      $('#tagLoadSub').textContent = ref.value ? `vs. ${ref.label}` : ' ';
    }
  }

  function flyTokens(amount) {
    const el = h('div', { class: 'fly', style: `--dx:${Math.round((Math.random() - 0.5) * 140)}px`, text: `+${fmtV(amount)}` });
    $('#flash').append(el);
    setTimeout(() => el.remove(), 2600);
  }

  // ---------- Overview panels ----------
  // Pace over the last 30 minutes → projection for the block and time until the reference is reached.
  function forecastLine(now, block, value) {
    const since = now - 30 * MIN;
    const rate = state.scoped.reduce((s, e) => (e[T] >= since ? s + mEv(e) : s), 0) / 30;
    const accRate = state.data.events.reduce((s, e) => (e[T] >= since ? s + mEv(e) : s), 0) / 30;
    const remainingMin = (block.end - now) / MIN;
    const ref = referenceBlock(now);
    const accNow = mAcc(accountAcc(block));
    let eta = null;
    if (limitInBlock(block)) eta = 'Limit in diesem Block bereits erreicht';
    else if (ref.value && accNow >= ref.value) eta = 'Vergleichswert schon überschritten';
    else if (ref.value && accRate > 0) {
      const mins = (ref.value - accNow) / accRate;
      eta = mins > remainingMin ? 'Vergleichswert wird bei diesem Tempo bis zum Reset nicht erreicht' : `Vergleichswert bei diesem Tempo in ≈ ${fmtDur(mins * MIN)}`;
    }
    return h(
      'div',
      { class: 'stats' },
      h('span', null, 'Tempo (30 Min) ', h('b', { text: `${fmtV(rate)}/min` })),
      h('span', null, 'Prognose bis Reset ', h('b', { text: fmtV(value + rate * remainingMin) })),
      eta ? h('span', { text: eta }) : null,
    );
  }

  function renderBlockPanel(now) {
    const body = $('#blockBody');
    const list = blocksFor(state.scoped);
    const block = activeBlock(now);
    const cur = list.find((x) => x.b === block);
    const others = list.filter((x) => x.b !== block && x.acc.n);
    const recent = others.filter((x) => x.b.start >= now - 30 * DAY);
    const avg = recent.length ? recent.reduce((s, x) => s + mAcc(x.acc), 0) / recent.length : 0;
    const biggest = others.reduce((m, x) => Math.max(m, mAcc(x.acc)), 0);
    const limits = others.filter((x) => limitInBlock(x.b));
    const lastLimit = limits[limits.length - 1];
    const openBtn = h('button', { class: 'hud-btn small', type: 'button', onclick: () => go(block ? `#/bloecke/${block.start}` : '#/bloecke') }, block ? 'Block im Detail' : 'Alle Blöcke');
    if (!block) {
      const last = state.data.blocks[state.data.blocks.length - 1];
      body.replaceChildren(
        h('div', { class: 'big soft' }, 'Kein aktiver Block'),
        h('div', { class: 'stats' }, h('span', { text: 'Der nächste 5-Std-Block startet mit deiner nächsten Nachricht.' })),
        last ? h('div', { class: 'stats' }, h('span', null, 'Letzter: ', h('b', { text: `${fmtDT(last.start)}–${fmtTime(last.end)}` }))) : null,
        h('div', { class: 'compare' }, compareRow('Ø Block (30 T.)', avg, Math.max(avg, biggest), true), compareRow('Größter Block', biggest, biggest)),
        h('div', { class: 'btn-row', style: 'margin-top:12px' }, openBtn),
      );
      return;
    }
    const value = mAcc(cur.acc);
    const max = Math.max(value, avg, biggest, lastLimit ? mAcc(lastLimit.acc) : 0);
    const creditBlock = state.credit.perBlock.get(block.start);
    const money = showMoney() && creditBlock;
    body.replaceChildren(
      h('div', { class: 'big' }, h('span', { text: fmtV(value), title: fmtVFull(value) }), h('small', { text: unitLabel() })),
      h(
        'div',
        { class: 'stats' },
        h('span', null, h('b', { text: fmt(cur.acc.n) }), ' Nachrichten'),
        isCredit() ? null : h('span', null, 'Output ', h('b', { text: fmtC(cur.acc.o) })),
        currentProject() ? h('span', null, 'Konto ', h('b', { text: fmtV(mAcc(accountAcc(block))) })) : null,
        money && !isCredit() ? h('span', null, 'API-Wert ', h('b', { text: fmtUSD(creditBlock.value) })) : null,
        money ? h('span', null, 'Plan-Kontingent ', h('b', { text: state.credit.quota.value ? fmtUSD(state.credit.quota.value) : 'unbekannt' })) : null,
        money ? h('span', null, 'davon Guthaben ', h('b', { text: fmtUSD(creditBlock.credit) })) : null,
        limitInBlock(block) ? h('span', { class: 'flag', text: `Limit erreicht ${fmtTime(block.limit.t)}` }) : null,
      ),
      forecastLine(now, block, value),
      h(
        'div',
        { class: 'progress' },
        h('div', { class: 'progress-track' }, h('div', { class: 'progress-fill', style: `width:${Math.min(100, ((now - block.start) / BLOCK) * 100)}%` })),
        h('div', { class: 'progress-labels' }, h('span', { text: `Start ${fmtTime(block.start)}` }), h('b', { text: `noch ${fmtDur(block.end - now)}` }), h('span', { text: `Reset ≈ ${fmtTime(block.end)}` })),
      ),
      h(
        'div',
        { class: 'compare' },
        compareRow('Dieser Block', value, max, true),
        compareRow('Ø Block (30 T.)', avg, max),
        compareRow('Größter Block', biggest, max),
        lastLimit ? compareRow('Beim letzten Limit', mAcc(lastLimit.acc), max, true, 'limit') : null,
      ),
      h('div', { class: 'btn-row', style: 'margin-top:12px' }, openBtn),
    );
  }

  function renderWeekPanel(now) {
    const start = lastWeeklyReset(now);
    const rolling = state.weekDay === '' || state.weekDay == null;
    const cur = newAcc();
    const prev = newAcc();
    const chats = new Set();
    for (const e of state.scoped) {
      if (e[T] >= start) {
        add(cur, e);
        chats.add(e[S]);
      } else if (e[T] >= start - 7 * DAY) add(prev, e);
    }
    const weeks = [1, 2, 3, 4].map((k) => {
      const a = start - k * 7 * DAY;
      return state.scoped.reduce((s, e) => (e[T] >= a && e[T] < a + 7 * DAY ? s + mEv(e) : s), 0);
    });
    const avg4 = weeks.reduce((s, v) => s + v, 0) / 4;
    const blocksUsed = blocksFor(state.scoped).filter((x) => x.acc.n && x.b.end > start).length;
    const value = mAcc(cur);
    const max = Math.max(value, mAcc(prev), avg4);
    $('#weekBody').replaceChildren(
      h('div', { class: 'big' }, h('span', { text: fmtV(value), title: fmtVFull(value) }), h('small', { text: unitLabel() })),
      h(
        'div',
        { class: 'stats' },
        h('span', null, h('b', { text: fmt(cur.n) }), ' Nachrichten'),
        h('span', null, h('b', { text: fmt(chats.size) }), ' Chats'),
        h('span', null, h('b', { text: fmt(blocksUsed) }), ' 5-Std-Blöcke'),
        state.view === 'both' ? h('span', null, 'API-Wert ', h('b', { text: fmtUSD(costSum(state.scoped.filter((e) => e[T] >= start))) })) : null,
        !rolling && now - start > HOUR ? h('span', null, 'Hochrechnung Woche ', h('b', { text: fmtV((value / (now - start)) * 7 * DAY) })) : null,
        rolling ? h('span', null, 'Ø pro Tag ', h('b', { text: fmtV(value / 7) })) : null,
      ),
      rolling
        ? h('div', { class: 'progress' }, h('div', { class: 'progress-labels' }, h('span', { text: `Letzte 7 Tage · seit ${fmtDT(start)}` })), h('p', { class: 'note', text: 'Tipp: Stell Wochentag + Uhrzeit deines Wochen-Resets ein (steht in Claude unter Einstellungen → Nutzung).' }))
        : h(
            'div',
            { class: 'progress' },
            h('div', { class: 'progress-track' }, h('div', { class: 'progress-fill', style: `width:${Math.min(100, ((now - start) / (7 * DAY)) * 100)}%` })),
            h('div', { class: 'progress-labels' }, h('span', { text: `seit ${fmtDT(start)}` }), h('b', { text: `Reset in ${fmtDur(start + 7 * DAY - now)}` })),
          ),
      h('div', { class: 'compare' }, compareRow(rolling ? 'Letzte 7 Tage' : 'Diese Woche', value, max, true), compareRow(rolling ? '7 Tage davor' : 'Vorwoche', mAcc(prev), max), compareRow('Ø letzte 4 Wochen', avg4, max)),
    );
  }

  // Live log: scrollable; sticks to the newest entry unless the user scrolled up.
  const typed = new Set();
  function renderLog(now) {
    const log = $('#log');
    const atBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 30;
    const lines = state.scoped.slice(-60).map((e) => {
      const s = state.data.sessions[e[S]];
      const key = `${e[T]}-${e[S]}`;
      const isNew = state.newKeys.has(key);
      const title = h('span', { text: s.title });
      const line = h(
        'div',
        { class: `log-line${isNew ? ' new' : ''}`, title: `${s.project} · Klick = Chat öffnen`, style: 'cursor:pointer', onclick: () => go(`#/chats/${encodeURIComponent(s.id)}`) },
        h('span', { class: 'lt', text: fmtTime(e[T], true) }),
        h('span', { class: 'lm', text: prettyModel(state.data.models[e[M]]) }),
        h('span', { class: 'lv', text: `+${fmtV(mEv(e))}` }),
        h('span', { class: 'lx' }, e[SUB] ? h('span', { class: 'sub', text: 'SUB › ' }) : null, title),
      );
      if (isNew && !typed.has(key)) {
        typed.add(key);
        const full = s.title;
        title.textContent = '';
        let n = 0;
        const iv = setInterval(() => {
          n += 2;
          title.textContent = full.slice(0, n);
          if (n >= full.length) clearInterval(iv);
        }, 18);
      }
      return line;
    });
    lines.push(h('div', { class: 'log-cursor', text: isActive(now, state.scoped) ? 'EMPFANGE DATEN' : state.offline ? 'VERBINDUNG UNTERBROCHEN' : state.live ? 'WARTE AUF NÄCHSTE NACHRICHT' : 'PAUSIERT' }));
    log.replaceChildren(...lines);
    if (atBottom || !log.dataset.init) log.scrollTop = log.scrollHeight;
    log.dataset.init = '1';
  }

  function renderPulse(now) {
    const W = 300;
    const H = 76;
    const mins = new Array(60).fill(0);
    const events = state.scoped;
    for (let k = events.length - 1; k >= 0; k--) {
      const ago = Math.floor((now - events[k][T]) / MIN);
      if (ago >= 60) break;
      if (ago >= 0) mins[59 - ago] += mEv(events[k]);
    }
    const max = Math.max(1e-9, ...mins);
    const bw = W / 60;
    const bars = mins.map((v, i) => {
      const bh = v ? Math.max(3, (v / max) * (H - 6)) : 1;
      return svg('rect', { class: `pb${i === 59 && v ? ' now' : ''}`, x: i * bw + 0.6, y: H - bh, width: bw - 1.2, height: bh, rx: 1 });
    });
    const today = startOfDay(now);
    const todayAcc = newAcc();
    let lastHour = 0;
    for (let k = events.length - 1; k >= 0; k--) {
      const e = events[k];
      if (e[T] < today && e[T] < now - HOUR) break;
      if (e[T] >= today) add(todayAcc, e);
      if (e[T] >= now - HOUR) lastHour++;
    }
    const last = latestOf(events);
    const s = last ? state.data.sessions[last[S]] : null;
    const active = isActive(now, events);
    $('#pulseBody').replaceChildren(
      svg('svg', { class: 'pulse-svg', viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none', role: 'img', 'aria-label': 'Verbrauch pro Minute in der letzten Stunde' }, svg('line', { class: 'pbase', x1: 0, x2: W, y1: H - 0.5, y2: H - 0.5 }), bars),
      h('div', { class: 'pulse-axis' }, h('span', { text: '−60 MIN' }), h('span', { text: '−30' }), h('span', { text: 'JETZT' })),
      h(
        'div',
        { class: 'mini-grid' },
        h('div', { class: 'mini' }, h('span', { text: 'Heute' }), h('b', { text: fmtV(mAcc(todayAcc)), title: fmtVFull(mAcc(todayAcc)) })),
        h('div', { class: 'mini' }, h('span', { text: 'Nachr. / Std' }), h('b', { text: fmt(lastHour) })),
        h('div', { class: 'mini' }, h('span', { text: 'Ø je Nachricht' }), h('b', { text: fmtV(todayAcc.n ? mAcc(todayAcc) / todayAcc.n : 0) })),
      ),
      s
        ? h(
            'div',
            { class: 'now-chat', style: 'cursor:pointer', title: 'Chat öffnen', onclick: () => go(`#/chats/${encodeURIComponent(s.id)}`) },
            h('div', { class: 'nc-k', text: active ? 'Aktueller Chat' : 'Letzter Chat' }),
            h('div', { class: 'nc-t', title: s.title }, active ? h('span', { class: 'live-dot' }) : null, s.title),
            h('div', { class: 'nc-p', title: s.cwd, text: `${s.project} · ${fmtAgo(last[T], now)}` }),
          )
        : null,
    );
  }

  // ---------- Comms & briefing ----------
  let greeted = false;
  function greeting(now) {
    const hr = new Date(now).getHours();
    const name = state.data && state.data.user ? state.data.user.charAt(0).toUpperCase() + state.data.user.slice(1) : '';
    const hello = hr < 5 ? 'Noch wach' : hr < 11 ? 'Guten Morgen' : hr < 18 ? 'Guten Tag' : hr < 23 ? 'Guten Abend' : 'Gute Nacht';
    return `${hello}${name ? `, ${name}` : ''}.`;
  }
  function renderComms(now) {
    if (state.briefing) return;
    const greet = $('#greet');
    const text = greeting(now);
    if (!greeted) {
      greeted = true;
      let n = 0;
      const span = h('span');
      greet.replaceChildren(span, h('span', { class: 'caret' }));
      const iv = setInterval(() => {
        span.textContent = text.slice(0, ++n);
        if (n >= text.length) clearInterval(iv);
      }, 45);
    } else if (!greet.firstChild || greet.firstChild.textContent !== text) greet.replaceChildren(h('span', { text }), h('span', { class: 'caret' }));
    const block = activeBlock(now);
    const cur = block ? state.scoped.filter((e) => e[T] >= block.start && e[T] < block.end).reduce(add, newAcc()) : null;
    const proj = currentProject();
    const c = state.credit;
    $('#commsSub').classList.remove('speaking');
    $('#commsSub').replaceChildren(
      h('span', null, h('b', { text: proj ? projectLabel(proj) : 'Alle Projekte' }), ' · '),
      cur ? h('span', null, 'aktueller Block: ', h('b', { text: fmtV(mAcc(cur)) }), ` ${unitLabel()} in ${fmt(cur.n)} Nachrichten, Reset um ${fmtTime(block.end)}. `) : h('span', { text: 'kein aktiver 5-Stunden-Block. ' }),
      showMoney() ? h('span', null, 'Guthaben diesen Monat ≈ ', h('b', { text: fmtUSD(c.monthCredit) }), c.budget ? ` von ${fmtUSD(c.budget)}. ` : ' (geschätzt). ') : null,
      h('b', { text: isActive(now, state.scoped) ? 'Claude arbeitet gerade.' : 'Claude wartet auf dich.' }),
    );
  }

  function briefingText(now) {
    const block = activeBlock(now);
    const ref = referenceBlock(now);
    const proj = currentProject();
    const c = state.credit;
    const t = [greeting(now)];
    if (proj) t.push(`Ich zeige dir das Projekt ${projectLabel(proj)}.`);
    if (isCredit()) {
      t.push(`Diesen Monat hast du geschätzt ${df.format(c.monthCredit)} Dollar Guthaben verbraucht.`);
      if (c.budget) t.push(`Das sind ${Math.round(pct(c.monthCredit, c.budget))} Prozent von deinem Limit über ${df.format(c.budget)} Dollar.`);
      t.push(`Der gesamte API-Wert deiner Nutzung diesen Monat liegt bei etwa ${df.format(c.monthValue)} Dollar.`);
    } else if (block) {
      const cur = state.scoped.filter((e) => e[T] >= block.start && e[T] < block.end).reduce(add, newAcc());
      const unit = { all: 'Tokens', nocache: 'Tokens ohne Cache-Lesen', output: 'Output-Tokens' }[state.metric];
      t.push(`Im aktuellen Fünf-Stunden-Block sind es ${say(mAcc(cur))} ${unit} in ${fmt(cur.n)} Nachrichten.`);
      t.push(`Der Block setzt sich gegen ${fmtTime(block.end)} Uhr zurück.`);
      if (limitInBlock(block)) t.push('In diesem Block wurde das Limit bereits erreicht.');
      else if (ref.value) t.push(`Dein Konto liegt bei etwa ${Math.round((mAcc(accountAcc(block)) / ref.value) * 100)} Prozent vom Vergleichswert.`);
      if (state.view === 'both') t.push(`Guthaben diesen Monat: etwa ${df.format(c.monthCredit)} Dollar.`);
    } else t.push('Gerade läuft kein Fünf-Stunden-Block. Der nächste startet mit deiner nächsten Nachricht.');
    t.push(isActive(now, state.scoped) ? 'Ich arbeite gerade.' : 'Ich bin bereit.');
    return t.join(' ');
  }
  const germanVoices = () => speechSynthesis.getVoices().filter((v) => /^de/i.test(v.lang));
  function pickVoice() {
    const all = speechSynthesis.getVoices();
    return all.find((v) => v.voiceURI === state.voiceURI) || all.find((v) => /de[-_]AT/i.test(v.lang)) || germanVoices()[0] || null;
  }
  function speak(text, onBoundary, onEnd) {
    const run = () => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'de-AT';
      const v = pickVoice();
      if (v) u.voice = v;
      u.rate = state.voiceRate;
      u.pitch = 0.95;
      u.onboundary = onBoundary;
      u.onend = onEnd;
      u.onerror = onEnd;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    };
    if (speechSynthesis.getVoices().length) run();
    else {
      speechSynthesis.addEventListener('voiceschanged', run, { once: true });
      setTimeout(() => !speechSynthesis.speaking && run(), 900);
    }
  }
  function stopBriefing() {
    try {
      speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
    state.briefing = false;
    $('#briefBtn').classList.remove('on');
    $('#briefLabel').textContent = 'Briefing';
    renderComms(Date.now());
    renderReactor(Date.now());
  }
  function startBriefing() {
    if (!state.data) return;
    if (state.briefing) return stopBriefing();
    if (currentRoute().page !== 'overview') go('#/');
    const text = briefingText(Date.now());
    const words = [];
    const nodes = [];
    let pos = 0;
    text.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) nodes.push(document.createTextNode(part));
      else {
        const sp = h('span', { text: part });
        words.push({ start: pos, el: sp });
        nodes.push(sp);
      }
      pos += part.length;
    });
    const sub = $('#commsSub');
    sub.replaceChildren(...nodes);
    sub.classList.add('speaking');
    state.briefing = true;
    $('#briefBtn').classList.add('on');
    $('#briefLabel').textContent = 'Stopp';
    renderReactor(Date.now());
    blip(660, 0.08, 0.05);
    const mark = (charIndex) => {
      let hit = -1;
      words.forEach((w, i) => {
        if (w.start <= charIndex) hit = i;
      });
      words.forEach((w, i) => (w.el.className = i < hit ? 'w-done' : i === hit ? 'w-now' : ''));
      if (orb) orb.voice(0.6 + Math.random() * 0.4);
    };
    if (!('speechSynthesis' in window)) {
      let i = 0;
      const iv = setInterval(() => {
        if (!state.briefing || i >= words.length) {
          clearInterval(iv);
          if (state.briefing) stopBriefing();
          return;
        }
        mark(words[i++].start);
      }, 260);
      return;
    }
    speak(text, (e) => mark(e.charIndex), () => state.briefing && stopBriefing());
  }

  // ---------- Header controls ----------
  const metricDD = createDropdown($('#metricDD'), { label: 'Messgröße', onSelect: (v) => setMetric(v) });
  function setMetric(v) {
    state.metric = v;
    store.set('metric', v);
    if (!isCredit()) {
      state.hidden = new Set(METRICS[v].hidden);
      store.set('hidden', [...state.hidden]);
    }
    state.animateChart = true;
    render();
    toast(`Messgröße: ${METRICS[v].label}`);
  }
  function setView(v) {
    state.view = v;
    store.set('view', v);
    state.hidden = new Set(v === 'credit' ? [] : METRICS[state.metric].hidden);
    store.set('hidden', [...state.hidden]);
    state.animateChart = true;
    tickKey = null;
    render();
    toast({ usage: 'Ansicht: Nutzung (Tokens)', credit: 'Ansicht: Guthaben (API-Wert in USD, geschätzt)', both: 'Ansicht: Nutzung + Guthaben' }[v]);
  }
  const projectDD = createDropdown($('#projectDD'), { label: 'Projekt', onSelect: (v) => setProject(v === '__auto' ? null : v) });
  function setProject(v) {
    state.manualProject = v;
    state.sessionLimit = 60;
    state.animateChart = true;
    render();
  }
  const RANGE_PRESETS = [
    ['h1', 'Letzte Stunde', { kind: 'hours', n: 1 }],
    ['h5', 'Letzte 5 Stunden', { kind: 'hours', n: 5 }],
    ['h24', 'Letzte 24 Stunden', { kind: 'hours', n: 24 }],
    ['d7', '7 Tage', { kind: 'days', n: 7 }],
    ['d30', '30 Tage', { kind: 'days', n: 30 }],
    ['d90', '90 Tage', { kind: 'days', n: 90 }],
    ['all', 'Alles', { kind: 'all' }],
  ];
  const presetOfRange = () => RANGE_PRESETS.find((p) => JSON.stringify(p[2]) === JSON.stringify(state.range));
  function setRange(r) {
    state.range = normalizeRange(r);
    store.set('range', state.range);
    state.animateChart = true;
    render();
    toast(`Zeitraum: ${rangeLabel()}`);
  }
  const rangeDD = createDropdown($('#rangeDD'), {
    label: 'Zeitraum',
    onSelect: (v) => (v === 'custom' ? openRangeDialog() : setRange(RANGE_PRESETS.find((p) => p[0] === v)[2])),
  });

  function openRangeDialog() {
    document.querySelector('.modal')?.remove();
    const r = state.range;
    const now = Date.now();
    const toLocal = (ts) => new Date(ts - new Date(ts).getTimezoneOffset() * MIN).toISOString().slice(0, 16);
    const num = h('input', { class: 'input', type: 'number', min: '1', step: '1', value: String(r.kind === 'hours' || r.kind === 'days' ? r.n : 12), 'aria-label': 'Anzahl' });
    let unit = r.kind === 'days' ? 'days' : 'hours';
    const unitSeg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Einheit' });
    const paintUnit = () =>
      unitSeg.replaceChildren(
        ...[
          ['hours', 'Stunden'],
          ['days', 'Tage'],
        ].map(([k, l]) => h('button', { type: 'button', 'aria-pressed': String(unit === k), onclick: () => ((unit = k), paintUnit()) }, l)),
      );
    paintUnit();
    const from = h('input', { class: 'input', type: 'datetime-local', value: toLocal(r.kind === 'span' ? r.from : now - DAY), 'aria-label': 'Von' });
    const to = h('input', { class: 'input', type: 'datetime-local', value: toLocal(r.kind === 'span' ? r.to : now), 'aria-label': 'Bis' });
    const onKey = (e) => e.key === 'Escape' && close();
    const close = () => {
      modal.remove();
      document.removeEventListener('keydown', onKey);
    };
    const applyLast = () => {
      const n = Math.floor(Number(String(num.value).replace(',', '.')));
      if (!(n > 0)) return toast('Bitte eine Zahl größer als 0 eingeben', true);
      setRange({ kind: unit, n });
      close();
    };
    const applySpan = () => {
      const f = new Date(from.value).getTime();
      const t = new Date(to.value).getTime();
      if (!(t > f)) return toast('„Bis“ muss nach „Von“ liegen', true);
      setRange({ kind: 'span', from: f, to: t });
      close();
    };
    num.addEventListener('keydown', (e) => e.key === 'Enter' && applyLast());
    const quick = [
      [2, 'hours', '2 Std'],
      [8, 'hours', '8 Std'],
      [12, 'hours', '12 Std'],
      [48, 'hours', '48 Std'],
      [3, 'days', '3 Tage'],
      [14, 'days', '14 Tage'],
      [60, 'days', '60 Tage'],
      [365, 'days', '1 Jahr'],
    ];
    const modal = h(
      'div',
      { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Eigener Zeitraum', onclick: (e) => e.target === modal && close() },
      h(
        'div',
        { class: 'panel modal-panel' },
        h('div', { class: 'panel-head' }, h('span', { class: 'tag', text: '// EIGENER ZEITRAUM' }), h('button', { type: 'button', class: 'open-btn', 'aria-label': 'Schließen', onclick: close }, '✕')),
        h(
          'div',
          { class: 'stack-v' },
          h('div', { class: 'field' }, h('span', { text: 'Letzte …' }), h('div', { class: 'toolbar' }, num, unitSeg, h('button', { type: 'button', class: 'hud-btn small', onclick: applyLast }, 'Übernehmen'))),
          h('div', { class: 'field' }, h('span', { text: 'Schnellwahl' }), h('div', { class: 'seg' }, quick.map(([n, k, l]) => h('button', { type: 'button', onclick: () => (setRange({ kind: k, n }), close()) }, l)))),
          h('div', { class: 'field' }, h('span', { text: 'Von – bis' }), h('div', { class: 'toolbar' }, from, to, h('button', { type: 'button', class: 'hud-btn small', onclick: applySpan }, 'Übernehmen'))),
        ),
      ),
    );
    document.body.append(modal);
    document.addEventListener('keydown', onKey);
    setTimeout(() => num.focus(), 30);
  }
  const weekDayDD = createDropdown($('#weekDayDD'), {
    label: 'Reset-Tag',
    small: true,
    onSelect: (v) => {
      state.weekDay = v;
      store.set('weekDay', v);
      render();
    },
  });
  const weekHourDD = createDropdown($('#weekHourDD'), {
    label: 'Reset-Uhrzeit',
    small: true,
    onSelect: (v) => {
      state.weekHour = Number(v);
      store.set('weekHour', state.weekHour);
      render();
    },
  });

  function renderHeaderControls(now) {
    $('#viewSeg').replaceChildren(...VIEWS.map(([k, l]) => h('button', { type: 'button', 'aria-pressed': String(state.view === k), title: `Ansicht: ${l} (V)`, onclick: () => setView(k) }, l)));
    const sessions = state.data.sessions;
    const lastByProject = new Map();
    for (const e of state.data.events) {
      const k = projectKey(sessions[e[S]]);
      lastByProject.set(k, Math.max(lastByProject.get(k) || 0, e[T]));
    }
    const names = new Map();
    for (const s of sessions) if (!names.has(projectKey(s))) names.set(projectKey(s), s);
    const opts = [...lastByProject.entries()].sort((a, b) => b[1] - a[1]).map(([k, t]) => ({ value: k, label: names.get(k).project, hint: fmtAgo(t, now) }));
    const auto = state.manualProject === null;
    const cur = currentProject();
    projectDD.set([{ value: '__auto', label: 'Automatisch · zuletzt aktiv', hint: projectLabel(cur), auto: true }, { value: '', label: 'Alle Projekte', sep: true }, ...opts], auto ? '__auto' : cur, { text: projectLabel(cur), auto });
    metricDD.set(Object.entries(METRICS).map(([k, m]) => ({ value: k, label: m.label })), state.metric, isCredit() ? { text: 'Kosten (USD)' } : {});
    metricDD.disable(isCredit());
    const preset = presetOfRange();
    rangeDD.set(
      [...RANGE_PRESETS.map(([k, l]) => ({ value: k, label: l, sep: k === 'all' })), { value: 'custom', label: 'Eigener Zeitraum …', hint: 'Stunden, Tage, von–bis' }],
      preset ? preset[0] : 'custom',
      { text: preset ? preset[1] : rangeLabel() },
    );
    weekDayDD.set([{ value: '', label: 'rollierend', sep: true }, ...[1, 2, 3, 4, 5, 6, 0].map((d) => ({ value: String(d), label: WD_LONG[d] }))], state.weekDay === null ? '' : String(state.weekDay), { text: state.weekDay === '' ? 'rollierend' : WD[Number(state.weekDay)] });
    weekHourDD.set(Array.from({ length: 24 }, (_, hr) => ({ value: hr, label: `${String(hr).padStart(2, '0')}:00` })), state.weekHour);
    weekHourDD.disable(state.weekDay === '');
    document.querySelectorAll('.scope-tag').forEach((el) => (el.textContent = scopeName()));
  }

  // ---------- Overview: main sections ----------
  function renderKpis(events) {
    const acc = events.reduce(add, newAcc());
    const chats = new Set(events.map((e) => e[S])).size;
    const c = state.credit;
    const first = isCredit()
      ? { label: 'API-Wert', value: mAcc(acc), cls: 'total', hint: `Guthaben Monat ≈ ${fmtUSD(c.monthCredit)}`, share: 100 }
      : { label: METRICS[state.metric].label, value: mAcc(acc), cls: 'total', hint: state.view === 'both' ? `≈ ${fmtUSD(costSum(events))} API-Wert` : `${fmtC(acc.total)} alle Tokens · ≈ ${fmtUSD(costSum(events))}`, share: 100 };
    const tiles = [
      first,
      { label: 'Input', value: acc.i, dot: 'c-i', kc: 'var(--c-i)', hint: 'neu gelesen', share: pct(acc.i, acc.total) },
      { label: 'Cache schreiben', value: acc.cw, dot: 'c-cw', kc: 'var(--c-cw)', hint: pctStr(acc.cw, acc.total), share: pct(acc.cw, acc.total) },
      { label: 'Cache lesen', value: acc.cr, dot: 'c-cr', kc: 'var(--c-cr)', hint: pctStr(acc.cr, acc.total), share: pct(acc.cr, acc.total) },
      { label: 'Output', value: acc.o, dot: 'c-o', kc: 'var(--c-o)', hint: 'inkl. Thinking', share: pct(acc.o, acc.total) },
      { label: 'Thinking', value: acc.th, dot: 'c-th', kc: 'var(--c-th)', hint: `${pctStr(acc.th, acc.o)} vom Output`, share: pct(acc.th, acc.o) },
      { label: 'Nachrichten', value: acc.n, fmtFn: fmt, hint: `Ø ${fmtV(acc.n ? mAcc(acc) / acc.n : 0)} je Nachricht`, share: 0 },
      { label: 'Chats', value: chats, fmtFn: fmt, hint: acc.sub ? `${pctStr(acc.sub, acc.total)} durch Subagents` : 'keine Subagents', share: 0, go: '#/chats' },
    ];
    const root = $('#kpis');
    if (root.children.length !== tiles.length) {
      root.replaceChildren(...tiles.map((t) => h('div', { class: `kpi ${t.cls || ''}`, style: t.kc ? `--kc:${t.kc}` : null }, h('div', { class: 'label' }), h('div', { class: 'value', text: '0' }), h('div', { class: 'hint' }), h('i', { class: 'share' }))));
    }
    tiles.forEach((t, k) => {
      const el = root.children[k];
      el.querySelector('.label').replaceChildren(t.dot ? h('i', { class: `dot ${t.dot}` }) : '', t.label);
      countTo(el.querySelector('.value'), t.value, t.fmtFn || fmtV);
      el.querySelector('.hint').textContent = t.hint;
      el.querySelector('.share').style.width = `${Math.min(100, t.share)}%`;
      el.onclick = t.go ? () => go(t.go) : null;
      el.style.cursor = t.go ? 'pointer' : '';
    });
  }

  function dayBuckets(events, now) {
    if (hourlyRange(now)) {
      const endTs = Math.min(now, rangeEnd(now));
      const hours = [];
      const byHour = new Map();
      const h0 = new Date(rangeStart(now));
      h0.setMinutes(0, 0, 0);
      for (let t = h0.getTime(); t <= endTs; t += HOUR) {
        const b = { acc: newAcc(), label: fmtTime(t), title: `${WD[new Date(t).getDay()]} ${fmtDate(t)} · ${fmtTime(t)}–${fmtTime(t + HOUR)}`, today: now >= t && now < t + HOUR };
        hours.push(b);
        byHour.set(t, b);
      }
      for (const e of events) {
        const d = new Date(e[T]);
        d.setMinutes(0, 0, 0);
        const b = byHour.get(d.getTime());
        if (b) add(b.acc, e);
      }
      return hours;
    }
    const today = startOfDay(Math.min(now, rangeEnd(now)));
    let first = rangeStart(now);
    if (!Number.isFinite(first)) first = events.length ? startOfDay(events[0][T]) : today;
    first = startOfDay(first);
    const days = [];
    const byKey = new Map();
    for (const d = new Date(first); d.getTime() <= today; d.setDate(d.getDate() + 1)) {
      const ts = d.getTime();
      const isToday = ts === startOfDay(now);
      const b = { acc: newAcc(), ts, label: isToday ? 'Heute' : fmtDate(ts), title: `${WD_LONG[d.getDay()]}, ${fmtDate(ts, true)}`, today: isToday };
      days.push(b);
      byKey.set(dayKey(ts), b);
    }
    for (const e of events) {
      const b = byKey.get(dayKey(e[T]));
      if (b) add(b.acc, e);
    }
    return days;
  }

  function renderBlocksList(now) {
    const list = blocksFor(state.scoped)
      .filter((x) => x.acc.n)
      .slice(-40)
      .reverse();
    const el = $('#blocksList');
    el.classList.add('scroll-y');
    if (!list.length) return el.replaceChildren(h('div', { class: 'empty', text: 'Noch keine Blöcke.' }));
    const max = Math.max(...list.map((x) => visibleSum(x.acc)));
    el.replaceChildren(
      ...list.map(({ b, acc }) => {
        const cb = state.credit.perBlock.get(b.start);
        return h(
          'div',
          { class: 'bar-row clickable', role: 'button', tabindex: 0, title: `${fmtVFull(mAcc(acc))} ${unitLabel()} · ${fmt(acc.n)} Nachrichten · Klick = Details`, onclick: () => go(`#/bloecke/${b.start}`), onkeydown: (e) => e.key === 'Enter' && go(`#/bloecke/${b.start}`) },
          h(
            'div',
            { class: 'name' },
            `${WD[new Date(b.start).getDay()]} ${fmtDate(b.start)} · ${fmtTime(b.start)}–${fmtTime(b.end)}`,
            now < b.end ? h('span', { class: 'flag now', text: 'aktiv' }) : null,
            b.limit ? h('span', { class: 'flag', title: b.limit.text, text: LIMIT_LABEL[b.limit.type] || 'Limit' }) : null,
            showMoney() && cb && cb.credit > 0 ? h('span', { class: 'flag', text: `Guthaben ${fmtUSD(cb.credit)}` }) : null,
          ),
          h('div', { class: 'val', text: fmtV(mAcc(acc)) }),
          stack(acc, max),
        );
      }),
    );
  }

  function renderHeatmap(events, now, target = $('#heatmap')) {
    const counts = Array.from({ length: 7 }, () => new Array(24).fill(0));
    for (const e of events) {
      const d = new Date(e[T]);
      counts[(d.getDay() + 6) % 7][d.getHours()]++;
    }
    const max = Math.max(1, ...counts.flat());
    const nd = new Date(now);
    const nowRow = (nd.getDay() + 6) % 7;
    const cells = [h('span')];
    for (let hr = 0; hr < 24; hr++) cells.push(h('span', { class: 'hh', text: hr % 3 === 0 ? String(hr) : '' }));
    ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].forEach((name, row) => {
      cells.push(h('span', { class: 'hl', text: name }));
      for (let hr = 0; hr < 24; hr++) {
        const c = counts[row][hr];
        const p = c ? 18 + Math.round((c / max) * 82) : 0;
        cells.push(h('span', { class: `cell${row === nowRow && hr === nd.getHours() ? ' now' : ''}`, title: `${name} ${hr}–${hr + 1} Uhr: ${fmt(c)} Nachrichten`, style: c ? `background:color-mix(in srgb, var(--cyan) ${p}%, rgba(34,211,238,.04));box-shadow:0 0 ${Math.round(p / 12)}px rgba(34,211,238,${p / 250})` : null }));
      }
    });
    target.replaceChildren(...cells);
  }

  function modelRows(events) {
    const by = new Map();
    for (const e of events) {
      if (!by.has(e[M])) by.set(e[M], newAcc());
      add(by.get(e[M]), e);
    }
    return [...by.entries()].sort((a, b) => mAcc(b[1]) - mAcc(a[1]));
  }
  function renderModels(events, now) {
    const rows = modelRows(events);
    const el = $('#models');
    el.classList.add('scroll-y');
    if (!rows.length) return el.replaceChildren(h('div', { class: 'empty', text: 'Keine Daten im gewählten Zeitraum.' }));
    const last = latestOf(state.scoped);
    const liveModel = last && isActive(now, state.scoped) ? last[M] : -1;
    const max = Math.max(...rows.map((r) => visibleSum(r[1])));
    el.replaceChildren(...rows.map(([m, acc]) => h('div', { class: `bar-row${m === liveModel ? ' is-active' : ''}`, title: state.data.models[m] }, h('div', { class: 'name' }, prettyModel(state.data.models[m]), h('small', { text: `${fmt(acc.n)} Nachr.` })), h('div', { class: 'val', text: fmtV(mAcc(acc)) }), stack(acc, max))));
  }

  function projectRows(events) {
    const by = new Map();
    for (const e of events) {
      const s = state.data.sessions[e[S]];
      const k = projectKey(s);
      if (!by.has(k)) by.set(k, { key: k, acc: newAcc(), name: s.project, cwd: s.cwd, chats: new Set(), last: 0, sid: s.id });
      const p = by.get(k);
      add(p.acc, e);
      p.chats.add(e[S]);
      if (e[T] > p.last) {
        p.last = e[T];
        p.sid = s.id;
      }
    }
    return [...by.values()].sort((a, b) => mAcc(b.acc) - mAcc(a.acc));
  }
  function renderProjects(events, now) {
    const rows = projectRows(events);
    const el = $('#projects');
    el.classList.add('scroll-y');
    if (!rows.length) return el.replaceChildren(h('div', { class: 'empty', text: 'Keine Daten im gewählten Zeitraum.' }));
    const sum = rows.reduce((s, r) => s + mAcc(r.acc), 0);
    const max = Math.max(...rows.map((r) => visibleSum(r.acc)));
    const cur = currentProject();
    el.replaceChildren(
      ...rows.map((p) =>
        h(
          'div',
          {
            class: `bar-row clickable${cur === p.key ? ' selected' : ''}${now - p.last < ACTIVE_MS ? ' is-active' : ''}`,
            title: `${p.cwd || p.name}\nKlick = nur dieses Projekt zeigen`,
            role: 'button',
            tabindex: 0,
            'aria-pressed': String(cur === p.key),
            onclick: () => setProject(cur === p.key ? '' : p.key),
            onkeydown: (ev) => {
              if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                setProject(cur === p.key ? '' : p.key);
              }
            },
          },
          h('div', { class: 'name' }, p.name, h('small', { text: `${p.chats.size} Chats · ${pctStr(mAcc(p.acc), sum)}` })),
          h('div', { class: 'val', text: fmtV(mAcc(p.acc)) }),
          stack(p.acc, max),
        ),
      ),
    );
  }

  // Shared chat table (overview + chats page)
  function chatTable(tbody, rows, now, limit) {
    const num = (v) => h('td', { title: fmtVFull(v), text: fmtV(v) });
    tbody.replaceChildren(
      ...rows.slice(0, limit).map((r) => {
        const open = () => go(`#/chats/${encodeURIComponent(r.s.id)}`);
        return h(
          'tr',
          { class: `clickable${now - r.last < ACTIVE_MS ? ' live' : ''}`, tabindex: 0, onclick: open, onkeydown: (e) => e.key === 'Enter' && open(), title: 'Klick = Chat-Details' },
          h('td', { class: 'left title' }, h('div', { class: 't', title: r.s.title, text: r.s.title }), h('div', { class: 'p', title: r.s.cwd, text: `${r.s.project} · ${[...r.models].map((m) => prettyModel(state.data.models[m])).join(', ')}` })),
          h('td', { title: fmtDT(r.last) }, fmtDate(r.last), h('span', { class: 'sub', text: fmtAgo(r.last, now) })),
          h('td', { text: fmt(r.acc.n) }),
          num(r.acc.i),
          num(r.acc.cw),
          num(r.acc.cr),
          num(r.acc.o),
          num(r.acc.th),
          h('td', { class: 'total', title: fmtVFull(mAcc(r.acc)), text: fmtV(mAcc(r.acc)) }),
          h('td', { title: 'Was dieser Chat bei API-Preisen gekostet hätte', text: fmtUSD(r.cost) }),
        );
      }),
    );
  }
  function sortRows(rows) {
    const val = (r) => (state.sortKey === 'title' ? r.s.title.toLowerCase() : state.sortKey === 'last' ? r.last : state.sortKey === 'messages' ? r.acc.n : state.sortKey === 'total' ? mAcc(r.acc) : state.sortKey === 'cost' ? r.cost : r.acc[state.sortKey]);
    return rows.sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      return (typeof va === 'string' ? va.localeCompare(vb, 'de') : va - vb) * state.sortDir;
    });
  }
  function wireSortHeaders(table) {
    table.querySelectorAll('th[data-sort]').forEach((th) => {
      th.tabIndex = 0;
      th.setAttribute('aria-sort', th.dataset.sort === state.sortKey ? (state.sortDir > 0 ? 'ascending' : 'descending') : 'none');
      if (th.dataset.wired) return;
      th.dataset.wired = '1';
      const sortBy = () => {
        if (state.sortKey === th.dataset.sort) state.sortDir *= -1;
        else {
          state.sortKey = th.dataset.sort;
          state.sortDir = th.dataset.sort === 'title' ? 1 : -1;
        }
        render();
      };
      th.addEventListener('click', sortBy);
      th.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          sortBy();
        }
      });
    });
  }
  const totalHeader = () => (isCredit() ? 'Kosten' : state.metric === 'all' ? 'Gesamt' : state.metric === 'nocache' ? 'o. Cache-L.' : 'Output');
  function renderSessions(events, now) {
    const q = state.search.trim().toLowerCase();
    let rows = sessionRows(events);
    if (q) rows = rows.filter((r) => `${r.s.title} ${r.s.project}`.toLowerCase().includes(q));
    sortRows(rows);
    $('#sessionCount').textContent = `(${fmt(rows.length)})`;
    const table = $('#sessionsTable');
    table.querySelector('th[data-sort="total"]').textContent = totalHeader();
    wireSortHeaders(table);
    const tbody = table.querySelector('tbody');
    const more = $('#moreSessions');
    if (!rows.length) {
      tbody.replaceChildren(h('tr', null, h('td', { colspan: 10, class: 'left muted', text: q ? 'Kein Chat passt zur Suche.' : 'Keine Chats im gewählten Zeitraum.' })));
      more.hidden = true;
      return;
    }
    chatTable(tbody, rows, now, state.sessionLimit);
    more.hidden = false;
    more.textContent = rows.length > state.sessionLimit ? `Alle ${fmt(rows.length)} Chats öffnen` : 'Chat-Seite öffnen';
  }

  function limitItems() {
    const items = [];
    let prev = null;
    for (let k = state.data.limits.length - 1; k >= 0; k--) {
      const l = state.data.limits[k];
      if (prev && prev.text === l.text && prev.t - l.t < 30 * MIN) continue;
      prev = l;
      items.push(l);
    }
    return items;
  }
  function renderLimits(now) {
    const el = $('#limitsList');
    el.classList.add('scroll-y');
    const items = limitItems();
    if (!items.length) return el.replaceChildren(h('div', { class: 'empty', text: 'Noch keine Limit-Meldungen gefunden.' }));
    el.replaceChildren(
      ...items.map((l) => {
        const s = state.data.sessions[l.s];
        return h('div', { class: 'limit-item' }, h('b', { text: LIMIT_LABEL[l.type] || 'Limit' }), h('span', { class: 'when', text: `${fmtDT(l.t)} · ${fmtAgo(l.t, now)}` }), h('span', { class: 'txt muted', text: `„${l.text}“${s ? ` – ${s.title}` : ''}` }));
      }),
    );
  }

  // ---------- Cost calculator & records ----------
  function moneyRow(label, value, max, cls) {
    return h(
      'div',
      { class: `compare-row${cls ? ` ${cls}` : ''}` },
      h('span', { text: label }),
      h('div', { class: 'compare-bar' }, h('i', { style: `width:${max ? Math.min(100, (value / max) * 100) : 0}%` })),
      h('span', { class: 'num', text: fmtUSD(value) }),
    );
  }

  function renderCost(now) {
    const events = filteredEvents(now);
    const parts = { i: 0, cw: 0, cr: 0, o: 0, saved: 0 };
    for (const e of events) {
      const p = priceOf(e[M]);
      parts.i += (e[I] * p.in) / 1e6;
      parts.cw += (e[CW] * p.in * 2) / 1e6;
      parts.cr += (e[CR] * p.cr) / 1e6;
      parts.o += (e[O] * p.out) / 1e6;
      // Cached reads instead of normal input, minus the surcharge for writing the cache.
      parts.saved += (e[CR] * (p.in - p.cr) - e[CW] * p.in) / 1e6;
    }
    const cost = parts.i + parts.cw + parts.cr + parts.o;
    const monthStart = startOfMonth(now);
    const d = new Date(monthStart);
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const monthCost = state.data.events.reduce((s, e) => (e[T] >= monthStart ? s + evCost(e) : s), 0);
    const frac = Math.min(1, (now - monthStart) / (daysInMonth * DAY));
    const projected = frac > 0.03 ? monthCost / frac : monthCost;
    const price = state.planPrice;
    const allCost = costSum(state.data.events);
    const firstT = state.data.events.length ? state.data.events[0][T] : now;
    const months = Math.max(1, (now - firstT) / (30.44 * DAY));
    const top = sessionRows(events)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);
    const maxPart = Math.max(parts.i, parts.cw, parts.cr, parts.o, 1e-9);
    const maxMonth = Math.max(monthCost, projected, price, 1e-9);
    const verdict =
      price > 0
        ? monthCost >= price
          ? `Das Abo hat sich diesen Monat schon gelohnt: bei API-Preisen wären es ${fmtUSD(monthCost)} statt ${fmtUSD(price)} – ≈ ${fmtUSD(monthCost - price)} gespart.`
          : `Bei API-Preisen hättest du diesen Monat bisher nur ${fmtUSD(monthCost)} bezahlt (Abo: ${fmtUSD(price)}). Hochrechnung fürs Monatsende: ${fmtUSD(projected)}.`
        : '';
    $('#costBody').replaceChildren(
      h('div', { class: 'big' }, h('span', { text: fmtUSD(cost) }), h('small', { text: `API-Kosten · ${rangeLabel()}` })),
      h('div', { class: 'stats' }, h('span', null, h('b', { text: fmt(events.length) }), ' Antworten'), h('span', null, 'Ø ', h('b', { text: fmtUSD(events.length ? cost / events.length : 0) }), ' je Antwort'), h('span', null, 'Caching spart ', h('b', { text: fmtUSD(Math.max(0, parts.saved)) }))),
      h('div', { class: 'compare' }, moneyRow('Diesen Monat (alle Projekte)', monthCost, maxMonth), moneyRow('Hochrechnung Monatsende', projected, maxMonth), price > 0 ? moneyRow('Dein Abo', price, maxMonth, 'limit') : null),
      verdict ? h('p', { class: 'note', text: verdict }) : null,
      h(
        'div',
        { class: 'bar-list', style: 'margin-top:12px' },
        [
          ['Input', parts.i, 'var(--c-i)'],
          ['Cache schreiben', parts.cw, 'var(--c-cw)'],
          ['Cache lesen', parts.cr, 'var(--c-cr)'],
          ['Output (inkl. Thinking)', parts.o, 'var(--c-o)'],
        ].map(([l, v, c]) => h('div', { class: 'bar-row' }, h('div', { class: 'name', text: l }), h('div', { class: 'val', text: fmtUSD(v) }), h('div', { class: 'stack' }, h('i', { style: `width:${(v / maxPart) * 100}%;background:${c}` })))),
      ),
      top.length ? h('div', { class: 'tag', style: 'margin-top:14px', text: 'Teuerste Chats im Zeitraum' }) : null,
      h(
        'div',
        { class: 'bar-list', style: 'margin-top:6px' },
        top.map((r) => h('div', { class: 'bar-row clickable', role: 'button', tabindex: 0, title: 'Chat öffnen', onclick: () => go(`#/chats/${encodeURIComponent(r.s.id)}`), onkeydown: (e) => e.key === 'Enter' && go(`#/chats/${encodeURIComponent(r.s.id)}`) }, h('div', { class: 'name' }, r.s.title, h('small', { text: r.s.project })), h('div', { class: 'val', text: fmtUSD(r.cost) }))),
      ),
      h('p', { class: 'note', text: `Seit Aufzeichnungsbeginn (${fmtDate(firstT, true)}): ${fmtUSD(allCost)} API-Wert ≈ ${fmtUSD(allCost / months)} pro Monat. Preise: Opus 5 $5/$25, Sonnet 5 $2/$10 je 1 Mio. Tokens (Input/Output); Cache schreiben 2×, Cache lesen 0,1× Input.` }),
    );
  }

  function renderRecords(now) {
    const events = state.scoped;
    const recBody = $('#recordBody');
    if (!events.length) return recBody.replaceChildren(h('div', { class: 'empty', text: 'Noch keine Daten.' }));
    const perDay = new Map();
    for (const e of events) perDay.set(dayKey(e[T]), (perDay.get(dayKey(e[T])) || 0) + mEv(e));
    let bestDay = null;
    for (const [k, v] of perDay) if (!bestDay || v > bestDay[1]) bestDay = [k, v];
    const blocks = blocksFor(events).filter((x) => x.acc.n);
    const bestBlock = blocks.reduce((m, x) => (!m || mAcc(x.acc) > mAcc(m.acc) ? x : m), null);
    const rows = sessionRows(events);
    const pick = (fn) => rows.reduce((m, r) => (!m || fn(r) > fn(m) ? r : m), null);
    const costly = pick((r) => r.cost);
    const longest = pick((r) => r.last - r.first);
    const chatty = pick((r) => r.acc.n);
    // Active-day streaks
    const days = [...perDay.keys()].map((k) => {
      const [y, mo, da] = k.split('-').map(Number);
      return new Date(y, mo - 1, da).getTime();
    });
    days.sort((a, b) => a - b);
    let longestStreak = 0;
    let run = 0;
    for (let i = 0; i < days.length; i++) {
      run = i && Math.round((days[i] - days[i - 1]) / DAY) === 1 ? run + 1 : 1;
      longestStreak = Math.max(longestStreak, run);
    }
    let current = 0;
    for (let t = startOfDay(now); perDay.has(dayKey(t)); t -= DAY) current++;
    const [by, bm, bd] = bestDay[0].split('-').map(Number);
    const item = (label, value, sub, onclick) => h('div', { class: onclick ? 'rec clickable' : 'rec', onclick, role: onclick ? 'button' : null, tabindex: onclick ? 0 : null }, h('span', { text: label }), h('b', { text: value }), sub ? h('i', { text: sub }) : null);
    const openChat = (r) => () => go(`#/chats/${encodeURIComponent(r.s.id)}`);
    recBody.replaceChildren(
      h(
        'div',
        { class: 'rec-grid' },
        item('Stärkster Tag', fmtV(bestDay[1]), fmtDate(new Date(by, bm - 1, bd).getTime(), true)),
        bestBlock ? item('Größter 5-Std-Block', fmtV(mAcc(bestBlock.acc)), `${fmtDT(bestBlock.b.start)}`, () => go(`#/bloecke/${bestBlock.b.start}`)) : null,
        costly ? item('Teuerster Chat', fmtUSD(costly.cost), costly.s.title, openChat(costly)) : null,
        longest ? item('Längster Chat', fmtDur(longest.last - longest.first), longest.s.title, openChat(longest)) : null,
        chatty ? item('Meiste Antworten', fmt(chatty.acc.n), chatty.s.title, openChat(chatty)) : null,
        item('Aktive Tage', fmt(perDay.size), `seit ${fmtDate(events[0][T], true)}`),
        item('Aktuelle Serie', `${fmt(current)} ${current === 1 ? 'Tag' : 'Tage'}`, current ? 'jeden Tag mit Claude gearbeitet' : 'heute noch nichts'),
        item('Längste Serie', `${fmt(longestStreak)} ${longestStreak === 1 ? 'Tag' : 'Tage'}`, 'Tage am Stück'),
      ),
    );
  }

  // ---------- Notifications ----------
  const anyNotify = () => state.notify.finish || state.notify.limit || state.notify.reset;
  function notify(key, title, body) {
    if (state.notified[key]) return;
    state.notified[key] = true;
    blip(1046, 0.09, 0.06);
    try {
      if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body, icon: 'favicon.svg', tag: key });
    } catch {
      /* notifications not available */
    }
    toast(`${title} – ${body}`);
  }
  function checkNotifications(now) {
    if (!state.data) return;
    const n = state.notify;
    const active = isActive(now);
    const last = latestOf(allEvents());
    if (n.finish && state.prevActive && !active && last) notify(`finish-${last[T]}`, 'Claude ist fertig', state.data.sessions[last[S]].title);
    state.prevActive = active;
    const block = activeBlock(now);
    if (n.limit && block) {
      const ref = referenceBlock(now);
      const v = mAcc(accountAcc(block));
      if (ref.value && (v / ref.value) * 100 >= n.limitPct) notify(`limit-${block.start}-${state.view}-${state.metric}`, `${Math.round((v / ref.value) * 100)} % vom Vergleichswert`, `Aktueller 5-Std-Block: ${fmtV(v)} · Reset um ${fmtTime(block.end)}`);
    }
    const lastBlock = state.data.blocks[state.data.blocks.length - 1];
    if (n.reset && lastBlock && now >= lastBlock.end && now - lastBlock.end < 10 * MIN) notify(`reset-${lastBlock.end}`, 'Neuer 5-Stunden-Block', limitInBlock(lastBlock) ? 'Dein 5-Std-Limit ist zurückgesetzt – du kannst weiterarbeiten.' : 'Der letzte 5-Std-Block ist abgelaufen.');
  }

  function renderOverview(now) {
    const events = filteredEvents(now);
    const inRange = inRangeOf(state.data.events, now);
    renderComms(now);
    renderBlockPanel(now);
    renderWeekPanel(now);
    renderLog(now);
    renderPulse(now);
    renderKpis(events);
    legendInto($('#dailyLegend'));
    $('#dailyScope').textContent = `· ${currentProject() ? projectLabel(currentProject()) : 'alle Projekte'}${isCredit() ? ' · USD' : ''}`;
    stackedChart($('#dailyChart'), dayBuckets(events, now), { animate: state.animateChart });
    state.animateChart = false;
    renderCost(now);
    renderRecords(now);
    renderBlocksList(now);
    renderHeatmap(events, now);
    renderModels(events, now);
    renderProjects(inRange, now);
    renderSessions(events, now);
    renderLimits(now);
  }

  // ---------- Pages ----------
  const PAGES = [
    { id: 'overview', hash: '#/', label: 'Übersicht' },
    { id: 'chats', hash: '#/chats', label: 'Chats' },
    { id: 'bloecke', hash: '#/bloecke', label: '5-Std-Blöcke' },
    { id: 'verlauf', hash: '#/verlauf', label: 'Verlauf' },
    { id: 'projekte', hash: '#/projekte', label: 'Projekte & Modelle' },
    { id: 'einstellungen', hash: '#/einstellungen', label: 'Einstellungen' },
  ];
  function currentRoute() {
    const [pg, arg] = location.hash.replace(/^#\/?/, '').split('/');
    return { page: PAGES.some((p) => p.id === pg) ? pg : 'overview', arg: arg ? decodeURIComponent(arg) : '' };
  }
  function go(hash) {
    if (location.hash === hash) renderPage(true);
    else location.hash = hash;
  }
  function renderNav() {
    const r = currentRoute();
    $('#pageNav').replaceChildren(...PAGES.map((p, i) => h('a', { href: p.hash, 'aria-current': r.page === p.id ? 'page' : null }, p.label, h('kbd', { text: String(i + 1) }))));
  }

  const pageHead = (title, sub, crumb, actions) =>
    h(
      'div',
      { class: 'page-head' },
      h('div', { style: 'min-width:0' }, crumb ? h('a', { class: 'crumb', href: crumb.href, text: `‹ ${crumb.label}` }) : null, h('h1', { class: 'page-title', text: title }), sub ? h('div', { class: 'page-sub', text: sub }) : null),
      actions ? h('div', { class: 'btn-row' }, actions) : null,
    );
  const panel = (tag, ...children) => h('section', { class: 'panel' }, h('div', { class: 'panel-head wrap' }, h('span', { class: 'tag', text: tag })), ...children);
  const scopeLine = () => `${currentProject() ? `Projekt ${projectLabel(currentProject())}` : 'Alle Projekte'} · ${rangeLabel()} · ${isCredit() ? 'API-Wert in USD' : METRICS[state.metric].label}`;
  const kvBox = (items) => h('div', { class: 'kv' }, items.filter(Boolean).map(([k, v, cls]) => h('div', null, h('span', { text: k }), h('b', { class: cls || null, text: v }))));
  const btn = (label, onclick, cls) => h('button', { type: 'button', class: `hud-btn small${cls ? ` ${cls}` : ''}`, onclick }, label);
  const tableHead = (cols) => h('thead', null, h('tr', null, cols.map((c) => h('th', { class: c.split('|')[1] || null, text: c.split('|')[0] }))));

  let page = null; // { id, arg, update() }

  function mountChats(root) {
    const search = h('input', { type: 'search', class: 'search', placeholder: 'Chat oder Projekt suchen …', value: state.search, 'aria-label': 'Chats durchsuchen' });
    const model = h('select', { class: 'select', 'aria-label': 'Modell' });
    const count = h('span', { class: 'tag dim' });
    const tbody = h('tbody');
    const table = h(
      'table',
      null,
      h('thead', null, h('tr', null, ['title|Chat|left', 'last|Zuletzt', 'messages|Nachr.', 'i|Input', 'cw|Cache schr.', 'cr|Cache lesen', 'o|Output', 'th|Thinking', 'total|Messgröße', 'cost|API $'].map((c) => {
        const [k, l, cls] = c.split('|');
        return h('th', { 'data-sort': k, class: cls || null, text: l });
      }))),
      tbody,
    );
    const rowsNow = () => {
      let rows = sessionRows(filteredEvents(Date.now()));
      const q = search.value.trim().toLowerCase();
      if (q) rows = rows.filter((r) => `${r.s.title} ${r.s.project} ${r.s.cwd}`.toLowerCase().includes(q));
      if (model.value !== '') rows = rows.filter((r) => r.models.has(Number(model.value)));
      return sortRows(rows);
    };
    const exportCsv = () =>
      downloadCSV(`claude-chats-${new Date().toISOString().slice(0, 10)}.csv`, [
        ['Chat', 'Projekt', 'Ordner', 'Chat-ID', 'Erste Nachricht', 'Letzte Nachricht', 'Nachrichten', 'Input', 'Cache schreiben', 'Cache lesen', 'Output', 'Thinking', 'Gesamt', 'API-Wert USD', 'Modelle'],
        ...rowsNow().map((r) => {
          const ev = state.data.events.filter((e) => e[S] === r.idx);
          const tok = ev.reduce((a, e) => ((a.i += e[I]), (a.cw += e[CW]), (a.cr += e[CR]), (a.o += e[O]), (a.th += e[TH]), a), { i: 0, cw: 0, cr: 0, o: 0, th: 0 });
          return [r.s.title, r.s.project, r.s.cwd, r.s.id, new Date(r.first).toLocaleString('de-AT'), new Date(r.last).toLocaleString('de-AT'), r.acc.n, tok.i, tok.cw, tok.cr, tok.o, tok.th, tok.i + tok.cw + tok.cr + tok.o, costSum(ev).toFixed(4), [...r.models].map((m) => state.data.models[m]).join(', ')];
        }),
      ]);
    const sub = h('div', { class: 'page-sub' });
    const head = pageHead('Chats', null, null, [btn('CSV exportieren', exportCsv)]);
    head.firstChild.append(sub);
    root.replaceChildren(head, h('section', { class: 'panel' }, h('div', { class: 'toolbar' }, search, model, count), h('div', { class: 'table-wrap scroll-y tall', style: 'margin-top:14px' }, table)));
    let t = 0;
    search.addEventListener('input', () => {
      state.search = search.value;
      clearTimeout(t);
      t = setTimeout(update, 120);
    });
    model.addEventListener('change', update);
    function update() {
      const now = Date.now();
      const present = new Set();
      for (const e of filteredEvents(now)) present.add(e[M]);
      const keep = model.value;
      model.replaceChildren(h('option', { value: '', text: 'Alle Modelle' }), ...[...present].map((m) => h('option', { value: String(m), text: prettyModel(state.data.models[m]) })));
      model.value = present.has(Number(keep)) ? keep : '';
      sub.textContent = scopeLine();
      table.querySelector('th[data-sort="total"]').textContent = totalHeader();
      const rows = rowsNow();
      count.textContent = `${fmt(rows.length)} CHATS`;
      wireSortHeaders(table);
      if (!rows.length) tbody.replaceChildren(h('tr', null, h('td', { colspan: 10, class: 'left muted', text: 'Keine Chats für diese Auswahl.' })));
      else chatTable(tbody, rows, now, rows.length);
    }
    return update;
  }

  function mountChat(root, id) {
    const idx = state.data.sessions.findIndex((s) => s.id === id);
    const s = state.data.sessions[idx];
    if (!s) {
      root.replaceChildren(pageHead('Chat nicht gefunden', 'Vielleicht wurde der Log gelöscht.', { href: '#/chats', label: 'Chats' }));
      return () => {};
    }
    const cmd = `claude --resume ${s.id}`;
    const head = pageHead(s.title, `${s.project} · ${s.cwd}`, { href: '#/chats', label: 'Chats' }, [
      btn('Fortsetzen-Befehl kopieren', () => copyText(cmd, 'Befehl')),
      btn('Projektordner öffnen', () => openFolder(s.id)),
      btn('CSV (Antworten)', () => {
        const ev = state.data.events.filter((e) => e[S] === idx);
        downloadCSV(`chat-${s.id.slice(0, 8)}.csv`, [['Zeit', 'Modell', 'Input', 'Cache schreiben', 'Cache lesen', 'Output', 'Thinking', 'API-Wert USD', 'Subagent'], ...ev.map((e) => [new Date(e[T]).toLocaleString('de-AT'), state.data.models[e[M]], e[I], e[CW], e[CR], e[O], e[TH], evCost(e).toFixed(4), e[SUB] ? 'ja' : 'nein'])]);
      }),
    ]);
    const facts = h('div');
    const legend = h('div', { class: 'legend' });
    const chart = h('div', { class: 'chart' });
    const tbody = h('tbody');
    root.replaceChildren(
      head,
      h('div', { class: 'code-line' }, h('code', { text: cmd }), btn('Kopieren', () => copyText(cmd, 'Befehl'))),
      facts,
      h('section', { class: 'panel' }, h('div', { class: 'panel-head wrap' }, h('span', { class: 'tag', text: '// JE ANTWORT' }), legend), chart),
      panel('// ALLE ANTWORTEN', h('div', { class: 'table-wrap scroll-y' }, h('table', null, tableHead(['Zeit|left', 'Modell|left', 'Input', 'Cache schr.', 'Cache lesen', 'Output', 'Thinking', 'Messgröße']), tbody))),
    );
    return () => {
      const now = Date.now();
      const ev = state.data.events.filter((e) => e[S] === idx);
      const acc = ev.reduce(add, newAcc());
      const models = [...new Set(ev.map((e) => prettyModel(state.data.models[e[M]])))].join(', ');
      const first = ev.length ? ev[0][T] : s.firstTs;
      const last = ev.length ? ev[ev.length - 1][T] : s.lastTs;
      const tok = ev.reduce((a, e) => ((a.i += e[I]), (a.cw += e[CW]), (a.cr += e[CR]), (a.o += e[O]), (a.th += e[TH]), a), { i: 0, cw: 0, cr: 0, o: 0, th: 0 });
      facts.replaceChildren(
        kvBox([
          [unitLabel(), fmtVFull(mAcc(acc))],
          ['Alle Tokens', fmt(tok.i + tok.cw + tok.cr + tok.o)],
          ['API-Wert (geschätzt)', fmtUSD(costSum(ev))],
          ['Antworten', fmt(acc.n)],
          ['Start', first ? fmtDT(first) : '—'],
          ['Zuletzt', last ? `${fmtDT(last)} (${fmtAgo(last, now)})` : '—'],
          ['Dauer', first && last ? fmtDur(last - first) : '—'],
          ['Modelle', models || '—'],
          ['Output-Tokens', fmt(tok.o)],
          ['davon Thinking', `${fmt(tok.th)} (${pctStr(tok.th, tok.o)})`],
          ['Cache-Trefferquote', pctStr(tok.cr, tok.cr + tok.cw + tok.i)],
          ['Subagent-Anteil', pctStr(acc.sub, acc.total)],
          ['Chat-ID', s.id, 'path'],
        ]),
      );
      legendInto(legend);
      stackedChart(
        chart,
        ev.map((e, k) => ({ acc: add(newAcc(), e), label: fmtTime(e[T]), title: `Antwort ${k + 1} · ${fmtDT(e[T])}`, extra: `${prettyModel(state.data.models[e[M]])}${e[SUB] ? ' · Subagent' : ''}` })),
        { height: 260, emptyText: 'Keine Antworten.' },
      );
      tbody.replaceChildren(
        ...ev
          .slice()
          .reverse()
          .map((e) => {
            const a = add(newAcc(), e);
            const num = (v) => h('td', { title: fmtVFull(v), text: fmtV(v) });
            return h('tr', null, h('td', { class: 'left', text: `${fmtDate(e[T])} ${fmtTime(e[T], true)}` }), h('td', { class: 'left', text: `${prettyModel(state.data.models[e[M]])}${e[SUB] ? ' · SUB' : ''}` }), num(a.i), num(a.cw), num(a.cr), num(a.o), num(a.th), h('td', { class: 'total', text: fmtV(mAcc(a)) }));
          }),
      );
    };
  }

  function mountBlocks(root) {
    const legend = h('div', { class: 'legend' });
    const chart = h('div', { class: 'chart' });
    const tbody = h('tbody');
    const sub = h('div', { class: 'page-sub' });
    const head = pageHead('5-Stunden-Blöcke', null, null, [
      btn('CSV exportieren', () => {
        const list = state.data.blocks.filter((b) => state.credit.perBlock.get(b.start).value > 0);
        downloadCSV('claude-bloecke.csv', [['Start', 'Ende', 'Nachrichten', 'Input', 'Cache schreiben', 'Cache lesen', 'Output', 'Thinking', 'API-Wert USD', 'Guthaben USD (geschätzt)', 'Limit'], ...list.map((b) => [new Date(b.start).toLocaleString('de-AT'), new Date(b.end).toLocaleString('de-AT'), b.messages, b.i, b.cw, b.cr, b.o, b.th, state.credit.perBlock.get(b.start).value.toFixed(4), state.credit.perBlock.get(b.start).credit.toFixed(4), b.limit ? b.limit.text : ''])]);
      }),
    ]);
    head.firstChild.append(sub);
    const theadRow = h('tr');
    root.replaceChildren(
      head,
      h('section', { class: 'panel' }, h('div', { class: 'panel-head wrap' }, h('span', { class: 'tag', text: '// BLÖCKE IM ZEITRAUM · KLICK = DETAILS' }), legend), chart),
      panel('// ALLE BLÖCKE', h('div', { class: 'table-wrap scroll-y tall' }, h('table', null, h('thead', null, theadRow), tbody))),
    );
    return () => {
      const now = Date.now();
      sub.textContent = scopeLine();
      const start = rangeStart(now);
      const list = blocksFor(state.scoped).filter((x) => x.acc.n && x.b.end > start && x.b.start <= rangeEnd(now));
      legendInto(legend);
      stackedChart(chart, list.map(({ b, acc }) => ({ acc, label: fmtDate(b.start), title: `${fmtDT(b.start)}–${fmtTime(b.end)}`, extra: b.limit ? `⚠ ${LIMIT_LABEL[b.limit.type]}` : null, mark: Boolean(b.limit), today: now < b.end, onClick: () => go(`#/bloecke/${b.start}`) })), { height: 280 });
      const cols = ['Block|left', 'Nachr.', 'Chats', 'Auswahl', 'Konto gesamt'].concat(showMoney() ? ['API-Wert', 'Guthaben'] : [], ['Limit|left']);
      theadRow.replaceChildren(...cols.map((c) => h('th', { class: c.split('|')[1] || null, text: c.split('|')[0] })));
      tbody.replaceChildren(
        ...list
          .slice()
          .reverse()
          .map(({ b, acc }) => {
            const chats = new Set(state.scoped.filter((e) => e[T] >= b.start && e[T] < b.end).map((e) => e[S])).size;
            const cb = state.credit.perBlock.get(b.start);
            const open = () => go(`#/bloecke/${b.start}`);
            return h(
              'tr',
              { class: `clickable${now < b.end ? ' live' : ''}`, tabindex: 0, onclick: open, onkeydown: (e) => e.key === 'Enter' && open() },
              h('td', { class: 'left title' }, h('div', { class: 't', text: `${WD[new Date(b.start).getDay()]} ${fmtDate(b.start, true)} · ${fmtTime(b.start)}–${fmtTime(b.end)}` })),
              h('td', { text: fmt(acc.n) }),
              h('td', { text: fmt(chats) }),
              h('td', { class: 'total', text: fmtV(mAcc(acc)), title: fmtVFull(mAcc(acc)) }),
              h('td', { text: fmtV(mAcc(accountAcc(b))) }),
              showMoney() ? h('td', { text: fmtUSD(cb.value) }) : null,
              showMoney() ? h('td', { text: cb.credit ? fmtUSD(cb.credit) : '—' }) : null,
              h('td', { class: 'left' }, b.limit ? h('span', { class: 'flag', title: b.limit.text, text: LIMIT_LABEL[b.limit.type] }) : '—'),
            );
          }),
      );
    };
  }

  function mountBlock(root, arg) {
    const block = state.data.blocks.find((b) => String(b.start) === arg);
    if (!block) {
      root.replaceChildren(pageHead('Block nicht gefunden', null, { href: '#/bloecke', label: 'Blöcke' }));
      return () => {};
    }
    const facts = h('div');
    const legend = h('div', { class: 'legend' });
    const chart = h('div', { class: 'chart' });
    const chats = h('div', { class: 'bar-list scroll-y', style: 'max-height:420px' });
    const projects = h('div', { class: 'bar-list scroll-y', style: 'max-height:420px' });
    const sub = h('div', { class: 'page-sub' });
    const head = pageHead(`Block ${WD_LONG[new Date(block.start).getDay()]}, ${fmtDate(block.start, true)} · ${fmtTime(block.start)}–${fmtTime(block.end)}`, null, { href: '#/bloecke', label: 'Blöcke' });
    head.firstChild.append(sub);
    root.replaceChildren(head, facts, h('section', { class: 'panel' }, h('div', { class: 'panel-head wrap' }, h('span', { class: 'tag', text: '// VERLAUF IN 15-MINUTEN-SCHRITTEN' }), legend), chart), h('div', { class: 'grid-2' }, panel('// CHATS IN DIESEM BLOCK', chats), panel('// PROJEKTE IN DIESEM BLOCK', projects)));
    return () => {
      const now = Date.now();
      sub.textContent = scopeLine();
      const ev = state.scoped.filter((e) => e[T] >= block.start && e[T] < block.end);
      const acc = ev.reduce(add, newAcc());
      const cb = state.credit.perBlock.get(block.start);
      facts.replaceChildren(
        kvBox([
          [unitLabel(), fmtVFull(mAcc(acc))],
          ['Konto gesamt', fmtVFull(mAcc(accountAcc(block)))],
          ['Antworten', fmt(acc.n)],
          ['Aktiv von', ev.length ? `${fmtTime(ev[0][T])} bis ${fmtTime(ev[ev.length - 1][T])}` : '—'],
          ['Status', now < block.end ? `läuft noch ${fmtDur(block.end - now)}` : 'abgeschlossen'],
          ['API-Wert Konto', fmtUSD(cb.value)],
          ['Guthaben (geschätzt)', state.credit.quota.value ? fmtUSD(cb.credit) : 'Kontingent unbekannt'],
          block.limit ? ['Limit', `${LIMIT_LABEL[block.limit.type]} um ${fmtTime(block.limit.t)}`] : null,
        ]),
      );
      legendInto(legend);
      const buckets = Array.from({ length: 20 }, (_, k) => {
        const t0 = block.start + k * 15 * MIN;
        return { acc: newAcc(), label: fmtTime(t0), title: `${fmtTime(t0)}–${fmtTime(t0 + 15 * MIN)}`, today: now >= t0 && now < t0 + 15 * MIN };
      });
      for (const e of ev) add(buckets[Math.min(19, Math.floor((e[T] - block.start) / (15 * MIN)))].acc, e);
      stackedChart(chart, buckets, { height: 240, emptyText: 'In diesem Block gibt es für diese Auswahl keine Antworten.' });
      const rows = sessionRows(ev).sort((a, b) => mAcc(b.acc) - mAcc(a.acc));
      const max = Math.max(1e-9, ...rows.map((r) => visibleSum(r.acc)));
      chats.replaceChildren(...(rows.length ? rows.map((r) => h('div', { class: 'bar-row clickable', role: 'button', tabindex: 0, onclick: () => go(`#/chats/${encodeURIComponent(r.s.id)}`) }, h('div', { class: 'name' }, r.s.title, h('small', { text: `${fmt(r.acc.n)} Nachr.` })), h('div', { class: 'val', text: fmtV(mAcc(r.acc)) }), stack(r.acc, max))) : [h('div', { class: 'empty', text: 'Keine Chats.' })]));
      const pr = projectRows(ev);
      const pmax = Math.max(1e-9, ...pr.map((p) => visibleSum(p.acc)));
      projects.replaceChildren(...(pr.length ? pr.map((p) => h('div', { class: 'bar-row' }, h('div', { class: 'name' }, p.name, h('small', { text: `${p.chats.size} Chats` })), h('div', { class: 'val', text: fmtV(mAcc(p.acc)) }), stack(p.acc, pmax))) : [h('div', { class: 'empty', text: 'Keine Projekte.' })]));
    };
  }

  function periodBuckets(events, now, gran) {
    const buckets = [];
    const map = new Map();
    const startOf = (ts) => {
      const d = new Date(ts);
      if (gran === 'hour') d.setMinutes(0, 0, 0);
      else {
        d.setHours(0, 0, 0, 0);
        if (gran === 'week') d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
        if (gran === 'month') d.setDate(1);
      }
      return d.getTime();
    };
    const nextOf = (ts) => {
      const d = new Date(ts);
      if (gran === 'hour') d.setHours(d.getHours() + 1);
      else if (gran === 'day') d.setDate(d.getDate() + 1);
      else if (gran === 'week') d.setDate(d.getDate() + 7);
      else d.setMonth(d.getMonth() + 1);
      return d.getTime();
    };
    const from = gran === 'hour' ? startOf(now - 47 * HOUR) : Number.isFinite(rangeStart(now)) ? startOf(rangeStart(now)) : events.length ? startOf(events[0][T]) : startOf(now);
    const cur = startOf(Math.min(now, rangeEnd(now)));
    for (let t = from; t <= cur; t = nextOf(t)) {
      const d = new Date(t);
      const label = gran === 'hour' ? `${String(d.getHours()).padStart(2, '0')}:00` : gran === 'day' ? fmtDate(t) : gran === 'week' ? `KW ${fmtDate(t)}` : d.toLocaleDateString('de-AT', { month: 'short', year: '2-digit' });
      const title = gran === 'hour' ? `${fmtDT(t)}–${fmtTime(nextOf(t))}` : gran === 'day' ? `${WD_LONG[d.getDay()]}, ${fmtDate(t, true)}` : gran === 'week' ? `Woche ab ${fmtDate(t, true)}` : d.toLocaleDateString('de-AT', { month: 'long', year: 'numeric' });
      const b = { acc: newAcc(), label, title, ts: t, today: t === cur };
      buckets.push(b);
      map.set(t, b);
    }
    for (const e of events) {
      const b = map.get(startOf(e[T]));
      if (b) add(b.acc, e);
    }
    return buckets;
  }

  function mountVerlauf(root) {
    const GRAN = [
      ['hour', 'Stunden (48 h)'],
      ['day', 'Tage'],
      ['week', 'Wochen'],
      ['month', 'Monate'],
    ];
    const seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Auflösung' });
    const legend = h('div', { class: 'legend' });
    const chart = h('div', { class: 'chart' });
    const tbody = h('tbody');
    const heat = h('div', { class: 'heatmap' });
    const sub = h('div', { class: 'page-sub' });
    const eventsNow = (now) => (state.granularity === 'hour' ? state.scoped.filter((e) => e[T] >= now - 48 * HOUR) : filteredEvents(now));
    const head = pageHead('Verlauf', null, null, [
      btn('CSV exportieren', () => {
        const now = Date.now();
        const b = periodBuckets(eventsNow(now), now, state.granularity);
        downloadCSV(`claude-verlauf-${state.granularity}.csv`, [['Zeitraum', 'Nachrichten', 'Input', 'Cache schreiben', 'Cache lesen', 'Output', 'Thinking', isCredit() ? 'Kosten USD' : 'Gesamt'], ...b.map((x) => [x.title, x.acc.n, x.acc.i, x.acc.cw, x.acc.cr, x.acc.o, x.acc.th, x.acc.total])]);
      }),
    ]);
    head.firstChild.append(sub);
    root.replaceChildren(
      head,
      h('section', { class: 'panel' }, h('div', { class: 'toolbar', style: 'margin-bottom:14px' }, seg, h('span', { class: 'spacer' }), legend), chart),
      panel('// ZEITRÄUME', h('div', { class: 'table-wrap scroll-y tall' }, h('table', null, tableHead(['Zeitraum|left', 'Nachr.', 'Input', 'Cache schr.', 'Cache lesen', 'Output', 'Thinking', 'Messgröße']), tbody))),
      panel('// AKTIVITÄT NACH WOCHENTAG & STUNDE', heat),
    );
    return () => {
      const now = Date.now();
      sub.textContent = scopeLine() + (state.granularity === 'hour' ? ' · Stundenansicht immer 48 h' : '');
      seg.replaceChildren(...GRAN.map(([k, l]) => h('button', { type: 'button', 'aria-pressed': String(state.granularity === k), onclick: () => ((state.granularity = k), store.set('granularity', k), render()) }, l)));
      legendInto(legend);
      const buckets = periodBuckets(eventsNow(now), now, state.granularity);
      stackedChart(chart, buckets, { height: 320 });
      const num = (v) => h('td', { title: fmtVFull(v), text: fmtV(v) });
      tbody.replaceChildren(
        ...buckets
          .filter((b) => b.acc.n)
          .reverse()
          .map((b) => h('tr', null, h('td', { class: 'left', text: b.title }), h('td', { text: fmt(b.acc.n) }), num(b.acc.i), num(b.acc.cw), num(b.acc.cr), num(b.acc.o), num(b.acc.th), h('td', { class: 'total', text: fmtV(mAcc(b.acc)) }))),
      );
      renderHeatmap(filteredEvents(now), now, heat);
    };
  }

  function mountProjekte(root) {
    const pbody = h('tbody');
    const mbody = h('tbody');
    const sub = h('div', { class: 'page-sub' });
    const head = pageHead('Projekte & Modelle');
    head.firstChild.append(sub);
    root.replaceChildren(
      head,
      panel('// PROJEKTE', h('div', { class: 'table-wrap scroll-y' }, h('table', null, tableHead(['Projekt|left', 'Chats', 'Nachr.', 'Messgröße', 'Anteil', 'Zuletzt', 'Aktionen|left']), pbody))),
      panel('// MODELLE', h('div', { class: 'table-wrap scroll-y' }, h('table', null, tableHead(['Modell|left', 'Nachr.', 'Input', 'Output', 'Thinking', 'Messgröße', 'Anteil', 'Preis in/out je 1 Mio.']), mbody))),
    );
    return () => {
      const now = Date.now();
      const start = rangeStart(now);
      sub.textContent = `${rangeLabel()} · ${isCredit() ? 'API-Wert in USD' : METRICS[state.metric].label} · Projekte immer alle, Modelle für: ${currentProject() ? projectLabel(currentProject()) : 'alle Projekte'}`;
      const rows = projectRows(inRangeOf(state.data.events, now));
      const sum = rows.reduce((s, r) => s + mAcc(r.acc), 0);
      const cur = currentProject();
      pbody.replaceChildren(
        ...rows.map((p) =>
          h(
            'tr',
            { class: now - p.last < ACTIVE_MS ? 'live' : null },
            h('td', { class: 'left title' }, h('div', { class: 't', text: p.name }), h('div', { class: 'p', title: p.cwd, text: p.cwd })),
            h('td', { text: fmt(p.chats.size) }),
            h('td', { text: fmt(p.acc.n) }),
            h('td', { class: 'total', text: fmtV(mAcc(p.acc)), title: fmtVFull(mAcc(p.acc)) }),
            h('td', { text: pctStr(mAcc(p.acc), sum) }),
            h('td', { title: fmtDT(p.last) }, fmtDate(p.last), h('span', { class: 'sub', text: fmtAgo(p.last, now) })),
            h('td', { class: 'left' }, h('div', { class: 'btn-row' }, btn(cur === p.key ? 'Aktiv ✓' : 'Filtern', () => (setProject(p.key), go('#/'))), btn('Ordner', () => openFolder(p.sid)), btn('Chats', () => (setProject(p.key), go('#/chats'))))),
          ),
        ),
      );
      const models = modelRows(filteredEvents(now));
      const msum = models.reduce((s, [, a]) => s + mAcc(a), 0);
      mbody.replaceChildren(
        ...models.map(([m, a]) => {
          const p = priceOf(m);
          return h('tr', null, h('td', { class: 'left', text: `${prettyModel(state.data.models[m])} (${state.data.models[m]})` }), h('td', { text: fmt(a.n) }), h('td', { text: fmtV(a.i) }), h('td', { text: fmtV(a.o) }), h('td', { text: fmtV(a.th) }), h('td', { class: 'total', text: fmtV(mAcc(a)) }), h('td', { text: pctStr(mAcc(a), msum) }), h('td', { text: `$${p.in} / $${p.out}${p.known ? '' : ' (geschätzt)'}` }));
        }),
      );
    };
  }

  function mountSettings(root) {
    const segOf = (items, current, onPick) => h('div', { class: 'seg' }, items.map(([v, l]) => h('button', { type: 'button', 'aria-pressed': String(current === v), onclick: () => onPick(v) }, l)));
    const numInput = (value, placeholder, label, onSet) => {
      const input = h('input', { class: 'input', type: 'number', min: '0', step: '0.01', placeholder, value: value > 0 ? String(value) : '', 'aria-label': label });
      input.addEventListener('change', () => onSet(Number(String(input.value).replace(',', '.')) || 0));
      return input;
    };
    const setNotify = (patch) => {
      state.notify = { ...state.notify, ...patch };
      store.set('notify', state.notify);
      schedule();
    };
    const notifyToggle = (key, label, hint, extra) => {
      const input = h('input', { type: 'checkbox', checked: state.notify[key] });
      input.addEventListener('change', async () => {
        if (input.checked && 'Notification' in window && Notification.permission === 'default') await Notification.requestPermission();
        if (input.checked && 'Notification' in window && Notification.permission === 'denied') toast('Der Browser blockiert Benachrichtigungen – es kommen nur Hinweise im Dashboard.', true);
        setNotify({ [key]: input.checked });
      });
      return h('label', { class: 'check' }, input, h('span', null, h('span', { text: label }), hint ? h('small', { style: 'display:block;color:var(--dim)', text: hint }) : null, extra ? h('span', { style: 'display:block;margin-top:6px;max-width:120px' }, extra) : null));
    };
    const box = h('div', { class: 'settings-grid' });
    root.replaceChildren(pageHead('Einstellungen', 'Alles wird nur in diesem Browser gespeichert.'), box);
    return () => {
      const d = state.data;
      const q = planQuota();
      const voices = 'speechSynthesis' in window ? speechSynthesis.getVoices() : [];
      const voiceSel = h('select', { class: 'select', 'aria-label': 'Stimme' }, h('option', { value: '', text: 'Automatisch (Deutsch)' }), ...voices.filter((v) => /^de/i.test(v.lang)).concat(voices.filter((v) => !/^de/i.test(v.lang))).map((v) => h('option', { value: v.voiceURI, text: `${v.name} (${v.lang})` })));
      voiceSel.value = state.voiceURI;
      voiceSel.addEventListener('change', () => ((state.voiceURI = voiceSel.value), store.set('voice', state.voiceURI)));
      const rate = h('input', { type: 'range', min: '0.7', max: '1.5', step: '0.05', value: String(state.voiceRate), 'aria-label': 'Sprechtempo' });
      const rateLbl = h('small', { text: `Tempo ${df.format(state.voiceRate)}×` });
      rate.addEventListener('input', () => {
        state.voiceRate = Number(rate.value);
        rateLbl.textContent = `Tempo ${df.format(state.voiceRate)}×`;
        store.set('voiceRate', state.voiceRate);
      });
      const daySel = h('select', { class: 'select', 'aria-label': 'Reset-Wochentag' }, h('option', { value: '', text: 'rollierend (letzte 7 Tage)' }), ...[1, 2, 3, 4, 5, 6, 0].map((x) => h('option', { value: String(x), text: WD_LONG[x] })));
      daySel.value = String(state.weekDay);
      daySel.addEventListener('change', () => ((state.weekDay = daySel.value), store.set('weekDay', state.weekDay), render()));
      const hourSel = h('select', { class: 'select', 'aria-label': 'Reset-Uhrzeit' }, ...Array.from({ length: 24 }, (_, x) => h('option', { value: String(x), text: `${String(x).padStart(2, '0')}:00` })));
      hourSel.value = String(state.weekHour);
      hourSel.addEventListener('change', () => ((state.weekHour = Number(hourSel.value)), store.set('weekHour', state.weekHour), render()));
      const sound = h('input', { type: 'checkbox', checked: state.sound });
      sound.addEventListener('change', () => ((state.sound = sound.checked), store.set('sound', state.sound), $('#soundBtn').setAttribute('aria-pressed', String(state.sound)), blip(988)));
      const live = h('input', { type: 'checkbox', checked: state.live });
      live.addEventListener('change', () => setLive(live.checked));
      const refKey = isCredit() ? 'credit' : state.metric;
      box.replaceChildren(
        h(
          'section',
          { class: 'panel stack-v' },
          h('span', { class: 'tag', text: '// ANSICHT & MESSGRÖSSE' }),
          segOf(VIEWS, state.view, (v) => setView(v)),
          segOf(Object.entries(METRICS).map(([k, m]) => [k, m.label]), state.metric, (v) => setMetric(v)),
          h('p', { class: 'note', style: 'margin:0', text: isCredit() ? 'Guthaben-Ansicht: alle Werte als API-Wert in US-Dollar (Preisliste unten).' : METRICS[state.metric].hint }),
          h('span', { class: 'tag', text: '// 5-STD-LIMIT-REFERENZ' }),
          h(
            'label',
            { class: 'field' },
            h('span', { text: `Eigener Vergleichswert (${isCredit() ? 'USD' : `Mio. ${METRICS[state.metric].short}`})` }),
            numInput(state.limitRef[refKey] ? (isCredit() ? state.limitRef[refKey] : state.limitRef[refKey] / 1e6) : 0, 'leer = automatisch', 'Eigener Limit-Wert', (v) => {
              state.limitRef = { ...state.limitRef, [refKey]: v > 0 ? (isCredit() ? v : v * 1e6) : 0 };
              store.set('limitRef', state.limitRef);
              toast(v > 0 ? 'Limit-Referenz gespeichert' : 'Limit-Referenz: automatisch');
              render();
            }),
            h('small', { text: 'Leer = automatisch (Block beim letzten Limit, sonst größter Block).' }),
          ),
        ),
        h(
          'section',
          { class: 'panel stack-v' },
          h('span', { class: 'tag', text: '// GUTHABEN (SCHÄTZUNG)' }),
          h(
            'label',
            { class: 'field' },
            h('span', { text: 'Monatliches Ausgabenlimit (USD)' }),
            numInput(state.creditBudget, 'z. B. 20', 'Monatliches Ausgabenlimit', (v) => {
              state.creditBudget = v;
              store.set('creditBudget', v);
              toast(v ? `Ausgabenlimit: ${fmtUSD(v)}` : 'Ausgabenlimit entfernt');
              render();
            }),
            h('small', { text: 'Steht bei claude.ai unter Einstellungen → Nutzung → Extra-Nutzung.' }),
          ),
          h(
            'label',
            { class: 'field' },
            h('span', { text: 'Plan-Kontingent pro 5-Std-Block (API-Wert in USD)' }),
            numInput(state.planQuota, q.auto && q.value ? `automatisch: ${df.format(q.value)}` : 'unbekannt', 'Plan-Kontingent pro Block', (v) => {
              state.planQuota = v;
              store.set('planQuota', v);
              toast(v ? `Plan-Kontingent: ${fmtUSD(v)} pro Block` : 'Plan-Kontingent: automatisch');
              render();
            }),
            h('small', { text: `Alles, was ein Block darüber hinaus verbraucht, zählt als Guthaben. Automatisch = API-Wert des Blocks bis zu deinem letzten 5-Std-Limit${q.auto && q.value ? ` (${fmtUSD(q.value)})` : ' (noch kein Limit gefunden)'}.` }),
          ),
          h('p', { class: 'note', style: 'margin:0', text: 'Nur eine Schätzung: Claude Code speichert keine Abrechnungsdaten. Preise je 1 Mio. Tokens (Input/Output): Opus 5 & 4.8 $5/$25 · Sonnet 5 $2/$10 · Haiku 4.5 $1/$5 · Fable 5.1 $10/$50. Cache schreiben = 2× Input, Cache lesen = 0,1× Input. Genaue Werte: claude.ai → Einstellungen → Nutzung.' }),
        ),
        h(
          'section',
          { class: 'panel stack-v' },
          h('span', { class: 'tag', text: '// ABO & BENACHRICHTIGUNGEN' }),
          h(
            'label',
            { class: 'field' },
            h('span', { text: 'Abo-Preis pro Monat (USD)' }),
            numInput(state.planPrice, '20', 'Abo-Preis pro Monat', (v) => {
              state.planPrice = v;
              store.set('planPrice', v);
              toast(v ? `Abo-Preis: ${fmtUSD(v)} pro Monat` : 'Kein Abo-Vergleich');
              render();
            }),
            h('small', { text: 'Für den Kosten-Rechner: Wie viel hätte deine Nutzung bei API-Preisen gekostet – im Vergleich zu deinem Abo? (Pro = 20 $)' }),
          ),
          notifyToggle('finish', 'Benachrichtigen, wenn Claude fertig ist', 'Sobald 90 Sekunden lang keine neue Antwort mehr kommt – praktisch bei langen Aufgaben.'),
          notifyToggle('limit', 'Warnen, wenn der 5-Std-Block den Vergleichswert erreicht', null, numInput(state.notify.limitPct, '80', 'Schwelle in Prozent', (v) => setNotify({ limitPct: v > 0 ? v : 80 }))),
          notifyToggle('reset', 'Benachrichtigen, wenn ein neuer 5-Std-Block beginnt', 'z. B. wenn dein Limit zurückgesetzt ist.'),
          h('div', { class: 'btn-row' }, btn('Test-Benachrichtigung', () => ((state.notified['test'] = false), notify('test', 'Token-Monitor', 'So sehen Benachrichtigungen aus.')))),
          h('small', { class: 'note', style: 'margin:0', text: 'Benachrichtigungen kommen nur, solange das Dashboard in einem Browser-Tab offen ist (darf im Hintergrund sein).' }),
        ),
        h(
          'section',
          { class: 'panel stack-v' },
          h('span', { class: 'tag', text: '// AKTUALISIERUNG' }),
          segOf(
            [
              [5, '5 s'],
              [10, '10 s'],
              [30, '30 s'],
              [60, '60 s'],
            ],
            state.refreshSec,
            (v) => ((state.refreshSec = v), store.set('refreshSec', v), schedule(), render()),
          ),
          h('label', { class: 'check' }, live, h('span', { text: 'Live-Aktualisierung aktiv (Taste P)' })),
          h('span', { class: 'tag', text: '// WOCHEN-RESET' }),
          h('div', { class: 'toolbar' }, daySel, hourSel),
          h('span', { class: 'tag', text: '// BOOT-ANIMATION' }),
          segOf(
            [
              ['always', 'Immer'],
              ['session', 'Einmal pro Sitzung'],
              ['never', 'Nie'],
            ],
            state.bootMode,
            (v) => ((state.bootMode = v), store.set('bootMode', v), render()),
          ),
        ),
        h(
          'section',
          { class: 'panel stack-v' },
          h('span', { class: 'tag', text: '// STIMME & TÖNE' }),
          h('label', { class: 'field' }, h('span', { text: 'Stimme fürs Briefing' }), voiceSel),
          h('label', { class: 'field' }, h('span', { text: 'Sprechtempo' }), rate, rateLbl),
          h('div', { class: 'btn-row' }, btn('Probe anhören', () => 'speechSynthesis' in window && speak('Hallo! So klinge ich im Briefing.', () => orb && orb.voice(0.8), () => {})), btn('Briefing starten', () => startBriefing())),
          h('label', { class: 'check' }, sound, h('span', { text: 'Leise UI-Töne bei neuen Nachrichten' })),
        ),
        h(
          'section',
          { class: 'panel stack-v' },
          h('span', { class: 'tag', text: '// DATEN' }),
          kvBox([
            ['Log-Dateien', fmt(d.files)],
            ['Nachrichten', fmt(d.events.length)],
            ['Chats', fmt(d.sessions.length)],
            ['Einlesen', `${fmt(d.durationMs)} ms`],
            ['Quelle', d.sourceDir, 'path'],
          ]),
          h(
            'div',
            { class: 'btn-row' },
            btn('Alle Antworten als CSV', () => downloadCSV('claude-alle-antworten.csv', [['Zeit', 'Chat', 'Projekt', 'Modell', 'Input', 'Cache schreiben', 'Cache lesen', 'Output', 'Thinking', 'API-Wert USD', 'Subagent'], ...state.data.events.map((e) => [new Date(e[T]).toLocaleString('de-AT'), state.data.sessions[e[S]].title, state.data.sessions[e[S]].project, state.data.models[e[M]], e[I], e[CW], e[CR], e[O], e[TH], evCost(e).toFixed(4), e[SUB] ? 'ja' : 'nein'])])),
            btn(
              'Einstellungen zurücksetzen',
              () => {
                try {
                  Object.keys(localStorage)
                    .filter((k) => k.startsWith('td-'))
                    .forEach((k) => localStorage.removeItem(k));
                } catch {
                  /* ignore */
                }
                location.reload();
              },
              'warn',
            ),
          ),
        ),
      );
    };
  }

  function renderPage(force) {
    const r = currentRoute();
    renderNav();
    const main = $('#app');
    const view = $('#pageView');
    if (r.page === 'overview') {
      page = null;
      main.classList.remove('page-mode');
      view.hidden = true;
      view.replaceChildren();
      if (state.data) render();
      return;
    }
    main.classList.add('page-mode');
    view.hidden = false;
    if (!state.data) {
      view.replaceChildren(h('div', { class: 'skeleton' }));
      return;
    }
    if (force || !page || page.id !== r.page || page.arg !== r.arg) {
      const mount = { chats: r.arg ? (el) => mountChat(el, r.arg) : mountChats, bloecke: r.arg ? (el) => mountBlock(el, r.arg) : mountBlocks, verlauf: mountVerlauf, projekte: mountProjekte, einstellungen: mountSettings }[r.page];
      view.replaceChildren();
      page = { id: r.page, arg: r.arg, update: mount(view) };
      window.scrollTo({ top: 0 });
    }
    render();
  }

  // ---------- Render ----------
  function render() {
    if (!state.data) return;
    const now = Date.now();
    const proj = currentProject();
    state.scoped = proj ? state.data.events.filter((e) => projectKey(state.data.sessions[e[S]]) === proj) : state.data.events;
    state.accountBlocks = new Map(blocksFor(state.data.events).map((x) => [x.b.start, x.acc]));
    state.credit = computeCredit(now);
    renderHeaderControls(now);
    renderReactor(now);
    if (page) page.update();
    else renderOverview(now);
    const d = state.data;
    $('#footer').textContent = `${fmt(d.files)} Log-Dateien · ${fmt(d.events.length)} Nachrichten · ${fmt(d.sessions.length)} Chats · Quelle: ${d.sourceDir} · ${state.live ? `aktualisiert alle ${state.refreshSec} s` : 'Aktualisierung pausiert'}`;
    $('#statusLine').textContent = `CLAUDE CODE · 100 % LOKAL · STAND ${fmtTime(state.loadedAt, true)}`;
  }

  // ---------- Loading ----------
  let loading = false;
  async function load() {
    if (loading) return null;
    loading = true;
    $('#refreshBtn').classList.add('spinning');
    try {
      const res = await fetch('/api/usage', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Server antwortet mit ${res.status}`);
      const data = await res.json();
      const first = !state.data;
      const fresh = first ? [] : data.events.filter((e) => e[T] > state.lastMaxT);
      if (!first && data.models.length !== state.data.models.length) priceCache.clear();
      state.data = data;
      state.loadedAt = Date.now();
      state.offline = false;
      state.lastMaxT = data.events.length ? data.events[data.events.length - 1][T] : 0;
      state.newKeys = new Set(fresh.map((e) => `${e[T]}-${e[S]}`));
      $('#errorBox').hidden = true;
      if (first) renderPage(true);
      else render();
      const proj = currentProject();
      const mine = proj ? fresh.filter((e) => projectKey(data.sessions[e[S]]) === proj) : fresh;
      if (mine.length) {
        const v = mine.reduce((s, e) => s + mEv(e), 0);
        if (orb) orb.pulse(Math.min(1, isCredit() ? 0.3 + v : Math.log10(1 + v) / 4));
        flyTokens(v);
        blip(880 + Math.min(600, mine.length * 80));
      }
      return data;
    } catch (err) {
      state.offline = true;
      const box = $('#errorBox');
      box.hidden = false;
      box.textContent = `Keine Verbindung zum lokalen Server (${err.message}). Läuft er noch? Starte ihn mit „start.bat“ oder „node server.js“.`;
      renderReactor(Date.now());
      return null;
    } finally {
      loading = false;
      $('#refreshBtn').classList.remove('spinning');
    }
  }

  let refreshTimer = 0;
  function schedule() {
    clearInterval(refreshTimer);
    // With notifications switched on, keep polling in the background too (browsers throttle this to about once a minute).
    if (state.live) refreshTimer = setInterval(() => (document.visibilityState === 'visible' || anyNotify()) && load(), state.refreshSec * SEC);
  }
  function setLive(on) {
    state.live = on;
    $('#liveBtn').setAttribute('aria-pressed', String(on));
    $('#liveBtn').title = on ? 'Live-Aktualisierung pausieren (P)' : 'Live-Aktualisierung fortsetzen (P)';
    schedule();
    if (on) load();
    render();
    toast(on ? 'Live-Aktualisierung läuft' : 'Live-Aktualisierung pausiert');
  }

  // ---------- Boot ----------
  async function boot() {
    const bootEl = $('#boot');
    const logEl = $('#bootLog');
    const bar = $('#bootBar');
    let seen = false;
    try {
      seen = sessionStorage.getItem('td-booted') === '1';
      sessionStorage.setItem('td-booted', '1');
    } catch {
      /* ignore */
    }
    const quick = state.bootMode === 'never' || (state.bootMode === 'session' && seen) || matchMedia('(prefers-reduced-motion: reduce)').matches;
    let skipped = quick;
    const skip = () => (skipped = true);
    bootEl.addEventListener('click', skip);
    window.addEventListener('keydown', skip, { once: true });
    const wait = (ms) => new Promise((r) => setTimeout(r, skipped ? 0 : ms));
    const line = (text, cls) => logEl.append(h('div', { class: cls, text }));
    line('> INITIALISIERE TOKEN-MONITOR …');
    bar.style.width = '15%';
    await wait(380);
    line('> VERBINDE MIT LOKALEM SERVER (127.0.0.1) …');
    bar.style.width = '35%';
    const data = await load();
    await wait(300);
    if (data) {
      line(`  ${fmt(data.files)} LOG-DATEIEN GEFUNDEN`, 'ok');
      bar.style.width = '60%';
      await wait(260);
      line(`  ${fmt(data.events.length)} NACHRICHTEN · ${fmt(data.sessions.length)} CHATS · ${fmt(data.models.length)} MODELLE`, 'ok');
      bar.style.width = '80%';
      await wait(260);
      line(`  DUBLETTEN ENTFERNT · 5-STD-BLÖCKE BERECHNET (${fmt(data.blocks.length)})`, 'ok');
      await wait(300);
      line('> SYSTEM ONLINE', 'hi');
    } else line('  SERVER NICHT ERREICHBAR', 'err');
    bar.style.width = '100%';
    blip(523, 0.1, 0.05);
    await wait(420);
    bootEl.classList.add('done');
    document.body.classList.remove('booting');
    $('#app').classList.add('reveal');
    bootEl.removeEventListener('click', skip);
  }

  // ---------- Wiring ----------
  function addOpenButtons() {
    const map = [
      ['#blockPanel', '#/bloecke', '5-Std-Blöcke öffnen'],
      ['#logPanel', '#/chats', 'Chats öffnen'],
      ['#weekPanel', '#/verlauf', 'Verlauf öffnen'],
      ['#pulsePanel', '#/verlauf', 'Verlauf öffnen'],
      ['#dailyChart', '#/verlauf', 'Verlauf öffnen'],
      ['#blocksList', '#/bloecke', '5-Std-Blöcke öffnen'],
      ['#heatmap', '#/verlauf', 'Verlauf öffnen'],
      ['#models', '#/projekte', 'Projekte & Modelle öffnen'],
      ['#projects', '#/projekte', 'Projekte & Modelle öffnen'],
      ['#sessionsTable', '#/chats', 'Alle Chats öffnen'],
      ['#limitsList', '#/bloecke', '5-Std-Blöcke öffnen'],
      ['#costPanel', '#/chats', 'Chats mit Kosten öffnen'],
      ['#recordPanel', '#/verlauf', 'Verlauf öffnen'],
    ];
    for (const [sel, hash, label] of map) {
      const el = $(sel);
      const panelEl = el && (el.matches('.panel') ? el : el.closest('.panel'));
      const head = panelEl && panelEl.querySelector('.panel-head');
      if (!head || head.querySelector('.open-btn')) continue;
      head.append(h('button', { type: 'button', class: 'open-btn', title: label, 'aria-label': label, onclick: () => go(hash) }, icon(ICON_OPEN)));
    }
    $('#log').classList.add('scroll-y');
    $('#sessionsTable').closest('.table-wrap').classList.add('scroll-y');
  }

  function init() {
    addOpenButtons();
    renderNav();
    $('#refreshBtn').addEventListener('click', () => load());
    $('#liveBtn').addEventListener('click', () => setLive(!state.live));
    $('#briefBtn').addEventListener('click', startBriefing);
    const soundBtn = $('#soundBtn');
    soundBtn.setAttribute('aria-pressed', String(state.sound));
    soundBtn.addEventListener('click', () => {
      state.sound = !state.sound;
      store.set('sound', state.sound);
      soundBtn.setAttribute('aria-pressed', String(state.sound));
      blip(988, 0.06, 0.05);
    });
    $('#sessionSearch').addEventListener('input', (e) => {
      state.search = e.target.value;
      render();
    });
    $('#moreSessions').addEventListener('click', () => go('#/chats'));
    window.addEventListener('hashchange', () => renderPage());
    window.addEventListener('keydown', (e) => {
      const tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || e.ctrlKey || e.metaKey || e.altKey || document.body.classList.contains('booting')) return;
      if (e.key === 'b' || e.key === 'B') startBriefing();
      else if (e.key === 'r' || e.key === 'R') load();
      else if (e.key === 'p' || e.key === 'P') setLive(!state.live);
      else if (e.key === 'v' || e.key === 'V') setView(VIEWS[(VIEWS.findIndex(([k]) => k === state.view) + 1) % VIEWS.length][0]);
      else if (/^[1-6]$/.test(e.key)) go(PAGES[Number(e.key) - 1].hash);
      else if (e.key === 'Escape' && currentRoute().page !== 'overview') history.back();
    });
    let resizeTimer = 0;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(render, 180);
    });
    const tick = () => {
      const now = Date.now();
      $('#clock').textContent = fmtTime(now, true);
      if (state.data) {
        renderReactor(now);
        checkNotifications(now);
      }
    };
    tick();
    setInterval(tick, 1000);
    schedule();
    document.addEventListener('visibilitychange', () => {
      if (state.live && document.visibilityState === 'visible' && Date.now() - state.loadedAt > 5000) load();
    });
    if ('speechSynthesis' in window) speechSynthesis.getVoices();
    boot();
  }

  init();
})();
