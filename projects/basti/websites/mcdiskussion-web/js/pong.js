// ---------------------------------------------------------------------------
// pong.js — "Paddle Force"-style game.
//
// One <canvas>. Vanilla JS. No image/audio assets (space theme is procedural,
// sound is synthesized with the Web Audio API). Modes: PvP / vs CPU / CPU-vs-CPU
// (demo). Territory-capture rounds, best-of N match. Six power-ups. Particles,
// ball trail, screen shake, field tilt. Keyboard + gamepad + touch. i18n + a11y +
// prefers-reduced-motion aware.
//
// Public: initPong(). Lifecycle via `sectionchange`, `visibilitychange`,
// `resize`, `languagechange`; dispatches `gamestart` for analytics.
// ---------------------------------------------------------------------------

import { t } from './i18n.js';

const isTouch =
  window.matchMedia('(hover: none), (pointer: coarse)').matches || 'ontouchstart' in window;

// Logical field (CSS scales the canvas). 960x600 == 8:5 aspect.
const W = 960;
const H = 600;

// --- tunables --------------------------------------------------------------
const CFG = {
  paddleW: 16,
  paddleH: 104,
  moveSpeed: 430, // px/s
  rotSpeed: 2.6, // rad/s
  maxAngle: 1.0, // rad
  ballR: 10,
  ballSpeed: 360,
  ballSpeedMax: 760,
  wallInset: 56, // distance of a paddle's home from its goal wall
  divStep: 70, // how far a goal shifts the boundary
  divMin: 70, // P2 captures when divX <= this
  divMax: W - 70, // P1 captures when divX >= this
  countdown: 1.6, // s before a round
  roundover: 1.7, // s pause after a capture
  puckEvery: 6.5, // s between power-up spawns
  effectDur: 7, // s default effect duration
};

const COLORS = {
  p1: '#8b5cf6',
  p1soft: 'rgba(139,92,246,0.16)',
  p1glow: '#a78bfa',
  p2: '#34d399',
  p2soft: 'rgba(52,211,153,0.16)',
  p2glow: '#6ee7b7',
  ball: '#ffffff',
  puck: '#fbbf24',
};

const POWERUPS = ['grow', 'ghost', 'spin', 'bones', 'sticky', 'mines'];
const PU_EMOJI = { grow: '💪', ghost: '👻', spin: '🌀', bones: '🦴', sticky: '🍯', mines: '💣' };

