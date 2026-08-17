/* ============================================================================
   data.js  –  Alle Inhalte der Aufgabenliste
   ----------------------------------------------------------------------------
   Quelle: Leitfaden/Aufgabenliste.xlsx (Tabelle1) und Aufgabenliste_Basti.pdf
   Zeitraum: Sa 15.08.2026 bis Mi 26.08.2026 (12 Tage)
   Zeiten aus Zeile 4 der Excel: Frühstück 8, Rundgang 7 und 15,
   Gießen ab 8, Mittagessen 14/15.
   ========================================================================== */
'use strict';

const APP_INFO = Object.freeze({
  name: 'Aufgabenliste für Basti',
  version: '2.2.0',
  dataVersion: 5,          // hochzählen, wenn sich das Speicherformat ändert
  storageKey: 'basti-todo-2026-08',
  quelle: 'Aufgabenliste.xlsx / Aufgabenliste_Basti.pdf'
});

/* --- Zeitraum ------------------------------------------------------------ */
const ZEITRAUM = Object.freeze({ start: '2026-08-15', ende: '2026-08-26' });

/* --- Tagesabschnitte ----------------------------------------------------- */
const PHASEN = Object.freeze({
  frueh:      { label: 'Früh',       sort: 1 },
  vormittag:  { label: 'Vormittag',  sort: 2 },
  mittag:     { label: 'Mittag',     sort: 3 },
  nachmittag: { label: 'Nachmittag', sort: 4 },
  abend:      { label: 'Abend',      sort: 5 },
  nacht:      { label: 'Nacht',      sort: 6 }
});

/* --- Die 10 täglichen Aufgaben ------------------------------------------
   farbe    = CSS-Variablenname (siehe app.css, --t1 … --t10)
   ankerZeit = Uhrzeit in Minuten seit Mitternacht, für „Als Nächstes“,
               die Zeitleiste und die Erinnerungen. null = keine feste Zeit.
   ------------------------------------------------------------------------ */
