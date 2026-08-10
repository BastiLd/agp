# KI-Antwort Verifizierer

Eine Webanwendung zur Überprüfung von KI-generierten Antworten gegen angegebene Quellen.

## Funktionen

- Überprüfung von KI-Antworten gegen angegebene Quellen
- Vergleich von zwei KI-Antworten
- Detaillierte Analyse der Übereinstimmungen
- Modernes, benutzerfreundliches Interface

## Voraussetzungen

- Node.js (Version 14 oder höher)
- npm (wird mit Node.js installiert)

## Installation

1. Klonen Sie das Repository:

```bash
git clone [repository-url]
cd [repository-name]
```

2. Installieren Sie die Server-Abhängigkeiten:

```bash
cd server
npm install
```

3. Installieren Sie die Client-Abhängigkeiten:

```bash
cd ../client
npm install
```

## Starten der Anwendung

1. Starten Sie den Server:

```bash
cd server
npm run dev
```

2. Starten Sie den Client (in einem neuen Terminal):

```bash
cd client
npm start
```

3. Öffnen Sie http://localhost:3000 in Ihrem Browser

## Verwendung

1. Fügen Sie die KI-Antwort in das erste Textfeld ein
2. Optional: Fügen Sie eine zweite KI-Antwort zum Vergleich ein
3. Fügen Sie die Quellen-URLs ein (eine pro Zeile)
4. Klicken Sie auf "Antwort verifizieren"
5. Sehen Sie sich die detaillierten Ergebnisse an:
   - Übereinstimmende Inhalte
   - Nicht übereinstimmende Inhalte
   - Vergleich der beiden KI-Antworten (falls angegeben)

## Technologien

- Frontend:

  - React
  - Tailwind CSS
  - Axios

- Backend:
  - Express.js
  - Cheerio (Web Scraping)
  - Natural (Textanalyse)

## Entwicklung

Die Anwendung ist als Basis für ein Freemium-Modell konzipiert. Mögliche Erweiterungen:

- Benutzerkonten und Authentifizierung
- Speichern von Verifizierungsergebnissen
- Erweiterte Textanalyse
- API-Zugang für Drittanbieter
- Premium-Features wie:
  - Erweiterte Quellenanalyse
  - Batch-Verarbeitung
  - Export-Funktionen
  - API-Zugang
