# 🔑 API-Keys Übersicht - Wo muss was hin?

## 📁 Datei: `.env` (im Projektordner)

Erstelle diese Datei und trage alle Werte ein:

```env
# ============================================
# 1. DATENBANK (PostgreSQL)
# ============================================
DATABASE_URL="postgresql://user:password@host:5432/database"

# Woher: Supabase, Railway, oder lokale PostgreSQL
# Format: postgresql://BENUTZER:PASSWORT@HOST:PORT/DATENBANK


# ============================================
# 2. OPENAI API (KI-Formelgenerierung)
# ============================================
OPENAI_API_KEY="sk-..."
AI_MODEL="gpt-4o-mini"

# Woher: platform.openai.com → API Keys
# Kosten: ~$0.15 pro 1M Tokens (gpt-4o-mini ist sehr günstig)


# ============================================
# 3. STRIPE (Zahlungen)
# ============================================
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Woher: stripe.com → Developers → API Keys
# Test-Mode für Entwicklung, Live-Mode für Production


# ============================================
# 4. STRIPE PRICE IDs (Nach Produkterstellung)
# ============================================
STRIPE_PRICE_ID_MONTHLY="price_..."
STRIPE_PRICE_ID_YEARLY="price_..."
STRIPE_PRICE_ID_LIFETIME="price_..."

# Woher: stripe.com → Products → [Produkt] → Price ID kopieren


# ============================================
# 5. APP URL
# ============================================
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Lokal: http://localhost:3000
# Production: https://deine-domain.com
```

---

## 🗺️ Schritt-für-Schritt: Wo finde ich was?

### 1️⃣ PostgreSQL Datenbank

**Option A: Supabase (Empfohlen - Kostenlos)**
1. Gehe zu: https://supabase.com
2. Erstelle kostenloses Konto
3. Neues Projekt erstellen
4. **Settings** → **Database**
5. Unter "Connection string" → **URI** kopieren
6. In `.env` bei `DATABASE_URL` eintragen

**Option B: Railway (Kostenlos)**
1. Gehe zu: https://railway.app
2. Erstelle PostgreSQL-Datenbank
3. Connection String kopieren
4. In `.env` eintragen

---

### 2️⃣ OpenAI API Key

1. Gehe zu: https://platform.openai.com
2. Erstelle Konto / Logge dich ein
3. **API Keys** (linke Sidebar)
4. **Create new secret key**
5. Key kopieren (⚠️ wird nur einmal angezeigt!)
6. In `.env` bei `OPENAI_API_KEY` eintragen

**Kosten:** 
- gpt-4o-mini: ~$0.15 / 1M Input-Tokens
- gpt-3.5-turbo: ~$0.50 / 1M Input-Tokens

---

### 3️⃣ Stripe API Keys

1. Gehe zu: https://stripe.com
2. Erstelle kostenloses Konto
3. **Developers** → **API keys**
4. Kopiere:
   - **Secret key** → `STRIPE_SECRET_KEY`
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

**Wichtig:** Verwende **Test Mode** für Entwicklung!

---

### 4️⃣ Stripe Produkte & Price IDs

1. Im Stripe Dashboard: **Products** → **Add product**

   **Produkt 1: Monatlich**
   - Name: "Excel Formel Retter Pro - Monatlich"
   - Preis: 3.99 €
   - Billing: Recurring → Monthly
   - **Price ID kopieren** (beginnt mit `price_...`)
   - In `.env` bei `STRIPE_PRICE_ID_MONTHLY` eintragen

   **Produkt 2: Jährlich**
   - Name: "Excel Formel Retter Pro - Jährlich"
   - Preis: 39.00 €
   - Billing: Recurring → Yearly
   - **Price ID kopieren**
   - In `.env` bei `STRIPE_PRICE_ID_YEARLY` eintragen

   **Produkt 3: Lifetime**
   - Name: "Excel Formel Retter Pro - Lifetime"
   - Preis: 69.00 €
   - Billing: One time
   - **Price ID kopieren**
   - In `.env` bei `STRIPE_PRICE_ID_LIFETIME` eintragen

---

### 5️⃣ Stripe Webhook Secret

**Für lokale Entwicklung (optional):**
1. Installiere Stripe CLI: https://stripe.com/docs/stripe-cli
2. Terminal: `stripe listen --forward-to localhost:3000/api/webhook`
3. Webhook Secret kopieren (beginnt mit `whsec_...`)
4. In `.env` bei `STRIPE_WEBHOOK_SECRET` eintragen

**Für Production:**
1. Im Stripe Dashboard: **Developers** → **Webhooks**
2. **Add endpoint**
3. Endpoint URL: `https://deine-domain.com/api/webhook`
4. Events auswählen:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
5. **Signing secret** kopieren
6. In `.env` bei `STRIPE_WEBHOOK_SECRET` eintragen

---

## ✅ Checkliste

- [ ] `.env` Datei erstellt
- [ ] `DATABASE_URL` eingetragen (Supabase/Railway)
- [ ] `OPENAI_API_KEY` eingetragen
- [ ] `STRIPE_SECRET_KEY` eingetragen
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` eingetragen
- [ ] 3 Stripe-Produkte erstellt
- [ ] `STRIPE_PRICE_ID_MONTHLY` eingetragen
- [ ] `STRIPE_PRICE_ID_YEARLY` eingetragen
- [ ] `STRIPE_PRICE_ID_LIFETIME` eingetragen
- [ ] `STRIPE_WEBHOOK_SECRET` eingetragen (optional für lokale Entwicklung)
- [ ] `NEXT_PUBLIC_APP_URL` auf `http://localhost:3000` gesetzt

---

## 🚨 Wichtig!

- **Niemals** die `.env` Datei in Git committen (ist bereits in `.gitignore`)
- Verwende **Test-Keys** für Entwicklung, **Live-Keys** nur für Production
- OpenAI API Keys kosten Geld - überwache deine Nutzung
- Stripe Test-Mode ist kostenlos, Live-Mode nimmt echte Zahlungen

---

## 📞 Hilfe

Bei Problemen siehe:
- `INSTALLATION.md` - Detaillierte Anleitung
- `QUICK_START.md` - Schnellstart
- `README.md` - Projektübersicht

