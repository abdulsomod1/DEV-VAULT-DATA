# DEV-VAULT DATA — Supabase JS integration notes

This project uses `js/supabaseClient.js` which imports Supabase JS via CDN:
`https://esm.sh/@supabase/supabase-js@2.49.1`

## Environment variables (Netlify)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

They are read via `window.__ENV`.
For pure static Netlify hosting, add an `__ENV` loader (recommended) or set `window.__ENV` inside `netlify functions`.

## Current state
- Auth pages (login/signup/forgot/reset) are implemented in `js/auth.js`.
- User/admin dashboard logic + purchase flow will be implemented next.

## Important
Auth + RLS must be configured with the provided `SUPABASE_SCHEMA.sql`.
No admin credentials are hardcoded in frontend.

