'use strict';

const SYMBOLE = {
  websites: '\u{1F310}',
  'python-apps': '\u{1F40D}',
  'browser-extensions': '\u{1F9E9}',
  'desktop-apps': '\u{1F5A5}️'
};

const FARBEN = {
  websites: '#5aa6f0',
  'python-apps': '#f0c14a',
  'browser-extensions': '#c084f5',
  'desktop-apps': '#4ad6c0'
};

const zustand = {
  daten: null,
  privat: null,
  person: localStorage.getItem('agp.person') || 'basti',
  groesse: localStorage.getItem('agp.groesse') || 'mittel',
  suche: ''
};

const $ = (s) => document.querySelector(s);
const inhalt = $('#inhalt');

/* ---------- Person & Größe ---------- */

function personSetzen(person) {
  zustand.person = person;
  localStorage.setItem('agp.person', person);
  document.body.dataset.person = person;
  document.documentElement.style.setProperty('--akzent', person === 'mijo' ? 'var(--mijo)' : 'var(--basti)');
  document.documentElement.style.setProperty('--akzent-hell', person === 'mijo' ? 'var(--mijo-hell)' : 'var(--basti-hell)');

  $('#schieberName').textContent = person === 'mijo' ? 'Mijo' : 'Basti';
  $('#untertitel').textContent = person === 'mijo'
    ? 'Die Projekte von Mijo'
    : 'Die Projekte von Basti';

  const schieber = $('#schieber');
  schieber.setAttribute('aria-valuenow', person === 'mijo' ? '1' : '0');
  schieber.setAttribute('aria-valuetext', person === 'mijo' ? 'Mijo' : 'Basti');

  document.querySelectorAll('.person-seite').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.person === person));
  });

  zeichnen();
}

function groesseSetzen(groesse) {
  zustand.groesse = groesse;
  localStorage.setItem('agp.groesse', groesse);
  document.body.dataset.groesse = groesse;
  document.querySelectorAll('.groessen-schalter button').forEach((b) => {
    b.setAttribute('aria-checked', String(b.dataset.groesse === groesse));
  });
}

/* ---------- Schieber: klicken und ziehen ---------- */

function schieberEinrichten() {
  const schalter = $('#personSchalter');
  const schieber = $('#schieber');
  let zieht = false;
  let startX = 0;
  let startLinks = false;

  document.querySelectorAll('.person-seite').forEach((b) => {
    b.addEventListener('click', () => personSetzen(b.dataset.person));
  });

  schieber.addEventListener('pointerdown', (e) => {
    zieht = true;
    startX = e.clientX;
    startLinks = zustand.person === 'basti';
    schieber.classList.add('zieht');
    schieber.setPointerCapture(e.pointerId);
  });

  schieber.addEventListener('pointermove', (e) => {
    if (!zieht) return;
    const weg = schalter.clientWidth / 2;
    let anteil = (e.clientX - startX) / weg + (startLinks ? 0 : 1);
    anteil = Math.min(1, Math.max(0, anteil));
    schieber.style.transform = `translateX(${anteil * 100}%)`;
    $('#schieberName').textContent = anteil > 0.5 ? 'Mijo' : 'Basti';
  });

  const beenden = (e) => {
    if (!zieht) return;
    zieht = false;
    schieber.classList.remove('zieht');
    schieber.style.transform = '';
    const weg = schalter.clientWidth / 2;
    const anteil = Math.min(1, Math.max(0, (e.clientX - startX) / weg + (startLinks ? 0 : 1)));
    const bewegt = Math.abs(e.clientX - startX) > 4;
    if (bewegt) {
      personSetzen(anteil > 0.5 ? 'mijo' : 'basti');
    } else {
      personSetzen(zustand.person === 'basti' ? 'mijo' : 'basti');
    }
  };

  schieber.addEventListener('pointerup', beenden);
  schieber.addEventListener('pointercancel', beenden);

  schieber.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); personSetzen('mijo'); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); personSetzen('basti'); }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      personSetzen(zustand.person === 'basti' ? 'mijo' : 'basti');
    }
  });
}

/* ---------- Zeichnen ---------- */

