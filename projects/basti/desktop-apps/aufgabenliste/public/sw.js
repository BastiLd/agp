/* ============================================================================
   sw.js – Service Worker: Offline-Betrieb und Push-Benachrichtigungen
   ----------------------------------------------------------------------------
   Beim Ändern von Dateien die Zahl in VERSION erhöhen, damit die Geräte die
   neue Fassung holen.
   ========================================================================== */
'use strict';

const VERSION = 'v2.0.0';
const CACHE = 'basti-aufgaben-' + VERSION;

const DATEIEN = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/app.css',
  './assets/js/data.js',
  './assets/js/kontakte.js',
  './assets/js/store.js',
  './assets/js/fx.js',
  './assets/js/api.js',
  './assets/js/app.js',
  './assets/icons/favicon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
  './assets/icons/apple-touch-icon.png'
];

/* --- Installieren --------------------------------------------------------- */
self.addEventListener('install', (ereignis) => {
  ereignis.waitUntil(
    caches.open(CACHE)
      // einzeln, damit eine fehlende Datei (z. B. kontakte.js) nicht alles kippt
      .then((c) => Promise.all(DATEIEN.map((d) => c.add(d).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

/* --- Aktivieren ----------------------------------------------------------- */
self.addEventListener('activate', (ereignis) => {
  ereignis.waitUntil(
    caches.keys()
      .then((namen) => Promise.all(
        namen.filter((n) => n.startsWith('basti-aufgaben-') && n !== CACHE).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

/* --- Anfragen ------------------------------------------------------------- */
self.addEventListener('fetch', (ereignis) => {
  const anfrage = ereignis.request;
  if (anfrage.method !== 'GET') return;

  const url = new URL(anfrage.url);
  if (url.origin !== self.location.origin) return;

  // Server-Schnittstelle nie zwischenspeichern
  if (url.pathname.includes('/api/')) return;

  if (anfrage.mode === 'navigate') {
    ereignis.respondWith(
      fetch(anfrage)
        .then((antwort) => {
          const kopie = antwort.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', kopie)).catch(() => {});
          return antwort;
        })
        .catch(() => caches.match('./index.html').then((t) => t || caches.match('./')))
    );
    return;
  }

  ereignis.respondWith(
    caches.match(anfrage).then((treffer) => {
      const ausDemNetz = fetch(anfrage)
        .then((antwort) => {
          if (antwort && antwort.status === 200 && antwort.type === 'basic') {
            const kopie = antwort.clone();
            caches.open(CACHE).then((c) => c.put(anfrage, kopie)).catch(() => {});
          }
          return antwort;
        })
        .catch(() => treffer);
      return treffer || ausDemNetz;
    })
  );
});

/* ==========================================================================
   Push-Benachrichtigungen
   ========================================================================== */
self.addEventListener('push', (ereignis) => {
  let daten = { titel: 'Aufgabenliste', text: 'Es steht etwas an.', tag: '', aufgabe: '' };
  if (ereignis.data) {
    try { daten = Object.assign(daten, ereignis.data.json()); }
    catch (e) { daten.text = ereignis.data.text() || daten.text; }
  }

  const optionen = {
    body: daten.text,
    icon: './assets/icons/icon-192.png',
    badge: './assets/icons/icon-192.png',
    lang: 'de',
    tag: 'aufgabe-' + (daten.aufgabe || daten.tag || 'allgemein'),
    renotify: true,
    requireInteraction: false,
    timestamp: Date.now(),
    data: { tag: daten.tag || '', aufgabe: daten.aufgabe || '', test: !!daten.test },
    actions: daten.test ? [] : [
      { action: 'erledigt', title: 'Erledigt' },
      { action: 'spaeter', title: 'In 30 Min.' }
    ]
  };

  ereignis.waitUntil(self.registration.showNotification(daten.titel, optionen));
});

/* --- Antippen bzw. Knopf in der Benachrichtigung -------------------------- */
self.addEventListener('notificationclick', (ereignis) => {
  const daten = ereignis.notification.data || {};
  ereignis.notification.close();

  const ziel = './#/heute' + (daten.tag ? '/' + daten.tag : '');

  ereignis.waitUntil((async () => {
    if (ereignis.action === 'spaeter') {
      await fetch('api/schlummer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: daten.tag, aufgabe: daten.aufgabe, minuten: 30 })
      }).catch(() => {});
      return;
    }

    if (ereignis.action === 'erledigt' && daten.tag && daten.aufgabe) {
      // Direkt auf dem Server abhaken – die Geräte holen es beim nächsten Abgleich
      const jetzt = Date.now();
      await fetch('api/stand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stand: { v: 4, erledigt: { [daten.tag]: { [daten.aufgabe]: jetzt } }, entfernt: {}, notizen: {}, erfolge: {}, geaendert: jetzt }
        })
      }).catch(() => {});
    }

    // Offenes Fenster in den Vordergrund holen, sonst neu öffnen
    const fenster = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const f of fenster) {
      if (f.url.includes(self.registration.scope)) {
        await f.focus();
        if ('navigate' in f) await f.navigate(ziel).catch(() => {});
        f.postMessage({ art: 'push-geoeffnet', tag: daten.tag, aufgabe: daten.aufgabe });
        return;
      }
    }
    await self.clients.openWindow(ziel);
  })());
});

self.addEventListener('message', (ereignis) => {
  if (ereignis.data === 'sofort-aktualisieren') self.skipWaiting();
});
