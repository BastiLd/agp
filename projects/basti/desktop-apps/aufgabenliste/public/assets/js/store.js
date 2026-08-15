/* ============================================================================
   store.js  –  Speicherung, Einstellungen, Export/Import, Fotos
   ----------------------------------------------------------------------------
   Alles liegt zuerst im localStorage des Geräts. Ist ein Server erreichbar
   (siehe api.js), wird derselbe Stand zusätzlich dorthin abgeglichen.

   Zusammenführen zweier Stände: jedes Häkchen trägt einen Zeitstempel, und
   das Entfernen eines Häkchens wird als „Grabstein" ebenfalls mit Zeitstempel
   festgehalten. Beim Abgleich gewinnt der jüngere Eintrag. Dadurch holt der
   Server ein auf dem Handy entferntes Häkchen nicht wieder zurück.
   ========================================================================== */
'use strict';

/* --- Kleiner Ereignis-Verteiler ------------------------------------------ */
const Bus = (() => {
  const hoerer = {};
  return {
    an(name, fn) { (hoerer[name] || (hoerer[name] = [])).push(fn); },
    ruf(name, daten) { (hoerer[name] || []).forEach((fn) => { try { fn(daten); } catch (e) { console.error(e); } }); }
  };
})();

/* --- Standard-Einstellungen ---------------------------------------------- */
const STANDARD_EINSTELLUNGEN = Object.freeze({
  name: 'Basti',
  theme: 'system',            // 'hell' | 'dunkel' | 'system'
  akzent: 'blau',
  textgroesse: 'normal',      // 'klein' | 'normal' | 'gross'
  kompakt: false,
  animationen: true,
  konfetti: 'normal',         // 'aus' | 'wenig' | 'normal' | 'viel'
  sound: true,
  lautstaerke: 0.5,
  vibration: true,
  startAnsicht: 'heute',
  aufHeuteSpringen: true,
  nurHeute: false,
  erledigteNachUnten: false,
  spruecheAnzeigen: true,
  zeitleiste: true,
  erinnerungen: false,        // Erinnerungen im Browser, solange die Seite läuft
  push: false,                // echte Push-Nachrichten über den Server
  serverSync: true,           // automatischer Abgleich, wenn ein Server da ist
  symbolzaehler: true,        // Zahl auf dem App-Symbol
  erinnerungsZeiten: {},      // { aufgabeId: Minuten seit Mitternacht }
  erinnerungsVorlauf: 0,      // Minuten früher erinnern
  geraet: '',
  letzterTag: '',
  zugangsschluessel: '',      // nur nötig, wenn der Server ZUGANG verlangt
  eigeneKontakte: [],         // selbst ergänzte Telefonnummern
  notfallZuerst: false        // Notfall-Ansicht beim Start zeigen
});

const AKZENTE = Object.freeze({
  blau:   { label: 'Blau',    farbe: '#1b3a8c' },
  tuerkis:{ label: 'Türkis',  farbe: '#0f7f8f' },
  gruen:  { label: 'Grün',    farbe: '#1a7a44' },
  lila:   { label: 'Lila',    farbe: '#6b3fa0' },
  rot:    { label: 'Rot',     farbe: '#b23227' },
  grafit: { label: 'Grafit',  farbe: '#2f3542' }
});

/* --- Speicher-Zugriff mit Notfall-Rückfall ------------------------------- */
const Speicher = (() => {
  let verfuegbar = true;
  const ersatz = {};
  try {
    window.localStorage.setItem('__probe__', '1');
    window.localStorage.removeItem('__probe__');
  } catch (e) {
    verfuegbar = false;
    console.warn('localStorage nicht verfügbar – Fortschritt wird nur bis zum Schließen behalten.');
  }
  return {
    verfuegbar: () => verfuegbar,
    lies(key) { return verfuegbar ? window.localStorage.getItem(key) : (ersatz[key] ?? null); },
    schreib(key, wert) {
      if (verfuegbar) {
        try { window.localStorage.setItem(key, wert); }
        catch (e) { console.error('Speichern fehlgeschlagen', e); return false; }
      } else { ersatz[key] = wert; }
      return true;
    },
    loesche(key) { if (verfuegbar) window.localStorage.removeItem(key); else delete ersatz[key]; },
    belegung() {
      if (!verfuegbar) return 0;
      let summe = 0;
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        summe += (k.length + (window.localStorage.getItem(k) || '').length) * 2;
      }
      return summe;
    }
  };
})();

