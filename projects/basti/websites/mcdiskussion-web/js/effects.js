// ---------------------------------------------------------------------------
// effects.js — the "wow" layer of the homepage.
//
//  • Interactive dot grid     (background canvas; dots glow/flee near cursor)
//  • Comet cursor + sparks    (foreground canvas; same rAF loop as the grid)
//  • Glare sweep on tilt cards (silver band, CSS hover animation)
//  • Text shatter on click    (sig-heading letters explode & reassemble)
//  • Scroll-Reveal 2.0        (word-by-word, directions, count-up numbers)
//  • Magnetic lists           (items lift toward the cursor)
//  • Feature accordion        (hover previews, click pins, rotating chevron)
//
// Everything is gated behind prefers-reduced-motion; canvas/cursor effects are
// desktop-only. One shared rAF loop drives both canvases.
// ---------------------------------------------------------------------------

const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
const reduced = () => reduceMQ.matches;
const isTouch =
  window.matchMedia('(hover: none), (pointer: coarse)').matches || 'ontouchstart' in window;

export function initEffects() {
  initAccordion();
  initRevealPlus();
  if (isTouch) return; // pointer-driven effects below are desktop-only
  initHolo();
  initShatter();
  initMagneticLists();
  if (!reduced()) initCanvasFx(); // dot grid + comet cursor share one loop
}

// ===========================================================================
// Dot grid (background) + comet cursor & click sparks (foreground)
// ===========================================================================
function initCanvasFx() {
  const bg = document.createElement('canvas');
  bg.className = 'fx-grid';
  bg.setAttribute('aria-hidden', 'true');
  const fg = document.createElement('canvas');
  fg.className = 'fx-cursor';
  fg.setAttribute('aria-hidden', 'true');
  document.body.prepend(bg);
  document.body.appendChild(fg);
  const bctx = bg.getContext('2d');
  const fctx = fg.getContext('2d');

  const SPACING = 34;
  let dots = [];
  let W = 0, H = 0;

  function buildGrid() {
    W = window.innerWidth;
    H = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (const c of [bg, fg]) {
      c.width = W * dpr;
      c.height = H * dpr;
      c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    dots = [];
    for (let y = SPACING / 2; y < H; y += SPACING) {
      for (let x = SPACING / 2; x < W; x += SPACING) {
        dots.push({ hx: x, hy: y, x, y, vx: 0, vy: 0 });
      }
    }
  }
  buildGrid();
  window.addEventListener('resize', buildGrid);

  const mouse = { x: -9999, y: -9999 };
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }, { passive: true });

  // Comet trail + click sparks (pooled)
  const trail = [];
  const sparks = [];
  window.addEventListener('mousemove', (e) => {
    trail.push({ x: e.clientX, y: e.clientY, life: 0.4, max: 0.4 });
    if (trail.length > 28) trail.shift();
  }, { passive: true });
  window.addEventListener('click', (e) => {
    if (reduced()) return;
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * 160 + 40;
      sparks.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5, max: 0.5 });
    }
  });

  const accent = () =>
    getComputedStyle(document.documentElement).getPropertyValue('--accent-strong').trim() || '#f59e2c';

  let last = performance.now();
  const RADIUS = 150;
  function frame(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000);
    last = ts;
    if (!document.hidden && !reduced()) {
      // ---- background grid ----
      bctx.clearRect(0, 0, W, H);
      const ac = accent();
      for (const d of dots) {
        const dx = d.x - mouse.x;
        const dy = d.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < RADIUS && dist > 0.01) {
          const power = (1 - dist / RADIUS);
          d.vx += (dx / dist) * power * 600 * dt;
          d.vy += (dy / dist) * power * 600 * dt;
        }
        // spring home
        d.vx += (d.hx - d.x) * 8 * dt;
        d.vy += (d.hy - d.y) * 8 * dt;
        d.vx *= 0.86;
        d.vy *= 0.86;
        d.x += d.vx;
        d.y += d.vy;
        const near = Math.max(0, 1 - Math.hypot(d.x - mouse.x, d.y - mouse.y) / RADIUS);
        if (near > 0.02) {
          bctx.fillStyle = ac;
          bctx.globalAlpha = 0.18 + near * 0.55;
          bctx.fillRect(d.x - 1, d.y - 1, 2 + near * 1.5, 2 + near * 1.5);
        } else {
          // idle dots stay clearly visible everywhere the content leaves room
          bctx.fillStyle = '#ffffff';
          bctx.globalAlpha = 0.14;
          bctx.fillRect(d.x - 1, d.y - 1, 2, 2);
        }
      }
      bctx.globalAlpha = 1;

      // ---- foreground comet + sparks ----
      fctx.clearRect(0, 0, W, H);
      for (let i = 0; i < trail.length; i++) {
        const t = trail[i];
        t.life -= dt;
        const k = Math.max(0, t.life / t.max) * (i / trail.length);
        if (k <= 0) continue;
        fctx.globalAlpha = k * 0.35;
        fctx.fillStyle = ac;
        fctx.beginPath();
        fctx.arc(t.x, t.y, 1 + k * 4, 0, Math.PI * 2);
        fctx.fill();
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life -= dt;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 300 * dt;
        fctx.globalAlpha = s.life / s.max;
        fctx.fillStyle = ac;
        fctx.fillRect(s.x, s.y, 2.5, 2.5);
      }
      fctx.globalAlpha = 1;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ===========================================================================
