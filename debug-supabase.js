// Simple runtime diagnostics for Supabase configuration + auth state
// Usage: temporarily include this script on dashboard.html/admin.html to debug.

import { supabase } from './js/supabaseClient.js';

(async () => {
  console.log('[debug-supabase] window.__ENV=', window.__ENV);

  try {
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    console.log('[debug-supabase] getUser error=', userErr);
    console.log('[debug-supabase] getUser user=', userData?.user);

    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    console.log('[debug-supabase] getSession error=', sessionErr);
    console.log('[debug-supabase] getSession=', sessionData);
  } catch (e) {
    console.error('[debug-supabase] exception', e);
  }
})();

