/* ============================================================================
   fx.js  –  Konfetti, Klänge, Vibration, Meldungen
   ----------------------------------------------------------------------------
   Bewusst ohne fremde Bibliotheken: das Konfetti ist eine kleine eigene
   Canvas-Engine, die Klänge werden per Web Audio erzeugt. Dadurch braucht
   die Seite keine einzige externe Datei und läuft komplett offline.
   ========================================================================== */
'use strict';

/* --- Mag der Nutzer / das Gerät überhaupt Bewegung? ---------------------- */
const wenigerBewegung = window.matchMedia
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : { matches: false };

function animationenErlaubt() {
  if (wenigerBewegung.matches) return false;
  return Store.einst('animationen') !== false;
}

/* ==========================================================================
   Konfetti
   ========================================================================== */
const Konfetti = (() => {
  const FARBEN = ['#1ea7de', '#f5a623', '#22a84e', '#16becf', '#9b51e0',
    '#f0483e', '#7b61ff', '#5457d6', '#f2711c', '#3f3d9e', '#ffd23f'];
  const MENGE = { aus: 0, wenig: 45, normal: 110, viel: 240 };

  let leinwand = null, ctx = null, teilchen = [], laeuft = false, dpr = 1;

  function vorbereiten() {
    if (leinwand) return;
    leinwand = document.createElement('canvas');
    leinwand.className = 'konfetti-leinwand';
    leinwand.setAttribute('aria-hidden', 'true');
    document.body.appendChild(leinwand);
    ctx = leinwand.getContext('2d');
    groesseAnpassen();
    window.addEventListener('resize', groesseAnpassen, { passive: true });
  }

  function groesseAnpassen() {
    if (!leinwand) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    leinwand.width = Math.floor(window.innerWidth * dpr);
    leinwand.height = Math.floor(window.innerHeight * dpr);
    leinwand.style.width = window.innerWidth + 'px';
    leinwand.style.height = window.innerHeight + 'px';
  }

  function neuesTeilchen(x, y, wucht) {
    const winkel = Math.random() * Math.PI * 2;
    const tempo = (2 + Math.random() * 7) * wucht;
    return {
      x, y,
      vx: Math.cos(winkel) * tempo * 0.6,
      vy: Math.sin(winkel) * tempo - 4 * wucht,
      breite: 6 + Math.random() * 8,
      hoehe: 8 + Math.random() * 10,
      farbe: FARBEN[(Math.random() * FARBEN.length) | 0],
      dreh: Math.random() * Math.PI * 2,
      drehTempo: (Math.random() - 0.5) * 0.35,
      kipp: Math.random() * Math.PI,
      kippTempo: 0.05 + Math.random() * 0.1,
      leben: 1,
      zerfall: 0.006 + Math.random() * 0.008,
      form: Math.random() < 0.25 ? 'kreis' : 'rechteck'
    };
  }

  function schleife() {
    if (!laeuft) return;
    ctx.clearRect(0, 0, leinwand.width, leinwand.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    for (let i = teilchen.length - 1; i >= 0; i--) {
      const p = teilchen[i];
      p.vy += 0.22;              // Schwerkraft
      p.vx *= 0.992;             // Luftwiderstand
      p.x += p.vx;
      p.y += p.vy;
      p.dreh += p.drehTempo;
      p.kipp += p.kippTempo;
      p.leben -= p.zerfall;

      if (p.leben <= 0 || p.y - 40 > window.innerHeight) { teilchen.splice(i, 1); continue; }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.dreh);
      ctx.globalAlpha = Math.max(0, Math.min(1, p.leben));
      ctx.fillStyle = p.farbe;
      const h = p.hoehe * Math.abs(Math.cos(p.kipp));   // Flattern
      if (p.form === 'kreis') {
        ctx.beginPath();
        ctx.ellipse(0, 0, p.breite / 2, Math.max(1, h / 2), 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.breite / 2, -h / 2, p.breite, Math.max(1, h));
      }
      ctx.restore();
    }
    ctx.restore();

    if (teilchen.length === 0) { laeuft = false; ctx.clearRect(0, 0, leinwand.width, leinwand.height); return; }
    requestAnimationFrame(schleife);
  }

  function starten() { if (!laeuft) { laeuft = true; requestAnimationFrame(schleife); } }

  /** Kleiner Ausbruch an einer Stelle – z. B. beim Abhaken */
  function funken(x, y, staerke) {
    if (!animationenErlaubt()) return;
    const stufe = Store.einst('konfetti') || 'normal';
    if (stufe === 'aus') return;
    vorbereiten();
    const anzahl = Math.round((MENGE[stufe] || 110) * 0.18 * (staerke || 1));
    for (let i = 0; i < anzahl; i++) teilchen.push(neuesTeilchen(x, y, 0.8));
    starten();
  }

  /** Großer Regen quer über den Bildschirm – wenn ein Tag komplett ist */
  function regen() {
    if (!animationenErlaubt()) return;
    const stufe = Store.einst('konfetti') || 'normal';
    if (stufe === 'aus') return;
    vorbereiten();
    const gesamt = MENGE[stufe] || 110;
    const salven = 3;
    for (let s = 0; s < salven; s++) {
      setTimeout(() => {
        for (let i = 0; i < gesamt / salven; i++) {
          const x = Math.random() * window.innerWidth;
          const y = window.innerHeight * (0.25 + Math.random() * 0.25);
          teilchen.push(neuesTeilchen(x, y, 1.25));
        }
        starten();
      }, s * 180);
    }
  }

  return { funken, regen };
})();

