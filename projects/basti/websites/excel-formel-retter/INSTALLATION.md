# 📦 Installations-Anleitung - Excel Formel Retter

## Schritt 1: Dependencies installieren

Öffne ein Terminal im Projektordner und führe aus:

```bash
npm install
```

Dies installiert alle benötigten Pakete:
- Next.js, React, TypeScript
- Prisma (Datenbank)
- Stripe (Zahlungen)
- Tailwind CSS (Styling)

---

## Schritt 2: Umgebungsvariablen konfigurieren

### 2.1 .env Datei erstellen

Kopiere die Beispiel-Datei:
```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# Mac/Linux
cp .env.example .env
```

### 2.2 .env Datei öffnen und ausfüllen

Öffne die `.env` Datei in einem Texteditor. Du musst folgende Werte eintragen:

---

## Schritt 3: Datenbank einrichten

### Option A: Supabase (Kostenlos, Empfohlen)

1. Gehe zu [supabase.com](https://supabase.com) und erstelle ein kostenloses Konto
2. Erstelle ein neues Projekt
3. Gehe zu **Settings** → **Database**
4. Kopiere den **Connection String** (URI)
5. Trage ihn in `.env` ein:
   ```
   DATABASE_URL="postgresql://postgres:[DEIN-PASSWORT]@db.[PROJEKT-ID].supabase.co:5432/postgres"
   ```
   ⚠️ Ersetze `[DEIN-PASSWORT]` und `[PROJEKT-ID]` mit deinen Werten

### Option B: Andere PostgreSQL-Datenbank

- **Railway**: [railway.app](https://railway.app) - Kostenloser PostgreSQL-Service
- **Vercel Postgres**: Direkt im Vercel Dashboard
- **Lokale PostgreSQL**: Falls du PostgreSQL lokal installiert hast

**Format:**
```
DATABASE_URL="postgresql://benutzer:passwort@localhost:5432/excel_formel_retter"
```

### 2.3 Datenbank-Schema erstellen

Nachdem die `DATABASE_URL` gesetzt ist, führe aus:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

Dies erstellt alle Tabellen in deiner Datenbank.

---

## Schritt 4: OpenAI API einrichten

### 4.1 API-Key holen

1. Gehe zu [platform.openai.com](https://platform.openai.com)
2. Erstelle ein Konto oder logge dich ein
3. Gehe zu **API Keys** → **Create new secret key**
4. Kopiere den Key (beginnt mit `sk-...`)
5. ⚠️ **WICHTIG**: Speichere den Key sicher, er wird nur einmal angezeigt!

### 4.2 In .env eintragen

```
OPENAI_API_KEY="sk-dein-api-key-hier"
AI_MODEL="gpt-4o-mini"
```

**Hinweis:** `gpt-4o-mini` ist günstiger, du kannst auch `gpt-4` oder `gpt-3.5-turbo` verwenden.

---

## Schritt 5: Stripe einrichten

### 5.1 Stripe-Konto erstellen

1. Gehe zu [stripe.com](https://stripe.com)
2. Erstelle ein kostenloses Konto
3. Wähle **Test Mode** für Entwicklung

### 5.2 API-Keys holen

1. Im Stripe Dashboard: **Developers** → **API keys**
2. Kopiere:
   - **Secret key** (beginnt mit `sk_test_...`)
   - **Publishable key** (beginnt mit `pk_test_...`)

### 5.3 In .env eintragen

```
STRIPE_SECRET_KEY="sk_test_dein-secret-key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_dein-publishable-key"
```

### 5.4 Produkte und Preise erstellen

1. Im Stripe Dashboard: **Products** → **Add product**

   **Produkt 1: Monatlich**
   - Name: "Excel Formel Retter Pro - Monatlich"
   - Preis: 3.99 €
   - Abrechnung: Wiederkehrend (Monthly)
   - Kopiere die **Price ID** (beginnt mit `price_...`)

   **Produkt 2: Jährlich**
   - Name: "Excel Formel Retter Pro - Jährlich"
   - Preis: 39.00 €
   - Abrechnung: Wiederkehrend (Yearly)
   - Kopiere die **Price ID**

   **Produkt 3: Lifetime**
   - Name: "Excel Formel Retter Pro - Lifetime"
   - Preis: 69.00 €
   - Abrechnung: Einmalig (One time)
   - Kopiere die **Price ID**

### 5.5 Price IDs in .env eintragen

```
STRIPE_PRICE_ID_MONTHLY="price_deine-monthly-price-id"
STRIPE_PRICE_ID_YEARLY="price_deine-yearly-price-id"
STRIPE_PRICE_ID_LIFETIME="price_deine-lifetime-price-id"
```

### 5.6 Webhook einrichten (für Production)

**Für lokale Entwicklung (optional):**
1. Installiere Stripe CLI: [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
2. Führe aus: `stripe listen --forward-to localhost:3000/api/webhook`
3. Kopiere das Webhook Secret

**Für Production:**
1. Im Stripe Dashboard: **Developers** → **Webhooks** → **Add endpoint**
2. Endpoint URL: `https://deine-domain.com/api/webhook`
3. Wähle Events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Kopiere das **Signing secret** (beginnt mit `whsec_...`)

### 5.7 Webhook Secret in .env eintragen

```
STRIPE_WEBHOOK_SECRET="whsec_dein-webhook-secret"
```

---

## Schritt 6: App-URL konfigurieren

### Für lokale Entwicklung:
```
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Für Production:
```
NEXT_PUBLIC_APP_URL="https://deine-domain.com"
```

---

## Schritt 7: Alles testen

### 7.1 Entwicklungsserver starten

```bash
npm run dev
```

Die App sollte jetzt auf [http://localhost:3000](http://localhost:3000) laufen.

### 7.2 Testen

1. ✅ Öffne die App im Browser
2. ✅ Gib eine Formel-Anfrage ein (z.B. "Addiere Spalte A und B")
3. ✅ Prüfe ob die Formel generiert wird
4. ✅ Teste den "Kopieren"-Button
5. ✅ Teste das Limit (5 Anfragen) - sollte das Overlay erscheinen

---

## 📋 Checkliste - Alle API-Keys

Stelle sicher, dass in deiner `.env` Datei folgendes steht:

```env
# ✅ Datenbank
DATABASE_URL="postgresql://..."

# ✅ OpenAI
OPENAI_API_KEY="sk-..."
AI_MODEL="gpt-4o-mini"

# ✅ Stripe
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID_MONTHLY="price_..."
STRIPE_PRICE_ID_YEARLY="price_..."
STRIPE_PRICE_ID_LIFETIME="price_..."

# ✅ App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🚨 Häufige Probleme

### "Cannot find module '@prisma/client'"
```bash
npx prisma generate
```

### "DATABASE_URL is not set"
- Prüfe ob die `.env` Datei im Projektordner liegt
- Prüfe ob alle Werte korrekt eingetragen sind

### "Stripe API Error"
- Prüfe ob du Test-Keys verwendest (für Entwicklung)
- Prüfe ob die Price IDs korrekt sind

### "OpenAI API Error"
- Prüfe ob dein API-Key gültig ist
- Prüfe ob du Credits auf deinem OpenAI-Account hast

---

## 🎉 Fertig!

Wenn alles funktioniert, kannst du die App jetzt verwenden!

**Nächste Schritte:**
- [ ] Auth-System integrieren (z.B. NextAuth.js)
- [ ] App deployen (z.B. auf Vercel)
- [ ] Stripe auf Live-Mode umstellen (für echte Zahlungen)