function sichtbareProjekte() {
  const alle = [
    ...(zustand.daten?.projekte || []),
    ...(zustand.privat?.projekte || []).map((p) => ({ ...p, istPrivat: true }))
  ];

  const suche = zustand.suche.trim().toLowerCase();

  return alle.filter((p) => {
    if (p.besitzer !== zustand.person && p.besitzer !== 'beide') return false;
    if (!suche) return true;
    return [p.titel, p.kurz, p.beschreibung, ...(p.tech || [])]
      .join(' ').toLowerCase().includes(suche);
  });
}

function zeichnen() {
  if (!zustand.daten) return;

  const projekte = sichtbareProjekte();
  const kategorien = zustand.daten.kategorien;

  if (!projekte.length) {
    inhalt.innerHTML = zustand.suche
      ? `<p class="leer"><strong>Nichts gefunden</strong>Kein Projekt passt zu „${escapeHtml(zustand.suche)}".</p>`
      : `<p class="leer"><strong>Noch keine Projekte</strong>Für ${zustand.person === 'mijo' ? 'Mijo' : 'Basti'} ist hier noch nichts hinterlegt.</p>`;
    return;
  }

  const reihenfolge = Object.keys(kategorien);
  const gruppen = new Map();
  for (const p of projekte) {
    if (!gruppen.has(p.kategorie)) gruppen.set(p.kategorie, []);
    gruppen.get(p.kategorie).push(p);
  }

  const teile = [];
  for (const schluessel of reihenfolge) {
    const liste = gruppen.get(schluessel);
    if (!liste?.length) continue;
    liste.sort((a, b) => a.titel.localeCompare(b.titel, 'de'));
    teile.push(`
      <section class="gruppe">
        <h2 class="gruppe-titel">
          ${escapeHtml(kategorien[schluessel].label)}
          <span class="gruppe-anzahl">${liste.length} ${liste.length === 1 ? 'Projekt' : 'Projekte'}</span>
        </h2>
        <div class="raster">${liste.map(kachelHtml).join('')}</div>
      </section>`);
  }

  inhalt.innerHTML = teile.join('');
  inhalt.querySelectorAll('.kachel').forEach((k) => {
    k.addEventListener('click', () => detailZeigen(k.dataset.id));
  });
}

function kachelHtml(p) {
  const marken = [];
  if (p.live) marken.push('<span class="marke live">Live</span>');
  if (p.repo) marken.push('<span class="marke repo">Repo</span>');
  if (p.besitzer === 'beide') marken.push('<span class="marke geteilt">Gemeinsam</span>');
  if (p.istPrivat) marken.push('<span class="marke">Privat</span>');

  return `
    <button type="button" class="kachel" data-id="${escapeHtml(p.id)}">
      <span class="kachel-symbol" style="--kachel-farbe:${FARBEN[p.kategorie] || '#5aa6f0'}">${SYMBOLE[p.kategorie] || '\u{1F4C1}'}</span>
      <span class="kachel-titel">${escapeHtml(p.titel)}</span>
      <span class="kachel-kurz">${escapeHtml(p.kurz)}</span>
      ${marken.length ? `<span class="kachel-marken">${marken.join('')}</span>` : ''}
    </button>`;
}

/* ---------- Detailansicht ---------- */

function projektFinden(id) {
  return sichtbareProjekte().find((p) => p.id === id);
}

function liveAdresse(p) {
  if (p.live === 'selbst') return `${p.pfad}/${p.einstieg || 'index.html'}`;
  return p.live;
}

