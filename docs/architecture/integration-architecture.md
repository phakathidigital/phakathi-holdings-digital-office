# Phakathi Flow integration architecture

## Current integrations

Existing foundations:

- Google Drive connector UI/components.
- Sage integration UI/components.
- Upload support through local file storage and Netlify Blobs.
- Placeholder email and SMS queues.
- Meeting Studio AI via OpenAI with fallback.
- Netlify scheduled notification function.

## Current gaps

- No universal integration registry with status, sync logs, retry, or credentials status.
- No Microsoft 365/Outlook integration yet.
- No real SMTP/email provider.
- No real SMS provider.
- Sage and Google are foundations, not fully verified production syncs.
- Credentials are not modelled in a secure production credential store.

## Target Integration Manager

Create first-class integration records with name, provider, status, enabled flag, last sync, last error, credentials configured flag, sync direction, sync frequency, webhook status, supported modules, and owner/admin.

Create sync logs with integration ID, run ID, start/end timestamps, status, records read/written, error message, and metadata.

Create webhook event records with provider, event type, received timestamp, signature status, payload metadata, processing status, and related entity references.

## Microsoft 365 / Outlook target

Support architecture for Outlook email, Outlook Calendar, Microsoft 365 contacts where permitted, meeting creation, and follow-up creation.

No UI should claim Microsoft 365 is connected unless credentials and OAuth configuration are present.

Minimum environment variables:

- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`
- `MICROSOFT_TENANT_ID`
- Redirect/callback URL.

## Google target

Extend existing Google Drive foundations to sync client/project/DAM documents, store file metadata, avoid duplicate imports, respect permissions, log sync results, and support "not configured" status.

Minimum environment variables:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- Redirect/callback URL.

## Sage target

Sage should remain an integration, not be replaced by Phakathi Flow. Integration areas include employee data, leave balances, payroll/payslip data where permitted, and HR/attendance fields where available.

Minimum environment variables:

- `SAGE_API_URL`
- `SAGE_API_KEY`

## Email target

Email should support notification emails, performance-related HR copies, client interaction capture, and later proposal/follow-up sending.

Until SMTP/provider credentials are present, routes should queue locally or return "Email provider not configured" depending on workflow criticality.

Minimum environment variables:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`

## AI target

Keep the existing Meeting Studio AI service and extend it. AI integrations must use server-side API keys only, respect permissions, use actual database data, avoid fabricated metrics, and fall back safely when provider credentials are absent.

Minimum environment variables:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_MEETING_MODEL`

## Notification scheduler target

Preserve existing scheduler logic and support local in-process scheduling, Netlify scheduled functions, and a future standalone worker/cron process for non-Netlify deployments.

The scheduler must use the same data store as the deployed API.

## Integration implementation order

1. Create Integration, IntegrationCredential, IntegrationSyncLog, and WebhookEvent entities.
2. Replace placeholder statuses with real "not configured" checks.
3. Add Microsoft 365 configuration screen and backend status endpoint.
4. Harden Google Drive and Sage as configured/not configured integrations.
5. Wire SMTP provider for real email.
6. Add sync logs and retry support.
7. Add integration audit logs.
