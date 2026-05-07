# TODO

## Dashboard redirect + dashboard boot fixes
- [x] Update `js/auth.js` signup flow: keep redirect to `login.html` for normal users; if created user is admin, redirect directly to `admin.html`.
- [ ] Implement real dashboard logic in `js/app.js` (session check, load profile, render sidebar/home view, wire navigation).
- [ ] Add user-friendly error/toast if Supabase env vars are missing or auth session not present.
- [ ] Validate flows: signup (user -> login, admin -> admin), login -> dashboard render.

