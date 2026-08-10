# Wo was Filme Serien

Desktop-App zur weltweiten Streaming-Verfügbarkeits-Suche für Filme & Serien (Electron + React)

## Features

- Suche nach Filmen und Serien
- Zeigt Länder & Streamingdienste pro Titel
- Filter nach Land
- Interaktive Weltkarte (Leaflet)
- Dark Mode
- Favoriten & Suchverlauf (lokal gespeichert)
- VPN-Hinweis, falls nicht verfügbar

## Installation

1. **API-Key eintragen:**
   - Registriere dich bei [TMDb](https://www.themoviedb.org/) und trage deinen API-Key in `main.js` ein (`const TMDB_API_KEY = 'YOUR_API_KEY'`).
2. **Abhängigkeiten installieren:**
   ```bash
   npm install
   cd renderer && npm install
   ```
3. **App starten:**
   ```bash
   npm start
   ```

## Build (Windows, macOS, Linux)

```bash
npm run build
```

## Hinweise

- Die App nutzt die TMDb-API (Daten von JustWatch, Attribution erforderlich).
- Favoriten/Suchverlauf werden lokal gespeichert (electron-store).
- Bei Problemen: API-Key prüfen, Internetverbindung sicherstellen.

---

MIT License
