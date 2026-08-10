// ---------------------------------------------------------------------------
// paddleforce.js — standalone full-screen territory-pong (Paddle Force-style).
//
// Original work: all graphics are drawn procedurally (canvas / emoji) — no
// third-party image, audio or code assets are used or copied. Mechanics
// (pong + territory capture + power-ups) are a fresh implementation.
//
// Features: per-side player type (HUMAN / CPU), realistic & beatable CPU that
// reacts with lag + error (no perfect prediction), best-of 3/5/7 rounds,
// 6 power-ups knocked into the enemy goal, particles / trail / shake / tilt,
// synthesized SFX + optional ambient music, gamepad + keyboard + touch.
// ---------------------------------------------------------------------------

const W = 1280;
const H = 720;

const CFG = {
  paddleW: 20,
  paddleH: 130,
  moveSpeed: 560,
  rotSpeed: 3.2, // rad/s while a rotate key is HELD (continuous 360°)
  rotHoldMs: 150, // press shorter than this = clean 90° snap instead
  rotEase: 16, // how quickly the visible angle eases to its target (crisp snaps)
  ballR: 13,
  ballSpeed: 440,
  ballSpeedMax: 980,
  wallInset: 70,
  divStep: 95,
  divMin: 90,
  divMax: W - 90,
  countdown: 1.4,
  roundover: 2.0,
  puckEvery: 6,
  effectDur: 7,
};

const COLORS = {
  // Left = orange, right = blue.
  p1: '#e07b10',
  p1soft: 'rgba(224,123,16,0.0)',
  p1fill: '#e07b10',
  p1glow: '#ffb04d',
  p2: '#2f6fe0',
  p2fill: '#2f6fe0',
  p2glow: '#74a8ff',
  ball: '#ffffff',
  puck: '#f5c542',
};

const POWERUPS = ['grow', 'ghost', 'spin', 'bones', 'sticky', 'mines'];
const PU_EMOJI = { grow: '⭐', ghost: '⬜', spin: '🌀', bones: '🦴', sticky: '🟡', mines: '🔴' };

// Fun callout words per event (homage to the arcade vibe, original strings).
const POP = {
  hit: ['WHAM!', 'BAP!', 'POW!', 'BONK!'],
  goal: ['NICE!', 'POW!', 'OOF!', 'YOINK!'],
  capture: ['NICE ROUND!', 'BOOM!', 'TERRITORY!'],
  ghost: ['SPOOOKY!'],
  grow: ['BIG PADDLE!', 'CHONK!'],
  spin: ['SWIRLY!', 'CURVE!'],
  sticky: ['STICKY!', 'GLOOP!'],
  bones: ['BONE ARMY!', 'RATTLE!'],
  mine: ['KA-BLAAAM!', 'BOOM!'],
  matchpoint: ['MATCH POINT!', 'FINISH IT!'],
};
const pick = (a) => a[(Math.random() * a.length) | 0];

