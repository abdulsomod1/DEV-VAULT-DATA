// Netlify environment loader (static runtime)
// Netlify injects environment variables into window.__ENV via a script or build step.
// For pure static hosting, this file provides a safe fallback.
//
// Expected Netlify env vars:
// - SUPABASE_URL
// - SUPABASE_ANON_KEY

(function () {
  window.__ENV = window.__ENV || {};

  // If Netlify already injected __ENV (via some mechanism), keep it.
  // Otherwise, we fall back to global variables if user configured them in index via Netlify build.
  // Users should set env vars in Netlify Site settings.
  if (!window.__ENV.SUPABASE_URL) {
    // If Netlify didn't inject, allow local dev / static testing via global placeholders.
    // (You can define these on the page before env.js loads.)
    window.__ENV.SUPABASE_URL = window.SUPABASE_URL || '';
  }
  if (!window.__ENV.SUPABASE_ANON_KEY) {
    window.__ENV.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || '';
  }

  // Expose for debugging UI.
  window.__ENV_LOADED__ = true;

})();

