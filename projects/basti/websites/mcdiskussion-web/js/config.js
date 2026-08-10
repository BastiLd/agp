// ---------------------------------------------------------------------------
// Central configuration. Single source of truth for the Supabase connection.
//
// NOTE: The anon (public) key below is *designed* to live in client-side code.
// It only grants the access allowed by your Row Level Security (RLS) policies,
// so committing it to a public repo is expected and safe.
//
// The URL is the project's REST/Realtime endpoint, derived from the project ref
// (NOT the dashboard URL). Project ref: niiotpksexgubxqtbkco
// ---------------------------------------------------------------------------

export const SUPABASE_URL = 'https://niiotpksexgubxqtbkco.supabase.co';

export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paW90cGtzZXhndWJ4cXRia2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NTc1NjksImV4cCI6MjA5NjIzMzU2OX0.ynHtezSpaDW9CX6oTToK39Do9zmMBvnA_l_fqL1KEkg';

// Posting cool-down (client-side spam guard), in milliseconds.
export const COMMENT_RATE_LIMIT_MS = 30_000;

// Field length limits — keep these in sync with the SQL CHECK constraints.
export const MAX_NAME_LEN = 50;
export const MAX_BODY_LEN = 1000;