export function initPaddleForce() {
  const canvas = document.querySelector('[data-pf-canvas]');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // DOM hooks
  const stage = document.querySelector('[data-pf-stage]');
  const startScreen = document.querySelector('[data-pf-start]');
  const panel = document.querySelector('[data-pf-panel]');
  const panelTitle = document.querySelector('[data-pf-panel-title]');
  const panelSub = document.querySelector('[data-pf-panel-sub]');
  const panelP1 = document.querySelector('[data-pf-total-p1]');
  const panelP2 = document.querySelector('[data-pf-total-p2]');
  const pauseTag = document.querySelector('[data-pf-pause]');
  const scoreP1 = document.querySelector('[data-pf-score-p1]');
  const scoreP2 = document.querySelector('[data-pf-score-p2]');
  const touch = document.querySelector('[data-pf-touch]');

  const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => reduceMQ.matches;
  const isTouch = window.matchMedia('(hover: none),(pointer: coarse)').matches || 'ontouchstart' in window;

  // settings
  const settings = {
    bestOf: 5,
    p1Type: 'human',
    p2Type: 'cpu',
    difficulty: 'medium',
    sound: true,
    music: false,
    powerups: new Set(POWERUPS),
  };

  // state
  let phase = 'start'; // start | countdown | playing | roundover | matchover | paused
  let p1, p2, ball, divX, divTarget, roundNum;
  let pucks = [], mines = [], helpers = [], particles = [], trail = [], popups = [];
  let shake = { t: 0, mag: 0 }, tilt = 0;
  let countdownT = 0, roundoverT = 0, puckTimer = CFG.puckEvery;
  const keys = new Set();
  let rafId = 0, lastT = 0;

  // audio
  let actx = null, musicGain = null, musicOsc = null;
  function ensureAudio() {
    if (!actx && window.AudioContext) actx = new AudioContext();
    if (actx && actx.state === 'suspended') actx.resume();
    updateMusic();
  }
  function beep(freq, dur = 0.08, type = 'square', gain = 0.05) {
    if (!settings.sound || !actx) return;
    const t0 = actx.currentTime;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(actx.destination); o.start(t0); o.stop(t0 + dur);
  }
  const sfx = {
    hit: () => beep(520, 0.05, 'square', 0.05),
    wall: () => beep(300, 0.04, 'sine', 0.04),
    goal: () => { beep(440, 0.1, 'sawtooth', 0.05); setTimeout(() => beep(320, 0.12, 'sawtooth', 0.05), 60); },
    capture: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.12, 'triangle', 0.06), i * 70)),
    power: () => { beep(660, 0.07, 'square', 0.06); setTimeout(() => beep(990, 0.09, 'square', 0.06), 70); },
    explode: () => beep(80, 0.3, 'sawtooth', 0.09),
    win: () => [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => beep(f, 0.16, 'triangle', 0.07), i * 100)),
  };
  function updateMusic() {
    if (!actx) return;
    if (settings.music && !musicOsc) {
      musicOsc = actx.createOscillator(); musicGain = actx.createGain();
      musicOsc.type = 'sine'; musicOsc.frequency.value = 70;
      musicGain.gain.value = 0.02;
      musicOsc.connect(musicGain).connect(actx.destination); musicOsc.start();
    } else if (!settings.music && musicOsc) {
      try { musicOsc.stop(); } catch {}
      musicOsc = null;
    }
  }

  function fit() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const stars = [];
  for (let i = 0; i < 120; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.8 + 0.3, a: Math.random() * 0.6 + 0.2 });

  const now = () => performance.now() / 1000;
  const hasEffect = (p, n) => (p.effects[n] || 0) > now();
  const paddleH = (p) => CFG.paddleH * (hasEffect(p, 'grow') ? 1.75 : 1);

  function newPaddle(side, type) {
    const homeX = side < 0 ? CFG.wallInset : W - CFG.wallInset;
    return { side, x: homeX, homeX, y: H / 2, vx: 0, vy: 0, angle: 0, targetAngle: 0, score: 0,
      isAI: type === 'cpu', effects: {}, reactT: 0, targetY: H / 2, targetX: homeX,
      chaseTarget: null, wantBoost: false, boosting: 0, boostDir: 1 };
  }
  function resetBall(dir) {
    const a = (Math.random() - 0.5) * 0.5;
    ball = { x: W / 2, y: H / 2, vx: Math.cos(a) * CFG.ballSpeed * dir, vy: Math.sin(a) * CFG.ballSpeed,
      r: CFG.ballR, speed: CFG.ballSpeed, spin: 0, lastHit: null };
    trail = [];
  }

  function configure() {
    p1 = newPaddle(-1, settings.p1Type);
    p2 = newPaddle(1, settings.p2Type);
    p1.keymap = { up: 'w', down: 's', left: 'a', right: 'd', rotL: 'c', rotR: 'v' };
    p2.keymap = { up: 'arrowup', down: 'arrowdown', left: 'arrowleft', right: 'arrowright', rotL: ',', rotR: '.' };
    p1.gp = 0; p2.gp = 1;
  }

  const roundsToWin = () => Math.ceil(settings.bestOf / 2);

  function startMatch() {
    configure(); p1.score = 0; p2.score = 0; roundNum = 1;
    beginRound();
  }
  function beginRound() {
    divX = divTarget = W / 2;
    pucks = []; mines = []; helpers = []; particles = []; popups = [];
    p1.effects = {}; p2.effects = {};
    [p1, p2].forEach((p) => {
      p.x = p.homeX; p.targetX = p.homeX; p.y = H / 2; p.vx = p.vy = 0;
      p.angle = p.targetAngle = 0; p.chaseTarget = null; p.boosting = 0;
    });
    puckTimer = CFG.puckEvery; resetBall(Math.random() < 0.5 ? -1 : 1);
    phase = 'countdown'; countdownT = CFG.countdown;
    updateScore();
  }
  function goal(scorer) {
    divTarget += scorer === p1 ? CFG.divStep : -CFG.divStep;
    divTarget = Math.max(CFG.divMin - 30, Math.min(CFG.divMax + 30, divTarget));
    sfx.goal();
    popup(pick(POP.goal), ball.x, ball.y, COLORS.puck, 1);
    burst(ball.x, ball.y, scorer === p1 ? COLORS.p1glow : COLORS.p2glow, 22); addShake(6);
    if (divTarget >= CFG.divMax) capture(p1);
    else if (divTarget <= CFG.divMin) capture(p2);
    else resetBall(scorer === p1 ? -1 : 1);
  }
  function capture(winner) {
    winner.score++;
    phase = 'roundover'; roundoverT = CFG.roundover;
    divTarget = winner === p1 ? CFG.divMax + 80 : CFG.divMin - 80;
    sfx.capture(); addShake(12);
    popup(pick(POP.capture), W / 2, H / 2 - 40, winner === p1 ? COLORS.p1glow : COLORS.p2glow, 2);
    confetti(winner === p1 ? COLORS.p1glow : COLORS.p2glow);
    updateScore();
  }
  function afterRoundover() {
    if (attract) {
      // demo loops forever behind the start screen
      if (p1.score >= roundsToWin() || p2.score >= roundsToWin()) { p1.score = 0; p2.score = 0; }
      roundNum++; beginRound(); return;
    }
    if (p1.score >= roundsToWin() || p2.score >= roundsToWin()) matchOver();
    else { roundNum++; beginRound(); }
  }
  function matchOver() {
    phase = 'matchover'; sfx.win();
    const winner = p1.score > p2.score ? p1 : p2;
    showPanel('MATCH OVER', `${nameOf(winner)} WINS!`);
  }

  // ---- input ----
  const norm = (k) => k.toLowerCase();
  const HALF_PI = Math.PI / 2;
  // Rotation keys: tap = 90° snap, hold (> rotHoldMs) = continuous 360° spin.
  const ROTKEYS = {
    c: { side: -1, dir: -1 }, v: { side: -1, dir: 1 },
    ',': { side: 1, dir: -1 }, '.': { side: 1, dir: 1 },
  };
  const rotState = {};
  function rotKeyDown(k) {
    if (!rotState[k]) rotState[k] = { downAt: performance.now(), held: false };
  }
  function rotKeyUp(k) {
    const st = rotState[k];
    delete rotState[k];
    if (!st || st.held) return; // a hold just stops; only taps snap
    const map = ROTKEYS[k];
    const p = map.side < 0 ? p1 : p2;
    if (!p || p.isAI) return;
    // Snap the target to the next clean 90° step in the tapped direction.
    p.targetAngle = Math.round(p.targetAngle / HALF_PI) * HALF_PI + map.dir * HALF_PI;
  }
  function onKeyDown(e) {
    const k = norm(e.key);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (k === ' ' || k === 'p') { togglePause(); return; }
    if (k === 'escape') { goHome(); return; }
    if (k === 'm') { ensureAudio(); settings.sound = !settings.sound; return; }
    if (ROTKEYS[k] && !keys.has(k)) rotKeyDown(k);
    keys.add(k);
  }
  function onKeyUp(e) {
    const k = norm(e.key);
    if (ROTKEYS[k]) rotKeyUp(k);
    keys.delete(k);
  }
  function bindTouch(btn) {
    const key = btn.dataset.key.toLowerCase();
    const d = (e) => {
      e.preventDefault(); ensureAudio();
      if (ROTKEYS[key] && !keys.has(key)) rotKeyDown(key);
      keys.add(key);
    };
    const u = (e) => {
      e.preventDefault();
      if (ROTKEYS[key]) rotKeyUp(key);
      keys.delete(key);
    };
    btn.addEventListener('touchstart', d, { passive: false });
    btn.addEventListener('touchend', u, { passive: false });
    btn.addEventListener('touchcancel', u, { passive: false });
    btn.addEventListener('mousedown', d); btn.addEventListener('mouseup', u); btn.addEventListener('mouseleave', u);
  }
  function gp(i) {
    if (!navigator.getGamepads) return null;
    const g = navigator.getGamepads()[i]; if (!g) return null;
    const dz = (v) => (Math.abs(v) < 0.18 ? 0 : v);
    return { mx: dz(g.axes[0] || 0), my: dz(g.axes[1] || 0),
      rotL: (g.buttons[4] && g.buttons[4].pressed) || (g.buttons[2] && g.buttons[2].pressed),
      rotR: (g.buttons[5] && g.buttons[5].pressed) || (g.buttons[1] && g.buttons[1].pressed) };
  }

  function clampPaddle(p) {
    const hh = paddleH(p) / 2;
    p.y = Math.max(hh + 8, Math.min(H - hh - 8, p.y));
    const ghost = hasEffect(p, 'ghost');
    if (p.side < 0) p.x = Math.max(40, Math.min(ghost ? W - 50 : Math.min(divX - 34, W * 0.5), p.x));
    else p.x = Math.max(ghost ? 50 : Math.max(divX + 34, W * 0.5), Math.min(W - 40, p.x));
    // Full 360° allowed. Wrap both angles by the same full turns so the
    // numbers never grow unbounded (rotation is visually periodic).
    const turns = Math.trunc(p.targetAngle / (Math.PI * 2)) * (Math.PI * 2);
    if (turns) { p.targetAngle -= turns; p.angle -= turns; }
  }

  // Ease the visible angle toward its target (smooth snaps AND smooth holds).
  function easeAngle(p, dt) {
    p.angle += (p.targetAngle - p.angle) * Math.min(1, CFG.rotEase * dt);
  }

  function controlHuman(p, dt) {
    const m = p.keymap; let mx = 0, my = 0;
    if (keys.has(m.up)) my -= 1;
    if (keys.has(m.down)) my += 1;
    if (keys.has(m.left)) mx -= 1;
    if (keys.has(m.right)) mx += 1;
    // Held rotation keys spin continuously once past the tap threshold.
    for (const k of [m.rotL, m.rotR]) {
      const st = rotState[k];
      if (st && keys.has(k)) {
        if (!st.held && performance.now() - st.downAt > CFG.rotHoldMs) st.held = true;
        if (st.held) p.targetAngle += (k === m.rotR ? 1 : -1) * CFG.rotSpeed * dt;
      }
    }
    const g = gp(p.gp);
    if (g) {
      mx += g.mx; my += g.my;
      if (g.rotL) p.targetAngle -= CFG.rotSpeed * dt;
      if (g.rotR) p.targetAngle += CFG.rotSpeed * dt;
    }
    p.x += mx * CFG.moveSpeed * dt;
    p.y += my * CFG.moveSpeed * dt;
    easeAngle(p, dt);
    clampPaddle(p);
  }

  // "Human-like" CPU: drives the SAME inputs a player has (x/y movement,
  // rotation toward a target angle, deliberate boost spins) with reaction lag,
  // aim error and occasional blunders — nothing teleports, everything is
  // reachable for a human opponent.
  const PERSONALITY = {
    // Easy: sluggish & clumsy but adorable. Medium: solid with mistakes.
    // Hard: aggressive, fast, spins for boosts — yet still misses sometimes.
    easy:   { react: 0.32, err: 150, speed: 0.55, accel: 6,  look: 0.25, blunder: 0.20, aggro: 0.06, boost: 0.02, chase: 0.0 },
    medium: { react: 0.13, err: 58,  speed: 0.86, accel: 11, look: 0.70, blunder: 0.05, aggro: 0.50, boost: 0.20, chase: 0.55 },
    hard:   { react: 0.07, err: 24,  speed: 1.00, accel: 15, look: 0.96, blunder: 0.015, aggro: 0.85, boost: 0.55, chase: 0.9 },
  };
  function nearestChaseable(p) {
    // Pucks/mines inside our own half that we could herd toward the enemy goal.
    const inOwnHalf = (x) => (p.side < 0 ? x < divX - 40 : x > divX + 40);
    let best = null, bd = Infinity;
    for (const e of pucks) if (inOwnHalf(e.x)) { const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < bd) { bd = d; best = e; } }
    for (const e of mines) if (inOwnHalf(e.x)) { const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < bd) { bd = d; best = e; } }
    return best;
  }
  function controlAI(p, dt) {
    const c = PERSONALITY[attract ? 'medium' : settings.difficulty] || PERSONALITY.medium;
    const coming = (p.side < 0 && ball.vx < 0) || (p.side > 0 && ball.vx > 0);
    const distX = Math.abs(ball.x - p.x);

    // Drop a chase target that no longer exists (scored / exploded).
    if (p.chaseTarget && !pucks.includes(p.chaseTarget) && !mines.includes(p.chaseTarget)) p.chaseTarget = null;

    p.reactT -= dt;
    if (p.reactT <= 0) {
      p.reactT = c.react * (0.6 + Math.random() * 0.9);
      p.chaseTarget = null;
      if (coming) {
        // Lookahead with proper wall folding (any number of bounces) + error
        // + occasional blunders. `look` blends prediction vs. just following.
        const tHit = distX / (Math.abs(ball.vx) || 1);
        let predicted = ball.y + ball.vy * tHit;
        let fold = predicted % (2 * H);
        if (fold < 0) fold += 2 * H;
        predicted = fold > H ? 2 * H - fold : fold;
        predicted = ball.y + (predicted - ball.y) * c.look;
        const blunder = Math.random() < c.blunder ? (Math.random() - 0.5) * 340 : 0;
        p.targetY = predicted + (Math.random() - Math.random()) * c.err + blunder;
        // Step toward the centre line to attack (aggression by difficulty).
        const frontX = p.side < 0 ? divX - 70 : divX + 70;
        p.targetX = p.homeX + (frontX - p.homeX) * c.aggro * (0.4 + Math.random() * 0.6);
        p.wantBoost = Math.random() < c.boost;
      } else {
        // Ball going away: maybe herd a power-up / mine, else recover home.
        const t = Math.random() < c.chase ? nearestChaseable(p) : null;
        if (t) p.chaseTarget = t;
        else {
          p.targetY = H / 2 + (Math.random() - 0.5) * 180;
          p.targetX = p.homeX + (Math.random() - 0.5) * 40;
        }
        p.wantBoost = false;
      }
    }
    if (p.chaseTarget) {
      // Stand on the own-goal side of the target so the body push sends it
      // toward the enemy goal.
      const t = p.chaseTarget;
      p.targetY = t.y;
      p.targetX = t.x + p.side * (t.r + 28);
    }

    // Accelerated movement in BOTH axes (natural over-/undershoot).
    const dvy = Math.max(-1, Math.min(1, (p.targetY - p.y) / 60)) * CFG.moveSpeed * c.speed;
    p.vy += (dvy - p.vy) * Math.min(1, c.accel * dt);
    p.y += p.vy * dt;
    const dvx = Math.max(-1, Math.min(1, ((p.targetX ?? p.homeX) - p.x) / 80)) * CFG.moveSpeed * c.speed * 0.8;
    p.vx += (dvx - p.vx) * Math.min(1, c.accel * dt);
    p.x += p.vx * dt;

    // Rotation: deliberate boost spin on contact, otherwise tilt the face so
    // the ball is sent AWAY from the opponent (toward the open corner), and
    // settle back to a clean 90° step when idle.
    if (coming && distX < 90 && p.wantBoost && p.boosting <= 0) {
      p.boosting = 0.22;
      p.boostDir = ball.y < p.y ? -1 : 1;
      p.wantBoost = false;
    }
    if (p.boosting > 0) {
      p.boosting -= dt;
      p.targetAngle += p.boostDir * CFG.rotSpeed * 3 * dt;
    } else if (coming && distX < 320) {
      // Aim at the corner farthest from the opponent: a tilted face deflects
      // the ball vertically, so pick the tilt that drives it past them.
      const foe = p === p1 ? p2 : p1;
      const goAwayFromFoe = foe.y > H / 2 ? -1 : 1; // send ball to the emptier half
      const intent = c.aggro; // hard CPU commits to sharper angles
      const aim = goAwayFromFoe * (p.side < 0 ? 1 : -1) * (0.3 + intent * 0.35);
      p.targetAngle += (aim - p.targetAngle) * Math.min(1, 3.2 * dt);
    } else {
      const rest = Math.round(p.targetAngle / HALF_PI) * HALF_PI;
      p.targetAngle += (rest - p.targetAngle) * Math.min(1, 2.5 * dt);
    }
    easeAngle(p, dt);
    clampPaddle(p);
  }

  // ---- physics ----
  function reflect(p) {
    const hw = CFG.paddleW / 2, hh = paddleH(p) / 2;
    const cs = Math.cos(-p.angle), sn = Math.sin(-p.angle);
    const dx = ball.x - p.x, dy = ball.y - p.y;
    const lx = dx * cs - dy * sn, ly = dx * sn + dy * cs;
    const cx = Math.max(-hw, Math.min(hw, lx)), cy = Math.max(-hh, Math.min(hh, ly));
    let nx = lx - cx, ny = ly - cy, d = Math.hypot(nx, ny);
    if (d > ball.r) return false;
    if (d === 0) { nx = lx < 0 ? -1 : 1; ny = 0; d = 1; } else { nx /= d; ny /= d; }
    ny += (ly / hh) * 0.6; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
    const wc = Math.cos(p.angle), ws = Math.sin(p.angle);
    const wnx = nx * wc - ny * ws, wny = nx * ws + ny * wc;
    const dot = ball.vx * wnx + ball.vy * wny;
    ball.vx -= 2 * dot * wnx; ball.vy -= 2 * dot * wny;
    // Speed only increases when the paddle is actively rotating on contact;
    // a straight or angled (non-rotating) hit keeps the current speed.
    const spinning = Math.abs(p.angVel || 0) > 1.3;
    if (spinning) {
      ball.speed = Math.min(CFG.ballSpeedMax, ball.speed * 1.22);
      popup('BOOST!', ball.x, ball.y - 28, p.side < 0 ? COLORS.p1glow : COLORS.p2glow, 0.7);
    }
    const vl = Math.hypot(ball.vx, ball.vy) || 1;
    ball.vx = ball.vx / vl * ball.speed; ball.vy = ball.vy / vl * ball.speed;
    ball.x += wnx * (ball.r - d + 0.5); ball.y += wny * (ball.r - d + 0.5);
    ball.lastHit = p;
    if (hasEffect(p, 'spin')) ball.spin = (p.side < 0 ? 1 : -1) * 260;
    sfx.hit(); burst(ball.x, ball.y, p.side < 0 ? COLORS.p1glow : COLORS.p2glow, 8); addShake(3);
    if (ball.speed > 620 && Math.random() < 0.25) popup(pick(POP.hit), ball.x, ball.y - 24, '#fff', 0.7);
    return true;
  }
  // Shove a puck/mine with the paddle "body" (rotated rectangle vs circle).
  function pushEntityByPaddle(p, ent) {
    const hw = CFG.paddleW / 2, hh = paddleH(p) / 2;
    const cs = Math.cos(-p.angle), sn = Math.sin(-p.angle);
    const dx = ent.x - p.x, dy = ent.y - p.y;
    const lx = dx * cs - dy * sn, ly = dx * sn + dy * cs;
    const cx = Math.max(-hw, Math.min(hw, lx)), cy = Math.max(-hh, Math.min(hh, ly));
    let nx = lx - cx, ny = ly - cy, d = Math.hypot(nx, ny);
    if (d > ent.r) return;
    if (d === 0) { nx = lx < 0 ? -1 : 1; ny = 0; d = 1; } else { nx /= d; ny /= d; }
    const wc = Math.cos(p.angle), ws = Math.sin(p.angle);
    const wnx = nx * wc - ny * ws, wny = nx * ws + ny * wc;
    ent.x += wnx * (ent.r - d + 0.5); ent.y += wny * (ent.r - d + 0.5);
    ent.vx += (p.velX || 0) * 0.8 + wnx * 140;
    ent.vy += (p.velY || 0) * 0.8 + wny * 140;
  }

  function circleHit(e) {
    const dx = ball.x - e.x, dy = ball.y - e.y, dist = Math.hypot(dx, dy), rad = ball.r + e.r;
    if (dist > rad || dist === 0) return false;
    const nx = dx / dist, ny = dy / dist;
    e.vx += ball.vx * 0.7 + nx * 40; e.vy += ball.vy * 0.7 + ny * 40;
    const dot = ball.vx * nx + ball.vy * ny;
    ball.vx -= 1.2 * dot * nx; ball.vy -= 1.2 * dot * ny;
    const vl = Math.hypot(ball.vx, ball.vy) || 1;
    ball.vx = ball.vx / vl * ball.speed; ball.vy = ball.vy / vl * ball.speed;
    ball.x = e.x + nx * (rad + 0.5); ball.y = e.y + ny * (rad + 0.5);
    return true;
  }
  function stepEnt(e, dt) {
    e.vx *= 0.99; e.vy *= 0.99; e.x += e.vx * dt; e.y += e.vy * dt;
    if (e.y < e.r) { e.y = e.r; e.vy = Math.abs(e.vy); }
    else if (e.y > H - e.r) { e.y = H - e.r; e.vy = -Math.abs(e.vy); }
  }

  function update(dt) {
    divX += (divTarget - divX) * Math.min(1, dt * 8);
    if (phase === 'countdown') { countdownT -= dt; if (countdownT <= 0) phase = 'playing'; stepFx(dt); return; }
    if (phase === 'roundover') { roundoverT -= dt; stepFx(dt); if (roundoverT <= 0) afterRoundover(); return; }
    if (phase !== 'playing') { stepFx(dt); return; }

    const idt = dt > 0 ? 1 / dt : 60;
    [p1, p2].forEach((p) => { p.prevX = p.x; p.prevY = p.y; p.prevA = p.angle; });
    (p1.isAI ? controlAI : controlHuman)(p1, dt);
    (p2.isAI ? controlAI : controlHuman)(p2, dt);
    [p1, p2].forEach((p) => {
      p.velX = (p.x - p.prevX) * idt;
      p.velY = (p.y - p.prevY) * idt;
      p.angVel = (p.angle - p.prevA) * idt;
    });
    helpers.forEach((h) => {
      h.y = h.owner.y + h.offset; h.x = h.owner.x; h.angle = h.owner.angle;
      h.velX = h.owner.velX; h.velY = h.owner.velY; h.angVel = h.owner.angVel;
    });

    // --- Ball physics in SUBSTEPS. The step count covers the RELATIVE motion:
    // ball travel AND how far each paddle moves/sweeps this frame (a fast dash
    // or spin would otherwise teleport the paddle across the ball between two
    // frames). Paddle pose is interpolated per substep, so contacts that
    // happen mid-frame are detected — no more tunnelling through paddles.
    const slow = (hasEffect(p1, 'sticky') || hasEffect(p2, 'sticky')) ? 0.6 : 1;
    if (ball.spin) { ball.vy += ball.spin * dt * 0.5; ball.spin *= 0.985; }
    const travel = Math.hypot(ball.vx, ball.vy) * dt * slow;
    const sweepOf = (p) => {
      const tip = paddleH(p) / 2 + CFG.paddleW / 2;
      return Math.hypot(p.x - p.prevX, p.y - p.prevY) + Math.abs(p.angle - p.prevA) * tip;
    };
    const motion = Math.max(travel, sweepOf(p1), sweepOf(p2));
    const steps = Math.max(1, Math.min(16, Math.ceil(motion / (ball.r * 0.7))));
    const sdt = (dt * slow) / steps;
    const finals = [p1, p2].map((p) => ({ x: p.x, y: p.y, a: p.angle }));
    const syncHelpers = () => helpers.forEach((h) => {
      h.x = h.owner.x; h.y = h.owner.y + h.offset; h.angle = h.owner.angle;
    });
    let scoredBy = null;
    for (let s = 0; s < steps && !scoredBy; s++) {
      const k = (s + 1) / steps;
      [p1, p2].forEach((p, i) => {
        p.x = p.prevX + (finals[i].x - p.prevX) * k;
        p.y = p.prevY + (finals[i].y - p.prevY) * k;
        p.angle = p.prevA + (finals[i].a - p.prevA) * k;
      });
      syncHelpers();
      ball.x += ball.vx * sdt; ball.y += ball.vy * sdt;
      if (ball.y < ball.r) { ball.y = ball.r; ball.vy = Math.abs(ball.vy); sfx.wall(); }
      else if (ball.y > H - ball.r) { ball.y = H - ball.r; ball.vy = -Math.abs(ball.vy); sfx.wall(); }
      reflect(p1); reflect(p2); helpers.forEach(reflect);
      if (ball.x < -ball.r) scoredBy = p2;
      else if (ball.x > W + ball.r) scoredBy = p1;
    }
    [p1, p2].forEach((p, i) => { p.x = finals[i].x; p.y = finals[i].y; p.angle = finals[i].a; });
    syncHelpers();
    trail.push({ x: ball.x, y: ball.y }); if (trail.length > 16) trail.shift();

    if (settings.powerups.size) {
      puckTimer -= dt;
      if (puckTimer <= 0 && pucks.length < 2) { spawnPuck(); puckTimer = CFG.puckEvery; }
    }
    pucks.forEach((pk) => {
      stepEnt(pk, dt);
      circleHit(pk);
      pushEntityByPaddle(p1, pk); pushEntityByPaddle(p2, pk);
      helpers.forEach((h) => pushEntityByPaddle(h, pk));
    });
    pucks = pucks.filter((pk) => {
      if (pk.x < -pk.r) { activate(p2, pk.type, pk); return false; }
      if (pk.x > W + pk.r) { activate(p1, pk.type, pk); return false; }
      return true;
    });
    mines.forEach((mn) => {
      stepEnt(mn, dt);
      circleHit(mn);
      pushEntityByPaddle(p1, mn); pushEntityByPaddle(p2, mn);
      helpers.forEach((h) => pushEntityByPaddle(h, mn));
    });
    mines = mines.filter((mn) => {
      if (mn.x < -mn.r) { explode(mn, p2); return false; }
      if (mn.x > W + mn.r) { explode(mn, p1); return false; }
      return true;
    });

    if (scoredBy) goal(scoredBy);

    stepFx(dt);
    if (shake.t > 0) shake.t -= dt;
    const wantTilt = ball.spin ? 0.05 * Math.sign(ball.spin) : 0;
    tilt += (wantTilt - tilt) * Math.min(1, dt * 4);
  }

  // ---- power-ups ----
  function spawnPuck() {
    const types = [...settings.powerups]; if (!types.length) return;
    const type = types[(Math.random() * types.length) | 0];
    pucks.push({ type, x: W / 2 + (Math.random() * 2 - 1) * 80, y: 100 + Math.random() * (H - 200),
      vx: (Math.random() * 2 - 1) * 40, vy: (Math.random() * 2 - 1) * 40, r: 22, emoji: PU_EMOJI[type] });
  }
  function activate(pl, type, pk) {
    sfx.power(); burst(pk.x, pk.y, COLORS.puck, 18); addShake(5);
    if (type === 'ghost') popup(pick(POP.ghost), pl.side < 0 ? 200 : W - 200, 90, COLORS.puck, 1.4);
    else if (type === 'grow') popup(pick(POP.grow), pl.side < 0 ? 200 : W - 200, 90, COLORS.puck, 1.4);
    else if (type === 'spin') popup(pick(POP.spin), pl.side < 0 ? 200 : W - 200, 90, COLORS.puck, 1.4);
    else if (type === 'sticky') popup(pick(POP.sticky), pl.side < 0 ? 200 : W - 200, 90, COLORS.puck, 1.4);
    else if (type === 'bones') popup(pick(POP.bones), pl.side < 0 ? 200 : W - 200, 90, COLORS.puck, 1.4);
    if (type === 'mines') {
      mines.push({ owner: pl, x: pl.side < 0 ? W * 0.4 : W * 0.6, y: 120 + Math.random() * (H - 240), vx: 0, vy: 0, r: 18 });
      return;
    }
    if (type === 'bones') spawnHelpers(pl);
    pl.effects[type] = now() + CFG.effectDur;
    if (type === 'spin') ball.spin = (pl.side < 0 ? 1 : -1) * 260;
  }
  function spawnHelpers(pl) {
    [-180, 180].forEach((o) => helpers.push({ owner: pl, offset: o, x: pl.x, y: pl.y, angle: 0, side: pl.side, effects: {}, mini: true }));
    setTimeout(() => { helpers = helpers.filter((h) => h.owner !== pl); }, CFG.effectDur * 1000);
  }
  function explode(mn, by) {
    sfx.explode(); burst(mn.x, mn.y, '#ff7043', 44); addShake(16);
    popup(pick(POP.mine), mn.x, mn.y, '#ff7043', 1.2);
    divTarget += by === p1 ? CFG.divStep : -CFG.divStep;
    if (divTarget >= CFG.divMax) capture(p1); else if (divTarget <= CFG.divMin) capture(p2);
  }

  // ---- fx ----
  function addShake(m) { if (!reduced()) shake = { t: 0.25, mag: m }; }
  function burst(x, y, color, n) {
    if (reduced()) n = Math.min(n, 4);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = Math.random() * 260 + 40;
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.6, max: 0.6, color, size: Math.random() * 4 + 1.5 });
    }
  }
  function confetti(color) {
    if (reduced()) return;
    for (let i = 0; i < 80; i++) particles.push({ x: Math.random() * W, y: -10, vx: (Math.random() * 2 - 1) * 70,
      vy: Math.random() * 200 + 60, life: 1.8, max: 1.8, color: i % 2 ? color : '#fff', size: Math.random() * 5 + 2 });
  }
  function stepFx(dt) {
    for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 130 * dt; p.life -= dt; }
    particles = particles.filter((p) => p.life > 0);
    for (const pp of popups) pp.t -= dt; popups = popups.filter((pp) => pp.t > 0);
  }
  function popup(text, x, y, color, dur) { popups.push({ text, x, y, color, t: dur, max: dur }); }

  // ---- render ----
  function draw() {
    ctx.save();
    if (shake.t > 0 && !reduced()) { const m = shake.mag * (shake.t / 0.25); ctx.translate((Math.random() * 2 - 1) * m, (Math.random() * 2 - 1) * m); }
    if (tilt && !reduced()) { ctx.translate(W / 2, H / 2); ctx.rotate(tilt); ctx.translate(-W / 2, -H / 2); }

    ctx.fillStyle = '#0a0a16'; ctx.fillRect(-50, -50, W + 100, H + 100);
    const pg = ctx.createRadialGradient(W - 150, 130, 12, W - 150, 130, 200);
    pg.addColorStop(0, 'rgba(245,197,66,0.55)'); pg.addColorStop(1, 'rgba(245,197,66,0)');
    ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(W - 150, 130, 200, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; for (const s of stars) { ctx.globalAlpha = s.a; ctx.fillRect(s.x, s.y, s.r, s.r); } ctx.globalAlpha = 1;

    ctx.fillStyle = COLORS.p1fill; ctx.fillRect(0, 0, divX, H);
    ctx.fillStyle = COLORS.p2fill; ctx.fillRect(divX, 0, W - divX, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 3; ctx.setLineDash([14, 16]);
    ctx.beginPath(); ctx.moveTo(divX, 0); ctx.lineTo(divX, H); ctx.stroke(); ctx.setLineDash([]);

    for (const pk of pucks) drawPuck(pk);
    for (const mn of mines) drawMine(mn);
    helpers.forEach((h) => drawPaddle(h, h.side < 0 ? COLORS.p1glow : COLORS.p2glow, 0.8, true));
    drawPaddle(p1, COLORS.p1glow, 1); drawPaddle(p2, COLORS.p2glow, 1);

    const glow = ball && ball.lastHit ? (ball.lastHit.side < 0 ? COLORS.p1glow : COLORS.p2glow) : '#ffffff';
    for (let i = 0; i < trail.length; i++) { const tp = trail[i]; ctx.globalAlpha = (i / trail.length) * 0.5; ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(tp.x, tp.y, ball.r * (i / trail.length), 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    if (ball) {
      // Colored halo in the last toucher's colour, white core.
      ctx.shadowColor = glow; ctx.shadowBlur = 24; ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r + 3, 0, 7); ctx.fill();
      ctx.shadowBlur = 0; ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, 7); ctx.fill();
    }

    for (const p of particles) { ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); }
    ctx.globalAlpha = 1;

    drawIndicators(); drawPopups();
    if (phase === 'countdown') drawBig(String(Math.ceil(countdownT)));
    if (phase === 'roundover') drawRoundScore();
    ctx.restore();
  }
  function drawPaddle(p, color, alpha, mini) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(p.x, p.y); ctx.rotate(p.angle);
    ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 16;
    const hh = (mini ? CFG.paddleH * 0.42 : paddleH(p)) / 2;
    ctx.beginPath(); rr(ctx, -CFG.paddleW / 2, -hh, CFG.paddleW, hh * 2, 8); ctx.fill(); ctx.restore();
  }
  function drawPuck(pk) {
    ctx.save(); ctx.fillStyle = 'rgba(245,197,66,0.18)'; ctx.strokeStyle = COLORS.puck; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(pk.x, pk.y, pk.r, 0, 7); ctx.fill(); ctx.stroke();
    ctx.font = '24px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(pk.emoji, pk.x, pk.y + 1); ctx.restore();
  }
  function drawMine(mn) { ctx.save(); ctx.font = '30px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('💣', mn.x, mn.y); ctx.restore(); }
  function drawIndicators() {
    ctx.font = '26px system-ui'; ctx.textAlign = 'left'; let y = 60;
    for (const t of POWERUPS) if (hasEffect(p1, t)) { ctx.fillText(PU_EMOJI[t], 16, y); y += 34; }
    ctx.textAlign = 'right'; y = 60;
    for (const t of POWERUPS) if (hasEffect(p2, t)) { ctx.fillText(PU_EMOJI[t], W - 16, y); y += 34; }
  }
  function drawPopups() {
    ctx.textAlign = 'center';
    for (const pp of popups) { const k = pp.t / pp.max; ctx.globalAlpha = Math.min(1, k * 2); ctx.fillStyle = pp.color;
      ctx.font = `900 ${34 + (1 - k) * 14}px system-ui, sans-serif`; ctx.fillText(pp.text, pp.x, pp.y - (1 - k) * 30); }
    ctx.globalAlpha = 1;
  }
  function drawBig(txt) {
    ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.font = '900 120px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, W / 2, H / 2); ctx.textBaseline = 'alphabetic';
  }
  function drawRoundScore() {
    ctx.save(); ctx.globalAlpha = 0.5; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff'; ctx.font = '900 200px system-ui, sans-serif';
    ctx.fillText(String(p1.score), W * 0.28, H / 2); ctx.fillText(String(p2.score), W * 0.72, H / 2);
    ctx.font = '900 34px system-ui, sans-serif'; ctx.fillText(`BEST OF ${settings.bestOf}`, W / 2, H / 2);
    ctx.restore(); ctx.textBaseline = 'alphabetic';
  }
  function nameOf(p) { return p.isAI ? (settings.p1Type === 'cpu' && settings.p2Type === 'cpu' ? (p === p1 ? 'CPU 1' : 'CPU 2') : 'CPU') : (p === p1 ? 'PLAYER 1' : 'PLAYER 2'); }
  function updateScore() { if (scoreP1) scoreP1.textContent = p1.score; if (scoreP2) scoreP2.textContent = p2.score; }

  // ---- loop ----
  function frame(ts) {
    rafId = 0; const dt = Math.min(0.033, (ts - lastT) / 1000 || 0); lastT = ts;
    if (phase === 'countdown' || phase === 'playing' || phase === 'roundover') update(dt);
    if (phase !== 'start') draw();
    loop();
  }
  function loop() { if (!rafId) rafId = requestAnimationFrame(frame); }

  // ---- UI flow ----
  function showStart() {
    phase = 'start';
    if (startScreen) startScreen.hidden = false;
    if (panel) panel.hidden = true;
    if (pauseTag) pauseTag.hidden = true;
    // gentle attract: faded demo behind start screen
    settingsBackup();
    runAttract();
  }
  let attract = false;
  function runAttract() {
    attract = true;
    const t1 = settings.p1Type, t2 = settings.p2Type;
    settings.p1Type = 'cpu'; settings.p2Type = 'cpu';
    configure(); p1.score = 0; p2.score = 0; roundNum = 1; beginRound();
    settings.p1Type = t1; settings.p2Type = t2;
  }
  function settingsBackup() {}

  function start() {
    ensureAudio(); attract = false;
    if (startScreen) startScreen.hidden = true;
    if (panel) panel.hidden = true;
    startMatch();
  }
  function togglePause() {
    if (attract || phase === 'start' || phase === 'matchover') { start(); return; }
    if (phase === 'paused') { phase = 'playing'; if (pauseTag) pauseTag.hidden = true; lastT = performance.now(); }
    else if (phase === 'playing' || phase === 'countdown') { phase = 'paused'; if (pauseTag) pauseTag.hidden = false; }
  }
  function goHome() { if (pauseTag) pauseTag.hidden = true; showStart(); }
  function showPanel(title, sub) {
    if (!panel) return;
    panel.hidden = false;
    if (panelTitle) panelTitle.textContent = title;
    if (panelSub) panelSub.textContent = sub;
    if (panelP1) panelP1.textContent = p1.score;
    if (panelP2) panelP2.textContent = p2.score;
  }

  // ---- wire start screen ----
  function seg(attr, cb) {
    document.querySelectorAll(`[${attr}]`).forEach((b) =>
      b.addEventListener('click', () => { cb(b.getAttribute(attr), b); refreshUI(); ensureAudio(); }));
  }
  seg('data-pf-bestof', (v) => (settings.bestOf = +v));
  seg('data-pf-diff', (v) => (settings.difficulty = v));
  seg('data-pf-p1', (v) => (settings.p1Type = v));
  seg('data-pf-p2', (v) => (settings.p2Type = v));
  document.querySelectorAll('[data-pf-pu]').forEach((b) =>
    b.addEventListener('click', () => {
      const k = b.getAttribute('data-pf-pu');
      if (settings.powerups.has(k)) settings.powerups.delete(k); else settings.powerups.add(k);
      refreshUI();
    }));
  document.querySelector('[data-pf-sound]')?.addEventListener('click', () => { settings.sound = !settings.sound; ensureAudio(); refreshUI(); });
  document.querySelector('[data-pf-music]')?.addEventListener('click', () => { settings.music = !settings.music; ensureAudio(); refreshUI(); });
  document.querySelector('[data-pf-startbtn]')?.addEventListener('click', start);
  document.querySelector('[data-pf-rematch]')?.addEventListener('click', start);
  document.querySelector('[data-pf-home]')?.addEventListener('click', goHome);

  function refreshUI() {
    const setActive = (attr, val) => document.querySelectorAll(`[${attr}]`).forEach((b) => b.classList.toggle('on', b.getAttribute(attr) === String(val)));
    setActive('data-pf-bestof', settings.bestOf);
    setActive('data-pf-diff', settings.difficulty);
    setActive('data-pf-p1', settings.p1Type);
    setActive('data-pf-p2', settings.p2Type);
    document.querySelectorAll('[data-pf-pu]').forEach((b) => b.classList.toggle('off', !settings.powerups.has(b.getAttribute('data-pf-pu'))));
    document.querySelector('[data-pf-sound]')?.classList.toggle('on', settings.sound);
    document.querySelector('[data-pf-music]')?.classList.toggle('on', settings.music);
    const diffRow = document.querySelector('[data-pf-diffrow]');
    if (diffRow) diffRow.hidden = settings.p1Type !== 'cpu' && settings.p2Type !== 'cpu';
    if (touch && isTouch) {
      touch.hidden = false;
      const t1 = touch.querySelector('[data-side="p1"]'); const t2 = touch.querySelector('[data-side="p2"]');
      if (t1) t1.style.display = settings.p1Type === 'human' ? '' : 'none';
      if (t2) t2.style.display = settings.p2Type === 'human' ? '' : 'none';
    }
  }

  // boot
  fit(); refreshUI(); showStart();
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('resize', () => { fit(); draw(); });
  if (isTouch && touch) touch.querySelectorAll('button[data-key]').forEach(bindTouch);
  lastT = performance.now(); loop();
}

function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
