// ---------------------------------------------------------------------------
// supabaseClient.js — one shared Supabase client for the whole app.
//
// Sharing a single client matters for auth: once the admin signs in, the same
// client carries their session, so RLS-protected reads/writes (moderation,
// analytics) work from comments.js, analytics.js and admin.js alike.
// ---------------------------------------------------------------------------

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

let client = null;

export function getSupabase() {
  if (client) return client;
  if (!window.supabase || !SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return client;
}
