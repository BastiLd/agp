/* ============================================================================
   server.js – Aufgabenliste als eigener kleiner Server
   ----------------------------------------------------------------------------
   Kann drei Dinge:
     1. die Webseite ausliefern (Ordner public/)
     2. den Stand aller Geräte abgleichen  (/api/stand)
     3. echte Push-Benachrichtigungen verschicken, auch wenn die App
        geschlossen ist (/api/abo + Zeitplaner)

   Läuft mit Node ab Version 18 und braucht kein einziges Fremdpaket.

   Umgebungsvariablen (alle freiwillig):
     PORT               Port, Vorgabe 8080
     TZ                 Zeitzone, im Docker-Compose auf Europe/Vienna gesetzt
     KONTAKT            mailto:… für VAPID, Vorgabe mailto:aufgaben@example.org
     ZUGANG             wenn gesetzt, verlangt die API den Kopf X-Zugang
     ERLAUBTE_HERKUNFT  Komma-Liste für CORS, z. B. https://bastild.github.io
     DATEN              Ordner für die Dateien, Vorgabe ./daten
   ========================================================================== */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const push = require('./push.js');
const merge = require('./merge.js');
const plan = require('./plan.js');

/* --- Einstellungen -------------------------------------------------------- */
const PORT = Number(process.env.PORT) || 8080;
const KONTAKT = process.env.KONTAKT || 'mailto:aufgaben@example.org';
const ZUGANG = process.env.ZUGANG || '';
const HERKUNFT = (process.env.ERLAUBTE_HERKUNFT || '').split(',').map((s) => s.trim()).filter(Boolean);
const WURZEL = path.resolve(__dirname, '..');
const OEFFENTLICH = path.join(WURZEL, 'public');
const DATEN = path.resolve(process.env.DATEN || path.join(WURZEL, 'daten'));
const VERSION = '2.0.0';

const GRENZE_NORMAL = 2 * 1024 * 1024;      // 2 MB
const GRENZE_FOTOS = 16 * 1024 * 1024;      // 16 MB

/* ==========================================================================
   Kleine Dateiablage (atomar schreiben, damit nichts halb geschrieben wird)
   ========================================================================== */
function sicherstellen() {
  if (!fs.existsSync(DATEN)) fs.mkdirSync(DATEN, { recursive: true });
}

function lies(name, vorgabe) {
  try {
    const roh = fs.readFileSync(path.join(DATEN, name), 'utf8');
    return JSON.parse(roh);
  } catch (e) {
    if (e.code !== 'ENOENT') console.error('[daten] ' + name + ' unlesbar:', e.message);
    return vorgabe;
  }
}

function schreib(name, wert) {
  sicherstellen();
  const ziel = path.join(DATEN, name);
  const temp = ziel + '.tmp';
  try {
    fs.writeFileSync(temp, JSON.stringify(wert), 'utf8');
    fs.renameSync(temp, ziel);
    return true;
  } catch (e) {
    console.error('[daten] ' + name + ' nicht schreibbar:', e.message);
    try { fs.unlinkSync(temp); } catch (x) { /* egal */ }
    return false;
  }
}

/* ==========================================================================
   Zustand im Speicher
   ========================================================================== */
sicherstellen();

let vapid = lies('vapid.json', null);
if (!vapid || !vapid.oeffentlich || !vapid.privat) {
  vapid = push.schluesselErzeugen();
  schreib('vapid.json', vapid);
  console.log('[push] Neues VAPID-Schlüsselpaar erzeugt und in daten/vapid.json abgelegt.');
}

let stand = merge.saeubern(lies('stand.json', merge.leererStand()));
let fotos = lies('fotos.json', { v: 1, tage: {}, geloescht: {}, geaendert: 0 });
let abos = lies('abos.json', []);
let gesendet = lies('gesendet.json', {});     // { 'datum:id': zeitstempel }
let verschoben = lies('verschoben.json', {}); // { 'datum:id': nicht-vor-Zeitstempel }
let eigenerPlan = lies('plan.json', null);
const protokoll = [];                          // letzte Push-Versuche, nur im Speicher

function protokollieren(eintrag) {
  protokoll.unshift(Object.assign({ zeit: new Date().toISOString() }, eintrag));
  if (protokoll.length > 60) protokoll.length = 60;
}

/* ==========================================================================
   Hilfsfunktionen
   ========================================================================== */
