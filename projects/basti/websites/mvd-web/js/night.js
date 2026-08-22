/* ==========================================================================
   Nachthimmel-Leben (V1): Sternschnuppen und Glühwürmchen.

   Beides auf einem festen Canvas hinter dem Inhalt, damit es über die ganze
   Seite hinweg gleich weiterläuft statt in jedem Abschnitt neu zu starten.

     - Sternschnuppen ziehen selten und kurz durch das obere Drittel.
       Zwischen zwei Erscheinungen liegen mehrere Sekunden Pause – sonst wird
       aus dem Effekt schnell ein Regen und die Seite wird unruhig.
     - Glühwürmchen schweben langsam und werden dabei heller und dunkler.
   ========================================================================== */

(function () {
  "use strict";

  var canvas = document.getElementById("night-life");
  if (!canvas || !canvas.getContext) { return; }

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduced && reduced.matches) { return; }

  var ctx = canvas.getContext("2d");
  var width = 0;
  var height = 0;
  var flies = [];
  var shots = [];
  var running = false;
  var lastTime = 0;
  var clock = 0;
  var nextShot = 3;

  function random(min, max) { return min + Math.random() * (max - min); }

  function makeFly() {
    return {
      x: random(0, width),
      y: random(height * 0.18, height * 0.95),
      r: random(1.1, 2.3),
      vx: random(-11, 11),
      vy: random(-7, 7),
      /* Jedes Tier hat sein eigenes Blinkmuster. */
      pulse: random(0.5, 1.5),
      phase: random(0, Math.PI * 2),
      turn: random(0.3, 0.9),
      turnPhase: random(0, Math.PI * 2),
      warm: Math.random() < 0.35
    };
  }

  function makeShot() {
    var fromLeft = Math.random() < 0.5;
    var speed = random(620, 1000);
    /* Flach nach unten, wie eine echte Sternschnuppe. */
    var angle = random(0.22, 0.42) * (fromLeft ? 1 : -1);

    return {
      x: fromLeft ? random(-0.1, 0.35) * width : random(0.65, 1.1) * width,
      y: random(0.03, 0.3) * height,
      vx: Math.cos(angle) * speed * (fromLeft ? 1 : -1),
      vy: Math.sin(Math.abs(angle)) * speed,
      life: 0,
      span: random(0.6, 1.0),
      len: random(90, 190)
    };
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    width = rect.width;
    height = rect.height;
    if (!width || !height) { return; }

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var count = width < 620 ? 7 : Math.round(Math.min(18, width / 90));
    flies = [];
    for (var i = 0; i < count; i++) { flies.push(makeFly()); }
  }

  function drawFly(f) {
    var glow = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(clock * f.pulse + f.phase));
    var color = f.warm ? "255, 214, 130" : "190, 232, 255";

    var g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 7);
    g.addColorStop(0, "rgba(" + color + ", " + (0.85 * glow) + ")");
    g.addColorStop(0.35, "rgba(" + color + ", " + (0.25 * glow) + ")");
    g.addColorStop(1, "rgba(" + color + ", 0)");

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r * 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 250, 235, " + (0.9 * glow) + ")";
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawShot(s) {
    var t = s.life / s.span;
    /* Schnell hell werden, langsam verglühen. */
    var fade = t < 0.18 ? t / 0.18 : 1 - (t - 0.18) / 0.82;
    if (fade <= 0) { return; }

    var norm = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
    var tailX = s.x - (s.vx / norm) * s.len;
    var tailY = s.y - (s.vy / norm) * s.len;

    var g = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
    g.addColorStop(0, "rgba(255, 248, 232, " + (0.9 * fade) + ")");
    g.addColorStop(0.35, "rgba(255, 208, 150, " + (0.35 * fade) + ")");
    g.addColorStop(1, "rgba(255, 190, 120, 0)");

    ctx.strokeStyle = g;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(tailX, tailY);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 252, 244, " + (0.95 * fade) + ")";
    ctx.beginPath();
    ctx.arc(s.x, s.y, 1.7, 0, Math.PI * 2);
    ctx.fill();
  }

  function frame(now) {
    if (!running) { return; }

    if (!lastTime) { lastTime = now; }
    var dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    clock += dt;

    ctx.clearRect(0, 0, width, height);

    for (var i = 0; i < flies.length; i++) {
      var f = flies[i];
      /* Sanftes Schlingern statt gerader Linie. */
      f.turnPhase += f.turn * dt;
      f.x += (f.vx + Math.sin(f.turnPhase) * 9) * dt;
      f.y += (f.vy + Math.cos(f.turnPhase * 0.7) * 7) * dt;

      if (f.x < -30) { f.x = width + 30; }
      if (f.x > width + 30) { f.x = -30; }
      if (f.y < height * 0.14) { f.vy = Math.abs(f.vy); }
      if (f.y > height * 0.98) { f.vy = -Math.abs(f.vy); }

      drawFly(f);
    }

    nextShot -= dt;
    if (nextShot <= 0) {
      shots.push(makeShot());
      /* Ordentliche Pause bis zur nächsten – der Effekt lebt davon, dass er
         selten ist. */
      nextShot = random(5, 13);
    }

    for (var s = shots.length - 1; s >= 0; s--) {
      var sh = shots[s];
      sh.life += dt;
      sh.x += sh.vx * dt;
      sh.y += sh.vy * dt;

      if (sh.life > sh.span) {
        shots.splice(s, 1);
        continue;
      }
      drawShot(sh);
    }

    window.requestAnimationFrame(frame);
  }

  function start() {
    if (running || document.hidden) { return; }
    running = true;
    lastTime = 0;
    window.requestAnimationFrame(frame);
  }

  function stop() { running = false; }

  var resizeTimer = null;
  function remeasure() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      resize();
      if (running) { lastTime = 0; }
    }, 150);
  }

  window.addEventListener("resize", remeasure);

  if ("ResizeObserver" in window) {
    new ResizeObserver(remeasure).observe(canvas);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { stop(); } else { start(); }
  });

  resize();
  start();
})();
