/* ============================================================================
   plan.js – Wann welche Erinnerung fällig ist
   ----------------------------------------------------------------------------
   Bewusst eine eigenständige, kleine Kopie der Zeiten aus
   assets/js/data.js. Grund: der Server muss auch dann Erinnerungen
   verschicken können, wenn seit dem Start noch kein Gerät die Seite
   geöffnet hat. Sobald ein Gerät seinen eigenen Plan hochlädt
   (POST /api/plan), gilt dieser – damit wirken eigene Uhrzeiten aus den
   Einstellungen auch auf dem Server.

   Beim Ändern der Zeiten in data.js hier mit anpassen.
   ========================================================================== */
'use strict';

const START = '2026-08-15';
const ENDE = '2026-08-26';

const TAEGLICH = [
  { id: 'lueften_frueh', zeit: 7 * 60 + 30, titel: 'Lüften in der Früh', text: 'Fenster auf – einmal gut durchlüften.' },
  { id: 'fruehstueck',   zeit: 8 * 60,      titel: 'Frühstücken',        text: 'Zeit fürs Frühstück.' },
  { id: 'giessen',       zeit: 10 * 60,     titel: 'Gießen',             text: 'Schau kurz, ob gegossen werden muss.' },
  { id: 'mittagessen',   zeit: 14 * 60,     titel: 'Essen',              text: 'Mittagessen nicht vergessen.' },
  { id: 'post',          zeit: 14 * 60,     titel: 'Post schauen',       text: 'Alles mit Namen, Billa und Lidl aufheben. Unsicher? Bild schicken.' },
  { id: 'rundgang',      zeit: 15 * 60,     titel: 'Rundgang ums Haus',  text: 'Zweiter Rundgang ums Haus.' },
  { id: 'lueften_abend', zeit: 20 * 60,     titel: 'Abends lüften',      text: 'Sonne ist weg – nochmal durchlüften.' }
];

// Abweichungen und Zusätze an einzelnen Tagen
const SONDER = {
  '2026-08-20': {
    ersetzt: { giessen: { zeit: 9 * 60, titel: 'Rasen mähen', text: 'Heute Rasen mähen statt gießen (ab 8 Uhr erlaubt).' } }
  },
  '2026-08-24': {
    zusatz: [{ id: 'restmuell', zeit: 20 * 60 + 30, titel: 'Restmüll rausstellen', text: 'Restmüllsack zudrehen und die Tonne rausstellen.' }]
  },
  '2026-08-26': {
    zusatz: [{ id: 'papiermuell', zeit: 20 * 60 + 30, titel: 'Papiermüll rausstellen', text: 'Papiermüll in die Papiertonne und die Tonne rausstellen.' }]
  }
};

function tageListe() {
  const liste = [];
  const [j, m, t] = START.split('-').map(Number);
  const d = new Date(j, m - 1, t);
  const [ej, em, et] = ENDE.split('-').map(Number);
  const ende = new Date(ej, em - 1, et);
  while (d <= ende) {
    liste.push(
      d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0')
    );
    d.setDate(d.getDate() + 1);
  }
  return liste;
}

/** Alle Erinnerungen eines Tages, nach Uhrzeit sortiert */
function fuerTag(iso) {
  const sonder = SONDER[iso] || {};
  const liste = TAEGLICH.map((e) => {
    const ersatz = sonder.ersetzt && sonder.ersetzt[e.id];
    return Object.assign({}, e, ersatz || {});
  });
  (sonder.zusatz || []).forEach((z) => liste.push(Object.assign({}, z)));
  return liste.sort((a, b) => a.zeit - b.zeit);
}

/** Der komplette Standardplan als flache Liste */
function standardPlan() {
  const plan = [];
  tageListe().forEach((iso) => {
    fuerTag(iso).forEach((e) => plan.push({ datum: iso, id: e.id, zeit: e.zeit, titel: e.titel, text: e.text }));
  });
  return plan;
}

/** Hochgeladenen Plan auf Plausibilität prüfen */
function planPruefen(roh) {
  if (!Array.isArray(roh)) return null;
  const sauber = roh.filter((e) =>
    e && typeof e === 'object' &&
    /^\d{4}-\d{2}-\d{2}$/.test(e.datum) &&
    typeof e.id === 'string' && e.id.length <= 40 &&
    Number.isFinite(e.zeit) && e.zeit >= 0 && e.zeit < 1440 &&
    typeof e.titel === 'string' && typeof e.text === 'string'
  ).slice(0, 500).map((e) => ({
    datum: e.datum, id: e.id, zeit: Math.round(e.zeit),
    titel: e.titel.slice(0, 120), text: e.text.slice(0, 300)
  }));
  return sauber.length ? sauber : null;
}

module.exports = { START, ENDE, tageListe, fuerTag, standardPlan, planPruefen };
