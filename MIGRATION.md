# Phakathi Flow Self-Hosted Migration Notes

## Completed

- Replaced hosted platform SDK usage with `src/api/apiClient.js`.
- Added a local Express backend in `backend/src/index.js`.
- Moved entity schemas into `backend/prisma/entities/`.
- Removed hosted-platform package dependencies from `package.json` and `package-lock.json`.
- Replaced external login redirect with a local sign-in/register form.
- Preserved the existing frontend API shape through a compatibility client so pages/components did not need a redesign.
- Added local JSON persistence in `.local-data/db.json`.
- Added local upload storage in `.local-data/uploads`.
- Added placeholder email, SMS, AI, analytics, and function endpoints.
- Preserved first-login company setup, subsidiary grouping, user designation/role, personal branding, company defaults, Monday meeting templates, and group overview roles.

## Current backend status

This is a working local development backend, not yet a production backend.

Current persistence:

- JSON file database: `.local-data/db.json`
- Uploaded files: `.local-data/uploads`

Production hardening still recommended:

- Replace JSON storage with Postgres.
- Add migrations with Prisma, Drizzle, or another migration tool.
- Add password hashing and JWT/refresh-token auth.
- Add RBAC middleware at the API layer.
- Wire email to SMTP/SES/SendGrid.
- Wire AI endpoints to OpenAI/Anthropic via server-side provider keys.
- Replace placeholder function/analytics endpoints with real jobs and audit logs.
- Add automated API tests.

## Verification checklist

- [x] `npm install` works.
- [x] `npm run build` works.
- [x] Local API health endpoint responds.
- [x] Local sign-in/register endpoint creates/returns a user.
- [x] Generic entity list endpoint responds.
- [x] New users are routed into first-login company setup when no subsidiary exists.
- [x] Company/subsidiary and designation are stored on the user/profile data.
- [x] Branding assets are local and wired into the visible app.
- [ ] Production database and migrations implemented.
- [ ] Real email/SMS/AI providers connected.
- [ ] Full browser QA completed against `npm run dev`.
