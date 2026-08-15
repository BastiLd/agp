/* ============================================================================
   app.js  –  Oberfläche, Ansichten, Bedienung
   ========================================================================== */
'use strict';

/* ==========================================================================
   Kleine Helfer
   ========================================================================== */
const SVGNS = 'http://www.w3.org/2000/svg';

/** mach('div', { klasse:'x', text:'hi', auf:{ click: fn } }, [kinder]) */
function mach(tag, eigenschaften, kinder) {
  const n = document.createElement(tag);
  const p = eigenschaften || {};
  Object.keys(p).forEach((k) => {
    const w = p[k];
    if (w === null || w === undefined || w === false) return;
    if (k === 'klasse') n.className = w;
    else if (k === 'text') n.textContent = w;
    else if (k === 'html') n.innerHTML = w;
    else if (k === 'stil') Object.keys(w).forEach((s) => n.style.setProperty(s, w[s]));
    else if (k === 'auf') Object.keys(w).forEach((ev) => n.addEventListener(ev, w[ev]));
    else if (k === 'daten') Object.keys(w).forEach((d) => { n.dataset[d] = w[d]; });
    else n.setAttribute(k, w === true ? '' : w);
  });
  (kinder || []).forEach((k) => {
    if (k === null || k === undefined || k === false) return;
    n.appendChild(typeof k === 'string' || typeof k === 'number' ? document.createTextNode(String(k)) : k);
  });
  return n;
}

function ikone(id, klasse) {
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  if (klasse) svg.setAttribute('class', klasse);
  const use = document.createElementNS(SVGNS, 'use');
  use.setAttribute('href', '#' + id);
  use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + id);
  svg.appendChild(use);
  return svg;
}

function leeren(knoten) { while (knoten.firstChild) knoten.removeChild(knoten.firstChild); }

/**
 * Fortschrittsring als SVG. Die Größe bestimmt der umgebende Behälter
 * (.ring in app.css setzt 100 % Breite und Höhe).
 */
function ringSvg(anteil, groesse, beschriftung, gut) {
  const r = 42, umfang = 2 * Math.PI * r;
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('class', 'ring');
  svg.setAttribute('aria-hidden', 'true');

  const spur = document.createElementNS(SVGNS, 'circle');
  spur.setAttribute('class', 'ring__spur');
  spur.setAttribute('cx', 50); spur.setAttribute('cy', 50); spur.setAttribute('r', r);
  spur.setAttribute('stroke-width', 9);
  svg.appendChild(spur);

  const wert = document.createElementNS(SVGNS, 'circle');
  wert.setAttribute('class', 'ring__wert' + (gut ? ' ring__wert--gut' : ''));
  wert.setAttribute('cx', 50); wert.setAttribute('cy', 50); wert.setAttribute('r', r);
  wert.setAttribute('stroke-width', 9);
  wert.setAttribute('stroke-dasharray', umfang);
  wert.setAttribute('stroke-dashoffset', umfang * (1 - Math.max(0, Math.min(1, anteil))));
  svg.appendChild(wert);

  if (beschriftung) {
    const t = document.createElementNS(SVGNS, 'text');
    t.setAttribute('class', 'ring-text');
    t.setAttribute('x', 50); t.setAttribute('y', 50);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('dominant-baseline', 'central');
    t.setAttribute('transform', 'rotate(90 50 50)');
    t.setAttribute('font-size', beschriftung.length > 4 ? 22 : 26);
    t.textContent = beschriftung;
    svg.appendChild(t);
  }
  return svg;
}

function zufall(liste) { return liste[Math.floor(Math.random() * liste.length)]; }

