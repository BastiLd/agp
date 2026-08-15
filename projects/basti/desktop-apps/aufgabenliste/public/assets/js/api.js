/* ============================================================================
   api.js  –  Verbindung zum eigenen Server
   ----------------------------------------------------------------------------
   Ist kein Server da (z. B. auf GitHub Pages oder beim Öffnen als Datei),
   bleibt einfach alles beim Alten: die App läuft rein lokal weiter. Sobald
   ein Server antwortet, kommen automatischer Abgleich und echte
   Push-Benachrichtigungen dazu.
   ========================================================================== */
'use strict';

const Api = (() => {

  let zustand = {
    verfuegbar: false,      // hat /api/info geantwortet?
    sicher: false,          // läuft die Seite über HTTPS (oder localhost)?
    vapid: null,
    letzterAbgleich: 0,
    letzterFehler: null,
    laeuft: false,
    wartet: false,          // Änderung liegt an, konnte aber nicht gesendet werden
    abos: 0,
    zeitzone: '',
    serverZeit: ''
  };

  let abgleichTimer = null;
  let amAbgleichen = false;

  /* --- Läuft die Seite in einem sicheren Kontext? ------------------------- */
  function sichererKontext() {
    return window.isSecureContext === true;
  }

  function melde() { Bus.ruf('serverZustand', zustand); }

  /* --- Netzwerk ----------------------------------------------------------- */
  function ruf(weg, optionen) {
    const o = Object.assign({ method: 'GET' }, optionen || {});
    o.headers = Object.assign({ 'Content-Type': 'application/json' }, o.headers || {});
    const schluessel = Store.einst('zugangsschluessel');
    if (schluessel) o.headers['X-Zugang'] = schluessel;

    const abbruch = new AbortController();
    const wecker = setTimeout(() => abbruch.abort(), 12000);
    o.signal = abbruch.signal;

    return fetch(weg, o)
      .then((antwort) => {
        clearTimeout(wecker);
        if (!antwort.ok) return antwort.json().catch(() => ({})).then((k) => {
          throw new Error(k.fehler || ('Server antwortet mit ' + antwort.status));
        });
        return antwort.json();
      })
      .catch((fehler) => {
        clearTimeout(wecker);
        throw new Error(fehler.name === 'AbortError' ? 'Der Server antwortet nicht.' : fehler.message);
      });
  }

  /* --- Gibt es einen Server? ---------------------------------------------- */
  function pruefen() {
    zustand.sicher = sichererKontext();
    if (location.protocol === 'file:') {
      zustand.verfuegbar = false;
      melde();
      return Promise.resolve(false);
    }
    return ruf('api/info')
      .then((antwort) => {
        zustand.verfuegbar = !!antwort.ok;
        zustand.vapid = antwort.vapid || null;
        zustand.abos = antwort.abos || 0;
        zustand.zeitzone = antwort.zeitzone || '';
        zustand.serverZeit = antwort.ortszeit || '';
        zustand.letzterFehler = null;
        melde();
        return true;
      })
      .catch(() => {
        zustand.verfuegbar = false;
        melde();
        return false;
      });
  }

  /* ==========================================================================
     Abgleich des Standes
     ========================================================================== */
  function abgleichen(stillschweigend) {
    if (!zustand.verfuegbar || Store.einst('serverSync') === false) return Promise.resolve(false);
    if (zustand.laeuft) { zustand.wartet = true; return Promise.resolve(false); }

    zustand.laeuft = true;
    if (!stillschweigend) melde();

    return ruf('api/stand', { method: 'POST', body: JSON.stringify({ stand: Store.schnappschuss() }) })
      .then((antwort) => {
        amAbgleichen = true;
        const bericht = Store.zusammenfuehren(antwort.stand);
        amAbgleichen = false;

        zustand.letzterAbgleich = Date.now();
        zustand.letzterFehler = null;
        zustand.laeuft = false;
        zustand.wartet = false;
        melde();

        const veraendert = bericht.gesetzt || bericht.entfernt || bericht.notizen;
        if (veraendert) {
          Bus.ruf('serverAenderung', bericht);
          if (!stillschweigend) {
            const teile = [];
            if (bericht.gesetzt) teile.push(bericht.gesetzt + ' Häkchen');
            if (bericht.entfernt) teile.push(bericht.entfernt + ' entfernt');
            if (bericht.notizen) teile.push(bericht.notizen + ' Notizen');
            Meldung.zeig('Vom Server übernommen: ' + teile.join(', ') + '.', { art: 'gut' });
          }
        }

        // Wenn zwischendurch etwas passiert ist, gleich nochmal
        if (zustand.wartet) setTimeout(() => abgleichen(true), 400);
        return true;
      })
      .catch((fehler) => {
        zustand.laeuft = false;
        zustand.wartet = true;
        zustand.letzterFehler = fehler.message;
        melde();
        if (!stillschweigend) Meldung.zeig('Abgleich nicht möglich: ' + fehler.message, { art: 'warn' });
        return false;
      });
  }

  /** Nach einer Änderung nicht sofort senden, sondern kurz sammeln */
  function baldAbgleichen() {
    if (amAbgleichen) return;
    if (!zustand.verfuegbar || Store.einst('serverSync') === false) return;
    if (abgleichTimer) clearTimeout(abgleichTimer);
    abgleichTimer = setTimeout(() => { abgleichTimer = null; abgleichen(true); }, 1500);
  }

  /* --- Fotos -------------------------------------------------------------- */
  function fotosAbgleichen() {
    if (!zustand.verfuegbar || Store.einst('serverSync') === false) return Promise.resolve(false);
    return ruf('api/fotos', { method: 'POST', body: JSON.stringify({ fotos: Fotos.alles() }) })
      .then((antwort) => {
        const neu = Fotos.zusammenfuehren(antwort.fotos);
        if (neu) Bus.ruf('serverAenderung', { fotos: neu });
        return true;
      })
      .catch(() => false);
  }

  /* ==========================================================================
     Push-Benachrichtigungen
     ========================================================================== */
  function pushMoeglich() {
    return zustand.verfuegbar && zustand.sicher &&
           'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  /** Warum geht es gerade nicht? Für eine ehrliche Anzeige in den Einstellungen. */
  function pushHindernis() {
    if (!('Notification' in window)) return 'Dieser Browser kennt keine Benachrichtigungen.';
    if (!zustand.sicher) return 'Benachrichtigungen brauchen eine verschlüsselte Verbindung (https). Auf dem Server "tailscale serve --bg ' + (location.port || 8090) + '" ausführen und danach die ts.net-Adresse aufrufen.';
    if (!('PushManager' in window)) {
      return istIos() && !alsAppGestartet()
        ? 'Auf dem iPhone geht das nur, wenn die Seite über Teilen → „Zum Home-Bildschirm" als App gespeichert und von dort gestartet wurde.'
        : 'Dieser Browser unterstützt kein Web Push.';
    }
    if (!zustand.verfuegbar) return 'Der Server ist gerade nicht erreichbar. Ohne ihn gibt es keine Benachrichtigungen bei geschlossener App.';
    if (Notification.permission === 'denied') return 'Benachrichtigungen wurden abgelehnt. In den Einstellungen des Browsers für diese Seite wieder erlauben.';
    return null;
  }

  function istIos() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }
  function alsAppGestartet() {
    return window.navigator.standalone === true ||
           (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  }

  function b64urlZuUint8(b64) {
    const rest = '='.repeat((4 - (b64.length % 4)) % 4);
    const roh = atob((b64 + rest).replace(/-/g, '+').replace(/_/g, '/'));
    const feld = new Uint8Array(roh.length);
    for (let i = 0; i < roh.length; i++) feld[i] = roh.charCodeAt(i);
    return feld;
  }

  async function pushAnmelden() {
    const hindernis = pushHindernis();
    if (hindernis) throw new Error(hindernis);

    const erlaubnis = await Notification.requestPermission();
    if (erlaubnis !== 'granted') throw new Error('Ohne Erlaubnis geht es leider nicht.');

    const reg = await navigator.serviceWorker.ready;
    let abo = await reg.pushManager.getSubscription();

    const schluessel = zustand.vapid || (await ruf('api/vapid')).schluessel;
    if (!schluessel) throw new Error('Der Server liefert keinen Push-Schlüssel.');

    // Passt das bestehende Abo noch zum Serverschlüssel?
    if (abo) {
      const alt = new Uint8Array(abo.options.applicationServerKey || new ArrayBuffer(0));
      const neu = b64urlZuUint8(schluessel);
      const gleich = alt.length === neu.length && alt.every((w, i) => w === neu[i]);
      if (!gleich) { await abo.unsubscribe(); abo = null; }
    }

    if (!abo) {
      abo = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: b64urlZuUint8(schluessel)
      });
    }

    const antwort = await ruf('api/abo', {
      method: 'POST',
      body: JSON.stringify({
        abo: abo.toJSON(),
        geraet: Store.einst('geraet') || geraeteName()
      })
    });
    zustand.abos = antwort.abos || 0;
    melde();
    await planHochladen();
    return true;
  }

  async function pushAbmelden() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const abo = await reg.pushManager.getSubscription();
      if (abo) {
        await ruf('api/abo/weg', { method: 'POST', body: JSON.stringify({ endpoint: abo.endpoint }) }).catch(() => {});
        await abo.unsubscribe();
      }
    } catch (e) { /* dann eben nicht */ }
    zustand.abos = Math.max(0, zustand.abos - 1);
    melde();
  }

  async function pushAngemeldet() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
    try {
      const reg = await navigator.serviceWorker.ready;
      return !!(await reg.pushManager.getSubscription());
    } catch (e) { return false; }
  }

  function pushProbe() {
    return ruf('api/push/test', { method: 'POST', body: '{}' });
  }

  /** Eigene Erinnerungszeiten zum Server schicken, damit er sie einhält */
  function planHochladen() {
    if (!zustand.verfuegbar) return Promise.resolve(false);
    const eintraege = [];
    TAGE.forEach((iso) => {
      aufgabenFuerTag(iso).forEach((a) => {
        if (!a.erinnerung) return;
        eintraege.push({
          datum: iso,
          id: a.id,
          zeit: erinnerungsZeit(a),
          titel: a.titel,
          text: a.erinnerung.text
        });
      });
    });
    return ruf('api/plan', { method: 'POST', body: JSON.stringify({ plan: eintraege }) })
      .then(() => true).catch(() => false);
  }

  function schlummern(tag, aufgabe, minuten) {
    return ruf('api/schlummer', { method: 'POST', body: JSON.stringify({ tag, aufgabe, minuten }) })
      .then(() => true).catch(() => false);
  }

  function status() { return ruf('api/status'); }

  function geraeteName() {
    const ua = navigator.userAgent;
    if (/iPhone/.test(ua)) return 'iPhone';
    if (/iPad/.test(ua)) return 'iPad';
    if (/Android/.test(ua)) return 'Android';
    if (/Windows/.test(ua)) return 'Windows-PC';
    if (/Macintosh/.test(ua)) return 'Mac';
    return 'Gerät';
  }

  /* ==========================================================================
     Start
     ========================================================================== */
  function starten() {
    pruefen().then((da) => {
      if (!da) return;
      abgleichen(true).then(() => fotosAbgleichen());
      planHochladen();
    });

    // Bei jeder Änderung bald abgleichen
    Bus.an('aenderung', (e) => {
      if (e && (e.grund === 'abgleich' || e.grund === 'einstellung')) return;
      baldAbgleichen();
      if (e && e.grund === 'foto') setTimeout(fotosAbgleichen, 2000);
    });

    // Beim Zurückkommen und regelmäßig
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && zustand.verfuegbar) abgleichen(true);
    });
    window.addEventListener('online', () => { pruefen().then((da) => { if (da) abgleichen(true); }); });
    setInterval(() => { if (zustand.verfuegbar) abgleichen(true); else pruefen(); }, 60000);
  }

  return {
    zustand: () => zustand,
    pruefen, abgleichen, baldAbgleichen, fotosAbgleichen,
    pushMoeglich, pushHindernis, pushAnmelden, pushAbmelden, pushAngemeldet, pushProbe,
    planHochladen, schlummern, status, starten,
    istIos, alsAppGestartet, geraeteName
  };
})();
