# Medien-Suche-Privat

Windows-Desktop-App zum Indexieren und Vergleichen von Plex-, PC-, NAS- und USB-Medien.

## Starten

```powershell
npm run dev
```

Produktionsbuild pruefen:

```powershell
npm run build
npm run preview
```

## Nutzung

1. Quelle auswaehlen: `Plex`, `PC/NAS`, `USB` oder `Sonstiges`.
2. Ordner hinzufuegen. Samba/SMB-Pfade funktionieren als gemappte Laufwerke oder UNC-Pfade.
3. `Neu indexieren` klicken.
4. Titel eingeben, mit Semikolon trennen, zeilenweise einfuegen oder eine `.txt`-Datei in das Suchfeld ziehen.
5. Ergebnisse zeigen `Auf Plex`, `Auf PC/NAS/USB`, `Fehlt`, Duplikate und erkannte Qualitaet.

## TMDb

Die App funktioniert offline. Optional kann ein kostenloser TMDb-Key oder Read Access Token in den Einstellungen gespeichert werden:

https://developer.themoviedb.org/docs/getting-started