/* ==========================================================================
   Klänge (komplett synthetisch, keine Audiodateien)
   ========================================================================== */
const Klang = (() => {
  let ctx = null;

  function holeCtx() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { return null; }
    return ctx;
  }

  /** iOS startet Audio nur nach einer echten Nutzerberührung */
  function aufwecken() {
    const c = holeCtx();
    if (c && c.state === 'suspended') c.resume().catch(() => {});
  }

  function an() { return Store.einst('sound') !== false; }
  function pegel() {
    const l = Store.einst('lautstaerke');
    return typeof l === 'number' ? Math.max(0, Math.min(1, l)) : 0.5;
  }

  function ton(frequenz, dauer, art, startVerzug, lautstaerke) {
    const c = holeCtx();
    if (!c) return;
    const t0 = c.currentTime + (startVerzug || 0);
    const osz = c.createOscillator();
    const gain = c.createGain();
    osz.type = art || 'sine';
    osz.frequency.setValueAtTime(frequenz, t0);
    const spitze = (lautstaerke === undefined ? 0.22 : lautstaerke) * pegel();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, spitze), t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dauer);
    osz.connect(gain).connect(c.destination);
    osz.start(t0);
    osz.stop(t0 + dauer + 0.05);
  }

  function gleitTon(von, bis, dauer, art, verzug, lautstaerke) {
    const c = holeCtx();
    if (!c) return;
    const t0 = c.currentTime + (verzug || 0);
    const osz = c.createOscillator();
    const gain = c.createGain();
    osz.type = art || 'sine';
    osz.frequency.setValueAtTime(von, t0);
    osz.frequency.exponentialRampToValueAtTime(Math.max(1, bis), t0 + dauer);
    const spitze = (lautstaerke === undefined ? 0.2 : lautstaerke) * pegel();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, spitze), t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dauer);
    osz.connect(gain).connect(c.destination);
    osz.start(t0);
    osz.stop(t0 + dauer + 0.05);
  }

  return {
    aufwecken,
    /** Häkchen gesetzt */
    haken() { if (!an()) return; aufwecken(); gleitTon(660, 1180, 0.14, 'sine', 0, 0.18); ton(1320, 0.09, 'triangle', 0.05, 0.07); },
    /** Häkchen wieder entfernt */
    zurueck() { if (!an()) return; aufwecken(); gleitTon(520, 300, 0.16, 'sine', 0, 0.13); },
    /** Ganzer Tag geschafft */
    fanfare() {
      if (!an()) return; aufwecken();
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => ton(f, 0.32, 'triangle', i * 0.085, 0.2));
      ton(1567.98, 0.5, 'sine', 0.34, 0.12);
    },
    /** Neuer Erfolg */
    erfolg() {
      if (!an()) return; aufwecken();
      [880, 1108.73, 1318.51].forEach((f, i) => ton(f, 0.22, 'sine', i * 0.07, 0.15));
    },
    /** Alles komplett */
    grosserSieg() {
      if (!an()) return; aufwecken();
      [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5].forEach((f, i) => ton(f, 0.3, 'triangle', i * 0.075, 0.18));
    },
    /** Fehlermeldung */
    fehler() { if (!an()) return; aufwecken(); ton(220, 0.14, 'square', 0, 0.1); ton(165, 0.2, 'square', 0.1, 0.09); }
  };
})();

