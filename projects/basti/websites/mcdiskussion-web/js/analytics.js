// ---------------------------------------------------------------------------
// analytics.js — lightweight, privacy-light event tracking into Supabase.
//
// Inserts rows into public.events (anon insert is allowed by RLS; only admins
// can read them back). Tracking is skipped while an admin is logged in so the
// owner's own clicks don't pollute the stats.
// ---------------------------------------------------------------------------

import { getSupabase } from './supabaseClient.js';

let adminMode = false;

/** Called by admin.js once auth state is known. */
export function setAnalyticsAdmin(value) {
  adminMode = !!value;
}

/** Fire-and-forget event insert. Never throws. */
export async function trackEvent(type, label = null, path = null) {
  if (adminMode) return;
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb.from('events').insert({ type, label, path });
  } catch {
    /* analytics must never break the page */
  }
}

export function initAnalytics() {
  // Initial page view.
  trackEvent('pageview', null, location.hash || '#home');

  // Section views (fired by the router).
  document.addEventListener('sectionchange', (e) => {
    trackEvent('section_view', e.detail.id, null);
  });

  // Game starts (fired by games.js).
  document.addEventListener('gamestart', (e) => {
    trackEvent('game_start', (e.detail && e.detail.game) || 'pong', null);
  });

  // Delegated click tracking for any element with [data-track].
  document.addEventListener(
    'click',
    (e) => {
      const el = e.target.closest('[data-track]');
      if (!el) return;
      trackEvent(el.dataset.track, el.dataset.trackLabel || null, el.dataset.trackPath || null);
    },
    { capture: true }
  );
}
