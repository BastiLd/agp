/* ============================================================================
   push.js – Web Push ohne Fremdpakete
   ----------------------------------------------------------------------------
   Setzt drei Standards um, nur mit node:crypto:

     RFC 8292  VAPID  – der Server weist sich mit einem signierten Token aus
     RFC 8291  Web Push Message Encryption – Nutzlast verschlüsseln
     RFC 8188  aes128gcm – das Containerformat drumherum

   Damit funktionieren Benachrichtigungen auf Chrome, Firefox, Edge und
   ab iOS 16.4 auch auf dem iPhone (dort nur, wenn die Seite über
   "Zum Home-Bildschirm" installiert wurde).
   ========================================================================== */
'use strict';

const crypto = require('crypto');
const https = require('https');
const http = require('http');
const { URL } = require('url');

/* --- Base64url ----------------------------------------------------------- */
function b64url(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function ausB64url(text) {
  let s = String(text).replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}

/* --- Schlüsselpaar für VAPID --------------------------------------------- */
function schluesselErzeugen() {
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.generateKeys();
  return {
    oeffentlich: b64url(ecdh.getPublicKey()),        // 65 Byte, unkomprimiert
    privat: b64url(ecdh.getPrivateKey())             // 32 Byte
  };
}

/** Aus dem rohen Schlüsselpaar ein Node-Schlüsselobjekt zum Signieren bauen */
function privatSchluesselObjekt(oeffentlichB64, privatB64) {
  const oeff = ausB64url(oeffentlichB64);            // 0x04 || X (32) || Y (32)
  if (oeff.length !== 65 || oeff[0] !== 0x04) throw new Error('Öffentlicher VAPID-Schlüssel hat das falsche Format.');
  let priv = ausB64url(privatB64);
  if (priv.length < 32) priv = Buffer.concat([Buffer.alloc(32 - priv.length), priv]);

  return crypto.createPrivateKey({
    format: 'jwk',
    key: {
      kty: 'EC', crv: 'P-256',
      x: b64url(oeff.subarray(1, 33)),
      y: b64url(oeff.subarray(33, 65)),
      d: b64url(priv.subarray(priv.length - 32))
    }
  });
}

/* --- VAPID-Token (JWT mit ES256) ----------------------------------------- */
function vapidKopf(endpunktUrl, schluessel, kontakt) {
  const ziel = new URL(endpunktUrl);
  const kopf = { typ: 'JWT', alg: 'ES256' };
  const inhalt = {
    aud: ziel.origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,   // höchstens 24 h erlaubt
    sub: kontakt || 'mailto:niemand@example.org'
  };
  const daten = b64url(JSON.stringify(kopf)) + '.' + b64url(JSON.stringify(inhalt));

  // ES256 braucht die rohe r||s-Form, nicht die DER-Verpackung
  const signatur = crypto.sign('sha256', Buffer.from(daten), {
    key: privatSchluesselObjekt(schluessel.oeffentlich, schluessel.privat),
    dsaEncoding: 'ieee-p1363'
  });

  return 'vapid t=' + daten + '.' + b64url(signatur) + ', k=' + schluessel.oeffentlich;
}

/* --- HKDF (RFC 5869), hier immer mit SHA-256 ----------------------------- */
function hkdf(salz, ikm, info, laenge) {
  const prk = crypto.createHmac('sha256', salz).update(ikm).digest();
  const ausgabe = crypto.createHmac('sha256', prk)
    .update(Buffer.concat([info, Buffer.from([1])])).digest();
  return ausgabe.subarray(0, laenge);
}

/* --- Nutzlast verschlüsseln (RFC 8291 + RFC 8188) ------------------------ */
function verschluesseln(nutzlast, empfaengerP256dh, empfaengerAuth, festeWerte) {
  const klartext = Buffer.from(nutzlast, 'utf8');
  const kundePub = ausB64url(empfaengerP256dh);       // 65 Byte
  const authGeheim = ausB64url(empfaengerAuth);       // 16 Byte

  if (kundePub.length !== 65) throw new Error('p256dh des Empfängers hat die falsche Länge.');
  if (authGeheim.length !== 16) throw new Error('auth des Empfängers hat die falsche Länge.');

  // Flüchtiges Schlüsselpaar nur für diese eine Nachricht.
  // festeWerte gibt es ausschließlich für den Test gegen die RFC-Vorgabe.
  const ecdh = crypto.createECDH('prime256v1');
  if (festeWerte && festeWerte.serverPrivat) ecdh.setPrivateKey(ausB64url(festeWerte.serverPrivat));
  else ecdh.generateKeys();
  const serverPub = ecdh.getPublicKey();
  const gemeinsam = ecdh.computeSecret(kundePub);

  // Schritt 1: aus dem gemeinsamen Geheimnis und auth das IKM ableiten
  const schluesselInfo = Buffer.concat([
    Buffer.from('WebPush: info\0', 'utf8'), kundePub, serverPub
  ]);
  const ikm = hkdf(authGeheim, gemeinsam, schluesselInfo, 32);

  // Schritt 2: daraus Schlüssel und Nonce
  const salz = (festeWerte && festeWerte.salz) ? ausB64url(festeWerte.salz) : crypto.randomBytes(16);
  const cek = hkdf(salz, ikm, Buffer.from('Content-Encoding: aes128gcm\0', 'utf8'), 16);
  const nonce = hkdf(salz, ikm, Buffer.from('Content-Encoding: nonce\0', 'utf8'), 12);

  // Schritt 3: verschlüsseln. 0x02 schließt den einzigen Datensatz ab.
  const chiffre = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const inhalt = Buffer.concat([
    chiffre.update(Buffer.concat([klartext, Buffer.from([2])])),
    chiffre.final(),
    chiffre.getAuthTag()
  ]);

  // Schritt 4: Kopf nach RFC 8188 davorsetzen
  const satzGroesse = Buffer.alloc(4);
  satzGroesse.writeUInt32BE(4096, 0);
  return Buffer.concat([salz, satzGroesse, Buffer.from([serverPub.length]), serverPub, inhalt]);
}

/* --- Eine Nachricht verschicken ------------------------------------------ */
function senden(abo, nutzlast, schluessel, kontakt, zeitLimit) {
  return new Promise((fertig) => {
    let koerper, kopfzeilen;
    try {
      koerper = verschluesseln(nutzlast, abo.keys.p256dh, abo.keys.auth);
      kopfzeilen = {
        'Content-Encoding': 'aes128gcm',
        'Content-Type': 'application/octet-stream',
        'Content-Length': koerper.length,
        'TTL': String(zeitLimit || 3600),
        'Urgency': 'high',
        'Authorization': vapidKopf(abo.endpoint, schluessel, kontakt)
      };
    } catch (fehler) {
      fertig({ ok: false, status: 0, fehler: fehler.message, wegwerfen: false });
      return;
    }

    const ziel = new URL(abo.endpoint);
    const modul = ziel.protocol === 'http:' ? http : https;
    const anfrage = modul.request({
      method: 'POST',
      hostname: ziel.hostname,
      port: ziel.port || (ziel.protocol === 'http:' ? 80 : 443),
      path: ziel.pathname + ziel.search,
      headers: kopfzeilen,
      timeout: 12000
    }, (antwort) => {
      let text = '';
      antwort.on('data', (d) => { if (text.length < 2000) text += d.toString(); });
      antwort.on('end', () => {
        const status = antwort.statusCode;
        fertig({
          ok: status >= 200 && status < 300,
          status,
          fehler: status >= 300 ? text.trim().slice(0, 300) : null,
          // 404/410 heißt: dieses Abo gibt es nicht mehr, es darf gelöscht werden
          wegwerfen: status === 404 || status === 410
        });
      });
    });

    anfrage.on('timeout', () => { anfrage.destroy(); fertig({ ok: false, status: 0, fehler: 'Zeitüberschreitung', wegwerfen: false }); });
    anfrage.on('error', (fehler) => fertig({ ok: false, status: 0, fehler: fehler.message, wegwerfen: false }));
    anfrage.end(koerper);
  });
}

module.exports = { schluesselErzeugen, senden, verschluesseln, vapidKopf, b64url, ausB64url, hkdf };
