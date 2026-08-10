# Excel Formel Retter

Eine Next.js WebApp zur automatischen Generierung von Excel- und Google-Sheets-Formeln mit KI.

## Features

- **KI-gestützte Formelgenerierung**: Beschreibe dein Problem in normaler Sprache und erhalte sofort die passende Formel
- **Freemium-Modell**: 5 kostenlose Anfragen pro Tag, unbegrenzt mit Pro
- **Stripe-Integration**: Monatliche, jährliche und Lifetime-Pläne
- **Responsive Design**: Mobile-First mit Tailwind CSS
- **SEO-optimiert**: Strukturierte Inhalte für bessere Auffindbarkeit

## Setup

### 1. Dependencies installieren

```bash
npm install
```

### 2. Umgebungsvariablen konfigurieren

Kopiere `.env.example` zu `.env` und fülle die Werte aus:

```bash
cp .env.example .env
```

Wichtige Variablen:
- `DATABASE_URL`: PostgreSQL-Verbindungsstring
- `OPENAI_API_KEY`: OpenAI API-Schlüssel
- `STRIPE_SECRET_KEY`: Stripe Secret Key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe Publishable Key
- `STRIPE_WEBHOOK_SECRET`: Stripe Webhook Secret
- `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_YEARLY`, `STRIPE_PRICE_ID_LIFETIME`: Stripe Price IDs

### 3. Datenbank einrichten

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Entwicklungsserver starten

```bash
npm run dev
```

Die App läuft dann auf [http://localhost:3000](http://localhost:3000).

## Stripe Setup

1. Erstelle ein Stripe-Konto und hole die API-Keys
2. Erstelle die Produkte und Preise in Stripe:
   - Monatlicher Plan (3,99 €)
   - Jährlicher Plan (39 €)
   - Lifetime Plan (69 €)
3. Trage die Price IDs in die `.env` ein
4. Konfiguriere den Webhook-Endpoint: `https://deine-domain.com/api/webhook`

## Projektstruktur

```
├── app/
│   ├── api/              # API-Routen
│   │   ├── generate/     # Formel-Generierung
│   │   ├── checkout/     # Stripe Checkout
│   │   ├── webhook/      # Stripe Webhooks
│   │   └── portal/       # Stripe Customer Portal
│   ├── success/          # Erfolgsseite nach Zahlung
│   ├── layout.tsx        # Root Layout
│   ├── page.tsx          # Startseite
│   └── globals.css       # Globale Styles
├── components/           # React-Komponenten
│   ├── FormulaGenerator.tsx
│   ├── FormulaResult.tsx
│   ├── LimitReachedOverlay.tsx
│   ├── PricingPlans.tsx
│   └── InfoSection.tsx
├── lib/                 # Utilities
│   ├── ai-client.ts     # KI-Client (austauschbar)
│   ├── prisma.ts        # Prisma Client
│   ├── rate-limit.ts    # Rate Limiting
│   └── stripe.ts        # Stripe Integration
└── prisma/
    └── schema.prisma    # Datenbankschema
```

## KI-Client

Der KI-Client ist sauber gekapselt und kann leicht auf andere Anbieter umgestellt werden. Aktuell verwendet er OpenAI, kann aber durch Anpassung der `AIClient`-Klasse auf andere Anbieter (z.B. Anthropic, Google Gemini) umgestellt werden.

## Rate Limiting

- **Nicht eingeloggte Nutzer**: 5 Anfragen pro Tag (IP-basiert)
- **Eingeloggte Free-Nutzer**: 5 Anfragen pro Tag (User-ID-basiert)
- **Pro-Nutzer**: Unbegrenzt

## Deployment

1. Erstelle eine PostgreSQL-Datenbank (z.B. bei Supabase, Railway, oder Vercel Postgres)
2. Setze alle Umgebungsvariablen in deinem Hosting-Provider
3. Deploye auf Vercel, Netlify oder einem anderen Next.js-kompatiblen Hosting

## Lizenz

MIT

