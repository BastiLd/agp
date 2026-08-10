# ✅ Setup-Checkliste

## Was du bereits hast:
- ✅ Dependencies installiert
- ✅ .env Datei erstellt
- ✅ Stripe CLI installiert und authentifiziert
- ✅ Stripe Webhook Secret in .env eingetragen
- ✅ Prisma Client generiert

## Was du noch brauchst:

### 1. 📊 Datenbank (PostgreSQL)
- [ ] Supabase Account erstellen: https://supabase.com
- [ ] Neues Projekt erstellen
- [ ] Connection String kopieren
- [ ] In `.env` eintragen: `DATABASE_URL="postgresql://..."`
- [ ] Datenbank-Schema erstellen: `npx prisma migrate dev --name init`

### 2. 🤖 Google Gemini API Key
- [ ] Gehe zu: https://aistudio.google.com/app/apikey
- [ ] API Key erstellen
- [ ] In `.env` eintragen: `GEMINI_API_KEY="AIza..."`
- [ ] In `.env` prüfen: `AI_PROVIDER="gemini"`

### 3. 💳 Stripe API Keys
- [ ] Gehe zu: https://stripe.com → Developers → API keys
- [ ] Secret key kopieren → `STRIPE_SECRET_KEY="sk_test_..."`
- [ ] Publishable key kopieren → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."`

### 4. 💰 Stripe Produkte erstellen
- [ ] Im Stripe Dashboard: Products → Add product
- [ ] Monatlich: 3,99 € → Price ID kopieren → `STRIPE_PRICE_ID_MONTHLY`
- [ ] Jährlich: 39 € → Price ID kopieren → `STRIPE_PRICE_ID_YEARLY`
- [ ] Lifetime: 69 € → Price ID kopieren → `STRIPE_PRICE_ID_LIFETIME`

## Wenn alles fertig ist:

1. **Datenbank einrichten:**
   ```powershell
   npx prisma migrate dev --name init
   ```

2. **App starten:**
   ```powershell
   npm run dev
   ```

3. **Stripe Webhook Listener starten** (in separatem Terminal):
   ```powershell
   C:\stripe-cli\stripe.exe listen --forward-to localhost:3000/api/webhook
   ```

4. **App testen:**
   - Öffne: http://localhost:3000
   - Teste Formel-Generierung
   - Teste Limit (5 Anfragen)
   - Teste Upgrade-Overlay

