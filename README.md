# Phakathi Flow

Phakathi Flow is the local/self-hosted digital office for the Phakathi Holdings group. It supports shared services and subsidiary teams in one React/Vite app, with a Node/Netlify API backend for auth, profiles, entity data, uploads, email placeholders, OpenAI-backed Meeting Studio processing, scheduled notifications, and safe local AI fallback.

## Local development

```bash
npm install
npm run dev
```

`npm run dev` starts:

- API backend: `http://127.0.0.1:4000/api`
- Vite frontend: `http://127.0.0.1:5173`

Production build check:

```bash
npm run build
```

## Backend

The backend follows the README target structure:

```text
backend/
├── src/
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── index.js
└── prisma/
    ├── schema.prisma
    └── entities/
```

Local development data is stored in `.local-data/db.json`. That folder is intentionally git-ignored. Deployed Netlify functions use Netlify Blobs for persistent hosted app data and uploaded files.

Production database foundation is available through Prisma/PostgreSQL. Keep the default `PHAKATHI_STORAGE=local-json` for local development, use `PHAKATHI_STORAGE=netlify-blobs` for the current Netlify pilot, and use `PHAKATHI_STORAGE=postgres` only after running the database migration/seed/import steps. See `docs/deployment/postgres.md`.

Implemented backend capabilities:

- Local sign-in/register by email and password.
- First password setup for seeded employees: if an employee already exists in the seeded roster but has no password yet, their first successful sign-in/register attempt sets their password on that staff record.
- Signed local auth tokens using `JWT_SECRET`.
- Current user profile read/update.
- Auth-protected generic entity CRUD for all migrated entity schemas in `backend/prisma/entities/`.
- Seed users for Phakathi Holdings and Empoweryst.
- Local file upload storage under `.local-data/uploads`; hosted upload storage through Netlify Blobs.
- Email/SMS queue placeholders plus OpenAI-backed Meeting Studio transcript analysis with safe deterministic fallback when `OPENAI_API_KEY` is not configured.
- July 2026 seeded working data for Goals → Portfolio → Projects → Kanban → Meeting Studio workflow.
- Prisma/PostgreSQL production foundation with migrations, seed data, and safe `.local-data/db.json` import tooling.