const AUFGABEN = Object.freeze([
  {
    id: 'lueften_frueh',
    nr: 1,
    kurz: 'Lüften früh',
    titel: 'Lüften in der Früh',
    text: 'Fenster auf, kurz gut durchlüften',
    icon: 'i-window-day',
    farbe: 't1',
    phase: 'frueh',
    zeitText: 'nach dem Aufstehen',
    ankerZeit: 7 * 60,
    erinnerung: { zeit: 7 * 60 + 30, text: 'Fenster auf – einmal gut durchlüften.' }
  },
  {
    id: 'fruehstueck',
    nr: 2,
    kurz: 'Frühstück',
    titel: 'Frühstücken',
    text: 'In Ruhe frühstücken',
    icon: 'i-coffee',
    farbe: 't2',
    phase: 'frueh',
    zeitText: 'ab 8:00 Uhr',
    ankerZeit: 8 * 60,
    erinnerung: { zeit: 8 * 60, text: 'Zeit fürs Frühstück.' }
  },
  {
    // Der Rundgang steht in der Excel mit "7 und 15" – also zweimal am Tag.
    // Deshalb sind es hier zwei getrennte Aufgaben mit je eigenem Häkchen
    // und eigener Erinnerung; sonst käme die zweite Erinnerung auch dann,
    // wenn der erste Rundgang längst abgehakt ist.
    id: 'rundgang_frueh',
    nr: 3,
    kurz: 'Rundgang früh',
    titel: 'Rundgang ums Haus',
    text: 'Einmal ums Haus gehen und schauen, ob alles passt',
    icon: 'i-house',
    farbe: 't3',
    phase: 'vormittag',
    zeitText: '1. Rundgang · 7:00 Uhr',
    ankerZeit: 7 * 60,
    erinnerung: { zeit: 7 * 60, text: 'Erster Rundgang ums Haus.' }
  },
  {
    id: 'giessen',
    nr: 4,
    kurz: 'Gießen',
    titel: 'Gießen',
    text: 'Wenn es zu trocken ist, bitte gießen',
    icon: 'i-can',
    farbe: 't4',
    phase: 'vormittag',
    zeitText: 'ab 8:00 Uhr',
    ankerZeit: 10 * 60,
    erinnerung: { zeit: 10 * 60, text: 'Schau kurz, ob gegossen werden muss.' }
  },
  {
    id: 'freizeit_vormittag',
    nr: 5,
    kurz: 'Freie Zeit',
    titel: 'Freie Zeit',
    text: 'Zeit für dich',
    icon: 'i-gamepad',
    farbe: 't5',
    phase: 'vormittag',
    zeitText: 'Vormittag',
    ankerZeit: 11 * 60,
    erinnerung: null
  },
  {
    id: 'mittagessen',
    nr: 6,
    kurz: 'Mittagessen',
    titel: 'Essen',
    text: 'Mittagessen',
    icon: 'i-plate',
    farbe: 't6',
    phase: 'mittag',
    zeitText: '14:00 – 15:00 Uhr',
    ankerZeit: 14 * 60,
    erinnerung: { zeit: 14 * 60, text: 'Mittagessen nicht vergessen.' }
  },
  {
    id: 'post',
    nr: 7,
    kurz: 'Post',
    titel: 'Post schauen',
    text: 'Alles mit deinem Namen sowie von Billa und Lidl aufheben. Wenn du unsicher bist, schick ein Bild.',
    icon: 'i-post',
    farbe: 't11',
    phase: 'mittag',
    zeitText: 'ca. 14:00 Uhr',
    ankerZeit: 14 * 60,
    erinnerung: { zeit: 14 * 60, text: 'Post schauen – alles mit Namen, Billa und Lidl aufheben. Unsicher? Bild schicken.' }
  },
  {
    id: 'rundgang_spaet',
    nr: 8,
    kurz: 'Rundgang spät',
    titel: 'Rundgang ums Haus',
    text: 'Zweiter Rundgang: nochmal ums Haus gehen und schauen, ob alles passt',
    icon: 'i-house',
    farbe: 't3',
    phase: 'nachmittag',
    zeitText: '2. Rundgang · 15:00 Uhr',
    ankerZeit: 15 * 60,
    erinnerung: { zeit: 15 * 60, text: 'Zweiter Rundgang ums Haus.' }
  },
  {
    id: 'freizeit_nachmittag',
    nr: 9,
    kurz: 'Freie Zeit',
    titel: 'Freie Zeit',
    text: 'Zeit für dich',
    icon: 'i-headphones',
    farbe: 't7',
    phase: 'nachmittag',
    zeitText: 'Nachmittag',
    ankerZeit: 16 * 60,
    erinnerung: null
  },
  {
    id: 'lueften_abend',
    nr: 10,
    kurz: 'Lüften abends',
    titel: 'Abends lüften',
    text: 'Wenn die Sonne weg ist, nochmal lüften',
    icon: 'i-window-night',
    farbe: 't8',
    phase: 'abend',
    zeitText: 'wenn die Sonne weg ist',
    ankerZeit: 20 * 60,
    erinnerung: { zeit: 20 * 60, text: 'Sonne ist weg – nochmal durchlüften.' }
  },
  {
    id: 'abendessen',
    nr: 11,
    kurz: 'Abendessen',
    titel: 'Essen',
    text: 'Abendessen',
    icon: 'i-bowl',
    farbe: 't9',
    phase: 'abend',
    zeitText: 'Abend',
    ankerZeit: 19 * 60,
    erinnerung: null
  },
  {
    id: 'schlafen',
    nr: 12,
    kurz: 'Schlafen',
    titel: 'Schlafen',
    text: 'Gute Nacht!',
    icon: 'i-bed',
    farbe: 't10',
    phase: 'nacht',
    zeitText: 'Nacht',
    ankerZeit: 22 * 60,
    erinnerung: null
  }
]);

/* --- Sondertage ----------------------------------------------------------
   ersetzt = tauscht Inhalt einer Standardaufgabe an genau diesem Tag aus
   zusatz  = zusätzliche Aufgabe, die nur an diesem Tag existiert
   ------------------------------------------------------------------------ */
