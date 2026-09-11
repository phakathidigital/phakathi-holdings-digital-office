# Phakathi Flow Platform Readiness

This document tracks the practical path from the current web office pilot to production web, Android, iOS, Huawei, and desktop.

## Current code foundation

- React/Vite web app.
- Authenticated API client.
- Express/Netlify API surface.
- PostgreSQL-ready backend foundation.
- Service worker push notification handling.
- PWA manifest for installable web/PWA behavior.
- Netlify scheduled notifications.
- OpenAI-backed Meeting Studio with safe local fallback.
- Integration readiness API at `/api/integrations/status`.
- Platform readiness API at `/api/integrations/platform-readiness`.
- Analytics overview API at `/api/analytics/overview`.

## Production web

Required before broad office rollout:

1. Use `PHAKATHI_STORAGE=postgres`.
2. Configure `DATABASE_URL`.
3. Configure stable `JWT_SECRET` and `JWT_REFRESH_SECRET`.
4. Configure stable VAPID keys.
5. Configure `CORS_ORIGINS` to the deployed site URL.
6. Configure `SCHEDULED_NOTIFICATION_SECRET`.
7. Run `npm run db:migrate`.
8. Run `npm run db:seed`.
9. Confirm `npm run build` passes on Netlify.

## AI

Current:

- Meeting Studio can use OpenAI when `OPENAI_API_KEY` is configured.
- Safe deterministic fallback remains available when the key is absent or an AI call fails.

Required before heavy office use:

- Confirm `OPENAI_API_KEY`.
- Confirm `OPENAI_MEETING_MODEL`.
- Add retention and consent policy for uploaded transcripts.
- Review prompt logging and privacy rules.

## Analytics

Current:

- `/api/analytics/track` records events.
- `/api/analytics/overview` aggregates work, notification, growth, integration, and platform status.

Next:

- Add role-aware analytics dashboards.
- Add event taxonomy.
- Add export and retention policies.

## Mobile

Recommended packaging:

- Capacitor for Android, iOS, and Huawei-compatible Android builds.
- Shared API and auth; do not fork business logic.

Before packaging:

- Production API URL must be stable.
- Native push provider decisions:
  - Android: FCM.
  - iOS: APNs.
  - Huawei: HMS Push if Google Play Services cannot be assumed.
- App icons and splash assets.
- Store privacy disclosures.
- Device QA matrix.
- Release signing.

## Desktop

Recommended packaging:

- Tauri desktop wrapper.
- Shared API and auth.
- Native notifications routed back into the same notification records.

Before packaging:

- Tauri scaffold.
- Windows signing.
- Installer strategy.
- Auto-update strategy.
- Desktop notification QA.

## Security/deployment

Baseline now includes:

- Signed auth tokens.
- Refresh-token sessions.
- Security headers in Express and Netlify.
- CORS allowlist enforcement.
- Authenticated integration and analytics APIs.
- Server-side integration readiness checks.

Still required:

- Password reset.
- Admin user invite/disable flows.
- Audit log review page.
- Backup and restore runbook.
- Incident response runbook.
- Full penetration/security review before public release.
