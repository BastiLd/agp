/* ============================================================================
   merge.js – Zusammenführen zweier Stände (Serverseite)
   ----------------------------------------------------------------------------
   Spiegelt bewusst exakt die Regel aus assets/js/store.js:
   Jedes Häkchen hat einen Zeitstempel, jedes Entfernen ebenfalls
   („Grabstein"). Der jüngere Eintrag gewinnt, bei Gleichstand „erledigt".
   Dadurch ist es egal, in welcher Reihenfolge Geräte abgleichen.
   ========================================================================== */
'use strict';

function leererStand() {
  return { v: 5, erledigt: {}, entfernt: {}, notizen: {}, erfolge: {}, eigeneAufgaben: [], geaendert: 0 };
}

function saeubern(roh) {
  const s = leererStand();
  if (!roh || typeof roh !== 'object') return s;

  ['erledigt', 'entfernt'].forEach((feld) => {
    const quelle = roh[feld];
    if (!quelle || typeof quelle !== 'object') return;
    Object.keys(quelle).forEach((iso) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return;
      const tag = quelle[iso];
      if (!tag || typeof tag !== 'object') return;
      Object.keys(tag).forEach((id) => {
        const ts = tag[id];
        if (typeof ts === 'number' && isFinite(ts) && ts > 0) {
          if (!s[feld][iso]) s[feld][iso] = {};
          s[feld][iso][String(id).slice(0, 40)] = ts;
        }
      });
    });
  });

  if (roh.notizen && typeof roh.notizen === 'object') {
    Object.keys(roh.notizen).forEach((iso) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return;
      const n = roh.notizen[iso];
      if (n && typeof n.text === 'string') {
        s.notizen[iso] = { text: n.text.slice(0, 8000), ts: Number(n.ts) || 0 };
      }
    });
  }

  if (roh.erfolge && typeof roh.erfolge === 'object') {
    Object.keys(roh.erfolge).forEach((id) => {
      const ts = roh.erfolge[id];
      if (typeof ts === 'number' && ts > 0) s.erfolge[String(id).slice(0, 40)] = ts;
    });
  }

  // Selbst angelegte Aufgaben: nur plausible Eintraege uebernehmen
  if (Array.isArray(roh.eigeneAufgaben)) {
    s.eigeneAufgaben = roh.eigeneAufgaben.filter((a) =>
      a && typeof a === 'object' && typeof a.id === 'string' && a.id.length <= 40 &&
      typeof a.titel === 'string'
    ).slice(0, 200).map((a) => ({
      id: a.id,
      titel: String(a.titel).slice(0, 80),
      text: String(a.text || '').slice(0, 240),
      datum: /^\d{4}-\d{2}-\d{2}$/.test(a.datum || '') ? a.datum : null,
      zeit: (Number.isFinite(a.zeit) && a.zeit >= 0 && a.zeit < 1440) ? Math.round(a.zeit) : null,
      erinnern: !!a.erinnern,
      farbe: String(a.farbe || 'te').slice(0, 12),
      icon: String(a.icon || 'i-stern-liste').slice(0, 32),
      geloescht: Number(a.geloescht) || undefined,
      ts: Number(a.ts) || 0
    }));
  }

  s.geaendert = Number(roh.geaendert) || 0;
  return s;
}