const SONDERTAGE = Object.freeze({
  '2026-08-20': {
    ersetzt: {
      giessen: {
        titel: 'Rasen mähen',
        text: 'Statt gießen: den Rasen mähen (ab 8 Uhr erlaubt)',
        icon: 'i-mower',
        zeitText: 'ab 8:00 Uhr erlaubt',
        ankerZeit: 8 * 60,
        erinnerung: { zeit: 9 * 60, text: 'Heute Rasen mähen statt gießen.' }
      }
    },
    hinweis: 'Heute wird statt gegossen der Rasen gemäht (ab 8 Uhr erlaubt).'
  },
  '2026-08-24': {
    zusatz: [
      {
        id: 'restmuell',
        nachId: 'lueften_abend',
        kurz: 'Restmüll',
        titel: 'Restmüll rausstellen',
        text: 'Restmüllsack zudrehen, in die Restmülltonne geben und die Tonne rausstellen',
        icon: 'i-trash',
        farbe: 'tx',
        phase: 'abend',
        zeitText: 'abends',
        ankerZeit: 20 * 60 + 30,
        erinnerung: { zeit: 20 * 60 + 30, text: 'Restmüllsack zudrehen und die Tonne rausstellen.' }
      }
    ],
    hinweis: 'Heute abend zusätzlich: Restmüllsack zudrehen, in die Restmülltonne, Tonne rausstellen.'
  },
  '2026-08-26': {
    zusatz: [
      {
        id: 'papiermuell',
        nachId: 'lueften_abend',
        kurz: 'Papiermüll',
        titel: 'Papiermüll rausstellen',
        text: 'Papiermüll in die Papiertonne geben und die Tonne rausstellen',
        icon: 'i-papier',
        farbe: 'ty',
        phase: 'abend',
        zeitText: 'abends',
        ankerZeit: 20 * 60 + 30,
        erinnerung: { zeit: 20 * 60 + 30, text: 'Papiermüll in die Papiertonne und die Tonne rausstellen.' }
      }
    ],
    hinweis: 'Letzter Tag – heute abend zusätzlich: Papiermüll in die Papiertonne geben und die Tonne rausstellen.'
  }
});

/* --- Deutsche Datumsnamen ------------------------------------------------ */
const WOCHENTAGE_KURZ = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const WOCHENTAGE_LANG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MONATE_LANG = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

/* --- Datums-Hilfsfunktionen (bewusst ohne Zeitzonen-Fallen) --------------- */

/** '2026-08-15' -> Date (lokale Mitternacht, kein UTC-Versatz) */
function isoZuDatum(iso) {
  const [j, m, t] = iso.split('-').map(Number);
  return new Date(j, m - 1, t);
}

/** Date -> '2026-08-15' (lokal, nicht toISOString – das rechnet in UTC um) */
function datumZuIso(d) {
  const j = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const t = String(d.getDate()).padStart(2, '0');
  return `${j}-${m}-${t}`;
}

/** Heutiges Datum als ISO-String, lokale Zeit */
function heuteIso() {
  return datumZuIso(new Date());
}

/** Alle Tage des Zeitraums als ISO-Liste */
function baueTagesliste() {
  const liste = [];
  const d = isoZuDatum(ZEITRAUM.start);
  const ende = isoZuDatum(ZEITRAUM.ende);
  while (d <= ende) {
    liste.push(datumZuIso(d));
    d.setDate(d.getDate() + 1);
  }
  return liste;
}

const TAGE = Object.freeze(baueTagesliste());

/* Quelle für selbst angelegte Aufgaben. store.js trägt sich hier ein,
   sobald es geladen ist. Vorher liefert aufgabenFuerTag nur die festen. */
let EIGENE_QUELLE = null;
function setzeEigeneAufgabenQuelle(fn) { EIGENE_QUELLE = typeof fn === 'function' ? fn : null; }

/**
 * Liefert die vollständige, nach Tagesablauf sortierte Aufgabenliste eines Tages
 * inklusive Sondertag-Ersetzungen und Zusatzaufgaben.
 */
