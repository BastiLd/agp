/* ============================================================
   Social Media & Mathematik — Logik
   Folien-Navigation + 3 interaktive Simulatoren.
   Reines Vanilla-JS, keine externen Bibliotheken (offline-fähig).
   ============================================================ */
(function () {
  "use strict";

  const SVGNS = "http://www.w3.org/2000/svg";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const $id = (i) => document.getElementById(i);
  const svgEl = (t, a) => { const e = document.createElementNS(SVGNS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmt = (n, d) => new Intl.NumberFormat("de-DE", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }).format(n);
  const SUP = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
  const sup = (n) => String(n).split("").map((c) => SUP[c] || c).join("");
  const ZCOL = { bad: "#9c4f37", mid: "#b08a35", good: "#7c8240", top: "#4f6f3f" };

  function tween(from, to, dur, step, done) {
    const t0 = performance.now();
    (function f(now) {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      step(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(f); else if (done) done();
    })(performance.now());
  }
  function txt(s, x, y, str, anch) { const t = svgEl("text", { x: x, y: y, "font-size": "9", fill: "#5e4a2b", "text-anchor": anch || "start", "font-family": "Courier New, monospace" }); t.textContent = str; s.appendChild(t); return t; }
  const isFs = () => !!document.fullscreenElement;

  /* ========================================================
     FOLIEN-NAVIGATION
     ======================================================== */
  const slides = $$(".slide");
  const total = slides.length;
  const deck = $id("deck");
  let idx = 0;
  let lastShowT = 0;
  $id("total").textContent = total;

  const dotsWrap = $id("dots");
  slides.forEach((s, i) => {
    const d = document.createElement("i");
    d.className = "sec" + (s.dataset.section || 0);
    d.title = s.dataset.title || "";
    d.addEventListener("click", () => show(i));
    dotsWrap.appendChild(d);
  });
  const dots = $$("#dots i");

  let transTimer = 0, transTok = 0;
  function transOf(i) {                                  // wirksamer Übergang der Folie i
    let t = (perSlide[i] && perSlide[i].trans) || PS.transition || "fade";
    if (!(t in TRANS)) t = "fade";
    if (t === "random") t = TCAT[Math.floor(Math.random() * TCAT.length)] || "fade";
    return t;
  }
  function show(n) {
    const from = idx;
    const target = clamp(n, 0, total - 1);
    idx = target;
    const cur = slides[idx];
    const prev = slides[from];
    const fwd = target >= from;

    const now = performance.now();                       // schnelles Durchklicken erkennen
    const rapid = now - lastShowT < 300;
    deck.classList.toggle("rapid", rapid);
    lastShowT = now;

    // Übergang der HEREINkommenden Folie wählen (global oder pro Folie)
    const t = transOf(idx);
    TKEYS.forEach((k) => deck.classList.remove("t-" + k));
    deck.classList.add("t-" + t);
    deck.classList.toggle("dir-back", !fwd);
    deck.classList.toggle("dir-fwd", fwd);

    if (prev && prev !== cur) {
      // alte Folie bleibt deckend sichtbar (leaving), neue kommt oben drauf (active)
      slides.forEach((s) => { if (s !== cur && s !== prev) s.classList.remove("active", "leaving"); });
      prev.classList.add("leaving");
      prev.classList.remove("active");
      cur.classList.add("active");
      cur.classList.remove("leaving");
      const tok = ++transTok;
      const ms = (t === "none" || rapid) ? 0 : (PS.dur * 1000 + 90);
      clearTimeout(transTimer);
      transTimer = setTimeout(() => { if (tok === transTok) slides.forEach((s) => s.classList.remove("leaving")); }, ms);
    } else {
      slides.forEach((s, i) => { s.classList.toggle("active", i === idx); s.classList.remove("leaving"); });
    }

    dots.forEach((d, i) => d.classList.toggle("on", i === idx));
    $id("cur").textContent = idx + 1;
    onEnter(slides[idx]);
    if (typeof edOnShow === "function") edOnShow();
    if (typeof refreshSlideSettings === "function") refreshSlideSettings();
  }
  const next = () => { if (!isFs()) show(idx + 1); };
  const prev = () => { if (!isFs()) show(idx - 1); };
  $id("next").addEventListener("click", next);
  $id("prev").addEventListener("click", prev);

  document.addEventListener("keydown", (e) => {
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "select" || tag === "textarea") return;
    if (document.body.classList.contains("editing") || (e.target && e.target.isContentEditable)) return;
    if (isFs()) return;
    if (!$id("net3d").hidden) return;
    if (!$id("themeshop").hidden) { if (e.key === "Escape") $id("themeshop").hidden = true; return; }
    if (!$id("settings").hidden && e.key === "Escape") { toggleSettings(); return; }
    if (!$id("overview").hidden) { if (e.key === "Escape" || e.key === "o" || e.key === "O") toggleOverview(); return; }
    switch (e.key) {
      case "ArrowRight": case "PageDown": case " ": case "l": next(); e.preventDefault(); break;
      case "ArrowLeft": case "PageUp": case "h": prev(); e.preventDefault(); break;
      case "Home": show(0); break;
      case "End": show(total - 1); break;
      case "o": case "O": toggleOverview(); break;
    }
  });

  const ov = $id("overview");
  function buildOverview() {
    ov.innerHTML = "";
    slides.forEach((s, i) => {
      const c = document.createElement("div");
      c.className = "ov";
      c.innerHTML = "<b>" + (i + 1) + "</b><span>" + (s.dataset.title || "") + "</span>";
      c.addEventListener("click", () => { toggleOverview(); show(i); });
      ov.appendChild(c);
    });
  }
  function toggleOverview() { if (ov.hidden) { buildOverview(); ov.hidden = false; } else ov.hidden = true; }
  $id("overview-btn").addEventListener("click", toggleOverview);

  function onEnter(slide) {
    if (slide.querySelector("#er-gauge")) renderER(true);
    if (slide.querySelector("#ex-chart")) renderExp(true);
    if (slide.querySelector("#net-svg")) ensureGraph();
  }

  /* ---------- Vollbild ---------- */
  $$(".fs-btn").forEach((b) => b.addEventListener("click", () => {
    const slide = b.closest(".slide");
    if (isFs()) { if (document.exitFullscreen) document.exitFullscreen(); }
    else if (slide.requestFullscreen) slide.requestFullscreen();
  }));
  document.addEventListener("fullscreenchange", () => {
    const on = isFs();
    $$(".fs-btn").forEach((b) => b.textContent = on ? "⤧ Verlassen" : "⛶ Vollbild");
  });

  /* ========================================================
     PRÄSENTATIONS-EINSTELLUNGEN  (Schrift · Größe · Übergang)
     global & pro Folie · wird lokal gespeichert (offline)
     ======================================================== */
  const FONTS = {
    klassisch: '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,"Times New Roman",serif',
    georgia:   'Georgia,"Times New Roman",serif',
    times:     '"Times New Roman",Times,serif',
    modern:    '"Segoe UI",system-ui,-apple-system,Arial,sans-serif',
    rund:      'Verdana,"Trebuchet MS","Segoe UI",sans-serif',
    mono:      '"Courier New",Courier,monospace'
  };
  const FONTLABEL = { klassisch: "Klassisch (Serif)", georgia: "Georgia", times: "Times", modern: "Modern (Sans)", rund: "Rund (Verdana)", mono: "Schreibmaschine" };
  const TRANS = {
    fade:     "Sanft (Überblenden)",
    fast:     "Schnell",
    dissolve: "Auflösen",
    push:     "Schieben ↔ (Standard)",
    pushV:    "Schieben ↕",
    cover:    "Überdecken",
    uncover:  "Aufdecken",
    wipe:     "Wischen",
    zoomIn:   "Zoom hinein",
    zoomOut:  "Zoom heraus",
    flip:     "Drehen (3D)",
    cube:     "Würfel (3D)",
    swing:    "Schwung",
    rotate:   "Drehung",
    random:   "Zufällig 🎲",
    none:     "Kein Übergang"
  };
  const TKEYS = Object.keys(TRANS);                                  // alle t-* Klassen zum Entfernen
  const TCAT = TKEYS.filter((k) => k !== "random" && k !== "none");  // Auswahl für "Zufällig"
  const TLEGACY = { slide: "push", smooth: "fade" };                 // alte gespeicherte Werte migrieren
  const fixTrans = (t) => (t in TRANS ? t : (TLEGACY[t] || "fade"));
  const PSDEF = { font: "klassisch", size: 1, headSize: 1, letter: 0, headLetter: 0.03, ink: "#382a15", accent: "#9c6b1c", bg: 1, transition: "push", dur: 0.5, grain: 0.05, frame: true, anim: true, paper1: null, paper2: null, edge: null, themeId: "sepia" };
  let PS = Object.assign({}, PSDEF);
  let perSlide = {};

  // Farb-Helfer für Text-/Akzentfarbe & Hintergrund-Helligkeit
  const h2r = (h) => { h = (h || "").replace("#", ""); if (h.length === 3) h = h.split("").map((c) => c + c).join(""); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; };
  const r2h = (a) => "#" + a.map((v) => { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? "0" : "") + v.toString(16); }).join("");
  const lighten = (hex, t) => r2h(h2r(hex).map((v) => v + (255 - v) * t));
  const darken = (hex, t) => r2h(h2r(hex).map((v) => v * (1 - t)));
  const mulc = (hex, f) => r2h(h2r(hex).map((v) => v * f));
  const PAPER = { p1: "#d3c298", p2: "#c4b07f", edge: "#b39a63" };

  function loadPS() {
    try {
      const r = JSON.parse(localStorage.getItem("smm-prefs") || "{}");
      if (r.PS) PS = Object.assign({}, PSDEF, r.PS);
      if (r.perSlide) perSlide = r.perSlide;
      PS.transition = fixTrans(PS.transition);                       // alte Übergangs-Namen migrieren
      for (const k in perSlide) { if (perSlide[k] && perSlide[k].trans) perSlide[k].trans = fixTrans(perSlide[k].trans); }
    } catch (_) {}
  }
  function savePS() { try { localStorage.setItem("smm-prefs", JSON.stringify({ PS: PS, perSlide: perSlide })); } catch (_) {} }

  function applyPS() {
    const root = document.documentElement;
    root.style.setProperty("--serif", FONTS[PS.font] || FONTS.klassisch);
    root.style.setProperty("--ls", PS.letter + "em");
    root.style.setProperty("--head-scale", PS.headSize);
    root.style.setProperty("--head-ls", PS.headLetter + "em");
    root.style.setProperty("--ink", PS.ink);
    root.style.setProperty("--ink-soft", lighten(PS.ink, 0.28));
    root.style.setProperty("--accent", PS.accent);
    root.style.setProperty("--accent-bright", lighten(PS.accent, 0.18));
    root.style.setProperty("--accent-deep", darken(PS.accent, 0.22));
    root.style.setProperty("--paper-1", mulc(PS.paper1 || PAPER.p1, PS.bg));
    root.style.setProperty("--paper-2", mulc(PS.paper2 || PAPER.p2, PS.bg));
    root.style.setProperty("--paper-edge", mulc(PS.edge || PAPER.edge, PS.bg));
    deck.style.setProperty("--sdur", PS.dur + "s");
    root.style.setProperty("--grain", PS.grain);
    deck.classList.toggle("no-frame", !PS.frame);
    deck.classList.toggle("no-anim", !PS.anim);
    // Übergangs-Klasse (t-*) wird pro Folienwechsel in show() gesetzt (global oder pro Folie)
    slides.forEach((s, i) => {
      const o = perSlide[i] || {};
      const st = s.style;
      st.zoom = (o.size != null ? o.size : PS.size);
      st.fontFamily = o.font ? (FONTS[o.font] || "") : "";
      if (o.headSize != null) st.setProperty("--head-scale", o.headSize); else st.removeProperty("--head-scale");
      if (o.ink) { st.setProperty("--ink", o.ink); st.setProperty("--ink-soft", lighten(o.ink, 0.28)); } else { st.removeProperty("--ink"); st.removeProperty("--ink-soft"); }
      if (o.accent) { st.setProperty("--accent", o.accent); st.setProperty("--accent-bright", lighten(o.accent, 0.18)); st.setProperty("--accent-deep", darken(o.accent, 0.22)); } else { st.removeProperty("--accent"); st.removeProperty("--accent-bright"); st.removeProperty("--accent-deep"); }
      if (o.bg != null) { st.setProperty("--paper-1", mulc(PAPER.p1, o.bg)); st.setProperty("--paper-2", mulc(PAPER.p2, o.bg)); st.setProperty("--paper-edge", mulc(PAPER.edge, o.bg)); } else { st.removeProperty("--paper-1"); st.removeProperty("--paper-2"); st.removeProperty("--paper-edge"); }
    });
    savePS();
  }

  const setOv = $id("settings");
  let setBuilt = false;
  function optionList(map, sel) { return Object.keys(map).map((k) => "<option value='" + k + "'" + (k === sel ? " selected" : "") + ">" + map[k] + "</option>").join(""); }
  function buildSettings() {
    if (setBuilt) return;
    setOv.innerHTML =
      "<div class='set-head'><span>⚙ Einstellungen</span><button id='set-x' type='button' aria-label='schließen'>✕</button></div>" +
      "<button id='set-themeshop' type='button' class='set-btn shop-open'>🎨 Theme-Shop öffnen</button>" +
      "<div class='set-sec'>Allgemein (alle Folien)</div>" +
      "<label class='set-row'><span>Schriftart</span><select id='set-font'>" + optionList(FONTLABEL, PS.font) + "</select></label>" +
      "<label class='set-row'><span>Schriftgröße</span><output id='set-size-o'></output><input type='range' id='set-size' min='0.6' max='1.8' step='0.05'></label>" +
      "<label class='set-row'><span>Überschriften-Größe</span><output id='set-headsize-o'></output><input type='range' id='set-headsize' min='0.5' max='2' step='0.05'></label>" +
      "<label class='set-row'><span>Buchstaben-Abstand</span><output id='set-letter-o'></output><input type='range' id='set-letter' min='-0.02' max='0.16' step='0.005'></label>" +
      "<label class='set-row'><span>Überschriften-Abstand</span><output id='set-headletter-o'></output><input type='range' id='set-headletter' min='0' max='0.12' step='0.005'></label>" +
      "<label class='set-row'><span>Textfarbe</span><input type='color' id='set-ink'></label>" +
      "<label class='set-row'><span>Akzentfarbe</span><input type='color' id='set-accent'></label>" +
      "<label class='set-row'><span>Hintergrund-Helligkeit</span><output id='set-bg-o'></output><input type='range' id='set-bg' min='0.6' max='1.35' step='0.01'></label>" +
      "<label class='set-row'><span>Übergang (Standard)</span><select id='set-trans'>" + optionList(TRANS, PS.transition) + "</select></label>" +
      "<label class='set-row'><span>Übergangs-Tempo (s)</span><output id='set-dur-o'></output><input type='range' id='set-dur' min='0.05' max='1.2' step='0.05'></label>" +
      "<button id='set-trans-all' type='button' class='set-btn ghost'>↪ Diesen Übergang auf ALLE Folien anwenden</button>" +
      "<div class='set-sec'>Darstellung (alle Folien)</div>" +
      "<label class='set-row'><span>Papier-Körnung</span><output id='set-grain-o'></output><input type='range' id='set-grain' min='0' max='0.2' step='0.01'></label>" +
      "<label class='set-check'><input type='checkbox' id='set-frame'> Rahmen &amp; Eck-Ornamente</label>" +
      "<label class='set-check'><input type='checkbox' id='set-anim'> Einblende-Animationen</label>" +
      "<div class='set-sec'>Nur diese Folie <span id='set-slidenum'></span></div>" +
      "<label class='set-row'><span>Übergang dieser Folie</span><select id='set-strans'><option value=''>— wie Standard —</option>" + Object.keys(TRANS).map((k) => "<option value='" + k + "'>" + TRANS[k] + "</option>").join("") + "</select></label>" +
      "<label class='set-row'><span>Schriftart</span><select id='set-sfont'><option value=''>— wie Allgemein —</option>" + Object.keys(FONTLABEL).map((k) => "<option value='" + k + "'>" + FONTLABEL[k] + "</option>").join("") + "</select></label>" +
      "<label class='set-row'><span>Größe</span><output id='set-ssize-o'></output><input type='range' id='set-ssize' min='0.6' max='1.8' step='0.05'></label>" +
      "<label class='set-row'><span>Überschriften-Größe</span><output id='set-sheadsize-o'></output><input type='range' id='set-sheadsize' min='0.5' max='2' step='0.05'></label>" +
      "<label class='set-row'><span>Textfarbe</span><input type='color' id='set-sink'></label>" +
      "<label class='set-row'><span>Akzentfarbe</span><input type='color' id='set-saccent'></label>" +
      "<label class='set-row'><span>Hintergrund-Helligkeit</span><output id='set-sbg-o'></output><input type='range' id='set-sbg' min='0.6' max='1.35' step='0.01'></label>" +
      "<button id='set-sreset' type='button' class='set-btn ghost'>Diese Folie zurücksetzen</button>" +
      "<button id='set-reset' type='button' class='set-btn'>Alles auf Standard zurücksetzen</button>";

    $id("set-x").addEventListener("click", () => { setOv.hidden = true; });
    $id("set-themeshop").addEventListener("click", () => { setOv.hidden = true; toggleThemeShop(); });
    $id("set-font").addEventListener("change", (e) => { PS.font = e.target.value; applyPS(); });
    $id("set-trans").addEventListener("change", (e) => { PS.transition = e.target.value; applyPS(); });
    $id("set-trans-all").addEventListener("click", () => { for (const k in perSlide) { if (perSlide[k]) { delete perSlide[k].trans; cleanSlide(k); } } applyPS(); refreshSlideSettings(); });
    bindRange("set-size", "set-size-o", 2, (v) => { PS.size = v; applyPS(); });
    bindRange("set-headsize", "set-headsize-o", 2, (v) => { PS.headSize = v; applyPS(); });
    bindRange("set-letter", "set-letter-o", 3, (v) => { PS.letter = v; applyPS(); }, "em");
    bindRange("set-headletter", "set-headletter-o", 3, (v) => { PS.headLetter = v; applyPS(); }, "em");
    $id("set-ink").addEventListener("input", (e) => { PS.ink = e.target.value; applyPS(); });
    $id("set-accent").addEventListener("input", (e) => { PS.accent = e.target.value; applyPS(); });
    bindRange("set-bg", "set-bg-o", 2, (v) => { PS.bg = v; applyPS(); });
    bindRange("set-dur", "set-dur-o", 2, (v) => { PS.dur = v; applyPS(); }, "s");
    bindRange("set-grain", "set-grain-o", 2, (v) => { PS.grain = v; applyPS(); });
    $id("set-frame").addEventListener("change", (e) => { PS.frame = e.target.checked; applyPS(); });
    $id("set-anim").addEventListener("change", (e) => { PS.anim = e.target.checked; applyPS(); });
    $id("set-strans").addEventListener("change", (e) => { const o = perSlide[idx] || (perSlide[idx] = {}); if (e.target.value) o.trans = e.target.value; else delete o.trans; cleanSlide(idx); applyPS(); });
    $id("set-sfont").addEventListener("change", (e) => { const o = perSlide[idx] || (perSlide[idx] = {}); if (e.target.value) o.font = e.target.value; else delete o.font; cleanSlide(idx); applyPS(); });
    bindRange("set-ssize", "set-ssize-o", 2, (v) => { (perSlide[idx] || (perSlide[idx] = {})).size = v; applyPS(); });
    bindRange("set-sheadsize", "set-sheadsize-o", 2, (v) => { (perSlide[idx] || (perSlide[idx] = {})).headSize = v; applyPS(); });
    $id("set-sink").addEventListener("input", (e) => { (perSlide[idx] || (perSlide[idx] = {})).ink = e.target.value; applyPS(); });
    $id("set-saccent").addEventListener("input", (e) => { (perSlide[idx] || (perSlide[idx] = {})).accent = e.target.value; applyPS(); });
    bindRange("set-sbg", "set-sbg-o", 2, (v) => { (perSlide[idx] || (perSlide[idx] = {})).bg = v; applyPS(); });
    $id("set-sreset").addEventListener("click", () => { delete perSlide[idx]; applyPS(); refreshSlideSettings(); });
    $id("set-reset").addEventListener("click", () => { PS = Object.assign({}, PSDEF); perSlide = {}; applyPS(); syncSettings(); refreshSlideSettings(); });
    setBuilt = true;
  }
  function bindRange(id, outId, dec, fn, unit) {
    const inp = $id(id), out = $id(outId);
    inp.addEventListener("input", () => { const v = +inp.value; if (out) out.textContent = v.toFixed(dec) + (unit || ""); fn(v); });
  }
  function cleanSlide(i) { const o = perSlide[i]; if (o && !Object.keys(o).some((k) => o[k] != null)) delete perSlide[i]; }
  function syncSettings() {
    if (!setBuilt) return;
    $id("set-font").value = PS.font; $id("set-trans").value = PS.transition;
    $id("set-size").value = PS.size; $id("set-size-o").textContent = (+PS.size).toFixed(2);
    $id("set-headsize").value = PS.headSize; $id("set-headsize-o").textContent = (+PS.headSize).toFixed(2);
    $id("set-letter").value = PS.letter; $id("set-letter-o").textContent = (+PS.letter).toFixed(3) + "em";
    $id("set-headletter").value = PS.headLetter; $id("set-headletter-o").textContent = (+PS.headLetter).toFixed(3) + "em";
    $id("set-ink").value = PS.ink; $id("set-accent").value = PS.accent;
    $id("set-bg").value = PS.bg; $id("set-bg-o").textContent = (+PS.bg).toFixed(2);
    $id("set-dur").value = PS.dur; $id("set-dur-o").textContent = (+PS.dur).toFixed(2) + "s";
    $id("set-grain").value = PS.grain; $id("set-grain-o").textContent = (+PS.grain).toFixed(2);
    $id("set-frame").checked = !!PS.frame; $id("set-anim").checked = !!PS.anim;
  }
  function refreshSlideSettings() {
    if (!setBuilt) return;
    const o = perSlide[idx] || {};
    const num = $id("set-slidenum"); if (num) num.textContent = "(" + (idx + 1) + "/" + total + ")";
    const st = $id("set-strans"); if (st) st.value = o.trans || "";
    $id("set-sfont").value = o.font || "";
    const sz = (o.size != null ? o.size : PS.size);
    $id("set-ssize").value = sz; $id("set-ssize-o").textContent = (+sz).toFixed(2);
    const hs = (o.headSize != null ? o.headSize : PS.headSize);
    $id("set-sheadsize").value = hs; $id("set-sheadsize-o").textContent = (+hs).toFixed(2);
    $id("set-sink").value = (o.ink || PS.ink);
    $id("set-saccent").value = (o.accent || PS.accent);
    const bg = (o.bg != null ? o.bg : PS.bg);
    $id("set-sbg").value = bg; $id("set-sbg-o").textContent = (+bg).toFixed(2);
  }
  function toggleSettings() { buildSettings(); if (setOv.hidden) { syncSettings(); refreshSlideSettings(); setOv.hidden = false; } else setOv.hidden = true; }
  $id("settings-btn").addEventListener("click", toggleSettings);

  /* ========================================================
     THEME-SHOP  (kuratierte Komplett-Themes zum Durchblättern)
     ======================================================== */
  const THEMES_SHOP = [
    { id: "sepia",          name: "Sepia (Standard)", desc: "Originales Lehrbuch — Reset",              ink: "#382a15", accent: "#9c6b1c", paper1: "#d3c298", paper2: "#c4b07f", edge: "#b39a63", font: "klassisch" },
    { id: "sepia-klassik",  name: "Sepia Klassik",    desc: "Warmes Lehrbuch-Sepia, hell",              ink: "#3a2c1a", accent: "#9a5b2e", paper1: "#f3e3c6", paper2: "#e6cfa6", edge: "#b08a5a", font: "georgia" },
    { id: "pergament-hell", name: "Pergament Hell",   desc: "Lichtes Pergament, ruhig & luftig",        ink: "#403526", accent: "#a8742f", paper1: "#faf3e2", paper2: "#efe3c8", edge: "#c9b48a", font: "times" },
    { id: "salbeigruen",    name: "Salbeigrün",       desc: "Gedämpftes Botanik-Grün",                  ink: "#26352a", accent: "#5e7d4f", paper1: "#e7ecdc", paper2: "#d3ddc3", edge: "#8ba277", font: "klassisch" },
    { id: "taubenblau",     name: "Taubenblau",       desc: "Kühles, seriöses Blaugrau",                ink: "#22303a", accent: "#3f6b86", paper1: "#e2eaee", paper2: "#cddbe2", edge: "#7e9cab", font: "georgia" },
    { id: "altrosa",        name: "Rosé Altrosa",     desc: "Sanftes, warmes Altrosa",                  ink: "#3e2a2c", accent: "#a85d63", paper1: "#f5e4e2", paper2: "#ead0cd", edge: "#c69a99", font: "rund" },
    { id: "terrakotta",     name: "Terrakotta",       desc: "Erdiges, mediterranes Tonrot",             ink: "#3d271c", accent: "#b15a36", paper1: "#f4ddca", paper2: "#e7c3a6", edge: "#c08a64", font: "klassisch" },
    { id: "lavendel",       name: "Lavendel",         desc: "Blasses, nostalgisches Violett",           ink: "#2f2838", accent: "#6f5b94", paper1: "#ebe5f0", paper2: "#dad0e6", edge: "#a394bd", font: "modern" },
    { id: "newsprint-grau", name: "Zeitungsdruck",    desc: "Nüchternes Zeitungspapier-Grau",           ink: "#2b2826", accent: "#7a6f60", paper1: "#eceae4", paper2: "#dcd8cf", edge: "#a9a399", font: "mono" },
    { id: "mintgruen",      name: "Mintgrün",         desc: "Frisches Vintage-Mint",                    ink: "#1f3531", accent: "#3f8a72", paper1: "#e1efe8", paper2: "#cce3d8", edge: "#84b6a3", font: "rund" },
    { id: "warmes-kupfer",  name: "Warmes Kupfer",    desc: "Glühendes Kupfergold, kontrastreich",      ink: "#3a2415", accent: "#b06a25", paper1: "#f4e1c4", paper2: "#e8c79b", edge: "#c2935a", font: "georgia" }
  ];
  const shopOv = $id("themeshop");
  function markActiveTheme(id) { if (shopOv) $$(".theme-card", shopOv).forEach((c) => c.classList.toggle("active", c.dataset.id === id)); }
  function applyTheme(t) {
    PS.ink = t.ink; PS.accent = t.accent; PS.paper1 = t.paper1; PS.paper2 = t.paper2; PS.edge = t.edge; if (t.font) PS.font = t.font; PS.themeId = t.id;
    applyPS(); if (typeof syncSettings === "function") syncSettings(); markActiveTheme(t.id);
  }
  let shopBuilt = false;
  function buildThemeShop() {
    if (shopBuilt || !shopOv) return;
    let html = "<div class='shop-head'><span>🎨 Theme-Shop</span><button id='shop-x' type='button' aria-label='schließen'>✕</button></div>" +
      "<p class='shop-intro'>Theme antippen = sofort übernehmen. Feinheiten danach unter ⚙ Einstellungen.</p><div class='shop-grid'>";
    THEMES_SHOP.forEach((t) => {
      html += "<button class='theme-card' type='button' data-id='" + t.id + "' style='background:linear-gradient(160deg," + t.paper1 + "," + t.paper2 + ");border-color:" + t.edge + "'>" +
        "<span class='tc-top'><span class='tc-aa' style='color:" + t.ink + "'>Aa</span><span class='tc-dot' style='background:" + t.accent + "'></span></span>" +
        "<span class='tc-name' style='color:" + t.ink + "'>" + t.name + "</span>" +
        "<span class='tc-desc' style='color:" + t.ink + "'>" + t.desc + "</span></button>";
    });
    html += "</div>";
    shopOv.innerHTML = html;
    $id("shop-x").addEventListener("click", () => { shopOv.hidden = true; });
    $$(".theme-card", shopOv).forEach((c) => c.addEventListener("click", () => { const t = THEMES_SHOP.filter((x) => x.id === c.dataset.id)[0]; if (t) applyTheme(t); }));
    shopBuilt = true;
  }
  function toggleThemeShop() { buildThemeShop(); if (shopOv.hidden) { markActiveTheme(PS.themeId || ""); shopOv.hidden = false; } else shopOv.hidden = true; }

  /* ========================================================
     SIMULATOR 1 — ENGAGEMENT-RATE  (3 Methoden)
     ======================================================== */
  const erIn = { L: $id("er-likes"), K: $id("er-komm"), S: $id("er-share"), F: $id("er-foll") };
  let erMethod = "weighted";   // simple | weighted | avg
  let erChartMode = "weight";  // weight | platform | curve | all
  let avgPosts = [2, 3, 5];
  let gaugeNeedle, gaugeVal = 0;

  function rate(v) { if (v < 1) return ["schwach", "bad"]; if (v < 3) return ["durchschnittlich", "mid"]; if (v < 6) return ["gut", "good"]; return ["sehr gut", "top"]; }

  const G = { cx: 100, cy: 110, R: 82, max: 12 };
  function gPt(v, r) { const a = Math.PI * (1 - clamp(v, 0, G.max) / G.max); return [G.cx + r * Math.cos(a), G.cy - r * Math.sin(a)]; }
  function gArc(v1, v2, col) { const [x1, y1] = gPt(v1, G.R), [x2, y2] = gPt(v2, G.R); return svgEl("path", { d: `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${G.R} ${G.R} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`, fill: "none", stroke: col, "stroke-width": 13 }); }
  function buildGauge() {
    const host = $id("er-gauge"); if (!host || host.dataset.built) return;
    const s = svgEl("svg", { viewBox: "0 0 200 126" });
    s.appendChild(gArc(0, 1, ZCOL.bad)); s.appendChild(gArc(1, 3, ZCOL.mid)); s.appendChild(gArc(3, 6, ZCOL.good)); s.appendChild(gArc(6, 12, ZCOL.top));
    [0, 3, 6, 9, 12].forEach((v) => { const [tx, ty] = gPt(v, G.R - 22); txt(s, tx, ty + 4, v, "middle"); });
    gaugeNeedle = svgEl("line", { x1: G.cx, y1: G.cy, x2: G.cx, y2: G.cy - (G.R - 18), stroke: "#382a15", "stroke-width": 3, "stroke-linecap": "round" });
    s.appendChild(gaugeNeedle); s.appendChild(svgEl("circle", { cx: G.cx, cy: G.cy, r: 6, fill: "#382a15" }));
    host.appendChild(s); host.dataset.built = "1";
  }
  function setGauge(v, animate) {
    if (animate) { gaugeVal = 0; gaugeNeedle.setAttribute("x2", G.cx); gaugeNeedle.setAttribute("y2", G.cy - (G.R - 18)); }
    tween(gaugeVal, v, 650, (val) => { gaugeVal = val; const [x, y] = gPt(val, G.R - 18); gaugeNeedle.setAttribute("x2", x.toFixed(1)); gaugeNeedle.setAttribute("y2", y.toFixed(1)); });
  }

  function buildAvgList() {
    $id("er-avg-list").innerHTML = avgPosts.map((v, i) =>
      "<div class='avg-row'><label>Beitrag " + (i + 1) + "</label><input type='number' min='0' step='0.1' value='" + v + "' data-i='" + i + "' /><span class='unit'>%</span></div>").join("");
  }

  function renderER(animate) {
    buildGauge();
    $id("er-single").hidden = (erMethod === "avg");
    $id("er-avg").hidden = (erMethod !== "avg");
    const toggle = $(".chart-toggle");

    if (erMethod === "avg") {
      toggle.style.display = "none";
      const posts = avgPosts.slice();
      const avg = posts.length ? posts.reduce((s, v) => s + v, 0) / posts.length : 0;
      $id("er-head").textContent = "Durchschnittliche ER";
      $id("er-value").innerHTML = fmt(avg, 2) + "<span>%</span>";
      const [label, zone] = rate(avg); const badge = $id("er-rating"); badge.textContent = label; badge.style.background = ZCOL[zone];
      $id("er-subline").innerHTML = "über <b>" + posts.length + "</b> Beiträge";
      setGauge(avg, animate);
      $id("er-table").innerHTML = "<tr><th>Beitrag</th><th>ER</th></tr>" +
        posts.map((v, i) => "<tr><td>Beitrag " + (i + 1) + "</td><td>" + fmt(v, 2) + " %</td></tr>").join("") +
        "<tr class='hot'><td>Durchschnitt</td><td>" + fmt(avg, 2) + " %</td></tr>";
      const box = $id("er-chart"); box.classList.remove("all");
      const scale = Math.max(avg, Math.max.apply(null, posts.concat(6))) * 1.1;
      box.innerHTML = "<div style='width:100%'>" + posts.map((v, i) =>
        "<div class='bar-row'><span class='bl'>Beitrag " + (i + 1) + "</span><span class='bar-track'><span class='bar-fill' data-w='" + (v / scale * 100) + "' style='background:" + ZCOL[rate(v)[1]] + "'></span></span><span class='bv'>" + fmt(v, 1) + " %</span></div>").join("") +
        "<div class='bar-row'><span class='bl'>Ø</span><span class='bar-track'><span class='bar-fill' data-w='" + (avg / scale * 100) + "' style='background:" + ZCOL.top + "'></span></span><span class='bv'>" + fmt(avg, 2) + " %</span></div></div>";
      requestAnimationFrame(() => { $$(".bar-fill", box).forEach((b) => { b.style.width = b.dataset.w + "%"; }); });
      $id("er-chart-cap").textContent = "Durchschnitt aus " + posts.length + " Beiträgen (Summe ÷ Anzahl).";
      return;
    }

    toggle.style.display = "flex";
    const L = +erIn.L.value, K = +erIn.K.value, S = +erIn.S.value, F = +erIn.F.value;
    $id("er-likes-out").textContent = fmt(L); $id("er-komm-out").textContent = fmt(K);
    $id("er-share-out").textContent = fmt(S); $id("er-foll-out").textContent = fmt(F);

    const totalI = L + K + S, simple = totalI / F * 100;
    const lE = L / F * 100, kE = K / F * 100, sE = S / F * 100;
    const weighted = (lE * 2 + kE * 5 + sE * 10) / 3;
    const headVal = erMethod === "simple" ? simple : weighted;

    $id("er-head").innerHTML = erMethod === "simple" ? "Einfache ER" : "Gewichtete ER <span class='tag-best'>genaueste Methode</span>";
    $id("er-value").innerHTML = fmt(headVal, 2) + "<span>%</span>";
    const [label, zone] = rate(headVal); const badge = $id("er-rating"); badge.textContent = label; badge.style.background = ZCOL[zone];
    $id("er-subline").innerHTML = erMethod === "simple"
      ? "Gewichtete ER: <b>" + fmt(weighted, 2) + " %</b>"
      : "Einfache ER: <b>" + fmt(simple, 1) + " %</b>";
    setGauge(headVal, animate);

    $id("er-table").innerHTML = "<tr><th>Kennzahl</th><th>Wert</th></tr>" +
      rowER("Like-ER (×2)", lE) + rowER("Kommentar-ER (×5)", kE) + rowER("Share-ER (×10)", sE) +
      rowER("Einfache ER", simple, erMethod === "simple") + rowER("Gewichtete ER", weighted, erMethod === "weighted");

    renderERChart({ simple, total: totalI, F, lE, kE, sE, weighted });
    function rowER(n, v, hot) { return "<tr class='" + (hot ? "hot" : "") + "'><td>" + n + "</td><td>" + fmt(v, 2) + " %</td></tr>"; }
  }

  function chartWeight(box, d) {
    const cL = d.lE * 2 / 3, cK = d.kE * 5 / 3, cS = d.sE * 10 / 3, sum = d.weighted || 1;
    const parts = [["Likes ×2", cL, ZCOL.mid], ["Kommentare ×5", cK, ZCOL.good], ["Shares ×10", cS, ZCOL.top]];
    box.innerHTML = "<div style='width:100%'><div class='stack'>" +
      parts.map((p) => "<span class='seg' style='background:" + p[2] + "' data-w='" + (p[1] / sum * 100) + "'></span>").join("") +
      "</div><div class='legend'>" + parts.map((p) => "<span><i style='background:" + p[2] + "'></i>" + p[0] + ": " + fmt(p[1], 2) + " %</span>").join("") + "</div></div>";
    requestAnimationFrame(() => { $$(".seg", box).forEach((s) => { s.style.width = s.dataset.w + "%"; }); });
  }
  function chartPlatform(box, d) {
    const data = [["Dein Post", d.simple], ["TikTok", 7.5], ["Instagram", 3.5], ["Facebook", 1.5]];
    const scale = Math.max(d.simple, 10) * 1.08;
    box.innerHTML = "<div style='width:100%'>" + data.map((p) =>
      "<div class='bar-row'><span class='bl'>" + p[0] + "</span><span class='bar-track'><span class='bar-fill' data-w='" + (p[1] / scale * 100) + "' style='background:" + ZCOL[rate(p[1])[1]] + "'></span></span><span class='bv'>" + fmt(p[1], 1) + " %</span></div>").join("") + "</div>";
    requestAnimationFrame(() => { $$(".bar-fill", box).forEach((b) => { b.style.width = b.dataset.w + "%"; }); });
  }
  function chartCurve(box, d) {
    const F = d.F, total = d.total, Fmin = Math.max(100, F / 5), Fmax = F * 3;
    const W = 420, H = 180, ml = 46, mr = 14, mt = 14, mb = 30;
    const er = (f) => total / f * 100, ymax = er(Fmin) * 1.05 || 1;   // Guard: 0 Interaktionen → kein NaN (0/0)
    const X = (f) => ml + (f - Fmin) / (Fmax - Fmin) * (W - ml - mr);
    const Y = (y) => H - mb - clamp(y / ymax, 0, 1) * (H - mt - mb);
    let path = "";
    for (let i = 0; i <= 60; i++) { const f = Fmin + (Fmax - Fmin) * i / 60; path += (i ? "L" : "M") + X(f).toFixed(1) + " " + Y(er(f)).toFixed(1) + " "; }
    const s = svgEl("svg", { viewBox: "0 0 " + W + " " + H });
    s.appendChild(svgEl("line", { x1: ml, y1: H - mb, x2: W - mr, y2: H - mb, stroke: "#a98f5e", "stroke-width": 1 }));
    s.appendChild(svgEl("line", { x1: ml, y1: mt, x2: ml, y2: H - mb, stroke: "#a98f5e", "stroke-width": 1 }));
    s.appendChild(svgEl("path", { d: path, fill: "none", stroke: ZCOL.good, "stroke-width": 2.6 }));
    const px = X(F), py = Y(er(F));
    s.appendChild(svgEl("line", { x1: px, y1: py, x2: px, y2: H - mb, stroke: "#6e4717", "stroke-width": 1, "stroke-dasharray": "3 3" }));
    s.appendChild(svgEl("circle", { cx: px, cy: py, r: 5, fill: "#6e4717" }));
    const lab = txt(s, clamp(px, ml, W - 60), Math.max(mt + 10, py - 8), fmt(er(F), 1) + " %", "start"); lab.setAttribute("fill", "#382a15"); lab.setAttribute("font-size", "11");
    txt(s, ml - 6, mt + 6, fmt(ymax, 0) + "%", "end");
    txt(s, ml, H - mb + 14, fmt(Fmin, 0), "start");
    txt(s, W - mr, H - mb + 14, fmt(Fmax, 0), "end");
    box.innerHTML = ""; box.appendChild(s);
  }
  function renderERChart(d) {
    const box = $id("er-chart"), cap = $id("er-chart-cap");
    box.classList.toggle("all", erChartMode === "all");
    if (erChartMode === "all") {
      box.innerHTML = "<div class='subchart'><h4>Gewichtung</h4><div></div></div><div class='subchart'><h4>Plattform</h4><div></div></div><div class='subchart'><h4>ER / Follower</h4><div></div></div>";
      const subs = $$(".subchart > div", box);
      chartWeight(subs[0], d); chartPlatform(subs[1], d); chartCurve(subs[2], d);
      cap.textContent = "Alle drei Auswertungen gleichzeitig.";
    } else if (erChartMode === "weight") { chartWeight(box, d); cap.textContent = "Woraus die gewichtete ER besteht – Shares (×10) wiegen am schwersten."; }
    else if (erChartMode === "platform") { chartPlatform(box, d); cap.textContent = "Einfache ER deines Posts neben typischen Plattform-Werten."; }
    else { chartCurve(box, d); cap.textContent = "Gleiche Interaktionen, mehr Follower → kleinere ER (kleine Accounts oft höher)."; }
  }

  Object.values(erIn).forEach((el) => el.addEventListener("input", () => renderER(false)));
  $$(".presets button[data-er]").forEach((b) => b.addEventListener("click", () => {
    const [L, K, S, F] = b.dataset.er.split(",").map(Number);
    erIn.L.value = L; erIn.K.value = K; erIn.S.value = S; erIn.F.value = F; renderER(true);
  }));
  $$(".chart-toggle button").forEach((b) => b.addEventListener("click", () => {
    $$(".chart-toggle button").forEach((x) => x.classList.remove("active"));
    b.classList.add("active"); erChartMode = b.dataset.chart; renderER(false);
  }));
  $$(".method-toggle button").forEach((b) => b.addEventListener("click", () => {
    $$(".method-toggle button").forEach((x) => x.classList.remove("active"));
    b.classList.add("active"); erMethod = b.dataset.method; renderER(true);
  }));
  $id("er-avg-list").addEventListener("input", (e) => { const i = +e.target.dataset.i; if (!isNaN(i)) { avgPosts[i] = +e.target.value || 0; renderER(false); } });
  $id("er-avg-add").addEventListener("click", () => { if (avgPosts.length < 8) { avgPosts.push(3); buildAvgList(); renderER(false); } });
  $id("er-avg-del").addEventListener("click", () => { if (avgPosts.length > 2) { avgPosts.pop(); buildAvgList(); renderER(false); } });

  /* ========================================================
     SIMULATOR 2 — NETZWERK / GRAPH
     ======================================================== */
  const NET0 = { Anna: [110, 100], Clara: [275, 78], Emma: [435, 120], Ben: [120, 285], David: [300, 290], Felix: [445, 315] };
  const EDGES0 = [["Anna", "Ben"], ["Anna", "Clara"], ["Clara", "David"], ["Clara", "Emma"], ["Ben", "David"], ["Emma", "Felix"]];
  // ---- Lektionen fürs 3D-Studio (Arbeitsblatt „Netzwerkanalyse"). „beispiel1" = das editierbare 2D-Netz. ----
  const LESSONS = {
    beispiel1: { label: "Beispiel 1 (Arbeitsblatt)", live: true,
      desc: "Das Unterrichts-Netz vom Blatt: Anna–Ben, Anna–Clara, Clara–David, Clara–Emma, Ben–David, Emma–Felix. (Im 2D-Bereich editierbar.)" },
    influencer: { label: "Grad & Influencer",
      desc: "Mia hat den höchsten Grad → der Influencer. Passt zu „Grad eines Knotens“ & „Influencer finden“.",
      names: ["Mia", "Anna", "Ben", "Clara", "David", "Emma", "Felix", "Greta"],
      edges: [["Mia", "Anna"], ["Mia", "Ben"], ["Mia", "Clara"], ["Mia", "David"], ["Mia", "Emma"], ["Mia", "Felix"], ["Mia", "Greta"], ["Anna", "Ben"], ["Emma", "Felix"]] },
    gruppen: { label: "Zwei Gruppen verbinden",
      desc: "Zwei Freundeskreise, durch eine einzige Brücke (Clara–David) verbunden. Passt zu „Netzwerk verbinden“ & Cluster.",
      names: ["Anna", "Ben", "Clara", "David", "Emma", "Felix"],
      edges: [["Anna", "Ben"], ["Ben", "Clara"], ["Anna", "Clara"], ["David", "Emma"], ["Emma", "Felix"], ["David", "Felix"], ["Clara", "David"]] },
    kette: { label: "Wege & Distanz",
      desc: "Eine längere Kette mit einer Abkürzung (Ben–Emma) – zum Üben kürzester Wege & Distanz.",
      names: ["Anna", "Ben", "Clara", "David", "Emma", "Felix", "Greta"],
      edges: [["Anna", "Ben"], ["Ben", "Clara"], ["Clara", "David"], ["David", "Emma"], ["Emma", "Felix"], ["Felix", "Greta"], ["Ben", "Emma"]] }
  };
  let lessonKey = "beispiel1";
  const POOL = ["Greta", "Hannes", "Ida", "Jonas", "Lea", "Mia", "Noah", "Ole"];
  let nodes = {}, edges = new Set(), edgeLayer, nodeLayer, pathState = null, netBuilt = false;
  let connectMode = false, selNode = null, addedCount = 0, pathToken = 0;
  const eKey = (a, b) => [a, b].sort().join("|");
  const ensureGraph = () => { if (!netBuilt) buildGraph(); };

  function buildGraph() {
    const svg = $id("net-svg"); svg.innerHTML = "";
    edgeLayer = svgEl("g", {}); nodeLayer = svgEl("g", {});
    svg.appendChild(edgeLayer); svg.appendChild(nodeLayer);
    nodes = {}; edges = new Set(); pathState = null; connectMode = false; selNode = null; addedCount = 0;
    Object.keys(NET0).forEach((name) => createNode(name, NET0[name][0], NET0[name][1]));
    EDGES0.forEach((e) => edges.add(eKey(e[0], e[1])));
    $id("net-connect").classList.remove("on");
    renderEdges(); populateSelects(); positionAll(); updateStats(); setTip();
    netBuilt = true;
  }
  function createNode(name, x, y) {
    const g = svgEl("g", { class: "net-node" });
    g.appendChild(svgEl("circle", { r: 26 }));
    const t = svgEl("text", {}); t.textContent = name; g.appendChild(t);
    nodeLayer.appendChild(g);
    nodes[name] = { x: x, y: y, g: g };
    addDrag(name);
  }
  function setLineCoords(ln, a, b) { ln.setAttribute("x1", nodes[a].x); ln.setAttribute("y1", nodes[a].y); ln.setAttribute("x2", nodes[b].x); ln.setAttribute("y2", nodes[b].y); }

  function renderEdges() {
    clearPath();
    edgeLayer.innerHTML = "";
    edges.forEach((key) => {
      const ln = svgEl("line", { class: "net-edge", "data-key": key });
      ln.addEventListener("click", () => { edges.delete(key); pathState = null; renderEdges(); updateStats(); });
      edgeLayer.appendChild(ln);
    });
    positionAll();
  }
  function positionAll() {
    Object.keys(nodes).forEach((n) => { const o = nodes[n]; o.g.setAttribute("transform", "translate(" + o.x + "," + o.y + ")"); });
    $$(".net-edge", edgeLayer).forEach((ln) => { const k = ln.dataset.key.split("|"); setLineCoords(ln, k[0], k[1]); });
    $$(".net-path-anim", edgeLayer).forEach((ln) => setLineCoords(ln, ln.dataset.a, ln.dataset.b));
  }

  function clientToSvg(svg, cx, cy) { const p = svg.createSVGPoint(); p.x = cx; p.y = cy; return p.matrixTransform(svg.getScreenCTM().inverse()); }
  function addDrag(name) {
    const o = nodes[name], svg = $id("net-svg");
    let dragging = false, moved = false, sx = 0, sy = 0;
    o.g.addEventListener("pointerdown", (e) => { dragging = true; moved = false; sx = e.clientX; sy = e.clientY; try { o.g.setPointerCapture(e.pointerId); } catch (_) {} o.g.style.cursor = "grabbing"; });
    o.g.addEventListener("pointermove", (e) => { if (!dragging) return; if (Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) > 4) moved = true; const p = clientToSvg(svg, e.clientX, e.clientY); o.x = clamp(p.x, 28, 492); o.y = clamp(p.y, 28, 392); positionAll(); });
    o.g.addEventListener("pointerup", () => { dragging = false; o.g.style.cursor = "grab"; if (!moved) onNodeClick(name); });
  }
  function onNodeClick(name) {
    if (!connectMode) return;
    if (!selNode) { selNode = name; nodes[name].g.classList.add("sel"); setTip("Wähle die <b>zweite</b> Person …"); return; }
    if (selNode === name) { nodes[name].g.classList.remove("sel"); selNode = null; setTip(); return; }
    const k = eKey(selNode, name), removed = edges.has(k);
    if (removed) edges.delete(k); else edges.add(k);
    nodes[selNode].g.classList.remove("sel"); selNode = null; pathState = null;
    renderEdges(); updateStats();
    setTip((removed ? "Verbindung getrennt." : "Verbindung erstellt.") + " Weiter klicken oder Modus ausschalten.");
  }
  function setTip(html) {
    const t = $id("net-tip");
    if (html) { t.innerHTML = html; return; }
    t.innerHTML = connectMode ? "Verbindungs-Modus: zwei Personen anklicken = verbinden <b>oder trennen</b>." : "Tipp: Knoten ziehen · Kante anklicken = entfernen";
  }
  function populateSelects() {
    const names = Object.keys(nodes);
    ["net-from", "net-to"].forEach((id, i) => {
      const sel = $id(id), cur = sel.value;
      sel.innerHTML = names.map((n) => "<option>" + n + "</option>").join("");
      sel.value = names.indexOf(cur) >= 0 ? cur : (i === 0 ? "Anna" : "Felix");
    });
  }
  function degrees() { const d = {}; Object.keys(nodes).forEach((n) => d[n] = 0); edges.forEach((k) => { const p = k.split("|"); d[p[0]]++; d[p[1]]++; }); return d; }
  function adjacency() { const a = {}; Object.keys(nodes).forEach((n) => a[n] = []); edges.forEach((k) => { const p = k.split("|"); a[p[0]].push(p[1]); a[p[1]].push(p[0]); }); return a; }

  function updateStats() {
    const N = Object.keys(nodes).length, E = edges.size, deg = degrees();
    const avg = N ? (2 * E / N) : 0;
    $id("net-nodes").textContent = N; $id("net-edges").textContent = E; $id("net-avg").textContent = fmt(avg, 2);
    $id("net-avg-calc").textContent = "2·" + E + " / " + N + " = " + fmt(avg, 2);
    const maxDeg = Math.max.apply(null, Object.values(deg).concat(0));
    const sorted = Object.keys(deg).sort((a, b) => deg[b] - deg[a] || a.localeCompare(b));
    $id("net-table").innerHTML = "<tr><th>Person</th><th>Grad</th></tr>" +
      sorted.map((n) => "<tr class='" + (deg[n] === maxDeg && maxDeg > 0 ? "hot" : "") + "'><td>" + n + "</td><td>" + deg[n] + "</td></tr>").join("");
    Object.keys(nodes).forEach((n) => nodes[n].g.classList.toggle("hot", deg[n] === maxDeg && maxDeg > 0));
    $id("net-benemma").textContent = edges.has(eKey("Ben", "Emma")) ? "Ben–Emma weg" : "Ben–Emma";
  }

  // FIX BUG 3: Dijkstra mit euklidischen Kantengewichten – kürzester Weg nach echter
  // Layout-Distanz (wie Google Maps), nicht mehr nur nach minimaler Kantenanzahl (BFS).
  function dijkstra(start, goal) {
    if (!nodes[start] || !nodes[goal]) return null;
    const adj = adjacency(), dist = {}, prev = {}, visited = {};
    Object.keys(nodes).forEach((n) => { dist[n] = Infinity; });
    dist[start] = 0;
    // MinHeap-Ersatz: sortiertes Array (für die kleinen Lektions-Graphen völlig ausreichend)
    const queue = [{ n: start, d: 0 }];
    while (queue.length) {
      queue.sort((a, b) => a.d - b.d);
      const u = queue.shift().n;
      if (visited[u]) continue;
      visited[u] = 1;
      if (u === goal) break;
      (adj[u] || []).forEach((v) => {
        const w = Math.hypot(nodes[u].x - nodes[v].x, nodes[u].y - nodes[v].y);
        const alt = dist[u] + w;
        if (alt < dist[v]) { dist[v] = alt; prev[v] = u; queue.push({ n: v, d: alt }); }
      });
    }
    if (dist[goal] === Infinity) return null;
    const path = []; let x = goal;
    while (x !== undefined) { path.unshift(x); x = prev[x]; }
    return path[0] === start ? path : null;
  }
  function clearPath() {
    pathToken++;
    if (edgeLayer) $$(".net-path-anim", edgeLayer).forEach((l) => l.remove());
    Object.keys(nodes).forEach((n) => nodes[n].g.classList.remove("path"));
  }
  function drawSeg(a, b) { const ln = svgEl("line", { class: "net-path-anim", "data-a": a, "data-b": b, stroke: ZCOL.top, "stroke-width": 6, "stroke-linecap": "round" }); setLineCoords(ln, a, b); edgeLayer.appendChild(ln); return ln; }
  function showPath(animated) {
    clearPath();
    const token = pathToken;
    if (!pathState || pathState.length === 0) return;
    nodes[pathState[0]].g.classList.add("path");
    if (pathState.length === 1) return;
    if (!animated) { for (let i = 0; i < pathState.length - 1; i++) { drawSeg(pathState[i], pathState[i + 1]); nodes[pathState[i + 1]].g.classList.add("path"); } return; }
    const SPEED = 0.3; // Pixel pro Millisekunde – konstante Geschwindigkeit
    let i = 0;
    (function seg() {
      if (token !== pathToken || i >= pathState.length - 1) return;
      const a = pathState[i], b = pathState[i + 1], ln = drawSeg(a, b);
      const len = Math.max(1, Math.hypot(nodes[b].x - nodes[a].x, nodes[b].y - nodes[a].y));
      ln.style.strokeDasharray = len; ln.style.strokeDashoffset = len;
      tween(len, 0, len / SPEED, (v) => { if (token === pathToken) ln.style.strokeDashoffset = String(v); }, () => { if (token !== pathToken) return; ln.style.strokeDasharray = "none"; ln.style.strokeDashoffset = "0"; nodes[b].g.classList.add("path"); i++; seg(); });
    })();
  }
  function computePath() {
    const a = $id("net-from").value, b = $id("net-to").value;
    if (a === b) { pathState = [a]; showPath(false); $id("net-path-cap").textContent = "Start und Ziel sind gleich – 0 Schritte."; return; }
    const p = dijkstra(a, b);   // FIX BUG 3: echte Distanz statt nur Kantenanzahl
    if (!p) { pathState = null; clearPath(); $id("net-path-cap").textContent = "Kein Weg von " + a + " zu " + b + " vorhanden!"; return; }
    pathState = p; showPath(true);
    $id("net-path-cap").textContent = "Kürzester Weg " + a + " → " + b + ": " + p.join(" → ") + " (" + (p.length - 1) + " Schritte).";
  }

  $id("net-connect").addEventListener("click", () => { connectMode = !connectMode; $id("net-connect").classList.toggle("on", connectMode); if (selNode) { nodes[selNode].g.classList.remove("sel"); selNode = null; } setTip(); });
  $id("net-addnode").addEventListener("click", () => {
    if (addedCount >= POOL.length) { setTip("Mehr Personen sind im Beispiel nicht vorgesehen."); return; }
    const name = POOL[addedCount++];
    createNode(name, 250 + (addedCount % 3) * 30 - 30, 175 + (addedCount % 2) * 45);
    populateSelects(); positionAll(); updateStats();
    setTip(name + " hinzugefügt – im Verbindungs-Modus verbinden.");
  });
  $id("net-benemma").addEventListener("click", () => { const k = eKey("Ben", "Emma"); if (edges.has(k)) edges.delete(k); else edges.add(k); pathState = null; renderEdges(); updateStats(); });
  $id("net-reset").addEventListener("click", () => { netBuilt = false; buildGraph(); $id("net-path-cap").textContent = "„Influencer“ = höchster Grad. Weg-Button zeigt den kürzesten Pfad."; });
  $id("net-path").addEventListener("click", computePath);
  $id("net-from").addEventListener("change", () => { if (pathState) computePath(); });
  $id("net-to").addEventListener("change", () => { if (pathState) computePath(); });

  /* ---------- 3D-Ansicht des Netzwerks (eigener Canvas-Renderer, offline) ---------- */
  (function () {
    const ov = $id("net3d"), cv = $id("net3d-canvas");
    if (!ov || !cv) return;
    let R = null;   // THREE_NET (WebGL) – wird beim Öffnen erzeugt
    let names = [], elist = [], P = {}, hot = {}, deg = {}, maxDeg = 0, layoutR = 150;
    let pathEdges = {}, pathNodes = {};     // kürzester Weg (aus dem 2D-Graph) für 3D-Markierung
    let rotX = -0.35, rotY = 0.5, zoom = 1, panX = 0, panY = 0;
    let spinning = true, dragging = false, dragMode = "rotate", lx = 0, ly = 0, raf = 0;
    let velX = 0, velY = 0;                 // Schwung / Inertia nach dem Loslassen
    let theme = "dark", flyMode = false;    // umschaltbarer Look + Flug-Modus (WASD)
    const cam = { x: 0, y: 0, z: 0 };        // Kamera-Versatz (Flug-Modus)
    const keys = new Set();                  // gedrückte WASD/QE-Tasten
    const pointers = new Map();              // aktive Zeiger (für Pinch-Zoom)
    let pinchDist = 0, pinchMid = null;

    // Hinweis: Gezeichnet wird ausschließlich über THREE_NET (WebGL). Der frühere
    // Canvas-2D-Renderer (draw/project/fitScale + Farb-Helfer) wurde entfernt – er war
    // toter Code (nie aufgerufen, referenzierte ein nie definiertes „ctx").

    // Zwei umschaltbare Looks – „dark" (atmosphärisch) und „paper" (Vintage, passt zur Präsentation)
    const THEMES = {
      dark:  { bg: ["#43331b", "#271c0e", "#140d06"], eC1: "#5c3a12", eC2: "#d6b878", eAbase: 0.30, eAmul: 0.55, fog: "#160f07", nHot: "#d99e28", nBase: "#cdbb90", hi: [255, 252, 236], shade: "#2a1f10", glow: "#f0c24e", sHot: "#6b4612", sBase: "#7c5e28", labHot: [253, 243, 216], lab: [42, 30, 16] },
      paper: { bg: ["#e7d9b6", "#cdb583", "#ac8f57"], eC1: "#6e4717", eC2: "#b7a079", eAbase: 0.45, eAmul: 0.40, fog: "#c2a771", nHot: "#bf8c20", nBase: "#d8c79c", hi: [255, 250, 232], shade: "#6a5230", glow: "#e6ad33", sHot: "#5a3a12", sBase: "#7c5e28", labHot: [253, 243, 216], lab: [42, 30, 16] }
    };

    // ---- frei einstellbare Parameter (Einstellungs-Menü) ----
    const S = { nodeSize: 16, influencer: 0.55, labelSize: 20, edgeWidth: 3, spinSpeed: 0.004, flySpeed: 3.5, glow: 1, fog: 1, vignette: 1, showLabels: true, showShadow: true };
    const SDEF = Object.assign({}, S);   // Standardwerte zum Zurücksetzen
    const SCTRL = [
      { k: "nodeSize",   label: "Kugelgröße",          min: 2,   max: 60,   step: 1,     dec: 0 },
      { k: "influencer", label: "Influencer-Zuschlag", min: 0,   max: 3,    step: 0.05,  dec: 2 },
      { k: "labelSize",  label: "Namen-Größe",         min: 0,   max: 40,   step: 1,     dec: 0 },
      { k: "edgeWidth",  label: "Kantenstärke",        min: 0,   max: 12,   step: 0.5,   dec: 1 },
      { k: "spinSpeed",  label: "Dreh-Tempo",          min: 0,   max: 0.03, step: 0.001, dec: 3 },
      { k: "flySpeed",   label: "Flug-Tempo (WASD)",   min: 0.1, max: 30,   step: 0.5,   dec: 1 },
      { k: "glow",       label: "Glow-Stärke",         min: 0,   max: 3,    step: 0.1,   dec: 1 },
      { k: "fog",        label: "Tiefen-Nebel",        min: 0,   max: 2,    step: 0.1,   dec: 1 },
      { k: "vignette",   label: "Vignette / Tiefe",    min: 0,   max: 2,    step: 0.1,   dec: 1 }
    ];
    const SCHK = [{ k: "showLabels", label: "Namen anzeigen" }, { k: "showShadow", label: "Schatten anzeigen" }];
    const cfgOf = (k) => SCTRL.filter((c) => c.k === k)[0];

    function buildLayout() {
      const src = activeGraph();
      names = src.names.slice();
      elist = src.elist.map((e) => [e[0], e[1]]);
      const N = names.length || 1;
      deg = {}; names.forEach((n) => deg[n] = 0); elist.forEach((e) => { deg[e[0]]++; deg[e[1]]++; });
      maxDeg = Math.max.apply(null, Object.values(deg).concat(0));
      hot = {}; names.forEach((n) => { if (deg[n] === maxDeg && maxDeg > 0) hot[n] = 1; });
      // kürzesten Weg nur in der Lektion übernehmen (pathState liegt im äußeren Scope)
      pathEdges = {}; pathNodes = {};
      if (mode === "lesson" && lessonKey === "beispiel1" && pathState && pathState.length) {
        pathState.forEach((n) => { if (nodes[n]) pathNodes[n] = 1; });
        for (let i = 0; i < pathState.length - 1; i++) pathEdges[eKey(pathState[i], pathState[i + 1])] = 1;
      }
      P = {};
      names.forEach((n, i) => { const phi = Math.acos(1 - 2 * (i + 0.5) / N), th = Math.PI * (1 + Math.sqrt(5)) * i, R = 150; P[n] = { x: R * Math.sin(phi) * Math.cos(th), y: R * Math.sin(phi) * Math.sin(th), z: R * Math.cos(phi) }; });
      // ---- Regler wirken als Multiplikatoren auf die Basis-Physik ----
      const arrange = LAY.arrange || "force";
      const L0 = 115 * clamp(LAY.edgeLen, 0.2, 10);     // ideale Kantenlänge
      const kRep = 120000 * clamp(LAY.repulse, 0.1, 12); // Abstoßung
      const kAtt = 0.02 * clamp(LAY.attract, 0.1, 12);   // Anziehung
      let cool = 9;
      const ITERS = N > 120 ? 170 : 280;   // bei großen Netzen weniger Iterationen → flüssiges Regenerieren
      const idxOf = {};
      for (let i = 0; i < N; i++) idxOf[names[i]] = i;
      const eIdx = [];   // Kanten einmalig als Index-Paare (a,b,a,b,…)
      for (let i = 0; i < elist.length; i++) { const ia = idxOf[elist[i][0]], ib = idxOf[elist[i][1]]; if (ia !== undefined && ib !== undefined) eIdx.push(ia, ib); }

      if (arrange === "layers") {
        // ---- Schichten/Hierarchie: konzentrische Schalen nach BFS-Distanz vom Zentrum ----
        layoutLayers(N, eIdx);
      } else {
        // ---- Force-Directed (PERF: flache Float64Array(s) statt Hash-Lookups) ----
        const px = new Float64Array(N), py = new Float64Array(N), pz = new Float64Array(N);
        const fx = new Float64Array(N), fy = new Float64Array(N), fz = new Float64Array(N);
        for (let i = 0; i < N; i++) { const n = names[i]; px[i] = P[n].x; py[i] = P[n].y; pz[i] = P[n].z; }
        // Cluster-Anordnung: jeder Knoten wird zusätzlich zu seinem Gruppen-Anker gezogen → Gruppen trennen sich räumlich
        let anchorX = null, anchorY = null, anchorZ = null, kClu = 0;
        if (arrange === "cluster") {
          const lab = detectClusters(N, eIdx), seen = {}, uniq = [];
          for (let i = 0; i < N; i++) { if (seen[lab[i]] === undefined) { seen[lab[i]] = uniq.length; uniq.push(lab[i]); } }
          const K = uniq.length, aR = (L0 * 2.4) * Math.max(1, Math.sqrt(K));
          const ax = new Float64Array(K), ay = new Float64Array(K), az = new Float64Array(K);
          for (let c = 0; c < K; c++) { const phi = Math.acos(1 - 2 * (c + 0.5) / K), th = Math.PI * (1 + Math.sqrt(5)) * c; ax[c] = aR * Math.sin(phi) * Math.cos(th); ay[c] = aR * Math.sin(phi) * Math.sin(th); az[c] = aR * Math.cos(phi); }
          anchorX = new Float64Array(N); anchorY = new Float64Array(N); anchorZ = new Float64Array(N);
          for (let i = 0; i < N; i++) { const c = seen[lab[i]]; anchorX[i] = ax[c]; anchorY[i] = ay[c]; anchorZ[i] = az[c]; px[i] = ax[c] + px[i] * 0.18; py[i] = ay[c] + py[i] * 0.18; pz[i] = az[c] + pz[i] * 0.18; }
          kClu = 0.06;
        }
        for (let it = 0; it < ITERS; it++) {
          for (let i = 0; i < N; i++) { fx[i] = 0; fy[i] = 0; fz[i] = 0; }
          for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
            let dx = px[i] - px[j], dy = py[i] - py[j], dz = pz[i] - pz[j];
            let d2 = dx * dx + dy * dy + dz * dz + 1, d = Math.sqrt(d2), r = kRep / (d2 * d);
            fx[i] += dx * r; fy[i] += dy * r; fz[i] += dz * r;
            fx[j] -= dx * r; fy[j] -= dy * r; fz[j] -= dz * r;
          }
          for (let k = 0; k < eIdx.length; k += 2) {
            const a = eIdx[k], b = eIdx[k + 1];
            let dx = px[b] - px[a], dy = py[b] - py[a], dz = pz[b] - pz[a];
            let d = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.01, s = kAtt * (d - L0);
            fx[a] += dx / d * s; fy[a] += dy / d * s; fz[a] += dz / d * s;
            fx[b] -= dx / d * s; fy[b] -= dy / d * s; fz[b] -= dz / d * s;
          }
          if (kClu > 0) { for (let i = 0; i < N; i++) { fx[i] += (anchorX[i] - px[i]) * kClu; fy[i] += (anchorY[i] - py[i]) * kClu; fz[i] += (anchorZ[i] - pz[i]) * kClu; } }
          for (let i = 0; i < N; i++) {
            let mag = Math.sqrt(fx[i] * fx[i] + fy[i] * fy[i] + fz[i] * fz[i]) + 1e-6, step = Math.min(mag, cool);
            px[i] += fx[i] / mag * step; py[i] += fy[i] / mag * step; pz[i] += fz[i] / mag * step;
          }
          cool = Math.max(0.6, cool * 0.985);
        }
        for (let i = 0; i < N; i++) { const n = names[i]; P[n].x = px[i]; P[n].y = py[i]; P[n].z = pz[i]; }   // zurück in P schreiben
      }
      let c = { x: 0, y: 0, z: 0 }; names.forEach((n) => { c.x += P[n].x; c.y += P[n].y; c.z += P[n].z; }); c.x /= N; c.y /= N; c.z /= N;
      names.forEach((n) => { P[n].x -= c.x; P[n].y -= c.y; P[n].z -= c.z; });
      // Kugel-Schale: alle Knoten exakt auf die Hülle projizieren (gleichmäßig, ideal für Orbit-Kamera)
      if (arrange === "sphere") names.forEach((n) => { const p = P[n], l = Math.hypot(p.x, p.y, p.z) || 1, s = 1 / l; p.x *= s; p.y *= s; p.z *= s; });
      // Layout auf Hüll-Radius normieren · „Spreizung"-Regler skaliert die Gesamtgröße
      let maxR = 1; names.forEach((n) => { const p = P[n]; maxR = Math.max(maxR, Math.hypot(p.x, p.y, p.z)); });
      const load = Math.max(N, elist.length * 0.7);
      const targetR = 160 * Math.max(1, Math.pow(load / 25, 0.42)) * clamp(LAY.spread, 0.3, 12);
      const norm = targetR / maxR; names.forEach((n) => { P[n].x *= norm; P[n].y *= norm; P[n].z *= norm; });
      layoutR = targetR;
      buildAdjacency();
      computeRenderElist();   // Kanten-Ausdünnung fürs Rendern berechnen (Algorithmen nutzen weiter elist)
    }
    // ---- Community-Erkennung (Label-Propagation) für die Cluster-Anordnung ----
    function detectClusters(N, eIdx) {
      const label = new Int32Array(N); for (let i = 0; i < N; i++) label[i] = i;
      const nbr = []; for (let i = 0; i < N; i++) nbr.push([]);
      for (let k = 0; k < eIdx.length; k += 2) { nbr[eIdx[k]].push(eIdx[k + 1]); nbr[eIdx[k + 1]].push(eIdx[k]); }
      for (let pass = 0; pass < 8; pass++) {
        let changed = false;
        for (let i = 0; i < N; i++) {
          if (!nbr[i].length) continue;
          const cnt = {}; let bestL = label[i], bestC = 0;
          for (let q = 0; q < nbr[i].length; q++) { const l = label[nbr[i][q]], cc = (cnt[l] = (cnt[l] || 0) + 1); if (cc > bestC || (cc === bestC && l < bestL)) { bestC = cc; bestL = l; } }
          if (label[i] !== bestL) { label[i] = bestL; changed = true; }
        }
        if (!changed) break;
      }
      return label;
    }
    // ---- Schichten-Layout: BFS-Tiefe von der Wurzel (höchster Grad) → konzentrische Schalen ----
    function layoutLayers(N, eIdx) {
      const nbr = []; for (let i = 0; i < N; i++) nbr.push([]);
      for (let k = 0; k < eIdx.length; k += 2) { nbr[eIdx[k]].push(eIdx[k + 1]); nbr[eIdx[k + 1]].push(eIdx[k]); }
      let root = 0, bd = -1; for (let i = 0; i < N; i++) if (nbr[i].length > bd) { bd = nbr[i].length; root = i; }
      const depth = new Int32Array(N); for (let i = 0; i < N; i++) depth[i] = -1;
      depth[root] = 0; const q = [root]; let head = 0, maxD = 0;
      while (head < q.length) { const u = q[head++]; for (let z = 0; z < nbr[u].length; z++) { const v = nbr[u][z]; if (depth[v] < 0) { depth[v] = depth[u] + 1; if (depth[v] > maxD) maxD = depth[v]; q.push(v); } } }
      for (let i = 0; i < N; i++) if (depth[i] < 0) depth[i] = maxD + 1;   // isolierte Knoten → äußerste Schale
      const layers = {}; for (let i = 0; i < N; i++) (layers[depth[i]] = layers[depth[i]] || []).push(i);
      Object.keys(layers).forEach((dk) => {
        const d = +dk, arr = layers[d], m = arr.length;
        if (d === 0) { for (let a = 0; a < arr.length; a++) P[names[arr[a]]] = { x: 0, y: 0, z: 0 }; return; }
        for (let a = 0; a < m; a++) { const phi = Math.acos(1 - 2 * (a + 0.5) / m), th = Math.PI * (1 + Math.sqrt(5)) * a; P[names[arr[a]]] = { x: d * Math.sin(phi) * Math.cos(th), y: d * Math.sin(phi) * Math.sin(th), z: d * Math.cos(phi) }; }
      });
    }
    // ---- Kanten-Ausdünnung: behält Spannbaum (kürzeste Kanten) + kürzeste Restkanten,
    //      wirft die längsten „Kreuz-Kanten" raus → Übersicht bei großen Netzen.
    //      Render-only: adj3/Algorithmen arbeiten weiter mit der vollen elist.
    function computeRenderElist() {
      if (!LAY.thin || LAY.thin <= 0.001 || elist.length < 4) { renderElist = null; return; }
      const ord = elist.map((e, idx) => { const a = P[e[0]], b = P[e[1]]; return { idx: idx, len: (a && b) ? Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) : 0 }; });
      ord.sort((u, v) => u.len - v.len);
      const parent = {}; names.forEach((n) => parent[n] = n);
      const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
      const keep = new Array(elist.length).fill(false); let kept = 0;
      for (let i = 0; i < ord.length; i++) { const e = elist[ord[i].idx], ra = find(e[0]), rb = find(e[1]); if (ra !== rb) { parent[ra] = rb; keep[ord[i].idx] = true; kept++; } }   // Spannbaum
      const target = Math.max(kept, Math.round(elist.length * (1 - clamp(LAY.thin, 0, 0.95))));
      for (let i = 0; i < ord.length && kept < target; i++) { if (!keep[ord[i].idx]) { keep[ord[i].idx] = true; kept++; } }   // kürzeste Restkanten auffüllen
      renderElist = elist.filter((e, idx) => keep[idx]);
    }
    // Zoom, der das gesamte (evtl. vergrößerte) Netz ins Bild holt
    function fitZoom() { return clamp(160 / layoutR, 0.015, 2); }
    function buildAdjacency() { adj3 = {}; names.forEach((n) => adj3[n] = []); elist.forEach((e) => { adj3[e[0]].push(e[1]); adj3[e[1]].push(e[0]); }); }
    // FIX BUG 3: Dijkstra im 3D-Layout (euklidische Kantengewichte) – für den Kamera-Spurpfad,
    // damit die Kino-Kamera dem geometrisch kürzesten Weg folgt statt dem reinen BFS-Baum.
    function dijkstra3D(start, goal) {
      if (!start || !goal || !P[start] || !P[goal]) return null;
      const dist = {}, prev = {}, visited = {};
      names.forEach((n) => { dist[n] = Infinity; });
      dist[start] = 0;
      const queue = makeHeap(); queue.push({ n: start, pr: 0 });
      while (queue.size()) {
        const u = queue.popMin(visited); if (u === undefined) break;
        visited[u] = 1;
        if (u === goal) break;
        (adj3[u] || []).forEach((v) => {
          const pu = P[u], pv = P[v];
          const w = Math.hypot(pu.x - pv.x, pu.y - pv.y, pu.z - pv.z);
          const alt = dist[u] + w;
          if (alt < dist[v]) { dist[v] = alt; prev[v] = u; queue.push({ n: v, pr: alt }); }
        });
      }
      if (dist[goal] === Infinity) return null;
      const path = []; let x = goal;
      while (x !== undefined) { path.unshift(x); x = prev[x]; }
      return path[0] === start ? path : null;
    }

    function graphData() { return { names: names, positions: P, edges: renderElist || elist, deg: deg, maxDeg: maxDeg, hot: hot, pathNodes: pathNodes, pathEdges: pathEdges }; }
    function ensureR() { if (!R && window.THREE_NET) { try { R = THREE_NET.create(cv); } catch (e) { console.error("3D-Init:", e); R = null; } } return R; }
    function applyParams3D() { if (R) R.setParams(S); }
    function sizeCanvas() { if (R) R.resize(); }

    let needsDraw = true;
    function stopLoop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
    function flyStep() {                      // WASD/QE bewegen die Kamera durch die Szene
      if (!flyMode || !keys.size) return false;
      const sp = S.flySpeed;
      if (keys.has("w")) cam.z += sp; if (keys.has("s")) cam.z -= sp;
      if (keys.has("a")) cam.x -= sp; if (keys.has("d")) cam.x += sp;
      if (keys.has("q")) cam.y -= sp; if (keys.has("e")) cam.y += sp;
      cam.x = clamp(cam.x, -320, 320); cam.y = clamp(cam.y, -320, 320); cam.z = clamp(cam.z, -320, 320);
      return true;
    }
    function frame(now) {
      if (ov.hidden) { raf = 0; return; }
      now = now || performance.now();
      let moving = false;
      const kino = KINO.on && !PF.running;          // während der Routensuche bleibt die Kamera frei
      if (SP.running) { updateSpreadFrame(now); moving = true; }
      if (PF.running) { pfFrame(now); moving = true; }
      if (!dragging && !kino) {                    // im Kino keine Gruppen-Rotation/Schwung
        if (velX || velY) { rotY += velY; rotX = clamp(rotX + velX, -1.45, 1.45); velX *= 0.93; velY *= 0.93; if (Math.abs(velX) < 2e-4) velX = 0; if (Math.abs(velY) < 2e-4) velY = 0; moving = true; }
        if (spinning) { rotY += S.spinSpeed; moving = true; }
      }
      if (flyStep()) moving = true;
      if (kino) { cameraFrame(now, Math.min(SP.running ? spreadCur(now) : Infinity, spreadEndStep() + 1.4)); moving = true; }   // Kamera nie über das Ziel hinaus rahmen
      if (R && (needsDraw || moving || dragging)) {
        if (kino) R.render({ camMode: "cinematic", camPos: KINO.pos, lookAt: KINO.look, up: KINO.up, fov: CAM.fov, minDist: Math.max(40, layoutR * 0.12) });  // Banking (up) + FOV + kleiner Mindestabstand (Spur darf dicht ran)
        else R.render({ rotX: rotX, rotY: rotY, zoom: zoom, panX: panX, panY: panY, cam: cam });
        needsDraw = false;
      }
      // Leerlauf → Schleife anhalten (spart CPU/Akku), Interaktion weckt sie via wake()
      raf = (spinning || dragging || velX || velY || (flyMode && keys.size) || SP.running || PF.running || kino) ? requestAnimationFrame(frame) : 0;
    }
    function wake() { needsDraw = true; if (!raf) raf = requestAnimationFrame(frame); }
    function spinBtn() { const b = $id("net3d-spin"); if (b) b.textContent = spinning ? "⏸ Drehung" : "▶ Drehung"; }
    function themeBtn() { const b = $id("net3d-theme"); if (b) b.textContent = theme === "dark" ? "☀ Hell" : "🌙 Dunkel"; }
    function flyBtn() { const b = $id("net3d-fly"); if (b) b.classList.toggle("on", flyMode); }
    function setHint() {
      const h = $id("net3d-hint"); if (!h) return;
      h.textContent = flyMode
        ? "✈ Flug-Modus · W A S D bewegen · Q/E hoch·runter · Mausrad = Tempo (" + fmt(S.flySpeed, 1) + ") · ziehen/Pfeile = umschauen · Strg+F beenden"
        : "Netzwerk in 3D · ziehen = drehen · Rad = zoomen · Knoten klicken = Start, Shift-Klick = Ziel · G = Route suchen · Strg+F = Flug-Modus";
    }
    // ---- Einstellungs-Menü (dynamisch aufgebaut) ----
    function valOf(k) { const c = cfgOf(k); return c ? (+S[k]).toFixed(c.dec) : S[k]; }
    function syncOne(k) {
      const host = $id("net3d-settings"); if (!host) return;
      const inp = host.querySelector("input[data-s='" + k + "']"); if (inp) inp.value = S[k];
      const out = host.querySelector("output[data-o='" + k + "']"); if (out) out.textContent = valOf(k);
    }
    function syncSettings() {
      const host = $id("net3d-settings"); if (!host) return;
      SCTRL.forEach((c) => syncOne(c.k));
      SCHK.forEach((c) => { const inp = host.querySelector("input[data-s='" + c.k + "']"); if (inp) inp.checked = !!S[c.k]; });
      syncQuality();
    }
    function syncQuality() {
      const host = $id("net3d-settings"); if (!host) return;
      QCTRL.forEach((c) => { const inp = host.querySelector("input[data-q-s='" + c.k + "']"); if (inp) inp.value = Q[c.k]; const o = host.querySelector("output[data-qo='" + c.k + "']"); if (o) o.textContent = (+Q[c.k]).toFixed(c.k === "dprCap" ? 1 : 0); });
      const chk = host.querySelector("input[data-q-chk='autoLOD']"); if (chk) chk.checked = !!Q.autoLOD;
      host.querySelectorAll("button[data-q]").forEach((b) => b.classList.toggle("on", b.dataset.q === qPreset));
    }
    let settingsBuilt = false;
    function buildSettings() {
      const host = $id("net3d-settings"); if (!host || settingsBuilt) return;
      let html = "<div class='s3d-head'><span>⚙ Einstellungen</span><button id='net3d-set-x' type='button' aria-label='schließen'>✕</button></div>";
      SCTRL.forEach((c) => { html += "<label class='s3d-row'><span>" + c.label + "</span><output data-o='" + c.k + "'></output><input type='range' data-s='" + c.k + "' min='" + c.min + "' max='" + c.max + "' step='" + c.step + "'></label>"; });
      SCHK.forEach((c) => { html += "<label class='s3d-check'><input type='checkbox' data-s='" + c.k + "'> " + c.label + "</label>"; });
      // ---- Qualitäts-Sektion (Kugel-/Kanten-Glätte + Auflösung) ----
      html += "<div class='s3d-sec'>Qualität</div>";
      html += "<div class='s3d-presets'>" + Object.keys(QPRESETLABEL).map((k) => "<button type='button' data-q='" + k + "'>" + QPRESETLABEL[k] + "</button>").join("") + "</div>";
      QCTRL.forEach((c) => { html += "<label class='s3d-row'><span>" + c.label + "</span><output data-qo='" + c.k + "'></output><input type='range' data-q-s='" + c.k + "' min='" + c.min + "' max='" + c.max + "' step='" + c.step + "'></label>"; });
      html += "<label class='s3d-check'><input type='checkbox' data-q-chk='autoLOD'> Auto-Qualität bei großen Netzen</label>";
      html += "<button id='net3d-set-reset' type='button' class='s3d-reset'>Standard wiederherstellen</button>";
      host.innerHTML = html;
      host.querySelectorAll("input[data-s]").forEach((inp) => inp.addEventListener("input", () => {
        const k = inp.dataset.s;
        if (inp.type === "checkbox") S[k] = inp.checked;
        else { S[k] = +inp.value; const out = host.querySelector("output[data-o='" + k + "']"); if (out) out.textContent = valOf(k); if (k === "flySpeed") setHint(); }
        applyParams3D(); wake();
      }));
      host.querySelectorAll("button[data-q]").forEach((b) => b.addEventListener("click", () => { qPreset = b.dataset.q; Object.assign(Q, QPRESETS[qPreset]); syncQuality(); applyQuality(); wake(); }));
      host.querySelectorAll("input[data-q-s]").forEach((inp) => inp.addEventListener("input", () => {
        const k = inp.dataset.qS; Q[k] = +inp.value;
        if (k === "sphereSeg") Q.sphereSegH = Math.round(Q.sphereSeg * 0.75);
        const o = host.querySelector("output[data-qo='" + k + "']"); if (o) o.textContent = (+Q[k]).toFixed(k === "dprCap" ? 1 : 0);
        applyQuality(); wake();
      }));
      const lodChk = host.querySelector("input[data-q-chk='autoLOD']"); if (lodChk) lodChk.addEventListener("change", (e) => { Q.autoLOD = e.target.checked; applyQuality(); wake(); });
      $id("net3d-set-x").addEventListener("click", () => { host.hidden = true; });
      $id("net3d-set-reset").addEventListener("click", () => { Object.assign(S, SDEF); Object.assign(Q, QDEF); qPreset = "hoch"; syncSettings(); syncQuality(); setHint(); applyParams3D(); applyQuality(); wake(); });
      settingsBuilt = true;
    }
    function toggleSettings() { const host = $id("net3d-settings"); if (!host) return; buildSettings(); syncSettings(); host.hidden = !host.hidden; }

    /* =====================================================================
       QUALITÄT (Kugel-/Kanten-Glätte + Auflösung) — Standard „Hoch"
       ===================================================================== */
    const Q = { sphereSeg: 32, sphereSegH: 24, cylSeg: 12, dprCap: 2, autoLOD: true };
    const QDEF = Object.assign({}, Q);
    const QPRESETS = {
      niedrig: { sphereSeg: 16, sphereSegH: 12, cylSeg: 8,  dprCap: 1.5 },
      mittel:  { sphereSeg: 32, sphereSegH: 24, cylSeg: 12, dprCap: 2 },
      hoch:    { sphereSeg: 48, sphereSegH: 36, cylSeg: 16, dprCap: 2 },
      ultra:   { sphereSeg: 64, sphereSegH: 48, cylSeg: 20, dprCap: 2.5 },
      maximal: { sphereSeg: 96, sphereSegH: 64, cylSeg: 32, dprCap: 3 }
    };
    const QPRESETLABEL = { niedrig: "Niedrig", mittel: "Mittel", hoch: "Hoch", ultra: "Ultra", maximal: "Maximal" };
    const QCTRL = [
      { k: "sphereSeg", label: "Kugel-Glätte",  min: 8, max: 96, step: 1 },
      { k: "cylSeg",    label: "Kanten-Glätte", min: 4, max: 32, step: 1 },
      { k: "dprCap",    label: "Auflösung",     min: 1, max: 3,  step: 0.5 }
    ];
    let qPreset = "mittel";
    function applyQuality() {
      if (!R) return;
      let eff = { sphereSeg: Q.sphereSeg, sphereSegH: Q.sphereSegH, cylSeg: Q.cylSeg, dprCap: Q.dprCap };
      let labelMax = Infinity;
      if (Q.autoLOD) {                                   // bei vielen Kugeln Geometrie, Auflösung & Labels schonen
        const n = names.length; let f = 1;
        if (n > 240) f = 0.30; else if (n > 180) f = 0.40; else if (n > 120) f = 0.55; else if (n > 70) f = 0.75;
        if (f < 1) { eff.sphereSeg = Math.max(10, Math.round(Q.sphereSeg * f)); eff.sphereSegH = Math.max(8, Math.round(Q.sphereSegH * f)); eff.cylSeg = Math.max(5, Math.round(Q.cylSeg * f)); }
        // Auflösung (DPR) bei großen Netzen senken – halbiert oft die Pixel-Last
        if (n > 200) eff.dprCap = Math.min(eff.dprCap, 1.25); else if (n > 110) eff.dprCap = Math.min(eff.dprCap, 1.5);
        // Labels sind teuer (eine Textur + ein Draw-Call je Knoten) → nur die wichtigsten zeigen
        if (n > 160) labelMax = 24; else if (n > 90) labelMax = 40; else if (n > 55) labelMax = 60;
      }
      R.setQuality(eff);
      if (R.setLabelBudget) R.setLabelBudget(labelMax);
    }

    /* =====================================================================
       NETZWERK-GENERATOR  (Modus Lektion ↔ Generiert, 5 Presets, Seed)
       ===================================================================== */
    let mode = "lesson";       // "lesson" | "generated"
    let genGraph = null;       // { names, elist }
    let adj3 = {};             // Adjazenz des aktiven Graphen (für Ausbreitung)
    const GEN = { preset: "random", size: 60, density: 3, groups: 4, neighbors: 4, rewire: 0.1, creators: 4, seed: 1001 };
    const GENDEF = Object.assign({}, GEN);
    // ---- LAYOUT-Steuerung (Anordnung + Physik-Regler + Kanten-Ausdünnung) ----
    // arrange: force | cluster | sphere | layers · alle Faktoren sind Multiplikatoren auf die Basiswerte.
    const LAY = { arrange: "force", spread: 1.0, repulse: 1.0, attract: 1.0, edgeLen: 1.0, thin: 0 };
    const LAYDEF = Object.assign({}, LAY);
    let renderElist = null;   // ausgedünnte Kantenliste fürs Rendern (adj3/Algorithmen nutzen weiter elist)
    const PRESET_SEED = { random: 1001, hubs: 2002, cluster: 3003, smallworld: 4004, youtube: 5005 };
    const GEN_PRESETS_UI = [["random", "Zufall"], ["hubs", "Influencer"], ["cluster", "Cluster"], ["smallworld", "Kleine Welt"], ["youtube", "YouTube"]];
    const GEN_PARAMS = {
      random:     [{ k: "density",   label: "Ø Verbindungen",   min: 1, max: 8,  step: 0.5 }],
      hubs:       [{ k: "density",   label: "Kanten je Person", min: 1, max: 8,  step: 1 }],
      cluster:    [{ k: "groups",    label: "Gruppen",          min: 2, max: 10, step: 1 }, { k: "density", label: "Dichte je Gruppe", min: 1, max: 8, step: 0.5 }],
      smallworld: [{ k: "neighbors", label: "Nachbarn",         min: 2, max: 10, step: 2 }, { k: "rewire", label: "Umverdrahtung", min: 0, max: 1, step: 0.05 }],
      youtube:    [{ k: "creators",  label: "Creator",          min: 1, max: 10, step: 1 }]
    };
    const NAMEPOOL = ["Anna","Ben","Clara","David","Emma","Felix","Greta","Hannes","Ida","Jonas","Lea","Mia","Noah","Ole","Paula","Quirin","Rosa","Sam","Tina","Uwe","Vera","Wim","Xena","Yann","Zoe","Alma","Bruno","Carla","Dora","Erik","Fynn","Gina","Hugo","Inga","Jana","Karl","Lina","Mats","Nora","Otto","Pia","Rolf","Sina","Timo","Ulla","Vito","Wanda"];
    function nameAt(i) { return i < NAMEPOOL.length ? NAMEPOOL[i] : ("Person " + (i + 1)); }
    function mkRng(seed) { let a = (seed >>> 0) || 1; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

    function activeGraph() {
      if (mode === "generated" && genGraph) return genGraph;
      if (mode === "lesson") {                       // gewählte Lektion (außer „beispiel1" = das editierbare 2D-Netz)
        const L = LESSONS[lessonKey];
        if (L && !L.live) return { names: L.names.slice(), elist: L.edges.map((e) => [e[0], e[1]]) };
      }
      const ns = Object.keys(nodes), el = []; edges.forEach((k) => { const p = k.split("|"); el.push([p[0], p[1]]); });
      return { names: ns, elist: el };
    }

    function generate() {
      const N = clamp(Math.round(GEN.size), 2, 400);
      const nm = []; for (let i = 0; i < N; i++) nm.push(nameAt(i));
      const rng = mkRng(GEN.seed);
      const set = new Set();
      const add = (a, b) => { if (a !== b) set.add(a < b ? a + "|" + b : b + "|" + a); };
      if (GEN.preset === "random") {
        const p = clamp(GEN.density / (N - 1), 0, 1);
        for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) if (rng() < p) add(nm[i], nm[j]);
      } else if (GEN.preset === "hubs") {
        const m = clamp(Math.round(GEN.density), 1, 8), targets = [], m0 = Math.min(N, m + 1);
        for (let i = 0; i < m0; i++) for (let j = i + 1; j < m0; j++) { add(nm[i], nm[j]); targets.push(nm[i], nm[j]); }
        for (let i = m0; i < N; i++) {
          const chosen = new Set(); let guard = 0;
          while (chosen.size < Math.min(m, i) && guard < 300) { const t = targets[Math.floor(rng() * targets.length)]; if (t !== undefined && t !== nm[i]) chosen.add(t); guard++; }
          chosen.forEach((t) => { add(nm[i], t); targets.push(t, nm[i]); });
        }
      } else if (GEN.preset === "cluster") {
        const k = clamp(Math.round(GEN.groups), 2, 12), grp = nm.map(() => Math.floor(rng() * k));
        const sizeApprox = Math.max(2, N / k), pin = clamp(GEN.density / (sizeApprox - 1), 0, 1), pout = clamp(0.6 / N, 0, 1);
        for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) { const same = grp[i] === grp[j]; if (rng() < (same ? pin : pout)) add(nm[i], nm[j]); }
      } else if (GEN.preset === "smallworld") {
        const half = clamp(Math.round(GEN.neighbors / 2), 1, Math.max(1, Math.floor((N - 1) / 2)));
        for (let i = 0; i < N; i++) for (let d = 1; d <= half; d++) {
          let a = i, b = (i + d) % N;
          if (rng() < GEN.rewire) { let nb = Math.floor(rng() * N), guard = 0; while (nb === a && guard < 50) { nb = Math.floor(rng() * N); guard++; } b = nb; }
          add(nm[a], nm[b]);
        }
      } else if (GEN.preset === "youtube") {
        const c = clamp(Math.round(GEN.creators), 1, Math.max(1, Math.floor(N / 3))), creators = [];
        for (let i = 0; i < c; i++) creators.push(nm[i]);
        const pop = creators.map(() => 1);
        for (let i = c; i < N; i++) {
          const subs = 1 + Math.floor(rng() * 3), picked = new Set(); let guard = 0;
          while (picked.size < Math.min(subs, c) && guard < 100) {
            let total = 0; for (let q = 0; q < c; q++) total += pop[q];
            let r = rng() * total, ci = 0; for (; ci < c; ci++) { r -= pop[ci]; if (r <= 0) break; } if (ci >= c) ci = c - 1;
            if (!picked.has(ci)) { picked.add(ci); pop[ci]++; } guard++;
          }
          picked.forEach((ci) => add(nm[i], creators[ci]));
          if (i > c && rng() < 0.15) add(nm[i], nm[c + Math.floor(rng() * (i - c))]);
        }
        for (let i = 0; i < c; i++) for (let j = i + 1; j < c; j++) if (rng() < 0.5) add(creators[i], creators[j]);
      }
      ensureConnected(nm, set, add, rng);
      const el = []; set.forEach((k) => { const p = k.split("|"); el.push([p[0], p[1]]); });
      genGraph = { names: nm, elist: el };
    }
    function ensureConnected(nm, set, add, rng) {
      const adj = {}; nm.forEach((n) => adj[n] = []);
      set.forEach((k) => { const p = k.split("|"); adj[p[0]].push(p[1]); adj[p[1]].push(p[0]); });
      const seen = {}, comps = [];
      nm.forEach((start) => { if (seen[start]) return; const comp = [], q = [start]; seen[start] = 1; while (q.length) { const x = q.shift(); comp.push(x); adj[x].forEach((y) => { if (!seen[y]) { seen[y] = 1; q.push(y); } }); } comps.push(comp); });
      // jede Insel an die Hauptkomponente hängen → Graph ist garantiert zusammenhängend
      for (let i = 1; i < comps.length; i++) { const anchor = comps[0][Math.floor(rng() * comps[0].length)]; add(comps[i][0], anchor); }
    }

    function rebuildActive() {
      buildLayout();
      if (R) { R.setGraph(graphData()); R.setTheme(theme); R.setParams(S); }
      applyQuality();
      SP.running = false; SP.computed = false; SP.pauseCur = 0; clearReadout(); spreadBtns();
      populateSpreadSelects();
      PF.running = false; PF.result = null; PF.curStep = 0; PF.pauseStep = 0; pfPopulateSelects(); pfBtns();
      const pfro = $id("net3d-pf-readout"); if (pfro) pfro.innerHTML = "";
      resetView(); wake();
    }
    function setMode(m) { mode = m; if (mode === "generated" && !genGraph) generate(); markMode(); rebuildActive(); }

    /* =====================================================================
       AUSBREITUNG (Diffusion) + Farben + Messwerte
       ===================================================================== */
    const ACCENT3D = "#46d6a0";
    const SP = { model: "waves", p: 0.5, stepMs: 700, scheme: "heat", start: "", target: "__all__", focus: 0,
                 running: false, computed: false, t0: 0, pauseCur: 0, arrival: {}, parent: {}, order: [],
                 maxStep: 0, total: 1, startResolved: "", targetResolved: null, randomPerson: null, reachedTotal: 0, curve: [], distToRoute: {} };
    function nodeExists(n) { return names.indexOf(n) >= 0; }
    function spreadCur(now) { return (now - SP.t0) / SP.stepMs; }
    // Bis zu welchem Schritt animiert wird: bei konkretem Ziel nur bis dorthin, sonst bis alle.
    function spreadEndStep() { if (SP.targetResolved && SP.arrival && SP.arrival[SP.targetResolved] !== undefined) return SP.arrival[SP.targetResolved]; return SP.maxStep; }

    function computeSpread() {
      SP.arrival = {}; SP.parent = {}; SP.order = []; SP.maxStep = 0; SP.total = names.length || 1;
      let start = SP.start;
      if (!start || start === "__random__" || !nodeExists(start)) start = names[Math.floor(Math.random() * names.length)] || names[0];
      SP.startResolved = start;
      const rng = mkRng((GEN.seed ^ 0x9e3779b9 ^ (SP.model === "random" ? 0x55 : 0)) >>> 0);
      if (SP.model === "waves") {
        SP.arrival[start] = 0; SP.order.push(start);
        const q = [start];
        while (q.length) { const x = q.shift(); (adj3[x] || []).forEach((y) => { if (SP.arrival[y] === undefined) { SP.arrival[y] = SP.arrival[x] + 1; SP.parent[y] = x; SP.maxStep = Math.max(SP.maxStep, SP.arrival[y]); SP.order.push(y); q.push(y); } }); }
      } else {
        const infected = {}; infected[start] = true; SP.arrival[start] = 0; SP.order.push(start);
        let frontier = [start], round = 0;
        while (frontier.length && round < names.length + 5) {
          round++; const next = [];
          frontier.forEach((x) => { (adj3[x] || []).forEach((y) => { if (!infected[y] && rng() < SP.p) { infected[y] = true; SP.arrival[y] = round; SP.parent[y] = x; SP.order.push(y); next.push(y); } }); });
          frontier = next; if (next.length) SP.maxStep = round;
        }
      }
      const reachable = SP.order.filter((n) => n !== start);
      if (SP.target === "__random__") SP.targetResolved = reachable.length ? reachable[Math.floor(rng() * reachable.length)] : null;
      else if (SP.target === "__all__") SP.targetResolved = null;
      else SP.targetResolved = SP.target;
      SP.randomPerson = reachable.length ? reachable[Math.floor(rng() * reachable.length)] : null;
      // Signalbaum-Kanten (für sequenzielle Aufladung) + Spur-Pfad (für die Kamera)
      SP.treeKeys = new Set(); SP.edgeFrom = {};
      SP.order.forEach((n) => { const par = SP.parent[n]; if (par === undefined) return; const key = (n < par ? n + "|" + par : par + "|" + n); SP.treeKeys.add(key); SP.edgeFrom[key] = par; });
      let spurTarget = SP.targetResolved;
      if (!spurTarget) { let best = null, bd = -1; SP.order.forEach((n) => { const a = SP.arrival[n]; if (a > bd) { bd = a; best = n; } }); spurTarget = best; }
      // „Beides": Spur-Pfad = Weg des in der Routenfindung gewählten Algorithmus
      // (BFS/Dijkstra/A*/Greedy/Bidir/CCH). Fallbacks: Dijkstra-3D → Ausbreitungsbaum.
      const pfRoute = buildRoute(SP.startResolved, spurTarget, PF.algo, PF.weight, PF.eps);
      SP.spurPath = (pfRoute && pfRoute.path) || dijkstra3D(SP.startResolved, spurTarget) || pathTo(spurTarget) || [SP.startResolved];
      // Monotone „Erreich-Zeit" je Pfadknoten: Der Dijkstra-Pfad ≠ Ausbreitungsbaum, daher
      // können die Ankunftszeiten entlang des Pfads springen. Wir glätten sie zu einer nie
      // fallenden Folge, damit die Kamera trotzdem stetig mit der Welle vorwärtsrollt.
      SP.spurReach = []; { let mx = 0; for (let i = 0; i < SP.spurPath.length; i++) { const a = SP.arrival[SP.spurPath[i]]; mx = Math.max(mx, a === undefined ? mx : a); SP.spurReach[i] = mx; } }
      // Abstand jedes Knotens zum Ziel-Pfad (Mehrquellen-BFS von allen Pfadknoten) → steuert den „Pfad-Fokus"
      SP.distToRoute = {}; { const q = []; (SP.spurPath || []).forEach((n) => { if (SP.distToRoute[n] === undefined) { SP.distToRoute[n] = 0; q.push(n); } }); let h = 0; while (h < q.length) { const u = q[h++]; (adj3[u] || []).forEach((v) => { if (SP.distToRoute[v] === undefined) { SP.distToRoute[v] = SP.distToRoute[u] + 1; q.push(v); } }); } }
      const perStep = {}; SP.order.forEach((n) => { const s = SP.arrival[n]; perStep[s] = (perStep[s] || 0) + 1; });
      SP.curve = []; let cum = 0; for (let s = 0; s <= SP.maxStep; s++) { cum += (perStep[s] || 0); SP.curve.push(cum / SP.total); }
      SP.reachedTotal = SP.order.length; SP.computed = true;
      SP._nsig = {}; SP._esig = {}; SP._lastCur = undefined; SP._forceFull = true;   // Signaturen für Perf-Skipping zurücksetzen
      drawCurve(); setupSpreadEdges();
    }
    // Ausgangszustand der Kanten: Baum-Kanten verborgen (laden später), Rest gedimmt sichtbar
    function setupSpreadEdges() {
      if (!R) return; const dim = THEMES[theme].eC1;
      for (let i = 0; i < elist.length; i++) {
        const e = elist[i], key = (e[0] < e[1] ? e[0] + "|" + e[1] : e[1] + "|" + e[0]);
        if (SP.treeKeys.has(key)) R.setEdgeProgress(key, 0, SP.edgeFrom[key], true);
        else { R.setEdgeProgress(key, 1, e[0], false); R.setEdgeVisual(key, { color: dim, emissive: "#000000", emissiveIntensity: 0 }); }
      }
    }

    // ---- Farbschemata ----
    function heatHex(f) { const st = [[255,255,235],[255,214,90],[240,150,45],[205,70,40],[120,28,32]]; const x = clamp(f, 0, 1) * (st.length - 1), i = Math.floor(x), t = x - i, a = st[i], b = st[Math.min(st.length - 1, i + 1)]; return r2h([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]); }
    function hslHex(h, s, l) { h = (((h % 360) + 360) % 360) / 360; const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q, hp = (t) => { t = (t + 1) % 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; }; return r2h([hp(h + 1 / 3) * 255, hp(h) * 255, hp(h - 1 / 3) * 255]); }
    function spreadColor(step) { if (SP.scheme === "single") return ACCENT3D; if (SP.scheme === "rainbow") return hslHex(step * 48, 0.72, 0.56); return heatHex(SP.maxStep ? step / SP.maxStep : 0); }

    function applySpread(cur) {
      if (!R) return; const TH = THEMES[theme];
      // PERF: pro Knoten/Kante eine quantisierte „Signatur" merken und das (teure) GPU-Material-Update
      // überspringen, solange sich nichts ändert. Bereits aufgeleuchtete, ruhige Knoten kosten dann 0.
      if (SP._lastCur === undefined || cur < SP._lastCur - 1e-3 || SP._forceFull) { SP._nsig = {}; SP._esig = {}; SP._forceFull = false; }
      SP._lastCur = cur;
      const ns = SP._nsig || (SP._nsig = {}), es = SP._esig || (SP._esig = {});
      const glowN = Math.max(0.35, S.glow), glowE = Math.max(0.4, S.glow);
      const endA = spreadEndStep();   // bei konkretem Ziel: NUR bis dorthin färben – nichts dahinter leuchtet
      // Pfad-Fokus: je höher, desto weniger Nebenpfade. Erlaubter Abstand zum Ziel-Pfad sinkt mit focus.
      const focus = clamp(SP.focus || 0, 0, 1);
      const allowedBranch = focus > 0 ? Math.round((1 - focus) * SP.maxStep) : Infinity;
      const dr = SP.distToRoute || {};
      const offRoute = (n) => focus > 0 && dr[n] !== undefined && dr[n] > allowedBranch;   // zu weit vom Ziel-Pfad weg
      for (let i = 0; i < names.length; i++) {
        const n = names[i], a = SP.arrival[n];
        let sig, pulse;
        if (a === undefined || a > cur || a > endA || offRoute(n)) { sig = 0; }   // hinter dem Ziel oder zu weit neben dem Pfad → dunkel
        else { const age = cur - a; pulse = age < 1 ? (1 - age) : 0; sig = pulse > 0 ? (2 + Math.round(pulse * 12)) : 1; }
        if (ns[n] === sig) continue;                 // Zustand unverändert → GPU-Update sparen
        ns[n] = sig;
        if (sig === 0) { R.setNodeVisual(n, { color: TH.nBase, emissive: "#000000", emissiveIntensity: 0, scaleMul: 1 }); continue; }
        const col = spreadColor(a);
        R.setNodeVisual(n, { color: col, emissive: col, emissiveIntensity: (0.4 + 0.9 * pulse) * glowN, scaleMul: 1 + 0.9 * pulse });
      }
      // Baum-Kanten laden sich nacheinander entlang des Signalwegs auf (von Eltern- zu Kind-Knoten)
      for (let i = 0; i < SP.order.length; i++) {
        const n = SP.order[i], par = SP.parent[n]; if (par === undefined) continue;
        const a = SP.arrival[n], f = (a > endA || offRoute(n)) ? 0 : clamp(cur - (a - 1), 0, 1);   // Kanten hinter dem Ziel / neben dem Pfad nicht wachsen lassen
        const key = (n < par ? n + "|" + par : par + "|" + n);
        const esig = (f >= 1 ? 17 : Math.round(f * 16));   // FIX (Audit): f==1 eigene Signatur, sonst bleibt die Kante knapp vor dem Kind stehen
        if (es[key] === esig) continue;              // Wachstum unverändert → überspringen
        es[key] = esig;
        R.setEdgeProgress(key, f, par, true);
        if (f > 0) { const col = spreadColor(a); R.setEdgeVisual(key, { color: col, emissive: col, emissiveIntensity: 0.55 * glowE }); }
      }
    }

    function drawCurve() {
      const box = $id("net3d-curve"); if (!box) return;
      const W = 300, H = 90, ml = 26, mb = 16, mt = 6, mr = 6, n = SP.curve.length;
      const X = (i) => ml + (n <= 1 ? 0 : i / (n - 1) * (W - ml - mr)), Y = (v) => H - mb - clamp(v, 0, 1) * (H - mt - mb);
      const s = svgEl("svg", { viewBox: "0 0 " + W + " " + H, width: "100%" });
      s.appendChild(svgEl("line", { x1: ml, y1: H - mb, x2: W - mr, y2: H - mb, stroke: "#a98f5e", "stroke-width": 1 }));
      s.appendChild(svgEl("line", { x1: ml, y1: mt, x2: ml, y2: H - mb, stroke: "#a98f5e", "stroke-width": 1 }));
      [0, 0.5, 1].forEach((v) => { const yy = Y(v); s.appendChild(svgEl("line", { x1: ml, y1: yy, x2: W - mr, y2: yy, stroke: "#a98f5e", "stroke-width": 0.5, opacity: 0.4 })); txt(s, ml - 4, yy + 3, Math.round(v * 100) + "%", "end"); });
      let d = ""; for (let i = 0; i < n; i++) d += (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(SP.curve[i]).toFixed(1) + " ";
      s.appendChild(svgEl("path", { d: d, fill: "none", stroke: ZCOL.top, "stroke-width": 2 }));
      s.appendChild(svgEl("line", { id: "net3d-curve-mk", x1: ml, y1: mt, x2: ml, y2: H - mb, stroke: "#6e4717", "stroke-width": 1.2, "stroke-dasharray": "3 3" }));
      box.innerHTML = ""; box.appendChild(s); SP._curveX = X;
    }
    function moveCurveMarker(cur) { const mk = $id("net3d-curve-mk"); if (!mk || !SP._curveX) return; const x = SP._curveX(clamp(cur, 0, SP.maxStep)).toFixed(1); mk.setAttribute("x1", x); mk.setAttribute("x2", x); }

    function setStat(id, t) { const e = $id(id); if (e) e.textContent = t; }
    function clearReadout() { ["sp-cur", "sp-target", "sp-random", "sp-all"].forEach((id) => setStat(id, "—")); const c = $id("net3d-curve"); if (c) c.innerHTML = ""; }
    function updateSpreadReadout(cur) {
      const endA = spreadEndStep();   // bei konkretem Ziel wird nur bis dorthin gezählt (passt zur Färbung)
      const step = Math.min(Math.floor(Math.max(0, cur)), endA);
      const reachedNow = SP.order.filter((n) => SP.arrival[n] <= cur && SP.arrival[n] <= endA).length;
      setStat("sp-cur", "Runde " + step + " / " + SP.maxStep + " · " + reachedNow + " / " + SP.total + " erreicht (" + Math.round(reachedNow / SP.total * 100) + " %)");
      if (SP.targetResolved) {
        const a = SP.arrival[SP.targetResolved];
        if (a === undefined) setStat("sp-target", "Ziel " + SP.targetResolved + ": nie erreichbar");
        else setStat("sp-target", "Ziel " + SP.targetResolved + ": " + (cur >= a ? ("erreicht nach " + a + " Schritten · " + (a * SP.stepMs / 1000).toFixed(1) + " s") : ("unterwegs … Schritt " + a)));
      } else setStat("sp-target", "Ziel: alle erreichen");
      if (SP.randomPerson) { const a = SP.arrival[SP.randomPerson]; setStat("sp-random", "🎲 " + SP.randomPerson + ": " + (cur >= a ? (a + " Schritte") : ("Schritt " + a + " …"))); }
      else setStat("sp-random", "🎲 zufällige Person: —");
      const unreached = SP.total - SP.reachedTotal;
      if (unreached > 0) setStat("sp-all", "Alle: nie – " + unreached + " unerreichbar (max " + SP.maxStep + " Schritte)");
      else setStat("sp-all", "Alle wissen es nach " + SP.maxStep + " Schritten · " + (SP.maxStep * SP.stepMs / 1000).toFixed(1) + " s");
    }
    function updateSpreadFrame(now) {
      const raw = spreadCur(now), end = spreadEndStep();
      const cur = Math.min(raw, end + 1.4);   // nie über das Ziel hinaus animieren
      applySpread(cur);   // Färbung jeden Frame (mit Signature-Skipping günstig)
      // Mess-Text + Kurven-Marker nur ~11×/s aktualisieren – DOM-Schreibzugriffe sind teuer
      if (SP._lastReadout === undefined || now - SP._lastReadout > 90) { updateSpreadReadout(cur); moveCurveMarker(cur); SP._lastReadout = now; }
      if (raw > end + 1.3) { SP.running = false; SP.pauseCur = end + 1.3; spreadBtns(); updateSpreadReadout(cur); moveCurveMarker(cur); }
    }
    function spreadBtns() { const b = $id("net3d-sp-play"); if (b) b.textContent = SP.running ? "⏸ Pause" : "▶ Start"; }
    function playPauseSpread() {
      if (SP.running) { SP.pauseCur = spreadCur(performance.now()); SP.running = false; spreadBtns(); return; }
      if (!SP.computed) { computeSpread(); SP.pauseCur = 0; }
      SP.t0 = performance.now() - (SP.pauseCur || 0) * SP.stepMs; SP.running = true;
      if (spinning) { spinning = false; spinBtn(); } spreadBtns(); wake();
    }
    function restartSpread() { computeSpread(); SP.pauseCur = 0; SP.t0 = performance.now(); SP.running = true; if (spinning) { spinning = false; spinBtn(); } spreadBtns(); wake(); }
    function stopSpread() { const was = SP.computed; SP.running = false; SP.computed = false; SP.pauseCur = 0; if (was && R) R.resetVisuals(); clearReadout(); spreadBtns(); wake(); }

    /* =====================================================================
       KINO-KAMERA (Auto · Spur folgen · Welle · Von außen)
       ===================================================================== */
    const KINO = { on: false, mode: "auto", speed: 1, pos: { x: 0, y: 0, z: 520 }, look: { x: 0, y: 0, z: 0 }, tPos: { x: 0, y: 0, z: 520 }, tLook: { x: 0, y: 0, z: 0 }, up: { x: 0, y: 1, z: 0 }, tUp: { x: 0, y: 1, z: 0 }, roll: 0 };
    // ---- KAMERA-Experte: alle Werte als Faktoren (× layoutR) bzw. direkt; per Regler im Studio ----
    // dist/height/ahead skalieren mit dem Netz-Radius → gleiches Gefühl bei jeder Größe.
    const CAM = {
      dist: 0.42,     // Abstand der Kamera hinter der Front  (× layoutR) – etwas mehr Überblick
      height: 0.22,   // Höhe über dem Pfad                   (× layoutR) – leicht von oben, bessere Orientierung
      ahead: 0.32,    // wie weit voraus die Kamera blickt    (× layoutR)
      smooth: 0.80,   // Glättung 0..1 (höher = weicher/träger Nachzug) – ruhiger, weniger ruckelig
      bank: 0.30,     // Banking-Stärke 0..1 (Rollen in Kurven) – dezent statt wild
      fov: 52,        // Sichtfeld in Grad
      branch: 0.25,   // Verzweigung 0=Hauptpfad-Spline .. 1=aktiver Zweig – ruhiger Blick
      orbit: 0.8,     // Orbit-Tempo (Welle/Außen)
      orbitDist: 1.15 // Orbit-Abstand (Welle/Außen) – etwas mehr Abstand
    };
    const CAMDEF = Object.assign({}, CAM);
    function lerp3(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t }; }
    function damp3(a, b, k) { return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k }; }
    // FIX BUG 1: schiebt „pos" so weit vom „look"-Punkt weg, dass der Abstand >= minDist ist
    // (mutiert pos in-place). Verhindert, dass ein einzelner Knoten den Bildschirm füllt.
    function clampCameraDistance(pos, look, minDist) {
      let dx = pos.x - look.x, dy = pos.y - look.y, dz = pos.z - look.z;
      let d = Math.hypot(dx, dy, dz);
      if (d < 1e-4) { dx = 0; dy = 0; dz = 1; d = 1; }   // entartet → entlang +Z herausziehen
      if (d < minDist) { const s = minDist / d; pos.x = look.x + dx * s; pos.y = look.y + dy * s; pos.z = look.z + dz * s; }
    }
    // FIX BUG 2: liegt die Wellenfront (centroid) deutlich HINTER dem Blickpunkt (aus
    // Kamerasicht), ist sie auf der „Rückseite" und unsichtbar → Orbit muss herumschwenken.
    function isOnBackside(centroid) {
      if (!centroid) return false;
      let lx = KINO.look.x - KINO.pos.x, lz = KINO.look.z - KINO.pos.z;   // Blickrichtung in XZ
      const ll = Math.hypot(lx, lz) || 1; lx /= ll; lz /= ll;
      const cx = centroid.x - KINO.look.x, cz = centroid.z - KINO.look.z; // Front relativ zum Blickpunkt
      return (lx * cx + lz * cz) < -0.20 * layoutR;                       // Projektion deutlich negativ
    }
    function pathTo(target) { if (!target) return null; const p = []; let x = target, guard = 0; while (x !== undefined && guard < 2000) { p.unshift(x); if (x === SP.startResolved) break; x = SP.parent[x]; guard++; } return p[0] === SP.startResolved ? p : null; }
    // Schwerpunkt + Radius aller bis „cur" erreichten Knoten (für Außen-/Auto-Framing)
    function activeBounds(cur) {
      let cx = 0, cy = 0, cz = 0, cnt = 0;
      for (let i = 0; i < names.length; i++) { const a = SP.arrival[names[i]]; if (a !== undefined && a <= cur) { const p = P[names[i]]; cx += p.x; cy += p.y; cz += p.z; cnt++; } }
      if (!cnt) return { c: { x: 0, y: 0, z: 0 }, r: layoutR, cnt: 0 };
      cx /= cnt; cy /= cnt; cz /= cnt;
      let r = 0; for (let i = 0; i < names.length; i++) { const a = SP.arrival[names[i]]; if (a !== undefined && a <= cur) { const p = P[names[i]]; r = Math.max(r, Math.hypot(p.x - cx, p.y - cy, p.z - cz)); } }
      return { c: { x: cx, y: cy, z: cz }, r: Math.max(r, 50), cnt: cnt };
    }
    function frontierCentroid(cur) {
      const step = Math.round(cur); let cx = 0, cy = 0, cz = 0, cnt = 0;
      for (let i = 0; i < names.length; i++) { if (SP.arrival[names[i]] === step) { const p = P[names[i]]; cx += p.x; cy += p.y; cz += p.z; cnt++; } }
      return cnt ? { x: cx / cnt, y: cy / cnt, z: cz / cnt } : null;
    }
    // ---- Vektor-Mathe für die Kino-Kamera (Spline-Spur + Banking) ----
    function v_sub(a, b) { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; }
    function v_len(a) { return Math.hypot(a.x, a.y, a.z); }
    function v_norm(a) { const l = v_len(a) || 1; return { x: a.x / l, y: a.y / l, z: a.z / l }; }
    function v_cross(a, b) { return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x }; }
    function v_dot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
    // kontinuierlicher Pfad-Parameter u (0..len-1) aus der Ausbreitungszeit „cur"
    function spurParam(cur) {
      const path = SP.spurPath; if (!path || path.length < 2) return null;
      const reach = SP.spurReach || [];
      let i = 0; while (i < path.length - 1 && reach[i + 1] !== undefined && reach[i + 1] <= cur) i++;
      const j = Math.min(path.length - 1, i + 1);
      const a0 = reach[i] || 0, a1 = (reach[j] === undefined ? a0 + 1 : reach[j]);
      const segT = a1 > a0 ? clamp((cur - a0) / (a1 - a0), 0, 1) : 1;
      return { i: i, t: segT, n: path.length };
    }
    // Catmull-Rom-Spline durch die Pfad-Knoten → weiche Kurve statt Zickzack.
    // Liefert Position p, Geschwindigkeit vel (1. Ableitung) und Beschleunigung acc (2. Ableitung).
    function spurSpline(cur) {
      const par = spurParam(cur); if (!par) return null;
      const path = SP.spurPath, n = path.length, i = par.i, t = par.t;
      const gp = (idx) => P[path[clamp(idx, 0, n - 1)]] || { x: 0, y: 0, z: 0 };
      const p0 = gp(i - 1), p1 = gp(i), p2 = gp(i + 1), p3 = gp(i + 2);
      const t2 = t * t, t3 = t2 * t;
      // Standard-Catmull-Rom (uniform), Position + Ableitungen je Achse
      const comp = (a0, a1, a2, a3) => {
        const c0 = a1;
        const c1 = 0.5 * (a2 - a0);
        const c2 = a0 - 2.5 * a1 + 2 * a2 - 0.5 * a3;
        const c3 = -0.5 * a0 + 1.5 * a1 - 1.5 * a2 + 0.5 * a3;
        return {
          p: c0 + c1 * t + c2 * t2 + c3 * t3,
          v: c1 + 2 * c2 * t + 3 * c3 * t2,
          a: 2 * c2 + 6 * c3 * t
        };
      };
      const X = comp(p0.x, p1.x, p2.x, p3.x), Y = comp(p0.y, p1.y, p2.y, p3.y), Z = comp(p0.z, p1.z, p2.z, p3.z);
      return { p: { x: X.p, y: Y.p, z: Z.p }, vel: { x: X.v, y: Y.v, z: Z.v }, acc: { x: X.a, y: Y.a, z: Z.a } };
    }
    function cameraFrame(now, cur) {
      const aggressive = cur >= 3;                  // ab Schritt 3 deutlich straffer der Front folgen
      let m = KINO.mode, cut = false;
      if (m === "auto") {                           // intelligenter Schnitt Detail (Spur) ↔ Totale (Außen)
        let sub;
        if (cur > SP.maxStep + 0.2) sub = "outside";
        else if (cur < 2) sub = "path";
        else { const step = Math.round(cur), nw = names.filter((n) => SP.arrival[n] === step).length; sub = (nw >= 4) ? "outside" : "path"; }
        if (sub !== KINO._autoSub) { KINO._autoSub = sub; cut = true; }
        m = sub;
      }
      const b = activeBounds(cur);
      const frontC = SP.computed ? (frontierCentroid(cur) || b.c) : b.c;
      const backside = (m === "wave" || m === "outside") && isOnBackside(frontC);
      let dt = (KINO._lastNow === undefined) ? 16 : (now - KINO._lastNow); KINO._lastNow = now;
      if (dt < 0 || dt > 250) dt = 16;              // Tab-Wechsel / lange Pausen abfangen
      const orbit = (KINO._orbit = (KINO._orbit || 0) + dt * 0.00018 * KINO.speed * Math.max(0.05, CAM.orbit) * (backside ? 2.4 : 1));
      const worldUp = { x: 0, y: 1, z: 0 };
      let tUp = worldUp, minD = layoutR * 0.32 + 60;   // Standard-Mindestabstand (Orbit-Modi)

      if (m === "path") {                           // ---- SPUR: weiche Spline-Fahrt, Blick voraus, Banking ----
        const sp = spurSpline(cur);
        if (sp) {
          // Fahrtrichtung; am Pfad-Ende kann die Spline-Geschwindigkeit ~0 werden → letzte gültige Richtung halten
          let fwd = v_norm(sp.vel);
          if ((Math.abs(fwd.x) + Math.abs(fwd.y) + Math.abs(fwd.z)) < 1e-3) fwd = KINO._fwd || { x: 0, y: 0, z: 1 };
          KINO._fwd = fwd;
          // „rechts" der Bahn (für Banking + stabile Höhe); entartet bei senkrechter Fahrt → Z-Achse
          let right = v_cross(fwd, worldUp);
          if (v_len(right) < 1e-3) right = v_cross(fwd, { x: 0, y: 0, z: 1 });
          right = v_norm(right);
          const natUp = v_norm(v_cross(right, fwd));
          const back = CAM.dist * layoutR + 50, height = CAM.height * layoutR, ahead = CAM.ahead * layoutR + 30;
          // Kamera dicht hinter dem Spline-Punkt, leicht angehoben
          let tPos = { x: sp.p.x - fwd.x * back + worldUp.x * height, y: sp.p.y - fwd.y * back + height, z: sp.p.z - fwd.z * back + worldUp.z * height };
          // Blickziel weit voraus auf der Spline …
          let tLook = { x: sp.p.x + fwd.x * ahead, y: sp.p.y + fwd.y * ahead + height * 0.15, z: sp.p.z + fwd.z * ahead };
          // … und je nach „Verzweigung"-Regler zum aktiv ausbreitenden Zweig geschwenkt
          const fc = SP.computed ? frontierCentroid(cur) : null;
          if (fc && CAM.branch > 0.001) tLook = lerp3(tLook, fc, clamp(CAM.branch, 0, 1));
          // Banking: Krümmung der Bahn → Rollwinkel; Kamera legt sich in die Kurve
          const speed2 = v_dot(sp.vel, sp.vel) + 1e-3;
          const accPerp = v_sub(sp.acc, { x: fwd.x * v_dot(sp.acc, fwd), y: fwd.y * v_dot(sp.acc, fwd), z: fwd.z * v_dot(sp.acc, fwd) });
          const curv = v_len(accPerp) / speed2;                 // 1/Radius (Welt-Einheiten)
          const sideSign = v_dot(accPerp, right) >= 0 ? 1 : -1;
          const rollMag = clamp(curv * layoutR * 0.9, 0, 1);
          const roll = clamp(CAM.bank, 0, 1) * sideSign * rollMag * 0.6;   // max ~0.6 rad
          KINO.roll = roll;
          tUp = v_norm({ x: natUp.x * Math.cos(roll) + right.x * Math.sin(roll), y: natUp.y * Math.cos(roll) + right.y * Math.sin(roll), z: natUp.z * Math.cos(roll) + right.z * Math.sin(roll) });
          minD = Math.max(45, layoutR * 0.10);
          clampCameraDistance(tPos, tLook, minD);
          KINO.tPos = tPos; KINO.tLook = tLook;
        } else m = "outside";
      }
      if (m === "wave") {                           // ---- WELLE: im Zentrum der Welle, dreht mit der Expansion ----
        const fc = frontierCentroid(cur) || b.c, sN = P[SP.startResolved] || b.c;
        let ex = fc.x - sN.x, ez = fc.z - sN.z; const el = Math.hypot(ex, ez) || 1; ex /= el; ez /= el;
        const D = Math.max(layoutR * 0.45, b.r * 1.2 + 70) * CAM.orbitDist;
        const hy = D * (0.45 + CAM.height);
        KINO.tLook = fc;
        KINO.tPos = { x: fc.x - ex * D * 0.35 + Math.sin(orbit) * D * 0.55, y: fc.y + hy, z: fc.z - ez * D * 0.35 + Math.cos(orbit) * D * 0.55 };
        minD = layoutR * 0.4 + 70;
      } else if (m === "outside") {                 // ---- AUSSEN: epische Totale, zoomt dynamisch mit ----
        const D = Math.max(layoutR * 1.0, b.r * 2.4 + 110) * CAM.orbitDist;
        const hy = D * (0.4 + CAM.height * 0.8);
        KINO.tLook = b.c;
        KINO.tPos = { x: b.c.x + Math.sin(orbit) * D, y: b.c.y + hy, z: b.c.z + Math.cos(orbit) * D };
        minD = layoutR * 0.7 + 90;
      }
      if (m !== "path") clampCameraDistance(KINO.tPos, KINO.tLook, minD);
      // Schnitte weich überblenden (400 ms). Glättung kommt aus dem CAM.smooth-Regler:
      // smooth 0 = strafft (schnell/direkt), smooth 1 = sehr weicher, träger Nachzug.
      if (cut) KINO._cutT = now;
      const blendT = (KINO._cutT === undefined) ? 1 : clamp((now - KINO._cutT) / 400, 0, 1);
      const base = clamp(0.04 + (1 - clamp(CAM.smooth, 0, 1)) * 0.34, 0.03, 0.5) * (aggressive ? 1.25 : 1);
      const k = (blendT < 1) ? clamp(0.05 + 0.4 * blendT, 0.02, 0.9) : clamp(base, 0.02, 0.6);
      KINO.pos = damp3(KINO.pos, KINO.tPos, k);
      KINO.look = damp3(KINO.look, KINO.tLook, k);
      KINO.up = v_norm(damp3(KINO.up, tUp, Math.max(k, 0.08)));   // Banking weich nachziehen
    }

    /* =====================================================================
       ROUTENFINDUNG (Pathfinding) — wie Google Maps den Weg zum Ziel sucht
       BFS · Dijkstra · A* · Greedy · Bidirektional · CCH-Demo.
       Sichtbare Such-Animation + treibt zugleich die Kino-Kamera/Spur.
       (Engine separat gegen Dijkstra-Optimum gegengetestet → korrekt.)
       ===================================================================== */
    const PF = {
      algo: "astar", weight: "dist", eps: 1.0,
      start: "", goal: "", startResolved: "", goalResolved: "",
      running: false, t0: 0, stepMs: 90, pauseStep: 0, curStep: 0,
      result: null, _idx: {}, _side: {}, _lastShown: -1
    };
    const PF_ALGOS = [["bfs", "BFS"], ["dijkstra", "Dijkstra"], ["astar", "A*"], ["greedy", "Greedy"], ["bidir", "Bidirektional"], ["ch", "CCH-Demo"]];
    const PF_NAME = { bfs: "BFS", dijkstra: "Dijkstra", astar: "A*", greedy: "Greedy Best-First", bidir: "Bidirektional", ch: "CCH-Demo" };
    const PF_COL = { explore: "#4a6c8c", exploreB: "#8a5fa6", frontier: "#e6ad33", path: "#5fa04a", start: "#46d6a0", goal: "#e06a3a" };

    // ---- die Such-Engine: liefert {path, cost, steps, order:[{n,side}], explored, meet} ----
    // PERF: echter Binär-Min-Heap (O(log n) Push/Pop) statt pq.sort() pro Pop (war O(n log n) je Schritt).
    // Identische Ergebnisse, nur drastisch schneller bei großen Netzen / „alle Algorithmen vergleichen".
    function makeHeap() {
      const a = [];
      const up = (i) => { while (i > 0) { const p = (i - 1) >> 1; if (a[p].pr <= a[i].pr) break; const t = a[p]; a[p] = a[i]; a[i] = t; i = p; } };
      const down = (i) => { const N = a.length; for (;;) { let l = 2 * i + 1, r = l + 1, s = i; if (l < N && a[l].pr < a[s].pr) s = l; if (r < N && a[r].pr < a[s].pr) s = r; if (s === i) break; const t = a[s]; a[s] = a[i]; a[i] = t; i = s; } };
      return {
        push(item) { a.push(item); up(a.length - 1); },
        size() { return a.length; },
        peekPr() { return a.length ? a[0].pr : Infinity; },
        // entfernt & liefert den Knoten mit kleinster Priorität, der noch nicht „settled" ist (Lazy-Deletion)
        popMin(settled) { while (a.length) { const top = a[0], last = a.pop(); if (a.length) { a[0] = last; down(0); } if (!settled || !settled[top.n]) return top.n; } return undefined; }
      };
    }
    function buildRoute(start, goal, algo, weight, eps) {
      if (!start || !goal || !adj3[start] || !adj3[goal]) return null;
      if (start === goal) return { path: [start], cost: 0, steps: 0, order: [{ n: start, side: "f" }], explored: 1, meet: start };
      const W = (a, b) => weight === "hops" ? 1 : Math.hypot(P[a].x - P[b].x, P[a].y - P[b].y, P[a].z - P[b].z);
      let hScale = 1;
      if (weight === "hops") { let mx = 1e-6; for (let i = 0; i < elist.length; i++) { const e = elist[i], d = Math.hypot(P[e[0]].x - P[e[1]].x, P[e[0]].y - P[e[1]].y, P[e[0]].z - P[e[1]].z); if (d > mx) mx = d; } hScale = 1 / mx; }
      const H = (n) => { const d = Math.hypot(P[n].x - P[goal].x, P[n].y - P[goal].y, P[n].z - P[goal].z); return weight === "hops" ? d * hScale : d; };
      const sumCost = (path) => { let c = 0; for (let i = 0; i < path.length - 1; i++) c += W(path[i], path[i + 1]); return c; };

      if (algo === "bfs") {
        const prev = {}, seen = {}, order = []; const q = [start]; seen[start] = 1;
        while (q.length) { const u = q.shift(); order.push({ n: u, side: "f" }); if (u === goal) break; (adj3[u] || []).forEach((v) => { if (!seen[v]) { seen[v] = 1; prev[v] = u; q.push(v); } }); }
        if (seen[goal] === undefined) return null;
        const path = []; let x = goal; while (x !== undefined) { path.unshift(x); x = prev[x]; }
        return { path: path, cost: sumCost(path), steps: path.length - 1, order: order, explored: order.length, meet: null };
      }
      if (algo === "bidir") {
        const gf = {}, gb = {}, pf = {}, pb = {}, sf = {}, sb = {}, order = []; gf[start] = 0; gb[goal] = 0;
        const pqf = makeHeap(); pqf.push({ n: start, pr: 0 }); const pqb = makeHeap(); pqb.push({ n: goal, pr: 0 }); let best = Infinity, meetU = null, meetV = null;
        while (pqf.size() && pqb.size()) {
          if (pqf.peekPr() + pqb.peekPr() >= best) break;
          const uf = pqf.popMin(sf);
          if (uf !== undefined) { sf[uf] = 1; order.push({ n: uf, side: "f" }); (adj3[uf] || []).forEach((v) => { const ng = gf[uf] + W(uf, v); if (gf[v] === undefined || ng < gf[v]) { gf[v] = ng; pf[v] = uf; pqf.push({ n: v, pr: ng }); } if (gb[v] !== undefined && gf[uf] + W(uf, v) + gb[v] < best) { best = gf[uf] + W(uf, v) + gb[v]; meetU = uf; meetV = v; } }); }
          const ub = pqb.popMin(sb);
          if (ub !== undefined) { sb[ub] = 1; order.push({ n: ub, side: "b" }); (adj3[ub] || []).forEach((v) => { const ng = gb[ub] + W(ub, v); if (gb[v] === undefined || ng < gb[v]) { gb[v] = ng; pb[v] = ub; pqb.push({ n: v, pr: ng }); } if (gf[v] !== undefined && gb[ub] + W(ub, v) + gf[v] < best) { best = gb[ub] + W(ub, v) + gf[v]; meetU = v; meetV = ub; } }); }
        }
        if (best === Infinity) return null;
        const fpath = []; let x = meetU; while (x !== undefined) { fpath.unshift(x); x = pf[x]; }
        const bpath = []; x = meetV; while (x !== undefined) { bpath.push(x); x = pb[x]; }
        const path = fpath.concat(bpath);
        return { path: path, cost: best, steps: path.length - 1, order: order, explored: order.length, meet: meetU };
      }
      if (algo === "ch") {
        const order2 = names.slice().sort((a, b) => ((deg[a] || 0) - (deg[b] || 0)) || (a < b ? -1 : 1));
        const rank = {}; order2.forEach((n, i) => rank[n] = i);
        const G = {}; names.forEach((n) => G[n] = {});
        for (let i = 0; i < elist.length; i++) { const e = elist[i], w = W(e[0], e[1]); if (G[e[0]][e[1]] === undefined || w < G[e[0]][e[1]]) { G[e[0]][e[1]] = w; G[e[1]][e[0]] = w; } }
        const mid = {};
        order2.forEach((v) => { const nbrs = Object.keys(G[v]).filter((u) => rank[u] > rank[v]); for (let i = 0; i < nbrs.length; i++) for (let j = i + 1; j < nbrs.length; j++) { const u = nbrs[i], w = nbrs[j], cand = G[v][u] + G[v][w]; if (G[u][w] === undefined || cand < G[u][w]) { G[u][w] = cand; G[w][u] = cand; mid[u + "|" + w] = v; mid[w + "|" + u] = v; } } });
        const gf = {}, gb = {}, pf = {}, pb = {}, sf = {}, sb = {}, order = []; gf[start] = 0; gb[goal] = 0;
        const pqf = makeHeap(); pqf.push({ n: start, pr: 0 }); const pqb = makeHeap(); pqb.push({ n: goal, pr: 0 }); let best = Infinity, meetN = null;
        const relax = (u, gX, pX, pqX) => { Object.keys(G[u]).forEach((v) => { if (rank[v] <= rank[u]) return; const ng = gX[u] + G[u][v]; if (gX[v] === undefined || ng < gX[v]) { gX[v] = ng; pX[v] = u; pqX.push({ n: v, pr: ng }); } }); };
        while (pqf.size() || pqb.size()) {
          const topF = pqf.peekPr(), topB = pqb.peekPr();
          if (Math.min(topF, topB) >= best) break;
          if (topF <= topB) { const u = pqf.popMin(sf); if (u !== undefined) { sf[u] = 1; order.push({ n: u, side: "f" }); if (gb[u] !== undefined && gf[u] + gb[u] < best) { best = gf[u] + gb[u]; meetN = u; } relax(u, gf, pf, pqf); } }
          else { const u = pqb.popMin(sb); if (u !== undefined) { sb[u] = 1; order.push({ n: u, side: "b" }); if (gf[u] !== undefined && gf[u] + gb[u] < best) { best = gf[u] + gb[u]; meetN = u; } relax(u, gb, pb, pqb); } }
        }
        if (best === Infinity || meetN === null) return null;
        const up = []; let x = meetN; while (x !== undefined) { up.unshift(x); x = pf[x]; }
        const down = []; x = pb[meetN]; while (x !== undefined) { down.push(x); x = pb[x]; }
        const aug = up.concat(down);
        const unpack = (a, b, depth) => { if (depth > 5000) return [a, b]; const m = mid[a + "|" + b]; if (m === undefined) return [a, b]; return unpack(a, m, depth + 1).concat(unpack(m, b, depth + 1).slice(1)); };
        let path = [aug[0]];
        for (let i = 0; i < aug.length - 1; i++) path = path.concat(unpack(aug[i], aug[i + 1], 0).slice(1));
        return { path: path, cost: best, steps: path.length - 1, order: order, explored: order.length, meet: meetN };
      }
      // Dijkstra / A* / Greedy (Best-First mit unterschiedlicher Priorität)
      const g = {}, prev = {}, settled = {}, order = []; g[start] = 0;
      const prio = (n, gn) => algo === "dijkstra" ? gn : (algo === "greedy" ? H(n) : gn + eps * H(n));
      const pq = makeHeap(); pq.push({ n: start, pr: prio(start, 0) });
      while (pq.size()) {
        const u = pq.popMin(settled); if (u === undefined) break;
        settled[u] = 1; order.push({ n: u, side: "f" });
        if (u === goal) break;
        (adj3[u] || []).forEach((v) => { const ng = g[u] + W(u, v); if (g[v] === undefined || ng < g[v]) { g[v] = ng; prev[v] = u; pq.push({ n: v, pr: prio(v, ng) }); } });
      }
      if (g[goal] === undefined) return null;
      const path = []; let x = goal; while (x !== undefined) { path.unshift(x); x = prev[x]; }
      // FIX: tatsächliche Pfadkosten summieren statt g[goal] – bei Greedy/weighted-A* können die
      // prev-Ketten nach dem Settle noch verbessert werden, sodass g[goal] vom realen Pfad abweicht.
      return { path: path, cost: sumCost(path), steps: path.length - 1, order: order, explored: order.length, meet: null };
    }

    function pfResolve() {
      let s = PF.start, g = PF.goal;
      if (!s || s === "__random__" || !nodeExists(s)) s = names[Math.floor(Math.random() * names.length)] || names[0];
      if (!g || g === "__random__" || !nodeExists(g) || g === s) { let best = null, bd = -1; names.forEach((n) => { if (n === s) return; const d = Math.hypot(P[n].x - P[s].x, P[n].y - P[s].y, P[n].z - P[s].z); if (d > bd) { bd = d; best = n; } }); g = best || names[0]; }
      PF.startResolved = s; PF.goalResolved = g;
    }
    const pfGlow = (base) => base * Math.max(0.4, S.glow);
    function pfApplyReveal(reveal) {
      if (!R || !PF.result) return;
      const s = PF.startResolved, g = PF.goalResolved, idxMap = PF._idx, sideMap = PF._side, TH = THEMES[theme];
      for (let i = 0; i < names.length; i++) {
        const n = names[i];
        if (n === s) { R.setNodeVisual(n, { color: PF_COL.start, emissive: PF_COL.start, emissiveIntensity: pfGlow(0.6), scaleMul: 1.45 }); continue; }
        if (n === g) { R.setNodeVisual(n, { color: PF_COL.goal, emissive: PF_COL.goal, emissiveIntensity: pfGlow(0.6), scaleMul: 1.45 }); continue; }
        const idx = idxMap[n];
        if (idx !== undefined && idx < reveal) {
          if (idx === reveal - 1) R.setNodeVisual(n, { color: PF_COL.frontier, emissive: PF_COL.frontier, emissiveIntensity: pfGlow(0.85), scaleMul: 1.3 });
          else { const c = sideMap[n] === "b" ? PF_COL.exploreB : PF_COL.explore; R.setNodeVisual(n, { color: c, emissive: c, emissiveIntensity: pfGlow(0.22), scaleMul: 1.0 }); }
        } else R.setNodeVisual(n, { color: TH.nBase, emissive: "#000000", emissiveIntensity: 0, scaleMul: 1.0 });
      }
    }
    function pfDrawPath() {
      if (!R || !PF.result || !PF.result.path) return;
      const path = PF.result.path;
      for (let i = 0; i < path.length; i++) { const n = path[i]; if (n === PF.startResolved || n === PF.goalResolved) continue; R.setNodeVisual(n, { color: PF_COL.path, emissive: PF_COL.path, emissiveIntensity: pfGlow(0.55), scaleMul: 1.18 }); }
      for (let i = 0; i < path.length - 1; i++) { const a = path[i], b = path[i + 1], key = (a < b ? a + "|" + b : b + "|" + a); R.setEdgeVisual(key, { color: PF_COL.path, emissive: PF_COL.path, emissiveIntensity: pfGlow(0.6) }); }
    }
    function pfReadoutLive(reveal) {
      const ro = $id("net3d-pf-readout"); if (!ro) return;
      if (!PF.result) { ro.innerHTML = "<div class='sp-stat'>Kein Weg von " + PF.startResolved + " zu " + PF.goalResolved + " (Netz nicht verbunden).</div>"; return; }
      const total = PF.result.order.length, done = reveal >= total;
      let h = "<div class='sp-stat'><b>" + PF_NAME[PF.algo] + "</b> · " + (PF.weight === "hops" ? "Kantenanzahl" : "Distanz") + " · " + PF.startResolved + " → " + PF.goalResolved + "</div>";
      h += "<div class='sp-stat'>🔦 erkundet: <b>" + Math.min(reveal, total) + "</b> / " + total + " Knoten" + (done ? "" : " …") + "</div>";
      if (done) h += "<div class='sp-stat'>✅ Weg: <b>" + PF.result.steps + "</b> Schritte · Kosten <b>" + (PF.weight === "hops" ? PF.result.cost + " Kanten" : Math.round(PF.result.cost)) + "</b></div>";
      ro.innerHTML = h;
    }
    function pfBtns() { const b = $id("net3d-pf-run"); if (b) b.textContent = PF.running ? "⏸ Pause" : "🔦 Suchen"; }
    function pfCompute() {
      pfResolve();
      if (R) R.resetVisuals();
      PF.result = buildRoute(PF.startResolved, PF.goalResolved, PF.algo, PF.weight, PF.eps);
      PF._idx = {}; PF._side = {};
      if (PF.result) PF.result.order.forEach((o, i) => { if (PF._idx[o.n] === undefined) { PF._idx[o.n] = i; PF._side[o.n] = o.side; } });
      PF.curStep = 0; PF._lastShown = -1;
    }
    function pfRun() {
      if (PF.running) { PF.pauseStep = Math.floor((performance.now() - PF.t0) / PF.stepMs); PF.running = false; pfBtns(); return; }
      if (!PF.result) { pfCompute(); PF.pauseStep = 0; }
      if (!PF.result) { pfReadoutLive(0); return; }
      if (SP.running) { SP.running = false; spreadBtns(); }
      PF._lastShown = -1; PF.t0 = performance.now() - PF.pauseStep * PF.stepMs; PF.running = true; pfBtns(); wake();
    }
    function pfStep() {
      if (!PF.result) { pfCompute(); if (!PF.result) { pfReadoutLive(0); return; } }
      if (SP.running) { SP.running = false; spreadBtns(); }
      PF.running = false; const total = PF.result.order.length;
      PF.curStep = Math.min(total, PF.curStep + 1); PF.pauseStep = PF.curStep;
      pfApplyReveal(PF.curStep); pfReadoutLive(PF.curStep);
      if (PF.curStep >= total) pfDrawPath();
      pfBtns(); wake();
    }
    function pfReset() {
      PF.running = false; PF.result = null; PF.curStep = 0; PF.pauseStep = 0; PF._lastShown = -1;
      if (R) R.resetVisuals();
      const ro = $id("net3d-pf-readout"); if (ro) ro.innerHTML = "";
      pfBtns(); wake();
    }
    function pfFrame(now) {
      const total = PF.result ? PF.result.order.length : 0;
      let reveal = Math.floor((now - PF.t0) / PF.stepMs); if (reveal < 0) reveal = 0;
      const shown = Math.min(reveal, total);
      if (shown !== PF._lastShown) { pfApplyReveal(shown); pfReadoutLive(shown); PF._lastShown = shown; }   // nur bei Änderung neu zeichnen
      PF.curStep = shown;
      if (reveal >= total) { pfDrawPath(); PF.running = false; PF.pauseStep = total; pfBtns(); }
    }
    function pfCompare() {
      pfResolve(); const ro = $id("net3d-pf-readout"); if (!ro) return;
      const rows = PF_ALGOS.map((p) => { const r = buildRoute(PF.startResolved, PF.goalResolved, p[0], PF.weight, PF.eps); return { a: p[0], lab: p[1], exp: r ? r.explored : 0, cost: r ? r.cost : Infinity, steps: r ? r.steps : 0, ok: !!r }; });
      const maxExp = Math.max.apply(null, rows.map((r) => r.exp).concat(1));
      let h = "<div class='sp-stat'>⚖ Erkundete Knoten · " + PF.startResolved + " → " + PF.goalResolved + " · " + (PF.weight === "hops" ? "Kantenanzahl" : "Distanz") + "</div>";
      rows.forEach((r) => { const w = r.exp / maxExp * 100; h += "<div class='pf-bar" + (r.a === PF.algo ? " cur" : "") + "'><span class='pf-bl'>" + r.lab + "</span><span class='pf-bt'><span class='pf-bf' style='width:" + w.toFixed(0) + "%'></span></span><span class='pf-bv'>" + (r.ok ? r.exp : "—") + "</span></div>"; });
      h += "<div class='sp-stat'>Weniger = effizienter. Dijkstra/A*/Bidir/CCH finden denselben kürzesten Weg – A* & Co. prüfen aber viel weniger Knoten (Scheinwerfer statt Welle).</div>";
      ro.innerHTML = h;
    }
    function pfPopulateSelects() {
      const s = $id("net3d-pf-start"), t = $id("net3d-pf-goal"); if (!s || !t) return;
      const opts = names.map((n) => "<option value='" + n + "'>" + n + "</option>").join("");
      s.innerHTML = "<option value='__random__'>🎲 Zufällig</option>" + opts;
      t.innerHTML = "<option value='__random__'>🎲 / am weitesten</option>" + opts;
      if (PF.start !== "__random__" && !nodeExists(PF.start)) PF.start = names[0] || "__random__";
      if (PF.goal !== "__random__" && !nodeExists(PF.goal)) PF.goal = "__random__";
      s.value = PF.start || "__random__"; t.value = PF.goal || "__random__";
    }

    /* =====================================================================
       STUDIO-PANEL  (Generator + Ausbreitung + Routenfindung + Kino)
       ===================================================================== */
    function genOut(k, v) { if (k === "rewire") return (+v).toFixed(2); if (k === "density") return (+v).toFixed(1); return String(Math.round(v)); }
    function spOut(k, v) { if (k === "p" || k === "focus") return Math.round(v * 100) + " %"; if (k === "stepMs") return Math.round(v) + " ms"; if (k === "kspeed") return (+v).toFixed(1) + "×"; return String(v); }
    function genParamHtml() { return (GEN_PARAMS[GEN.preset] || []).map((c) => "<label class='s3d-row'><span>" + c.label + "</span><output data-go='" + c.k + "'></output><input type='range' data-g-s='" + c.k + "' min='" + c.min + "' max='" + c.max + "' step='" + c.step + "'></label>").join(""); }
    // ---- Layout-Anordnung & -Regler ----
    const LAY_ARRANGE = [["force", "Kraft"], ["cluster", "Cluster"], ["sphere", "Kugel"], ["layers", "Schichten"]];
    const LAY_SLD = [
      { k: "spread", label: "Spreizung (Abstand)", min: 0.3, max: 12, step: 0.1 },
      { k: "repulse", label: "Abstoßung", min: 0.1, max: 12, step: 0.1 },
      { k: "attract", label: "Anziehung", min: 0.1, max: 12, step: 0.1 },
      { k: "edgeLen", label: "Kantenlänge", min: 0.2, max: 10, step: 0.1 },
      { k: "thin", label: "Kanten ausdünnen", min: 0, max: 0.9, step: 0.05 }
    ];
    // ---- Kamera-Experte: alle Regler ----
    const CAM_SLD = [
      { k: "dist", label: "Abstand (hinter Front)", min: 0.05, max: 1.2, step: 0.01 },
      { k: "height", label: "Höhe über Pfad", min: -0.4, max: 1, step: 0.01 },
      { k: "ahead", label: "Vorausblick", min: 0, max: 1, step: 0.01 },
      { k: "smooth", label: "Glättung", min: 0, max: 1, step: 0.02 },
      { k: "bank", label: "Banking (Kurvenlage)", min: 0, max: 1, step: 0.02 },
      { k: "fov", label: "Sichtfeld (FOV)", min: 20, max: 90, step: 1 },
      { k: "branch", label: "Verzweigung folgen", min: 0, max: 1, step: 0.02 },
      { k: "orbit", label: "Orbit-Tempo (Welle/Außen)", min: 0.1, max: 3, step: 0.1 },
      { k: "orbitDist", label: "Orbit-Abstand (Welle/Außen)", min: 0.4, max: 2.5, step: 0.05 }
    ];
    function layOut(k, v) { return k === "thin" ? Math.round(v * 100) + " %" : (+v).toFixed(2) + "×"; }
    function camOut(k, v) { if (k === "fov") return Math.round(v) + "°"; if (k === "smooth" || k === "bank" || k === "branch") return Math.round(v * 100) + " %"; if (k === "dist" || k === "height" || k === "ahead") return (+v).toFixed(2) + "×"; return (+v).toFixed(1) + "×"; }
    function layRow(c) { return "<label class='s3d-row'><span>" + c.label + "</span><output data-lyo='" + c.k + "'></output><input type='range' data-lay-s='" + c.k + "' min='" + c.min + "' max='" + c.max + "' step='" + c.step + "'></label>"; }
    function camRow(c) { return "<label class='s3d-row'><span>" + c.label + "</span><output data-cmo='" + c.k + "'></output><input type='range' data-cam-s='" + c.k + "' min='" + c.min + "' max='" + c.max + "' step='" + c.step + "'></label>"; }
    let studioBuilt = false;
    function buildStudio() {
      const host = $id("net3d-studio"); if (!host || studioBuilt) return;
      let h = "<div class='s3d-head'><span>🌐 Netzwerk-Studio</span><span class='s3d-head-btns'><button id='net3d-info-btn2' type='button' title='Hilfe' aria-label='Hilfe'>ℹ</button><button id='net3d-studio-x' type='button' aria-label='schließen'>✕</button></span></div>";
      h += "<div class='s3d-sec'>Modus</div><div class='s3d-seg' id='net3d-mode'><button type='button' data-mode='lesson'>Lektion</button><button type='button' data-mode='generated'>Generiert</button></div>";
      h += "<label class='s3d-row' id='net3d-lesson-row'><span>Lektion</span><select id='net3d-lesson'>" + Object.keys(LESSONS).map((k) => "<option value='" + k + "'>" + LESSONS[k].label + "</option>").join("") + "</select></label>";
      h += "<p class='s3d-hint-mini' id='net3d-lesson-desc'></p>";
      h += "<div class='s3d-sec'>Generator</div>";
      h += "<div class='s3d-presets' id='net3d-presets'>" + GEN_PRESETS_UI.map((p) => "<button type='button' data-preset='" + p[0] + "'>" + p[1] + "</button>").join("") + "</div>";
      h += "<label class='s3d-row'><span>Größe (Personen)</span><output data-go='size'></output><input type='range' data-g-s='size' min='5' max='200' step='1'></label>";
      h += "<div id='net3d-genparams'>" + genParamHtml() + "</div>";
      h += "<button id='net3d-reroll' type='button' class='s3d-reset'>🎲 Neu würfeln (gleiches Muster)</button>";
      // ---- Anordnung & Abstand (Layout-Experte) ----
      h += "<div class='s3d-sec'>🧩 Anordnung & Abstand</div>";
      h += "<div class='s3d-seg' id='net3d-lay-arrange'>" + LAY_ARRANGE.map((a) => "<button type='button' data-arr='" + a[0] + "'>" + a[1] + "</button>").join("") + "</div>";
      h += LAY_SLD.map(layRow).join("");
      h += "<button id='net3d-lay-reset' type='button' class='s3d-reset'>↺ Anordnung zurücksetzen</button>";
      h += "<div class='s3d-sec'>Ausbreitung</div>";
      h += "<label class='s3d-row'><span>Start</span><select id='net3d-sp-start'></select></label>";
      h += "<label class='s3d-row'><span>Ziel</span><select id='net3d-sp-target'></select></label>";
      h += "<div class='s3d-seg' id='net3d-sp-model'><button type='button' data-spm='waves'>Wellen</button><button type='button' data-spm='random'>Zufall</button></div>";
      h += "<label class='s3d-row' id='net3d-sp-prow'><span>Ansteck-Wahrsch.</span><output data-spo='p'></output><input type='range' data-sp-s='p' min='0.05' max='1' step='0.05'></label>";
      h += "<label class='s3d-row'><span>Tempo</span><output data-spo='stepMs'></output><input type='range' data-sp-s='stepMs' min='120' max='2000' step='20'></label>";
      h += "<label class='s3d-row'><span>Pfad-Fokus (weniger Nebenpfade)</span><output data-spo='focus'></output><input type='range' data-sp-s='focus' min='0' max='1' step='0.05'></label>";
      h += "<div class='s3d-sec2'>Farben</div><div class='s3d-seg' id='net3d-sp-scheme'><button type='button' data-sch='heat'>Hitze</button><button type='button' data-sch='single'>Eine Farbe</button><button type='button' data-sch='rainbow'>Regenbogen</button></div>";
      // ---- Routenfindung (Pathfinding wie Google Maps) ----
      h += "<div class='s3d-sec'>🧭 Routenfindung (Weg zum Ziel)</div>";
      h += "<label class='s3d-row'><span>Algorithmus</span><select id='net3d-pf-algo'>" + PF_ALGOS.map((p) => "<option value='" + p[0] + "'>" + p[1] + "</option>").join("") + "</select></label>";
      h += "<div class='s3d-seg' id='net3d-pf-weight'><button type='button' data-pw='dist'>Distanz</button><button type='button' data-pw='hops'>Kantenanzahl</button></div>";
      h += "<label class='s3d-row' id='net3d-pf-eps-row'><span>A*-Heuristik (ε)</span><output data-pfo='eps'></output><input type='range' data-pf-s='eps' min='1' max='3' step='0.1'></label>";
      h += "<label class='s3d-row'><span>Start</span><select id='net3d-pf-start'></select></label>";
      h += "<label class='s3d-row'><span>Ziel</span><select id='net3d-pf-goal'></select></label>";
      h += "<label class='s3d-row'><span>Such-Tempo</span><output data-pfo='stepMs'></output><input type='range' data-pf-s='stepMs' min='10' max='400' step='10'></label>";
      h += "<div class='s3d-play'><button id='net3d-pf-run' type='button'>🔦 Suchen</button><button id='net3d-pf-step' type='button' title='Ein Schritt'>⏭</button><button id='net3d-pf-reset' type='button' title='Zurücksetzen'>■</button></div>";
      h += "<button id='net3d-pf-compare' type='button' class='s3d-reset'>⚖ Alle Algorithmen vergleichen</button>";
      h += "<div id='net3d-pf-readout'></div>";
      h += "<div class='s3d-legend'><span><i style='background:#46d6a0'></i>Start</span><span><i style='background:#e06a3a'></i>Ziel</span><span><i style='background:#4a6c8c'></i>erkundet</span><span><i style='background:#e6ad33'></i>Front</span><span><i style='background:#5fa04a'></i>Weg</span></div>";
      h += "<p class='s3d-hint-mini'>Tipp: Knoten <b>anklicken</b> = Start, <b>Shift-Klick</b> = Ziel · Taste <b>G</b> = suchen</p>";
      h += "<div class='s3d-sec2'>🎬 Kino-Kamera</div><label class='s3d-check'><input type='checkbox' id='net3d-kino-on'> Kino-Kamera folgt der Ausbreitung</label>";
      h += "<div class='s3d-seg' id='net3d-kino-mode'><button type='button' data-km='auto'>Auto</button><button type='button' data-km='path'>Spur</button><button type='button' data-km='wave'>Welle</button><button type='button' data-km='outside'>Außen</button></div>";
      h += "<label class='s3d-row'><span>Kino-Tempo</span><output data-spo='kspeed'></output><input type='range' data-sp-s='kspeed' min='0.2' max='3' step='0.1'></label>";
      // ---- Kamera-Experte: alle Kamera-Regler, ausklappbar ----
      h += "<details class='s3d-exp' id='net3d-cam-exp'><summary>🔧 Kamera-Experte (alle Regler)</summary><div class='s3d-exp-body'>";
      h += "<p class='s3d-hint-mini'>Abstand/Höhe/Vorausblick sind Faktoren der Netzgröße (×). Banking & Verzweigung wirken im <b>Spur</b>-Modus, Orbit im <b>Welle/Außen</b>-Modus.</p>";
      h += CAM_SLD.map(camRow).join("");
      h += "<button id='net3d-cam-reset' type='button' class='s3d-reset'>↺ Kamera zurücksetzen</button>";
      h += "</div></details>";
      h += "<div class='s3d-play'><button id='net3d-sp-play' type='button'>▶ Start</button><button id='net3d-sp-restart' type='button' title='Neu abspielen'>⟲</button><button id='net3d-sp-stop' type='button' title='Stopp/Zurücksetzen'>■</button></div>";
      h += "<div class='s3d-sec'>Messwerte</div><div id='net3d-readout'><div class='sp-stat' id='sp-cur'>—</div><div class='sp-stat' id='sp-target'>—</div><div class='sp-stat' id='sp-random'>—</div><div class='sp-stat' id='sp-all'>—</div><div id='net3d-curve'></div></div>";
      host.innerHTML = h;
      wireStudio(host); studioBuilt = true;
    }
    function wireGenParams(host) {
      host.querySelectorAll("input[data-g-s]").forEach((inp) => {
        if (inp.dataset.bound) return; inp.dataset.bound = "1";
        inp.addEventListener("input", () => { const k = inp.dataset.gS, o = host.querySelector("output[data-go='" + k + "']"); if (o) o.textContent = genOut(k, +inp.value); });
        inp.addEventListener("change", () => { const k = inp.dataset.gS; GEN[k] = +inp.value; mode = "generated"; markMode(); generate(); rebuildActive(); });
      });
    }
    function pfOut(k, v) { return k === "eps" ? (+v).toFixed(1) : (Math.round(v) + " ms"); }
    function markPf() { const host = $id("net3d-studio"); if (!host) return; host.querySelectorAll("#net3d-pf-weight button").forEach((b) => b.classList.toggle("on", b.dataset.pw === PF.weight)); const a = $id("net3d-pf-algo"); if (a) a.value = PF.algo; }
    function pfToggleEpsRow() { const row = $id("net3d-pf-eps-row"); if (row) row.style.display = (PF.algo === "astar") ? "" : "none"; }
    function wireStudio(host) {
      host.querySelectorAll("#net3d-mode button").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
      const lessonSel = $id("net3d-lesson");
      if (lessonSel) lessonSel.addEventListener("change", (e) => { lessonKey = e.target.value; mode = "lesson"; markMode(); rebuildActive(); });
      host.querySelectorAll("#net3d-presets button").forEach((b) => b.addEventListener("click", () => {
        GEN.preset = b.dataset.preset; GEN.seed = PRESET_SEED[GEN.preset] || 1;
        $id("net3d-genparams").innerHTML = genParamHtml(); wireGenParams(host); syncStudio();
        mode = "generated"; markMode(); markPreset(); generate(); rebuildActive();
      }));
      wireGenParams(host);
      $id("net3d-reroll").addEventListener("click", () => { GEN.seed = (Math.imul(GEN.seed, 1103515245) + 12345) >>> 0; mode = "generated"; markMode(); generate(); rebuildActive(); });
      $id("net3d-studio-x").addEventListener("click", () => { host.hidden = true; });
      const ib = $id("net3d-info-btn2"); if (ib) ib.addEventListener("click", toggleInfo);
      $id("net3d-sp-start").addEventListener("change", (e) => { SP.start = e.target.value; SP.computed = false; });
      $id("net3d-sp-target").addEventListener("change", (e) => { SP.target = e.target.value; SP.computed = false; });
      host.querySelectorAll("#net3d-sp-model button").forEach((b) => b.addEventListener("click", () => { SP.model = b.dataset.spm; SP.computed = false; markStudioSeg(); togglePRow(); }));
      host.querySelectorAll("#net3d-sp-scheme button").forEach((b) => b.addEventListener("click", () => { SP.scheme = b.dataset.sch; markStudioSeg(); if (SP.computed) { SP._forceFull = true; applySpread(SP.running ? spreadCur(performance.now()) : (SP.pauseCur || (spreadEndStep() + 1.3))); wake(); } }));
      $id("net3d-kino-on").addEventListener("change", (e) => { KINO.on = e.target.checked; wake(); });
      host.querySelectorAll("#net3d-kino-mode button").forEach((b) => b.addEventListener("click", () => { KINO.mode = b.dataset.km; markStudioSeg(); wake(); }));
      // ---- Layout-Anordnung & -Regler ----
      host.querySelectorAll("#net3d-lay-arrange button").forEach((b) => b.addEventListener("click", () => { LAY.arrange = b.dataset.arr; markStudioSeg(); applyLayout(); }));
      host.querySelectorAll("input[data-lay-s]").forEach((inp) => {
        inp.addEventListener("input", () => { const k = inp.dataset.layS, v = +inp.value; LAY[k] = v; const o = host.querySelector("output[data-lyo='" + k + "']"); if (o) o.textContent = layOut(k, v); });
        inp.addEventListener("change", () => { LAY[inp.dataset.layS] = +inp.value; applyLayout(); });   // schwere Neuberechnung erst beim Loslassen
      });
      $id("net3d-lay-reset").addEventListener("click", () => { Object.assign(LAY, LAYDEF); markStudioSeg(); applyLayout(); syncStudio(); });
      // ---- Kamera-Experte (live, ohne Neuberechnung des Layouts) ----
      host.querySelectorAll("input[data-cam-s]").forEach((inp) => inp.addEventListener("input", () => { const k = inp.dataset.camS, v = +inp.value; CAM[k] = v; const o = host.querySelector("output[data-cmo='" + k + "']"); if (o) o.textContent = camOut(k, v); wake(); }));
      $id("net3d-cam-reset").addEventListener("click", () => { Object.assign(CAM, CAMDEF); syncStudio(); wake(); });
      host.querySelectorAll("input[data-sp-s]").forEach((inp) => inp.addEventListener("input", () => {
        const k = inp.dataset.spS, v = +inp.value;
        if (k === "kspeed") KINO.speed = v; else { SP[k] = v; if (k === "p") SP.computed = false; }
        const o = host.querySelector("output[data-spo='" + k + "']"); if (o) o.textContent = spOut(k, v);
        if (k === "focus" && SP.computed) { SP._forceFull = true; if (!SP.running) applySpread(SP.pauseCur || (spreadEndStep() + 1.3)); wake(); }   // Pfad-Fokus sofort sichtbar
      }));
      $id("net3d-sp-play").addEventListener("click", playPauseSpread);
      $id("net3d-sp-restart").addEventListener("click", restartSpread);
      $id("net3d-sp-stop").addEventListener("click", stopSpread);
      // ---- Routenfindung ----
      $id("net3d-pf-algo").addEventListener("change", (e) => { PF.algo = e.target.value; PF.result = null; pfToggleEpsRow(); SP.computed = false; });
      host.querySelectorAll("#net3d-pf-weight button").forEach((b) => b.addEventListener("click", () => { PF.weight = b.dataset.pw; PF.result = null; markPf(); SP.computed = false; }));
      $id("net3d-pf-start").addEventListener("change", (e) => { PF.start = e.target.value; PF.result = null; });
      $id("net3d-pf-goal").addEventListener("change", (e) => { PF.goal = e.target.value; PF.result = null; });
      host.querySelectorAll("input[data-pf-s]").forEach((inp) => inp.addEventListener("input", () => { const k = inp.dataset.pfS, v = +inp.value; PF[k] = v; if (k === "eps") { PF.result = null; SP.computed = false; } const o = host.querySelector("output[data-pfo='" + k + "']"); if (o) o.textContent = pfOut(k, v); }));
      $id("net3d-pf-run").addEventListener("click", pfRun);
      $id("net3d-pf-step").addEventListener("click", pfStep);
      $id("net3d-pf-reset").addEventListener("click", pfReset);
      $id("net3d-pf-compare").addEventListener("click", pfCompare);
      pfPopulateSelects();
    }
    function populateSpreadSelects() {
      const s = $id("net3d-sp-start"), t = $id("net3d-sp-target"); if (!s || !t) return;
      const opts = names.map((n) => "<option value='" + n + "'>" + n + "</option>").join("");
      s.innerHTML = "<option value='__random__'>🎲 Zufällige Person</option>" + opts;
      t.innerHTML = "<option value='__all__'>Alle erreichen</option><option value='__random__'>🎲 Zufällige Person</option>" + opts;
      if (SP.start !== "__random__" && !nodeExists(SP.start)) SP.start = names[0] || "__random__";
      if (SP.target !== "__all__" && SP.target !== "__random__" && !nodeExists(SP.target)) SP.target = "__all__";
      s.value = SP.start || "__random__"; t.value = SP.target || "__all__";
    }
    function markMode() {
      const host = $id("net3d-studio"); if (!host) return;
      host.querySelectorAll("#net3d-mode button").forEach((b) => b.classList.toggle("on", b.dataset.mode === mode));
      // Lektions-Wähler nur im Lektion-Modus zeigen; Wert + Beschreibung aktualisieren
      const row = $id("net3d-lesson-row"), desc = $id("net3d-lesson-desc"), sel = $id("net3d-lesson");
      if (row) row.style.display = (mode === "lesson") ? "" : "none";
      if (desc) desc.style.display = (mode === "lesson") ? "" : "none";
      if (sel) sel.value = lessonKey;
      if (desc) desc.textContent = (LESSONS[lessonKey] && LESSONS[lessonKey].desc) || "";
    }
    function markPreset() { const host = $id("net3d-studio"); if (host) host.querySelectorAll("#net3d-presets button").forEach((b) => b.classList.toggle("on", b.dataset.preset === GEN.preset)); }
    function markStudioSeg() {
      const host = $id("net3d-studio"); if (!host) return;
      host.querySelectorAll("#net3d-sp-model button").forEach((b) => b.classList.toggle("on", b.dataset.spm === SP.model));
      host.querySelectorAll("#net3d-sp-scheme button").forEach((b) => b.classList.toggle("on", b.dataset.sch === SP.scheme));
      host.querySelectorAll("#net3d-kino-mode button").forEach((b) => b.classList.toggle("on", b.dataset.km === KINO.mode));
      host.querySelectorAll("#net3d-lay-arrange button").forEach((b) => b.classList.toggle("on", b.dataset.arr === LAY.arrange));
    }
    // Layout neu berechnen (Anordnung/Regler). Knotensatz + Ansicht bleiben erhalten,
    // aber laufende Ausbreitung/Routensuche werden sauber gestoppt (Positionen ändern sich).
    function applyLayout() {
      buildLayout();
      if (R) { R.setGraph(graphData()); R.setTheme(theme); R.setParams(S); }
      applyQuality();
      SP.running = false; SP.computed = false; SP.pauseCur = 0; spreadBtns();
      PF.running = false; PF.result = null; PF.curStep = 0; PF.pauseStep = 0; pfBtns();
      const ro = $id("net3d-pf-readout"); if (ro) ro.innerHTML = "";
      clearReadout();
      wake();
    }
    function togglePRow() { const row = $id("net3d-sp-prow"); if (row) row.style.display = (SP.model === "random") ? "" : "none"; }
    function syncStudio() {
      const host = $id("net3d-studio"); if (!host) return;
      markMode(); markPreset();
      const sizeInp = host.querySelector("input[data-g-s='size']"); if (sizeInp) sizeInp.value = GEN.size;
      const so = host.querySelector("output[data-go='size']"); if (so) so.textContent = genOut("size", GEN.size);
      (GEN_PARAMS[GEN.preset] || []).forEach((c) => { const inp = host.querySelector("input[data-g-s='" + c.k + "']"); if (inp) inp.value = GEN[c.k]; const o = host.querySelector("output[data-go='" + c.k + "']"); if (o) o.textContent = genOut(c.k, GEN[c.k]); });
      populateSpreadSelects();
      ["p", "stepMs", "focus"].forEach((k) => { const inp = host.querySelector("input[data-sp-s='" + k + "']"); if (inp) inp.value = SP[k]; const o = host.querySelector("output[data-spo='" + k + "']"); if (o) o.textContent = spOut(k, SP[k]); });
      const kInp = host.querySelector("input[data-sp-s='kspeed']"); if (kInp) kInp.value = KINO.speed; const ko = host.querySelector("output[data-spo='kspeed']"); if (ko) ko.textContent = spOut("kspeed", KINO.speed);
      const kon = $id("net3d-kino-on"); if (kon) kon.checked = KINO.on;
      // Routenfindung
      const algoSel = $id("net3d-pf-algo"); if (algoSel) algoSel.value = PF.algo;
      ["eps", "stepMs"].forEach((k) => { const inp = host.querySelector("input[data-pf-s='" + k + "']"); if (inp) inp.value = PF[k]; const o = host.querySelector("output[data-pfo='" + k + "']"); if (o) o.textContent = pfOut(k, PF[k]); });
      pfPopulateSelects(); markPf(); pfToggleEpsRow();
      // Layout- + Kamera-Experten-Regler
      LAY_SLD.forEach((c) => { const inp = host.querySelector("input[data-lay-s='" + c.k + "']"); if (inp) inp.value = LAY[c.k]; const o = host.querySelector("output[data-lyo='" + c.k + "']"); if (o) o.textContent = layOut(c.k, LAY[c.k]); });
      CAM_SLD.forEach((c) => { const inp = host.querySelector("input[data-cam-s='" + c.k + "']"); if (inp) inp.value = CAM[c.k]; const o = host.querySelector("output[data-cmo='" + c.k + "']"); if (o) o.textContent = camOut(c.k, CAM[c.k]); });
      markStudioSeg(); togglePRow();
    }
    function toggleStudio() { const host = $id("net3d-studio"); if (!host) return; buildStudio(); if (host.hidden) { syncStudio(); host.hidden = false; } else host.hidden = true; }

    /* =====================================================================
       INFO-/HILFE-OVERLAY  (erklärt jede Einstellung & jeden Kamera-Modus)
       ===================================================================== */
    let infoBuilt = false;
    function buildInfo() {
      const host = $id("net3d-info"); if (!host || infoBuilt) return;
      const sec = (t) => "<h3>" + t + "</h3>";
      const row = (k, v) => "<dt>" + k + "</dt><dd>" + v + "</dd>";
      let h = "<div class='info-card'><div class='info-head'><span>ℹ Hilfe — Netzwerk-Studio</span><button id='net3d-info-x' type='button' aria-label='schließen'>✕</button></div><div class='info-body'>";
      h += sec("Modus") + "<dl>" +
        row("Lektion", "Vorgefertigte Lehr-Netze zum Auswählen: „Beispiel 1“ ist das exakte Arbeitsblatt-Netz (im 2D-Bereich editierbar); dazu Netze passend zu den Aufgaben-Themen Grad/Influencer, Gruppen verbinden und Wege/Distanz.") +
        row("Generiert", "Zeigt ein automatisch erzeugtes Netz nach gewähltem Muster & Größe.") + "</dl>";
      h += sec("Generator-Muster (Presets)") + "<dl>" +
        row("Zufall", "Lockere Zufallsverbindungen, gleichmäßig verteilt (Erdős–Rényi).") +
        row("Influencer", "Wenige Knoten sammeln sehr viele Verbindungen (Scale-Free / Hubs).") +
        row("Cluster", "Mehrere dichte Freundesgruppen, lose untereinander verbunden.") +
        row("Kleine Welt", "Nachbar-Ring + einige Querverbindungen → jeder ist nah an jedem.") +
        row("YouTube", "Wenige Creator-Hubs, viele Zuschauer abonnieren beliebte Creator.") + "</dl>";
      h += sec("Generator-Regler") + "<dl>" +
        row("Größe", "Anzahl Personen (5–200). Das Muster bleibt gleich, nur die Größe ändert sich.") +
        row("Ø Verbindungen / Kanten je Person", "Wie dicht das Netz verknüpft ist.") +
        row("Gruppen", "Anzahl Freundes-Cluster.") +
        row("Nachbarn", "Direkte Nachbarn im Ring (Kleine Welt).") +
        row("Umverdrahtung", "Anteil zufällig verlegter Kanten – erzeugt den Kleine-Welt-Effekt.") +
        row("Creator", "Anzahl der großen Hubs (YouTube).") +
        row("🎲 Neu würfeln", "Neue Zufalls-Variante – gleiches Muster, andere Anordnung.") + "</dl>";
      h += sec("🧩 Anordnung & Abstand (Layout)") + "<dl>" +
        row("Kraft", "Physik-Layout: Knoten stoßen sich ab, Verbindungen ziehen zusammen – natürliche, organische Anordnung.") +
        row("Cluster", "Erkennt Gruppen automatisch und zieht sie räumlich auseinander – ideal, um Communities klar zu trennen.") +
        row("Kugel", "Alle Knoten gleichmäßig auf einer Kugeloberfläche – sehr übersichtlich, perfekt für die Orbit-Kamera.") +
        row("Schichten", "Konzentrische Schalen nach Abstand vom zentralsten Knoten – zeigt die Ausbreitung als Wellen/Ringe.") +
        row("Spreizung (Abstand)", "Gesamtgröße des Netzes – klein/gedrängt bis weit/luftig. Der wichtigste Übersichts-Regler bei großen Netzen.") +
        row("Abstoßung", "Wie stark sich Knoten gegenseitig wegdrücken – höher = gleichmäßiger verteilt, niedriger = klumpiger.") +
        row("Anziehung", "Wie stark Verbindungen zusammenziehen – höher = kompaktere, kürzere Kanten.") +
        row("Kantenlänge", "Soll-Länge der Verbindungen – kurz & kompakt vs. lang & gestreckt.") +
        row("Kanten ausdünnen", "Blendet die längsten „Kreuz-Kanten“ aus (ein Spannbaum bleibt immer erhalten) → entwirrt riesige Netze. Rein optisch: Ausbreitung & Routensuche rechnen weiter mit allen Kanten.") + "</dl>";
      h += sec("Ausbreitung") + "<dl>" +
        row("Start", "Person, von der die Information ausgeht (oder zufällig).") +
        row("Ziel", "Bei einer bestimmten (oder zufälligen) Person STOPPT die Ausbreitung, sobald diese erreicht ist – nur „alle erreichen“ läuft durchs ganze Netz.") +
        row("Wellen", "Deterministisch: jeder erzählt es JEDEM Nachbarn pro Schritt (exponentiell).") +
        row("Zufall", "Jeder Nachbar wird nur mit einer Wahrscheinlichkeit erreicht (SIR-ähnlich).") +
        row("Ansteck-Wahrsch.", "Nur bei „Zufall“: Chance, dass die Info an einen Nachbarn weitergegeben wird.") +
        row("Tempo", "Dauer pro Ausbreitungs-Schritt in Millisekunden.") +
        row("Pfad-Fokus", "Blendet Nebenpfade aus: 0 % = das ganze Netz breitet sich aus, 100 % = nur der Weg zum Ziel leuchtet. Dazwischen werden Knoten weiter weg vom Ziel-Pfad ausgeblendet. (Wirkt am besten zusammen mit einem konkreten Ziel.)") + "</dl>";
      h += sec("Farben") + "<dl>" +
        row("Hitze", "Früh erreichte Knoten glühen heiß (hell), spät erreichte kühl/dunkel.") +
        row("Eine Farbe", "Erreichte Knoten leuchten in einer Akzentfarbe mit Puls auf.") +
        row("Regenbogen", "Jede Welle/Runde bekommt eine eigene Farbe.") + "</dl>";
      h += sec("🧭 Routenfindung — wie Google Maps den Weg sucht") + "<dl>" +
        row("Idee", "Start & Ziel wählen (oder Knoten anklicken: Klick = Start, Shift-Klick = Ziel) und der Suche zusehen. Erkundete Knoten leuchten, der gefundene kürzeste Weg glüht grün. Taste G startet die Suche.") +
        row("BFS", "Breitensuche: tastet sich Schritt für Schritt voran und zählt nur Kanten (ungewichtet). Findet den Weg mit den wenigsten Stationen, ignoriert echte Distanzen.") +
        row("Dijkstra (1956)", "Berücksichtigt die Kosten (Distanz) und breitet sich wie eine Welle in ALLE Richtungen aus – findet garantiert den kürzesten Weg, prüft aber sehr viele Knoten.") +
        row("A* (A-Stern)", "Dijkstra mit Richtungssinn: eine Heuristik (Luftlinie zum Ziel) lenkt die Suche wie ein Scheinwerfer aufs Ziel. Findet denselben kürzesten Weg, prüft aber viel weniger Knoten.") +
        row("ε (A*-Heuristik)", "Gewicht der Heuristik. ε = 1 ist optimal. ε > 1 sucht zielstrebiger/schneller, kann aber einen leicht längeren Weg liefern (gewichtetes A*).") +
        row("Greedy", "Best-First, folgt NUR der Heuristik – sehr schnell, läuft aber oft in die Irre und findet meist NICHT den kürzesten Weg.") +
        row("Bidirektional", "Sucht gleichzeitig von Start UND Ziel; sobald sich die zwei Fronten treffen, steht der Weg. Reduziert die geprüften Knoten deutlich.") +
        row("CCH-Demo", "Vereinfachte Kontraktions-Hierarchie: wichtige „Autobahn“-Knoten (hoher Grad) zuerst, unwichtige vorab durch Abkürzungen (Shortcuts) ersetzt. So lösen echte Karten-Apps Kontinente in Mikrosekunden.") +
        row("Distanz / Kantenanzahl", "Gewichtsmodell: echte 3D-Distanz (kürzeste Strecke) oder reine Kantenanzahl (Hops, wie BFS).") +
        row("⚖ Vergleichen", "Spielt alle Algorithmen einmal durch und zeigt, wie viele Knoten jeder erkundet – der Effizienz-Vergleich aus dem Veritasium-Video.") +
        row("Beides", "Der gewählte Algorithmus bestimmt zugleich den Weg, dem die Kino-Kamera (Modus „Spur“) folgt.") + "</dl>";
      h += sec("🎬 Kino-Kamera-Modi") + "<dl>" +
        row("Auto", "Schneidet automatisch zwischen Detail (Spur) und Totale (Außen), je nach Aktivität.") +
        row("Spur", "Startet bei Knoten 1 und folgt der wachsenden Linie – sie rollt wie eine Straße vor der Kamera aus.") +
        row("Welle", "Kamera sitzt im Zentrum der Ausbreitungswelle und dreht mit der Expansionsrichtung mit.") +
        row("Außen", "Epische Außenperspektive; zoomt dynamisch mit, damit stets das ganze Geschehen im Bild ist.") +
        row("Kino-Tempo", "Wie schnell/aggressiv die Kamera nachzieht. Ab Schritt 3 folgt sie ohnehin straffer der Front.") + "</dl>";
      h += sec("🔧 Kamera-Experte (alle Regler)") + "<dl>" +
        row("Abstand", "Wie dicht die Kamera hinter der Front sitzt (Faktor der Netzgröße). Klein = immersiv nah, groß = mehr Überblick.") +
        row("Höhe", "Wie hoch die Kamera über dem Pfad schwebt – negativ = leicht von unten.") +
        row("Vorausblick", "Wie weit voraus die Kamera entlang der Spur blickt – größer = ruhiger, mehr Vorausschau.") +
        row("Glättung", "Wie weich die Kamera nachzieht. Hoch = sehr sanft/filmisch (träger), niedrig = direkt/schnell.") +
        row("Banking (Kurvenlage)", "Wie stark sich die Kamera in Kurven legt (rollt) – 0 = Horizont immer waagrecht, hoch = filmisch wie ein Kampfjet.") +
        row("Sichtfeld (FOV)", "Blickwinkel des Objektivs. Klein = Teleobjektiv (kinoiger, weniger Verzerrung), groß = Weitwinkel (mehr im Bild).") +
        row("Verzweigung folgen", "Bei Abzweigen: 0 = ruhig dem geglätteten Hauptpfad folgen, 1 = den Kopf zum aktiv ausbreitenden Zweig drehen.") +
        row("Orbit-Tempo / -Abstand", "Nur Welle/Außen: wie schnell die Kamera umkreist und wie weit weg sie dabei bleibt.") +
        row("↺ Kamera zurücksetzen", "Setzt alle Kamera-Experten-Regler auf die Standardwerte zurück.") + "</dl>";
      h += sec("Steuerung & Messwerte") + "<dl>" +
        row("▶ / ⏸", "Ausbreitung starten / pausieren.") + row("⟲", "Neu abspielen.") + row("■", "Stoppen & zurücksetzen.") +
        row("Messwerte", "Schritte bis zur Zielperson, bis zu einer zufälligen Person, bis ALLE es wissen, plus %-Kurve pro Runde.") + "</dl>";
      h += sec("Qualität (⚙ Einstellungen)") + "<dl>" +
        row("Presets", "Niedrig … Maximal – Glätte der Kugeln & Auflösung in einem Klick.") +
        row("Kugel-/Kanten-Glätte", "Wie rund Kugeln bzw. Kanten dargestellt werden.") +
        row("Auflösung", "Render-Schärfe (Pixeldichte).") +
        row("Auto-Qualität", "Senkt die Detailstufe bei sehr großen Netzen automatisch für flüssige Darstellung.") + "</dl>";
      h += sec("Navigation") + "<dl>" +
        row("Ziehen", "Drehen. Shift/Rechtsklick = verschieben. Mausrad = zoomen.") +
        row("Knoten anklicken", "Linksklick = Start setzen, Shift-Klick = Ziel setzen. Beim Überfahren zeigt ein Tooltip Name, Grad & Luftlinie zum Ziel.") +
        row("Strg+F", "Flug-Modus (WASD).") +
        row("R / ⟲ Ansicht", "Ansicht zurücksetzen – passt den Zoom automatisch an die Netzgröße an.") + "</dl>";
      h += "</div></div>";
      host.innerHTML = h;
      $id("net3d-info-x").addEventListener("click", () => { host.hidden = true; });
      host.addEventListener("click", (e) => { if (e.target === host) host.hidden = true; }); // Klick auf Hintergrund schließt
      infoBuilt = true;
    }
    function toggleInfo() { buildInfo(); const host = $id("net3d-info"); if (host) host.hidden = !host.hidden; }

    function resetView() { rotX = -0.35; rotY = 0.5; zoom = fitZoom(); panX = 0; panY = 0; velX = 0; velY = 0; cam.x = 0; cam.y = 0; cam.z = 0; wake(); }
    function open() {
      ensureGraph(); ov.hidden = false; buildSettings(); buildStudio(); buildLayout(); ensureR();
      if (R) { R.setGraph(graphData()); R.setTheme(theme); R.setParams(S); R.resize(); }
      applyQuality(); populateSpreadSelects(); pfPopulateSelects();
      SP.running = false; SP.computed = false; SP.pauseCur = 0; clearReadout(); spreadBtns();
      PF.running = false; PF.result = null; PF.curStep = 0; PF.pauseStep = 0; pfBtns();
      resetView(); spinning = true; flyMode = false; keys.clear(); spinBtn(); themeBtn(); flyBtn(); setHint(); wake();
    }
    function close() { ov.hidden = true; stopLoop(); pointers.clear(); pinchDist = 0; dragging = false; keys.clear(); SP.running = false; PF.running = false; const sp = $id("net3d-settings"); if (sp) sp.hidden = true; const st = $id("net3d-studio"); if (st) st.hidden = true; const inf = $id("net3d-info"); if (inf) inf.hidden = true; }
    function toggleSpin() { spinning = !spinning; spinBtn(); wake(); }
    function toggleTheme() { theme = theme === "dark" ? "paper" : "dark"; themeBtn(); if (R) R.setTheme(theme); wake(); }
    function toggleFly() { flyMode = !flyMode; if (!flyMode) keys.clear(); flyBtn(); setHint(); wake(); }

    // ---- Knoten-Auswahl per Klick + Hover-Tooltip (Raycast) ----
    let downX = 0, downY = 0, downMoved = false, downShift = false, downBtn = 0, hoverT = 0, tipEl = null;
    function pickAt(clientX, clientY) {
      if (!R || !R.pickNode) return null;
      const r = cv.getBoundingClientRect(); if (!r.width || !r.height) return null;
      return R.pickNode(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    }
    function hideTip() { if (tipEl) tipEl.hidden = true; }
    function pfPreviewMarkers() {
      if (!R) return; PF.running = false; R.resetVisuals();
      if (PF.start && nodeExists(PF.start)) R.setNodeVisual(PF.start, { color: PF_COL.start, emissive: PF_COL.start, emissiveIntensity: pfGlow(0.6), scaleMul: 1.45 });
      if (PF.goal && nodeExists(PF.goal) && PF.goal !== PF.start) R.setNodeVisual(PF.goal, { color: PF_COL.goal, emissive: PF_COL.goal, emissiveIntensity: pfGlow(0.6), scaleMul: 1.45 });
      wake();
    }
    function setNodeAsEndpoint(node, asGoal) {
      if (!node) return;
      if (asGoal) PF.goal = node; else PF.start = node;
      PF.result = null; SP.computed = false;
      const ss = $id("net3d-pf-start"), gs = $id("net3d-pf-goal"); if (ss) ss.value = PF.start; if (gs) gs.value = PF.goal;
      const hint = $id("net3d-hint"); if (hint) hint.textContent = (asGoal ? "🎯 Ziel" : "🟢 Start") + " = " + node + "  ·  🔦 Suchen (oder Taste G)";
      pfPreviewMarkers();
    }
    function showHover(e) {
      if (dragging || pointers.size > 0 || flyMode || ov.hidden) { hideTip(); return; }
      const now = performance.now(); if (now - hoverT < 40) return; hoverT = now;
      if (!tipEl) { tipEl = document.createElement("div"); tipEl.id = "net3d-tooltip"; tipEl.hidden = true; ov.appendChild(tipEl); }
      const node = pickAt(e.clientX, e.clientY);
      if (!node) { tipEl.hidden = true; cv.style.cursor = "grab"; return; }
      cv.style.cursor = "pointer";
      const gg = (PF.goal && nodeExists(PF.goal)) ? PF.goal : PF.goalResolved;
      let html = "<b>" + node + "</b> · Grad " + (deg[node] || 0);
      if (gg && nodeExists(gg) && node !== gg) html += "<br>Luftlinie zum Ziel (h): " + Math.round(Math.hypot(P[node].x - P[gg].x, P[node].y - P[gg].y, P[node].z - P[gg].z));
      if (PF.result && PF.result.path.indexOf(node) >= 0) html += "<br>✅ auf dem Weg";
      else if (PF._idx && PF._idx[node] !== undefined) html += "<br>🔦 erkundet";
      tipEl.innerHTML = html;
      const r = cv.getBoundingClientRect();
      tipEl.style.left = (e.clientX - r.left + 14) + "px"; tipEl.style.top = (e.clientY - r.top + 14) + "px"; tipEl.hidden = false;
    }

    cv.addEventListener("contextmenu", (e) => e.preventDefault());
    cv.addEventListener("pointerdown", (e) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try { cv.setPointerCapture(e.pointerId); } catch (_) {}
      hideTip();
      if (pointers.size >= 2) { dragging = false; const pts = [...pointers.values()]; pinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y); pinchMid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }; return; }
      dragging = true; dragMode = (e.shiftKey || e.button === 1 || e.button === 2) ? "pan" : "rotate";
      downX = e.clientX; downY = e.clientY; downMoved = false; downShift = e.shiftKey; downBtn = e.button;
      velX = 0; velY = 0; lx = e.clientX; ly = e.clientY; wake();
    });
    cv.addEventListener("pointermove", (e) => {
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size >= 2) {           // Pinch-Zoom + Zwei-Finger-Verschieben
        const pts = [...pointers.values()], d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y), mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
        if (pinchDist) zoom = clamp(zoom * (d / pinchDist), 0.015, 5);
        if (pinchMid) { panX += mid.x - pinchMid.x; panY += mid.y - pinchMid.y; }
        pinchDist = d; pinchMid = mid; wake(); return;
      }
      if (!dragging) { showHover(e); return; }
      if (!downMoved && Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 5) downMoved = true;
      const dx = e.clientX - lx, dy = e.clientY - ly;
      if (dragMode === "pan") { panX += dx; panY += dy; }
      else { velY = dx * 0.01; velX = dy * 0.01; rotY += velY; rotX = clamp(rotX + velX, -1.45, 1.45); }
      lx = e.clientX; ly = e.clientY; wake();
    });
    function endPointer(e) { pointers.delete(e.pointerId); if (pointers.size < 2) { pinchDist = 0; pinchMid = null; } if (pointers.size === 0) dragging = false; }
    function onPointerUp(e) {
      const wasSingle = (pointers.size === 1);   // dieser Zeiger ist der letzte
      endPointer(e);
      if (!wasSingle || downMoved || flyMode || downBtn !== 0) return;   // nur echter Links-Klick ohne Ziehen
      const node = pickAt(e.clientX, e.clientY);
      if (node) setNodeAsEndpoint(node, e.shiftKey || downShift);
    }
    cv.addEventListener("pointerup", onPointerUp);
    cv.addEventListener("pointercancel", endPointer);
    cv.addEventListener("pointerleave", hideTip);
    cv.addEventListener("dblclick", resetView);
    cv.addEventListener("wheel", (e) => {
      e.preventDefault();
      if (flyMode) { S.flySpeed = +clamp(S.flySpeed * (e.deltaY < 0 ? 1.15 : 0.87), 0.3, 30).toFixed(2); syncOne("flySpeed"); setHint(); }
      else zoom = clamp(zoom * (e.deltaY < 0 ? 1.12 : 0.89), 0.015, 5);
      wake();
    }, { passive: false });
    window.addEventListener("resize", () => { if (!ov.hidden) { sizeCanvas(); wake(); } });
    document.addEventListener("keydown", (e) => {
      if (ov.hidden) return;
      const info = $id("net3d-info"); if (info && !info.hidden) { if (e.key === "Escape") { info.hidden = true; e.preventDefault(); } return; }
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "select" || tag === "textarea") return;   // Einstellungs-Felder nicht stören
      if ((e.ctrlKey || e.metaKey) && (e.key === "f" || e.key === "F")) { toggleFly(); e.preventDefault(); return; }
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (flyMode && k.length === 1 && "wasdqe".indexOf(k) >= 0) { keys.add(k); wake(); e.preventDefault(); return; }
      let handled = true;
      switch (e.key) {
        case "Escape": close(); break;
        case "ArrowLeft": velY = -0.04; rotY -= 0.07; break;
        case "ArrowRight": velY = 0.04; rotY += 0.07; break;
        case "ArrowUp": rotX = clamp(rotX - 0.07, -1.45, 1.45); break;
        case "ArrowDown": rotX = clamp(rotX + 0.07, -1.45, 1.45); break;
        case "+": case "=": zoom = clamp(zoom * 1.12, 0.015, 5); break;
        case "-": case "_": zoom = clamp(zoom * 0.89, 0.015, 5); break;
        case "0": case "r": case "R": resetView(); break;
        case "g": case "G": pfRun(); break;          // Routensuche starten/pausieren
        case " ": toggleSpin(); break;
        default: handled = false;
      }
      if (handled) { e.preventDefault(); wake(); }
    });
    document.addEventListener("keyup", (e) => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; keys.delete(k); });
    $id("net-3d").addEventListener("click", open);
    $id("net3d-close").addEventListener("click", close);
    $id("net3d-reset").addEventListener("click", resetView);
    $id("net3d-spin").addEventListener("click", toggleSpin);
    $id("net3d-theme").addEventListener("click", toggleTheme);
    $id("net3d-fly").addEventListener("click", toggleFly);
    $id("net3d-settings-btn").addEventListener("click", toggleSettings);
    $id("net3d-studio-btn").addEventListener("click", toggleStudio);
    $id("net3d-info-btn").addEventListener("click", toggleInfo);
  })();

  /* ========================================================
     SIMULATOR 3 — EXPONENTIELLES WACHSTUM
     ======================================================== */
  const exIn = { n0: $id("ex-n0"), a: $id("ex-a"), t: $id("ex-t"), lin: $id("ex-linear"), cmp: $id("ex-cmp"), a2: $id("ex-a2"), goal: $id("ex-goal") };

  function renderExp(animate) {
    const N0 = +exIn.n0.value, a = +exIn.a.value, t = +exIn.t.value;
    const lin = exIn.lin.checked, cmp = exIn.cmp.checked, a2 = +exIn.a2.value, goal = Math.max(1, +exIn.goal.value || 1);
    $id("ex-a2-ctl").hidden = !cmp;
    $id("ex-n0-out").textContent = fmt(N0); $id("ex-a-out").textContent = fmt(a, 1); $id("ex-t-out").textContent = t; $id("ex-a2-out").textContent = fmt(a2, 1);

    const Nt = N0 * Math.pow(a, t);
    $id("ex-value").textContent = fmt(Math.round(Nt));
    $id("ex-formula").textContent = fmt(N0, Number.isInteger(N0) ? 0 : 1) + " · " + fmt(a, 1) + sup(t);

    let goalTxt;
    if (N0 >= goal) goalTxt = "schon ab Runde 0";
    else if (a <= 1) goalTxt = "nie (Faktor ≤ 1)";
    else goalTxt = "ab Runde " + Math.ceil(Math.log(goal / N0) / Math.log(a));
    $id("ex-goal-out").textContent = "≥ " + fmt(goal) + " " + goalTxt;

    let rows = "<tr><th>Runde</th><th>N(r)</th><th>gesamt</th></tr>", cum = 0;
    for (let r = 0; r <= t; r++) { const v = N0 * Math.pow(a, r); cum += v; rows += "<tr class='" + (r === t ? "hot" : "") + "'><td>" + r + "</td><td>" + fmt(Math.round(v)) + "</td><td>" + fmt(Math.round(cum)) + "</td></tr>"; }
    $id("ex-table").innerHTML = rows;

    let leg = "<span><i style='background:#6e4717'></i>N(t) = " + fmt(N0) + "·" + fmt(a, 1) + "ᵗ</span>";
    if (cmp) leg += "<span><i style='background:#9c4f37'></i>Vergleich a₂ = " + fmt(a2, 1) + "</span>";
    if (lin) leg += "<span><i style='background:#7c8240'></i>linear</span>";
    $id("ex-legend").innerHTML = leg;

    renderExpChart({ N0, a, t, lin, cmp, a2, animate });
  }
  function renderExpChart(o) {
    const N0 = o.N0, a = o.a, t = o.t, lin = o.lin, cmp = o.cmp, a2 = o.a2;
    const W = 440, H = 250, ml = 54, mr = 16, mt = 16, mb = 32;
    const f = (x) => N0 * Math.pow(a, x), f2 = (x) => N0 * Math.pow(a2, x);
    const linEnd = N0 * (1 + (a - 1) * t);
    const ymax = Math.max(f(t), cmp ? f2(t) : 0, lin ? linEnd : 0, 1);
    const X = (x) => ml + (x / t) * (W - ml - mr);
    const Y = (y) => H - mb - clamp(y / ymax, 0, 1) * (H - mt - mb);
    const s = svgEl("svg", { viewBox: "0 0 " + W + " " + H });
    for (let g = 0; g <= 4; g++) { const yy = mt + (H - mt - mb) * g / 4; s.appendChild(svgEl("line", { x1: ml, y1: yy, x2: W - mr, y2: yy, stroke: "#a98f5e", "stroke-width": .6, opacity: .5 })); txt(s, ml - 6, yy + 3, fmt(Math.round(ymax * (4 - g) / 4)), "end"); }
    s.appendChild(svgEl("line", { x1: ml, y1: H - mb, x2: W - mr, y2: H - mb, stroke: "#6e4717", "stroke-width": 1.2 }));
    s.appendChild(svgEl("line", { x1: ml, y1: mt, x2: ml, y2: H - mb, stroke: "#6e4717", "stroke-width": 1.2 }));
    for (let r = 0; r <= t; r++) txt(s, X(r), H - mb + 14, r, "middle");
    txt(s, (ml + W) / 2, H - 4, "Runden (t)", "middle");
    if (lin) s.appendChild(svgEl("line", { x1: X(0), y1: Y(N0), x2: X(t), y2: Y(linEnd), stroke: ZCOL.good, "stroke-width": 1.8, "stroke-dasharray": "5 4" }));
    if (cmp) { let d2 = ""; for (let i = 0; i <= 80; i++) { const x = t * i / 80; d2 += (i ? "L" : "M") + X(x).toFixed(1) + " " + Y(f2(x)).toFixed(1) + " "; } s.appendChild(svgEl("path", { d: d2, fill: "none", stroke: ZCOL.bad, "stroke-width": 2.2, "stroke-dasharray": "6 4" })); }
    let d = "";
    for (let i = 0; i <= 80; i++) { const x = t * i / 80; d += (i ? "L" : "M") + X(x).toFixed(1) + " " + Y(f(x)).toFixed(1) + " "; }
    const path = svgEl("path", { d: d, fill: "none", stroke: "#6e4717", "stroke-width": 2.8 });
    s.appendChild(path);
    for (let r = 0; r <= t; r++) s.appendChild(svgEl("circle", { cx: X(r), cy: Y(f(r)), r: 3.2, fill: "#9c6b1c" }));
    s.appendChild(svgEl("circle", { cx: X(t), cy: Y(f(t)), r: 5.5, fill: "#6e4717", stroke: "#fdf3d8", "stroke-width": 1.5 }));
    $id("ex-chart").innerHTML = ""; $id("ex-chart").appendChild(s);
    if (o.animate) { const len = path.getTotalLength(); path.style.strokeDasharray = len; path.style.strokeDashoffset = len; path.getBoundingClientRect(); path.style.transition = "stroke-dashoffset 1.1s ease"; requestAnimationFrame(() => { path.style.strokeDashoffset = 0; }); }
  }
  ["n0", "a", "t"].forEach((k) => exIn[k].addEventListener("input", () => renderExp(false)));
  [exIn.lin, exIn.cmp].forEach((el) => el.addEventListener("change", () => renderExp(false)));
  exIn.a2.addEventListener("input", () => renderExp(false));
  exIn.goal.addEventListener("input", () => renderExp(false));
  $$(".presets button[data-ex]").forEach((b) => b.addEventListener("click", () => { const v = b.dataset.ex.split(",").map(Number); exIn.n0.value = v[0]; exIn.a.value = v[1]; exIn.t.value = v[2]; renderExp(true); }));

  /* ========================================================
     INHALTS-EDITOR  ·  Text ändern · löschen · hinzufügen · sortieren
     Speichert pro "Zone" (statischer Inhalts-Block einer Folie) einen
     HTML-Schnappschuss in localStorage. Simulatoren bleiben unberührt.
     ======================================================== */
  const ED_KEY = "smm-content";
  const ED_BLACK = ".sim, .fs-btn, .btn3d, .orn";                       // diese Folien-Kinder nie bearbeiten
  const ED_EDITABLE = "h1,h2,h3,h4,h5,h6,p,li,td,th,figcaption,blockquote,.chip,.sec-tag,.kicker,.hint,.tag-best,.fb-tag,.fb-law";
  const ED_MIN_W = 4, ED_MIN_H = 4;
  const origZones = {};                                                 // id -> ursprüngliches innerHTML
  let edData = { zones: {}, deleted: {}, objects: {} };
  let editing = false, selBlock = null;
  let edBar = null, edTools = null, edAdd = null, edBtn = null, edBox = null, edDrag = null, edSaveT = 0;

  function edInteractive(el) { return !!el.querySelector("canvas,svg,input,select,textarea,button,.sim"); }
  function edLoad() { try { const r = JSON.parse(localStorage.getItem(ED_KEY) || "{}"); if (r && typeof r === "object") { edData.zones = r.zones || {}; edData.deleted = r.deleted || {}; edData.objects = r.objects || {}; } } catch (_) {} }
  function edSave() { try { localStorage.setItem(ED_KEY, JSON.stringify(edData)); } catch (_) {} }
  function edRound(v) { return Math.round(v * 100) / 100; }
  function edActiveSlide() { return slides[idx] || $(".slide.active") || slides[0]; }
  function edObjId(el) { return el && el.getAttribute ? el.getAttribute("data-edobj") : ""; }
  function edObjOf(el) { const id = edObjId(el); return id ? edData.objects[id] : null; }
  function edIsFree(el) { const o = edObjOf(el); return !!(o && o.free); }
  function edCurrentZone() {
    if (selBlock && selBlock.closest) return selBlock.closest("[data-zone]");
    const slide = edActiveSlide();
    return slide ? $("[data-zone]", slide) : null;
  }
  function edSetBarHeight() {
    if (!edBar) return;
    document.documentElement.style.setProperty("--edbar-h", Math.max(52, edBar.offsetHeight || 52) + "px");
  }

  function edAssignZones() {
    slides.forEach((slide, si) => {
      let zi = 0;
      Array.prototype.forEach.call(slide.children, (child) => {
        if (child.nodeType !== 1) return;
        if (child.matches(".orn")) return;
        const id = "z" + si + "-" + (zi++);
        child.setAttribute("data-zone", id);
        origZones[id] = child.innerHTML;
      });
    });
  }
  function edApply() {
    for (const id in edData.zones) { const z = document.querySelector('[data-zone="' + id + '"]'); if (z) z.innerHTML = edData.zones[id]; }
    for (const id in edData.deleted) { if (edData.deleted[id]) { const z = document.querySelector('[data-zone="' + id + '"]'); if (z) z.style.display = "none"; } }
    edEnsureAllObjects();
    edApplyObjects();
  }
  function edSaveZone(z) {
    if (!z) return; const id = z.getAttribute("data-zone"); if (!id) return;
    const clone = z.cloneNode(true);
    clone.querySelectorAll("[contenteditable]").forEach((e) => e.removeAttribute("contenteditable"));
    clone.querySelectorAll(".eb-sel").forEach((e) => e.classList.remove("eb-sel"));
    edData.zones[id] = clone.innerHTML;
    edSave();
  }
  function edMarkEditable(on) {
    document.querySelectorAll("[data-zone]").forEach((z) => {
      let els = Array.prototype.slice.call(z.querySelectorAll(ED_EDITABLE));
      els = els.filter(el => !el.closest(".sim") && !edInteractive(el) && !el.matches("button, input, select, textarea, canvas, svg"));
      els.forEach((e) => { if (on) e.setAttribute("contenteditable", "true"); else e.removeAttribute("contenteditable"); });
    });
    document.querySelectorAll("[data-ed-added='true']").forEach((o) => {
      let els = Array.prototype.slice.call(o.querySelectorAll(ED_EDITABLE));
      if (o.matches && o.matches(ED_EDITABLE)) els.unshift(o);
      els = els.filter(el => !el.closest(".sim") && !edInteractive(el) && !el.matches("button, input, select, textarea, canvas, svg"));
      els.forEach((e) => { if (on) e.setAttribute("contenteditable", "true"); else e.removeAttribute("contenteditable"); });
    });
  }

  function edCleanClone(el) {
    const c = el.cloneNode(true);
    c.querySelectorAll("[contenteditable]").forEach((e) => e.removeAttribute("contenteditable"));
    c.querySelectorAll(".eb-sel").forEach((e) => e.classList.remove("eb-sel"));
    c.classList.remove("eb-sel");
    return c;
  }
  function edBoxFor(el) {
    const slide = el.closest(".slide") || edActiveSlide();
    if (!slide) return null;
    const sr = slide.getBoundingClientRect(), r = el.getBoundingClientRect();
    return {
      slide: slide,
      x: edRound(((r.left - sr.left) / sr.width) * 100),
      y: edRound(((r.top - sr.top) / sr.height) * 100),
      w: edRound((r.width / sr.width) * 100),
      h: edRound((r.height / sr.height) * 100)
    };
  }
  function edFindObj(id) {
    if (!id) return null;
    let el = document.querySelector('[data-edobj="' + id + '"]');
    if (!el && id.indexOf("-self") > 0) {
      const zid = id.slice(0, id.indexOf("-self"));
      el = document.querySelector('[data-zone="' + zid + '"]');
      if (el) el.setAttribute("data-edobj", id);
    }
    return el;
  }
  function edEnsureObj(el) {
    if (!el || !el.setAttribute) return null;
    let id = edObjId(el);
    if (!id) {
      const z = el.closest("[data-zone]");
      const base = z ? z.getAttribute("data-zone") : ("s" + idx);
      id = (z && el === z) ? (base + "-self") : (base + "-o" + Math.floor(Math.random() * 1e8).toString(36));
      el.setAttribute("data-edobj", id);
      if (z) edSaveZone(z);
    }
    if (!edData.objects[id]) {
      const box = edBoxFor(el) || { x: 24, y: 24, w: 32, h: 12 };
      edData.objects[id] = { slide: idx, free: false, x: box.x, y: box.y, w: box.w, h: box.h, z: 20, rotate: 0 };
    }
    return id;
  }
  function edSetEditableIn(el, on) {
    if (!el) return;
    const els = Array.prototype.slice.call(el.querySelectorAll(ED_EDITABLE));
    if (el.matches && el.matches(ED_EDITABLE)) els.unshift(el);
    els.forEach((e) => { if (on) e.setAttribute("contenteditable", "true"); else e.removeAttribute("contenteditable"); });
  }
  function edGetZoneBlocks(z) {
    if (!z) return [];
    if (z.matches("p, h1, h2, h3, h4, h5, h6, li, td, th, figcaption, blockquote, .card, .fallbeispiel, .presets, .sim-controls, .sim-view, .gauge-wrap, .sim, button, svg, canvas, .formula-hero, .slide-head")) {
      return [z];
    }
    const kids = Array.prototype.filter.call(z.children, (c) => c.nodeType === 1);
    if (!kids.length) return [z];
    return kids;
  }
  function edEnsureAllObjects() {
    slides.forEach((slide, si) => {
      const zones = slide.querySelectorAll("[data-zone]");
      zones.forEach((z) => {
        const zoneId = z.getAttribute("data-zone");
        const blocks = edGetZoneBlocks(z);
        blocks.forEach((b, bi) => {
          let id = edObjId(b);
          if (!id) {
            id = blocks.length === 1 ? (zoneId + "-self") : (zoneId + "-c" + bi);
            b.setAttribute("data-edobj", id);
          }
          if (!edData.objects[id]) {
            const box = edBoxFor(b);
            if (box) {
              edData.objects[id] = {
                slide: si,
                free: true,
                x: box.x,
                y: box.y,
                w: box.w,
                h: box.h,
                z: 20,
                rotate: 0
              };
            }
          } else {
            edData.objects[id].free = true;
          }
        });
      });
    });
  }
  function edApplyObj(el, o) {
    if (!el || !o) return;
    const isFree = o.free !== false;
    if (isFree) {
      el.classList.add("ed-free-object");
      el.style.position = "absolute";
      el.style.left = edRound(o.x || 0) + "%";
      el.style.top = edRound(o.y || 0) + "%";
      el.style.width = edRound(Math.max(ED_MIN_W, o.w || 20)) + "%";
      
      const isShape = el.classList.contains("ed-shape") || el.classList.contains("ed-shape-rect") || el.classList.contains("ed-shape-circle") || el.classList.contains("ed-shape-line");
      if (isShape) {
        el.style.height = edRound(Math.max(ED_MIN_H, o.h || 8)) + "%";
        el.style.minHeight = "";
      } else {
        el.style.height = "auto";
        el.style.minHeight = edRound(Math.max(ED_MIN_H, o.h || 8)) + "%";
      }
      
      el.style.zIndex = String(o.z || 20);
      el.style.transform = (o.rotate ? "rotate(" + edRound(o.rotate) + "deg)" : "");
    } else {
      el.classList.remove("ed-free-object");
      ["position", "left", "top", "width", "height", "minHeight", "zIndex", "transform"].forEach((p) => { el.style[p] = ""; });
    }
  }
  function edSaveObj(el) {
    const id = edObjId(el), o = edData.objects[id];
    if (!id || !o) return;
    const box = edBoxFor(el);
    if (box) { o.x = box.x; o.y = box.y; o.w = Math.max(ED_MIN_W, box.w); o.h = Math.max(ED_MIN_H, box.h); }
    if (o.added) {
      const c = edCleanClone(el);
      o.html = c.innerHTML;
      o.className = Array.prototype.filter.call(c.classList, (n) => n !== "eb-sel").join(" ");
    }
    edSave();
  }
  function edNextZ(slide) {
    let z = 20;
    Object.keys(edData.objects || {}).forEach((id) => {
      const o = edData.objects[id];
      if (!o || !o.free) return;
      if (o.slide === idx || (slide && edFindObj(id) && edFindObj(id).closest(".slide") === slide)) z = Math.max(z, (o.z || 20) + 1);
    });
    return z;
  }
  function edApplyObjects() {
    edData.objects = edData.objects || {};
    Object.keys(edData.objects).forEach((id) => {
      const o = edData.objects[id] || {};
      let el = edFindObj(id);
      if (!el && o.added) {
        const slide = slides[o.slide || 0] || slides[0];
        if (!slide) return;
        el = document.createElement("div");
        el.setAttribute("data-edobj", id);
        el.setAttribute("data-ed-added", "true");
        el.className = o.className || "ed-added-object ed-textbox";
        el.innerHTML = o.html || "<p>Neues Objekt</p>";
        slide.appendChild(el);
      }
      if (el) {
        el.setAttribute("data-edobj", id);
        edApplyObj(el, o);
      }
    });
  }
  function edShowBox() {
    if (!edBox || !selBlock) { if (edBox) edBox.classList.remove("show"); return; }
    const o = edObjOf(selBlock);
    if (!o || !o.free) { if (edBox) edBox.classList.remove("show"); return; }
    const r = selBlock.getBoundingClientRect();
    edBox.classList.add("show");
    edBox.style.left = r.left + "px";
    edBox.style.top = r.top + "px";
    edBox.style.width = r.width + "px";
    edBox.style.height = r.height + "px";
  }
  function edStartDrag(kind, ev) {
    if (!selBlock) return;
    const o = edObjOf(selBlock), slide = selBlock.closest(".slide") || edActiveSlide();
    if (!o || !o.free) return;
    if (!o || !slide) return;
    ev.preventDefault();
    ev.stopPropagation();
    const sr = slide.getBoundingClientRect();
    edDrag = { kind: kind || "move", id: edObjId(selBlock), sx: ev.clientX, sy: ev.clientY, x: o.x || 0, y: o.y || 0, w: o.w || 20, h: o.h || 8, sw: sr.width, sh: sr.height };
    if (edBox.setPointerCapture && ev.pointerId != null) edBox.setPointerCapture(ev.pointerId);
  }
  function edOnPointerMove(ev) {
    if (!edDrag) return;
    const el = edFindObj(edDrag.id), o = edData.objects[edDrag.id];
    if (!el || !o) return;
    const dx = ((ev.clientX - edDrag.sx) / edDrag.sw) * 100;
    const dy = ((ev.clientY - edDrag.sy) / edDrag.sh) * 100;
    const k = edDrag.kind;
    let x = edDrag.x, y = edDrag.y, w = edDrag.w, h = edDrag.h;
    if (k === "move") { x += dx; y += dy; }
    else {
      if (k.indexOf("e") >= 0) w += dx;
      if (k.indexOf("s") >= 0) h += dy;
      if (k.indexOf("w") >= 0) { x += dx; w -= dx; }
      if (k.indexOf("n") >= 0) { y += dy; h -= dy; }
    }
    w = Math.max(ED_MIN_W, Math.min(100, w));
    h = Math.max(ED_MIN_H, Math.min(100, h));
    x = clamp(x, -20, 100 - ED_MIN_W);
    y = clamp(y, -20, 100 - ED_MIN_H);
    Object.assign(o, { x: edRound(x), y: edRound(y), w: edRound(w), h: edRound(h), free: true });
    edApplyObj(el, o);
    edShowBox();
  }
  function edOnPointerUp() {
    if (!edDrag) return;
    const el = edFindObj(edDrag.id);
    edDrag = null;
    if (el) { edSaveObj(el); const z = el.closest("[data-zone]"); if (z) edSaveZone(z); }
  }
  function edMakeFree() {
    if (!selBlock) return;
    const id = edEnsureObj(selBlock), o = edData.objects[id], box = edBoxFor(selBlock);
    if (!o || !box) return;
    Object.assign(o, { slide: idx, free: true, x: box.x, y: box.y, w: Math.max(ED_MIN_W, box.w), h: Math.max(ED_MIN_H, box.h), z: o.z || edNextZ(box.slide) });
    edApplyObj(selBlock, o);
    const z = selBlock.closest("[data-zone]");
    if (z) edSaveZone(z);
    edSave();
    edSelect(selBlock);
  }
  function edUnfree() {
    if (!selBlock || !edIsFree(selBlock)) return;
    const id = edObjId(selBlock), o = edData.objects[id];
    if (o && o.added) return;
    if (o) o.free = false;
    edApplyObj(selBlock, o);
    const z = selBlock.closest("[data-zone]");
    if (z) edSaveZone(z);
    edSave();
    edSelect(selBlock);
  }
  function edCenter(axis) {
    if (!selBlock || !edIsFree(selBlock)) return;
    const o = edObjOf(selBlock);
    if (!o) return;
    if (axis === "x") o.x = edRound((100 - (o.w || 20)) / 2);
    if (axis === "y") o.y = edRound((100 - (o.h || 8)) / 2);
    edApplyObj(selBlock, o);
    edSaveObj(selBlock);
    edShowBox();
    edPlaceTools();
  }
  function edCycleAlign() {
    if (!selBlock) return;
    const aligns = ["", "left", "center", "right", "justify"];
    let cur = selBlock.style.textAlign || "";
    let nextIdx = (aligns.indexOf(cur) + 1) % aligns.length;
    selBlock.style.textAlign = aligns[nextIdx];
    const z = selBlock.closest("[data-zone]");
    if (z) edSaveZone(z);
    edSaveObj(selBlock);
  }
  function edLayer(dir) {
    if (!selBlock || !edIsFree(selBlock)) return;
    const o = edObjOf(selBlock);
    if (!o) return;
    o.z = dir > 0 ? edNextZ(selBlock.closest(".slide")) : Math.max(1, (o.z || 20) - 1);
    edApplyObj(selBlock, o);
    edSaveObj(selBlock);
  }
  function edCreateObject(kind) {
    const slide = edActiveSlide();
    if (!slide) return;
    const id = "new-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e5).toString(36);
    const el = document.createElement("div");
    el.setAttribute("data-edobj", id);
    el.setAttribute("data-ed-added", "true");
    el.className = "ed-added-object";
    if (kind === "rect") { el.className += " ed-shape ed-shape-rect"; el.innerHTML = "<p>Form</p>"; }
    else if (kind === "circle") { el.className += " ed-shape ed-shape-circle"; el.innerHTML = "<p></p>"; }
    else if (kind === "line") { el.className += " ed-shape ed-shape-line"; el.innerHTML = ""; }
    else if (kind === "card") { el.className += " card ed-card"; el.innerHTML = "<h3>Neue Karte</h3><ul class='bullets'><li>Neuer Punkt</li></ul>"; }
    else { el.className += " ed-textbox"; el.innerHTML = "<p>Textfeld</p>"; }
    slide.appendChild(el);
    edData.objects[id] = { added: true, slide: idx, free: true, x: 28, y: 28, w: kind === "line" ? 36 : 34, h: kind === "line" ? 4 : 12, z: edNextZ(slide), rotate: 0 };
    edApplyObj(el, edData.objects[id]);
    edSetEditableIn(el, editing);
    edSaveObj(el);
    edSelect(el);
  }
  function edDuplicateFree() {
    if (!selBlock || !edIsFree(selBlock)) return false;
    const slide = selBlock.closest(".slide") || edActiveSlide();
    const oldId = edObjId(selBlock), old = edData.objects[oldId] || {};
    const c = edCleanClone(selBlock);
    const id = "dup-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e5).toString(36);
    c.setAttribute("data-edobj", id);
    c.setAttribute("data-ed-added", "true");
    c.classList.add("ed-added-object");
    slide.appendChild(c);
    edData.objects[id] = Object.assign({}, old, { added: true, slide: idx, x: edRound((old.x || 20) + 3), y: edRound((old.y || 20) + 3), z: edNextZ(slide), html: c.innerHTML, className: c.className });
    edApplyObj(c, edData.objects[id]);
    edSetEditableIn(c, editing);
    edSaveObj(c);
    edSelect(c);
    return true;
  }
  function edDeleteFree() {
    if (!selBlock || !edIsFree(selBlock)) return false;
    const el = selBlock, id = edObjId(el), o = edData.objects[id], z = el.closest("[data-zone]");
    if (o && o.added) { delete edData.objects[id]; el.remove(); }
    else {
      delete edData.objects[id];
      if (z && el === z) { z.style.display = "none"; edData.deleted[z.getAttribute("data-zone")] = true; }
      else el.remove();
      if (z) edSaveZone(z);
    }
    edSave();
    selBlock = null;
    edHideTools();
    return true;
  }
  function edNudge(dx, dy) {
    if (!selBlock || !edIsFree(selBlock)) return false;
    const o = edObjOf(selBlock);
    if (!o) return false;
    o.x = edRound((o.x || 0) + dx);
    o.y = edRound((o.y || 0) + dy);
    edApplyObj(selBlock, o);
    edSaveObj(selBlock);
    edShowBox();
    edPlaceTools();
    return true;
  }

  function edBlockOf(el) {                                               // {zone, block, leaf}
    const z = el && el.closest ? el.closest("[data-zone]") : null;
    if (!z) return null;
    const blocks = edGetZoneBlocks(z);
    if (blocks.includes(z)) return { zone: z, block: z, leaf: true };
    for (const b of blocks) {
      if (b === el || b.contains(el)) {
        return { zone: z, block: b, leaf: false };
      }
    }
    return { zone: z, block: blocks[0], leaf: false };
  }
  function edSelect(el) {
    const obj = el && el.closest ? el.closest("[data-edobj]") : null;
    if (!obj) { edHideTools(); return; }
    if (selBlock && selBlock !== obj) selBlock.classList.remove("eb-sel");
    selBlock = obj;
    selBlock.classList.add("eb-sel");
    edTools.classList.add("show");
    edAdd.classList.remove("show");
    edShowBox();
    edPlaceTools();
  }
  function edPlaceTools() {
    if (!selBlock || !edTools.classList.contains("show")) return;
    const b = selBlock.getBoundingClientRect();
    const tw = edTools.offsetWidth || 230, th = edTools.offsetHeight || 44;
    let top = b.top - th - 8; if (top < 58) top = Math.min(b.bottom + 8, window.innerHeight - th - 8);
    let left = Math.max(8, Math.min(b.left, window.innerWidth - tw - 8));
    edTools.style.top = top + "px"; edTools.style.left = left + "px";
  }
  function edHideTools() { if (edTools) edTools.classList.remove("show"); if (edAdd) edAdd.classList.remove("show"); if (edBox) edBox.classList.remove("show"); }
  function edOnShow() { if (selBlock) { selBlock.classList.remove("eb-sel"); selBlock = null; } edHideTools(); }

  function edMove(dir) {
    if (selBlock && edIsFree(selBlock)) { edLayer(dir); return; }
    if (!selBlock) return; const z = selBlock.closest("[data-zone]");
    const sib = dir < 0 ? selBlock.previousElementSibling : selBlock.nextElementSibling;
    if (!sib) return;
    if (dir < 0) z.insertBefore(selBlock, sib); else z.insertBefore(sib, selBlock);
    edSaveZone(z); edPlaceTools();
  }
  function edDuplicate() {
    if (edDuplicateFree()) return;
    if (!selBlock) return; const z = selBlock.closest("[data-zone]");
    const c = selBlock.cloneNode(true);
    c.classList.remove("eb-sel"); c.querySelectorAll(".eb-sel").forEach((e) => e.classList.remove("eb-sel"));
    selBlock.after(c);
    if (editing) { if (c.matches(ED_EDITABLE)) c.setAttribute("contenteditable", "true"); c.querySelectorAll(ED_EDITABLE).forEach((e) => e.setAttribute("contenteditable", "true")); }
    edSaveZone(z);
  }
  function edDelete() {
    if (edDeleteFree()) return;
    if (!selBlock) return; const z = selBlock.closest("[data-zone]");
    const info = edBlockOf(selBlock);
    if (info && info.leaf && info.block === z) { z.style.display = "none"; edData.deleted[z.getAttribute("data-zone")] = true; edSave(); }
    else { selBlock.remove(); edSaveZone(z); }
    if (selBlock) selBlock.classList.remove("eb-sel");
    selBlock = null; edHideTools();
  }
  function edResetZone() {
    if (selBlock && edIsFree(selBlock) && edObjOf(selBlock).added) { edDeleteFree(); return; }
    if (!selBlock) return; const z = selBlock.closest("[data-zone]"); if (!z) return;
    const id = z.getAttribute("data-zone");
    z.querySelectorAll("[data-edobj]").forEach((e) => { const oid = edObjId(e); if (oid) delete edData.objects[oid]; });
    const zid = edObjId(z); if (zid) delete edData.objects[zid];
    if (origZones[id] != null) z.innerHTML = origZones[id];
    z.style.display = ""; delete edData.zones[id]; delete edData.deleted[id];
    
    // Re-measure zone elements immediately
    const blocks = edGetZoneBlocks(z);
    const si = slides.indexOf(z.closest(".slide"));
    blocks.forEach((b, bi) => {
      const bid = blocks.length === 1 ? (id + "-self") : (id + "-c" + bi);
      b.setAttribute("data-edobj", bid);
      const box = edBoxFor(b);
      if (box) {
        edData.objects[bid] = {
          slide: si,
          free: true,
          x: box.x,
          y: box.y,
          w: box.w,
          h: box.h,
          z: 20,
          rotate: 0
        };
      }
    });
    
    edSave();
    edApplyObjects();
    if (editing) {
      let els = Array.prototype.slice.call(z.querySelectorAll(ED_EDITABLE));
      els = els.filter(el => !el.closest(".sim") && !edInteractive(el) && !el.matches("button, input, select, textarea, canvas, svg"));
      els.forEach((e) => e.setAttribute("contenteditable", "true"));
    }
    selBlock = null; edHideTools();
  }
  function edAddOpen() {
    if (!edTools || !edTools.querySelector(".eb-add")) return;
    const r = edTools.querySelector(".eb-add").getBoundingClientRect();
    edAdd.classList.add("show");
    edAdd.style.top = (r.bottom + 6) + "px";
    edAdd.style.left = Math.max(8, Math.min(r.left, window.innerWidth - (edAdd.offsetWidth || 180) - 8)) + "px";
  }
  function edInsert(kind) {
    edAdd.classList.remove("show");
    if (!selBlock) return; const z = selBlock.closest("[data-zone]"); let node = null;
    if (kind === "h") { node = document.createElement("h3"); node.textContent = "Neue Überschrift"; }
    else if (kind === "p") { node = document.createElement("p"); node.textContent = "Neuer Text …"; }
    else if (kind === "card") { node = document.createElement("div"); node.className = "card"; node.innerHTML = "<h3>Neue Karte</h3><ul class='bullets'><li>Neuer Punkt</li></ul>"; }
    else if (kind === "li") {
      const within = (el) => el && z.contains(el) ? el : null;                       // nur innerhalb der Zone
      let ul = selBlock.matches("ul,ol") ? selBlock : (within(selBlock.closest("ul,ol")) || selBlock.querySelector("ul,ol"));
      const li = document.createElement("li"); li.textContent = "Neuer Punkt";
      if (ul) ul.appendChild(li);
      else { ul = document.createElement("ul"); ul.className = "bullets"; ul.appendChild(li); selBlock.after(ul); }
      if (editing) li.setAttribute("contenteditable", "true");
      edSaveZone(z); return;
    }
    if (node) {
      selBlock.after(node);
      if (editing) { if (node.matches(ED_EDITABLE)) node.setAttribute("contenteditable", "true"); node.querySelectorAll(ED_EDITABLE).forEach((e) => e.setAttribute("contenteditable", "true")); }
      edSaveZone(z);
    }
  }

  function edEnter() { editing = true; document.body.classList.add("editing"); edEnsureAllObjects(); edApplyObjects(); edMarkEditable(true); if (edBar) { edBar.hidden = false; edSetBarHeight(); } if (edBtn) edBtn.classList.add("on"); }
  function edExit() { editing = false; document.body.classList.remove("editing"); edMarkEditable(false); if (selBlock) { selBlock.classList.remove("eb-sel"); selBlock = null; } edHideTools(); if (edBar) edBar.hidden = true; if (edBtn) edBtn.classList.remove("on"); }
  function edToggle() { editing ? edExit() : edEnter(); }

  function edExport() {
    let prefs = null; try { prefs = JSON.parse(localStorage.getItem("smm-prefs") || "null"); } catch (_) {}
    const blob = new Blob([JSON.stringify({ content: edData, prefs: prefs }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = "praesentation-inhalte.json"; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  function edImport(file) {
    const fr = new FileReader();
    fr.onload = () => { try { const o = JSON.parse(fr.result); if (o.content) localStorage.setItem(ED_KEY, JSON.stringify(o.content)); if (o.prefs) localStorage.setItem("smm-prefs", JSON.stringify(o.prefs)); location.reload(); } catch (_) { alert("Diese Datei konnte nicht gelesen werden."); } };
    fr.readAsText(file);
  }
  function edResetAll() {
    if (!confirm("Wirklich ALLE Text-Änderungen verwerfen und die Originaltexte wiederherstellen?")) return;
    document.querySelectorAll("[data-ed-added='true']").forEach((e) => e.remove());
    for (const id in origZones) {
      const z = document.querySelector('[data-zone="' + id + '"]');
      if (z) { z.innerHTML = origZones[id]; z.style.display = ""; }
    }
    edData = { zones: {}, deleted: {}, objects: {} };
    // Re-measure everything based on original HTML
    edEnsureAllObjects();
    edSave();
    edApplyObjects();
    if (editing) edMarkEditable(true);
    if (selBlock) { selBlock.classList.remove("eb-sel"); selBlock = null; }
    edHideTools();
  }

  function edBuildUI() {
    edBar = $id("editor");
    edBar.innerHTML =
      "<span class='ed-title'>✏️ Editor</span>" +
      "<span class='ed-hint'>Objekt anklicken · ziehen, skalieren, zentrieren · Text direkt tippen</span>" +
      "<span class='ed-group'>" +
        "<button class='ed-btn' data-new='text' title='Neues Textfeld'>📝 Text</button>" +
        "<button class='ed-btn' data-new='card' title='Neue Karte'>🃏 Karte</button>" +
        "<button class='ed-btn' data-new='rect' title='Rechteck'>▬ Form</button>" +
        "<button class='ed-btn' data-new='circle' title='Kreis'>● Kreis</button>" +
        "<button class='ed-btn' data-new='line' title='Linie'>— Linie</button>" +
      "</span>" +
      "<span class='eb-sep'></span>" +
      "<button class='ed-btn' id='ed-reset' title='Alle Änderungen zurücksetzen'>↺ Reset</button>" +
      "<button class='ed-btn' id='ed-export' title='Inhalte als JSON exportieren'>⬇ Export</button>" +
      "<button class='ed-btn' id='ed-import' title='JSON-Datei importieren'>⬆ Import</button>" +
      "<input type='file' id='ed-file' accept='application/json' hidden>" +
      "<button class='ed-btn primary' id='ed-done'>✓ Fertig</button>";
    edBar.querySelectorAll("[data-new]").forEach((b) => b.addEventListener("click", () => edCreateObject(b.dataset.new)));
    $id("ed-reset").addEventListener("click", edResetAll);
    $id("ed-export").addEventListener("click", edExport);
    $id("ed-import").addEventListener("click", () => $id("ed-file").click());
    $id("ed-file").addEventListener("change", (e) => { if (e.target.files && e.target.files[0]) edImport(e.target.files[0]); });
    $id("ed-done").addEventListener("click", edExit);

    edTools = document.createElement("div"); edTools.id = "ebtools";
    edTools.innerHTML =
      "<button class='eb-bold' title='Fett (Strg+B)'><b>B</b></button>" +
      "<button class='eb-italic' title='Kursiv (Strg+I)'><i>I</i></button>" +
      "<button class='eb-align' title='Textausrichtung wechseln'>≡</button>" +
      "<span class='eb-sep'></span>" +
      "<button class='eb-center-x' title='Horizontal zentrieren'>↔</button>" +
      "<button class='eb-center-y' title='Vertikal zentrieren'>↕</button>" +
      "<button class='eb-front' title='Nach vorne'>▲</button>" +
      "<button class='eb-back' title='Nach hinten'>▼</button>" +
      "<span class='eb-sep'></span>" +
      "<button class='eb-dup' title='Duplizieren (Strg+D)'>⧉</button>" +
      "<button class='eb-add' title='Element einfügen'>＋</button>" +
      "<button class='eb-rst' title='Block zurücksetzen'>↺</button>" +
      "<button class='eb-del' title='Löschen (Entf)'>🗑</button>";
    document.body.appendChild(edTools);

    // Bold / Italic — use mousedown + preventDefault to keep text selection
    edTools.querySelector(".eb-bold").addEventListener("mousedown", (e) => { e.preventDefault(); document.execCommand("bold"); });
    edTools.querySelector(".eb-italic").addEventListener("mousedown", (e) => { e.preventDefault(); document.execCommand("italic"); });
    edTools.querySelector(".eb-align").addEventListener("mousedown", (e) => { e.preventDefault(); edCycleAlign(); });

    edTools.querySelector(".eb-center-x").addEventListener("click", () => edCenter("x"));
    edTools.querySelector(".eb-center-y").addEventListener("click", () => edCenter("y"));
    edTools.querySelector(".eb-front").addEventListener("click", () => edLayer(1));
    edTools.querySelector(".eb-back").addEventListener("click", () => edLayer(-1));
    edTools.querySelector(".eb-dup").addEventListener("click", edDuplicate);
    edTools.querySelector(".eb-add").addEventListener("click", edAddOpen);
    edTools.querySelector(".eb-rst").addEventListener("click", edResetZone);
    edTools.querySelector(".eb-del").addEventListener("click", edDelete);

    edAdd = document.createElement("div"); edAdd.id = "ebadd";
    edAdd.innerHTML =
      "<button data-k='h'>＋ Überschrift</button>" +
      "<button data-k='p'>＋ Absatz</button>" +
      "<button data-k='li'>＋ Aufzählungspunkt</button>" +
      "<button data-k='card'>＋ Karte</button>";
    document.body.appendChild(edAdd);
    edAdd.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => edInsert(b.dataset.k)));

    edBox = document.createElement("div"); edBox.id = "edbox";
    edBox.innerHTML =
      "<span class='edbox-move' title='ziehen'></span>" +
      "<i data-rs='nw'></i><i data-rs='n'></i><i data-rs='ne'></i><i data-rs='e'></i>" +
      "<i data-rs='se'></i><i data-rs='s'></i><i data-rs='sw'></i><i data-rs='w'></i>";
    document.body.appendChild(edBox);
    edBox.addEventListener("pointerdown", (e) => edStartDrag((e.target && e.target.dataset && e.target.dataset.rs) || "move", e));
    document.addEventListener("pointermove", edOnPointerMove);
    document.addEventListener("pointerup", edOnPointerUp);
    edSetBarHeight();
  }

  function initEditor() {
    edAssignZones();
    edLoad();
    edApply();
    edBuildUI();
    edBtn = $id("edit-btn");
    if (edBtn) edBtn.addEventListener("click", edToggle);
    document.addEventListener("input", (e) => {
      if (!editing) return;
      const obj = e.target.closest && e.target.closest("[data-edobj]");
      const z = e.target.closest && e.target.closest("[data-zone]");
      clearTimeout(edSaveT);
      edSaveT = setTimeout(() => { if (obj && edObjOf(obj) && edObjOf(obj).added) edSaveObj(obj); if (z) edSaveZone(z); }, 400);
    });
    document.addEventListener("click", (e) => {
      if (!editing) return;
      if (e.target.closest("#ebtools") || e.target.closest("#ebadd") || e.target.closest("#edbox") || e.target.closest("#editor") || e.target.closest("#nav")) return;
      const obj = e.target.closest("[data-edobj]");
      if (obj) { edSelect(obj); return; }
      const z = e.target.closest("[data-zone]");
      if (z) { edSelect(z); return; }
      edHideTools();
    });
    document.addEventListener("keydown", (e) => {
      if (!editing) return;
      if (e.target && (e.target.isContentEditable || /^(input|textarea|select)$/i.test(e.target.tagName || ""))) return;
      if (e.key === "Escape") { if (selBlock) selBlock.classList.remove("eb-sel"); selBlock = null; edHideTools(); return; }
      if ((e.key === "Delete" || e.key === "Backspace") && selBlock && edIsFree(selBlock)) { edDelete(); e.preventDefault(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d" && selBlock && edIsFree(selBlock)) { edDuplicate(); e.preventDefault(); return; }
      const step = e.shiftKey ? 2 : (e.ctrlKey || e.metaKey ? 0.1 : 0.5);
      const map = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (map[e.key] && edNudge(map[e.key][0], map[e.key][1])) e.preventDefault();
    });
    window.addEventListener("resize", () => { if (editing) { edSetBarHeight(); edPlaceTools(); edShowBox(); } });
    document.addEventListener("scroll", () => { if (editing) { edPlaceTools(); edShowBox(); } }, true);
  }

  /* ========================================================
     START
     ======================================================== */
  buildAvgList();
  renderER(false);
  renderExp(false);
  loadPS();
  initEditor();          // Zonen markieren, gespeicherte Texte einsetzen, Editor-UI aufbauen
  applyPS();
  show(0);
})();