/** Liefert einen neuen Stand aus a und b. Verändert die Eingaben nicht. */
function zusammenfuehren(a, b) {
  const A = saeubern(a);
  const B = saeubern(b);
  const erg = leererStand();

  const tage = new Set([].concat(
    Object.keys(A.erledigt), Object.keys(A.entfernt),
    Object.keys(B.erledigt), Object.keys(B.entfernt)
  ));

  tage.forEach((iso) => {
    const ids = new Set([].concat(
      Object.keys(A.erledigt[iso] || {}), Object.keys(A.entfernt[iso] || {}),
      Object.keys(B.erledigt[iso] || {}), Object.keys(B.entfernt[iso] || {})
    ));
    ids.forEach((id) => {
      const an  = Math.max((A.erledigt[iso] || {})[id] || 0, (B.erledigt[iso] || {})[id] || 0);
      const aus = Math.max((A.entfernt[iso] || {})[id] || 0, (B.entfernt[iso] || {})[id] || 0);
      if (!an && !aus) return;
      if (an >= aus) {
        if (!erg.erledigt[iso]) erg.erledigt[iso] = {};
        erg.erledigt[iso][id] = an;
        if (aus) { if (!erg.entfernt[iso]) erg.entfernt[iso] = {}; erg.entfernt[iso][id] = aus; }
      } else {
        if (!erg.entfernt[iso]) erg.entfernt[iso] = {};
        erg.entfernt[iso][id] = aus;
      }
    });
  });

  new Set([].concat(Object.keys(A.notizen), Object.keys(B.notizen))).forEach((iso) => {
    const na = A.notizen[iso], nb = B.notizen[iso];
    if (na && nb) erg.notizen[iso] = (nb.ts > na.ts) ? nb : na;
    else erg.notizen[iso] = na || nb;
  });

  new Set([].concat(Object.keys(A.erfolge), Object.keys(B.erfolge))).forEach((id) => {
    const ta = A.erfolge[id] || Infinity, tb = B.erfolge[id] || Infinity;
    erg.erfolge[id] = Math.min(ta, tb);      // der frühere Zeitpunkt zählt
  });

  // Eigene Aufgaben: je Eintrag gewinnt der juengere Zeitstempel
  const nachId = {};
  A.eigeneAufgaben.concat(B.eigeneAufgaben).forEach((a) => {
    const da = nachId[a.id];
    if (!da || (a.ts || 0) > (da.ts || 0)) nachId[a.id] = a;
  });
  erg.eigeneAufgaben = Object.keys(nachId).sort().map((k) => nachId[k]);

  erg.geaendert = Math.max(A.geaendert, B.geaendert, Date.now());
  return sortiert(erg);
}

/**
 * Schlüssel alphabetisch ordnen. Damit hängt die gespeicherte Datei nicht
 * davon ab, in welcher Reihenfolge die Geräte abgeglichen haben – zwei
 * inhaltsgleiche Stände ergeben dieselbe Datei.
 */
function sortiert(stand) {
  const neu = { v: stand.v, erledigt: {}, entfernt: {}, notizen: {}, erfolge: {},
                eigeneAufgaben: stand.eigeneAufgaben || [], geaendert: stand.geaendert };
  ['erledigt', 'entfernt'].forEach((feld) => {
    Object.keys(stand[feld]).sort().forEach((iso) => {
      const tag = {};
      Object.keys(stand[feld][iso]).sort().forEach((id) => { tag[id] = stand[feld][iso][id]; });
      if (Object.keys(tag).length) neu[feld][iso] = tag;
    });
  });
  Object.keys(stand.notizen).sort().forEach((iso) => { neu.notizen[iso] = stand.notizen[iso]; });
  Object.keys(stand.erfolge).sort().forEach((id) => { neu.erfolge[id] = stand.erfolge[id]; });
  return neu;
}

function istErledigt(stand, iso, id) {
  return !!(stand && stand.erledigt && stand.erledigt[iso] && stand.erledigt[iso][id]);
}

/** Fotos: Vereinigung, gelöschte bleiben gelöscht */
function fotosZusammenfuehren(a, b, maxProTag) {
  const grenze = maxProTag || 3;
  const A = (a && typeof a === 'object') ? a : {};
  const B = (b && typeof b === 'object') ? b : {};
  const erg = { v: 1, tage: {}, geloescht: {}, geaendert: Date.now() };

  [A, B].forEach((q) => {
    Object.keys(q.geloescht || {}).forEach((id) => {
      const ts = q.geloescht[id];
      if (typeof ts === 'number' && (!erg.geloescht[id] || erg.geloescht[id] < ts)) erg.geloescht[id] = ts;
    });
  });

  [A, B].forEach((q) => {
    Object.keys(q.tage || {}).forEach((iso) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return;
      (q.tage[iso] || []).forEach((f) => {
        if (!f || !f.id || typeof f.bild !== 'string') return;
        if (erg.geloescht[f.id]) return;
        if (!erg.tage[iso]) erg.tage[iso] = [];
        if (erg.tage[iso].some((e) => e.id === f.id)) return;
        if (erg.tage[iso].length >= grenze) return;
        erg.tage[iso].push({ id: f.id, bild: f.bild, ts: Number(f.ts) || Date.now(), name: String(f.name || '').slice(0, 120) });
      });
    });
  });

  Object.keys(erg.tage).forEach((iso) => {
    erg.tage[iso].sort((x, y) => x.ts - y.ts);
    if (!erg.tage[iso].length) delete erg.tage[iso];
  });
  return erg;
}

module.exports = { leererStand, saeubern, zusammenfuehren, sortiert, istErledigt, fotosZusammenfuehren };
