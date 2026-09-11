# Phakathi Flow Integration Architecture

Phase: 0 integration audit only.

## Current integration foundations

The repository already contains integration foundations for:

- OpenAI Meeting Studio processing with deterministic fallback.
- Browser push notifications through VAPID and `web-push`.
- Netlify scheduled notification scans.
- Netlify Functions API wrapper.
- Local upload storage and Netlify Blobs support.
- Sage configuration UI/placeholders.
- Google Drive DAM sync configuration UI/placeholders.
- Microsoft 365 / Outlook integration seed/config placeholders.
- Email and SMS queue placeholders.

## OpenAI / AI

Current state:

- Meeting transcripts can be sent to a backend integration endpoint.
- If `OPENAI_API_KEY` is configured, OpenAI is used.
- If no key exists, deterministic fallback parsing keeps the app usable.

Production needs:

- Provider/admin settings.
- Cost controls.
- Prompt/version logging.
- Sensitive-data handling.
- User consent and meeting retention rules.
- Failure dashboards.

## Notifications

Current state:

- In-app notifications.
- Browser push registration.
- Service worker notification display.
- Notification delivery tracking.
- Scheduler logic for holidays, birthdays, Monday alignment, DAM, and wellness/break/fact reminders.
- Netlify scheduled function.

Production needs:

- Stable deployed API and database.
- Stable VAPID keys.
- Retry and failure dashboards.
- Native push strategy for Android, iOS, Huawei, and desktop.
- Per-device troubleshooting.

## Email and SMS

Current state:

- Environment placeholders and queue concepts exist.
- Real provider delivery is not complete.

Production needs:

- SMTP or transactional email provider.
- SMS provider.
- Templates.
- Delivery logs.
- Bounce/failure handling.
- HR/performance recipient rules.

## Sage

Current state:

- Sage Integration page exists.
- Config placeholders and entity records exist.
- Seed data includes Sage integration metadata.

Production needs:

- Real Sage API contract.
- Auth/credential storage.
- Sync jobs.
- Field mapping.
- Conflict handling.
- Audit history.

## Google Drive / DAM

Current state:

- Google Drive connector UI and sync entity records exist.
- DAM/document pages exist.

Production needs:

- OAuth.
- Drive folder mapping.
- Background sync.
- Object metadata mapping.
- Permissions and retention.

## Microsoft 365 / Outlook

Current state:

- Integration seed/config placeholders exist.

Production needs:

- Microsoft Graph OAuth.
- Calendar sync.
- Email/contacts integration.
- Meeting invite sync.
- Admin consent.

## Recommended integration order

1. Lock production environment/secrets and PostgreSQL.
2. Stabilise browser push and scheduled notifications.
3. Configure transactional email.
4. Harden OpenAI Meeting Studio.
5. Implement Sage read-only sync.
6. Implement Google Drive DAM sync.
7. Add Microsoft calendar/email integration.
8. Add native push providers during mobile/desktop packaging.
