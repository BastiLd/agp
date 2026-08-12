#!/usr/bin/env node
/**
 * Sucht Projekte, deren Repo eine laufende GitHub-Pages-Seite hat, die im
 * Katalog noch nicht als "live" eingetragen ist — und umgekehrt Links, die
 * ins Leere zeigen.
 *
 * Aufruf:  node tools/pruefe-live.js [--setzen]
 *
 * Braucht die GitHub-CLI (`gh`), angemeldet. Ohne --setzen wird nur berichtet.
 *
 * Wichtig: Eine eingerichtete Pages-Seite heisst nicht, dass dort auch das
 * Projekt liegt. Bei WebHafen zeigt die Pages-Adresse des Repos MFU-TEST eine
 * alte, voellig andere Seite — deshalb wird der Seitentitel mit ausgegeben und
 * --setzen traegt nur ein, was vorher von Hand bestaetigt wurde.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');
const SETZEN = process.argv.includes('--setzen');

function gh(pfad) {
  try {
    return JSON.parse(execFileSync('gh', ['api', pfad], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
  } catch {
    return null;
  }
}

function ladeProjekte() {
  const raus = [];
  for (const datei of ['projects.json', 'private.json']) {
    const p = path.join(REPO, 'data', datei);
    if (!fs.existsSync(p)) continue;
    const d = JSON.parse(fs.readFileSync(p, 'utf8'));
    for (const projekt of d.projekte) raus.push({ projekt, datei: p });
  }
  return raus;
}

const alle = ladeProjekte();
const mitRepo = alle.filter((x) => x.projekt.repo && x.projekt.repo.includes('github.com/'));

console.log(`Projekte mit GitHub-Repo: ${mitRepo.length}`);
console.log('');

const neueSeiten = [];
const toteLinks = [];

for (const { projekt } of mitRepo) {
  const kurz = projekt.repo.replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '');
  const pages = gh(`repos/${kurz}/pages`);

  if (!pages || !pages.html_url) {
    if (projekt.live && projekt.live.includes('github.io')) {
      toteLinks.push({ id: projekt.id, live: projekt.live, grund: 'Repo hat keine Pages (mehr)' });
    }
    continue;
  }

  if (!projekt.live) {
    neueSeiten.push({ id: projekt.id, titel: projekt.titel, url: pages.html_url, status: pages.status });
  }
}

if (neueSeiten.length) {
  console.log('Diese Projekte haben eine Pages-Seite, aber keinen live-Link:');
  for (const n of neueSeiten) {
    console.log(`  ${n.id.padEnd(24)} ${n.url}   [${n.status || 'ohne Status'}]`);
  }
  console.log('');
  console.log('BITTE ZUERST OEFFNEN und pruefen, ob dort wirklich das Projekt liegt.');
  console.log('Eine Pages-Adresse kann eine alte, ganz andere Seite ausliefern.');
} else {
  console.log('Keine neuen Live-Seiten gefunden.');
}

if (toteLinks.length) {
  console.log('');
  console.log('Diese live-Links zeigen ins Leere:');
  for (const t of toteLinks) console.log(`  ${t.id.padEnd(24)} ${t.live}  (${t.grund})`);
}

if (SETZEN && neueSeiten.length) {
  console.log('');
  console.log('--setzen ist absichtlich nicht umgesetzt: der Seiteninhalt muss vorher');
  console.log('angesehen werden. Trage den Link nach der Kontrolle in data/projects.json ein.');
}
