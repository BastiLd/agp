# IdeenHub MVP

A Mobbin-like platform for discovering profitable web app ideas. Built with Next.js, Supabase, Stripe, and modern web technologies.

## Features

- 🔍 **Search & Browse**: Search through curated web app ideas with full-text search and tag filtering
- 🆓 **Free Previews**: First 5 search results are free to preview
- 💎 **Pro Subscription**: Full access to detailed metrics, revenue estimates, and user data ($10/month)
- 📊 **Admin Panel**: Review and publish user submissions
- 🔄 **Product Hunt Sync**: Automatically sync products from Product Hunt API
- 📸 **Screenshot Generation**: On-demand screenshot generation via ScreenshotAPI
- 🔐 **Authentication**: Secure auth via Supabase
- 💳 **Stripe Integration**: Subscription management with Stripe

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **Screenshots**: ScreenshotAPI.com
- **Data Source**: Product Hunt API

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier)
- Stripe account (test mode)
- ScreenshotAPI account (free tier)
- Product Hunt API token (optional, for syncing)

## Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd ideenhub
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID=price_your_monthly_price_id

# Product Hunt API
PRODUCTHUNT_TOKEN=your_producthunt_api_token

# ScreenshotAPI
SCREENSHOTAPI_KEY=your_screenshotapi_key
SCREENSHOTAPI_URL=https://screenshotapi.com/api/v1/screenshot

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_PRICE_AMOUNT=1000
```

### 3. Supabase Setup

#### 3.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully provisioned
3. Go to Settings → API to get your project URL and keys

#### 3.2 Run Database Schema

1. Go to SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `supabase/schema.sql`
3. Run the SQL script
4. Verify that all tables are created (users, ideas, submissions, subscriptions, tags)

#### 3.3 Create Storage Bucket

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `screenshots`
3. Set it to public
4. Configure CORS if needed

#### 3.4 Seed Data (Optional)

1. In SQL Editor, copy and paste the contents of `supabase/seed.sql`
2. Run the SQL script
3. Or use the TypeScript seed script: `npm run seed`

### 4. Stripe Setup

#### 4.1 Get Stripe Keys

1. Go to [stripe.com](https://stripe.com) and create an account
2. Navigate to Developers → API keys
3. Copy your test keys (Publishable key and Secret key)

#### 4.2 Create Product and Price

1. Go to Products in Stripe dashboard
2. Create a new product: "IdeenHub Pro"
3. Set price to $10.00/month (recurring)
4. Copy the Price ID (starts with `price_`)
5. Add it to your `.env.local` as `STRIPE_PRICE_ID`

#### 4.3 Setup Webhook

1. Go to Developers → Webhooks in Stripe
2. Click "Add endpoint"
3. For local development, use [Stripe CLI](https://stripe.com/docs/stripe-cli):
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Copy the webhook secret (starts with `whsec_`)
4. For production, add your production URL: `https://yourdomain.com/api/stripe/webhook`
5. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
6. Copy the webhook signing secret to `.env.local`

### 5. Product Hunt API Token (Optional)

1. Go to [Product Hunt API](https://api.producthunt.com/v2/docs)
2. Sign up for API access (free tier available)
3. Generate an API token
4. Add it to `.env.local` as `PRODUCTHUNT_TOKEN`

### 6. ScreenshotAPI Setup

1. Go to [screenshotapi.com](https://screenshotapi.com)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add it to `.env.local` as `SCREENSHOTAPI_KEY`

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── (main)/            # Main pages (home, dashboard, admin)
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/                # UI components
│   └── auth/              # Auth components
├── lib/                   # Utility libraries
│   ├── supabase/          # Supabase clients
│   ├── stripe.ts          # Stripe utilities
│   ├── producthunt.ts     # Product Hunt client
│   └── screenshot.ts      # ScreenshotAPI client
├── supabase/              # Database files
│   ├── schema.sql         # Database schema
│   └── seed.sql           # Seed data
└── scripts/               # Utility scripts
```

## API Endpoints

### Public Endpoints

- `GET /api/ideas` - Search ideas (query params: `q`, `tags`, `page`)
- `GET /api/ideas/[id]` - Get idea details (requires Pro or free preview)

### Authenticated Endpoints

- `POST /api/auth` - Authentication (signup, signin, signout)
- `POST /api/ideas` - Submit new idea
- `POST /api/stripe/create-checkout` - Create Stripe checkout session

### Admin Endpoints

- `POST /api/producthunt/sync` - Sync products from Product Hunt
- `POST /api/screenshot` - Generate screenshot for URL

### Webhooks

- `POST /api/stripe/webhook` - Stripe webhook handler

See `postman/IdeenHub_API.postman_collection.json` for detailed API documentation.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.local`
4. Deploy!

### Environment Variables for Production

Make sure to set all environment variables in Vercel:
- All Supabase variables
- All Stripe variables (use production keys)
- ScreenshotAPI key
- Product Hunt token
- `NEXT_PUBLIC_APP_URL` (your production URL)

### Supabase Production Setup

1. Run `supabase/schema.sql` in production database
2. Create `screenshots` storage bucket
3. Update RLS policies if needed

### Stripe Production Setup

1. Switch to live mode in Stripe
2. Create production product and price
3. Update webhook endpoint to production URL
4. Update environment variables

## Troubleshooting

### Database Connection Issues

- Verify Supabase URL and keys are correct
- Check if RLS policies allow your operations
- Ensure tables exist in Supabase dashboard

### Stripe Webhook Not Working

- Verify webhook secret is correct
- Check webhook endpoint URL in Stripe dashboard
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### Screenshot Generation Failing

- Verify ScreenshotAPI key is valid
- Check if storage bucket exists and is public
- Verify CORS settings on Supabase storage

### Product Hunt Sync Not Working

- Verify API token is valid
- Check rate limits (free tier has limits)
- Ensure token has required permissions

### Authentication Issues

- Verify Supabase auth is enabled
- Check email confirmation settings
- Ensure user is created in both `auth.users` and `public.users`

## Development

### Running Tests

```bash
npm run lint
```

### Database Migrations

For schema changes, update `supabase/schema.sql` and run it in Supabase SQL Editor.

### Adding New Features

1. Create feature branch
2. Make changes
3. Test locally
4. Create pull request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

