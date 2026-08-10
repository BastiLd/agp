# Setup-Anleitung für Excel Formel Retter

## Schnellstart

1. **Dependencies installieren:**
   ```bash
   npm install
   ```

2. **Umgebungsvariablen konfigurieren:**
   - Kopiere `.env.example` zu `.env`
   - Fülle alle erforderlichen Werte aus (siehe unten)

3. **Datenbank einrichten:**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. **Entwicklungsserver starten:**
   ```bash
   npm run dev
   ```

## Umgebungsvariablen

### Datenbank
- `DATABASE_URL`: PostgreSQL-Verbindungsstring
  - Beispiel: `postgresql://user:password@localhost:5432/excel_formel_retter?schema=public`
  - Kostenlose Optionen: [Supabase](https://supabase.com), [Railway](https://railway.app), [Vercel Postgres](https://vercel.com/storage/postgres)

### KI-Integration
- `OPENAI_API_KEY`: Dein OpenAI API-Schlüssel
- `AI_MODEL`: Modellname (Standard: `gpt-4o-mini`)

### Stripe
1. Erstelle ein Stripe-Konto auf [stripe.com](https://stripe.com)
2. Hole deine API-Keys aus dem Dashboard
3. Erstelle drei Produkte mit Preisen:
   - Monatlich: 3,99 €
   - Jährlich: 39 €
   - Lifetime: 69 €
4. Trage die Price IDs in die `.env` ein:
   - `STRIPE_SECRET_KEY`: Secret Key (beginnt mit `sk_`)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Publishable Key (beginnt mit `pk_`)
   - `STRIPE_WEBHOOK_SECRET`: Webhook Secret (wird nach Webhook-Setup benötigt)
   - `STRIPE_PRICE_ID_MONTHLY`: Price ID für monatlichen Plan
   - `STRIPE_PRICE_ID_YEARLY`: Price ID für jährlichen Plan
   - `STRIPE_PRICE_ID_LIFETIME`: Price ID für Lifetime-Plan

### App-URL
- `NEXT_PUBLIC_APP_URL`: Deine App-URL
  - Entwicklung: `http://localhost:3000`
  - Production: `https://deine-domain.com`

## Stripe Webhook Setup

1. Gehe zu Stripe Dashboard → Developers → Webhooks
2. Klicke auf "Add endpoint"
3. URL: `https://deine-domain.com/api/webhook`
4. Wähle diese Events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Kopiere das Webhook Secret in `STRIPE_WEBHOOK_SECRET`

## Deployment

### Vercel (Empfohlen)

1. Installiere Vercel CLI: `npm i -g vercel`
2. Führe `vercel` aus und folge den Anweisungen
3. Setze alle Umgebungsvariablen im Vercel Dashboard
4. Verbinde dein GitHub-Repository für automatische Deployments

### Andere Hosting-Provider

- Stelle sicher, dass PostgreSQL-Datenbank verfügbar ist
- Setze alle Umgebungsvariablen
- Führe `npm run build` aus
- Starte mit `npm start`

## Wichtige Hinweise

- **Datenbank**: Die App benötigt PostgreSQL. SQLite funktioniert nicht mit Prisma in Production.
- **Stripe**: Verwende Test-Keys für Entwicklung, Live-Keys für Production.
- **KI-API**: Die App ist für OpenAI konfiguriert, kann aber leicht auf andere Anbieter umgestellt werden (siehe `lib/ai-client.ts`).

## Nächste Schritte

- [ ] Auth-System integrieren (z.B. NextAuth.js, Clerk, Supabase Auth)
- [ ] User-ID aus Auth-System in API-Routen verwenden
- [ ] Analytics hinzufügen
- [ ] Error Tracking (z.B. Sentry)
- [ ] Performance-Monitoring

