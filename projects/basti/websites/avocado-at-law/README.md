# Avocado at Law 🥑⚖️

**Recht lernen – spielerisch und einfach.** Eine Lern-App im Duolingo-Stil, die
Jugendlichen österreichisches Rechtswissen vermittelt. Maskottchen ist die
Avocado **Avo**.

> ⚖️ **Hinweis:** Die Inhalte sind aktuell **Demo-Inhalte** und stellen **keine
> Rechtsberatung** dar. Später werden sie recherchiert und von Jurist:innen geprüft.

Ein Projekt für **Jugend Innovativ #40** (Kategorie ICT & Digital / Entrepreneurship)
von Bastian Klaus (16, CHS Villach).

## Was kann die App? (MVP)

- 🥑 Startbildschirm mit Maskottchen Avo
- 🗺️ Lernpfad mit runden Level-Kreisen (Duolingo-Stil)
- 📚 Beispiel-Lektion „Deine Rechte ab 14/16/18" mit 3 Quizfragen
- ✅ Sofort-Feedback bei richtig/falsch – Avo freut sich oder schaut traurig
- ⭐ XP-/Fortschrittsanzeige
- 👔 „Avo im Anwalts-Modus": erklärt einen lockeren Satz auf Juristen-Deutsch

## Technik

- **Expo (React Native)** + JavaScript – eine Codebasis für **iOS, Android und Web**
- **react-native-svg** für das gezeichnete Maskottchen Avo

## App starten

Voraussetzung: [Node.js](https://nodejs.org) installiert.

```bash
npm install
npx expo start
```

- **Browser:** im Terminal die Taste `w` drücken
- **Handy:** App „Expo Go" installieren und den QR-Code scannen
  (Handy & PC müssen im selben WLAN sein)

## Projektstruktur

```
App.js              Schaltzentrale (Bildschirme + XP)
src/screens/        StartScreen, PathScreen, LessonScreen
src/components/     Avo, LevelCircle, AnswerButton, ProgressBar
src/data/           lessons.js – die Lektions-Inhalte
src/theme/          colors.js – die Farbpalette
docs/               Projektbeschreibung (Jugend Innovativ)
```

## Status

Erster klickbarer Prototyp (MVP). Weitere Lektionen, echte geprüfte Inhalte und
mehr Spielmechaniken (Streaks, Achievements) folgen.