/* ==========================================================================
   Vibration (Android/Chrome; iOS Safari kennt navigator.vibrate nicht)
   ========================================================================== */
const Haptik = {
  moeglich() { return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'; },
  tipp() { if (Store.einst('vibration') !== false && Haptik.moeglich()) navigator.vibrate(12); },
  erfolg() { if (Store.einst('vibration') !== false && Haptik.moeglich()) navigator.vibrate([16, 40, 26]); },
  fehler() { if (Store.einst('vibration') !== false && Haptik.moeglich()) navigator.vibrate([40, 60, 40]); }
};

/* ==========================================================================
   Meldungen am unteren Rand (mit optionalem „Rückgängig“)
   ========================================================================== */
const Meldung = (() => {
  let behaelter = null;

  function holeBehaelter() {
    if (!behaelter) {
      behaelter = document.getElementById('meldungen');
      if (!behaelter) {
        behaelter = document.createElement('div');
        behaelter.id = 'meldungen';
        behaelter.className = 'meldungen';
        behaelter.setAttribute('role', 'status');
        behaelter.setAttribute('aria-live', 'polite');
        document.body.appendChild(behaelter);
      }
    }
    return behaelter;
  }

  /**
   * zeig('Text', { art:'gut'|'info'|'warn'|'fehler', dauer:ms,
   *                aktion:{ text:'Rückgängig', fn:()=>{} } })
   */
  function zeig(text, optionen) {
    const o = optionen || {};
    const b = holeBehaelter();
    const el = document.createElement('div');
    el.className = 'meldung meldung--' + (o.art || 'info');

    const span = document.createElement('span');
    span.className = 'meldung__text';
    span.textContent = text;
    el.appendChild(span);

    let timer = null;
    const schliessen = () => {
      if (timer) clearTimeout(timer);
      el.classList.add('meldung--weg');
      setTimeout(() => el.remove(), 260);
    };

    if (o.aktion) {
      const knopf = document.createElement('button');
      knopf.type = 'button';
      knopf.className = 'meldung__knopf';
      knopf.textContent = o.aktion.text;
      knopf.addEventListener('click', () => { o.aktion.fn(); schliessen(); });
      el.appendChild(knopf);
    }

    const zu = document.createElement('button');
    zu.type = 'button';
    zu.className = 'meldung__zu';
    zu.setAttribute('aria-label', 'Meldung schließen');
    zu.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-x"></use></svg>';
    zu.addEventListener('click', schliessen);
    el.appendChild(zu);

    b.appendChild(el);
    // Nicht mehr als vier Meldungen gleichzeitig
    while (b.children.length > 4) b.firstElementChild.remove();

    timer = setTimeout(schliessen, o.dauer || 3200);
    return schliessen;
  }

  return { zeig };
})();

/* ==========================================================================
   Erfolgs-Einblendung
   ========================================================================== */
const ErfolgAnzeige = (() => {
  const warteschlange = [];
  let laeuft = false;

  function naechster() {
    if (laeuft || warteschlange.length === 0) return;
    laeuft = true;
    const erfolg = warteschlange.shift();

    const el = document.createElement('div');
    el.className = 'erfolg-popup';
    el.setAttribute('role', 'status');
    el.innerHTML =
      '<div class="erfolg-popup__ring"><svg class="erfolg-popup__icon" viewBox="0 0 24 24" aria-hidden="true">' +
      '<use href="#' + erfolg.icon + '"></use></svg></div>' +
      '<div class="erfolg-popup__text"><span class="erfolg-popup__label">Erfolg freigeschaltet</span>' +
      '<strong class="erfolg-popup__titel"></strong><span class="erfolg-popup__sub"></span></div>';
    el.querySelector('.erfolg-popup__titel').textContent = erfolg.titel;
    el.querySelector('.erfolg-popup__sub').textContent = erfolg.text;
    document.body.appendChild(el);

    requestAnimationFrame(() => el.classList.add('erfolg-popup--an'));
    Klang.erfolg();
    Haptik.erfolg();

    setTimeout(() => {
      el.classList.remove('erfolg-popup--an');
      setTimeout(() => { el.remove(); laeuft = false; naechster(); }, 320);
    }, 2600);
  }

  function zeig(erfolge) {
    (Array.isArray(erfolge) ? erfolge : [erfolge]).forEach((e) => warteschlange.push(e));
    naechster();
  }

  return { zeig };
})();
