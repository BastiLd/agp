// Oberflaeche. Redet ueber JSON-Zeilen mit dem Python-Kern; die Rust-Seite reicht
// die Zeilen nur durch.

const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;
const { open } = window.__TAURI__.dialog;

const AUDIOFORMATE = ["opus", "ogg", "oga", "m4a", "mp3", "wav", "mp4", "aac", "flac", "webm", "wma"];

const el = (id) => document.getElementById(id);
const zustandstext = el("zustandstext");
const punkt = el("punkt");

let naechsteKennung = 1;
const auftraege = new Map();   // Kennung -> { karten: Map<pfad, Karte> }
const karten = new Map();      // Pfad -> Kartenobjekt
let beobachteterOrdner = null;

// ---------------------------------------------------------------- Grundlagen

async function senden(auftrag) {
  const id = String(naechsteKennung++);
  await invoke("auftrag", { zeile: JSON.stringify({ id, ...auftrag }) });
  return id;
}

function melden(text, schlecht = false) {
  const hinweis = el("hinweis");
  hinweis.textContent = text;
  hinweis.classList.toggle("schlecht", schlecht);
  hinweis.classList.add("sichtbar");
  clearTimeout(melden.uhr);
  melden.uhr = setTimeout(() => hinweis.classList.remove("sichtbar"), 2200);
}

function zustand(text, art = "") {
  zustandstext.textContent = text;
  punkt.className = "punkt" + (art ? " " + art : "");
}

async function kopieren(text, was = "Text") {
  if (!text) return melden("Nichts zu kopieren.", true);
  try {
    await navigator.clipboard.writeText(text);
    melden(`${was} kopiert.`);
  } catch {
    // Fallback fuer den Fall, dass die Zwischenablage-Freigabe fehlt.
    const feld = document.createElement("textarea");
    feld.value = text;
    feld.style.position = "fixed";
    feld.style.opacity = "0";
    document.body.appendChild(feld);
    feld.select();
    const geklappt = document.execCommand("copy");
    feld.remove();
    melden(geklappt ? `${was} kopiert.` : "Kopieren nicht moeglich.", !geklappt);
  }
}

function zeitform(sekunden) {
  const m = Math.floor(sekunden / 60), s = Math.round(sekunden % 60);
  return m ? `${m}:${String(s).padStart(2, "0")} min` : `${s} s`;
}

// ---------------------------------------------------------------- Warteschlange

function warteEintrag(pfad, name) {
  const liste = el("warteliste");
  let eintrag = liste.querySelector(`[data-pfad="${CSS.escape(pfad)}"]`);
  if (!eintrag) {
    eintrag = document.createElement("li");
    eintrag.dataset.pfad = pfad;
    eintrag.innerHTML = `<span class="warte-name"></span>
                         <span class="warte-phase">wartet</span>
                         <div class="balken"><div></div></div>`;
    eintrag.querySelector(".warte-name").textContent = name;
    liste.appendChild(eintrag);
    el("warteschlange").classList.remove("leer");
  }
  return eintrag;
}

function wartestand(pfad, anteil, phase, art = "") {
  const eintrag = el("warteliste").querySelector(`[data-pfad="${CSS.escape(pfad)}"]`);
  if (!eintrag) return;
  eintrag.querySelector(".balken > div").style.width = `${Math.round(anteil * 100)}%`;
  eintrag.querySelector(".warte-phase").textContent = phase;
  if (art) eintrag.classList.add(art);
}

// ---------------------------------------------------------------- Ergebniskarte