function zeitstempelText(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}. ` +
         `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} Uhr`;
}

/* ==========================================================================
   Ansichtsliste
   ========================================================================== */
const ANSICHTEN = [
  { id: 'heute',         label: 'Heute',        kurz: 'Heute',   icon: 'i-calendar' },
  { id: 'raster',        label: 'Übersicht',    kurz: 'Alle',    icon: 'i-grid' },
  { id: 'notizen',       label: 'Notizen',      kurz: 'Notizen', icon: 'i-note' },
  { id: 'statistik',     label: 'Statistik',    kurz: 'Zahlen',  icon: 'i-chart' },
  // Notfall hat unten am Handy keinen Platz – dafür gibt es den roten Knopf
  // im Kopfbereich, der auf jeder Seite sichtbar ist.
  { id: 'notfall',       label: 'Notfall',      kurz: 'Notruf',  icon: 'i-telefon', nurOben: true },
  { id: 'einstellungen', label: 'Einstellungen',kurz: 'Mehr',    icon: 'i-gear' }
];

/* ==========================================================================
   Dialog
   ========================================================================== */
const Dialog = (() => {
  const huelle = document.getElementById('dialog-huelle');
  let letzterFokus = null;
  let offen = false;

  function schliessen() {
    if (!offen) return;
    offen = false;
    huelle.hidden = true;
    leeren(huelle);
    document.body.style.overflow = '';
    if (letzterFokus && letzterFokus.focus) letzterFokus.focus();
  }

  /**
   * zeig({ titel, inhalt: HTMLElement|string, knoepfe: [{text, art, fn, schliesst}] })
   */
  function zeig(o) {
    letzterFokus = document.activeElement;
    leeren(huelle);
    offen = true;

    const kasten = mach('div', { klasse: 'dialog', role: 'dialog', 'aria-modal': 'true', 'aria-label': o.titel || 'Dialog' });

    const zuKnopf = mach('button', {
      klasse: 'dialog__zu', type: 'button', 'aria-label': 'Schließen', auf: { click: schliessen }
    }, [ikone('i-x')]);

    kasten.appendChild(mach('div', { klasse: 'dialog__kopf' }, [
      mach('h2', { klasse: 'dialog__titel', text: o.titel || '' }),
      zuKnopf
    ]));

    const inhalt = mach('div', { klasse: 'dialog__inhalt' });
    if (typeof o.inhalt === 'string') inhalt.innerHTML = o.inhalt;
    else if (o.inhalt) inhalt.appendChild(o.inhalt);
    kasten.appendChild(inhalt);

    if (o.knoepfe && o.knoepfe.length) {
      const fuss = mach('div', { klasse: 'dialog__fuss' });
      o.knoepfe.forEach((k) => {
        fuss.appendChild(mach('button', {
          klasse: 'knopf' + (k.art ? ' knopf--' + k.art : ''),
          type: 'button',
          auf: { click: () => { const ergebnis = k.fn ? k.fn() : true; if (ergebnis !== false && k.schliesst !== false) schliessen(); } }
        }, [k.icon ? ikone(k.icon) : null, k.text]));
      });
      kasten.appendChild(fuss);
    }

    huelle.appendChild(kasten);
    huelle.hidden = false;
    document.body.style.overflow = 'hidden';

    const ersterKnopf = kasten.querySelector('input, textarea, .dialog__fuss .knopf, .dialog__zu');
    if (ersterKnopf) setTimeout(() => ersterKnopf.focus(), 60);
    return { schliessen, kasten, inhalt };
  }

  huelle.addEventListener('click', (ev) => { if (ev.target === huelle) schliessen(); });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && offen) schliessen(); });

  /** Ja/Nein-Rückfrage */
  function frage(titel, text, jaText, fn, gefahr) {
    zeig({
      titel,
      inhalt: mach('p', { text, stil: { 'line-height': '1.6' } }),
      knoepfe: [
        { text: 'Abbrechen' },
        { text: jaText, art: gefahr ? 'gefahr' : 'haupt', fn }
      ]
    });
  }

  return { zeig, schliessen, frage, istOffen: () => offen };
})();

/* ==========================================================================
   Erinnerungen
   ========================================================================== */
const Erinnerungen = (() => {
  const GEMELDET = 'basti-todo-gemeldet';
  let timer = null;

  function unterstuetzt() { return typeof window.Notification === 'function'; }
  function status() { return unterstuetzt() ? Notification.permission : 'nicht-unterstuetzt'; }

  function gemeldet() {
    try { return JSON.parse(localStorage.getItem(GEMELDET) || '{}'); } catch (e) { return {}; }
  }
  function merkeGemeldet(schluessel) {
    const g = gemeldet();
    g[schluessel] = Date.now();
    // alte Einträge aufräumen
    Object.keys(g).forEach((k) => { if (Date.now() - g[k] > 3 * 86400000) delete g[k]; });
    try { localStorage.setItem(GEMELDET, JSON.stringify(g)); } catch (e) { /* egal */ }
  }

  function erlauben() {
    if (!unterstuetzt()) {
      Meldung.zeig('Dieser Browser kennt keine Benachrichtigungen.', { art: 'warn' });
      return Promise.resolve('nicht-unterstuetzt');
    }
    return Notification.requestPermission().then((antwort) => {
      if (antwort === 'granted') {
        Meldung.zeig('Erinnerungen sind erlaubt.', { art: 'gut' });
        pruefen();
      } else if (antwort === 'denied') {
        Meldung.zeig('Benachrichtigungen wurden abgelehnt – in den Browser-Einstellungen wieder freigeben.', { art: 'warn', dauer: 5200 });
      }
      App.zeichneEinstellungen();
      return antwort;
    }).catch(() => 'error');
  }

  function melden(titel, text, marke) {
    try {
      const n = new Notification(titel, {
        body: text,
        tag: marke,
        icon: 'assets/icons/icon-192.png',
        badge: 'assets/icons/icon-192.png',
        silent: false
      });
      n.onclick = () => { window.focus(); n.close(); };
    } catch (e) { /* iOS meldet hier gelegentlich, wenn die App nicht installiert ist */ }
  }

  function pruefen() {
    if (Store.einst('erinnerungen') !== true) return;
    if (status() !== 'granted') return;

    const heute = heuteIso();
    if (heute < ZEITRAUM.start || heute > ZEITRAUM.ende) return;

    const jetzt = new Date();
    const minuten = jetzt.getHours() * 60 + jetzt.getMinutes();
    const schonGemeldet = gemeldet();

    aufgabenFuerTag(heute).forEach((a) => {
      if (!a.erinnerung) return;
      if (Store.istErledigt(heute, a.id)) return;
      const schluessel = heute + ':' + a.id;
      if (schonGemeldet[schluessel]) return;
      // Nur im Zeitfenster von 90 Minuten nach der Uhrzeit melden
      if (minuten >= a.erinnerung.zeit && minuten < a.erinnerung.zeit + 90) {
        melden(a.titel, a.erinnerung.text, schluessel);
        merkeGemeldet(schluessel);
      }
    });
  }

  function starten() {
    if (timer) clearInterval(timer);
    timer = setInterval(pruefen, 60000);
    pruefen();
  }

  function test() {
    if (status() !== 'granted') { erlauben(); return; }
    melden('Test-Erinnerung', 'So sieht eine Erinnerung aus. Läuft.', 'test-' + Date.now());
    Meldung.zeig('Test-Benachrichtigung verschickt.', { art: 'gut' });
  }

  return { unterstuetzt, status, erlauben, starten, pruefen, test };
})();

/* ==========================================================================
   Die Anwendung
   ========================================================================== */
const App = (() => {

  let ansicht = 'heute';
  let tag = startTag();
  let letzteAktion = null;          // für „Rückgängig“
  let installEreignis = null;       // Android/Chrome „Zum Startbildschirm“

  const knoten = {
    kopfTitel: document.getElementById('kopf-titel'),
    kopfUnter: document.getElementById('kopf-unter'),
    kopfChips: document.getElementById('kopf-chips'),
    reiterOben: document.getElementById('reiter-oben'),
    reiterUnten: document.getElementById('reiter-unten'),
    heute: document.getElementById('ansicht-heute'),
    raster: document.getElementById('ansicht-raster'),
    notizen: document.getElementById('ansicht-notizen'),
    statistik: document.getElementById('ansicht-statistik'),
    notfall: document.getElementById('ansicht-notfall'),
    einstellungen: document.getElementById('ansicht-einstellungen'),
    notrufKnopf: document.getElementById('notruf-knopf'),
    fussVersion: document.getElementById('fuss-version')
  };

  /* ---------------------------------------------------------------- Theme */
  function themeAnwenden() {
    const h = document.documentElement;
    let theme = Store.einst('theme') || 'system';
    if (theme === 'system') {
      theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dunkel' : 'hell';
    }
    h.setAttribute('data-theme', theme);
    h.setAttribute('data-akzent', Store.einst('akzent') || 'blau');
    h.setAttribute('data-groesse', Store.einst('textgroesse') || 'normal');
    if (Store.einst('animationen') === false) h.setAttribute('data-bewegung', 'aus');
    else h.removeAttribute('data-bewegung');
    if (Store.einst('kompakt')) h.setAttribute('data-kompakt', '1');
    else h.removeAttribute('data-kompakt');

    const farbe = theme === 'dunkel' ? '#0d1730' : (AKZENTE[Store.einst('akzent')] || AKZENTE.blau).farbe;
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', farbe));
  }

  if (window.matchMedia) {
    const abfrage = window.matchMedia('(prefers-color-scheme: dark)');
    const reagiere = () => { if ((Store.einst('theme') || 'system') === 'system') themeAnwenden(); };
    if (abfrage.addEventListener) abfrage.addEventListener('change', reagiere);
    else if (abfrage.addListener) abfrage.addListener(reagiere);
  }

  /* --------------------------------------------------------------- Routing */
  function routeLesen() {
    const roh = (location.hash || '').replace(/^#\/?/, '');
    const teile = roh.split('/').filter(Boolean);
    const gewuenscht = teile[0];
    if (ANSICHTEN.some((a) => a.id === gewuenscht)) ansicht = gewuenscht;
    if (teile[1] && TAGE.indexOf(teile[1]) >= 0) tag = teile[1];
  }

  function routeSchreiben(ersetzen) {
    const ziel = '#/' + ansicht + (ansicht === 'heute' ? '/' + tag : '');
    if (location.hash === ziel) return;
    if (ersetzen && history.replaceState) history.replaceState(null, '', ziel);
    else location.hash = ziel;
  }

  function geheZu(neueAnsicht, neuerTag) {
    if (neueAnsicht) ansicht = neueAnsicht;
    if (neuerTag) { tag = neuerTag; Store.setzeEinstLeise('letzterTag', tag); }
    routeSchreiben();
    zeichneAlles();
    if (ansicht !== 'heute') window.scrollTo({ top: 0, behavior: 'auto' });
  }

  /* ------------------------------------------------------------ Darf haken? */
  function darfHaken(iso) {
    if (Store.einst('nurHeute') !== true) return true;
    return iso === heuteIso();
  }

  /* ==========================================================================
     Kopfbereich
     ========================================================================== */
  function zeichneKopf() {
    const name = (Store.einst('name') || '').trim();
    knoten.kopfTitel.textContent = name ? 'Aufgabenliste für ' + name : 'Aufgabenliste';
    knoten.kopfUnter.textContent = 'Sa 15. bis Mi 26. August 2026 · so sieht dein Tag aus';
    document.title = knoten.kopfTitel.textContent + ' · 15.–26. August 2026';

    const z = Store.zahlen();
    leeren(knoten.kopfChips);

    // Gesamtfortschritt
    const balken = mach('span', { klasse: 'kchip__balken' }, [
      mach('i', { stil: { width: z.prozent + '%' } })
    ]);
    knoten.kopfChips.appendChild(mach('span', { klasse: 'kchip' }, [
      ikone('i-check'), balken,
      mach('b', { text: z.erledigtGesamt + '/' + z.gesamt })
    ]));

    // Tage komplett
    knoten.kopfChips.appendChild(mach('span', { klasse: 'kchip' }, [
      ikone('i-trophy'),
      mach('span', { text: 'Tage komplett' }),
      mach('b', { text: z.tageKomplett + '/' + TAGE.length })
    ]));

    // Serie
    if (z.streakAktuell > 0) {
      knoten.kopfChips.appendChild(mach('span', { klasse: 'kchip' }, [
        ikone('i-flame'),
        mach('span', { text: 'Serie' }),
        mach('b', { text: z.streakAktuell + (z.streakAktuell === 1 ? ' Tag' : ' Tage') })
      ]));
    }

    // Verbindung zum eigenen Server
    const s = Api.zustand();
    if (s.verfuegbar) {
      const alter = s.letzterAbgleich ? Math.round((Date.now() - s.letzterAbgleich) / 1000) : null;
      const text = s.laeuft ? 'gleicht ab …'
        : s.wartet ? 'wartet'
        : alter === null ? 'verbunden'
        : alter < 90 ? 'aktuell'
        : Math.round(alter / 60) + ' Min.';
      knoten.kopfChips.appendChild(mach('button', {
        klasse: 'kchip kchip--knopf', type: 'button',
        title: 'Abgleich mit dem Server – zum sofortigen Abgleich antippen',
        auf: { click: () => { Api.abgleichen(false); Api.fotosAbgleichen(); } }
      }, [ikone('i-wolke'), mach('span', { text: 'Sync' }), mach('b', { text })]));
    } else if (Store.einst('serverSync') !== false && location.protocol !== 'file:') {
      knoten.kopfChips.appendChild(mach('span', {
        klasse: 'kchip', title: 'Kein Server gefunden – die App speichert nur auf diesem Gerät.'
      }, [ikone('i-wolke-aus'), mach('span', { text: 'nur lokal' })]));
    }

    // Hinweis, wenn heute außerhalb des Zeitraums liegt
    if (!heuteImZeitraum()) {
      const h = heuteIso();
      const text = h < ZEITRAUM.start
        ? 'Los geht es am ' + wochentagKurz(ZEITRAUM.start) + ' ' + datumKurz(ZEITRAUM.start)
        : 'Zeitraum abgeschlossen';
      knoten.kopfChips.appendChild(mach('span', { klasse: 'kchip' }, [ikone('i-uhr'), mach('span', { text })]));
    }
  }

  /* ==========================================================================
     Reiter
     ========================================================================== */
  function zeichneReiter() {
    const bauen = (behaelter, klasse, kurz, nurHauptseiten) => {
      leeren(behaelter);
      ANSICHTEN.filter((a) => !(nurHauptseiten && a.nurOben)).forEach((a) => {
        const aktiv = a.id === ansicht;
        const knopf = mach('button', {
          klasse: klasse + (a.id === 'notfall' ? ' reiter__knopf--notfall' : ''),
          type: 'button',
          'aria-current': aktiv ? 'page' : null,
          auf: { click: () => geheZu(a.id) }
        }, [
          ikone(a.icon),
          mach('span', { text: kurz ? a.kurz : a.label })
        ]);
        behaelter.appendChild(knopf);
      });
    };
    bauen(knoten.reiterOben, 'reiter__knopf', false, false);
    bauen(knoten.reiterUnten, 'tableiste__knopf', true, true);

    if (knoten.notrufKnopf) {
      knoten.notrufKnopf.classList.toggle('notruf-knopf--aktiv', ansicht === 'notfall');
    }
  }

  /* ==========================================================================
     Ansicht: Notfall – Telefonnummern zum Antippen
     ========================================================================== */
  function alleKontakte() {
    const vorgabe = (typeof KONTAKTE_VORGABE !== 'undefined' && Array.isArray(KONTAKTE_VORGABE))
      ? KONTAKTE_VORGABE : [];
    const gruppen = vorgabe.map((g) => ({
      gruppe: g.gruppe, notruf: !!g.notruf, eintraege: (g.eintraege || []).slice()
    }));

    const eigene = Store.einst('eigeneKontakte') || [];
    if (eigene.length) {
      gruppen.push({ gruppe: 'Selbst hinzugefügt', eigene: true, eintraege: eigene.slice() });
    }
    return gruppen;
  }

  /** '0650 1234567' -> '+436501234567' – so wählt das iPhone zuverlässig */
  function waehlbar(nummer) {
    const roh = String(nummer).replace(/[^\d+]/g, '');
    if (roh.startsWith('+')) return roh;
    if (roh.length <= 3) return roh;                    // 122, 133, 144, 112
    if (roh.startsWith('00')) return '+' + roh.slice(2);
    if (roh.startsWith('0')) return '+43' + roh.slice(1);  // Österreich
    return roh;
  }

  function zeichneNotfall() {
    const ziel = knoten.notfall;
    leeren(ziel);

    ziel.appendChild(mach('div', { klasse: 'notfall-kopf' }, [
      mach('div', { klasse: 'notfall-kopf__ring' }, [ikone('i-sos')]),
      mach('div', {}, [
        mach('h2', { klasse: 'notfall-kopf__titel', text: 'Telefonnummern' }),
        mach('p', { klasse: 'notfall-kopf__sub', text: 'Auf eine Nummer tippen, um direkt anzurufen.' })
      ])
    ]));

    const gruppen = alleKontakte();
    if (!gruppen.length) {
      ziel.appendChild(mach('div', { klasse: 'hinweis hinweis--info' }, [
        ikone('i-info'),
        mach('div', {}, [
          mach('strong', { text: 'Noch keine Nummern hinterlegt. ' }),
          mach('span', { text: 'Unten lassen sich welche hinzufügen. Sie bleiben nur auf diesem Gerät.' })
        ])
      ]));
    }

    gruppen.forEach((g) => {
      const block = mach('div', { klasse: 'block' }, [
        mach('h3', { klasse: 'block__titel' }, [
          ikone(g.notruf ? 'i-sos' : (g.eigene ? 'i-person' : 'i-telefon')),
          g.gruppe
        ])
      ]);
      const liste = mach('div', { klasse: 'kontaktliste' + (g.notruf ? ' kontaktliste--notruf' : '') });

      g.eintraege.forEach((k) => {
        const zeile = mach('a', {
          klasse: 'kontakt' + (g.notruf ? ' kontakt--notruf' : ''),
          href: 'tel:' + waehlbar(k.nummer),
          'aria-label': k.name + ' anrufen, ' + k.nummer
        }, [
          mach('span', { klasse: 'kontakt__kachel' }, [ikone(k.icon || (g.notruf ? 'i-sos' : 'i-person'))]),
          mach('span', { klasse: 'kontakt__text' }, [
            mach('span', { klasse: 'kontakt__name', text: k.name }),
            k.rolle ? mach('span', { klasse: 'kontakt__rolle', text: k.rolle }) : null,
            mach('span', { klasse: 'kontakt__nummer', text: k.nummer })
          ]),
          mach('span', { klasse: 'kontakt__hoerer' }, [ikone('i-telefon')])
        ]);
        liste.appendChild(zeile);

        if (g.eigene) {
          zeile.appendChild(mach('button', {
            klasse: 'kontakt__weg', type: 'button', 'aria-label': k.name + ' entfernen',
            auf: {
              click: (ev) => {
                ev.preventDefault(); ev.stopPropagation();
                const rest = (Store.einst('eigeneKontakte') || []).filter((e) => !(e.name === k.name && e.nummer === k.nummer));
                Store.setzeEinst('eigeneKontakte', rest);
                zeichneNotfall();
                Meldung.zeig('Eintrag entfernt.', { art: 'info' });
              }
            }
          }, [ikone('i-x')]));
        }
      });

      block.appendChild(liste);
      ziel.appendChild(block);
    });

    /* Eigene Nummer ergänzen */
    ziel.appendChild(mach('div', { klasse: 'gruppe' }, [
      mach('div', { klasse: 'zeile zeile--spalte' }, [
        mach('div', { klasse: 'zeile__text' }, [
          mach('div', { klasse: 'zeile__titel', text: 'Nummer hinzufügen' }),
          mach('div', { klasse: 'zeile__sub', text: 'Bleibt nur auf diesem Gerät und wird nicht mit dem Server geteilt.' })
        ]),
        (() => {
          const nameFeld = mach('input', { klasse: 'feld', type: 'text', placeholder: 'Name', maxlength: '40' });
          const rolleFeld = mach('input', { klasse: 'feld', type: 'text', placeholder: 'Beschreibung (freiwillig)', maxlength: '60' });
          const nummerFeld = mach('input', { klasse: 'feld', type: 'tel', placeholder: 'Telefonnummer', maxlength: '30' });
          return mach('div', { stil: { display: 'flex', 'flex-direction': 'column', gap: '9px' } }, [
            nameFeld, rolleFeld, nummerFeld,
            mach('button', {
              klasse: 'knopf knopf--haupt', type: 'button',
              auf: {
                click: () => {
                  const name = nameFeld.value.trim(), nummer = nummerFeld.value.trim();
                  if (!name || !nummer) { Meldung.zeig('Name und Nummer werden gebraucht.', { art: 'warn' }); return; }
                  const eigene = (Store.einst('eigeneKontakte') || []).slice();
                  eigene.push({ name, rolle: rolleFeld.value.trim(), nummer });
                  Store.setzeEinst('eigeneKontakte', eigene);
                  zeichneNotfall();
                  Meldung.zeig(name + ' hinzugefügt.', { art: 'gut' });
                }
              }
            }, [ikone('i-plus'), 'Hinzufügen'])
          ]);
        })()
      ])
    ]));

    ziel.appendChild(mach('div', { klasse: 'hinweis hinweis--info', stil: { 'margin-top': '16px' } }, [
      ikone('i-info'),
      mach('div', {}, [
        mach('strong', { text: 'Im echten Notfall zuerst 122, 133 oder 144. ' }),
        mach('span', { text: '112 funktioniert in ganz Europa und auch ohne Guthaben oder Empfang beim eigenen Anbieter.' })
      ])
    ]));
  }

  /* ==========================================================================
     Ansicht: Heute
     ========================================================================== */
  function zeichneHeute() {
    const ziel = knoten.heute;
    leeren(ziel);

    const iso = tag;
    const index = TAGE.indexOf(iso);
    const aufgaben = aufgabenFuerTag(iso);
    const sonder = SONDERTAGE[iso];
    const t = Store.tagZahlen(iso);
    const istHeute = iso === heuteIso();

    /* --- Kopfzeile mit Pfeilen --- */
    const kopf = mach('div', { klasse: 'tagkopf' }, [
      mach('button', {
        klasse: 'tagkopf__pfeil', type: 'button', 'aria-label': 'Vorheriger Tag',
        disabled: index <= 0,
        auf: { click: () => geheZu('heute', TAGE[index - 1]) }
      }, [ikone('i-links')]),

      mach('button', {
        klasse: 'tagkopf__mitte', type: 'button',
        title: 'Auf den heutigen Tag springen',
        auf: { click: () => geheZu('heute', startTag()) }
      }, [
        mach('div', { klasse: 'tagkopf__datum' }, [
          mach('span', { text: wochentagKurz(iso) + ' ' + datumKurz(iso) }),
          istHeute ? mach('span', { klasse: 'marke', text: 'Heute' })
                   : mach('span', { klasse: 'marke marke--leise', text: relativerTag(iso) }),
          sonder ? mach('span', { klasse: 'marke marke--sonder', text: 'Sondertag' }) : null
        ]),
        mach('div', { klasse: 'tagkopf__zusatz', text: datumLang(iso) })
      ]),

      mach('button', {
        klasse: 'tagkopf__pfeil', type: 'button', 'aria-label': 'Nächster Tag',
        disabled: index >= TAGE.length - 1,
        auf: { click: () => geheZu('heute', TAGE[index + 1]) }
      }, [ikone('i-rechts')])
    ]);
    ziel.appendChild(kopf);

    /* --- Leiste mit allen 12 Tagen --- */
    ziel.appendChild(zeichneTagleiste());

    /* --- Fertig-Banner oder Fortschrittskarte --- */
    if (t.komplett) {
      ziel.appendChild(mach('div', { klasse: 'fertig' }, [
        mach('div', { klasse: 'fertig__pokal' }, [ikone('i-trophy')]),
        mach('div', {}, [
          mach('div', { klasse: 'fertig__titel', text: zufall(SPRUECHE_TAG_KOMPLETT) }),
          mach('div', { klasse: 'fertig__sub', text: 'Alle ' + t.gesamt + ' Aufgaben von ' + wochentagKurz(iso) + ' ' + datumKurz(iso) + ' sind abgehakt.' })
        ])
      ]));
    }

    const anteil = t.gesamt ? t.erledigt / t.gesamt : 0;
    const status = mach('div', { klasse: 'tagstatus' + (t.komplett ? ' tagstatus--fertig' : '') }, [
      mach('div', { klasse: 'tagstatus__ring' }, [ringSvg(anteil, null, Math.round(anteil * 100) + '%', t.komplett)]),
      mach('div', { klasse: 'tagstatus__text' }, [
        mach('div', { klasse: 'tagstatus__zahl', text: t.erledigt + ' von ' + t.gesamt + ' erledigt' }),
        Store.einst('spruecheAnzeigen') !== false
          ? mach('div', { klasse: 'tagstatus__spruch', text: statusSpruch(t) })
          : null
      ]),
      mach('div', { klasse: 'tagstatus__aktion' }, [
        mach('button', {
          klasse: 'knopf knopf--klein', type: 'button',
          disabled: !darfHaken(iso),
          auf: { click: () => tagUmschalten(iso, !t.komplett) }
        }, [ikone(t.komplett ? 'i-neu' : 'i-check'), t.komplett ? 'Zurücksetzen' : 'Alle abhaken'])
      ])
    ]);
    ziel.appendChild(status);

    /* --- Hinweise --- */
    if (sonder && sonder.hinweis) {
      ziel.appendChild(mach('div', { klasse: 'hinweis' }, [
        ikone('i-star'),
        mach('div', {}, [mach('strong', { text: 'Nur heute: ' }), mach('span', { text: sonder.hinweis })])
      ]));
    }
    if (!darfHaken(iso)) {
      ziel.appendChild(mach('div', { klasse: 'hinweis hinweis--info' }, [
        ikone('i-schloss'),
        mach('div', {}, [
          mach('strong', { text: 'Nur der heutige Tag ist abhakbar. ' }),
          mach('span', { text: 'Das lässt sich in den Einstellungen unter „Verhalten“ ändern.' })
        ])
      ]));
    }

    /* --- Aufgabenliste, nach Tagesabschnitt gruppiert --- */
    const liste = mach('div', { klasse: 'aufgaben' });
    let sortiert = aufgaben.slice();
    if (Store.einst('erledigteNachUnten')) {
      sortiert.sort((a, b) => (Store.istErledigt(iso, a.id) ? 1 : 0) - (Store.istErledigt(iso, b.id) ? 1 : 0));
    }

    const naechste = naechsteAufgabe(iso, aufgaben);
    const jetztMinuten = new Date().getHours() * 60 + new Date().getMinutes();
    let letztePhase = null;

    sortiert.forEach((a) => {
      if (!Store.einst('erledigteNachUnten') && a.phase !== letztePhase) {
        letztePhase = a.phase;
        const p = PHASEN[a.phase];
        const jetztHier = istHeute && Store.einst('zeitleiste') !== false && phaseIstJetzt(a.phase, jetztMinuten);
        liste.appendChild(mach('div', {
          klasse: 'phase' + (jetztHier ? ' phase--jetzt' : '')
        }, [
          mach('span', { text: p ? p.label : a.phase }),
          jetztHier ? mach('span', { klasse: 'mchip mchip--jetzt' }, [ikone('i-uhr'), 'jetzt']) : null
        ]));
      }
      liste.appendChild(aufgabenKarte(iso, a, naechste && naechste.id === a.id && istHeute));
    });
    ziel.appendChild(liste);

    /* --- Notiz des Tages --- */
    ziel.appendChild(mach('div', { klasse: 'block', stil: { 'margin-top': '22px' } }, [
      mach('h2', { klasse: 'block__titel' }, [ikone('i-note'), 'Ist mir aufgefallen']),
      notizFeld(iso, 'Notizen zum Tag – alles, was auffällt, kaputt ist oder besprochen werden soll …'),
      fotoLeiste(iso)
    ]));
  }

  function statusSpruch(t) {
    if (t.erledigt === 0) return 'Noch nichts abgehakt – fang einfach oben an.';
    if (t.komplett) return 'Alles erledigt. Stark!';
    const offen = t.gesamt - t.erledigt;
    if (offen === 1) return 'Nur noch eine Aufgabe. Fast geschafft!';
    if (t.erledigt / t.gesamt >= 0.5) return 'Über die Hälfte – noch ' + offen + ' Aufgaben.';
    return 'Noch ' + offen + ' Aufgaben offen.';
  }

  function phaseIstJetzt(phase, minuten) {
    const grenzen = { frueh: [0, 9 * 60], vormittag: [9 * 60, 13 * 60], mittag: [13 * 60, 16 * 60],
      nachmittag: [16 * 60, 18 * 60 + 30], abend: [18 * 60 + 30, 21 * 60 + 30], nacht: [21 * 60 + 30, 24 * 60] };
    const g = grenzen[phase];
    return g ? minuten >= g[0] && minuten < g[1] : false;
  }

  /** Erste offene Aufgabe, deren Zeit erreicht ist – sonst die erste offene */
  function naechsteAufgabe(iso, aufgaben) {
    const offen = aufgaben.filter((a) => !Store.istErledigt(iso, a.id));
    if (!offen.length) return null;
    const jetzt = new Date().getHours() * 60 + new Date().getMinutes();
    const faellig = offen.filter((a) => a.ankerZeit !== null && a.ankerZeit <= jetzt);
    return faellig.length ? faellig[0] : offen[0];
  }

  function zeichneTagleiste() {
    const leiste = mach('div', { klasse: 'tagleiste', role: 'group', 'aria-label': 'Tag wählen' });
    TAGE.forEach((iso) => {
      const t = Store.tagZahlen(iso);
      const istHeute = iso === heuteIso();
      const knopf = mach('button', {
        klasse: 'tagleiste__tag', type: 'button',
        'aria-current': iso === tag ? 'date' : null,
        'aria-label': datumLang(iso) + ', ' + t.erledigt + ' von ' + t.gesamt + ' erledigt',
        title: datumLang(iso),
        daten: { heute: istHeute ? '1' : '0', komplett: t.komplett ? '1' : '0' },
        auf: { click: () => geheZu('heute', iso) }
      }, [
        mach('span', { klasse: 'tagleiste__wt', text: wochentagKurz(iso) }),
        mach('span', { klasse: 'tagleiste__nr', text: String(isoZuDatum(iso).getDate()) }),
        mach('span', { klasse: 'tagleiste__ring' }, [
          ringSvg(t.gesamt ? t.erledigt / t.gesamt : 0, 22, null, t.komplett)
        ]),
        SONDERTAGE[iso] ? mach('span', { klasse: 'tagleiste__punkt' }) : null
      ]);
      leiste.appendChild(knopf);
    });
    // Der gewählte Tag soll sichtbar sein
    setTimeout(() => {
      const aktiv = leiste.querySelector('[aria-current="date"]');
      if (aktiv && aktiv.scrollIntoView) aktiv.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'auto' });
    }, 0);
    return leiste;
  }

  function aufgabenKarte(iso, a, istNaechste) {
    const erledigt = Store.istErledigt(iso, a.id);
    const gesperrt = !darfHaken(iso);
    const ts = Store.zeitpunkt(iso, a.id);

    const karte = mach('button', {
      klasse: 'aufgabe' +
        (istNaechste && !erledigt ? ' aufgabe--naechste' : '') +
        (a.sonder ? ' aufgabe--sonder' : '') +
        (gesperrt ? ' aufgabe--gesperrt' : ''),
      type: 'button',
      'aria-pressed': erledigt ? 'true' : 'false',
      'aria-label': a.titel + (erledigt ? ', erledigt' : ', offen'),
      disabled: gesperrt,
      daten: { erledigt: erledigt ? '1' : '0', aufgabe: a.id, tag: iso },
      stil: { '--f': 'var(--' + a.farbe + ')', '--f-weich': 'var(--' + a.farbe + '-weich)' },
      auf: { click: (ev) => hakenUmschalten(iso, a, karte, ev) }
    });

    if (a.sonder) karte.appendChild(mach('span', { klasse: 'aufgabe__stern' }, [ikone('i-star')]));

    karte.appendChild(mach('span', { klasse: 'aufgabe__kachel' }, [ikone(a.icon)]));

    const meta = mach('span', { klasse: 'aufgabe__meta' });
    if (a.zeitText) meta.appendChild(mach('span', { klasse: 'mchip mchip--zeit' }, [ikone('i-uhr'), a.zeitText]));
    if (istNaechste && !erledigt) meta.appendChild(mach('span', { klasse: 'mchip mchip--jetzt' }, [ikone('i-blitz'), 'als Nächstes']));
    if (a.zusatzAufgabe) meta.appendChild(mach('span', { klasse: 'mchip mchip--sonder' }, [ikone('i-star'), 'Zusatz']));
    if (erledigt && ts) meta.appendChild(mach('span', { klasse: 'mchip' }, [ikone('i-check'), zeitstempelText(ts)]));

    karte.appendChild(mach('span', { klasse: 'aufgabe__text' }, [
      mach('span', { klasse: 'aufgabe__titel' }, [
        a.nr ? mach('span', { klasse: 'aufgabe__nr', text: String(a.nr) }) : null,
        mach('span', { text: a.titel })
      ]),
      mach('span', { klasse: 'aufgabe__sub', text: a.text }),
      meta
    ]));

    karte.appendChild(mach('span', { klasse: 'aufgabe__box' }, [ikone('i-check')]));
    return karte;
  }

  function notizFeld(iso, platzhalter) {
    const feld = mach('textarea', {
      klasse: 'notizfeld',
      placeholder: platzhalter || 'Notiz …',
      rows: 3,
      'aria-label': 'Notiz für ' + datumLang(iso),
      auf: {
        input: (ev) => { Store.setzeNotiz(iso, ev.target.value); },
        blur: () => { Store.sichern(true); Store.pruefeErfolge(); }
      }
    });
    feld.value = Store.notiz(iso);
    return feld;
  }

  /* ==========================================================================
     Fotos zu einer Notiz
     ========================================================================== */

  /** Bild im Browser verkleinern, damit der Speicher nicht überläuft */
  function bildVerkleinern(datei, maxKante, guete) {
    return new Promise((fertig, fehlgeschlagen) => {
      const leser = new FileReader();
      leser.onerror = () => fehlgeschlagen(new Error('Das Bild konnte nicht gelesen werden.'));
      leser.onload = () => {
        const bild = new Image();
        bild.onerror = () => fehlgeschlagen(new Error('Das ist kein lesbares Bild.'));
        bild.onload = () => {
          const kante = maxKante || 900;
          let b = bild.naturalWidth, h = bild.naturalHeight;
          if (b > kante || h > kante) {
            const faktor = Math.min(kante / b, kante / h);
            b = Math.round(b * faktor); h = Math.round(h * faktor);
          }
          const leinwand = document.createElement('canvas');
          leinwand.width = b; leinwand.height = h;
          const ctx = leinwand.getContext('2d');
          ctx.drawImage(bild, 0, 0, b, h);
          try { fertig(leinwand.toDataURL('image/jpeg', guete || 0.62)); }
          catch (e) { fehlgeschlagen(new Error('Das Bild konnte nicht umgewandelt werden.')); }
        };
        bild.src = leser.result;
      };
      leser.readAsDataURL(datei);
    });
  }

  function fotoLeiste(iso) {
    const leiste = mach('div', { klasse: 'fotoleiste' });

    function neuZeichnen() {
      leeren(leiste);
      const fotos = Fotos.liste(iso);

      fotos.forEach((f) => {
        const kachel = mach('div', { klasse: 'foto' }, [
          mach('img', { src: f.bild, alt: 'Foto vom ' + datumKurz(iso), loading: 'lazy' }),
          mach('button', {
            klasse: 'foto__weg', type: 'button', 'aria-label': 'Foto löschen',
            auf: {
              click: () => Dialog.frage('Foto löschen?', 'Das Foto wird von diesem Gerät und vom Server entfernt.',
                'Löschen', () => { Fotos.entfernen(iso, f.id); neuZeichnen(); Meldung.zeig('Foto gelöscht.', { art: 'info' }); }, true)
            }
          }, [ikone('i-x')])
        ]);
        kachel.querySelector('img').addEventListener('click', () => fotoGross(iso, f));
        leiste.appendChild(kachel);
      });

      if (!Fotos.platzVoll(iso)) {
        const eingabe = mach('input', {
          type: 'file', accept: 'image/*', capture: 'environment',
          stil: { display: 'none' }
        });
        eingabe.addEventListener('change', async () => {
          const datei = eingabe.files && eingabe.files[0];
          eingabe.value = '';
          if (!datei) return;
          const schliessen = Meldung.zeig('Foto wird verkleinert …', { dauer: 20000 });
          try {
            const klein = await bildVerkleinern(datei, 900, 0.62);
            const ergebnis = Fotos.hinzufuegen(iso, klein, datei.name);
            schliessen();
            if (!ergebnis.ok) { Meldung.zeig(ergebnis.grund, { art: 'fehler', dauer: 5000 }); return; }
            Meldung.zeig('Foto gespeichert (' + Math.round(klein.length / 1024) + ' KB).', { art: 'gut' });
            const neueErfolge = Store.pruefeErfolge();
            if (neueErfolge.length) ErfolgAnzeige.zeig(neueErfolge);
            neuZeichnen();
          } catch (fehler) {
            schliessen();
            Meldung.zeig(fehler.message, { art: 'fehler' });
          }
        });

        const knopf = mach('button', {
          klasse: 'foto-neu', type: 'button',
          title: 'Foto aufnehmen oder auswählen',
          auf: { click: () => eingabe.click() }
        }, [ikone('i-kamera'), mach('span', { text: 'Foto' })]);

        leiste.appendChild(knopf);
        leiste.appendChild(eingabe);
      }
    }

    neuZeichnen();
    return leiste;
  }

  function fotoGross(iso, f) {
    const bild = mach('img', {
      src: f.bild, alt: 'Foto vom ' + datumKurz(iso),
      stil: { width: '100%', 'border-radius': '12px', display: 'block' }
    });
    Dialog.zeig({
      titel: 'Foto vom ' + wochentagKurz(iso) + ' ' + datumKurz(iso),
      inhalt: mach('div', {}, [
        bild,
        mach('p', { klasse: 'zeile__sub', stil: { 'margin-top': '9px' }, text: 'Aufgenommen: ' + zeitstempelText(f.ts) })
      ]),
      knoepfe: [
        {
          text: 'Teilen', icon: 'i-teilen',
          fn: () => {
            if (navigator.share) {
              fetch(f.bild).then((r) => r.blob()).then((blob) => {
                const datei = new File([blob], 'foto-' + iso + '.jpg', { type: 'image/jpeg' });
                if (navigator.canShare && navigator.canShare({ files: [datei] })) {
                  navigator.share({ files: [datei], title: 'Foto vom ' + datumKurz(iso) }).catch(() => {});
                } else {
                  navigator.share({ title: 'Foto vom ' + datumKurz(iso) }).catch(() => {});
                }
              }).catch(() => Meldung.zeig('Teilen hat nicht geklappt.', { art: 'warn' }));
            } else {
              dateiSpeichern2(f.bild, 'foto-' + iso + '.jpg');
            }
            return false;
          },
          schliesst: false
        },
        { text: 'Schließen', art: 'haupt' }
      ]
    });
  }

  /** Data-URL als Datei speichern */
  function dateiSpeichern2(dataUrl, name) {
    const a = mach('a', { href: dataUrl, download: name });
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 1000);
  }

  /* ==========================================================================
     Häkchen setzen
     ========================================================================== */
  function hakenUmschalten(iso, a, karte, ereignis) {
    if (!darfHaken(iso)) {
      Meldung.zeig('Dieser Tag ist gesperrt – nur der heutige Tag lässt sich abhaken.', { art: 'warn' });
      Klang.fehler(); Haptik.fehler();
      return;
    }
    Klang.aufwecken();
    const neu = Store.umschalten(iso, a.id);

    if (karte) {
      karte.dataset.erledigt = neu ? '1' : '0';
      karte.setAttribute('aria-pressed', neu ? 'true' : 'false');
      karte.classList.remove('aufgabe--huepf');
      void karte.offsetWidth;                     // Animation neu starten
      if (neu) karte.classList.add('aufgabe--huepf');
    }

    if (neu) {
      Klang.haken(); Haptik.tipp();
      const punkt = mittelpunkt(karte, ereignis);
      Konfetti.funken(punkt.x, punkt.y, 1);
    } else {
      Klang.zurueck();
    }

    letzteAktion = { iso, aufgabeId: a.id, vorher: !neu };
    const t = Store.tagZahlen(iso);

    if (neu && t.komplett) {
      Konfetti.regen();
      const z = Store.zahlen();
      if (z.erledigtGesamt >= z.gesamt) { Klang.grosserSieg(); }
      else { Klang.fanfare(); }
      Haptik.erfolg();
      Meldung.zeig(zufall(SPRUECHE_TAG_KOMPLETT), { art: 'gut', dauer: 4200 });
    } else if (neu && Store.einst('spruecheAnzeigen') !== false) {
      Meldung.zeig(zufall(SPRUECHE_ZWISCHEN) + '  ' + t.erledigt + '/' + t.gesamt, {
        art: 'gut', dauer: 2400,
        aktion: { text: 'Rückgängig', fn: rueckgaengig }
      });
    } else if (!neu) {
      Meldung.zeig('Häkchen entfernt.', {
        art: 'info', dauer: 2400,
        aktion: { text: 'Rückgängig', fn: rueckgaengig }
      });
    }

    const neueErfolge = Store.pruefeErfolge();
    if (neueErfolge.length) ErfolgAnzeige.zeig(neueErfolge);

    // Nur die betroffenen Teile neu zeichnen, damit die Liste nicht springt
    aktualisiereUmgebung(iso, neu && t.komplett);
  }

  function rueckgaengig() {
    if (!letzteAktion) return;
    Store.setzeErledigt(letzteAktion.iso, letzteAktion.aufgabeId, letzteAktion.vorher);
    letzteAktion = null;
    zeichneAlles();
  }

  function tagUmschalten(iso, wert) {
    Store.setzeTag(iso, wert);
    if (wert) {
      Konfetti.regen(); Klang.fanfare(); Haptik.erfolg();
      Meldung.zeig('Ganzer Tag abgehakt.', { art: 'gut' });
      const neueErfolge = Store.pruefeErfolge();
      if (neueErfolge.length) ErfolgAnzeige.zeig(neueErfolge);
    } else {
      Klang.zurueck();
      Meldung.zeig('Tag zurückgesetzt.', { art: 'info' });
    }
    zeichneAlles();
  }

  function mittelpunkt(element, ereignis) {
    if (ereignis && ereignis.clientX && ereignis.clientY && (ereignis.clientX > 0 || ereignis.clientY > 0)) {
      return { x: ereignis.clientX, y: ereignis.clientY };
    }
    if (element) {
      const r = element.getBoundingClientRect();
      return { x: r.right - 26, y: r.top + r.height / 2 };
    }
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }

  /** Kopf, Tagesleiste und Fortschrittskarte auffrischen, ohne die Karten neu zu bauen */
  function aktualisiereUmgebung(iso, komplettGeworden) {
    zeichneKopf();
    if (ansicht !== 'heute') { zeichneAlles(); return; }
    if (komplettGeworden) { zeichneHeute(); return; }

    const t = Store.tagZahlen(iso);
    const anteil = t.gesamt ? t.erledigt / t.gesamt : 0;

    const status = knoten.heute.querySelector('.tagstatus');
    if (status) {
      const ringHuelle = status.querySelector('.tagstatus__ring');
      if (ringHuelle) { leeren(ringHuelle); ringHuelle.appendChild(ringSvg(anteil, null, Math.round(anteil * 100) + '%', t.komplett)); }
      const zahl = status.querySelector('.tagstatus__zahl');
      if (zahl) zahl.textContent = t.erledigt + ' von ' + t.gesamt + ' erledigt';
      const spruch = status.querySelector('.tagstatus__spruch');
      if (spruch) spruch.textContent = statusSpruch(t);
      status.classList.toggle('tagstatus--fertig', t.komplett);
    }

    const alteLeiste = knoten.heute.querySelector('.tagleiste');
    if (alteLeiste) alteLeiste.replaceWith(zeichneTagleiste());
  }

  /* ==========================================================================
     Ansicht: Raster
     ========================================================================== */
  function zeichneRaster() {
    const ziel = knoten.raster;
    leeren(ziel);

    ziel.appendChild(mach('div', { klasse: 'block__titel' }, [
      ikone('i-grid'), 'Zum Abhaken · jeden Tag Kästchen für Kästchen'
    ]));

    const huelle = mach('div', { klasse: 'raster-huelle' });
    const tabelle = mach('table', { klasse: 'raster' });

    /* Kopfzeile */
    const kopfZeile = mach('tr', {}, [mach('th', { scope: 'col', text: 'Tag' })]);
    AUFGABEN.forEach((a) => {
      kopfZeile.appendChild(mach('th', {
        scope: 'col',
        stil: { '--f': 'var(--' + a.farbe + ')', '--f-weich': 'var(--' + a.farbe + '-weich)' }
      }, [
        mach('div', { klasse: 'raster__kopfkachel' }, [
          mach('i', {}, [ikone(a.icon)]),
          mach('span', { text: a.kurz })
        ])
      ]));
    });
    kopfZeile.appendChild(mach('th', { scope: 'col', text: 'Summe' }));
    tabelle.appendChild(mach('thead', {}, [kopfZeile]));

    /* Datenzeilen */
    const koerper = mach('tbody');
    TAGE.forEach((iso) => {
      const sonder = SONDERTAGE[iso];
      const t = Store.tagZahlen(iso);
      const zeile = mach('tr');

      zeile.appendChild(mach('th', { scope: 'row', klasse: 'raster__tag' }, [
        mach('button', {
          klasse: 'raster__tagknopf', type: 'button',
          title: 'Diesen Tag öffnen',
          daten: { heute: iso === heuteIso() ? '1' : '0', we: istWochenende(iso) ? '1' : '0' },
          auf: { click: () => geheZu('heute', iso) }
        }, [
          mach('span', { klasse: 'raster__wt', text: wochentagKurz(iso) }),
          mach('span', { text: datumKurz(iso) }),
          iso === heuteIso() ? mach('span', { klasse: 'marke', text: 'Heute' }) : null
        ])
      ]));

      AUFGABEN.forEach((a) => {
        const zelle = mach('td');
        const ersetzt = sonder && sonder.ersetzt && sonder.ersetzt[a.id];
        const zusatz = sonder && sonder.zusatz ? sonder.zusatz.filter((z) => z.nachId === a.id) : [];
        const istSonderZelle = !!ersetzt || zusatz.length > 0;

        const huelleZelle = mach('span', { klasse: 'zelle' + (istSonderZelle ? ' zelle--sonder' : '') });
        if (ersetzt) huelleZelle.appendChild(mach('span', { klasse: 'zelle__marker', title: ersetzt.text }, [ikone(ersetzt.icon)]));

        huelleZelle.appendChild(kastenKnopf(iso, ersetzt ? Object.assign({}, a, ersetzt) : a));
        zusatz.forEach((z) => {
          huelleZelle.appendChild(mach('span', { klasse: 'zelle__marker', title: z.text }, [ikone(z.icon)]));
          huelleZelle.appendChild(kastenKnopf(iso, z));
        });

        zelle.appendChild(huelleZelle);
        zeile.appendChild(zelle);
      });

      zeile.appendChild(mach('td', { klasse: 'raster__summe' }, [
        mach('span', { klasse: t.komplett ? 'voll' : '', text: t.erledigt + '/' + t.gesamt })
      ]));
      koerper.appendChild(zeile);
    });
    tabelle.appendChild(koerper);
    huelle.appendChild(tabelle);
    ziel.appendChild(huelle);

    /* Legende */
    ziel.appendChild(mach('div', { klasse: 'legende' }, [
      mach('span', { klasse: 'legende__eintrag' }, [ikone('i-check'), mach('span', {}, [mach('b', { text: 'erledigt' }), ' = Kästchen abhaken'])]),
      mach('span', { klasse: 'legende__eintrag' }, [ikone('i-mower'), mach('span', { text: 'Do 20.08.: Rasen mähen statt gießen (ab 8 Uhr)' })]),
      mach('span', { klasse: 'legende__eintrag' }, [ikone('i-trash'), mach('span', { text: 'Mo 24.08.: abends Restmüllsack zudrehen, Tonne rausstellen' })]),
      mach('button', { klasse: 'knopf knopf--klein', type: 'button', auf: { click: () => window.print() } }, [ikone('i-drucker'), 'Drucken'])
    ]));
  }

  function kastenKnopf(iso, a) {
    const erledigt = Store.istErledigt(iso, a.id);
    const knopf = mach('button', {
      klasse: 'kasten', type: 'button',
      'aria-pressed': erledigt ? 'true' : 'false',
      'aria-label': datumKurz(iso) + ' ' + a.titel,
      title: datumKurz(iso) + ' · ' + a.titel,
      disabled: !darfHaken(iso),
      stil: { '--f': 'var(--' + a.farbe + ')', '--f-weich': 'var(--' + a.farbe + '-weich)' },
      auf: {
        click: (ev) => {
          if (!darfHaken(iso)) return;
          Klang.aufwecken();
          const neu = Store.umschalten(iso, a.id);
          knopf.setAttribute('aria-pressed', neu ? 'true' : 'false');
          knopf.classList.remove('kasten--huepf');
          void knopf.offsetWidth;
          if (neu) knopf.classList.add('kasten--huepf');

          if (neu) {
            Klang.haken(); Haptik.tipp();
            const p = mittelpunkt(knopf, ev);
            Konfetti.funken(p.x, p.y, 0.7);
          } else { Klang.zurueck(); }

          letzteAktion = { iso, aufgabeId: a.id, vorher: !neu };
          const t = Store.tagZahlen(iso);
          const summe = knopf.closest('tr').querySelector('.raster__summe span');
          if (summe) { summe.textContent = t.erledigt + '/' + t.gesamt; summe.className = t.komplett ? 'voll' : ''; }

          if (neu && t.komplett) {
            Konfetti.regen(); Klang.fanfare(); Haptik.erfolg();
            Meldung.zeig(wochentagKurz(iso) + ' ' + datumKurz(iso) + ' komplett! ' + zufall(SPRUECHE_TAG_KOMPLETT), { art: 'gut', dauer: 4000 });
          }
          const neueErfolge = Store.pruefeErfolge();
          if (neueErfolge.length) ErfolgAnzeige.zeig(neueErfolge);
          zeichneKopf();
        }
      }
    }, [ikone('i-check')]);
    return knopf;
  }

  /* ==========================================================================
     Ansicht: Notizen
     ========================================================================== */
  function zeichneNotizen() {
    const ziel = knoten.notizen;
    leeren(ziel);

    ziel.appendChild(mach('div', { klasse: 'block__titel' }, [
      ikone('i-note'), 'Ist mir aufgefallen · Notizen pro Tag'
    ]));

    ziel.appendChild(mach('div', { klasse: 'hinweis hinweis--info' }, [
      ikone('i-info'),
      mach('div', {}, [
        mach('span', { text: 'Alles, was auffällt, kaputt ist oder besprochen werden soll. Wird automatisch gespeichert. ' }),
        mach('button', {
          klasse: 'knopf knopf--klein', type: 'button',
          stil: { 'margin-left': '6px' },
          auf: { click: notizenExportieren }
        }, [ikone('i-download'), 'Als Text sichern'])
      ])
    ]));

    /* Suche über alle Notizen */
    const suchfeld = mach('input', {
      klasse: 'feld', type: 'search', placeholder: 'In allen Notizen suchen …',
      'aria-label': 'Notizen durchsuchen'
    });
    const treffer = mach('div', { klasse: 'suchtreffer', hidden: true });
    suchfeld.addEventListener('input', () => {
      const begriff = suchfeld.value.trim();
      leeren(treffer);
      if (begriff.length < 2) { treffer.hidden = true; return; }
      const gefunden = Store.notizenSuchen(begriff);
      treffer.hidden = false;
      if (!gefunden.length) {
        treffer.appendChild(mach('div', { klasse: 'zeile__sub', text: 'Nichts gefunden zu „' + begriff + '".' }));
        return;
      }
      treffer.appendChild(mach('div', { klasse: 'zeile__sub', text: gefunden.length + ' Tag(e) gefunden:' }));
      gefunden.forEach((g) => {
        const stelle = g.text.toLowerCase().indexOf(begriff.toLowerCase());
        const auszug = g.text.slice(Math.max(0, stelle - 30), stelle + 70).trim();
        treffer.appendChild(mach('button', {
          klasse: 'suchtreffer__eintrag', type: 'button',
          auf: { click: () => geheZu('heute', g.iso) }
        }, [
          mach('strong', { text: wochentagKurz(g.iso) + ' ' + datumKurz(g.iso) }),
          mach('span', { text: (stelle > 30 ? '… ' : '') + auszug + ' …' })
        ]));
      });
    });
    ziel.appendChild(mach('div', { klasse: 'block' }, [suchfeld, treffer]));

    const gitter = mach('div', { klasse: 'notizgitter' });
    const farben = ['t1', 't2', 't3', 't5', 't6', 't4', 't7', 't9', 't3', 't8', 't1', 't6'];

    TAGE.forEach((iso, i) => {
      const text = Store.notiz(iso);
      const karte = mach('div', {
        klasse: 'notizkarte',
        stil: { '--f': 'var(--' + farben[i % farben.length] + ')', '--f-weich': 'var(--' + farben[i % farben.length] + '-weich)' }
      }, [
        mach('div', { klasse: 'notizkarte__kopf' }, [
          mach('span', { klasse: 'notizkarte__datum', text: wochentagKurz(iso) + ' ' + datumKurz(iso) }),
          mach('span', { klasse: 'notizkarte__wt', text: wochentagLang(iso) })
        ]),
        notizFeld(iso, 'Hier hinschreiben …'),
        fotoLeiste(iso),
        mach('div', { klasse: 'notizkarte__fuss' }, [
          mach('span', { klasse: 'notiz-zeichen', text: text ? text.length + ' Zeichen' : 'leer' }),
          mach('button', {
            klasse: 'knopf knopf--klein', type: 'button',
            auf: { click: () => geheZu('heute', iso) }
          }, [ikone('i-calendar'), 'Tag öffnen'])
        ])
      ]);

      const feld = karte.querySelector('.notizfeld');
      const zaehler = karte.querySelector('.notiz-zeichen');
      feld.addEventListener('input', () => {
        zaehler.textContent = feld.value ? feld.value.length + ' Zeichen' : 'leer';
      });

      gitter.appendChild(karte);
    });
    ziel.appendChild(gitter);
  }

  function notizenExportieren() {
    const zeilen = ['Notizen – Aufgabenliste 15. bis 26. August 2026', ''];
    let anzahl = 0;
    TAGE.forEach((iso) => {
      const text = Store.notiz(iso);
      if (text && text.trim()) {
        zeilen.push(wochentagLang(iso) + ', ' + datumKurz(iso) + '2026');
        zeilen.push(text.trim());
        zeilen.push('');
        anzahl++;
      }
    });
    if (!anzahl) { Meldung.zeig('Es sind noch keine Notizen vorhanden.', { art: 'warn' }); return; }
    dateiSpeichern(zeilen.join('\n'), 'Notizen-August-2026.txt', 'text/plain;charset=utf-8');
    Meldung.zeig(anzahl + ' Notizen gesichert.', { art: 'gut' });
  }

  /* ==========================================================================
     Ansicht: Statistik
     ========================================================================== */
  function zeichneStatistik() {
    const ziel = knoten.statistik;
    leeren(ziel);
    const z = Store.zahlen();

    /* Große Gesamtkarte */
    ziel.appendChild(mach('div', { klasse: 'gesamtkarte' }, [
      mach('div', { klasse: 'gesamtkarte__ring' }, [
        ringSvg(z.gesamt ? z.erledigtGesamt / z.gesamt : 0, 108, z.prozent + '%', z.erledigtGesamt >= z.gesamt)
      ]),
      mach('div', {}, [
        mach('h2', { stil: { 'font-size': '1.35rem' }, text: z.erledigtGesamt + ' von ' + z.gesamt + ' Aufgaben erledigt' }),
        mach('p', { stil: { color: 'var(--text-leise)', 'margin-top': '4px' },
          text: z.tageKomplett + ' von ' + TAGE.length + ' Tagen komplett · ' +
                (z.gesamt - z.erledigtGesamt) + ' Häkchen noch offen' }),
        mach('div', { klasse: 'knopfreihe', stil: { 'margin-top': '13px' } }, [
          mach('button', { klasse: 'knopf knopf--klein', type: 'button', auf: { click: fortschrittTeilen } },
            [ikone('i-teilen'), 'Fortschritt teilen']),
          mach('button', { klasse: 'knopf knopf--klein', type: 'button', auf: { click: () => window.print() } },
            [ikone('i-drucker'), 'Drucken'])
        ])
      ])
    ]));

    /* Kennzahlen */
    const kacheln = [
      { icon: 'i-check',   titel: 'Erledigt',      wert: z.erledigtGesamt, sub: 'von ' + z.gesamt + ' Häkchen' },
      { icon: 'i-trophy',  titel: 'Ganze Tage',    wert: z.tageKomplett,   sub: 'von ' + TAGE.length + ' Tagen' },
      { icon: 'i-flame',   titel: 'Aktuelle Serie',wert: z.streakAktuell,  sub: z.streakAktuell === 1 ? 'Tag am Stück' : 'Tage am Stück' },
      { icon: 'i-star',    titel: 'Beste Serie',   wert: z.streakBest,     sub: z.streakBest === 1 ? 'Tag am Stück' : 'Tage am Stück' },
      { icon: 'i-note',    titel: 'Notizen',       wert: Store.notizenAnzahl(), sub: 'Tage mit Notiz' },
      { icon: 'i-crown',   titel: 'Erfolge',       wert: Object.keys(Store.erfolgeStand()).length, sub: 'von ' + ERFOLGE.length }
    ];
    const gitter = mach('div', { klasse: 'stat-gitter' });
    kacheln.forEach((k) => {
      gitter.appendChild(mach('div', { klasse: 'statkarte' }, [
        mach('div', { klasse: 'statkarte__kopf' }, [ikone(k.icon), k.titel]),
        mach('div', { klasse: 'statkarte__wert', text: String(k.wert) }),
        mach('div', { klasse: 'statkarte__sub', text: k.sub })
      ]));
    });
    ziel.appendChild(gitter);

    /* Balken pro Tag */
    const proTag = mach('div', { klasse: 'karte', stil: { padding: '17px' } });
    proTag.appendChild(mach('h2', { klasse: 'block__titel' }, [ikone('i-calendar'), 'Fortschritt pro Tag']));
    const balken = mach('div', { klasse: 'balkenliste' });
    TAGE.forEach((iso) => {
      const t = z.proTag[iso];
      const anteil = t.gesamt ? t.erledigt / t.gesamt : 0;
      balken.appendChild(mach('button', {
        klasse: 'balken', type: 'button',
        title: 'Diesen Tag öffnen',
        auf: { click: () => geheZu('heute', iso) }
      }, [
        mach('span', { klasse: 'balken__label' }, [
          mach('span', { text: wochentagKurz(iso) + ' ' + datumKurz(iso) }),
          mach('small', { text: iso === heuteIso() ? 'heute' : wochentagLang(iso) })
        ]),
        mach('span', { klasse: 'balken__spur' }, [
          mach('span', { klasse: 'balken__wert' + (t.komplett ? ' balken__wert--voll' : ''), stil: { width: (anteil * 100) + '%' } })
        ]),
        mach('span', { klasse: 'balken__zahl', text: t.erledigt + '/' + t.gesamt })
      ]));
    });
    proTag.appendChild(balken);
    ziel.appendChild(proTag);

    /* Pro Aufgabe */
    const proAufgabe = mach('div', { klasse: 'karte', stil: { padding: '17px', 'margin-top': '18px' } });
    proAufgabe.appendChild(mach('h2', { klasse: 'block__titel' }, [ikone('i-chart'), 'Welche Aufgabe wie oft']));
    const liste = mach('div', { klasse: 'aufgabenstat' });
    alleAufgabenArten().forEach((a) => {
      const s = Store.aufgabeZahlen(a.id);
      const anteil = s.moeglich ? s.erledigt / s.moeglich : 0;
      liste.appendChild(mach('div', {
        klasse: 'aufgabenstat__zeile',
        stil: { '--f': 'var(--' + a.farbe + ')', '--f-weich': 'var(--' + a.farbe + '-weich)' }
      }, [
        mach('span', { klasse: 'aufgabenstat__icon' }, [ikone(a.icon)]),
        mach('span', {}, [
          mach('span', { klasse: 'aufgabenstat__name', text: a.kurz }),
          mach('span', { klasse: 'aufgabenstat__spur' }, [mach('i', { stil: { width: (anteil * 100) + '%' } })])
        ]),
        mach('span', { klasse: 'aufgabenstat__zahl', text: s.erledigt + '/' + s.moeglich })
      ]));
    });
    proAufgabe.appendChild(liste);
    ziel.appendChild(proAufgabe);

    /* Erfolge */
    const erfolgKarte = mach('div', { klasse: 'karte', stil: { padding: '17px', 'margin-top': '18px' } });
    erfolgKarte.appendChild(mach('h2', { klasse: 'block__titel' }, [ikone('i-trophy'), 'Erfolge']));
    const erfolgGitter = mach('div', { klasse: 'erfolge' });
    ERFOLGE.forEach((e) => {
      const wann = Store.erfolgeStand()[e.id];
      erfolgGitter.appendChild(mach('div', { klasse: 'erfolg ' + (wann ? 'erfolg--offen' : 'erfolg--zu') }, [
        mach('div', { klasse: 'erfolg__ring' }, [ikone(wann ? e.icon : 'i-schloss')]),
        mach('div', { klasse: 'erfolg__titel', text: e.titel }),
        mach('div', { klasse: 'erfolg__text', text: e.text }),
        wann ? mach('div', { klasse: 'erfolg__datum', text: zeitstempelText(wann) }) : null
      ]));
    });
    erfolgKarte.appendChild(erfolgGitter);
    ziel.appendChild(erfolgKarte);
  }

  function fortschrittTeilen() {
    const z = Store.zahlen();
    const text = 'Aufgabenliste 15.–26. August 2026: ' + z.erledigtGesamt + ' von ' + z.gesamt +
      ' Aufgaben erledigt (' + z.prozent + '%), ' + z.tageKomplett + ' Tage komplett.';
    if (navigator.share) {
      navigator.share({ title: 'Mein Fortschritt', text }).catch(() => {});
    } else {
      inZwischenablage(text, 'Fortschritt kopiert.');
    }
  }

  /* ==========================================================================
     Ansicht: Einstellungen
     ========================================================================== */
  function zeichneEinstellungen() {
    const ziel = knoten.einstellungen;
    leeren(ziel);

    /* --- Persönlich --- */
    ziel.appendChild(gruppe('Persönlich', 'i-star', [
      zeileSpalte('Dein Name', 'Steht oben in der Überschrift.',
        textFeld(Store.einst('name'), 'Basti', (w) => { Store.setzeEinst('name', w); zeichneKopf(); })),
      zeileSpalte('Name dieses Geräts', 'Hilft beim Abgleich zu erkennen, woher ein Sync-Code kommt.',
        textFeld(Store.einst('geraet'), 'z. B. iPhone oder PC', (w) => Store.setzeEinst('geraet', w)))
    ]));

    /* --- Aussehen --- */
    ziel.appendChild(gruppe('Aussehen', 'i-sun', [
      zeileUmbruch('Farbschema', 'Dunkel schont abends die Augen.',
        segment([
          { wert: 'hell', text: 'Hell', icon: 'i-sun' },
          { wert: 'dunkel', text: 'Dunkel', icon: 'i-moon' },
          { wert: 'system', text: 'System', icon: 'i-monitor' }
        ], Store.einst('theme'), (w) => { Store.setzeEinst('theme', w); themeAnwenden(); })),

      zeileUmbruch('Akzentfarbe', 'Färbt Kopfbereich, Knöpfe und Ringe.',
        farbwahl(Store.einst('akzent'), (w) => { Store.setzeEinst('akzent', w); themeAnwenden(); })),

      zeileUmbruch('Textgröße', 'Größer, wenn die Schrift auf dem Handy zu klein ist.',
        segment([
          { wert: 'klein', text: 'Klein' },
          { wert: 'normal', text: 'Normal' },
          { wert: 'gross', text: 'Groß' }
        ], Store.einst('textgroesse'), (w) => { Store.setzeEinst('textgroesse', w); themeAnwenden(); })),

      zeileSchalter('Animationen', 'Sanfte Übergänge und Hüpf-Effekte.',
        Store.einst('animationen') !== false, (w) => { Store.setzeEinst('animationen', w); themeAnwenden(); })
    ]));

    /* --- Verhalten --- */
    ziel.appendChild(gruppe('Verhalten', 'i-blitz', [
      zeileUmbruch('Ansicht beim Start', 'Womit die Seite nach dem Öffnen beginnt.',
        segment([
          { wert: 'heute', text: 'Heute' },
          { wert: 'raster', text: 'Übersicht' },
          { wert: 'notizen', text: 'Notizen' },
          { wert: 'statistik', text: 'Statistik' }
        ], Store.einst('startAnsicht'), (w) => Store.setzeEinst('startAnsicht', w))),

      zeileSchalter('Beim Öffnen auf heute springen',
        'Aus: die Seite bleibt bei dem Tag, den du zuletzt angesehen hast.',
        Store.einst('aufHeuteSpringen') !== false, (w) => Store.setzeEinst('aufHeuteSpringen', w)),

      zeileSchalter('Nur den heutigen Tag abhaken',
        'Strenger Modus. Verhindert versehentliche Häkchen, macht Nachtragen aber unmöglich.',
        Store.einst('nurHeute') === true, (w) => { Store.setzeEinst('nurHeute', w); zeichneAlles(); }),

      zeileSchalter('Erledigte Aufgaben nach unten',
        'Sortiert Abgehaktes ans Ende statt in den Tagesablauf.',
        Store.einst('erledigteNachUnten') === true, (w) => { Store.setzeEinst('erledigteNachUnten', w); zeichneAlles(); }),

      zeileSchalter('„Jetzt“-Markierung anzeigen',
        'Hebt den Tagesabschnitt hervor, in dem du gerade bist.',
        Store.einst('zeitleiste') !== false, (w) => { Store.setzeEinst('zeitleiste', w); zeichneAlles(); }),

      zeileSchalter('Motivationssprüche',
        'Kurze Rückmeldungen beim Abhaken.',
        Store.einst('spruecheAnzeigen') !== false, (w) => { Store.setzeEinst('spruecheAnzeigen', w); zeichneAlles(); })
    ]));

    /* --- Rückmeldung --- */
    const lautstaerkeAnzeige = mach('span', { klasse: 'zeile__sub', text: Math.round((Store.einst('lautstaerke') || 0.5) * 100) + ' %' });
    ziel.appendChild(gruppe('Konfetti, Klang und Vibration', 'i-blitz', [
      zeileUmbruch('Konfetti', 'Wie viel fliegt beim Abhaken und bei einem ganzen Tag?',
        segment([
          { wert: 'aus', text: 'Aus' },
          { wert: 'wenig', text: 'Wenig' },
          { wert: 'normal', text: 'Normal' },
          { wert: 'viel', text: 'Viel' }
        ], Store.einst('konfetti'), (w) => {
          Store.setzeEinst('konfetti', w);
          if (w !== 'aus') Konfetti.funken(window.innerWidth / 2, window.innerHeight / 2, 1.4);
        })),

      zeileSchalter('Klänge', 'Kleine Töne beim Abhaken und eine Fanfare am Tagesende.',
        Store.einst('sound') !== false, (w) => { Store.setzeEinst('sound', w); if (w) Klang.haken(); }),

      zeileUmbruch('Lautstärke', null,
        mach('div', { klasse: 'knopfreihe', stil: { 'align-items': 'center' } }, [
          (() => {
            const r = mach('input', {
              klasse: 'regler', type: 'range', min: '0', max: '100', step: '5',
              value: String(Math.round((Store.einst('lautstaerke') || 0.5) * 100)),
              'aria-label': 'Lautstärke',
              auf: {
                input: (ev) => {
                  const w = Number(ev.target.value) / 100;
                  Store.setzeEinst('lautstaerke', w);
                  lautstaerkeAnzeige.textContent = ev.target.value + ' %';
                },
                change: () => Klang.haken()
              }
            });
            return r;
          })(),
          lautstaerkeAnzeige,
          mach('button', { klasse: 'knopf knopf--klein', type: 'button', auf: { click: () => Klang.fanfare() } }, ['Probe'])
        ])),

      zeileSchalter('Vibration',
        Haptik.moeglich() ? 'Kurzes Rütteln beim Abhaken.'
                          : 'Dieses Gerät unterstützt keine Vibration über den Browser (iPhone/Safari kann das nicht).',
        Store.einst('vibration') !== false, (w) => { Store.setzeEinst('vibration', w); Haptik.tipp(); })
    ]));

    /* --- Erinnerungen --- */
    const status = Erinnerungen.status();
    const statusText = {
      'granted': 'Erlaubt – Erinnerungen kommen, solange die Seite geöffnet oder als App im Hintergrund ist.',
      'denied': 'Abgelehnt. Bitte in den Browser-Einstellungen für diese Seite wieder freigeben.',
      'default': 'Noch nicht gefragt. Auf „Erlauben“ tippen.',
      'nicht-unterstuetzt': 'Dieser Browser kennt keine Benachrichtigungen.'
    }[status] || '';

    const zeiten = [];
    AUFGABEN.forEach((a) => { if (a.erinnerung) zeiten.push(minutenZuUhr(erinnerungsZeit(a)) + ' ' + a.kurz); });
    zeiten.push('20:30 Restmüll (Mo 24.08.)', '20:30 Papiermüll (Mi 26.08.)');

    ziel.appendChild(gruppe('Erinnerungen', 'i-glocke', [
      zeileSchalter('Erinnerungen einschalten', statusText,
        Store.einst('erinnerungen') === true,
        (w) => {
          Store.setzeEinst('erinnerungen', w);
          if (w && Erinnerungen.status() === 'default') Erinnerungen.erlauben();
          else if (w) Erinnerungen.starten();
          zeichneEinstellungen();
        }),

      mach('div', { klasse: 'zeile zeile--spalte' }, [
        mach('div', { klasse: 'zeile__text' }, [
          mach('div', { klasse: 'zeile__titel', text: 'Zeiten' }),
          mach('div', { klasse: 'zeile__sub', text: zeiten.join(' · ') })
        ]),
        mach('div', { klasse: 'knopfreihe' }, [
          status !== 'granted' ? mach('button', {
            klasse: 'knopf knopf--klein knopf--haupt', type: 'button',
            disabled: status === 'nicht-unterstuetzt' || status === 'denied',
            auf: { click: () => Erinnerungen.erlauben() }
          }, [ikone('i-glocke'), 'Benachrichtigungen erlauben']) : null,
          mach('button', { klasse: 'knopf knopf--klein', type: 'button', auf: { click: () => Erinnerungen.test() } },
            [ikone('i-glocke'), 'Test-Erinnerung']),
          mach('button', { klasse: 'knopf knopf--klein', type: 'button', auf: { click: zeitenDialog } },
            [ikone('i-uhr'), 'Zeiten anpassen'])
        ]),
        zeileUmbruch('Etwas früher erinnern', 'Verschiebt alle Erinnerungen nach vorne.',
          segment([
            { wert: 0, text: 'pünktlich' },
            { wert: 5, text: '5 Min.' },
            { wert: 15, text: '15 Min.' },
            { wert: 30, text: '30 Min.' }
          ], Number(Store.einst('erinnerungsVorlauf')) || 0, (w) => {
            Store.setzeEinst('erinnerungsVorlauf', Number(w));
            Api.planHochladen();
          })),
        mach('div', { klasse: 'zeile__sub' }, [
          mach('strong', { text: 'Wichtig auf dem iPhone: ' }),
          'Benachrichtigungen funktionieren nur, wenn die Seite über „Teilen → Zum Home-Bildschirm“ als App gespeichert ist (ab iOS 16.4). Ein echter Wecker ist zuverlässiger.'
        ])
      ])
    ]));

    /* --- Eigener Server: Abgleich und echte Benachrichtigungen --- */
    const sz = Api.zustand();
    const hindernis = Api.pushHindernis();

    const serverZeilen = [
      mach('div', { klasse: 'zeile zeile--spalte' }, [
        mach('div', { klasse: 'zeile__text' }, [
          mach('div', { klasse: 'zeile__titel' }, [
            mach('span', { klasse: 'punkt punkt--' + (sz.verfuegbar ? 'gut' : 'aus') }),
            sz.verfuegbar ? 'Server verbunden' : 'Kein Server gefunden'
          ]),
          mach('div', { klasse: 'zeile__sub', text: sz.verfuegbar
            ? ('Ortszeit dort: ' + (sz.serverZeit || '–') + ' · Zeitzone ' + (sz.zeitzone || '–') +
               ' · ' + sz.abos + ' Gerät(e) für Benachrichtigungen angemeldet' +
               (sz.letzterAbgleich ? ' · zuletzt abgeglichen ' + zeitstempelText(sz.letzterAbgleich) : ''))
            : 'Die App läuft rein lokal. Für Abgleich und Benachrichtigungen den Server starten und die Seite von dort aufrufen.' })
        ]),
        mach('div', { klasse: 'knopfreihe' }, [
          mach('button', {
            klasse: 'knopf knopf--klein', type: 'button',
            auf: {
              click: () => Api.pruefen().then((da) => {
                Meldung.zeig(da ? 'Server gefunden.' : 'Kein Server erreichbar.', { art: da ? 'gut' : 'warn' });
                if (da) Api.abgleichen(false);
                zeichneAlles();
              })
            }
          }, [ikone('i-neu'), 'Erneut suchen']),
          sz.verfuegbar ? mach('button', {
            klasse: 'knopf knopf--klein', type: 'button',
            auf: { click: () => { Api.abgleichen(false); Api.fotosAbgleichen(); } }
          }, [ikone('i-wolke'), 'Jetzt abgleichen']) : null,
          sz.verfuegbar ? mach('button', {
            klasse: 'knopf knopf--klein', type: 'button', auf: { click: serverStatusDialog }
          }, [ikone('i-info'), 'Serverstatus']) : null
        ])
      ]),

      zeileSchalter('Automatisch abgleichen',
        'Häkchen, Notizen und Fotos gehen ohne Zutun auf alle Geräte. Ohne das musst du wieder Codes hin- und herkopieren.',
        Store.einst('serverSync') !== false,
        (w) => { Store.setzeEinst('serverSync', w); if (w) Api.abgleichen(false); zeichneAlles(); }),

      mach('div', { klasse: 'zeile zeile--spalte' }, [
        mach('div', { klasse: 'zeile__text' }, [
          mach('div', { klasse: 'zeile__titel', text: 'Benachrichtigungen aufs Gerät' }),
          mach('div', { klasse: 'zeile__sub', text: hindernis
            ? hindernis
            : 'Kommen auch an, wenn die App geschlossen ist – der Server schickt sie zu den Zeiten los.' })
        ]),
        mach('div', { klasse: 'knopfreihe' }, [
          mach('button', {
            klasse: 'knopf knopf--haupt knopf--klein', type: 'button',
            disabled: !!hindernis,
            auf: {
              click: (ev) => {
                const knopf = ev.currentTarget;
                knopf.disabled = true;
                Api.pushAnmelden()
                  .then(() => {
                    Meldung.zeig('Benachrichtigungen sind eingeschaltet.', { art: 'gut' });
                    Store.setzeEinst('push', true);
                    Klang.erfolg();
                    zeichneEinstellungen();
                  })
                  .catch((fehler) => {
                    knopf.disabled = false;
                    Meldung.zeig(fehler.message, { art: 'fehler', dauer: 6500 });
                  });
              }
            }
          }, [ikone('i-glocke'), 'Einschalten']),
          mach('button', {
            klasse: 'knopf knopf--klein', type: 'button',
            disabled: !sz.verfuegbar,
            auf: {
              click: () => Api.pushProbe()
                .then((a) => Meldung.zeig(a.ok
                  ? 'Probe verschickt an ' + a.ok + ' Gerät(e).'
                  : 'Kein Gerät angemeldet – erst „Einschalten" drücken.', { art: a.ok ? 'gut' : 'warn' }))
                .catch((f) => Meldung.zeig(f.message, { art: 'fehler' }))
            }
          }, [ikone('i-glocke'), 'Probe schicken']),
          mach('button', {
            klasse: 'knopf knopf--klein', type: 'button',
            auf: {
              click: () => Api.pushAbmelden().then(() => {
                Store.setzeEinst('push', false);
                Meldung.zeig('Dieses Gerät bekommt keine Benachrichtigungen mehr.', { art: 'info' });
                zeichneEinstellungen();
              })
            }
          }, [ikone('i-x'), 'Ausschalten'])
        ]),
        Api.istIos() && !Api.alsAppGestartet()
          ? mach('div', { klasse: 'zeile__sub' }, [
              mach('strong', { text: 'iPhone: ' }),
              'Benachrichtigungen gehen erst, wenn du die Seite in Safari über Teilen → „Zum Home-Bildschirm" gespeichert und von dort geöffnet hast.'
            ])
          : null
      ]),

      zeileSpalte('Zugangsschlüssel',
        'Nur nötig, wenn beim Server ZUGANG gesetzt ist. Sonst leer lassen.',
        textFeld(Store.einst('zugangsschluessel'), 'leer lassen', (w) => Store.setzeEinstLeise('zugangsschluessel', w)))
    ];

    ziel.appendChild(gruppe('Eigener Server', 'i-wolke', serverZeilen));

    /* --- Daten und Sync --- */
    ziel.appendChild(gruppe('Daten & Sync', 'i-teilen', [
      mach('div', { klasse: 'zeile zeile--spalte' }, [
        mach('div', { klasse: 'zeile__text' }, [
          mach('div', { klasse: 'zeile__titel', text: 'Stand auf ein anderes Gerät übertragen' }),
          mach('div', { klasse: 'zeile__sub', text: 'Die Seite hat bewusst keinen Server – deshalb läuft der Abgleich über einen Code oder eine Datei. Code hier erzeugen, auf dem anderen Gerät unter „Code einlesen“ einfügen.' })
        ]),
        mach('div', { klasse: 'knopfreihe' }, [
          mach('button', { klasse: 'knopf knopf--haupt', type: 'button', auf: { click: () => codeDialog('kurz') } },
            [ikone('i-teilen'), 'Kurz-Code (nur Häkchen)']),
          mach('button', { klasse: 'knopf', type: 'button', auf: { click: () => codeDialog('voll') } },
            [ikone('i-teilen'), 'Voll-Code (mit Notizen)']),
          mach('button', { klasse: 'knopf', type: 'button', auf: { click: importDialog } },
            [ikone('i-upload'), 'Code einlesen'])
        ])
      ]),

      mach('div', { klasse: 'zeile zeile--spalte' }, [
        mach('div', { klasse: 'zeile__text' }, [
          mach('div', { klasse: 'zeile__titel', text: 'Sicherungsdatei' }),
          mach('div', { klasse: 'zeile__sub', text: 'Vollständige Sicherung als Datei – der zuverlässigste Weg, auch für Notizen.' })
        ]),
        mach('div', { klasse: 'knopfreihe' }, [
          mach('button', { klasse: 'knopf', type: 'button', auf: { click: backupSpeichern } },
            [ikone('i-download'), 'Sicherung herunterladen']),
          mach('button', { klasse: 'knopf', type: 'button', auf: { click: backupLaden } },
            [ikone('i-upload'), 'Sicherung laden']),
          mach('button', { klasse: 'knopf', type: 'button', auf: { click: () => window.print() } },
            [ikone('i-drucker'), 'Drucken'])
        ])
      ]),

      mach('div', { klasse: 'zeile zeile--spalte' }, [
        mach('div', { klasse: 'zeile__text' }, [
          mach('div', { klasse: 'zeile__titel', text: 'Weitergeben' }),
          mach('div', { klasse: 'zeile__sub', text: 'Bericht zum Verschicken, oder alle Aufgaben als Termine für den Kalender.' })
        ]),
        mach('div', { klasse: 'knopfreihe' }, [
          mach('button', { klasse: 'knopf', type: 'button', auf: { click: tagesberichtDialog } },
            [ikone('i-liste'), 'Bericht erstellen']),
          mach('button', { klasse: 'knopf', type: 'button', auf: { click: kalenderExport } },
            [ikone('i-calendar'), 'Kalenderdatei (.ics)']),
          mach('button', { klasse: 'knopf', type: 'button', auf: { click: notizenExportieren } },
            [ikone('i-note'), 'Notizen als Text'])
        ])
      ])
    ]));

    /* --- Zurücksetzen --- */
    ziel.appendChild(gruppe('Zurücksetzen', 'i-neu', [
      mach('div', { klasse: 'zeile zeile--spalte' }, [
        mach('div', { klasse: 'zeile__text' }, [
          mach('div', { klasse: 'zeile__titel', text: 'Achtung – nicht umkehrbar' }),
          mach('div', { klasse: 'zeile__sub', text: 'Am besten vorher eine Sicherung herunterladen.' })
        ]),
        mach('div', { klasse: 'knopfreihe' }, [
          mach('button', {
            klasse: 'knopf knopf--gefahr', type: 'button',
            auf: {
              click: () => Dialog.frage('Fortschritt zurücksetzen?',
                'Alle Häkchen und Erfolge werden gelöscht. Notizen und Einstellungen bleiben erhalten.',
                'Häkchen löschen', () => {
                  Store.fortschrittZuruecksetzen();
                  Meldung.zeig('Alle Häkchen wurden zurückgesetzt.', { art: 'info' });
                  zeichneAlles();
                }, true)
            }
          }, [ikone('i-neu'), 'Nur Häkchen zurücksetzen']),

          mach('button', {
            klasse: 'knopf knopf--gefahr', type: 'button',
            auf: {
              click: () => Dialog.frage('Wirklich alles löschen?',
                'Häkchen, Notizen, Erfolge und Einstellungen werden vollständig gelöscht. Das lässt sich nicht rückgängig machen.',
                'Alles löschen', () => {
                  Store.allesZuruecksetzen();
                  themeAnwenden();
                  Meldung.zeig('Alles zurückgesetzt.', { art: 'info' });
                  zeichneAlles();
                }, true)
            }
          }, [ikone('i-trash'), 'Alles löschen'])
        ])
      ])
    ]));

    /* --- Info --- */
    const infoListe = mach('ul', { klasse: 'info-liste' });
    [
      'Alle Daten bleiben auf diesem Gerät (localStorage). Nichts wird ins Internet geschickt.',
      'Speicher ' + (Store.speicherOk() ? 'funktioniert' : 'ist blockiert – im privaten Modus geht der Fortschritt beim Schließen verloren!'),
      'Die Seite funktioniert offline, sobald sie einmal geladen wurde.',
      'Vorlage: ' + APP_INFO.quelle,
      'Version ' + APP_INFO.version
    ].forEach((t) => infoListe.appendChild(mach('li', { text: t })));

    const installZeile = mach('div', { klasse: 'zeile zeile--spalte' }, [
      mach('div', { klasse: 'zeile__text' }, [
        mach('div', { klasse: 'zeile__titel', text: 'Als App speichern' }),
        mach('div', { klasse: 'zeile__sub' }, [
          mach('strong', { text: 'iPhone: ' }),
          'in Safari öffnen, unten auf „Teilen“ tippen, dann „Zum Home-Bildschirm“. ',
          mach('strong', { text: 'Windows/Chrome: ' }),
          'rechts in der Adressleiste auf das Installieren-Symbol klicken.'
        ])
      ])
    ]);
    if (installEreignis) {
      installZeile.appendChild(mach('div', { klasse: 'knopfreihe' }, [
        mach('button', {
          klasse: 'knopf knopf--haupt', type: 'button',
          auf: {
            click: () => {
              installEreignis.prompt();
              installEreignis.userChoice.finally(() => { installEreignis = null; zeichneEinstellungen(); });
            }
          }
        }, [ikone('i-handy'), 'Jetzt installieren'])
      ]));
    }

    ziel.appendChild(gruppe('Info', 'i-info', [
      installZeile,
      mach('div', { klasse: 'zeile zeile--spalte' }, [
        mach('div', { klasse: 'zeile__text' }, [
          mach('div', { klasse: 'zeile__titel', text: 'Gut zu wissen' })
        ]),
        infoListe
      ]),
      mach('div', { klasse: 'zeile' }, [
        mach('div', { klasse: 'zeile__text' }, [
          mach('div', { klasse: 'zeile__titel', text: 'Tastenkürzel' }),
          mach('div', { klasse: 'zeile__sub', text: 'Nützlich am Desktop.' })
        ]),
        mach('div', { klasse: 'zeile__steuer' }, [
          mach('button', { klasse: 'knopf knopf--klein', type: 'button', auf: { click: tastenDialog } },
            [ikone('i-tastatur'), 'Anzeigen'])
        ])
      ])
    ]));
  }

  /* --- Bausteine für die Einstellungsseite --- */
  function gruppe(titel, icon, zeilen) {
    const block = mach('div', { klasse: 'block' }, [
      mach('h2', { klasse: 'block__titel' }, [ikone(icon), titel])
    ]);
    const kasten = mach('div', { klasse: 'gruppe' });
    zeilen.filter(Boolean).forEach((z) => kasten.appendChild(z));
    block.appendChild(kasten);
    return block;
  }

  function zeileSchalter(titel, sub, wert, beiAenderung) {
    const eingabe = mach('input', {
      type: 'checkbox',
      auf: { change: (ev) => beiAenderung(ev.target.checked) }
    });
    eingabe.checked = !!wert;
    return mach('div', { klasse: 'zeile' }, [
      mach('div', { klasse: 'zeile__text' }, [
        mach('div', { klasse: 'zeile__titel', text: titel }),
        sub ? mach('div', { klasse: 'zeile__sub', text: sub }) : null
      ]),
      mach('label', { klasse: 'schalter zeile__steuer' }, [
        eingabe, mach('span', { klasse: 'schalter__spur' })
      ])
    ]);
  }

  function zeileUmbruch(titel, sub, steuer) {
    return mach('div', { klasse: 'zeile zeile--umbruch' }, [
      mach('div', { klasse: 'zeile__text' }, [
        mach('div', { klasse: 'zeile__titel', text: titel }),
        sub ? mach('div', { klasse: 'zeile__sub', text: sub }) : null
      ]),
      mach('div', { klasse: 'zeile__steuer' }, [steuer])
    ]);
  }

  function zeileSpalte(titel, sub, steuer) {
    return mach('div', { klasse: 'zeile zeile--spalte' }, [
      mach('div', { klasse: 'zeile__text' }, [
        mach('div', { klasse: 'zeile__titel', text: titel }),
        sub ? mach('div', { klasse: 'zeile__sub', text: sub }) : null
      ]),
      steuer
    ]);
  }

  function segment(optionen, aktuell, beiWahl) {
    const box = mach('div', { klasse: 'segment', role: 'group' });
    optionen.forEach((o) => {
      const knopf = mach('button', {
        type: 'button',
        'aria-pressed': o.wert === aktuell ? 'true' : 'false',
        auf: {
          click: () => {
            box.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', 'false'));
            knopf.setAttribute('aria-pressed', 'true');
            beiWahl(o.wert);
          }
        }
      }, [o.icon ? ikone(o.icon) : null, o.text]);
      box.appendChild(knopf);
    });
    return box;
  }

  function farbwahl(aktuell, beiWahl) {
    const box = mach('div', { klasse: 'farbwahl', role: 'group', 'aria-label': 'Akzentfarbe' });
    Object.keys(AKZENTE).forEach((schluessel) => {
      const a = AKZENTE[schluessel];
      const knopf = mach('button', {
        type: 'button', title: a.label, 'aria-label': a.label,
        'aria-pressed': schluessel === aktuell ? 'true' : 'false',
        stil: { '--c': a.farbe },
        auf: {
          click: () => {
            box.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', 'false'));
            knopf.setAttribute('aria-pressed', 'true');
            beiWahl(schluessel);
          }
        }
      });
      box.appendChild(knopf);
    });
    return box;
  }

  function textFeld(wert, platzhalter, beiAenderung) {
    const feld = mach('input', {
      klasse: 'feld', type: 'text', placeholder: platzhalter,
      maxlength: '40',
      auf: { input: (ev) => beiAenderung(ev.target.value) }
    });
    feld.value = wert || '';
    return feld;
  }

  /* ==========================================================================
     Sync-Dialoge
     ========================================================================== */
  function codeDialog(art) {
    const code = art === 'kurz' ? Store.kurzCode() : Store.vollCode();
    const inhalt = mach('div', { stil: { display: 'flex', 'flex-direction': 'column', gap: '13px' } }, [
      mach('p', {
        stil: { 'line-height': '1.6', color: 'var(--text-leise)' },
        text: art === 'kurz'
          ? 'Dieser kurze Code enthält nur die Häkchen – kompakt und schnell zu übertragen. Auf dem anderen Gerät unter „Code einlesen“ einfügen.'
          : 'Dieser Code enthält Häkchen, Notizen und Erfolge. Er ist länger – am besten kopieren und per Nachricht an dich selbst schicken.'
      }),
      mach('div', { klasse: 'codefeld', text: code }),
      mach('div', { klasse: 'knopfreihe' }, [
        mach('button', {
          klasse: 'knopf knopf--haupt', type: 'button',
          auf: { click: () => inZwischenablage(code, 'Code kopiert.') }
        }, [ikone('i-kopieren'), 'Kopieren']),
        navigator.share ? mach('button', {
          klasse: 'knopf', type: 'button',
          auf: { click: () => navigator.share({ title: 'Aufgabenliste – Sync-Code', text: code }).catch(() => {}) }
        }, [ikone('i-teilen'), 'Teilen']) : null,
        mach('button', {
          klasse: 'knopf', type: 'button',
          auf: { click: () => dateiSpeichern(code, 'Sync-Code-' + heuteIso() + '.txt', 'text/plain;charset=utf-8') }
        }, [ikone('i-download'), 'Als Datei'])
      ]),
      mach('p', { stil: { 'font-size': '.83rem', color: 'var(--text-sehr-leise)' },
        text: 'Länge: ' + code.length + ' Zeichen' })
    ]);

    Dialog.zeig({
      titel: art === 'kurz' ? 'Kurz-Code' : 'Voll-Code',
      inhalt,
      knoepfe: [{ text: 'Fertig', art: 'haupt' }]
    });
  }

  function importDialog() {
    const feld = mach('textarea', {
      klasse: 'feld', rows: '5',
      placeholder: 'Code hier einfügen (beginnt mit BT1- oder BT2-) …',
      'aria-label': 'Sync-Code'
    });

    let modus = 'zusammen';
    const wahl = segment([
      { wert: 'zusammen', text: 'Zusammenführen' },
      { wert: 'ersetzen', text: 'Ersetzen' }
    ], modus, (w) => { modus = w; });

    const inhalt = mach('div', { stil: { display: 'flex', 'flex-direction': 'column', gap: '13px' } }, [
      mach('p', { stil: { 'line-height': '1.6', color: 'var(--text-leise)' },
        text: 'Den Code vom anderen Gerät hier einfügen.' }),
      feld,
      mach('div', {}, [
        mach('div', { klasse: 'zeile__titel', stil: { 'margin-bottom': '7px' }, text: 'Wie zusammenbringen?' }),
        wahl,
        mach('p', { klasse: 'zeile__sub', stil: { 'margin-top': '8px' },
          text: 'Zusammenführen behält alles, was auf einem der beiden Geräte abgehakt ist (empfohlen). Ersetzen übernimmt genau den Stand aus dem Code.' })
      ])
    ]);

    Dialog.zeig({
      titel: 'Code einlesen',
      inhalt,
      knoepfe: [
        { text: 'Abbrechen' },
        {
          text: 'Übernehmen', art: 'haupt',
          fn: () => {
            try {
              const bericht = Store.importieren(feld.value, modus);
              const teile = [];
              if (bericht.gesetzt) teile.push(bericht.gesetzt + ' Häkchen dazu');
              if (bericht.entfernt) teile.push(bericht.entfernt + ' entfernt');
              if (bericht.notizen) teile.push(bericht.notizen + ' Notizen aktualisiert');
              Meldung.zeig(teile.length ? 'Übernommen: ' + teile.join(', ') + '.' : 'Alles war schon auf demselben Stand.',
                { art: 'gut', dauer: 4200 });
              Klang.erfolg();
              themeAnwenden();
              zeichneAlles();
            } catch (fehler) {
              Meldung.zeig(fehler.message, { art: 'fehler', dauer: 5200 });
              Klang.fehler();
              return false;   // Dialog offen lassen
            }
          }
        }
      ]
    });
  }

  function backupSpeichern() {
    const name = 'Aufgabenliste-Sicherung-' + heuteIso() + '.json';
    dateiSpeichern(Store.exportJson(), name, 'application/json');
    Meldung.zeig('Sicherung heruntergeladen.', { art: 'gut' });
  }

  function backupLaden() {
    const eingabe = mach('input', { type: 'file', accept: '.json,application/json,.txt,text/plain' });
    eingabe.addEventListener('change', () => {
      const datei = eingabe.files && eingabe.files[0];
      if (!datei) return;
      const leser = new FileReader();
      leser.onload = () => {
        try {
          const bericht = Store.importieren(String(leser.result), 'zusammen');
          Meldung.zeig('Sicherung geladen: ' + bericht.gesetzt + ' Häkchen, ' + bericht.notizen + ' Notizen.',
            { art: 'gut', dauer: 4200 });
          Klang.erfolg();
          themeAnwenden();
          zeichneAlles();
        } catch (fehler) {
          Meldung.zeig(fehler.message, { art: 'fehler', dauer: 5200 });
          Klang.fehler();
        }
      };
      leser.onerror = () => Meldung.zeig('Die Datei konnte nicht gelesen werden.', { art: 'fehler' });
      leser.readAsText(datei);
    });
    eingabe.click();
  }

  function tastenDialog() {
    const tasten = [
      ['←  →', 'Einen Tag zurück oder vor'],
      ['H', 'Zur heutigen Tagesansicht'],
      ['Ü', 'Übersicht (Raster)'],
      ['N', 'Notizen'],
      ['S', 'Statistik'],
      ['E', 'Einstellungen'],
      ['T', 'Telefonnummern für Notfälle'],
      ['1 – 9, 0', 'Aufgabe 1 bis 10 des angezeigten Tages abhaken'],
      ['A', 'Alle Aufgaben des Tages abhaken'],
      ['Z', 'Letztes Häkchen rückgängig'],
      ['P', 'Drucken'],
      ['?', 'Diese Übersicht']
    ];
    const liste = mach('div', { stil: { display: 'flex', 'flex-direction': 'column', gap: '9px' } });
    tasten.forEach(([taste, was]) => {
      liste.appendChild(mach('div', { stil: { display: 'flex', gap: '14px', 'align-items': 'center' } }, [
        mach('span', { klasse: 'kbd', text: taste }),
        mach('span', { stil: { 'font-size': '.92rem' }, text: was })
      ]));
    });
    Dialog.zeig({ titel: 'Tastenkürzel', inhalt: liste, knoepfe: [{ text: 'Schließen', art: 'haupt' }] });
  }

  /* --- Blick in den Maschinenraum des Servers ----------------------------- */
  function serverStatusDialog() {
    const inhalt = mach('div', { stil: { display: 'flex', 'flex-direction': 'column', gap: '13px' } }, [
      mach('p', { klasse: 'zeile__sub', text: 'Wird geladen …' })
    ]);
    const dlg = Dialog.zeig({ titel: 'Serverstatus', inhalt, knoepfe: [{ text: 'Schließen', art: 'haupt' }] });

    Api.status().then((s) => {
      leeren(inhalt);
      const zeile = (name, wert) => mach('div', { stil: { display: 'flex', gap: '12px', 'justify-content': 'space-between' } }, [
        mach('span', { klasse: 'zeile__sub', text: name }),
        mach('strong', { stil: { 'font-size': '.9rem' }, text: String(wert) })
      ]);
      inhalt.appendChild(mach('div', { klasse: 'gruppe' }, [
        mach('div', { klasse: 'zeile zeile--spalte' }, [
          zeile('Fassung', s.version),
          zeile('Ortszeit am Server', s.ortszeit),
          zeile('Zeitzone', s.zeitzone),
          zeile('Häkchen gespeichert', s.haekchen),
          zeile('Notizen', s.notizen),
          zeile('Fotos', s.fotos)
        ])
      ]));

      inhalt.appendChild(mach('h3', { klasse: 'block__titel' }, [ikone('i-handy'), 'Angemeldete Geräte']));
      if (!s.abos.length) inhalt.appendChild(mach('p', { klasse: 'zeile__sub', text: 'Noch keines. Oben auf „Einschalten" tippen.' }));
      s.abos.forEach((a) => inhalt.appendChild(mach('div', { klasse: 'zeile__sub', text: '• ' + a.geraet + ' (' + a.dienst + ') seit ' + a.seit })));

      inhalt.appendChild(mach('h3', { klasse: 'block__titel' }, [ikone('i-uhr'), 'Heute geplant']));
      if (!s.heuteGeplant.length) inhalt.appendChild(mach('p', { klasse: 'zeile__sub', text: 'Für heute steht nichts im Plan.' }));
      s.heuteGeplant.forEach((e) => {
        inhalt.appendChild(mach('div', { klasse: 'zeile__sub' }, [
          mach('span', { klasse: 'kbd', text: e.zeit }), ' ' + e.titel + ' ',
          e.erledigt ? mach('span', { klasse: 'marke marke--leise', text: 'erledigt' })
            : e.verschickt ? mach('span', { klasse: 'marke marke--leise', text: 'verschickt' })
            : mach('span', { klasse: 'marke', text: 'offen' })
        ]));
      });
    }).catch((f) => {
      leeren(inhalt);
      inhalt.appendChild(mach('p', { klasse: 'zeile__sub', text: 'Nicht erreichbar: ' + f.message }));
    });
    return dlg;
  }

  /* --- Eigene Erinnerungszeiten ------------------------------------------- */
  function zeitenDialog() {
    const liste = mach('div', { stil: { display: 'flex', 'flex-direction': 'column', gap: '4px' } });
    const eigene = Object.assign({}, Store.einst('erinnerungsZeiten') || {});

    alleAufgabenArten().filter((a) => a.erinnerung).forEach((a) => {
      const feld = mach('input', {
        klasse: 'feld', type: 'time',
        stil: { width: '132px' },
        value: minutenZuUhr(erinnerungsZeit(a)),
        'aria-label': 'Uhrzeit für ' + a.titel
      });
      feld.addEventListener('change', () => {
        const teile = feld.value.split(':');
        const min = Number(teile[0]) * 60 + Number(teile[1]);
        if (isFinite(min)) eigene[a.id] = min;
      });

      liste.appendChild(mach('div', {
        klasse: 'zeile',
        stil: { '--f': 'var(--' + a.farbe + ')', '--f-weich': 'var(--' + a.farbe + '-weich)', padding: '9px 0', 'border-bottom': '1px solid var(--rand)' }
      }, [
        mach('span', { klasse: 'aufgabenstat__icon' }, [ikone(a.icon)]),
        mach('div', { klasse: 'zeile__text' }, [
          mach('div', { klasse: 'zeile__titel', text: a.kurz }),
          mach('div', { klasse: 'zeile__sub', text: a.nurAm ? 'nur am ' + datumKurz(a.nurAm) : 'jeden Tag' })
        ]),
        feld
      ]));
    });

    Dialog.zeig({
      titel: 'Erinnerungszeiten',
      inhalt: mach('div', {}, [
        mach('p', { klasse: 'zeile__sub', stil: { 'margin-bottom': '10px' },
          text: 'Gilt für Browser-Erinnerungen und für die Benachrichtigungen vom Server.' }),
        liste
      ]),
      knoepfe: [
        { text: 'Abbrechen' },
        {
          text: 'Auf Vorgabe zurück',
          fn: () => {
            Store.setzeEinst('erinnerungsZeiten', {});
            Api.planHochladen();
            Meldung.zeig('Zeiten auf die Vorgabe zurückgesetzt.', { art: 'info' });
            zeichneEinstellungen();
          }
        },
        {
          text: 'Übernehmen', art: 'haupt',
          fn: () => {
            Store.setzeEinst('erinnerungsZeiten', eigene);
            Api.planHochladen().then((ok) => {
              Meldung.zeig(ok ? 'Zeiten gespeichert und an den Server geschickt.' : 'Zeiten gespeichert.', { art: 'gut' });
            });
            zeichneEinstellungen();
          }
        }
      ]
    });
  }

  /* --- Termine als Kalenderdatei ------------------------------------------ */
  function kalenderExport() {
    const zeilen = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Aufgabenliste Basti//DE', 'CALSCALE:GREGORIAN'];
    const stempel = (iso, minuten) => {
      const d = isoZuDatum(iso);
      d.setMinutes(minuten);
      return d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') +
        'T' + String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0') + '00';
    };
    let n = 0;
    TAGE.forEach((iso) => {
      aufgabenFuerTag(iso).forEach((a) => {
        if (a.ankerZeit === null) return;
        n++;
        zeilen.push(
          'BEGIN:VEVENT',
          'UID:basti-' + iso + '-' + a.id + '@aufgabenliste',
          'DTSTAMP:' + stempel(TAGE[0], 0) + 'Z',
          'DTSTART;TZID=Europe/Vienna:' + stempel(iso, a.ankerZeit),
          'DTEND;TZID=Europe/Vienna:' + stempel(iso, a.ankerZeit + 30),
          'SUMMARY:' + a.titel.replace(/[,;\\]/g, ' '),
          'DESCRIPTION:' + a.text.replace(/[,;\\]/g, ' '),
          a.erinnerung ? 'BEGIN:VALARM\nTRIGGER:-PT5M\nACTION:DISPLAY\nDESCRIPTION:' + a.titel + '\nEND:VALARM' : null,
          'END:VEVENT'
        );
      });
    });
    zeilen.push('END:VCALENDAR');
    dateiSpeichern(zeilen.filter(Boolean).join('\r\n'), 'Aufgabenliste-August-2026.ics', 'text/calendar;charset=utf-8');
    Meldung.zeig(n + ' Termine als Kalenderdatei gesichert.', { art: 'gut' });
  }

  /* --- Tagesbericht als Text ---------------------------------------------- */
  function tagesberichtDialog() {
    const z = Store.zahlen();
    const zeilen = ['Aufgabenliste 15.–26. August 2026', 'Stand: ' + new Date().toLocaleString('de-AT'), ''];
    zeilen.push('Gesamt: ' + z.erledigtGesamt + ' von ' + z.gesamt + ' erledigt (' + z.prozent + ' %)');
    zeilen.push('Komplette Tage: ' + z.tageKomplett + ' von ' + TAGE.length);
    zeilen.push('');
    TAGE.forEach((iso) => {
      const t = z.proTag[iso];
      zeilen.push(wochentagKurz(iso) + ' ' + datumKurz(iso) + '  ' + t.erledigt + '/' + t.gesamt + (t.komplett ? '  ✓ komplett' : ''));
      const offen = aufgabenFuerTag(iso).filter((a) => !Store.istErledigt(iso, a.id));
      if (offen.length && offen.length < t.gesamt) zeilen.push('    offen: ' + offen.map((a) => a.titel).join(', '));
      const notiz = Store.notiz(iso);
      if (notiz.trim()) zeilen.push('    Notiz: ' + notiz.replace(/\n/g, ' / '));
      const fotos = Fotos.liste(iso).length;
      if (fotos) zeilen.push('    ' + fotos + ' Foto(s)');
    });
    const text = zeilen.join('\n');

    Dialog.zeig({
      titel: 'Bericht',
      inhalt: mach('div', {}, [
        mach('div', { klasse: 'codefeld', stil: { 'max-height': '300px', 'white-space': 'pre-wrap', 'word-break': 'normal' }, text })
      ]),
      knoepfe: [
        { text: 'Kopieren', fn: () => { inZwischenablage(text, 'Bericht kopiert.'); return false; }, schliesst: false },
        { text: 'Als Datei', fn: () => { dateiSpeichern(text, 'Bericht-August-2026.txt', 'text/plain;charset=utf-8'); return false; }, schliesst: false },
        { text: 'Schließen', art: 'haupt' }
      ]
    });
  }

  /* ==========================================================================
     Datei- und Zwischenablage-Helfer
     ========================================================================== */
  function dateiSpeichern(inhalt, dateiname, typ) {
    try {
      const blob = new Blob([inhalt], { type: typ || 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = mach('a', { href: url, download: dateiname });
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
    } catch (e) {
      Meldung.zeig('Herunterladen hat nicht geklappt. Bitte den Code von Hand kopieren.', { art: 'fehler' });
    }
  }

  function inZwischenablage(text, erfolgsText) {
    const fallback = () => {
      const feld = mach('textarea', { stil: { position: 'fixed', top: '-1000px', opacity: '0' } });
      feld.value = text;
      document.body.appendChild(feld);
      feld.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      feld.remove();
      Meldung.zeig(ok ? erfolgsText : 'Kopieren hat nicht geklappt – bitte von Hand markieren.',
        { art: ok ? 'gut' : 'warn' });
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => Meldung.zeig(erfolgsText, { art: 'gut' }))
        .catch(fallback);
    } else fallback();
  }

  /* ==========================================================================
     Zeichnen
     ========================================================================== */
  function zeichneAlles() {
    themeAnwenden();
    zeichneKopf();
    zeichneReiter();

    ANSICHTEN.forEach((a) => {
      const el = knoten[a.id];
      if (el) el.hidden = a.id !== ansicht;
    });

    if (ansicht === 'heute') zeichneHeute();
    else if (ansicht === 'raster') zeichneRaster();
    else if (ansicht === 'notizen') zeichneNotizen();
    else if (ansicht === 'statistik') zeichneStatistik();
    else if (ansicht === 'notfall') zeichneNotfall();
    else if (ansicht === 'einstellungen') zeichneEinstellungen();

    symbolZaehlerSetzen();
  }

  /* --- Zahl auf dem App-Symbol (nur installierte Apps zeigen sie an) ------- */
  function symbolZaehlerSetzen() {
    if (!navigator.setAppBadge) return;
    try {
      if (Store.einst('symbolzaehler') === false) { navigator.clearAppBadge(); return; }
      const heute = startTag();
      const t = Store.tagZahlen(heute);
      const offen = t.gesamt - t.erledigt;
      if (offen > 0 && heuteImZeitraum()) navigator.setAppBadge(offen);
      else navigator.clearAppBadge();
    } catch (e) { /* nicht überall erlaubt */ }
  }

  /* ==========================================================================
     Tastatur
     ========================================================================== */
  function tastatur(ev) {
    if (Dialog.istOffen()) return;
    const ziel = ev.target;
    if (ziel && (ziel.tagName === 'INPUT' || ziel.tagName === 'TEXTAREA' || ziel.isContentEditable)) return;
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;

    const taste = ev.key;
    const index = TAGE.indexOf(tag);

    if (taste === 'ArrowLeft' && index > 0) { geheZu('heute', TAGE[index - 1]); ev.preventDefault(); return; }
    if (taste === 'ArrowRight' && index < TAGE.length - 1) { geheZu('heute', TAGE[index + 1]); ev.preventDefault(); return; }

    const klein = taste.toLowerCase();
    if (klein === 'h') { geheZu('heute', startTag()); return; }
    if (klein === 'ü' || klein === 'u') { geheZu('raster'); return; }
    if (klein === 'n') { geheZu('notizen'); return; }
    if (klein === 's') { geheZu('statistik'); return; }
    if (klein === 'e') { geheZu('einstellungen'); return; }
    if (klein === 't') { geheZu('notfall'); return; }
    if (klein === 'p') { window.print(); ev.preventDefault(); return; }
    if (klein === 'z') { rueckgaengig(); return; }
    if (taste === '?') { tastenDialog(); ev.preventDefault(); return; }

    if (klein === 'a' && ansicht === 'heute') {
      const t = Store.tagZahlen(tag);
      if (darfHaken(tag)) tagUmschalten(tag, !t.komplett);
      return;
    }

    if (/^[0-9]$/.test(taste) && ansicht === 'heute') {
      const nummer = taste === '0' ? 10 : Number(taste);
      const aufgaben = aufgabenFuerTag(tag);
      const a = aufgaben[nummer - 1];
      if (a) {
        const karte = knoten.heute.querySelector('.aufgabe[data-aufgabe="' + a.id + '"]');
        hakenUmschalten(tag, a, karte, null);
        ev.preventDefault();
      }
    }
  }

  /* ==========================================================================
     Wischen zwischen den Tagen
     ========================================================================== */
  function wischen() {
    let startX = 0, startY = 0, startZeit = 0, aktiv = false;
    const flaeche = knoten.heute;

    flaeche.addEventListener('touchstart', (ev) => {
      if (ev.touches.length !== 1) { aktiv = false; return; }
      startX = ev.touches[0].clientX;
      startY = ev.touches[0].clientY;
      startZeit = Date.now();
      aktiv = true;
    }, { passive: true });

    flaeche.addEventListener('touchend', (ev) => {
      if (!aktiv) return;
      aktiv = false;
      const t = ev.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const dauer = Date.now() - startZeit;
      if (dauer > 700) return;
      if (Math.abs(dx) < 70 || Math.abs(dy) > 55) return;

      const index = TAGE.indexOf(tag);
      if (dx < 0 && index < TAGE.length - 1) geheZu('heute', TAGE[index + 1]);
      else if (dx > 0 && index > 0) geheZu('heute', TAGE[index - 1]);
    }, { passive: true });
  }

  /* ==========================================================================
     Start
     ========================================================================== */
  function start() {
    knoten.fussVersion.textContent = 'Version ' + APP_INFO.version;

    // Startansicht und Starttag festlegen
    ansicht = ANSICHTEN.some((a) => a.id === Store.einst('startAnsicht')) ? Store.einst('startAnsicht') : 'heute';
    const gemerkt = Store.einst('letzterTag');
    tag = (Store.einst('aufHeuteSpringen') === false && TAGE.indexOf(gemerkt) >= 0) ? gemerkt : startTag();
    routeLesen();
    routeSchreiben(true);

    zeichneAlles();
    wischen();

    /* Roter Notfallknopf – auf jeder Seite erreichbar */
    if (knoten.notrufKnopf) {
      knoten.notrufKnopf.addEventListener('click', () => {
        geheZu(ansicht === 'notfall' ? 'heute' : 'notfall');
      });
    }

    /* Verbindung zum eigenen Server aufbauen und laufend abgleichen */
    Api.starten();
    Bus.an('serverZustand', () => { zeichneKopf(); });
    Bus.an('serverAenderung', () => {
      if (ansicht === 'heute' || ansicht === 'raster' || ansicht === 'statistik') zeichneAlles();
      else zeichneKopf();
      symbolZaehlerSetzen();
    });
    Bus.an('fotoFehler', () => {
      Meldung.zeig('Der Speicher des Browsers ist voll. Bitte ein paar Fotos löschen.', { art: 'fehler', dauer: 6000 });
    });

    /* Nachrichten vom Service Worker (z. B. nach Tippen auf eine Benachrichtigung) */
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (ereignis) => {
        const d = ereignis.data || {};
        if (d.art === 'push-geoeffnet') {
          if (d.tag && TAGE.indexOf(d.tag) >= 0) geheZu('heute', d.tag);
          Api.abgleichen(true);
        }
      });
    }

    window.addEventListener('hashchange', () => { routeLesen(); zeichneAlles(); });
    document.addEventListener('keydown', tastatur);

    // Erste Berührung schaltet die Tonausgabe frei (iOS-Regel)
    const wecker = () => { Klang.aufwecken(); document.removeEventListener('pointerdown', wecker); };
    document.addEventListener('pointerdown', wecker, { once: true });

    // Tageswechsel um Mitternacht mitbekommen
    let bekanntesDatum = heuteIso();
    setInterval(() => {
      if (heuteIso() !== bekanntesDatum) {
        bekanntesDatum = heuteIso();
        if (Store.einst('aufHeuteSpringen') !== false) tag = startTag();
        zeichneAlles();
        Meldung.zeig('Neuer Tag – die Liste steht wieder auf Anfang.', { art: 'info', dauer: 4200 });
      }
    }, 30000);

    // Bei Rückkehr aus dem Hintergrund auffrischen
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) { Erinnerungen.pruefen(); zeichneKopf(); }
    });

    if (Store.einst('erinnerungen') === true) Erinnerungen.starten();

    // Android/Chrome: Installations-Angebot merken
    window.addEventListener('beforeinstallprompt', (ev) => {
      ev.preventDefault();
      installEreignis = ev;
      if (ansicht === 'einstellungen') zeichneEinstellungen();
    });

    // Hinweis, wenn der Speicher blockiert ist
    if (!Store.speicherOk()) {
      setTimeout(() => Meldung.zeig(
        'Achtung: Der Browser blockiert den Speicher (privates Fenster?). Häkchen gehen beim Schließen verloren.',
        { art: 'warn', dauer: 8000 }), 900);
    }

    // Service Worker für den Offline-Betrieb
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => { /* offline dann eben nicht */ });
      });
    }
  }

  return {
    start, geheZu, zeichneAlles, zeichneEinstellungen,
    aktuelleAnsicht: () => ansicht,
    aktuellerTag: () => tag
  };
})();

document.addEventListener('DOMContentLoaded', () => App.start());
