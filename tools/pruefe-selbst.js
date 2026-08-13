#!/usr/bin/env node
/**
 * Prüft Projekte mit live: "selbst" — der Katalog liefert dort die Kopie im Repo
 * selbst aus. Wenn die Einstiegsdatei fehlt, ist der Knopf "Website öffnen" ein
 * toter Link. Genau das ist beim Umstellen von Avocado at Law auf die
 * Expo-Fassung passiert: der alte Prototyp hatte eine HTML-Datei, die neue nicht.
 *
 * Aufruf:  node tools/pruefe-selbst.js
 */

const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
let geprueft = 0;
let kaputt = 0;

for (const datei of ['projects.json', 'private.json']) {
  const p = path.join(REPO, 'data', datei);
  if (!fs.existsSync(p)) continue;
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));

  for (const projekt of d.projekte) {
    if (projekt.live !== 'selbst') continue;
    geprueft++;

    const einstieg = projekt.einstieg || 'index.html';
    const voll = path.join(REPO, projekt.pfad.replace(/\//g, path.sep), einstieg);

    if (fs.existsSync(voll)) {
      console.log(`  ok      ${projekt.id.padEnd(26)} ${einstieg}`);
    } else {
      console.log(`  FEHLT   ${projekt.id.padEnd(26)} ${einstieg}`);
      kaputt++;
    }
  }
}

console.log('');
if (geprueft === 0) {
  console.log('Kein Projekt benutzt live: "selbst".');
} else if (kaputt === 0) {
  console.log(`Alle ${geprueft} Einstiegsdateien vorhanden.`);
} else {
  console.log(`${kaputt} von ${geprueft} zeigen ins Leere — dort "live" auf null setzen oder die Datei ergänzen.`);
  process.exitCode = 1;
}
