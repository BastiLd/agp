'use strict';

// Reaktor-Kern: 3D-Punktkugel, deren Oberfläche von einem sprachähnlichen Spektrum
// ausgebeult wird, dazu Waveform-Ring, Kernglühen und kreisende Partikel.
// API: orb.setState('idle' | 'active' | 'briefing' | 'offline'), orb.pulse(0..1), orb.voice(0..1)
(() => {
  const TAU = Math.PI * 2;
  const BANDS = 64;
  const LEVELS = 8;

  const COLORS = {
    idle: [103, 232, 249],
    active: [125, 240, 255],
    briefing: [165, 243, 252],
    offline: [248, 113, 113],
  };

  function fibonacciSphere(n) {
    const pts = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = golden * i;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      const lon = (Math.atan2(z, x) + TAU) % TAU;
      const lat = Math.asin(y);
      const eq = Math.cos(lat) ** 2;
      pts.push({ x, y, z, lon, lat, eq, band: Math.floor((lon / TAU) * BANDS) % BANDS, seed: Math.random() * TAU });
    }
    return pts;
  }

  class Orb {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.state = 'idle';
      this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.small = window.innerWidth < 720;
      this.pts = fibonacciSphere(this.small ? 520 : 860);
      this.bands = new Float32Array(BANDS);
      this.bandTargets = new Float32Array(BANDS);
      this.nextBandUpdate = 0;
      this.env = 0.1;
      this.envTarget = 0.1;
      this.nextSyllable = 0;
      this.burst = 0;
      this.voiceBoost = 0;
      this.rot = 0;
      this.t = 0;
      this.last = performance.now();
      this.color = COLORS.idle.slice();
      this.particles = Array.from({ length: this.small ? 30 : 48 }, () => ({
        a: Math.random() * TAU,
        r: 1.38 + Math.random() * 0.3,
        s: (0.12 + Math.random() * 0.3) * (Math.random() < 0.5 ? -1 : 1),
        tilt: (Math.random() - 0.5) * 0.9,
        size: 0.7 + Math.random() * 1.3,
      }));
      this.buckets = Array.from({ length: LEVELS }, () => []);
      this.resize();
      new ResizeObserver(() => this.resize()).observe(canvas);
      this.frame = this.frame.bind(this);
      requestAnimationFrame(this.frame);
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      this.w = Math.max(1, rect.width);
      this.h = Math.max(1, rect.height);
      this.canvas.width = Math.round(this.w * dpr);
      this.canvas.height = Math.round(this.h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    setState(s) {
      if (COLORS[s]) this.state = s;
    }

    pulse(strength) {
      this.burst = Math.min(1.4, this.burst + Math.max(0.15, strength));
    }

    voice(level) {
      this.voiceBoost = Math.max(this.voiceBoost, Math.min(1, level));
    }

    updateEnvelope(dt) {
      const s = this.state;
      if (s === 'active' || s === 'briefing') {
        // Speech-like syllables with short pauses.
        if (this.t >= this.nextSyllable) {
          const pause = Math.random() < (s === 'briefing' ? 0.1 : 0.2);
          this.envTarget = pause ? 0.06 : 0.35 + Math.random() * 0.65;
          this.nextSyllable = this.t + (pause ? 0.12 + Math.random() * 0.2 : 0.07 + Math.random() * 0.16);
        }
        if (s === 'briefing') this.envTarget = Math.max(this.envTarget * 0.7, this.voiceBoost);
      } else if (s === 'offline') {
        this.envTarget = 0.03;
      } else {
        this.envTarget = 0.1 + 0.07 * Math.sin(this.t * 1.25) + 0.03 * Math.sin(this.t * 3.1);
      }
      this.voiceBoost *= Math.exp(-dt * 5);
      const k = Math.min(1, dt * (this.envTarget > this.env ? 18 : 9));
      this.env += (this.envTarget - this.env) * k;
      this.burst *= Math.exp(-dt * 1.7);

      if (this.t >= this.nextBandUpdate) {
        this.nextBandUpdate = this.t + 0.045;
        const speaking = s === 'active' || s === 'briefing';
        for (let i = 0; i < BANDS; i++) {
          const f = i / BANDS;
          // Formant-like shape: energy mostly in the low-mid range, mirrored around the sphere.
          const mirror = f < 0.5 ? f * 2 : (1 - f) * 2;
          const shape = 0.25 + 0.75 * Math.exp(-((mirror - 0.35) ** 2) / 0.07);
          const jitter = speaking ? 0.35 + Math.random() * 0.65 : 0.8 + 0.2 * Math.sin(this.t * 2 + i * 0.4);
          this.bandTargets[i] = this.env * shape * jitter;
        }
      }
      for (let i = 0; i < BANDS; i++) this.bands[i] += (this.bandTargets[i] - this.bands[i]) * Math.min(1, dt * 16);

      const target = COLORS[s];
      for (let c = 0; c < 3; c++) this.color[c] += (target[c] - this.color[c]) * Math.min(1, dt * 3);
    }

    frame(now) {
      requestAnimationFrame(this.frame);
      if (document.hidden) {
        this.last = now;
        return;
      }
      let dt = Math.min(0.05, (now - this.last) / 1000);
      if (this.reduced) {
        if (now - this.last < 500) return;
        dt = 0.016;
      }
      this.last = now;
      this.t += dt;
      this.updateEnvelope(dt);
      this.rot += dt * (0.16 + this.env * 0.55 + this.burst * 0.6);
      this.draw();
    }

    draw() {
      const { ctx, w, h } = this;
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.2;
      const [cr, cg, cb] = this.color.map(Math.round);
      const env = this.env;
      const burst = this.burst;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';

      // Core glow
      const glowR = R * (1.05 + env * 0.35 + burst * 0.3);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      g.addColorStop(0, `rgba(${cr},${cg},${cb},${0.3 + env * 0.35 + burst * 0.3})`);
      g.addColorStop(0.45, `rgba(${cr},${cg},${cb},${0.1 + env * 0.12})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, glowR, 0, TAU);
      ctx.fill();

      // Sphere points
      const cosY = Math.cos(this.rot);
      const sinY = Math.sin(this.rot);
      const tilt = 0.36;
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);
      const bands = this.bands;
      const t = this.t;
      for (const b of this.buckets) b.length = 0;
      for (const p of this.pts) {
        const d = bands[p.band] * p.eq * 0.42 + 0.014 * Math.sin(4 * p.lon + t * 1.7 + p.seed) * Math.cos(3 * p.lat - t) + burst * 0.1 * p.eq;
        const r = 1 + d;
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.x * sinY + p.z * cosY;
        const y2 = p.y * cosT - z1 * sinT;
        const z2 = p.y * sinT + z1 * cosT;
        const persp = 1 / (1 - z2 * 0.22);
        const px = cx + x1 * r * R * persp;
        const py = cy - y2 * r * R * persp;
        const depth = (z2 + 1) / 2;
        const level = Math.min(LEVELS - 1, Math.floor((depth * 0.8 + Math.min(1, d * 3) * 0.2) * LEVELS));
        const size = 0.7 + depth * 1.5 + d * 2;
        this.buckets[level].push(px, py, size);
      }
      for (let l = 0; l < LEVELS; l++) {
        const arr = this.buckets[l];
        if (!arr.length) continue;
        const f = l / (LEVELS - 1);
        const white = Math.max(0, f - 0.6) * 1.6;
        ctx.fillStyle = `rgba(${Math.round(cr + (255 - cr) * white)},${Math.round(cg + (255 - cg) * white)},${Math.round(cb + (255 - cb) * white)},${0.08 + f ** 1.4 * 0.85})`;
        for (let i = 0; i < arr.length; i += 3) {
          const s = arr[i + 2];
          ctx.fillRect(arr[i] - s / 2, arr[i + 1] - s / 2, s, s);
        }
      }

      // Waveform rings
      const ringR = R * 1.3;
      const drawRing = (radius, scale, alpha, phase, width) => {
        ctx.beginPath();
        const n = 160;
        for (let i = 0; i <= n; i++) {
          const a = (i / n) * TAU - Math.PI / 2;
          const bi = Math.floor(((i + phase) % n) / n * BANDS);
          const mirrored = bands[bi < BANDS / 2 ? bi : BANDS - 1 - bi];
          const rr = radius + mirrored * R * scale + Math.sin(a * 6 + t * 2) * R * 0.006;
          const x = cx + Math.cos(a) * rr;
          const y = cy + Math.sin(a) * rr;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha})`;
        ctx.lineWidth = width;
        ctx.stroke();
      };
      ctx.shadowColor = `rgba(${cr},${cg},${cb},0.9)`;
      ctx.shadowBlur = 10 + env * 14;
      drawRing(ringR, 0.34, 0.55 + env * 0.4, 0, 1.5);
      ctx.shadowBlur = 0;
      drawRing(ringR * 1.07, 0.18, 0.22 + env * 0.2, 40, 1);
      drawRing(ringR * 0.94, -0.12, 0.18, 80, 1);

      // Orbiting particles
      for (const p of this.particles) {
        p.a += p.s * (1 + env * 1.8 + burst * 3) * 0.016;
        const x = Math.cos(p.a) * p.r * R;
        const z = Math.sin(p.a) * p.r * R;
        const y = z * p.tilt * 0.45;
        const depth = (Math.sin(p.a) + 1) / 2;
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${0.15 + depth * 0.6 + burst * 0.3})`;
        const s = p.size * (0.6 + depth * 0.8);
        ctx.fillRect(cx + x - s / 2, cy + y * 0.9 - z * 0.12 - s / 2, s, s);
      }
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  window.Orb = Orb;
})();