function karteBauen(daten) {
  const karte = document.createElement("article");
  karte.className = "karte";
  karte.innerHTML = `
    <div class="karte-kopf">
      <span class="karte-titel"></span>
      <span class="karte-meta"></span>
      <div class="karte-werkzeuge">
        <button class="knopf knopf-klein" data-tat="alles">Alles kopieren</button>
        <button class="knopf knopf-klein knopf-still" data-tat="markdown">Zu Markdown aufräumen</button>
      </div>
    </div>
    <div class="reiter">
      <button data-blatt="text" class="aktiv">Text</button>
      <button data-blatt="zeit">Mit Zeitmarken</button>
      <button data-blatt="markdown" disabled>Markdown</button>
    </div>
    <div class="blatt" data-blatt="text"></div>
    <div class="blatt" data-blatt="zeit" hidden></div>
    <div class="blatt markdown-blatt wartet" data-blatt="markdown" hidden>
      Noch nicht aufgeräumt. „Zu Markdown aufräumen“ startet das kleine Sprachmodell.
    </div>`;

  karte.querySelector(".karte-titel").textContent = daten.name;
  karte.querySelector(".karte-meta").textContent =
    `${zeitform(daten.dauer)} Audio · ${daten.rechenzeit.toFixed(1)} s · ${daten.faktor.toFixed(1)}× · ${daten.geraet}`;

  // Absaetze: jeder mit eigenem Kopier-Knopf.
  // Wichtig: immer mit '.blatt' davor suchen - die Reiter-Knoepfe tragen dasselbe
  // data-blatt und stehen im DOM vorher, sonst landet der Text im Knopf.
  const textblatt = karte.querySelector('.blatt[data-blatt="text"]');
  for (const absatz of daten.absaetze) {
    const stueck = document.createElement("div");
    stueck.className = "absatz";
    stueck.innerHTML = `<p></p><button class="absatz-kopieren">kopieren</button>`;
    stueck.querySelector("p").textContent = absatz;
    stueck.querySelector("button").addEventListener("click", () => kopieren(absatz, "Absatz"));
    textblatt.appendChild(stueck);
  }

  const zeitblatt = karte.querySelector('.blatt[data-blatt="zeit"]');
  for (const segment of daten.segmente) {
    const zeile = `[${zeitform(segment.start)} – ${zeitform(segment.ende)}] ${segment.text}`;
    const stueck = document.createElement("div");
    stueck.className = "absatz";
    stueck.innerHTML = `<p></p><button class="absatz-kopieren">kopieren</button>`;
    stueck.querySelector("p").textContent = zeile;
    stueck.querySelector("button").addEventListener("click", () => kopieren(zeile, "Zeile"));
    zeitblatt.appendChild(stueck);
  }

  karte.querySelectorAll(".reiter button").forEach((knopf) => {
    knopf.addEventListener("click", () => {
      karte.querySelectorAll(".reiter button").forEach((k) => k.classList.toggle("aktiv", k === knopf));
      karte.querySelectorAll(".blatt").forEach((b) => {
        b.hidden = b.dataset.blatt !== knopf.dataset.blatt;
      });
    });
  });

  const eintrag = { wurzel: karte, daten, markdown: null };

  karte.querySelector('[data-tat="alles"]').addEventListener("click", () => {
    const sichtbar = karte.querySelector(".reiter button.aktiv").dataset.blatt;
    const inhalt = sichtbar === "markdown" ? eintrag.markdown
                 : sichtbar === "zeit" ? daten.mit_zeitmarken
                 : daten.absaetze.join("\n\n");
    kopieren(inhalt, "Transkript");
  });

  karte.querySelector('[data-tat="markdown"]').addEventListener("click", async (ereignis) => {
    ereignis.target.disabled = true;
    ereignis.target.textContent = "Wird aufgeräumt…";
    const id = await senden({ art: "formatieren", text: daten.text });
    auftraege.set(id, { markdownFuer: eintrag });
    zustand("Modellwechsel — Whisper wird entladen…", "arbeitet");
  });

  el("ergebnisse").prepend(karte);
  karten.set(daten.datei, eintrag);
  return eintrag;
}

function markdownEintragen(eintrag, text) {
  eintrag.markdown = text;
  const blatt = eintrag.wurzel.querySelector('.blatt[data-blatt="markdown"]');
  blatt.textContent = text;
  blatt.classList.remove("wartet");

  const reiter = eintrag.wurzel.querySelector('.reiter [data-blatt="markdown"]');
  reiter.disabled = false;
  reiter.click();

  const knopf = eintrag.wurzel.querySelector('[data-tat="markdown"]');
  knopf.textContent = "Erneut aufräumen";
  knopf.disabled = false;
}

// ---------------------------------------------------------------- Protokoll

let protokollZeilen = 0;

function protokollZeile(nachricht) {
  const feld = el("protokoll-text");
  const zeit = new Date(nachricht.zeit * 1000).toLocaleTimeString("de-DE");
  const zeile = document.createElement("span");
  zeile.className = nachricht.stufe;
  zeile.textContent = `[${zeit}] ${nachricht.quelle}: ${nachricht.text}\n`;
  feld.appendChild(zeile);
  feld.scrollTop = feld.scrollHeight;
  el("protokoll-zaehler").textContent = ++protokollZeilen;
}

// ---------------------------------------------------------------- Aufträge

function pfadeSchicken(pfade) {
  if (!pfade.length) return;
  const auftrag = {
    art: "transkribieren",
    pfade,
    txt: el("wahl-txt").checked,
    rekursiv: true,
  };
  zustand("Wird verarbeitet…", "arbeitet");
  senden(auftrag).then((id) => auftraege.set(id, { markdownNachher: el("wahl-markdown").checked }));
}

function istAudio(pfad) {
  return AUDIOFORMATE.includes(pfad.split(".").pop().toLowerCase());
}

// ---------------------------------------------------------------- Ereignisse

