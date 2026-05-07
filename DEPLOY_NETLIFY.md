# Netlify Deployment (Static Hosting)

## 1) Prepare Supabase
- Create tables and policies using `SUPABASE_SCHEMA.sql`.
- Ensure Supabase Auth is enabled.
- Insert `profiles` rows for users (username + role).
- Add an admin user in `profiles` with `role='admin'`.

## 2) Configure Netlify Environment Variables
In Netlify dashboard → Site settings → Environment variables:
- `SUPABASE_URL` = your project URL
- `SUPABASE_ANON_KEY` = your anon key

## 3) Build settings
This project is static (no build step). `netlify.toml` uses `publish='.'`.

## 4) Deploy
- Upload the entire folder to Netlify.
- Main publish directory is project root (where `index.html` lives).

## 5) Routing
`netlify.toml` maps `/dashboard`→`/dashboard.html`, `/admin`→`/admin.html`, etc.

## 6) Important: Hash routing
Avoid relying on path-based SPA routing. We use separate HTML pages.

## 7) Verify
- Create a user, login.
- Buy a plan (later JS integration) and confirm realtime updates.
- Admin actions must be verified with RLS policies.

