# Deployment Guide für Webbin auf bastianklaus.online/Webbin

## Voraussetzungen

1. **Vercel Account** (kostenlos): https://vercel.com
2. **GitHub Repository** mit deinem Code
3. **Supabase Projekt** bereits eingerichtet
4. **Stripe Account** mit Test/Live Keys

## Schritt 1: GitHub Repository erstellen

```bash
# Falls noch nicht geschehen
git init
git add .
git commit -m "Initial commit - Webbin MVP"
git branch -M main
git remote add origin https://github.com/DEIN-USERNAME/webbin.git
git push -u origin main
```

## Schritt 2: Vercel Deployment

### Option A: Via Vercel Dashboard (Empfohlen)

1. Gehe zu https://vercel.com und logge dich ein
2. Klicke auf **"Add New Project"**
3. Importiere dein GitHub Repository
4. Konfiguriere das Projekt:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (Standard)
   - **Build Command**: `npm run build` (Standard)
   - **Output Directory**: `.next` (Standard)

### Option B: Via Vercel CLI

```bash
# Installiere Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

## Schritt 3: Environment Variables in Vercel setzen

Im Vercel Dashboard → Project Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://dein-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein_anon_key
SUPABASE_SERVICE_ROLE_KEY=dein_service_role_key
STRIPE_SECRET_KEY=sk_live_... (oder sk_test_...)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... (oder pk_test_...)
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
PRODUCTHUNT_TOKEN=dein_token
SCREENSHOTAPI_KEY=dein_key
SCREENSHOTAPI_URL=https://screenshotapi.com/api/v1/screenshot
NEXT_PUBLIC_APP_URL=https://www.bastianklaus.online/Webbin
STRIPE_PRICE_AMOUNT=1000
```

**Wichtig**: Setze diese für **Production**, **Preview** und **Development**!

## Schritt 4: Base Path konfigurieren (für /Webbin Subfolder)

### Option A: Next.js basePath (Empfohlen)

1. Öffne `next.config.js`
2. Füge hinzu:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/Webbin',
  assetPrefix: '/Webbin',
}

module.exports = nextConfig
```

3. Update `.env.local`:
```
NEXT_PUBLIC_APP_URL=https://www.bastianklaus.online/Webbin
```

### Option B: Vercel Subfolder (Alternative)

Falls du Vercel verwendest und einen Subfolder brauchst:

1. Im Vercel Dashboard → Project Settings → General
2. Setze **Root Directory** auf den Ordner, der dein Next.js Projekt enthält
3. Oder verwende Vercel's **Rewrites** für Subfolder-Routing

## Schritt 5: Stripe Webhook konfigurieren

1. Gehe zu Stripe Dashboard → Developers → Webhooks
2. Klicke **"Add endpoint"**
3. Endpoint URL: `https://www.bastianklaus.online/Webbin/api/stripe/webhook`
4. Wähle Events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Kopiere den **Signing Secret** → füge ihn als `STRIPE_WEBHOOK_SECRET` in Vercel ein

## Schritt 6: Supabase Redirect URLs konfigurieren

1. Gehe zu Supabase Dashboard → Authentication → URL Configuration
2. Füge hinzu:
   - **Site URL**: `https://www.bastianklaus.online/Webbin`
   - **Redirect URLs**:
     - `https://www.bastianklaus.online/Webbin/dashboard`
     - `https://www.bastianklaus.online/Webbin/auth/callback`

## Schritt 7: Domain konfigurieren (falls nötig)

Falls `bastianklaus.online` bereits auf Vercel läuft:

1. Vercel Dashboard → Project → Settings → Domains
2. Füge hinzu: `www.bastianklaus.online`
3. Konfiguriere DNS Records (falls nötig)

## Schritt 8: Build & Deploy

Nach dem ersten Deploy:

1. Vercel baut automatisch bei jedem `git push`
2. Oder manuell: Vercel Dashboard → Deployments → Redeploy

## Schritt 9: Testen

1. **Homepage**: https://www.bastianklaus.online/Webbin
2. **Pricing**: https://www.bastianklaus.online/Webbin/pricing
3. **Sign Up**: https://www.bastianklaus.online/Webbin/signup
4. **Login**: https://www.bastianklaus.online/Webbin/login
5. **Dashboard**: https://www.bastianklaus.online/Webbin/dashboard (nach Login)

## Troubleshooting

### Problem: 404 Errors auf allen Routes

**Lösung**: Stelle sicher, dass `basePath` in `next.config.js` korrekt gesetzt ist.

### Problem: Auth funktioniert nicht

**Lösung**: 
- Prüfe Supabase Redirect URLs
- Prüfe `NEXT_PUBLIC_APP_URL` Environment Variable
- Prüfe Browser Console für Fehler

### Problem: Stripe Webhook funktioniert nicht

**Lösung**:
- Prüfe Webhook URL in Stripe Dashboard
- Prüfe `STRIPE_WEBHOOK_SECRET` in Vercel
- Prüfe Vercel Logs für Webhook-Events

### Problem: Bilder/Styles laden nicht

**Lösung**: 
- Prüfe `assetPrefix` in `next.config.js`
- Prüfe dass `basePath` korrekt gesetzt ist

## CI/CD Setup (Optional)

Füge `.github/workflows/deploy.yml` hinzu für automatische Deployments:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## Nächste Schritte

1. ✅ Code auf GitHub pushen
2. ✅ Vercel Projekt erstellen
3. ✅ Environment Variables setzen
4. ✅ Base Path konfigurieren
5. ✅ Stripe Webhook einrichten
6. ✅ Supabase Redirect URLs aktualisieren
7. ✅ Deploy & Testen

## Support

Bei Problemen:
- Vercel Logs: Dashboard → Deployments → Logs
- Supabase Logs: Dashboard → Logs
- Stripe Webhook Logs: Dashboard → Developers → Webhooks → Endpoint → Logs