/* --- UTF-8-sicheres Base64 (url-tauglich) -------------------------------- */
function bytesZuB64url(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlZuBytes(text) {
  let s = String(text).replace(/-/g, '+').replace(/_/g, '/').replace(/\s+/g, '');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
function textZuB64url(text) { return bytesZuB64url(new TextEncoder().encode(text)); }
function b64urlZuText(code) { return new TextDecoder().decode(b64urlZuBytes(code)); }

/* --- Kanonische Reihenfolge aller Häkchen (für den Kurz-Code) ------------ */
const SCHLUESSEL = (() => {
  const liste = [];
  TAGE.forEach((iso) => aufgabenFuerTag(iso).forEach((a) => liste.push([iso, a.id])));
  return liste;
})();

/* ==========================================================================
   Fotos zu Notizen – eigener Speicherplatz, damit der Hauptstand schlank bleibt
   ========================================================================== */
const Fotos = (() => {
  const KEY = 'basti-todo-fotos';
  const MAX_PRO_TAG = 3;

  let doc = { v: 1, tage: {}, geloescht: {}, geaendert: Date.now() };

  function laden() {
    const roh = Speicher.lies(KEY);
    if (!roh) return;
    try {
      const d = JSON.parse(roh);
      if (d && typeof d === 'object') {
        doc = { v: 1, tage: d.tage || {}, geloescht: d.geloescht || {}, geaendert: d.geaendert || Date.now() };
      }
    } catch (e) { console.error('Fotos unlesbar', e); }
  }
  function sichern() {
    doc.geaendert = Date.now();
    const ok = Speicher.schreib(KEY, JSON.stringify(doc));
    if (!ok) Bus.ruf('fotoFehler', { grund: 'voll' });
    Bus.ruf('aenderung', { grund: 'foto' });
    return ok;
  }

  function liste(iso) { return (doc.tage[iso] || []).slice().sort((a, b) => a.ts - b.ts); }
  function anzahl() { return Object.keys(doc.tage).reduce((s, iso) => s + doc.tage[iso].length, 0); }
  function platzVoll(iso) { return liste(iso).length >= MAX_PRO_TAG; }

  function hinzufuegen(iso, bild, name) {
    if (platzVoll(iso)) return { ok: false, grund: 'Höchstens ' + MAX_PRO_TAG + ' Fotos pro Tag.' };
    if (!doc.tage[iso]) doc.tage[iso] = [];
    const eintrag = { id: 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), bild, ts: Date.now(), name: name || '' };
    doc.tage[iso].push(eintrag);
    if (!sichern()) {
      doc.tage[iso].pop();
      return { ok: false, grund: 'Der Speicher des Browsers ist voll. Bitte ein paar Fotos löschen.' };
    }
    return { ok: true, eintrag };
  }

  function entfernen(iso, id) {
    if (!doc.tage[iso]) return;
    doc.tage[iso] = doc.tage[iso].filter((f) => f.id !== id);
    if (!doc.tage[iso].length) delete doc.tage[iso];
    doc.geloescht[id] = Date.now();
    sichern();
  }

  /** Für den Abgleich: nur Kopfdaten, ohne die schweren Bilddaten */
  function verzeichnis() {
    const v = {};
    Object.keys(doc.tage).forEach((iso) => { v[iso] = doc.tage[iso].map((f) => ({ id: f.id, ts: f.ts })); });
    return { tage: v, geloescht: doc.geloescht };
  }
  function alles() { return doc; }
  function foto(iso, id) { return (doc.tage[iso] || []).find((f) => f.id === id) || null; }

  /** Fremde Fotos einarbeiten; gelöschte bleiben gelöscht */
  function zusammenfuehren(fremd) {
    if (!fremd || !fremd.tage) return 0;
    let neu = 0;
    Object.keys(fremd.geloescht || {}).forEach((id) => {
      if (!doc.geloescht[id] || doc.geloescht[id] < fremd.geloescht[id]) doc.geloescht[id] = fremd.geloescht[id];
    });
    Object.keys(fremd.tage).forEach((iso) => {
      (fremd.tage[iso] || []).forEach((f) => {
        if (!f || !f.id || !f.bild) return;
        if (doc.geloescht[f.id]) return;
        if (!doc.tage[iso]) doc.tage[iso] = [];
        if (doc.tage[iso].some((e) => e.id === f.id)) return;
        if (doc.tage[iso].length >= MAX_PRO_TAG) return;
        doc.tage[iso].push(f);
        neu++;
      });
    });
    // Gelöschte auch lokal entfernen
    Object.keys(doc.tage).forEach((iso) => {
      doc.tage[iso] = doc.tage[iso].filter((f) => !doc.geloescht[f.id]);
      if (!doc.tage[iso].length) delete doc.tage[iso];
    });
    if (neu) sichern();
    return neu;
  }

  function alleLoeschen() {
    Object.keys(doc.tage).forEach((iso) => doc.tage[iso].forEach((f) => { doc.geloescht[f.id] = Date.now(); }));
    doc.tage = {};
    sichern();
  }

  laden();
  return { liste, anzahl, hinzufuegen, entfernen, foto, verzeichnis, alles, zusammenfuehren, alleLoeschen, platzVoll, MAX_PRO_TAG };
})();

/* ==========================================================================
   Der eigentliche Datenspeicher
   ========================================================================== */
const Store = (() => {

  function leererStand() {
    return {
      v: APP_INFO.dataVersion,
      erledigt: {},        // { iso: { aufgabenId: zeitstempel } }
      entfernt: {},        // { iso: { aufgabenId: zeitstempel } }  „Grabsteine"
      notizen: {},         // { iso: { text, ts } }
      erfolge: {},         // { erfolgId: zeitstempel }
      einstellungen: Object.assign({}, STANDARD_EINSTELLUNGEN),
      erstellt: Date.now(),
      geaendert: Date.now()
    };
  }

  let stand = leererStand();
  let schreibTimer = null;

  /* --- Laden mit Migration alter Formate --------------------------------- */
  function laden() {
    const roh = Speicher.lies(APP_INFO.storageKey);
    if (!roh) { stand = leererStand(); return; }
    let geladen;
    try { geladen = JSON.parse(roh); }
    catch (e) { console.error('Gespeicherte Daten unlesbar, starte neu.', e); stand = leererStand(); return; }
    stand = migriere(geladen);
  }

  function migriere(d) {
    const neu = leererStand();
    if (!d || typeof d !== 'object') return neu;

    if (d.erledigt && typeof d.erledigt === 'object') {
      Object.keys(d.erledigt).forEach((iso) => {
        const wert = d.erledigt[iso];
        if (Array.isArray(wert)) {                       // ganz altes Format
          neu.erledigt[iso] = {};
          wert.forEach((id) => { neu.erledigt[iso][id] = d.geaendert || Date.now(); });
        } else if (wert && typeof wert === 'object') {
          neu.erledigt[iso] = {};
          Object.keys(wert).forEach((id) => {
            const ts = wert[id];
            if (ts) neu.erledigt[iso][id] = (typeof ts === 'number' ? ts : Date.now());
          });
        }
      });
    }

    if (d.entfernt && typeof d.entfernt === 'object') {
      Object.keys(d.entfernt).forEach((iso) => {
        const wert = d.entfernt[iso];
        if (wert && typeof wert === 'object') {
          neu.entfernt[iso] = {};
          Object.keys(wert).forEach((id) => {
            if (typeof wert[id] === 'number') neu.entfernt[iso][id] = wert[id];
          });
        }
      });
    }

    if (d.notizen && typeof d.notizen === 'object') {
      Object.keys(d.notizen).forEach((iso) => {
        const wert = d.notizen[iso];
        if (typeof wert === 'string') neu.notizen[iso] = { text: wert, ts: d.geaendert || Date.now() };
        else if (wert && typeof wert.text === 'string') neu.notizen[iso] = { text: wert.text, ts: wert.ts || Date.now() };
      });
    }

    if (d.erfolge && typeof d.erfolge === 'object') {
      Object.keys(d.erfolge).forEach((id) => { neu.erfolge[id] = d.erfolge[id] || Date.now(); });
    }

    if (d.einstellungen && typeof d.einstellungen === 'object') {
      Object.keys(STANDARD_EINSTELLUNGEN).forEach((k) => {
        const w = d.einstellungen[k];
        if (w === undefined || w === null) return;
        // Objekte nicht per Referenz übernehmen
        neu.einstellungen[k] = (typeof w === 'object' && !Array.isArray(w)) ? Object.assign({}, w) : w;
      });
    }

    neu.erstellt = d.erstellt || Date.now();
    neu.geaendert = d.geaendert || Date.now();
    neu.v = APP_INFO.dataVersion;
    return neu;
  }

  function sichern(sofort) {
    stand.geaendert = Date.now();
    if (schreibTimer) clearTimeout(schreibTimer);
    const schreiben = () => {
      schreibTimer = null;
      Speicher.schreib(APP_INFO.storageKey, JSON.stringify(stand));
    };
    if (sofort) schreiben(); else schreibTimer = setTimeout(schreiben, 250);
  }

  /* --- Häkchen ----------------------------------------------------------- */
  function istErledigt(iso, aufgabeId) {
    return !!(stand.erledigt[iso] && stand.erledigt[iso][aufgabeId]);
  }
  function zeitpunkt(iso, aufgabeId) {
    return (stand.erledigt[iso] && stand.erledigt[iso][aufgabeId]) || null;
  }

  function setzeErledigt(iso, aufgabeId, wert, zeitstempel) {
    const ts = zeitstempel || Date.now();
    const vorher = istErledigt(iso, aufgabeId);

    if (wert) {
      if (!stand.erledigt[iso]) stand.erledigt[iso] = {};
      stand.erledigt[iso][aufgabeId] = ts;
      if (stand.entfernt[iso]) {
        delete stand.entfernt[iso][aufgabeId];
        if (!Object.keys(stand.entfernt[iso]).length) delete stand.entfernt[iso];
      }
    } else {
      if (stand.erledigt[iso]) {
        delete stand.erledigt[iso][aufgabeId];
        if (!Object.keys(stand.erledigt[iso]).length) delete stand.erledigt[iso];
      }
      if (!stand.entfernt[iso]) stand.entfernt[iso] = {};
      stand.entfernt[iso][aufgabeId] = ts;
    }

    sichern();
    if (vorher !== !!wert) Bus.ruf('haken', { iso, aufgabeId, wert: !!wert });
    Bus.ruf('aenderung', { grund: 'haken', iso });
    return !!wert;
  }

  function umschalten(iso, aufgabeId) {
    return setzeErledigt(iso, aufgabeId, !istErledigt(iso, aufgabeId));
  }

  function setzeTag(iso, wert) {
    const jetzt = Date.now();
    aufgabenFuerTag(iso).forEach((a, i) => {
      if (wert && istErledigt(iso, a.id)) return;
      if (!wert && !istErledigt(iso, a.id)) return;
      setzeErledigtStill(iso, a.id, wert, jetzt + i);
    });
    sichern(true);
    Bus.ruf('aenderung', { grund: 'tag', iso });
  }

  /** wie setzeErledigt, aber ohne Einzelmeldungen (für Massenänderungen) */
  function setzeErledigtStill(iso, aufgabeId, wert, ts) {
    if (wert) {
      if (!stand.erledigt[iso]) stand.erledigt[iso] = {};
      stand.erledigt[iso][aufgabeId] = ts;
      if (stand.entfernt[iso]) delete stand.entfernt[iso][aufgabeId];
    } else {
      if (stand.erledigt[iso]) delete stand.erledigt[iso][aufgabeId];
      if (!stand.entfernt[iso]) stand.entfernt[iso] = {};
      stand.entfernt[iso][aufgabeId] = ts;
    }
    if (stand.erledigt[iso] && !Object.keys(stand.erledigt[iso]).length) delete stand.erledigt[iso];
    if (stand.entfernt[iso] && !Object.keys(stand.entfernt[iso]).length) delete stand.entfernt[iso];
  }

  /* --- Notizen ----------------------------------------------------------- */
  function notiz(iso) { return (stand.notizen[iso] && stand.notizen[iso].text) || ''; }
  function notizZeit(iso) { return (stand.notizen[iso] && stand.notizen[iso].ts) || 0; }
  function setzeNotiz(iso, text) {
    const sauber = String(text || '');
    if (sauber.trim() === '') {
      if (stand.notizen[iso]) stand.notizen[iso] = { text: '', ts: Date.now() };
    } else {
      stand.notizen[iso] = { text: sauber, ts: Date.now() };
    }
    sichern();
    Bus.ruf('aenderung', { grund: 'notiz', iso });
  }
  function notizenAnzahl() {
    return Object.keys(stand.notizen).filter((iso) => (stand.notizen[iso].text || '').trim()).length;
  }
  /** Volltextsuche über alle Notizen */
  function notizenSuchen(begriff) {
    const b = String(begriff || '').trim().toLowerCase();
    if (!b) return [];
    return TAGE.filter((iso) => notiz(iso).toLowerCase().includes(b))
      .map((iso) => ({ iso, text: notiz(iso) }));
  }

  /* --- Einstellungen ----------------------------------------------------- */
  function einst(schluessel) {
    return schluessel === undefined ? stand.einstellungen : stand.einstellungen[schluessel];
  }
  function setzeEinst(schluessel, wert) {
    stand.einstellungen[schluessel] = wert;
    sichern(true);
    Bus.ruf('einstellung', { schluessel, wert });
    Bus.ruf('aenderung', { grund: 'einstellung' });
  }
  function setzeEinstLeise(schluessel, wert) {
    if (stand.einstellungen[schluessel] === wert) return;
    stand.einstellungen[schluessel] = wert;
    sichern();
  }
  function einstellungenZuruecksetzen() {
    stand.einstellungen = Object.assign({}, STANDARD_EINSTELLUNGEN, { erinnerungsZeiten: {} });
    sichern(true);
    Bus.ruf('einstellung', { schluessel: '*', wert: null });
    Bus.ruf('aenderung', { grund: 'einstellung' });
  }

  /* --- Erfolge ----------------------------------------------------------- */
  function erfolgeStand() { return stand.erfolge; }
  function pruefeErfolge() {
    const z = zahlen();
    const ctx = {
      erledigt: z.erledigtGesamt,
      gesamt: z.gesamt,
      tageKomplett: z.tageKomplett,
      streakBest: z.streakBest,
      notizenAnzahl: notizenAnzahl(),
      sonderErledigt: {
        rasen: istErledigt('2026-08-20', 'giessen'),
        muell: istErledigt('2026-08-24', 'restmuell'),
        papier: istErledigt('2026-08-26', 'papiermuell')
      },
      postTage: TAGE.filter((iso) => istErledigt(iso, 'post')).length,
      fotosAnzahl: Fotos.anzahl(),
      frueheHaken: frueheHakenZaehlen()
    };
    const neue = [];
    ERFOLGE.forEach((e) => {
      if (!stand.erfolge[e.id] && e.pruef(ctx)) {
        stand.erfolge[e.id] = Date.now();
        neue.push(e);
      }
    });
    if (neue.length) { sichern(true); Bus.ruf('erfolg', neue); }
    return neue;
  }
  function frueheHakenZaehlen() {
    let n = 0;
    Object.keys(stand.erledigt).forEach((iso) => {
      Object.keys(stand.erledigt[iso]).forEach((id) => {
        const ts = stand.erledigt[iso][id];
        if (typeof ts === 'number' && ts > 1e12 && new Date(ts).getHours() < 9) n++;
      });
    });
    return n;
  }

  /* --- Auswertung -------------------------------------------------------- */
  function tagZahlen(iso) {
    const aufgaben = aufgabenFuerTag(iso);
    const erledigt = aufgaben.filter((a) => istErledigt(iso, a.id)).length;
    return { gesamt: aufgaben.length, erledigt, komplett: erledigt === aufgaben.length && aufgaben.length > 0 };
  }

  function zahlen() {
    let gesamt = 0, erledigtGesamt = 0, tageKomplett = 0, tageBegonnen = 0;
    const proTag = {};
    TAGE.forEach((iso) => {
      const t = tagZahlen(iso);
      proTag[iso] = t;
      gesamt += t.gesamt;
      erledigtGesamt += t.erledigt;
      if (t.komplett) tageKomplett++;
      if (t.erledigt > 0) tageBegonnen++;
    });

    let streakBest = 0, lauf = 0, streakAktuell = 0;
    TAGE.forEach((iso) => {
      if (proTag[iso].komplett) { lauf++; if (lauf > streakBest) streakBest = lauf; }
      else lauf = 0;
    });

    const h = heuteIso();
    const bisIndex = TAGE.reduce((idx, iso, i) => (iso <= h ? i : idx), -1);
    let start = bisIndex;
    if (start >= 0 && !proTag[TAGE[start]].komplett) start--;
    for (let i = start; i >= 0; i--) {
      if (proTag[TAGE[i]].komplett) streakAktuell++;
      else break;
    }

    return {
      gesamt, erledigtGesamt, tageKomplett, tageBegonnen, proTag,
      streakBest, streakAktuell,
      offen: gesamt - erledigtGesamt,
      prozent: gesamt ? Math.round((erledigtGesamt / gesamt) * 100) : 0
    };
  }

  function aufgabeZahlen(aufgabeId) {
    let moeglich = 0, erledigt = 0;
    TAGE.forEach((iso) => {
      if (aufgabenFuerTag(iso).some((a) => a.id === aufgabeId)) {
        moeglich++;
        if (istErledigt(iso, aufgabeId)) erledigt++;
      }
    });
    return { moeglich, erledigt };
  }

  /** Um welche Uhrzeit wird typischerweise abgehakt? (Statistik) */
  function stundenVerteilung() {
    const stunden = new Array(24).fill(0);
    Object.keys(stand.erledigt).forEach((iso) => {
      Object.keys(stand.erledigt[iso]).forEach((id) => {
        const ts = stand.erledigt[iso][id];
        if (typeof ts === 'number' && ts > 1e12) stunden[new Date(ts).getHours()]++;
      });
    });
    return stunden;
  }

  /** Offene Aufgaben eines Tages, deren Zeit schon vorbei ist */
  function ueberfaellig(iso) {
    if (iso !== heuteIso()) return [];
    const jetzt = new Date().getHours() * 60 + new Date().getMinutes();
    return aufgabenFuerTag(iso).filter((a) =>
      !istErledigt(iso, a.id) && a.ankerZeit !== null && a.ankerZeit + 60 < jetzt);
  }

  /* ==========================================================================
     Abgleich zweier Stände
     ========================================================================== */

  /** Der eigene Stand in der Form, die auch der Server versteht */
  function schnappschuss() {
    return {
      v: APP_INFO.dataVersion,
      erledigt: stand.erledigt,
      entfernt: stand.entfernt,
      notizen: stand.notizen,
      erfolge: stand.erfolge,
      geaendert: stand.geaendert
    };
  }

  /**
   * Fremden Stand einarbeiten. Pro Häkchen gewinnt der jüngere Zeitstempel,
   * egal ob gesetzt oder entfernt. Liefert einen Bericht.
   */
  function zusammenfuehren(fremd) {
    if (!fremd || typeof fremd !== 'object') return { gesetzt: 0, entfernt: 0, notizen: 0, erfolge: 0 };
    let gesetzt = 0, entferntZahl = 0, notizenZahl = 0, erfolgeZahl = 0;

    const fErledigt = fremd.erledigt || {};
    const fEntfernt = fremd.entfernt || {};

    const alleTage = new Set(
      Object.keys(fErledigt).concat(Object.keys(fEntfernt))
            .concat(Object.keys(stand.erledigt)).concat(Object.keys(stand.entfernt))
    );

    alleTage.forEach((iso) => {
      const ids = new Set(
        Object.keys(fErledigt[iso] || {}).concat(Object.keys(fEntfernt[iso] || {}))
              .concat(Object.keys(stand.erledigt[iso] || {})).concat(Object.keys(stand.entfernt[iso] || {}))
      );
      ids.forEach((id) => {
        const hierAn  = (stand.erledigt[iso] || {})[id] || 0;
        const hierAus = (stand.entfernt[iso] || {})[id] || 0;
        const dortAn  = (fErledigt[iso] || {})[id] || 0;
        const dortAus = (fEntfernt[iso] || {})[id] || 0;

        const an  = Math.max(hierAn, dortAn);
        const aus = Math.max(hierAus, dortAus);
        if (!an && !aus) return;

        const sollAn = an >= aus;          // bei Gleichstand gewinnt „erledigt"
        const warAn = !!hierAn;

        if (sollAn) {
          if (!warAn) gesetzt++;
          setzeErledigtStill(iso, id, true, an);
          if (aus) { if (!stand.entfernt[iso]) stand.entfernt[iso] = {}; }
        } else {
          if (warAn) entferntZahl++;
          setzeErledigtStill(iso, id, false, aus);
        }
      });
    });

    Object.keys(fremd.notizen || {}).forEach((iso) => {
      const dort = fremd.notizen[iso];
      if (!dort || typeof dort.text !== 'string') return;
      const hier = stand.notizen[iso];
      if (!hier || (dort.ts || 0) > (hier.ts || 0)) {
        if (!hier || hier.text !== dort.text) notizenZahl++;
        stand.notizen[iso] = { text: dort.text, ts: dort.ts || Date.now() };
      }
    });

    Object.keys(fremd.erfolge || {}).forEach((id) => {
      if (!stand.erfolge[id]) { stand.erfolge[id] = fremd.erfolge[id] || Date.now(); erfolgeZahl++; }
      else if (fremd.erfolge[id] && fremd.erfolge[id] < stand.erfolge[id]) stand.erfolge[id] = fremd.erfolge[id];
    });

    const etwasPassiert = gesetzt || entferntZahl || notizenZahl || erfolgeZahl;
    if (etwasPassiert) { sichern(true); Bus.ruf('aenderung', { grund: 'abgleich' }); }
    return { gesetzt, entfernt: entferntZahl, notizen: notizenZahl, erfolge: erfolgeZahl };
  }

  /* ==========================================================================
     Export / Import über Codes und Dateien
     ========================================================================== */

  function exportJson() {
    return JSON.stringify({
      app: APP_INFO.name,
      version: APP_INFO.version,
      v: APP_INFO.dataVersion,
      exportiert: new Date().toISOString(),
      geraet: stand.einstellungen.geraet || '',
      daten: stand,
      fotos: Fotos.alles()
    }, null, 2);
  }

  function kurzCode() {
    const bits = new Uint8Array(Math.ceil(SCHLUESSEL.length / 8));
    SCHLUESSEL.forEach(([iso, id], i) => {
      if (istErledigt(iso, id)) bits[i >> 3] |= (1 << (i & 7));
    });
    const roh = bytesZuB64url(bits);
    return 'BT1-' + roh + '-' + pruefsumme(roh);
  }

  function vollCode() {
    const roh = textZuB64url(JSON.stringify({
      v: APP_INFO.dataVersion,
      t: Date.now(),
      g: stand.einstellungen.geraet || '',
      e: stand.erledigt,
      x: stand.entfernt,
      n: stand.notizen,
      a: stand.erfolge
    }));
    return 'BT2-' + roh + '-' + pruefsumme(roh);
  }

  function pruefsumme(text) {
    let s = 5381;
    for (let i = 0; i < text.length; i++) s = ((s * 33) ^ text.charCodeAt(i)) >>> 0;
    return s.toString(36).slice(-4).toUpperCase().padStart(4, '0');
  }

  function importieren(eingabe, modus) {
    const text = String(eingabe || '').trim();
    if (!text) throw new Error('Es wurde nichts eingegeben.');
    if (text.startsWith('BT1-')) return importKurz(text, modus !== 'ersetzen');
    if (text.startsWith('BT2-')) return importVoll(text);
    if (text.startsWith('{')) return importJson(text);
    throw new Error('Der Code sieht nicht richtig aus. Erwartet wird BT1-…, BT2-… oder eine Sicherungsdatei.');
  }

  function teileCode(text) {
    const teile = text.split('-');
    if (teile.length < 3) throw new Error('Der Code ist unvollständig.');
    const summe = teile.pop();
    const roh = teile.slice(1).join('-');
    if (pruefsumme(roh) !== summe.toUpperCase()) {
      throw new Error('Prüfsumme stimmt nicht – der Code wurde beim Kopieren abgeschnitten oder verändert.');
    }
    return roh;
  }

  function importKurz(text, zusammen) {
    const bits = b64urlZuBytes(teileCode(text));
    let gesetzt = 0, entferntZahl = 0;
    const jetzt = Date.now();
    SCHLUESSEL.forEach(([iso, id], i) => {
      const an = !!(bits[i >> 3] & (1 << (i & 7)));
      const hat = istErledigt(iso, id);
      if (an && !hat) { setzeErledigtStill(iso, id, true, jetzt); gesetzt++; }
      else if (!an && hat && !zusammen) { setzeErledigtStill(iso, id, false, jetzt); entferntZahl++; }
    });
    sichern(true);
    Bus.ruf('aenderung', { grund: 'import' });
    return { art: 'Kurz-Code', gesetzt, entfernt: entferntZahl, notizen: 0, geraet: '' };
  }

  function importVoll(text) {
    let daten;
    try { daten = JSON.parse(b64urlZuText(teileCode(text))); }
    catch (e) { throw new Error('Der Code lässt sich nicht lesen.'); }
    const bericht = zusammenfuehren({
      erledigt: daten.e || {}, entfernt: daten.x || {},
      notizen: daten.n || {}, erfolge: daten.a || {}
    });
    bericht.art = 'Voll-Code';
    bericht.geraet = daten.g || '';
    return bericht;
  }

  function importJson(text) {
    let d;
    try { d = JSON.parse(text); } catch (e) { throw new Error('Die Datei ist keine gültige Sicherung.'); }
    const kern = migriere(d.daten || d);
    const bericht = zusammenfuehren(kern);
    bericht.art = 'Sicherungsdatei';
    bericht.geraet = d.geraet || '';
    if (d.fotos) bericht.fotos = Fotos.zusammenfuehren(d.fotos);
    return bericht;
  }

  /* --- Zurücksetzen ------------------------------------------------------ */
  function fortschrittZuruecksetzen() {
    const jetzt = Date.now();
    TAGE.forEach((iso) => aufgabenFuerTag(iso).forEach((a) => {
      if (istErledigt(iso, a.id)) setzeErledigtStill(iso, a.id, false, jetzt);
    }));
    stand.erfolge = {};
    sichern(true);
    Bus.ruf('aenderung', { grund: 'reset' });
  }

  function allesZuruecksetzen() {
    stand = leererStand();
    Speicher.loesche(APP_INFO.storageKey);
    Fotos.alleLoeschen();
    sichern(true);
    Bus.ruf('einstellung', { schluessel: '*', wert: null });
    Bus.ruf('aenderung', { grund: 'reset' });
  }

  laden();

  return {
    laden, sichern,
    istErledigt, zeitpunkt, setzeErledigt, umschalten, setzeTag,
    notiz, notizZeit, setzeNotiz, notizenAnzahl, notizenSuchen,
    einst, setzeEinst, setzeEinstLeise, einstellungenZuruecksetzen,
    erfolgeStand, pruefeErfolge,
    tagZahlen, zahlen, aufgabeZahlen, stundenVerteilung, ueberfaellig,
    schnappschuss, zusammenfuehren,
    exportJson, kurzCode, vollCode, importieren,
    fortschrittZuruecksetzen, allesZuruecksetzen,
    speicherOk: Speicher.verfuegbar,
    speicherBelegung: Speicher.belegung,
    rohStand: () => stand
  };
})();

/* --- Erinnerungszeit einer Aufgabe (eigene Zeit schlägt die Vorgabe) ------ */
function erinnerungsZeit(aufgabe) {
  if (!aufgabe || !aufgabe.erinnerung) return null;
  const eigene = Store.einst('erinnerungsZeiten') || {};
  const w = eigene[aufgabe.id];
  const basis = (typeof w === 'number' && w >= 0 && w < 1440) ? w : aufgabe.erinnerung.zeit;
  const vorlauf = Number(Store.einst('erinnerungsVorlauf')) || 0;
  return Math.max(0, basis - vorlauf);
}
