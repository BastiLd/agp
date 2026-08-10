-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_pro BOOLEAN NOT NULL DEFAULT false,
  supabase_auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tags table
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ideas table
CREATE TABLE IF NOT EXISTS public.ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  short_desc TEXT NOT NULL,
  long_desc TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  screenshot_url TEXT,
  source_url TEXT NOT NULL,
  producthunt_id TEXT,
  launch_date DATE,
  monthly_revenue_estimate NUMERIC(12, 2),
  monthly_users_estimate INTEGER,
  time_to_revenue_days INTEGER,
  published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID REFERENCES public.ideas(id) ON DELETE SET NULL,
  submitter_name TEXT,
  submitter_email TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'published', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
  current_period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ideas_published ON public.ideas(published);
CREATE INDEX IF NOT EXISTS idx_ideas_slug ON public.ideas(slug);
CREATE INDEX IF NOT EXISTS idx_ideas_producthunt_id ON public.ideas(producthunt_id);
CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON public.ideas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ideas_tags ON public.ideas USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_idea_id ON public.submissions(idea_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_supabase_auth_id ON public.users(supabase_auth_id);

-- Full-text search index on ideas
CREATE INDEX IF NOT EXISTS idx_ideas_search ON public.ideas USING GIN(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(short_desc, ''))
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ideas_updated_at BEFORE UPDATE ON public.ideas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Users: Users can read their own data, admins can read all
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = supabase_auth_id OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = supabase_auth_id);

-- Ideas: Published ideas are public, unpublished only for admins
CREATE POLICY "Published ideas are public" ON public.ideas
  FOR SELECT USING (published = true OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can insert ideas" ON public.ideas
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update ideas" ON public.ideas
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Submissions: Users can create and read their own, admins can read all
CREATE POLICY "Users can create submissions" ON public.submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read own submissions" ON public.submissions
  FOR SELECT USING (
    submitter_email = (SELECT email FROM public.users WHERE supabase_auth_id = auth.uid())
    OR auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Admins can update submissions" ON public.submissions
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Subscriptions: Users can read their own
CREATE POLICY "Users can read own subscriptions" ON public.subscriptions
  FOR SELECT USING (
    user_id IN (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid())
    OR auth.jwt() ->> 'role' = 'admin'
  );

-- Tags: Public read access
CREATE POLICY "Tags are public" ON public.tags
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage tags" ON public.tags
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Idea Tags junction table (for many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.idea_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(idea_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_idea_tags_idea_id ON public.idea_tags(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_tags_tag_id ON public.idea_tags(tag_id);

ALTER TABLE public.idea_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Idea tags are public" ON public.idea_tags
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage idea tags" ON public.idea_tags
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Product Hunt Products cache table
CREATE TABLE IF NOT EXISTS public.producthunt_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producthunt_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  url TEXT NOT NULL,
  votes_count INTEGER DEFAULT 0,
  created_at_producthunt TIMESTAMPTZ,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_producthunt_products_ph_id ON public.producthunt_products(producthunt_id);
CREATE INDEX IF NOT EXISTS idx_producthunt_products_synced_at ON public.producthunt_products(synced_at DESC);

ALTER TABLE public.producthunt_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product Hunt products are public" ON public.producthunt_products
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage producthunt products" ON public.producthunt_products
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Screenshots table (track screenshot generation)
CREATE TABLE IF NOT EXISTS public.screenshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  screenshot_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_screenshots_idea_id ON public.screenshots(idea_id);
CREATE INDEX IF NOT EXISTS idx_screenshots_status ON public.screenshots(status);
CREATE INDEX IF NOT EXISTS idx_screenshots_created_at ON public.screenshots(created_at DESC);

CREATE TRIGGER update_screenshots_updated_at BEFORE UPDATE ON public.screenshots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.screenshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Screenshots are public" ON public.screenshots
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage screenshots" ON public.screenshots
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Submission Queue table (for async processing)
CREATE TABLE IF NOT EXISTS public.submission_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('screenshot', 'producthunt_sync', 'notification')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payload JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submission_queue_submission_id ON public.submission_queue(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_queue_status ON public.submission_queue(status);
CREATE INDEX IF NOT EXISTS idx_submission_queue_job_type ON public.submission_queue(job_type);
CREATE INDEX IF NOT EXISTS idx_submission_queue_created_at ON public.submission_queue(created_at);

CREATE TRIGGER update_submission_queue_updated_at BEFORE UPDATE ON public.submission_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.submission_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage submission queue" ON public.submission_queue
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Add free_preview_counter to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS free_preview_counter INTEGER DEFAULT 0;

