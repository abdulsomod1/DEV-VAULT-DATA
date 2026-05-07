// Supabase client (static frontend)
// Uses environment variables: SUPABASE_URL, SUPABASE_ANON_KEY
// IMPORTANT: These must be set in your Netlify site settings.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

// Ensure env loader ran first
// (loaded by index/login/dashboard/admin HTML)
const SUPABASE_URL = window.__ENV?.SUPABASE_URL || null;
const SUPABASE_ANON_KEY = window.__ENV?.SUPABASE_ANON_KEY || null;

function envErrorMessage() {
  return (
    '[supabaseClient] Missing SUPABASE_URL and/or SUPABASE_ANON_KEY.\n' +
    'Make sure Netlify site env vars are set: SUPABASE_URL, SUPABASE_ANON_KEY.\n' +
    'Also ensure js/env.js is loaded before this module.'
  );
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Keep the module import from crashing, but ensure any DB call fails loudly.
  console.error(envErrorMessage(), { SUPABASE_URL, SUPABASE_ANON_KEY: !!SUPABASE_ANON_KEY });
}

export const supabase = createClient(
  SUPABASE_URL || 'http://localhost',
  SUPABASE_ANON_KEY || 'public-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage
    }
  }
);

// Optional: expose diagnostics for UI
window.__SUPABASE_DIAGNOSTICS__ = {
  hasUrl: !!SUPABASE_URL,
  hasAnonKey: !!SUPABASE_ANON_KEY,
  url: SUPABASE_URL
};




