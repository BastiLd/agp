# 🤖 Google Gemini Setup (Kostenlos!)

## Warum Gemini?

- ✅ **100% kostenlos** für die meisten Anwendungsfälle
- ✅ 60 Requests pro Minute (mehr als genug für den Start)
- ✅ Sehr gute Qualität für Excel-Formeln
- ✅ Keine Kreditkarte erforderlich

## Schritt 1: Gemini API Key holen

1. Gehe zu: **https://aistudio.google.com/app/apikey**
2. Logge dich mit deinem Google-Konto ein
3. Klicke auf **"Create API Key"**
4. Wähle ein Projekt (oder erstelle ein neues)
5. **Kopiere den API-Key** (beginnt mit `AIza...`)

## Schritt 2: In .env eintragen

Öffne deine `.env` Datei und trage ein:

```env
# KI-Provider auf "gemini" setzen
AI_PROVIDER="gemini"

# Gemini API Key
GEMINI_API_KEY="AIza-dein-api-key-hier"

# Modell (Standard: gemini-pro)
AI_MODEL="gemini-pro"
```

## Schritt 3: Fertig!

Die App verwendet jetzt automatisch Google Gemini statt OpenAI.

---

## 🔄 Zwischen Gemini und OpenAI wechseln

### Zu Gemini wechseln:
```env
AI_PROVIDER="gemini"
GEMINI_API_KEY="dein-key"
AI_MODEL="gemini-pro"
```

### Zu OpenAI wechseln:
```env
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-dein-key"
AI_MODEL="gpt-4o-mini"
```

**Wichtig:** Nach Änderung der `.env` Datei den Server neu starten:
```bash
# Server stoppen (Ctrl+C) und neu starten
npm run dev
```

---

## 📊 Verfügbare Gemini-Modelle

- `gemini-pro` - Standard, empfohlen
- `gemini-pro-vision` - Mit Bilderkennung (nicht benötigt)
- `gemini-1.5-pro` - Neuestes Modell (falls verfügbar)

---

## ⚠️ Limits

- **Free Tier**: 60 Requests/Minute
- **Rate Limit**: Wird automatisch behandelt
- **Kosten**: $0 für die meisten Nutzungen

Falls du mehr brauchst, kannst du später auf OpenAI wechseln oder ein bezahltes Gemini-Konto erstellen.

