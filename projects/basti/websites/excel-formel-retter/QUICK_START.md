# 🚀 Quick Start - Excel Formel Retter

## 1️⃣ Dependencies installieren

```bash
npm install
```

---

## 2️⃣ .env Datei erstellen

Erstelle eine `.env` Datei im Projektordner und kopiere den Inhalt von `env.example` hinein.

**Windows PowerShell:**
```powershell
Copy-Item env.example .env
```

**Mac/Linux:**
```bash
cp env.example .env
```

---

## 3️⃣ API-Keys eintragen

Öffne die `.env` Datei und trage folgende Werte ein:

### 📊 Datenbank (PostgreSQL)

**Option 1: Supabase (Kostenlos, Empfohlen)**
1. Gehe zu [supabase.com](https://supabase.com)
2. Erstelle kostenloses Projekt
3. Settings → Database → Connection String kopieren
4. In `.env` eintragen: `DATABASE_URL="postgresql://..."`

**Option 2: Railway (Kostenlos)**
1. Gehe zu [railway.app](https://railway.app)
2. Erstelle PostgreSQL-Datenbank
3. Connection String kopieren
4. In `.env` eintragen

### 🤖 KI-API (Google Gemini - Kostenlos!)

**Option 1: Google Gemini (Empfohlen - Kostenlos)**
1. Gehe zu [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Logge dich mit Google ein
3. Create API Key → Key kopieren
4. In `.env` eintragen:
   ```
   AI_PROVIDER="gemini"
   GEMINI_API_KEY="AIza-dein-key-hier"
   AI_MODEL="gemini-pro"
   ```

**Option 2: OpenAI (Kostenpflichtig)**
1. Gehe zu [platform.openai.com](https://platform.openai.com)
2. API Keys → Create new secret key
3. Key kopieren (beginnt mit `sk-`)
4. In `.env` eintragen:
   ```
   AI_PROVIDER="openai"
   OPENAI_API_KEY="sk-dein-key-hier"
   AI_MODEL="gpt-4o-mini"
   ```

### 💳 Stripe

1. Gehe zu [stripe.com](https://stripe.com) → Erstelle Konto
2. Developers → API keys → Kopiere:
   - Secret key (`sk_test_...`)
   - Publishable key (`pk_test_...`)
3. Products → Erstelle 3 Produkte:
   - Monatlich: 3,99 € (Price ID kopieren)
   - Jährlich: 39 € (Price ID kopieren)
   - Lifetime: 69 € (Price ID kopieren)
4. In `.env` eintragen:
   ```
   STRIPE_SECRET_KEY="sk_test_..."
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_PRICE_ID_MONTHLY="price_..."
   STRIPE_PRICE_ID_YEARLY="price_..."
   STRIPE_PRICE_ID_LIFETIME="price_..."
   ```

### 🔗 App URL

Für lokale Entwicklung:
```
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 4️⃣ Datenbank einrichten

```bash
npx prisma generate
npx prisma migrate dev --name init
```

---

## 5️⃣ App starten

```bash
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000) im Browser.

---

## ✅ Fertig!

Die App sollte jetzt funktionieren. Teste:
- Formel generieren
- Limit erreichen (5 Anfragen)
- Upgrade-Overlay

---

## 📚 Detaillierte Anleitung

Für ausführlichere Erklärungen siehe `INSTALLATION.md`

