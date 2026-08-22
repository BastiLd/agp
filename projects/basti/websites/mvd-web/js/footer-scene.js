/* ==========================================================================
   Footer-Szene (V1) – ersetzt die alten SVG-Dünenebenen samt Sockelbalken.

   Vorher lagen vier gekachelte SVG-Grafiken übereinander und darunter ein
   deckender Balken, damit die Fußzeile lesbar bleibt. Dieser Balken hat die
   Sand-Effekte am unteren Rand abgeschnitten – sie hörten sichtbar auf,
   bevor die Seite zu Ende war.

   Jetzt zeichnet ein einziges Canvas die ganze Szene bis zur Unterkante:

     - vier Dünenreihen als Kurven, jede mit eigener Geschwindigkeit und
       Farbe; die vorderste läuft bis zum unteren Bildrand durch
     - Kaktus- und Grasbüschel-Silhouetten, die auf den Kämmen mitwandern
     - Treibsand über allen Reihen
     - Sandhosen, die über die Kämme ziehen

   Die Dünen entstehen aus überlagerten Sinuswellen statt aus Bilddateien:
   dadurch gibt es keine sichtbare Kachelkante, die Form ist auf jeder
   Bildschirmbreite anders, und der Sand kann bis ganz nach unten laufen.
   ========================================================================== */