listen("kern", ({ payload: n }) => {
  switch (n.art) {
    case "bereit":
      zustand("Kern wird vorbereitet …", "arbeitet");
      break;

    case "vorbereitet":
      senden({ art: "zustand" });
      break;

    case "zustand": {
      const d = n.daten;
      const gpu = d.gpu
        ? `${d.gpu.name} · ${d.gpu.vram_gesamt_mb - d.gpu.vram_belegt_mb} MB frei`
        : "kein NVIDIA-Chip — läuft auf dem Prozessor";
      zustand(`${gpu} · ${d.modell}`, "bereit");
      if (d.modell) el("wahl-modell").value = d.modell;
      break;
    }

    case "warteschlange":
      for (const datei of n.dateien) warteEintrag(datei.pfad, datei.name);
      break;

    case "fortschritt":
      if (n.datei) wartestand(n.datei, n.anteil, n.phase);
      else zustand(n.phase, "arbeitet");
      break;

    case "transkript": {
      wartestand(n.daten.datei, 1, "fertig", "fertig");
      const eintrag = karteBauen(n.daten);
      if (auftraege.get(n.id)?.markdownNachher) {
        eintrag.wurzel.querySelector('[data-tat="markdown"]').click();
      }
      break;
    }

    case "markdown": {
      const eintrag = auftraege.get(n.id)?.markdownFuer;
      if (eintrag) markdownEintragen(eintrag, n.text);
      melden("Markdown ist fertig.");
      break;
    }

    case "dateifehler":
      wartestand(n.datei, 1, "Fehler", "fehler");
      melden(n.text, true);
      break;

    case "fertig":
      auftraege.delete(n.id);
      zustand(beobachteterOrdner ? `Überwacht: ${beobachteterOrdner}` : "Bereit", "bereit");
      break;

    case "fehler":
      zustand("Fehler", "fehler");
      melden(n.text, true);
      for (const knopf of document.querySelectorAll('[data-tat="markdown"]:disabled')) {
        knopf.disabled = false;
        knopf.textContent = "Zu Markdown aufräumen";
      }
      break;

    case "beobachtet": {
      beobachteterOrdner = n.ordner;
      const knopf = el("knopf-beobachten");
      knopf.textContent = "Überwachung beenden";
      knopf.classList.remove("knopf-still");
      zustand(`Überwacht: ${n.ordner}`, "bereit");
      melden("Neue Dateien in diesem Ordner werden sofort verarbeitet.");
      break;
    }

    case "beobachtung_beendet": {
      if (!beobachteterOrdner) break;
      beobachteterOrdner = null;
      const knopf = el("knopf-beobachten");
      knopf.textContent = "Ordner überwachen";
      knopf.classList.add("knopf-still");
      zustand("Bereit", "bereit");
      melden("Überwachung beendet.");
      break;
    }

    case "neue_datei":
      warteEintrag(n.pfad, n.name);
      melden(`Neu: ${n.name}`);
      break;

    case "protokollzeile":
      protokollZeile(n);
      break;

    case "protokoll":
      kopieren(n.text, "Protokoll");
      break;

    case "beendet":
      zustand("Kern beendet — Neustart nötig", "fehler");
      break;
  }
});

// Dateien ins Fenster ziehen.
const ablage = el("ablage");
listen("tauri://drag-enter", () => ablage.classList.add("bereit-zum-fallen"));
listen("tauri://drag-leave", () => ablage.classList.remove("bereit-zum-fallen"));
listen("tauri://drag-drop", ({ payload }) => {
  ablage.classList.remove("bereit-zum-fallen");
  const pfade = (payload.paths || []).filter((p) => istAudio(p) || !p.includes("."));
  if (!pfade.length) return melden("Keine Audiodateien dabei.", true);
  pfadeSchicken(pfade);
});

el("knopf-dateien").addEventListener("click", async () => {
  const wahl = await open({
    multiple: true,
    filters: [{ name: "Audio", extensions: AUDIOFORMATE }],
  });
  if (wahl) pfadeSchicken(Array.isArray(wahl) ? wahl : [wahl]);
});

el("knopf-ordner").addEventListener("click", async () => {
  const wahl = await open({ directory: true });
  if (wahl) pfadeSchicken([wahl]);
});

el("knopf-beobachten").addEventListener("click", async () => {
  if (beobachteterOrdner) {
    await senden({ art: "beobachtung_beenden" });
    return;
  }
  const wahl = await open({ directory: true });
  if (!wahl) return;
  await senden({ art: "beobachten", ordner: wahl, txt: el("wahl-txt").checked });
});

el("wahl-modell").addEventListener("change", (e) => {
  senden({ art: "einstellen", werte: { modell: e.target.value } });
  melden(`Modell auf ${e.target.value} gestellt.`);
});

el("protokoll-schalter").addEventListener("click", () => {
  const bereich = el("protokoll");
  bereich.classList.toggle("zu");
  el("protokoll-schalter").setAttribute("aria-expanded", String(!bereich.classList.contains("zu")));
});

el("protokoll-leeren").addEventListener("click", () => {
  el("protokoll-text").textContent = "";
  protokollZeilen = 0;
  el("protokoll-zaehler").textContent = "0";
});

document.querySelector('[data-kopieren="protokoll"]')
  .addEventListener("click", () => kopieren(el("protokoll-text").textContent, "Protokoll"));

// Der Kern meldet sich beim Start von selbst - diese Meldung kann aber schon durch
// sein, bevor die Oberflaeche zuhoert. Deshalb hier aktiv nachfragen, bis er antwortet.
(async function erstabfrage() {
  for (let versuch = 0; versuch < 25; versuch++) {
    try {
      await senden({ art: "zustand" });
      return;
    } catch {
      await new Promise((weiter) => setTimeout(weiter, 400));
    }
  }
  zustand("Kern antwortet nicht — bitte App neu starten", "fehler");
})();
