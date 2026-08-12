#!/usr/bin/env node
// Traegt neue "stand"-Daten in projects.json und private.json ein.
// Aufruf: node stand-setzen.js <repo-pfad> <json-datei-mit-{id:datum}>

const fs = require('fs');
const path = require('path');

const repo = process.argv[2];
const standDatei = process.argv[3];

if (!repo || !standDatei) {
  console.error('Aufruf: node stand-setzen.js <repo> <staende.json>');
  process.exit(1);
}

const staende = JSON.parse(fs.readFileSync(standDatei, 'utf8'));
const ids = Object.keys(staende);
if (ids.length === 0) {
  console.log('Keine Stand-Daten uebergeben.');
  process.exit(0);
}

let geaendert = 0;

for (const datei of ['projects.json', 'private.json']) {
  const p = path.join(repo, 'data', datei);
  if (!fs.existsSync(p)) continue;

  const roh = fs.readFileSync(p, 'utf8');
  const daten = JSON.parse(roh);
  let hierGeaendert = 0;

  for (const projekt of daten.projekte) {
    const neu = staende[projekt.id];
    if (neu && projekt.stand !== neu) {
      console.log(`${projekt.id}: ${projekt.stand} -> ${neu}`);
      projekt.stand = neu;
      hierGeaendert++;
    }
  }

  if (hierGeaendert > 0) {
    daten.aktualisiert = new Date().toISOString().slice(0, 10);
    // Zeilenende wie vorgefunden beibehalten, damit der Diff klein bleibt
    const crlf = roh.includes('\r\n');
    let aus = JSON.stringify(daten, null, 2) + '\n';
    if (crlf) aus = aus.replace(/\n/g, '\r\n');
    fs.writeFileSync(p, aus, 'utf8');
    geaendert += hierGeaendert;
  }
}

console.log(geaendert === 0 ? 'Keine Stand-Daten mussten geaendert werden.' : `${geaendert} Stand-Datum/-Daten aktualisiert.`);