(function () {
  "use strict";

  var canvas = document.getElementById("footer-scene");
  if (!canvas || !canvas.getContext) { return; }

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  var animate = !(reduced && reduced.matches);

  var ctx = canvas.getContext("2d");
  var width = 0;
  var height = 0;
  var running = false;
  var visible = false;
  var lastTime = 0;
  var clock = 0;

  var grains = [];
  var devils = [];

  /* Sandtöne von hell (hinten, hoch) bis dunkel (vorne, tief). */
  var TONES = ["243, 232, 205", "228, 196, 138", "201, 154, 88", "148, 101, 55"];

  /* Die vier Reihen, von hinten nach vorn. baseY ist der Anteil der
     Footerhöhe, auf dem der Kamm im Mittel liegt. */
  var ROWS = [
    { baseY: 0.46, amp: 0.055, speed: 5,  fill: "#efe3c6", wave: 1.00, cacti: 0.55 },
    { baseY: 0.58, amp: 0.062, speed: 9,  fill: "#d8b57e", wave: 1.35, cacti: 0.8 },
    { baseY: 0.71, amp: 0.055, speed: 15, fill: "#a9773f", wave: 1.75, cacti: 1.1 },
    { baseY: 0.85, amp: 0.048, speed: 24, fill: "#5d4023", wave: 2.30, cacti: 1.5 }
  ];

  function random(min, max) { return min + Math.random() * (max - min); }

  /* Höhe eines Dünenkamms an der Stelle x. Drei Wellen mit unrunden
     Verhältnissen – dadurch wiederholt sich die Silhouette nicht sichtbar. */
  function crest(row, x, shift) {
    var u = (x + shift) / width;
    var w = row.wave;
    return height * (row.baseY
      - row.amp * Math.sin(u * Math.PI * 2 * w)
      - row.amp * 0.45 * Math.sin(u * Math.PI * 2 * w * 2.7 + 1.3)
      - row.amp * 0.22 * Math.sin(u * Math.PI * 2 * w * 5.1 + 2.6));
  }

  function makeGrain(spawnAnywhere) {
    var depth = Math.random();
    return {
      x: spawnAnywhere ? random(0, width) : random(-60, -6),
      y: random(height * 0.3, height),
      r: random(0.9, 1.3 + depth * 2.6),
      speed: random(26, 52) + depth * 92,
      rise: random(-11, 2),
      alpha: random(0.2, 0.34 + depth * 0.42),
      tone: TONES[Math.min(TONES.length - 1, Math.floor(depth * TONES.length))],
      wobble: random(0, Math.PI * 2),
      wobbleSpeed: random(0.7, 2.4)
    };
  }

  function makeDevil(index, total, spawnAnywhere) {
    var slot = (index + 0.5) / total;
    return {
      x: spawnAnywhere ? slot * width : random(-160, -60),
      base: random(height * 0.72, height * 0.95),
      h: random(height * 0.4, height * 0.66),
      footW: random(7, 13),
      headW: random(38, 74),
      speed: random(16, 34),
      spin: random(1.6, 3.2) * (Math.random() < 0.5 ? -1 : 1),
      phase: random(0, Math.PI * 2),
      breath: random(0.09, 0.19),
      breathSpeed: random(0.25, 0.5),
      lean: random(-0.16, 0.3)
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

    var count = Math.round(Math.min(520, Math.max(150, width * 0.55)));
    grains = [];
    for (var i = 0; i < count; i++) { grains.push(makeGrain(true)); }

    var devilCount = width < 640 ? 2 : 3;
    devils = [];
    for (var d = 0; d < devilCount; d++) { devils.push(makeDevil(d, devilCount, true)); }
  }

  /* roundRect gibt es erst in neueren Browsern. Auf älteren fällt es auf ein
     schlichtes Rechteck zurück – die Silhouette wirkt dann nur etwas kantiger. */
  function roundRect(x, y, w, h, r) {
    if (ctx.roundRect) {
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.rect(x, y, w, h);
    }
  }

  /* Ein Kaktus: Stamm plus zwei Arme, als reine Silhouette.

     Jeder Arm besteht aus einem waagrechten Stück, das vom Stamm wegführt,
     und einem senkrechten Stück, das an dessen Ende NACH OBEN steht. Die
     senkrechten Teile beginnen also oberhalb des Quersstücks – zeichnet man
     sie darunter, hängen die Arme nach unten. */
  function drawCactus(x, groundY, scale, color) {
    var w = 3.4 * scale;   // Dicke von Stamm und Armen
    var h = 20 * scale;    // Höhe des Stamms

    ctx.fillStyle = color;

    /* Stamm */
    ctx.beginPath();
    roundRect(x - w / 2, groundY - h, w, h, w / 2);
    ctx.fill();

    /* Linker Arm: Querstück auf halber Höhe … */
    var lyJoint = groundY - h * 0.48;
    ctx.beginPath();
    roundRect(x - w * 2.1, lyJoint, w * 2.1 + w / 2, w * 0.85, w / 2);
    ctx.fill();
    /* … und der Aufwärtsteil an seinem äußeren Ende. */
    var lTop = groundY - h * 0.82;
    ctx.beginPath();
    roundRect(x - w * 2.1, lTop, w * 0.85, (lyJoint + w * 0.85) - lTop, w / 2);
    ctx.fill();

    /* Rechter Arm, etwas höher angesetzt */
    var ryJoint = groundY - h * 0.64;
    ctx.beginPath();
    roundRect(x - w / 2, ryJoint, w * 2.2, w * 0.85, w / 2);
    ctx.fill();
    var rTop = groundY - h * 0.94;
    ctx.beginPath();
    roundRect(x + w * 1.35, rTop, w * 0.85, (ryJoint + w * 0.85) - rTop, w / 2);
    ctx.fill();
  }

  /* Ein Grasbüschel: ein paar gebogene Halme. */
  function drawTuft(x, groundY, scale, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, 1.1 * scale);
    ctx.lineCap = "round";

    for (var i = -2; i <= 2; i++) {
      var lean = i * 3.2 * scale;
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.quadraticCurveTo(x + lean * 0.5, groundY - 7 * scale, x + lean, groundY - 11 * scale);
      ctx.stroke();
    }
  }

  /* Eine Dünenreihe: Kammlinie zeichnen, nach unten schließen, füllen.
     Die Fläche reicht immer bis zur Unterkante des Canvas – dadurch gibt es
     keinen Spalt am Seitenende mehr. */
  function drawRow(row, index) {
    var shift = clock * row.speed;
    var step = 6;

    ctx.fillStyle = row.fill;
    ctx.beginPath();
    ctx.moveTo(0, height);

    for (var x = 0; x <= width + step; x += step) {
      ctx.lineTo(x, crest(row, x, shift));
    }

    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    /* Bewuchs auf dem Kamm. Die Positionen hängen nur von shift ab, also
       wandern sie exakt mit der Reihe mit. */
    var spacing = 190 / row.cacti;
    var dark = index >= 2 ? "rgba(28, 17, 8, 0.92)" : "rgba(90, 62, 30, 0.55)";
    var startN = Math.floor(shift / spacing);
    var endN = Math.ceil((shift + width) / spacing);

    for (var n = startN; n <= endN; n++) {
      var wx = n * spacing - shift;
      if (wx < -40 || wx > width + 40) { continue; }

      /* Aus der laufenden Nummer abgeleitet, damit jede Pflanze über die
         ganze Zeit dieselbe Form behält. */
      var seed = Math.abs(Math.sin(n * 12.9898 + index * 78.233) * 43758.5453) % 1;
      var scale = (0.7 + seed * 0.9) * row.cacti;
      var ground = crest(row, wx, shift) + 1;

      if (seed > 0.55) {
        drawCactus(wx, ground, scale, dark);
      } else {
        drawTuft(wx, ground, scale, dark);
      }
    }
  }

  function drawDevil(dv, gust) {
    var strength = dv.breath * (0.62 + 0.38 * Math.sin(clock * dv.breathSpeed + dv.phase)) * gust;
    if (strength <= 0.01) { return; }

    var steps = 16;

    for (var i = 0; i < steps; i++) {
      var t = i / (steps - 1);
      var w = dv.footW + (dv.headW - dv.footW) * (t * t);
      var y = dv.base - dv.h * t;
      var sway = Math.sin(clock * 1.5 + dv.phase + t * 3.4) * (6 + t * 22);
      var x = dv.x + dv.lean * dv.h * t + sway;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(clock * dv.spin + t * 2.2 + dv.phase) * 0.22);
      ctx.fillStyle = "rgba(" + TONES[Math.min(TONES.length - 1, Math.floor(t * 2))] + ", " +
                      (strength * (1 - t * 0.72)) + ")";
      ctx.beginPath();
      ctx.ellipse(0, 0, w, w * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    /* Warmer Lichtschein knapp unter dem hintersten Kamm. */
    var glow = ctx.createRadialGradient(
      width * 0.5, height * 0.46, 0,
      width * 0.5, height * 0.46, Math.max(width * 0.45, height * 0.5)
    );
    glow.addColorStop(0, "rgba(224, 138, 43, 0.38)");
    glow.addColorStop(0.45, "rgba(160, 80, 25, 0.14)");
    glow.addColorStop(1, "rgba(160, 80, 25, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    var gust = 1 + 0.5 * Math.sin(clock * 0.23) + 0.3 * Math.sin(clock * 0.71 + 1.3);

    /* Von hinten nach vorn: Reihe zeichnen, dann den Sand, der davor
       liegt – so verschwindet Sand hinter den vorderen Reihen. */
    for (var r = 0; r < ROWS.length; r++) {
      drawRow(ROWS[r], r);

      if (r === 1) {
        for (var d = 0; d < devils.length; d++) { drawDevil(devils[d], gust); }
      }
    }

    for (var i = 0; i < grains.length; i++) {
      var g = grains[i];
      ctx.fillStyle = "rgba(" + g.tone + ", " + g.alpha + ")";
      ctx.beginPath();
      ctx.ellipse(g.x, g.y, g.r * (1.5 + gust * 0.6), g.r, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    return gust;
  }

  function step(dt) {
    clock += dt;
    var gust = 1 + 0.5 * Math.sin(clock * 0.23) + 0.3 * Math.sin(clock * 0.71 + 1.3);

    for (var d = 0; d < devils.length; d++) {
      var dv = devils[d];
      dv.x += dv.speed * gust * dt;
      if (dv.x - dv.headW > width) { devils[d] = makeDevil(d, devils.length, false); }
    }

    for (var i = 0; i < grains.length; i++) {
      var g = grains[i];
      g.x += g.speed * gust * dt;
      g.wobble += g.wobbleSpeed * dt;
      g.y += (g.rise * dt) + Math.sin(g.wobble) * 7 * dt;
      if (g.x - g.r > width || g.y < height * 0.26) { grains[i] = makeGrain(false); }
    }
  }

  function frame(now) {
    if (!running) { return; }

    if (!lastTime) { lastTime = now; }
    var dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    step(dt);
    draw();

    window.requestAnimationFrame(frame);
  }

  function start() {
    if (!animate || running || !visible || document.hidden) { return; }
    running = true;
    lastTime = 0;
    window.requestAnimationFrame(frame);
  }

  function stop() { running = false; }

  function remeasure() {
    resize();
    if (running) { lastTime = 0; }
    /* Auch im Standbild-Betrieb muss die Szene nach einer Größenänderung
       neu gezeichnet werden. */
    if (!animate) { draw(); }
  }

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(remeasure, 150);
  });

  /* Beim ersten Aufbau kann der Canvas noch keine echte Breite haben, und
     ein window-resize käme in dem Fall nie. Der Observer schließt die Lücke. */
  if ("ResizeObserver" in window) {
    var observerSize = new ResizeObserver(function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(remeasure, 150);
    });
    observerSize.observe(canvas);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { stop(); } else { start(); }
  });

  resize();

  if (!animate) {
    /* Bei reduzierter Bewegung bleibt die Landschaft stehen – aber sie ist
       da, sonst wäre der Footer plötzlich leer. */
    draw();
    return;
  }

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) { start(); } else { stop(); }
    }, { threshold: 0 });
    observer.observe(canvas);
  } else {
    visible = true;
    start();
  }
})();