function heuteIso(d) {
  const t = d || new Date();
  return t.getFullYear() + '-' +
    String(t.getMonth() + 1).padStart(2, '0') + '-' +
    String(t.getDate()).padStart(2, '0');
}

function jetztMinuten() {
  const t = new Date();
  return t.getHours() * 60 + t.getMinutes();
}

function aktuellerPlan() {
  return eigenerPlan && eigenerPlan.length ? eigenerPlan : plan.standardPlan();
}

/* ==========================================================================
   Push verschicken
   ========================================================================== */
async function anAlleSenden(nachricht) {
  if (!abos.length) return { versucht: 0, ok: 0, entfernt: 0 };
  const text = JSON.stringify(nachricht);
  let ok = 0, entfernt = 0;
  const bleiben = [];

  for (const abo of abos) {
    const ergebnis = await push.senden(abo, text, vapid, KONTAKT, 3600);
    if (ergebnis.ok) { ok++; bleiben.push(abo); }
    else if (ergebnis.wegwerfen) {
      entfernt++;
      console.log('[push] Abo abgelaufen, wird entfernt (' + ergebnis.status + '): ' + abo.geraet);
    } else {
      bleiben.push(abo);
      console.warn('[push] Fehlgeschlagen (' + ergebnis.status + '): ' + (ergebnis.fehler || ''));
    }
  }

  if (entfernt) { abos = bleiben; schreib('abos.json', abos); }
  protokollieren({ titel: nachricht.titel, versucht: abos.length + entfernt, ok, entfernt });
  return { versucht: abos.length + entfernt, ok, entfernt };
}

/* ==========================================================================
   Zeitplaner – prüft jede halbe Minute, was fällig ist
   ========================================================================== */
let planerLaeuft = false;

async function planerSchritt() {
  if (planerLaeuft || !abos.length) return;
  planerLaeuft = true;
  try {
    const heute = heuteIso();
    const minuten = jetztMinuten();
    const jetzt = Date.now();

    const faellig = aktuellerPlan().filter((e) => {
      if (e.datum !== heute) return false;
      const schluessel = e.datum + ':' + e.id;
      if (gesendet[schluessel]) return false;
      if (verschoben[schluessel] && jetzt < verschoben[schluessel]) return false;
      if (merge.istErledigt(stand, e.datum, e.id)) return false;
      // Im Fenster von 90 Minuten nach der Uhrzeit erinnern, danach nicht mehr
      const ab = verschoben[schluessel] ? minuten : e.zeit;
      return minuten >= ab && minuten < e.zeit + 90;
    });

    if (!faellig.length) return;

    // Mehrere gleichzeitig fällige Punkte zu einer Nachricht bündeln
    const nachricht = faellig.length === 1
      ? { titel: faellig[0].titel, text: faellig[0].text, tag: heute, aufgabe: faellig[0].id }
      : {
          titel: faellig.length + ' Aufgaben stehen an',
          text: faellig.map((e) => e.titel).join(' · '),
          tag: heute,
          aufgabe: faellig[0].id
        };

    const ergebnis = await anAlleSenden(nachricht);
    if (ergebnis.ok > 0 || ergebnis.versucht === 0) {
      faellig.forEach((e) => { gesendet[e.datum + ':' + e.id] = jetzt; });
      // alte Einträge aufräumen
      Object.keys(gesendet).forEach((k) => { if (jetzt - gesendet[k] > 5 * 86400000) delete gesendet[k]; });
      schreib('gesendet.json', gesendet);
    }
    console.log('[planer] ' + faellig.length + ' Erinnerung(en) verschickt an ' + ergebnis.ok + ' Gerät(e).');
  } catch (fehler) {
    console.error('[planer] Fehler:', fehler);
  } finally {
    planerLaeuft = false;
  }
}

setInterval(planerSchritt, 30000);
setTimeout(planerSchritt, 5000);

/* ==========================================================================
   HTTP
   ========================================================================== */
const TYPEN = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8'
};

function kopfCors(anfrage, antwort) {
  const herkunft = anfrage.headers.origin;
  if (herkunft && HERKUNFT.includes(herkunft)) {
    antwort.setHeader('Access-Control-Allow-Origin', herkunft);
    antwort.setHeader('Access-Control-Allow-Credentials', 'true');
    antwort.setHeader('Vary', 'Origin');
  }
  antwort.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  antwort.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Zugang');
}