// Glare on tilt cards — a silver band sweeps top-left → bottom-right on hover
// (the animation itself lives in CSS, see .holo in style.css)
// ===========================================================================
function initHolo() {
  document.querySelectorAll('.tilt').forEach((card) => card.classList.add('holo'));
}

// ===========================================================================
// Text shatter: click a sig-heading and the letters fly apart, then reassemble
// ===========================================================================
function initShatter() {
  document.addEventListener('click', (e) => {
    if (reduced()) return;
    const head = e.target.closest('.sig-heading');
    if (!head || head.dataset.shattering) return;
    head.dataset.shattering = '1';
    const chars = head.querySelectorAll('.char');
    chars.forEach((c) => {
      c.classList.add('shatter');
      const dx = (Math.random() - 0.5) * 160;
      const dy = (Math.random() - 0.8) * 140;
      const rot = (Math.random() - 0.5) * 240;
      c.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
      c.style.opacity = '0.15';
    });
    setTimeout(() => {
      chars.forEach((c) => {
        c.style.transform = '';
        c.style.opacity = '';
      });
      setTimeout(() => {
        chars.forEach((c) => c.classList.remove('shatter'));
        delete head.dataset.shattering;
      }, 650);
    }, 420);
  });
}

// ===========================================================================
// Scroll-Reveal 2.0 — words, directions, count-up numbers
// ===========================================================================
let revealIO = null;
function ensureRevealIO() {
  if (revealIO || !('IntersectionObserver' in window)) return revealIO;
  revealIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        revealIO.unobserve(el);
        el.classList.add('visible');
        if (el.dataset.count !== undefined) runCountUp(el);
      });
    },
    { threshold: 0.15 }
  );
  return revealIO;
}

/** Register an element for Scroll-Reveal 2.0 (also used by modsRender). */
export function observeReveal(el) {
  if (reduced() || !ensureRevealIO()) {
    el.classList.add('visible');
    if (el.dataset.count !== undefined) el.textContent = formatCount(+el.dataset.count || 0);
    return;
  }
  if (el.dataset.reveal === 'words' && !el.dataset.wordsSplit) {
    const words = (el.textContent || '').split(/\s+/).filter(Boolean);
    el.textContent = '';
    words.forEach((w, i) => {
      const span = document.createElement('span');
      span.className = 'rw';
      span.style.transitionDelay = `${Math.min(i * 45, 900)}ms`;
      span.textContent = w + ' ';
      el.appendChild(span);
    });
    el.dataset.wordsSplit = '1';
  }
  revealIO.observe(el);
}

function formatCount(n) {
  return n.toLocaleString();
}
function runCountUp(el) {
  const target = +el.dataset.count || 0;
  if (reduced()) { el.textContent = formatCount(target); return; }
  const dur = 1200;
  const t0 = performance.now();
  const tick = (ts) => {
    const k = Math.min(1, (ts - t0) / dur);
    const eased = 1 - Math.pow(1 - k, 3);
    el.textContent = formatCount(Math.round(target * eased));
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function initRevealPlus() {
  document.querySelectorAll('[data-reveal], [data-count]').forEach(observeReveal);
}

// ===========================================================================
// Magnetic lists — entries lift toward the cursor, markers light up
// ===========================================================================
function initMagneticLists() {
  document.querySelectorAll('[data-accordion]').forEach((list) => {
    const items = () => list.querySelectorAll('.acc-head');
    let raf = 0;
    let mx = 0, my = 0;
    const render = () => {
      raf = 0;
      if (reduced()) return;
      items().forEach((head) => {
        const r = head.getBoundingClientRect();
        const cy = r.top + r.height / 2;
        const dy = my - cy;
        const dx = mx - (r.left + r.width / 2);
        const dist = Math.abs(dy);
        if (dist < 90 && mx > r.left - 40 && mx < r.right + 40) {
          const power = 1 - dist / 90;
          head.style.transform = `translate(${Math.sign(dx) * -2 * power}px, ${-3 * power}px)`;
          head.classList.toggle('mag', power > 0.35);
        } else {
          head.style.transform = '';
          head.classList.remove('mag');
        }
      });
    };
    list.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      if (!raf) raf = requestAnimationFrame(render);
    });
    list.addEventListener('mouseleave', () => {
      items().forEach((h) => { h.style.transform = ''; h.classList.remove('mag'); });
    });
  });
}

// ===========================================================================
// Feature accordion — hover previews (desktop), click pins, chevron rotates
// ===========================================================================
function initAccordion() {
  document.querySelectorAll('[data-accordion] .acc-item').forEach((item) => {
    const head = item.querySelector('.acc-head');
    if (!head) return;
    const setOpen = (open) => {
      item.classList.toggle('open', open);
      head.setAttribute('aria-expanded', String(open));
    };
    head.addEventListener('click', () => {
      const pinned = item.classList.toggle('pinned');
      setOpen(pinned || item.matches(':hover'));
    });
    if (!isTouch) {
      item.addEventListener('mouseenter', () => setOpen(true));
      item.addEventListener('mouseleave', () => {
        if (!item.classList.contains('pinned')) setOpen(false);
      });
    }
  });
}
