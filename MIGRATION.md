# Phakathi Flow Self-Hosted Migration Notes

## Completed

- Replaced hosted platform SDK usage with `src/api/apiClient.js`.
- Added a local Express backend in `backend/src/index.js`.
- Moved entity schemas into `backend/prisma/entities/`.
- Removed hosted-platform package dependencies from `package.json` and `package-lock.json`.
- Replaced external login redirect with a local sign-in/register form.
- Added password hashing, signed local auth tokens, and first-password setup for seeded employee records.
- Preserved the existing frontend API shape through a compatibility client so pages/components did not need a redesign.
- Added local JSON persistence in `.local-data/db.json`.
- Added local upload storage in `.local-data/uploads`.
- Added placeholder email, SMS, AI, analytics, and function endpoints.
- Preserved first-login company setup, subsidiary grouping, user designation/role, personal branding, company defaults, Monday meeting templates, and group overview roles.
- Added self-hosted browser/device push foundations: service worker, VAPID/web-push backend delivery, per-device subscriptions, scheduled birthday/holiday/break/Did You Know notifications, user notification preferences, and delivery logs.
- Added Netlify-hosted API function routing for `/api/*`, Netlify Blobs persistence for hosted app data/uploads, and scheduled notification scans that run outside the local dev server.

## Current backend status

This is a working local/office-pilot backend, not yet a full production backend.

Current persistence:

- JSON file database: `.local-data/db.json`
- Uploaded files: `.local-data/uploads`
- Hosted Netlify app data: Netlify Blobs store `phakathi-flow-db`
- Hosted Netlify uploads: Netlify Blobs store `phakathi-flow-uploads`

Production hardening still recommended:

- Replace JSON storage with Postgres.
- Add migrations with Prisma, Drizzle, or another migration tool.
- Add refresh-token rotation and password reset/invite flows.
- Extend RBAC middleware across sensitive entity operations and admin-only workflows.
- Wire email to SMTP/SES/SendGrid.
- Wire AI endpoints to OpenAI/Anthropic via server-side provider keys.
- Replace placeholder function/analytics endpoints with real jobs and audit logs.
- For a later non-Netlify production stack, move the notification scheduler to that platform's durable worker/cron process.
- Configure persistent VAPID keys in production and require HTTPS for browser push.
- Add automated API tests.

## Verification checklist

- [x] `npm install` works.
- [x] `npm run build` works.
- [x] Local API health endpoint responds.
- [x] Local sign-in/register endpoint creates/returns a user with password verification.
- [x] Seeded employees can claim their staff profile by setting a first password.
- [x] Generic entity list endpoint responds only with authenticated requests.
- [x] User records are sanitized so password hashes are not returned to the browser.
- [x] New users are routed into first-login company setup when no subsidiary exists.
- [x] Company/subsidiary and designation are stored on the user/profile data.
- [x] Branding assets are local and wired into the visible app.
- [x] Browser/device push notification foundations implemented.
- [x] Notification preferences added for birthdays, holidays, breaks, and Did You Know/funny facts.
- [x] Delivery tracking records added for browser push attempts.
- [x] OpenAI-backed Meeting Studio flow implemented with safe fallback.
- [x] Netlify scheduled notification function configured.
- [x] Hosted `/api/*` function configured for Netlify.
- [x] Netlify Blobs persistence configured for hosted data and uploads.
- [x] July 2026 realistic work-system seed data added.
- [ ] Postgres-grade relational production database and migrations implemented.
- [ ] Production OpenAI key configured and tested in deployed environment.
- [ ] Real email/SMS providers connected.
- [ ] Netlify production environment variables configured.
- [ ] Full browser QA completed against `npm run dev`.