function jsonAntwort(antwort, status, koerper) {
  const text = JSON.stringify(koerper);
  antwort.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(text),
    'Cache-Control': 'no-store'
  });
  antwort.end(text);
}

function koerperLesen(anfrage, grenze) {
  return new Promise((fertig, fehlgeschlagen) => {
    let groesse = 0;
    let zuGross = false;
    let teile = [];

    anfrage.on('data', (stueck) => {
      groesse += stueck.length;
      if (groesse > grenze) {
        // Ab hier nichts mehr sammeln, den Rest aber noch entgegennehmen –
        // sonst bekommt der Browser einen Verbindungsabbruch statt einer
        // verständlichen Fehlermeldung.
        zuGross = true;
        teile = [];
        // Notbremse gegen wirklich absurde Mengen
        if (groesse > grenze * 4) anfrage.destroy();
        return;
      }
      teile.push(stueck);
    });

    anfrage.on('end', () => {
      if (zuGross) {
        const fehler = new Error('Die Daten sind zu groß: ' + Math.round(groesse / 1024) +
          ' KB, erlaubt sind ' + Math.round(grenze / 1024) + ' KB.');
        fehler.status = 413;
        fehlgeschlagen(fehler);
        return;
      }
      if (!teile.length) { fertig({}); return; }
      try { fertig(JSON.parse(Buffer.concat(teile).toString('utf8'))); }
      catch (e) { fehlgeschlagen(new Error('Die Daten sind kein gültiges JSON.')); }
    });

    anfrage.on('error', fehlgeschlagen);
    anfrage.on('aborted', () => fehlgeschlagen(new Error('Die Übertragung wurde abgebrochen.')));
  });
}

function zugangOk(anfrage) {
  if (!ZUGANG) return true;
  return anfrage.headers['x-zugang'] === ZUGANG;
}

