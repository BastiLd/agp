#!/usr/bin/env node
/*
 * Verschlüsselt eine JSON-Datei (AES-256-GCM). Ohne Angabe: data/private.json
 * zu data/private.enc — das deckt den ueblichen Fall ab.
 *
 * Aufruf:
 *   node tools/encrypt-private.js "PASSWORT"
 *   node tools/encrypt-private.js "PASSWORT" <quelle.json> <ziel.enc>
 *
 * Die Klartext-Datei data/private.json ist per .gitignore ausgeschlossen und
 * landet nie auf GitHub — veröffentlicht wird ausschließlich die .enc-Datei.
 * Dasselbe gilt fuer jede andere hier verschluesselte Datei: die Klartext-
 * Quelle gehoert in .gitignore, verschluesselt wird nur das Ergebnis committet.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ITERATIONEN = 250000;

const passwort = process.argv[2];
if (!passwort) {
  console.error('Aufruf: node tools/encrypt-private.js "PASSWORT" [quelle.json] [ziel.enc]');
  process.exit(1);
}

const wurzel = path.join(__dirname, '..');
const quelle = process.argv[3] ? path.resolve(process.argv[3]) : path.join(wurzel, 'data', 'private.json');
const ziel = process.argv[4] ? path.resolve(process.argv[4]) : path.join(wurzel, 'data', 'private.enc');

if (!fs.existsSync(quelle)) {
  console.error(`Nicht gefunden: ${quelle}`);
  process.exit(1);
}

const klartext = fs.readFileSync(quelle, 'utf8');
JSON.parse(klartext); // Syntaxprüfung, bricht bei kaputtem JSON ab

const salt = crypto.randomBytes(16);
const iv = crypto.randomBytes(12);
const schluessel = crypto.pbkdf2Sync(passwort, salt, ITERATIONEN, 32, 'sha256');

const chiffre = crypto.createCipheriv('aes-256-gcm', schluessel, iv);
const daten = Buffer.concat([chiffre.update(klartext, 'utf8'), chiffre.final(), chiffre.getAuthTag()]);

fs.writeFileSync(ziel, JSON.stringify({
  verfahren: 'AES-256-GCM',
  ableitung: 'PBKDF2-SHA256',
  iterationen: ITERATIONEN,
  salt: salt.toString('base64'),
  iv: iv.toString('base64'),
  daten: daten.toString('base64')
}, null, 2));

console.log(`Verschluesselt: ${ziel}  (${daten.length} Bytes)`);
