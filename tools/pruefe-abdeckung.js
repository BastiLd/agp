#!/usr/bin/env node
/**
 * Gegenprobe: Ist jedes GitHub-Repo entweder im Katalog verlinkt oder in
 * DUPLIKATE.md als bewusst ausgelassen dokumentiert?
 *
 * Aufruf:  node tools/pruefe-abdeckung.js
 * Braucht die GitHub-CLI (`gh`), angemeldet.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');

// --- Alle Repos vom Konto holen ---
let alleRepos;
try {
  const roh = execFileSync('gh', ['repo', 'list', '--limit', '300', '--json', 'name,visibility'], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']
  });
  alleRepos = JSON.parse(roh).map((r) => ({ name: r.name, klein: r.name.toLowerCase(), sichtbar: r.visibility }));
} catch {
  console.error('gh nicht erreichbar oder nicht angemeldet.');
  process.exit(1);
}

// --- Verlinkte Repos aus dem Katalog ---
const verlinkt = new Map();
for (const datei of ['projects.json', 'private.json']) {
  const p = path.join(REPO, 'data', datei);
  if (!fs.existsSync(p)) continue;
  for (const projekt of JSON.parse(fs.readFileSync(p, 'utf8')).projekte) {
    if (!projekt.repo || !projekt.repo.includes('github.com/')) continue;
    const name = projekt.repo.replace(/^https:\/\/github\.com\/[^/]+\//, '').replace(/\/$/, '');
    verlinkt.set(name.toLowerCase(), projekt.id);
  }
}

// --- In DUPLIKATE.md erwähnte Repos ---
const dupText = fs.readFileSync(path.join(REPO, 'DUPLIKATE.md'), 'utf8').toLowerCase();

const offen = [];
for (const r of alleRepos) {
  if (verlinkt.has(r.klein)) continue;
  // Das Katalog-Repo selbst ist der Rahmen, nicht ein Projekt darin.
  if (r.klein === 'agp') continue;
  if (dupText.includes(`/${r.klein})`) || dupText.includes(`\`${r.klein}\``)) continue;
  offen.push(r);
}

console.log(`Repos auf dem Konto : ${alleRepos.length}`);
console.log(`im Katalog verlinkt : ${verlinkt.size}`);
console.log(`Katalog selbst      : 1 (agp)`);
console.log(`in DUPLIKATE.md     : ${alleRepos.length - verlinkt.size - 1 - offen.length}`);
console.log('');

if (offen.length === 0) {
  console.log('Vollständig — jedes Repo ist verlinkt oder dokumentiert.');
} else {
  console.log(`${offen.length} Repo(s) weder verlinkt noch dokumentiert:`);
  for (const r of offen) console.log(`  ${r.name}  [${r.sichtbar}]`);
  process.exitCode = 1;
}

// Gegenrichtung: verlinkte Repos, die es gar nicht (mehr) gibt
const vorhanden = new Set(alleRepos.map((r) => r.klein));
const tot = [...verlinkt.entries()].filter(([name]) => !vorhanden.has(name));
if (tot.length) {
  console.log('');
  console.log('Verlinkt, aber auf dem Konto nicht gefunden:');
  for (const [name, id] of tot) console.log(`  ${id} -> ${name}`);
}