function detailZeigen(id) {
  const p = projektFinden(id);
  if (!p) return;

  const kat = zustand.daten.kategorien[p.kategorie]?.label || p.kategorie;
  const url = liveAdresse(p);

  const knoepfe = [];
  if (url) knoepfe.push(`<a class="knopf haupt" href="${escapeHtml(url)}" target="_blank" rel="noopener">Website öffnen</a>`);
  if (p.repo) knoepfe.push(`<a class="knopf" href="${escapeHtml(p.repo)}" target="_blank" rel="noopener">Repository ansehen</a>`);
  if (p.pfad && !p.istPrivat) {
    knoepfe.push(`<a class="knopf" href="https://github.com/BastiLd/agp/tree/main/${escapeHtml(p.pfad)}" target="_blank" rel="noopener">Code in diesem Repo</a>`);
  }

  $('#detailInhalt').innerHTML = `
    <div class="detail-kopf">
      <span class="kachel-symbol" style="--kachel-farbe:${FARBEN[p.kategorie] || '#5aa6f0'}">${SYMBOLE[p.kategorie] || '\u{1F4C1}'}</span>
      <div>
        <h2 id="detailTitel">${escapeHtml(p.titel)}</h2>
        <p class="detail-meta">${escapeHtml(kat)}${p.stand ? ` · Stand ${escapeHtml(p.stand)}` : ''}${p.besitzer === 'beide' ? ' · Gemeinsames Projekt' : ''}</p>
      </div>
    </div>

    <p class="detail-text">${escapeHtml(p.beschreibung)}</p>

    ${p.tech?.length ? `
      <div class="detail-abschnitt">
        <h3>Verwendete Technik</h3>
        <div class="tech-liste">${p.tech.map((t) => `<span class="tech">${escapeHtml(t)}</span>`).join('')}</div>
      </div>` : ''}

    ${!url && p.liveHinweis ? `
      <div class="detail-abschnitt">
        <p class="hinweis">${escapeHtml(p.liveHinweis)}</p>
      </div>` : ''}

    ${knoepfe.length ? `
      <div class="detail-abschnitt">
        <h3>Links</h3>
        <div class="detail-knoepfe">${knoepfe.join('')}</div>
      </div>` : ''}`;

  overlayOeffnen('#detailOverlay');
}

/* ---------- Overlay-Steuerung ---------- */

let zuletztFokussiert = null;

function overlayOeffnen(wahl) {
  zuletztFokussiert = document.activeElement;
  const o = $(wahl);
  o.hidden = false;
  document.body.style.overflow = 'hidden';
  o.querySelector('input, button:not([data-schliessen])')?.focus();
}

function overlayZu() {
  document.querySelectorAll('.overlay').forEach((o) => { o.hidden = true; });
  document.body.style.overflow = '';
  zuletztFokussiert?.focus();
}

document.addEventListener('click', (e) => {
  if (e.target.closest('[data-schliessen]')) overlayZu();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') overlayZu();
});

/* ---------- Privater Bereich (AES-GCM) ---------- */

async function entschluesseln(passwort) {
  const antwort = await fetch('data/private.enc');
  if (!antwort.ok) throw new Error('nicht gefunden');
  const paket = await antwort.json();

  const roh = new TextEncoder().encode(passwort);
  const basis = await crypto.subtle.importKey('raw', roh, 'PBKDF2', false, ['deriveKey']);
  const schluessel = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: b64(paket.salt), iterations: paket.iterationen, hash: 'SHA-256' },
    basis,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const klar = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64(paket.iv) },
    schluessel,
    b64(paket.daten)
  );

  return JSON.parse(new TextDecoder().decode(klar));
}

function b64(s) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

$('#privatLink').addEventListener('click', () => {
  $('#passwortFehler').hidden = true;
  $('#passwortEingabe').value = '';
  overlayOeffnen('#passwortOverlay');
});

$('#passwortForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fehler = $('#passwortFehler');
  fehler.hidden = true;
  try {
    zustand.privat = await entschluesseln($('#passwortEingabe').value);
    overlayZu();
    $('#privatLink').textContent = 'privat · entsperrt';
    zeichnen();
  } catch {
    fehler.textContent = 'Passwort stimmt nicht.';
    fehler.hidden = false;
  }
});

/* ---------- Hilfsmittel ---------- */

function escapeHtml(wert) {
  return String(wert ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/* ---------- Start ---------- */

async function start() {
  schieberEinrichten();
  groesseSetzen(zustand.groesse);

  document.querySelectorAll('.groessen-schalter button').forEach((b) => {
    b.addEventListener('click', () => groesseSetzen(b.dataset.groesse));
  });

  let timer;
  $('#suche').addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => { zustand.suche = e.target.value; zeichnen(); }, 120);
  });

  $('#jahr').textContent = new Date().getFullYear();

  try {
    const antwort = await fetch('data/projects.json');
    zustand.daten = await antwort.json();
  } catch {
    inhalt.innerHTML = '<p class="leer"><strong>Daten konnten nicht geladen werden</strong>Bitte die Seite neu laden.</p>';
    return;
  }

  personSetzen(zustand.person);
}

start();
