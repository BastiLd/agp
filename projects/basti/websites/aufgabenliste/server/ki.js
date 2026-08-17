/* ============================================================================
   ki.js – Aufgaben in normaler Sprache anlegen
   ----------------------------------------------------------------------------
   Spricht den bereits laufenden Ollama-Container an (Vorgabe
   http://127.0.0.1:11434) und lässt ein kleines Modell aus einem deutschen
   Satz strukturierte Daten machen:

       "Füge am 19.8. hinzu, dass ich um 17:30 mit dem Rad losfahren will"
       -> { titel: "Mit dem Rad losfahren", datum: "2026-08-19", zeit: 1050 }

   Das Ergebnis wird IMMER nur als Vorschlag zurückgegeben – eingetragen wird
   erst, wenn in der App bestätigt wird. So kann ein Fehlgriff des Modells
   nichts kaputtmachen.

   Umgebungsvariablen:
     OLLAMA        Adresse, Vorgabe http://127.0.0.1:11434
     KI_MODELL     Modellname, Vorgabe qwen2.5:3b-instruct-q4_K_M
   ========================================================================== */
'use strict';

const http = require('http');
const https = require('https');
const { URL } = require('url');

const OLLAMA = (process.env.OLLAMA || 'http://127.0.0.1:11434').replace(/\/+$/, '');
const MODELL = process.env.KI_MODELL || 'qwen2.5:3b-instruct-q4_K_M';

/* --- HTTP-Aufruf an Ollama ------------------------------------------------ */
function ruf(weg, koerper, zeitLimit) {
  return new Promise((fertig, fehler) => {
    let ziel;
    try { ziel = new URL(OLLAMA + weg); } catch (e) { fehler(new Error('OLLAMA-Adresse ist ungültig.')); return; }
    const modul = ziel.protocol === 'https:' ? https : http;
    const daten = koerper ? Buffer.from(JSON.stringify(koerper), 'utf8') : null;

    const anfrage = modul.request({
      method: koerper ? 'POST' : 'GET',
      hostname: ziel.hostname,
      port: ziel.port || (ziel.protocol === 'https:' ? 443 : 80),
      path: ziel.pathname + ziel.search,
      headers: daten ? { 'Content-Type': 'application/json', 'Content-Length': daten.length } : {},
      timeout: zeitLimit || 90000
    }, (antwort) => {
      const teile = [];
      antwort.on('data', (d) => teile.push(d));
      antwort.on('end', () => {
        const text = Buffer.concat(teile).toString('utf8');
        if (antwort.statusCode >= 300) {
          fehler(new Error('Ollama antwortet mit ' + antwort.statusCode + ': ' + text.slice(0, 200)));
          return;
        }
        try { fertig(JSON.parse(text)); }
        catch (e) { fehler(new Error('Ollama liefert kein gültiges JSON.')); }
      });
    });

    anfrage.on('timeout', () => { anfrage.destroy(); fehler(new Error('Das Modell braucht zu lange. Ist es schon heruntergeladen?')); });
    anfrage.on('error', (e) => fehler(new Error(
      e.code === 'ECONNREFUSED'
        ? 'Ollama ist unter ' + OLLAMA + ' nicht erreichbar.'
        : e.message)));
    if (daten) anfrage.write(daten);
    anfrage.end();
  });
}

/** Läuft Ollama, und ist das Modell da? */
async function pruefen() {
  try {
    const antwort = await ruf('/api/tags', null, 8000);
    const modelle = (antwort.models || []).map((m) => m.name);
    return {
      ok: true,
      erreichbar: true,
      modell: MODELL,
      modellDa: modelle.some((n) => n === MODELL || n.split(':')[0] === MODELL.split(':')[0]),
      modelle: modelle.slice(0, 20),
      adresse: OLLAMA
    };
  } catch (e) {
    return { ok: false, erreichbar: false, modell: MODELL, adresse: OLLAMA, fehler: e.message };
  }
}

/* --- Was das Modell wissen muss ------------------------------------------- */
function anweisung(heute, tage) {
  return [
    'Du wandelst deutsche Sätze in Aufgaben um. Antworte AUSSCHLIESSLICH mit JSON,',
    'ohne Erklärung, ohne Markdown, ohne Codeblock.',
    '',
    'Format:',
    '{"aktion":"anlegen","titel":"kurzer Titel","text":"","datum":"JJJJ-MM-TT oder null","zeit":"HH:MM oder null","taeglich":false}',
    '',
    'Regeln:',
    '- titel ist kurz und im Infinitiv, z. B. "Mit dem Rad losfahren".',
    '- datum nur aus diesem Zeitraum: ' + tage[0] + ' bis ' + tage[tage.length - 1] + '.',
    '- Heute ist ' + heute + '.',
    '- "morgen" ist der Tag nach heute, "übermorgen" zwei Tage nach heute.',
    '- Wenn kein Datum genannt wird, setze datum auf null und taeglich auf false.',
    '- Wenn "jeden Tag" oder "täglich" vorkommt, setze taeglich auf true und datum auf null.',
    '- zeit im 24-Stunden-Format, z. B. "17:30". Ohne Zeitangabe null.',
    '- Verstehst du den Satz nicht, antworte {"aktion":"unklar","grund":"kurze Erklärung"}.'
  ].join('\n');
}

/** "17:30" -> 1050 */
function zeitZuMinuten(text) {
  if (typeof text !== 'string') return null;
  const m = /^(\d{1,2})[:.](\d{2})$/.exec(text.trim());
  if (!m) return null;
  const min = Number(m[1]) * 60 + Number(m[2]);
  return (min >= 0 && min < 1440) ? min : null;
}

/** JSON aus der Antwort schälen, auch wenn Text drumherum steht */
function jsonSchaelen(text) {
  if (typeof text !== 'string') return null;
  let t = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(t.slice(a, b + 1)); } catch (e) { return null; }
}

/**
 * Satz auswerten. Liefert einen Vorschlag, niemals eine fertige Änderung.
 */
async function auswerten(satz, heute, tage) {
  const eingabe = String(satz || '').trim();
  if (!eingabe) throw new Error('Es wurde nichts gesagt.');
  if (eingabe.length > 500) throw new Error('Das ist zu lang – bitte kürzer fassen.');

  const antwort = await ruf('/api/chat', {
    model: MODELL,
    stream: false,
    format: 'json',
    options: { temperature: 0.1, num_predict: 220 },
    messages: [
      { role: 'system', content: anweisung(heute, tage) },
      { role: 'user', content: eingabe }
    ]
  });

  const roh = (antwort.message && antwort.message.content) || '';
  const daten = jsonSchaelen(roh);
  if (!daten) throw new Error('Das Modell hat keine brauchbare Antwort geliefert.');

  if (daten.aktion === 'unklar' || !daten.titel) {
    return { ok: false, unklar: true, grund: daten.grund || 'Der Satz war nicht eindeutig.', roh };
  }

  const datum = (typeof daten.datum === 'string' && tage.indexOf(daten.datum) >= 0) ? daten.datum : null;

  return {
    ok: true,
    vorschlag: {
      titel: String(daten.titel).slice(0, 80),
      text: String(daten.text || '').slice(0, 240),
      datum: daten.taeglich ? null : datum,
      taeglich: !!daten.taeglich,
      zeit: zeitZuMinuten(daten.zeit)
    },
    modell: MODELL
  };
}

module.exports = { pruefen, auswerten, MODELL, OLLAMA };
