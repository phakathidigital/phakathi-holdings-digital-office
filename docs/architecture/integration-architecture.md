# Phakathi Flow integration architecture

## Current integrations

Existing:

- OpenAI Meeting Studio.
- Deterministic Meeting Studio fallback.
- Browser push with VAPID/web-push.
- Netlify scheduled notifications.
- Netlify Functions API.
- Netlify Blobs upload support.
- Local file upload support.
- Sage UI foundation.
- Google Drive UI foundation.
- Email/SMS queue placeholders.

## Missing/incomplete integrations

- Real SMTP/email provider.
- Real SMS provider.
- Microsoft 365/Outlook OAuth, calendar, and email capture.
- Google Drive production sync.
- Sage production sync.
- Encrypted credential workflow.
- Webhook signature verification.
- Retryable sync logs.
- Admin integration status screens backed by real data.

## Target integration control plane

Use relational tables:

- Integration.
- IntegrationCredential.
- IntegrationSyncLog.
- WebhookEvent.

Every integration should expose:

- Provider.
- Status.
- Enabled flag.
- Credentials configured flag.
- Last sync.
- Last error.
- Sync direction/frequency.
- Webhook status.
- Supported modules.

## Credential policy

Credentials must be server-side only, secret/encrypted, never committed, never returned to the browser, rotatable, and audited.

## Email target

Use cases:

- HR/performance emails.
- Meeting summaries.
- Notification emails.
- Client follow-ups.

Current route queues only. Target route should use SMTP/provider adapter, EmailActivity records, delivery logs, and clear not-configured responses.

## Microsoft 365 target

Needed:

- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`
- `MICROSOFT_TENANT_ID`
- OAuth callback.
- Outlook Calendar and email capture where permitted.

## Google target

Needed:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- Drive sync status.
- Folder mapping.
- File metadata import.
- Duplicate detection.
- Sync logs.

## Sage target

Needed:

- `SAGE_API_URL`
- `SAGE_API_KEY`
- Employee/leave/payroll metadata sync where permitted.

## AI target

OpenAI must remain server-side, permission-aware, and non-fabricating. Extend beyond Meeting Studio only after `/api/v1` services can provide permission-filtered data.

## Implementation order

1. Integration status API.
2. Connect Integrations UI to real Integration records.
3. Replace placeholder success with configured/not-configured states.
4. Email provider adapter.
5. Microsoft 365 foundation.
6. Google/Sage sync hardening.
7. Webhook verification.
8. Sync log UI.
