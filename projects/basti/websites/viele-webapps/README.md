# Viele WebApps

A collection of interactive web applications built with Next.js 14, featuring premium subscriptions and Stripe integration.

## Features

- 🎨 Modern UI with TailwindCSS
- 💳 Stripe integration for premium subscriptions
- ⭐ Premium mode with localStorage persistence
- 📱 Responsive design
- 🌙 Dark mode support
- 🎯 Four mini-apps: Ecosystem, World Builder, Business Ideas, Dreamhouse

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file with:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
```

**Note:** The app works without Stripe keys for development. Premium purchases are simulated and stored in localStorage. For production, you'll need to:
- Set up a Stripe account
- Add your Stripe keys to `.env.local`
- The payment processing is already implemented in `app/api/create-payment-intent/route.ts`
- Set up Stripe webhooks to verify payments (optional but recommended)

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Premium Plans

- **Monthly**: 1.49€
- **Yearly**: 9.99€
- **Lifetime**: 19€

Premium features:
- Ad-free experience
- Access to premium features in all apps
- Priority support
- Species editor (Ecosystem)
- God mode (Ecosystem)
- Extra business ideas (Business Ideas)

## Project Structure

```
├── app/
│   ├── api/
│   │   └── create-payment-intent/
│   │       └── route.ts
│   ├── ecosystem/
│   ├── world-builder/
│   ├── business-ideas/
│   ├── dreamhouse/
│   ├── premium/
│   ├── premium-success/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── PremiumBadge.tsx
│   └── AdPlaceholder.tsx
├── contexts/
│   └── PremiumContext.tsx
└── lib/
    └── premium.ts
```

## Stripe Integration

The app includes full Stripe integration:
1. Payment intents are created server-side via `/api/create-payment-intent`
2. Client-side payment confirmation using Stripe Elements
3. After successful payment, premium status is saved to localStorage
4. Users are redirected to `/premium-success`

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- Stripe (React Stripe.js + Stripe Node SDK)
- React Context API
