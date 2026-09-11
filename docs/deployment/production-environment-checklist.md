# Production environment checklist

This checklist classifies Phakathi Flow production variables without exposing secret values.

## Required

| Variable | Purpose | Validation |
| --- | --- | --- |
| `PHAKATHI_STORAGE` | Runtime storage mode. Must be `postgres` in production. | `npm run prod:env-check` |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma. | `npm run db:check`, `npm run db:migrate:deploy`, `npm run test:postgres` |
| `JWT_SECRET` | Access-token signing secret, 32+ chars. | production startup validation |
| `JWT_REFRESH_SECRET` | Refresh/reset-token signing secret, 32+ chars. | production startup validation |
| `APP_PUBLIC_URL` | Public frontend URL used in password reset and verification links. | password reset/email verification tests |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins. | CORS validation |
| `VAPID_PUBLIC_KEY` | Browser push public key. | push subscription test |
| `VAPID_PRIVATE_KEY` | Browser push private key. | push delivery test |
| `VAPID_SUBJECT` | VAPID contact subject. | push delivery test |
| `SCHEDULED_NOTIFICATION_SECRET` | Protects scheduled notification execution. | scheduled job test |
| `STORAGE_PROVIDER` | Production file provider: `local`, `netlify-blobs`, or `s3`. | upload/read/download tests |

## Optional

| Variable | Purpose |
| --- | --- |
| `API_BASE_URL` | External API URL when different from the frontend origin. |
| `AUTH_TOKEN_TTL_SECONDS` | Access-token TTL override. |
| `AUTH_REFRESH_TOKEN_TTL_SECONDS` | Refresh-token TTL override. |
| `PASSWORD_HASH_ITERATIONS` | PBKDF2 iteration override. |
| `OPENAI_MEETING_MODEL` | Meeting Studio model override. |
| `OPENAI_MODEL` | General AI model override. |
| `ENABLE_LOCAL_NOTIFICATION_SCHEDULER` | Enables/disables the local scheduler outside Netlify. |
| `SAGE_API_URL`, `SAGE_API_KEY` | Sage integration only when enabled. |
| `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID` | Microsoft integration only when enabled. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google integration only when enabled. |
| `SMS_PROVIDER_API_KEY` | SMS provider only when enabled. |

## Provider-specific

| Variable | Required when | Purpose |
| --- | --- | --- |
| `EMAIL_PROVIDER` | Email delivery is enabled | Provider name such as `smtp` or `resend`. |
| `SMTP_HOST` | `EMAIL_PROVIDER=smtp` | SMTP host. |
| `SMTP_PORT` | `EMAIL_PROVIDER=smtp` | SMTP port. |
| `SMTP_USER` | SMTP auth is enabled | SMTP username. |
| `SMTP_PASSWORD` / `SMTP_PASS` | SMTP auth is enabled | SMTP password. |
| `SMTP_FROM` | Email delivery is enabled | Sender address. |
| `EMAIL_PROVIDER_API_KEY` | API email provider is used | Provider API key. |
| `RESEND_API_KEY` | `EMAIL_PROVIDER=resend` | Resend API key. |
| `OPENAI_API_KEY` | OpenAI AI is enabled | Server-side OpenAI key. |
| `STORAGE_BUCKET` | `STORAGE_PROVIDER=s3` | S3-compatible bucket. |
| `STORAGE_REGION` | `STORAGE_PROVIDER=s3` | S3-compatible region. |
| `STORAGE_ACCESS_KEY` | `STORAGE_PROVIDER=s3` | S3-compatible access key. |
| `STORAGE_SECRET_KEY` | `STORAGE_PROVIDER=s3` | S3-compatible secret key. |
| `PHAKATHI_API_BASE_URL` | Scheduled jobs call an external API | Deployed backend/API URL. |
| `NETLIFY_SITE_ID` | Netlify CLI/API operations | Netlify site ID. |
| `NETLIFY_AUTH_TOKEN` | Netlify CLI/API operations | Netlify token. |

## Non-secret validation commands

```bash
npm run prod:env-check
npm run db:generate
npm run db:check
npm run db:migrate:deploy
npm run test:postgres
npm run build
```

Do not run `npm run db:reset` against production or pilot databases.
