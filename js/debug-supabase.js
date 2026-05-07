// Simple runtime diagnostics for Supabase configuration + auth state
// Include this script ONLY if needed.

import { supabase } from './supabaseClient.js';

(async () => {
  console.log('[debug-supabase] window.__ENV=', window.__ENV);

  try {
    const { data: userData, error } = await supabase.auth.getUser();
    console.log('[debug-supabase] getUser error=', error);
    console.log('[debug-supabase] getUser user=', userData?.user);

    const { data: sessionData } = await supabase.auth.getSession();
    console.log('[debug-supabase] getSession=', sessionData);
  } catch (e) {
    console.error('[debug-supabase] exception', e);
  }
})();

