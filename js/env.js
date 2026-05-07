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
    // Netlify sometimes supports injecting via script tag using placeholders.
    // We'll attempt common patterns.
    window.__ENV.SUPABASE_URL = window.SUPABASE_URL || '';
  }
  if (!window.__ENV.SUPABASE_ANON_KEY) {
    window.__ENV.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || '';
  }
})();