function aufgabenFuerTag(iso) {
  const sonder = SONDERTAGE[iso];
  const liste = AUFGABEN.map((a) => {
    const ersatz = sonder && sonder.ersetzt && sonder.ersetzt[a.id];
    return ersatz ? Object.assign({}, a, ersatz, { sonder: true }) : Object.assign({}, a, { sonder: false });
  });

  if (sonder && sonder.zusatz) {
    sonder.zusatz.forEach((z) => {
      const pos = liste.findIndex((a) => a.id === z.nachId);
      const eintrag = Object.assign({}, z, { sonder: true, zusatzAufgabe: true, nr: null });
      if (pos >= 0) liste.splice(pos + 1, 0, eintrag);
      else liste.push(eintrag);
    });
  }

  // Selbst angelegte Aufgaben einsortieren. store.js meldet sich dafür über
  // eigeneAufgabenQuelle() an – ein direkter Zugriff auf die Konstante ginge
  // nicht, weil data.js zuerst geladen wird und ein typeof-Test bei const
  // in der temporalen Totzone selbst einen Fehler auslöst.
  if (EIGENE_QUELLE) {
    EIGENE_QUELLE(iso).forEach((eigene) => {
      if (eigene.ankerZeit === null) { liste.push(eigene); return; }
      // Hinter der letzten Aufgabe einsortieren, die früher dran ist
      let pos = liste.length;
      for (let i = 0; i < liste.length; i++) {
        const z = liste[i].ankerZeit;
        if (z !== null && z > eigene.ankerZeit) { pos = i; break; }
      }
      liste.splice(pos, 0, eigene);
    });
  }

  return liste;
}

/** Gesamtzahl aller Häkchen im ganzen Zeitraum (12 × 12 + 2 Zusatzaufgaben = 146) */
function aufgabenGesamt() {
  return TAGE.reduce((summe, iso) => summe + aufgabenFuerTag(iso).length, 0);
}

/**
 * Jede vorkommende Aufgabenart genau einmal – die täglichen plus alle
 * Zusatzaufgaben der Sondertage. Für Statistik und Erinnerungs-Einstellungen.
 */
function alleAufgabenArten() {
  const liste = AUFGABEN.slice();
  Object.keys(SONDERTAGE).forEach((iso) => {
    (SONDERTAGE[iso].zusatz || []).forEach((z) => {
      if (!liste.some((a) => a.id === z.id)) liste.push(Object.assign({}, z, { nurAm: iso }));
    });
  });
  return liste;
}

/* --- Formatierungen ------------------------------------------------------ */

function wochentagKurz(iso) { return WOCHENTAGE_KURZ[isoZuDatum(iso).getDay()]; }
function wochentagLang(iso) { return WOCHENTAGE_LANG[isoZuDatum(iso).getDay()]; }
function istWochenende(iso) { const t = isoZuDatum(iso).getDay(); return t === 0 || t === 6; }