/* --- statische Dateien ---------------------------------------------------- */
function dateiAusliefern(antwort, pfad, anfrage) {
  fs.stat(pfad, (fehler, info) => {
    if (fehler || !info.isFile()) { nichtGefunden(antwort); return; }

    const endung = path.extname(pfad).toLowerCase();
    const marke = '"' + info.size + '-' + Math.round(info.mtimeMs) + '"';
    if (anfrage.headers['if-none-match'] === marke) { antwort.writeHead(304).end(); return; }

    // Seite und Programmcode immer nachprüfen, Symbole dürfen lange liegen bleiben
    const langlebig = ['.png', '.svg', '.jpg', '.jpeg', '.ico'].includes(endung);
    antwort.writeHead(200, {
      'Content-Type': TYPEN[endung] || 'application/octet-stream',
      'Content-Length': info.size,
      'ETag': marke,
      'Cache-Control': langlebig ? 'public, max-age=604800' : 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    fs.createReadStream(pfad).pipe(antwort);
  });
}

function nichtGefunden(antwort) {
  antwort.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  antwort.end('Nicht gefunden');
}

/* ==========================================================================
   Anfragen bearbeiten
   ========================================================================== */
const server = http.createServer(async (anfrage, antwort) => {
  const adresse = new URL(anfrage.url, 'http://' + (anfrage.headers.host || 'localhost'));
  const weg = decodeURIComponent(adresse.pathname);

  if (anfrage.method === 'OPTIONS') { kopfCors(anfrage, antwort); antwort.writeHead(204).end(); return; }

  /* ---------------------------------------------------------------- API --- */
  if (weg.startsWith('/api/')) {
    kopfCors(anfrage, antwort);

    if (!zugangOk(anfrage)) { jsonAntwort(antwort, 401, { ok: false, fehler: 'Zugangsschlüssel fehlt oder stimmt nicht.' }); return; }

    try {
      /* Auskunft über den Server */
      if (weg === '/api/info' && anfrage.method === 'GET') {
        jsonAntwort(antwort, 200, {
          ok: true,
          version: VERSION,
          push: true,
          vapid: vapid.oeffentlich,
          abos: abos.length,
          zeit: new Date().toISOString(),
          zeitzone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          ortszeit: new Date().toLocaleString('de-AT'),
          eigenerPlan: !!(eigenerPlan && eigenerPlan.length),
          sicher: anfrage.headers['x-forwarded-proto'] === 'https' || adresse.protocol === 'https:'
        });
        return;
      }

      /* Stand abholen */
      if (weg === '/api/stand' && anfrage.method === 'GET') {
        jsonAntwort(antwort, 200, { ok: true, stand });
        return;
      }

      /* Stand abgleichen */
      if (weg === '/api/stand' && anfrage.method === 'POST') {
        const rein = await koerperLesen(anfrage, GRENZE_NORMAL);
        stand = merge.zusammenfuehren(stand, rein.stand || rein);
        schreib('stand.json', stand);
        jsonAntwort(antwort, 200, { ok: true, stand });
        return;
      }

      /* Fotos */
      if (weg === '/api/fotos' && anfrage.method === 'GET') {
        jsonAntwort(antwort, 200, { ok: true, fotos });
        return;
      }
      if (weg === '/api/fotos' && anfrage.method === 'POST') {
        const rein = await koerperLesen(anfrage, GRENZE_FOTOS);
        fotos = merge.fotosZusammenfuehren(fotos, rein.fotos || rein, 3);
        schreib('fotos.json', fotos);
        jsonAntwort(antwort, 200, { ok: true, fotos });
        return;
      }

      /* Push: Schlüssel */
      if (weg === '/api/vapid' && anfrage.method === 'GET') {
        jsonAntwort(antwort, 200, { ok: true, schluessel: vapid.oeffentlich });
        return;
      }

      /* Push: anmelden */
      if (weg === '/api/abo' && anfrage.method === 'POST') {
        const rein = await koerperLesen(anfrage, GRENZE_NORMAL);
        const abo = rein.abo || rein;
        if (!abo || typeof abo.endpoint !== 'string' || !abo.keys || !abo.keys.p256dh || !abo.keys.auth) {
          jsonAntwort(antwort, 400, { ok: false, fehler: 'Das Abo ist unvollständig.' });
          return;
        }
        const eintrag = {
          endpoint: abo.endpoint,
          keys: { p256dh: String(abo.keys.p256dh), auth: String(abo.keys.auth) },
          geraet: String(rein.geraet || abo.geraet || 'unbenannt').slice(0, 60),
          seit: Date.now()
        };
        abos = abos.filter((a) => a.endpoint !== eintrag.endpoint);
        abos.push(eintrag);
        schreib('abos.json', abos);
        console.log('[push] Neues Gerät angemeldet: ' + eintrag.geraet + ' (insgesamt ' + abos.length + ')');
        jsonAntwort(antwort, 200, { ok: true, abos: abos.length });
        return;
      }

      /* Push: abmelden */
      if (weg === '/api/abo/weg' && anfrage.method === 'POST') {
        const rein = await koerperLesen(anfrage, GRENZE_NORMAL);
        const vorher = abos.length;
        abos = abos.filter((a) => a.endpoint !== rein.endpoint);
        if (abos.length !== vorher) schreib('abos.json', abos);
        jsonAntwort(antwort, 200, { ok: true, entfernt: vorher - abos.length, abos: abos.length });
        return;
      }

      /* Push: Probe */
      if (weg === '/api/push/test' && anfrage.method === 'POST') {
        const ergebnis = await anAlleSenden({
          titel: 'Test-Erinnerung',
          text: 'Wenn du das liest, funktionieren die Benachrichtigungen.',
          tag: heuteIso(),
          test: true
        });
        jsonAntwort(antwort, 200, Object.assign({ ok: ergebnis.ok > 0 }, ergebnis));
        return;
      }

      /* Eigenen Erinnerungsplan hinterlegen */
      if (weg === '/api/plan' && anfrage.method === 'POST') {
        const rein = await koerperLesen(anfrage, GRENZE_NORMAL);
        const geprueft = plan.planPruefen(rein.plan);
        if (!geprueft) { jsonAntwort(antwort, 400, { ok: false, fehler: 'Der Plan ist leer oder fehlerhaft.' }); return; }
        eigenerPlan = geprueft;
        schreib('plan.json', eigenerPlan);
        jsonAntwort(antwort, 200, { ok: true, eintraege: eigenerPlan.length });
        return;
      }

      /* Erinnerung verschieben */
      if (weg === '/api/schlummer' && anfrage.method === 'POST') {
        const rein = await koerperLesen(anfrage, GRENZE_NORMAL);
        const schluessel = String(rein.tag) + ':' + String(rein.aufgabe);
        const minuten = Math.min(240, Math.max(5, Number(rein.minuten) || 30));
        delete gesendet[schluessel];
        verschoben[schluessel] = Date.now() + minuten * 60000;
        schreib('gesendet.json', gesendet);
        schreib('verschoben.json', verschoben);
        jsonAntwort(antwort, 200, { ok: true, minuten });
        return;
      }

      /* Kurzer Blick in den Maschinenraum */
      if (weg === '/api/status' && anfrage.method === 'GET') {
        const heute = heuteIso();
        jsonAntwort(antwort, 200, {
          ok: true,
          version: VERSION,
          ortszeit: new Date().toLocaleString('de-AT'),
          zeitzone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          abos: abos.map((a) => ({ geraet: a.geraet, seit: new Date(a.seit).toLocaleString('de-AT'), dienst: new URL(a.endpoint).host })),
          heuteGeplant: aktuellerPlan().filter((e) => e.datum === heute)
            .map((e) => ({
              zeit: String(Math.floor(e.zeit / 60)).padStart(2, '0') + ':' + String(e.zeit % 60).padStart(2, '0'),
              titel: e.titel,
              erledigt: merge.istErledigt(stand, e.datum, e.id),
              verschickt: !!gesendet[e.datum + ':' + e.id]
            })),
          haekchen: Object.keys(stand.erledigt).reduce((s, iso) => s + Object.keys(stand.erledigt[iso]).length, 0),
          notizen: Object.keys(stand.notizen).length,
          fotos: Object.keys(fotos.tage || {}).reduce((s, iso) => s + fotos.tage[iso].length, 0),
          protokoll: protokoll.slice(0, 15)
        });
        return;
      }

      jsonAntwort(antwort, 404, { ok: false, fehler: 'Diesen API-Weg gibt es nicht.' });
    } catch (fehler) {
      console.error('[api] ' + weg + ':', fehler.message);
      if (!antwort.headersSent) jsonAntwort(antwort, fehler.status || 400, { ok: false, fehler: fehler.message });
    }
    return;
  }

  /* ----------------------------------------------------- statische Dateien */
  if (anfrage.method !== 'GET' && anfrage.method !== 'HEAD') {
    antwort.writeHead(405, { 'Allow': 'GET, HEAD' }).end();
    return;
  }

  let relativ = weg === '/' ? 'index.html' : weg.replace(/^\/+/, '');
  const ziel = path.join(OEFFENTLICH, relativ);

  // Ausbruch aus dem öffentlichen Ordner verhindern
  if (!ziel.startsWith(OEFFENTLICH + path.sep) && ziel !== path.join(OEFFENTLICH, 'index.html')) {
    nichtGefunden(antwort);
    return;
  }

  fs.stat(ziel, (fehler, info) => {
    if (!fehler && info.isDirectory()) { dateiAusliefern(antwort, path.join(ziel, 'index.html'), anfrage); return; }
    if (fehler) {
      // Unbekannter Weg ohne Dateiendung: die Seite selbst ausliefern
      if (!path.extname(relativ)) { dateiAusliefern(antwort, path.join(OEFFENTLICH, 'index.html'), anfrage); return; }
      nichtGefunden(antwort);
      return;
    }
    dateiAusliefern(antwort, ziel, anfrage);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  Aufgabenliste, Fassung ' + VERSION);
  console.log('  ------------------------------------------------');
  console.log('  Seite:      http://localhost:' + PORT + '/');
  console.log('  Daten:      ' + DATEN);
  console.log('  Zeitzone:   ' + Intl.DateTimeFormat().resolvedOptions().timeZone + '  (' + new Date().toLocaleString('de-AT') + ')');
  console.log('  Angemeldet: ' + abos.length + ' Gerät(e) für Benachrichtigungen');
  console.log('  Zugang:     ' + (ZUGANG ? 'Schlüssel nötig' : 'offen'));
  if (HERKUNFT.length) console.log('  CORS:       ' + HERKUNFT.join(', '));
  console.log('');
  console.log('  Für Benachrichtigungen wird HTTPS gebraucht. Mit Tailscale:');
  console.log('    tailscale serve --bg ' + PORT);
  console.log('');
});

/* Sauber beenden, damit Docker nicht 10 Sekunden warten muss */
['SIGTERM', 'SIGINT'].forEach((signal) => {
  process.on(signal, () => {
    console.log('\n[server] ' + signal + ' – beende.');
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000);
  });
});
