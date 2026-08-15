/* ============================================================================
   kontakte.js  –  Telefonliste für Notfälle
   ----------------------------------------------------------------------------
   ⚠️  ACHTUNG – PRIVATE TELEFONNUMMERN

   Diese Datei enthält echte Rufnummern von Nachbarn und Familie.

   • Auf dem eigenen Server im Tailnet: unproblematisch.
   • In einem ÖFFENTLICHEN GitHub-Repo: die Nummern wären für jeden im
     Internet lesbar. Dann entweder das Repo auf "Private" stellen oder
     den Inhalt von KONTAKTE_VORGABE unten auf [] setzen.

   Die App funktioniert auch ohne diese Datei. Fehlt sie, bleibt die
   Notfall-Ansicht leer und lässt sich von Hand befüllen; eigene Einträge
   liegen ohnehin nur im Browser des Geräts.
   ========================================================================== */
'use strict';

const KONTAKTE_VORGABE = [
  {
    gruppe: 'Nachbarn',
    eintraege: [
      { name: 'Robert', rolle: 'Nachbar',   nummer: '0650 5259563' },
      { name: 'Sonja',  rolle: 'Nachbarin', nummer: '0650 5259161' }
    ]
  },
  {
    gruppe: 'Familie & Freunde',
    eintraege: [
      { name: 'Tina',   rolle: 'Rene & Selina', nummer: '0699 14000007' },
      { name: 'Harald', rolle: 'Svea',          nummer: '0664 8238990' },
      { name: 'Lissy',  rolle: 'Oliver',        nummer: '0699 15506771' }
    ]
  },
  {
    gruppe: 'Notruf',
    notruf: true,
    eintraege: [
      { name: 'Feuerwehr', rolle: 'Brand, Unfall, Wasser', nummer: '122', icon: 'i-feuer' },
      { name: 'Polizei',   rolle: 'Einbruch, Gefahr',      nummer: '133', icon: 'i-polizei' },
      { name: 'Rettung',   rolle: 'Verletzung, Notfall',   nummer: '144', icon: 'i-rettung' },
      { name: 'Euronotruf', rolle: 'geht überall in Europa', nummer: '112', icon: 'i-rettung' }
    ]
  }
];