/** '2026-08-15' -> '15.08.' */
function datumKurz(iso) {
  const d = isoZuDatum(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`;
}

/** '2026-08-15' -> 'Samstag, 15. August 2026' */
function datumLang(iso) {
  const d = isoZuDatum(iso);
  return `${WOCHENTAGE_LANG[d.getDay()]}, ${d.getDate()}. ${MONATE_LANG[d.getMonth()]} ${d.getFullYear()}`;
}

/** Abstand in Tagen zwischen zwei ISO-Daten (b - a) */
function tageDazwischen(aIso, bIso) {
  const a = isoZuDatum(aIso), b = isoZuDatum(bIso);
  return Math.round((b - a) / 86400000);
}

/** 'Heute', 'Morgen', 'Gestern', 'in 3 Tagen', 'vor 3 Tagen' oder null */
function relativerTag(iso, bezugIso) {
  const diff = tageDazwischen(bezugIso || heuteIso(), iso);
  if (diff === 0) return 'Heute';
  if (diff === 1) return 'Morgen';
  if (diff === -1) return 'Gestern';
  if (diff === 2) return 'Übermorgen';
  if (diff > 0) return `in ${diff} Tagen`;
  return `vor ${Math.abs(diff)} Tagen`;
}

/** Minuten seit Mitternacht -> '14:30' */
function minutenZuUhr(min) {
  const h = Math.floor(min / 60), m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Welcher Tag der Liste soll beim Start gezeigt werden?
 * Vor dem Zeitraum -> erster Tag, danach -> letzter Tag, sonst heute.
 */
function startTag() {
  const h = heuteIso();
  if (h < ZEITRAUM.start) return TAGE[0];
  if (h > ZEITRAUM.ende) return TAGE[TAGE.length - 1];
  return h;
}

/** Liegt das heutige Datum im Zeitraum? */
function heuteImZeitraum() {
  const h = heuteIso();
  return h >= ZEITRAUM.start && h <= ZEITRAUM.ende;
}

/* --- Motivationssprüche -------------------------------------------------- */
const SPRUECHE_TAG_KOMPLETT = [
  'Tag komplett! Richtig stark.',
  'Alles erledigt – Feierabend verdient.',
  'Sauber durchgezogen. Alle Haken sitzen.',
  'Fertig für heute. Das war’s, gut gemacht!',
  'Kompletter Tag. Läuft bei dir.',
  'Alle zehn Punkte – perfekt.',
  'Erledigt. Zeit zum Entspannen.',
  'Voller Erfolg heute!'
];

const SPRUECHE_ZWISCHEN = [
  'Weiter so!', 'Läuft.', 'Gut gemacht.', 'Sauber.', 'Passt.',
  'Nächster Punkt!', 'Stark.', 'Abgehakt.', 'Schon wieder einer!', 'Top.'
];

/* --- Erfolge / Abzeichen -------------------------------------------------
   pruef(ctx) bekommt: { erledigt, gesamt, tageKomplett, streakBest,
                          notizenAnzahl, sonderErledigt, frueheHaken }
   ------------------------------------------------------------------------ */
const ERFOLGE = Object.freeze([
  { id: 'start',      titel: 'Losgelegt',        text: 'Das erste Häkchen gesetzt',              icon: 'i-check',   pruef: (c) => c.erledigt >= 1 },
  { id: 'zehn',       titel: 'Zehn geschafft',   text: '10 Aufgaben erledigt',                   icon: 'i-star',    pruef: (c) => c.erledigt >= 10 },
  { id: 'tag1',       titel: 'Erster ganzer Tag',text: 'Einen Tag komplett abgehakt',            icon: 'i-trophy',  pruef: (c) => c.tageKomplett >= 1 },
  { id: 'haelfte',    titel: 'Halbzeit',         text: 'Die Hälfte aller Aufgaben erledigt',     icon: 'i-chart',   pruef: (c) => c.erledigt >= Math.ceil(c.gesamt / 2) },
  { id: 'streak3',    titel: 'Drei am Stück',    text: '3 komplette Tage hintereinander',        icon: 'i-flame',   pruef: (c) => c.streakBest >= 3 },
  { id: 'streak7',    titel: 'Eine ganze Woche', text: '7 komplette Tage hintereinander',        icon: 'i-flame',   pruef: (c) => c.streakBest >= 7 },
  { id: 'notiz',      titel: 'Aufgefallen',      text: 'Die erste Notiz geschrieben',            icon: 'i-note',    pruef: (c) => c.notizenAnzahl >= 1 },
  { id: 'notiz5',     titel: 'Genauer Beobachter', text: 'An 5 Tagen etwas notiert',             icon: 'i-note',    pruef: (c) => c.notizenAnzahl >= 5 },
  { id: 'rasen',      titel: 'Rasenmäher',       text: 'Am 20.08. den Rasen gemäht',             icon: 'i-mower',   pruef: (c) => c.sonderErledigt.rasen },
  { id: 'muell',      titel: 'Tonne draußen',    text: 'Am 24.08. den Restmüll rausgestellt',    icon: 'i-trash',   pruef: (c) => c.sonderErledigt.muell },
  { id: 'papier',     titel: 'Altpapier',        text: 'Am 26.08. den Papiermüll rausgestellt',  icon: 'i-papier',  pruef: (c) => c.sonderErledigt.papier },
  { id: 'postbote',   titel: 'Postfach geleert', text: 'An 6 Tagen nach der Post geschaut',      icon: 'i-post',    pruef: (c) => c.postTage >= 6 },
  { id: 'fotograf',   titel: 'Beweisfoto',       text: 'Ein Foto zu einer Notiz gespeichert',    icon: 'i-kamera',  pruef: (c) => c.fotosAnzahl >= 1 },
  { id: 'frueh',      titel: 'Frühaufsteher',    text: 'Vor 9 Uhr das erste Häkchen gesetzt',    icon: 'i-sun',     pruef: (c) => c.frueheHaken >= 1 },
  { id: 'alles',      titel: 'Alles erledigt',   text: 'Wirklich jede Aufgabe abgehakt',         icon: 'i-crown',   pruef: (c) => c.gesamt > 0 && c.erledigt >= c.gesamt }
]);