Database commands:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:smoke
npm run db:import-local -- --dry-run
npm run db:import-local
```

## Multi-company group-user feature

The canonical subsidiary list is shared from `src/lib/subsidiaries.js`:

1. Phakathi Holdings
2. Empoweryst
3. Micky Mouse School / Baby Geniuses
4. Phakathi Capital
5. Key Experts
6. Kaelo Education
7. Kaelo
8. Synergex Health

New users sign in/register locally, then must complete first-login profile setup before entering the app. That setup captures company/subsidiary and designation/role.

For the real seeded employees below, use their listed work email on first sign-in and choose a password of at least 8 characters. That claims the existing staff profile instead of creating a duplicate employee.

Actual initial staff records:

- Group CEO: Mr Tshepo Phakathi
- Phakathi Holdings: Lorraine Sekwati — HR (`lorraine@phkathiholdings.co.za`); Meriam Malatji — Bookkeeper / Accountant; Phathtshedzo Rakhunwana — Web, Graphics, and System Developer (`phathutshedzo@phakathiholdings`); Thuli Thabethe — Office Coordinator; Percity Mavimbela — Operations Manager
- Empoweryst: Sarah Ngwenya — Administrator; Lesedi Lucy Motloung — Senior BBBEE Consultant; Molato Moloko — Senior BBBEE Consultant

Performance-related notifications and queued email notices are copied to HR at `lorraine@phkathiholdings.co.za`.

## Branding

Phakathi Holdings web logos, cover imagery, icon assets, and brand guide are stored locally:

- `src/assets/branding/phakathi-holdings/`
- `public/brand/`
- `docs/brand/phakathi-holdings-group-brand-guide.docx`

The app uses the Phakathi Holdings logo in the auth landing screen, sidebar, mobile header, and favicon. The auth landing screen uses the portfolio-of-companies image, and the dashboard hero uses the company profile cover image to reflect the group focus areas: education, health, mining, energy, and shared services.

## Weekly Monday alignment meetings

The meeting scheduler and AI Meeting Studio include a weekly Monday alignment template based on the March/April 2026 meeting notes. The template includes group strategy alignment, subsidiary updates, performance/project-management blockers, and action-item follow-up.

Meeting Studio posts transcripts to the backend `/api/integrations/ai/meeting-studio` endpoint. When `OPENAI_API_KEY` is present, the backend uses OpenAI to return:

- executive summary
- decisions
- action items
- structured notes
- attendee summaries
- extracted Kanban-ready tasks

When no key is present, the backend uses a deterministic fallback parser so the UI remains usable for testing and daily capture.

## Environment

Copy `.env.example` to `.env.local` if you need to override defaults.

```bash
VITE_API_BASE_URL=http://127.0.0.1:4000/api
JWT_SECRET=replace-with-a-long-random-secret
```

For office testing, set `JWT_SECRET` before employees begin using the app so sessions remain valid across backend restarts. Provider keys such as `OPENAI_API_KEY`, SMTP, SMS, and future `DATABASE_URL` values are optional until the production backend is hardened. `OPENAI_API_KEY` enables the real Meeting Studio AI flow; without it, Meeting Studio uses the safe fallback.

For production database testing, set `DATABASE_URL` and `PHAKATHI_STORAGE=postgres`, then run the database commands above before starting the API.

## Netlify always-on office deployment

The deployed Netlify setup now includes:

- `/api/*` served by `netlify/functions/api.mjs`.
- Persistent hosted app data in Netlify Blobs store `phakathi-flow-db`.
- Persistent hosted uploads in Netlify Blobs store `phakathi-flow-uploads`.
- Scheduled notification scans in `netlify/functions/scheduled-notifications.mjs`.
- Production frontend API base set to `/api` in `netlify.toml`.

Set these sensitive variables in Netlify site environment variables, not in Git:

```bash
JWT_SECRET=...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:notifications@phakathiholdings.local
SCHEDULED_NOTIFICATION_SECRET=...
OPENAI_API_KEY=...
OPENAI_MEETING_MODEL=gpt-4.1-mini
```

`PHAKATHI_STORAGE=netlify-blobs` is configured in `netlify.toml` for deployed builds. If a separate external API is later used, set `PHAKATHI_API_BASE_URL`; otherwise the scheduled function scans the Netlify Blobs-backed store directly.

## Device push notifications

Phakathi Flow now includes browser/device push notification support for logged-in users:

- Service worker notification handling in `public/sw.js`.
- Push subscription storage per user/device in `PushSubscription`.
- Per-notification delivery tracking in `NotificationDelivery`.
- Backend VAPID/web-push delivery through `/api/push`.
- Scheduled notification scan for birthdays, South African holidays/special days, break reminders, and “Did You Know?” facts.
- User preferences in Settings for birthdays, public holidays, break motivations, and funny/interesting “Did You Know” facts.
- All notification records default to both app popups and browser/device push unless a workflow explicitly changes `delivery_channels`.
- Automatic assignment/status notifications are generated for common workflows such as task assignment, asset assignment, project team membership, tickets, and Document Vault/DAM sharing or review updates.
- DAM usage reminders are scheduled on Monday and Thursday to encourage document upload, tagging, review, and approval discipline.

For stable push subscriptions, generate persistent VAPID keys once and place them in `.env.local`:

```bash
npm run push:vapid
```

Then copy the generated values into:

```bash
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:notifications@phakathiholdings.local
```

Localhost can use browser push during development. Production/device push requires HTTPS or localhost, stable VAPID keys, and a running backend/scheduler. Users must also enable Browser Push Notifications in Settings on each device they want subscribed. Browser vendors require each user/device to grant permission; the app cannot silently enable operating-system popups.

For office pilot testing:

1. Generate VAPID keys once with `npm run push:vapid`.
2. Put `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` in `.env.local`.
3. Start the app with `npm run dev`.
4. Each employee signs in, opens Settings → Notifications, enables Browser Push Notifications, and sends a test push.
5. Keep the backend running for local scheduled notifications, or deploy the Netlify scheduled function for hosted scans.

For local development, the backend scheduler runs shortly after startup and then every four hours unless `ENABLE_LOCAL_NOTIFICATION_SCHEDULER=false`.

For deployment, notification scans are prepared for Netlify scheduled functions:

- `netlify.toml` configures `netlify/functions/scheduled-notifications.mjs`.
- The function runs at 07:00, 11:00, and 14:00 UTC.
- By default, the scheduled function scans the Netlify Blobs-backed store directly.
- Optionally set `PHAKATHI_API_BASE_URL` to a separate deployed backend/API URL if you later move the API away from Netlify Functions.
- Set `SCHEDULED_NOTIFICATION_SECRET` on both Netlify and the backend to allow secure cron triggering of `/api/push/run-scan`.

The scheduler preserves birthday, South African holiday/special day, break/wellness, Did You Know, DAM usage, and Monday reminder logic through the shared backend notification scanner.

## July 2026 workflow seed

The local backend seeds realistic working data:

- OKR: July 2026 group execution rhythm.
- Portfolio: July 2026 Group Execution & Education Growth Portfolio.
- Projects: Monday alignment cadence, Empoweryst BBBEE delivery, DAM discipline, and education ecosystem pipeline.
- Kanban tasks assigned to the real Phakathi Holdings / Empoweryst roster.
- Monday alignment Meeting Studio record for 6 July 2026 with summary, decisions, action items, attendee summaries, and synced Kanban tasks.

The stale Tester project/task seed is removed automatically during backend store initialization.