export function initPong() {
  const wrap = document.querySelector('[data-pong]');
  const canvas = document.querySelector('[data-pong-canvas]');
  if (!wrap || !canvas) return;
  const ctx = canvas.getContext('2d');

  // --- DOM hooks (menu overlay) ---
  const menuEl = wrap.querySelector('[data-pong-menu]');
  const titleEl = wrap.querySelector('[data-pong-title]');
  const settingsEl = wrap.querySelector('[data-pong-settings]');
  const diffRow = wrap.querySelector('[data-pong-diffrow]');
  const hintEl = wrap.querySelector('[data-pong-hint]');
  const liveEl = wrap.querySelector('[data-pong-live]');
  const startBtn = wrap.querySelector('[data-pong-start]');
  const resumeBtn = wrap.querySelector('[data-pong-resume]');
  const rematchBtn = wrap.querySelector('[data-pong-rematch]');
  const toMenuBtn = wrap.querySelector('[data-pong-tomenu]');
  const muteBtn = wrap.querySelector('[data-pong-mute]');
  const touchControls = wrap.querySelector('[data-touch-controls]');

  const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => reduceMQ.matches;

  // --- state ---
  let phase = 'menu'; // menu | countdown | playing | roundover | matchover | paused
  const settings = { mode: 'cpu', difficulty: 'medium', bestOf: 5, powerups: true };

  let p1, p2, ball, divX, divTarget, roundNum;
  let pucks = [];
  let mines = [];
  let helpers = [];
  let particles = [];
  let trail = [];
  let popups = [];
  let shake = { t: 0, mag: 0 };
  let tilt = 0;
  let countdownT = 0;
  let roundoverT = 0;
  let puckTimer = CFG.puckEvery;

  const keys = new Set();
  let rafId = 0;
  let lastT = 0;
  let sectionActive = false;
  let attract = false; // true while the CPU-vs-CPU demo runs behind the menu

  // --- audio ---
  let audioCtx = null;
  let muted = false;
  try {
    muted = localStorage.getItem('pongMuted') === '1';
  } catch {}
  function ensureAudio() {
    if (!audioCtx && window.AudioContext) audioCtx = new AudioContext();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }
  function beep(freq, dur = 0.08, type = 'square', gain = 0.05) {
    if (muted || !audioCtx) return;
    const t0 = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + dur);
  }
  const sfx = {
    hit: () => beep(520, 0.06, 'square', 0.05),
    wall: () => beep(300, 0.05, 'sine', 0.04),
    goal: () => {
      beep(440, 0.12, 'sawtooth', 0.05);
      setTimeout(() => beep(330, 0.14, 'sawtooth', 0.05), 60);
    },
    capture: () => {
      [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.12, 'triangle', 0.06), i * 70));
    },
    power: () => {
      beep(660, 0.08, 'square', 0.06);
      setTimeout(() => beep(990, 0.1, 'square', 0.06), 70);
    },
    explode: () => beep(90, 0.3, 'sawtooth', 0.09),
    win: () => {
      [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => beep(f, 0.16, 'triangle', 0.07), i * 100));
    },
  };
  function setMuted(v) {
    muted = v;
    try {
      localStorage.setItem('pongMuted', v ? '1' : '0');
    } catch {}
    updateMuteBtn();
  }
  function updateMuteBtn() {
    if (!muteBtn) return;
    muteBtn.textContent = muted ? '🔇' : '🔊';
    muteBtn.setAttribute('aria-pressed', String(muted));
    muteBtn.setAttribute('aria-label', t(muted ? 'pgUnmute' : 'pgMute'));
  }

  // --- canvas sizing ---
  function fitCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // --- starfield (cached) ---
  const stars = [];
  for (let i = 0; i < 90; i++) {
    stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.6 + 0.3, a: Math.random() * 0.6 + 0.2 });
  }

  // =========================================================================
  // entities
  // =========================================================================
  function newPaddle(side) {
    // side: -1 = left/P1, +1 = right/P2
    const homeX = side < 0 ? CFG.wallInset : W - CFG.wallInset;
    return {
      side,
      x: homeX,
      homeX,
      y: H / 2,
      angle: 0,
      score: 0, // round points
      isAI: false,
      keymap: null,
      effects: {}, // effectName -> expiry timestamp (s)
      aiReact: 0,
      aiTargetY: H / 2,
    };
  }

  function paddleH(p) {
    return CFG.paddleH * (hasEffect(p, 'grow') ? 1.7 : 1);
  }
  function hasEffect(p, name) {
    return (p.effects[name] || 0) > now();
  }
  function now() {
    return performance.now() / 1000;
  }

  function resetBall(dir) {
    const a = (Math.random() - 0.5) * 0.5;
    ball = {
      x: W / 2,
      y: H / 2,
      vx: Math.cos(a) * CFG.ballSpeed * dir,
      vy: Math.sin(a) * CFG.ballSpeed,
      r: CFG.ballR,
      speed: CFG.ballSpeed,
      spin: 0,
      lastHit: null,
    };
    trail = [];
  }

  function configurePlayers() {
    p1 = newPaddle(-1);
    p2 = newPaddle(1);
    p1.keymap = { up: 'w', down: 's', left: 'a', right: 'd', rotL: 'c', rotR: 'v' };
    p2.keymap = { up: 'arrowup', down: 'arrowdown', left: 'arrowleft', right: 'arrowright', rotL: ',', rotR: '.' };
    p1.gamepadIndex = 0;
    p2.gamepadIndex = 1;
    if (settings.mode === 'cpu') {
      p2.isAI = true;
    } else if (settings.mode === 'demo') {
      p1.isAI = true;
      p2.isAI = true;
    }
  }

  // =========================================================================
  // match / round flow
  // =========================================================================
  function roundsToWin() {
    return Math.ceil(settings.bestOf / 2);
  }

  function startMatch() {
    configurePlayers();
    p1.score = 0;
    p2.score = 0;
    roundNum = 1;
    beginRound();
    dispatchStart();
  }

  function beginRound() {
    divX = W / 2;
    divTarget = W / 2;
    pucks = [];
    mines = [];
    helpers = [];
    particles = [];
    popups = [];
    p1.effects = {};
    p2.effects = {};
    p1.x = p1.homeX;
    p2.x = p2.homeX;
    p1.y = p2.y = H / 2;
    p1.angle = p2.angle = 0;
    puckTimer = CFG.puckEvery;
    resetBall(Math.random() < 0.5 ? -1 : 1);
    phase = 'countdown';
    countdownT = settings.mode === 'demo' ? 0.6 : CFG.countdown;
  }

  function goal(scorer) {
    // scorer: p1 or p2. Shift boundary toward the conceding side.
    divTarget += scorer === p1 ? CFG.divStep : -CFG.divStep;
    divTarget = Math.max(CFG.divMin - 20, Math.min(CFG.divMax + 20, divTarget));
    sfx.goal();
    burst(ball.x, ball.y, scorer === p1 ? COLORS.p1glow : COLORS.p2glow, 22);
    addShake(6);
    // Capture?
    if (divTarget >= CFG.divMax) capture(p1);
    else if (divTarget <= CFG.divMin) capture(p2);
    else resetBall(scorer === p1 ? -1 : 1);
  }

  function capture(winner) {
    winner.score++;
    phase = 'roundover';
    roundoverT = CFG.roundover;
    divTarget = winner === p1 ? CFG.divMax + 60 : CFG.divMin - 60;
    sfx.capture();
    addShake(12);
    const name = nameOf(winner);
    popup(t('pgCapture').replace('{p}', name), W / 2, H / 2 - 30, winner === p1 ? COLORS.p1glow : COLORS.p2glow, 2);
    confetti(winner === p1 ? COLORS.p1glow : COLORS.p2glow);
    if (!attract) announce(`${name} — ${scoreText()}`);
  }

  function afterRoundover() {
    if (attract) {
      // Demo loops forever — reset the match if a side "won".
      if (p1.score >= roundsToWin() || p2.score >= roundsToWin()) {
        p1.score = 0;
        p2.score = 0;
      }
      roundNum++;
      beginRound();
      return;
    }
    if (p1.score >= roundsToWin() || p2.score >= roundsToWin()) {
      matchOver();
    } else {
      roundNum++;
      beginRound();
    }
  }

  function matchOver() {
    phase = 'matchover';
    sfx.win();
    const winner = p1.score > p2.score ? p1 : p2;
    announce(t('pgWin').replace('{p}', nameOf(winner)));
    showMenu('matchover');
  }

  // =========================================================================
  // input
  // =========================================================================
  function norm(key) {
    return key.length === 1 ? key.toLowerCase() : key.toLowerCase();
  }
  function onKeyDown(e) {
    if (!sectionActive) return;
    const k = norm(e.key);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (k === ' ' || k === 'p') {
      togglePause();
      return;
    }
    if (k === 'escape') {
      if (phase !== 'menu') showMenu('start');
      return;
    }
    if (k === 'm') {
      ensureAudio();
      setMuted(!muted);
      return;
    }
    keys.add(k);
  }
  function onKeyUp(e) {
    keys.delete(norm(e.key));
  }

  function bindTouchButton(btn) {
    const key = btn.dataset.key.toLowerCase();
    const down = (e) => {
      e.preventDefault();
      ensureAudio();
      keys.add(key);
    };
    const up = (e) => {
      e.preventDefault();
      keys.delete(key);
    };
    btn.addEventListener('touchstart', down, { passive: false });
    btn.addEventListener('touchend', up, { passive: false });
    btn.addEventListener('touchcancel', up, { passive: false });
    btn.addEventListener('mousedown', down);
    btn.addEventListener('mouseup', up);
    btn.addEventListener('mouseleave', up);
  }

  function gamepadVec(index) {
    if (!navigator.getGamepads) return null;
    const gp = navigator.getGamepads()[index];
    if (!gp) return null;
    const dz = (v) => (Math.abs(v) < 0.18 ? 0 : v);
    const mx = dz(gp.axes[0] || 0);
    const my = dz(gp.axes[1] || 0);
    const rotL = (gp.buttons[4] && gp.buttons[4].pressed) || (gp.buttons[2] && gp.buttons[2].pressed);
    const rotR = (gp.buttons[5] && gp.buttons[5].pressed) || (gp.buttons[1] && gp.buttons[1].pressed);
    return { mx, my, rotL, rotR };
  }

  // =========================================================================
  // paddle control
  // =========================================================================
  function clampPaddle(p) {
    const hh = paddleH(p) / 2;
    p.y = Math.max(hh + 8, Math.min(H - hh - 8, p.y));
    const ghost = hasEffect(p, 'ghost');
    if (p.side < 0) {
      const maxX = ghost ? W - 40 : Math.min(divX - 30, W * 0.5);
      p.x = Math.max(40, Math.min(maxX, p.x));
    } else {
      const minX = ghost ? 40 : Math.max(divX + 30, W * 0.5);
      p.x = Math.max(minX, Math.min(W - 40, p.x));
    }
    p.angle = Math.max(-CFG.maxAngle, Math.min(CFG.maxAngle, p.angle));
  }

  function controlHuman(p, dt) {
    const m = p.keymap;
    let mx = 0;
    let my = 0;
    let rot = 0;
    if (keys.has(m.up)) my -= 1;
    if (keys.has(m.down)) my += 1;
    if (keys.has(m.left)) mx -= 1;
    if (keys.has(m.right)) mx += 1;
    if (keys.has(m.rotL)) rot -= 1;
    if (keys.has(m.rotR)) rot += 1;
    const gp = gamepadVec(p.gamepadIndex);
    if (gp) {
      mx += gp.mx;
      my += gp.my;
      if (gp.rotL) rot -= 1;
      if (gp.rotR) rot += 1;
    }
    p.x += mx * CFG.moveSpeed * dt;
    p.y += my * CFG.moveSpeed * dt;
    p.angle += rot * CFG.rotSpeed * dt;
    clampPaddle(p);
  }

  function controlAI(p, dt) {
    const diff = settings.difficulty;
    const cfg =
      diff === 'easy'
        ? { react: 0.28, err: 70, speed: 0.62, rot: 0.4 }
        : diff === 'hard'
        ? { react: 0.05, err: 14, speed: 1.0, rot: 0.9 }
        : { react: 0.14, err: 38, speed: 0.82, rot: 0.65 };

    // Periodically refresh the target (reaction delay).
    p.aiReact -= dt;
    const movingToward = (p.side < 0 && ball.vx < 0) || (p.side > 0 && ball.vx > 0);
    if (p.aiReact <= 0) {
      p.aiReact = cfg.react;
      p.aiTargetY = movingToward ? predictBallY(p) + (Math.random() * 2 - 1) * cfg.err : H / 2;
    }
    const dy = p.aiTargetY - p.y;
    if (Math.abs(dy) > 6) p.y += Math.sign(dy) * CFG.moveSpeed * cfg.speed * dt;

    // Use rotation to angle returns toward the centre when the ball is close.
    if (movingToward && Math.abs(ball.x - p.x) < 220) {
      const want = (ball.y < p.y ? -1 : 1) * (p.side < 0 ? 1 : -1) * 0.5;
      p.angle += Math.sign(want - p.angle) * CFG.rotSpeed * cfg.rot * dt;
    } else {
      p.angle += Math.sign(0 - p.angle) * CFG.rotSpeed * 0.5 * dt;
    }
    clampPaddle(p);
  }

  function predictBallY(p) {
    let x = ball.x;
    let y = ball.y;
    let vx = ball.vx;
    let vy = ball.vy;
    let guard = 0;
    while (((p.side < 0 && vx < 0 && x > p.x) || (p.side > 0 && vx > 0 && x < p.x)) && guard++ < 200) {
      x += vx * 0.016;
      y += vy * 0.016;
      if (y < ball.r) {
        y = ball.r;
        vy = Math.abs(vy);
      } else if (y > H - ball.r) {
        y = H - ball.r;
        vy = -Math.abs(vy);
      }
    }
    return y;
  }

  // =========================================================================
  // physics
  // =========================================================================
  function reflectOffPaddle(p) {
    const hw = CFG.paddleW / 2;
    const hh = paddleH(p) / 2;
    const cos = Math.cos(-p.angle);
    const sin = Math.sin(-p.angle);
    const dx = ball.x - p.x;
    const dy = ball.y - p.y;
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;
    const cxp = Math.max(-hw, Math.min(hw, lx));
    const cyp = Math.max(-hh, Math.min(hh, ly));
    let nx = lx - cxp;
    let ny = ly - cyp;
    let d = Math.hypot(nx, ny);
    if (d > ball.r) return false;
    if (d === 0) {
      nx = lx < 0 ? -1 : 1;
      ny = 0;
      d = 1;
    } else {
      nx /= d;
      ny /= d;
    }
    ny += (ly / hh) * 0.6;
    const nl = Math.hypot(nx, ny) || 1;
    nx /= nl;
    ny /= nl;
    const wc = Math.cos(p.angle);
    const ws = Math.sin(p.angle);
    const wnx = nx * wc - ny * ws;
    const wny = nx * ws + ny * wc;
    const dot = ball.vx * wnx + ball.vy * wny;
    ball.vx -= 2 * dot * wnx;
    ball.vy -= 2 * dot * wny;
    ball.speed = Math.min(CFG.ballSpeedMax, ball.speed * 1.05);
    const vlen = Math.hypot(ball.vx, ball.vy) || 1;
    ball.vx = (ball.vx / vlen) * ball.speed;
    ball.vy = (ball.vy / vlen) * ball.speed;
    const push = ball.r - d + 0.5;
    ball.x += wnx * push;
    ball.y += wny * push;
    ball.lastHit = p;
    if (hasEffect(p, 'spin')) ball.spin = (p.side < 0 ? 1 : -1) * 220;
    sfx.hit();
    burst(ball.x, ball.y, p.side < 0 ? COLORS.p1glow : COLORS.p2glow, 8);
    addShake(3);
    return true;
  }

  function circleHit(ent) {
    const dx = ball.x - ent.x;
    const dy = ball.y - ent.y;
    const dist = Math.hypot(dx, dy);
    const rad = ball.r + ent.r;
    if (dist > rad || dist === 0) return false;
    const nx = dx / dist;
    const ny = dy / dist;
    // push the puck/mine with some of the ball's momentum
    ent.vx += ball.vx * 0.7 + nx * 40;
    ent.vy += ball.vy * 0.7 + ny * 40;
    // bounce ball a little
    const dot = ball.vx * nx + ball.vy * ny;
    ball.vx -= 1.2 * dot * nx;
    ball.vy -= 1.2 * dot * ny;
    const vlen = Math.hypot(ball.vx, ball.vy) || 1;
    ball.vx = (ball.vx / vlen) * ball.speed;
    ball.vy = (ball.vy / vlen) * ball.speed;
    ball.x = ent.x + nx * (rad + 0.5);
    ball.y = ent.y + ny * (rad + 0.5);
    return true;
  }

  function stepEntity(ent, dt) {
    ent.vx *= 0.99;
    ent.vy *= 0.99;
    ent.x += ent.vx * dt;
    ent.y += ent.vy * dt;
    if (ent.y < ent.r) {
      ent.y = ent.r;
      ent.vy = Math.abs(ent.vy);
    } else if (ent.y > H - ent.r) {
      ent.y = H - ent.r;
      ent.vy = -Math.abs(ent.vy);
    }
  }

  function update(dt) {
    // ease boundary toward its target
    divX += (divTarget - divX) * Math.min(1, dt * 8);

    if (phase === 'countdown') {
      countdownT -= dt;
      if (countdownT <= 0) phase = 'playing';
      return;
    }
    if (phase === 'roundover') {
      roundoverT -= dt;
      stepParticles(dt);
      if (roundoverT <= 0) afterRoundover();
      return;
    }
    if (phase !== 'playing') {
      stepParticles(dt);
      return;
    }

    // paddles
    [p1, p2].forEach((p) => (p.isAI ? controlAI(p, dt) : controlHuman(p, dt)));
    helpers.forEach((h) => {
      h.y = h.owner.y + h.offset;
      h.x = h.owner.x;
      h.angle = h.owner.angle;
    });

    // ball
    const sticky = hasEffect(p1, 'sticky') || hasEffect(p2, 'sticky');
    const slow = sticky ? 0.6 : 1;
    if (ball.spin) {
      ball.vy += ball.spin * dt * 0.5;
      ball.spin *= 0.985;
    }
    ball.x += ball.vx * dt * slow;
    ball.y += ball.vy * dt * slow;
    if (ball.y < ball.r) {
      ball.y = ball.r;
      ball.vy = Math.abs(ball.vy);
      sfx.wall();
    } else if (ball.y > H - ball.r) {
      ball.y = H - ball.r;
      ball.vy = -Math.abs(ball.vy);
      sfx.wall();
    }
    trail.push({ x: ball.x, y: ball.y });
    if (trail.length > 14) trail.shift();

    reflectOffPaddle(p1);
    reflectOffPaddle(p2);
    helpers.forEach((h) => reflectOffPaddle(h));

    // power-up pucks
    if (settings.powerups) {
      puckTimer -= dt;
      if (puckTimer <= 0 && pucks.length < 2) {
        spawnPuck();
        puckTimer = CFG.puckEvery;
      }
    }
    pucks.forEach((pk) => {
      stepEntity(pk, dt);
      circleHit(pk);
    });
    pucks = pucks.filter((pk) => {
      if (pk.x < -pk.r) {
        activate(p2, pk.type, pk);
        return false;
      }
      if (pk.x > W + pk.r) {
        activate(p1, pk.type, pk);
        return false;
      }
      return true;
    });
    mines.forEach((mn) => {
      stepEntity(mn, dt);
      circleHit(mn);
    });
    mines = mines.filter((mn) => {
      if (mn.x < -mn.r) {
        explode(mn, p2);
        return false;
      }
      if (mn.x > W + mn.r) {
        explode(mn, p1);
        return false;
      }
      return true;
    });

    // goals
    if (ball.x < -ball.r) goal(p2);
    else if (ball.x > W + ball.r) goal(p1);

    stepParticles(dt);
    if (shake.t > 0) shake.t -= dt;
    // field tilt while spin active
    const wantTilt = ball.spin ? 0.05 * Math.sign(ball.spin) : 0;
    tilt += (wantTilt - tilt) * Math.min(1, dt * 4);
  }

  // =========================================================================
  // power-ups
  // =========================================================================
  function enabledTypes() {
    return POWERUPS; // all six; menu only toggles the whole system on/off
  }
  function spawnPuck() {
    const type = enabledTypes()[Math.floor(Math.random() * enabledTypes().length)];
    pucks.push({
      type,
      x: W / 2 + (Math.random() * 2 - 1) * 60,
      y: 80 + Math.random() * (H - 160),
      vx: (Math.random() * 2 - 1) * 30,
      vy: (Math.random() * 2 - 1) * 30,
      r: 18,
      emoji: PU_EMOJI[type],
    });
  }

  function activate(player, type, pk) {
    sfx.power();
    burst(pk.x, pk.y, COLORS.puck, 18);
    addShake(5);
    popup(`${PU_EMOJI[type]} ${t('pu_' + type)}`, player.side < 0 ? 150 : W - 150, 70, COLORS.puck, 1.4);
    if (type === 'mines') {
      // spawn a mine on the field for the activator to knock into the enemy goal
      mines.push({
        owner: player,
        x: player.side < 0 ? W * 0.4 : W * 0.6,
        y: 100 + Math.random() * (H - 200),
        vx: 0,
        vy: 0,
        r: 16,
      });
      return;
    }
    if (type === 'bones') {
      spawnHelpers(player);
    }
    // timed effects
    player.effects[type] = now() + CFG.effectDur;
    if (type === 'spin') ball.spin = (player.side < 0 ? 1 : -1) * 220;
  }

  function spawnHelpers(player) {
    const offs = [-150, 150];
    offs.forEach((o) => helpers.push({ owner: player, offset: o, x: player.x, y: player.y, angle: 0, side: player.side, effects: {} }));
    // helpers expire with the bones effect
    setTimeout(() => {
      helpers = helpers.filter((h) => h.owner !== player);
    }, CFG.effectDur * 1000);
  }

  function explode(mn, by) {
    sfx.explode();
    burst(mn.x, mn.y, '#ff7043', 40);
    addShake(16);
    popup('💥', mn.x, mn.y, '#ff7043', 1);
    // explosion shoves the boundary toward the conceding side (bonus capture)
    divTarget += by === p1 ? CFG.divStep : -CFG.divStep;
    if (divTarget >= CFG.divMax) capture(p1);
    else if (divTarget <= CFG.divMin) capture(p2);
  }

  // =========================================================================
  // fx
  // =========================================================================
  function addShake(mag) {
    if (reduced()) return;
    shake = { t: 0.25, mag };
  }
  function burst(x, y, color, n) {
    if (reduced()) {
      n = Math.min(n, 4);
    }
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * 220 + 40;
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.6, max: 0.6, color, size: Math.random() * 3 + 1.5 });
    }
  }
  function confetti(color) {
    if (reduced()) return;
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * W,
        y: -10,
        vx: (Math.random() * 2 - 1) * 60,
        vy: Math.random() * 160 + 60,
        life: 1.6,
        max: 1.6,
        color: i % 2 ? color : '#fff',
        size: Math.random() * 4 + 2,
      });
    }
  }
  function stepParticles(dt) {
    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 120 * dt;
      p.life -= dt;
    }
    particles = particles.filter((p) => p.life > 0);
    for (const pp of popups) pp.t -= dt;
    popups = popups.filter((pp) => pp.t > 0);
  }
  function popup(text, x, y, color, dur) {
    popups.push({ text, x, y, color, t: dur, max: dur });
  }

  // =========================================================================
  // render
  // =========================================================================
  function draw() {
    ctx.save();
    if (shake.t > 0 && !reduced()) {
      const m = shake.mag * (shake.t / 0.25);
      ctx.translate((Math.random() * 2 - 1) * m, (Math.random() * 2 - 1) * m);
    }
    if (tilt && !reduced()) {
      ctx.translate(W / 2, H / 2);
      ctx.rotate(tilt);
      ctx.translate(-W / 2, -H / 2);
    }

    // background space
    ctx.fillStyle = '#070711';
    ctx.fillRect(-40, -40, W + 80, H + 80);
    // planet
    const pg = ctx.createRadialGradient(W - 120, 110, 10, W - 120, 110, 150);
    pg.addColorStop(0, 'rgba(139,92,246,0.5)');
    pg.addColorStop(1, 'rgba(139,92,246,0)');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(W - 120, 110, 150, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.globalAlpha = s.a;
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
    ctx.globalAlpha = 1;

    // territories
    ctx.fillStyle = COLORS.p1soft;
    ctx.fillRect(0, 0, divX, H);
    ctx.fillStyle = COLORS.p2soft;
    ctx.fillRect(divX, 0, W - divX, H);
    // boundary line
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 14]);
    ctx.beginPath();
    ctx.moveTo(divX, 0);
    ctx.lineTo(divX, H);
    ctx.stroke();
    ctx.setLineDash([]);

    // territory bar (top)
    ctx.fillStyle = COLORS.p1;
    ctx.fillRect(0, 0, divX, 6);
    ctx.fillStyle = COLORS.p2;
    ctx.fillRect(divX, 0, W - divX, 6);

    // entities
    for (const pk of pucks) drawPuck(pk);
    for (const mn of mines) drawMine(mn);
    helpers.forEach((h) => drawPaddle(h, h.side < 0 ? COLORS.p1 : COLORS.p2, 0.7));
    drawPaddle(p1, COLORS.p1glow, 1);
    drawPaddle(p2, COLORS.p2glow, 1);

    // ball trail + ball
    for (let i = 0; i < trail.length; i++) {
      const tp = trail[i];
      ctx.globalAlpha = (i / trail.length) * 0.5;
      ctx.fillStyle = COLORS.ball;
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, ball.r * (i / trail.length), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (ball) {
      ctx.fillStyle = COLORS.ball;
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // particles
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    drawHUD();
    drawEffectIndicators();
    drawPopups();
    if (phase === 'countdown') drawCountdown();

    ctx.restore();
  }

  function drawPaddle(p, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    const hh = (p.h ? p.h : paddleH(p)) / 2;
    roundRect(ctx, -CFG.paddleW / 2, -hh, CFG.paddleW, hh * 2, 7);
    ctx.fill();
    ctx.restore();
  }

  function drawPuck(pk) {
    ctx.save();
    ctx.fillStyle = 'rgba(251,191,36,0.18)';
    ctx.strokeStyle = COLORS.puck;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pk.x, pk.y, pk.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.font = '20px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pk.emoji, pk.x, pk.y + 1);
    ctx.restore();
  }
  function drawMine(mn) {
    ctx.save();
    ctx.font = '26px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💣', mn.x, mn.y);
    ctx.restore();
  }

  function drawHUD() {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = '800 52px system-ui, sans-serif';
    ctx.fillText(String(p1.score), W / 2 - 70, 64);
    ctx.fillText(String(p2.score), W / 2 + 70, 64);
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(nameOf(p1), W / 2 - 70, 84);
    ctx.fillText(nameOf(p2), W / 2 + 70, 84);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText(`${t('pgBestOf')} ${settings.bestOf}`, W / 2, 30);
  }

  function drawEffectIndicators() {
    ctx.font = '22px system-ui';
    ctx.textAlign = 'left';
    let y = 120;
    for (const type of POWERUPS) {
      if (hasEffect(p1, type)) {
        ctx.fillText(PU_EMOJI[type], 14, y);
        y += 30;
      }
    }
    ctx.textAlign = 'right';
    y = 120;
    for (const type of POWERUPS) {
      if (hasEffect(p2, type)) {
        ctx.fillText(PU_EMOJI[type], W - 14, y);
        y += 30;
      }
    }
  }

  function drawPopups() {
    ctx.textAlign = 'center';
    for (const pp of popups) {
      const k = pp.t / pp.max;
      ctx.globalAlpha = Math.min(1, k * 2);
      ctx.fillStyle = pp.color;
      ctx.font = `800 ${28 + (1 - k) * 10}px system-ui, sans-serif`;
      ctx.fillText(pp.text, pp.x, pp.y - (1 - k) * 24);
    }
    ctx.globalAlpha = 1;
  }

  function drawCountdown() {
    const n = Math.ceil(countdownT);
    if (n <= 0) return;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '800 96px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(n), W / 2, H / 2);
    ctx.textBaseline = 'alphabetic';
  }

  function nameOf(p) {
    if (p === p1) return settings.mode === 'demo' ? t('cpuLabel') + ' 1' : t('p1Label');
    return p.isAI ? t('cpuLabel') : settings.mode === 'demo' ? t('cpuLabel') + ' 2' : t('p2Label');
  }
  function scoreText() {
    return `${p1.score} : ${p2.score}`;
  }

  // =========================================================================
  // loop
  // =========================================================================
  function frame(ts) {
    rafId = 0;
    const dt = Math.min(0.033, (ts - lastT) / 1000 || 0);
    lastT = ts;
    const active = phase === 'countdown' || phase === 'playing' || phase === 'roundover';
    if (active) update(dt);
    draw();
    if (sectionActive) loop();
  }
  function loop() {
    if (!rafId) rafId = requestAnimationFrame(frame);
  }
  function stopLoop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  // While the menu is open, run a CPU-vs-CPU attract match in the background.
  function startAttract() {
    attract = true;
    configurePlayers();
    p1.isAI = true;
    p2.isAI = true;
    p1.score = 0;
    p2.score = 0;
    roundNum = 1;
    beginRound();
  }

  // =========================================================================
  // menu controller
  // =========================================================================
  function showMenu(kind) {
    phase = kind === 'pause' ? 'paused' : kind === 'matchover' ? 'matchover' : 'menu';
    if (!menuEl) return;
    menuEl.hidden = false;
    menuEl.dataset.kind = kind;
    const isStart = kind === 'start';
    if (settingsEl) settingsEl.hidden = !isStart;
    if (startBtn) startBtn.hidden = !isStart;
    if (resumeBtn) resumeBtn.hidden = kind !== 'pause';
    if (rematchBtn) rematchBtn.hidden = kind !== 'matchover';
    if (toMenuBtn) toMenuBtn.hidden = isStart;
    if (titleEl) {
      titleEl.textContent =
        kind === 'pause'
          ? t('pgPaused')
          : kind === 'matchover'
          ? t('pgWin').replace('{p}', nameOf(p1.score > p2.score ? p1 : p2))
          : t('pgTitle');
    }
    if (hintEl) hintEl.textContent = isStart ? t('pgHintStart') : '';
    updateSegUI();
    if (isStart) startAttract();
  }
  function hideMenu() {
    if (menuEl) menuEl.hidden = true;
  }

  function togglePause() {
    if (attract || phase === 'menu' || phase === 'matchover') {
      doStart();
    } else if (phase === 'paused') {
      hideMenu();
      phase = 'playing';
      lastT = performance.now();
    } else if (phase === 'playing' || phase === 'countdown') {
      phase = 'paused';
      showMenu('pause');
    }
  }

  function doStart() {
    attract = false;
    ensureAudio();
    hideMenu();
    startMatch();
  }

  function updateSegUI() {
    wrap.querySelectorAll('[data-mode]').forEach((b) => b.classList.toggle('active', b.dataset.mode === settings.mode));
    wrap.querySelectorAll('[data-diff]').forEach((b) => b.classList.toggle('active', b.dataset.diff === settings.difficulty));
    wrap.querySelectorAll('[data-bestof]').forEach((b) => b.classList.toggle('active', +b.dataset.bestof === settings.bestOf));
    if (diffRow) diffRow.hidden = settings.mode !== 'cpu';
    const cb = wrap.querySelector('[data-powerups]');
    if (cb) cb.checked = settings.powerups;
    updateTouchVisibility();
  }

  function updateTouchVisibility() {
    if (!touchControls || !isTouch) return;
    const p2pad = touchControls.querySelector('[data-side="p2"]');
    const p1pad = touchControls.querySelector('[data-side="p1"]');
    if (p2pad) p2pad.style.display = settings.mode === 'cpu' || settings.mode === 'demo' ? 'none' : '';
    if (p1pad) p1pad.style.display = settings.mode === 'demo' ? 'none' : '';
  }

  function announce(msg) {
    if (liveEl) liveEl.textContent = msg;
  }
  function dispatchStart() {
    document.dispatchEvent(new CustomEvent('gamestart', { detail: { game: 'pong' } }));
  }

  // =========================================================================
  // wiring
  // =========================================================================
  fitCanvas();
  showMenu('start'); // starts the CPU-vs-CPU attract demo behind the menu

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('resize', () => {
    fitCanvas();
    draw();
  });

  startBtn?.addEventListener('click', doStart);
  rematchBtn?.addEventListener('click', doStart);
  resumeBtn?.addEventListener('click', () => togglePause());
  toMenuBtn?.addEventListener('click', () => showMenu('start'));
  muteBtn?.addEventListener('click', () => {
    ensureAudio();
    setMuted(!muted);
  });

  wrap.querySelectorAll('[data-mode]').forEach((b) =>
    b.addEventListener('click', () => {
      settings.mode = b.dataset.mode;
      updateSegUI();
      startAttract();
    })
  );
  wrap.querySelectorAll('[data-diff]').forEach((b) =>
    b.addEventListener('click', () => {
      settings.difficulty = b.dataset.diff;
      updateSegUI();
    })
  );
  wrap.querySelectorAll('[data-bestof]').forEach((b) =>
    b.addEventListener('click', () => {
      settings.bestOf = +b.dataset.bestof;
      updateSegUI();
    })
  );
  wrap.querySelector('[data-powerups]')?.addEventListener('change', (e) => {
    settings.powerups = e.target.checked;
  });

  document.addEventListener('sectionchange', (e) => setActive(e.detail.id === 'games'));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopLoop();
    else if (sectionActive) {
      lastT = performance.now();
      loop();
    }
  });
  document.addEventListener('languagechange', () => {
    updateMuteBtn();
    if (menuEl && !menuEl.hidden) showMenu(menuEl.dataset.kind || 'start');
    draw();
  });

  if (isTouch && touchControls) {
    touchControls.hidden = false;
    touchControls.querySelectorAll('button[data-key]').forEach(bindTouchButton);
  }

  updateMuteBtn();

  function setActive(active) {
    sectionActive = active;
    if (active) {
      fitCanvas();
      lastT = performance.now();
      loop();
    } else {
      stopLoop();
    }
  }

  if ((location.hash || '').slice(1) === 'games') setActive(true);
}

// ---------------------------------------------------------------------------
function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
