# Phakathi Flow

Phakathi Flow is the local/self-hosted digital office for the Phakathi Holdings group. It supports shared services and subsidiary teams in one React/Vite app, with a local Node API backend for auth, profiles, entity data, uploads, email placeholders, and AI placeholders.

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

Local development data is stored in `.local-data/db.json`. That folder is intentionally git-ignored.

Implemented backend capabilities:

- Local sign-in/register by email.
- Current user profile read/update.
- Generic entity CRUD for all migrated entity schemas in `backend/prisma/entities/`.
- Seed users for Phakathi Holdings and Empoweryst.
- Local file upload storage under `.local-data/uploads`.
- Email/SMS/AI placeholder endpoints so workflows remain usable without external provider keys.

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

Initial team placeholders:

- Phakathi Holdings: Lorraine, Meriam, Phathu, Thuli, Percity
- Empoweryst: Sarah, Lesedi, Molato

## Branding

Phakathi Holdings web logos, cover imagery, icon assets, and brand guide are stored locally:

- `src/assets/branding/phakathi-holdings/`
- `public/brand/`
- `docs/brand/phakathi-holdings-group-brand-guide.docx`

The app uses the Phakathi Holdings logo in the auth landing screen, sidebar, mobile header, and favicon. The auth landing screen uses the portfolio-of-companies image, and the dashboard hero uses the company profile cover image to reflect the group focus areas: education, health, mining, energy, and shared services.

## Weekly Monday alignment meetings

The meeting scheduler and AI Meeting Studio include a weekly Monday alignment template based on the March/April 2026 meeting notes. The template includes group strategy alignment, subsidiary updates, performance/project-management blockers, and action-item follow-up.

## Environment

Copy `.env.example` to `.env.local` if you need to override defaults.

```bash
VITE_API_BASE_URL=http://127.0.0.1:4000/api
```

Provider keys such as `OPENAI_API_KEY`, SMTP, SMS, and future `DATABASE_URL` values are optional until the production backend is hardened.

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

Localhost can use browser push during development. Production device push requires HTTPS and stable VAPID keys. Users must also enable Browser Push Notifications in Settings on each device they want subscribed.

The backend scheduler runs shortly after startup and then every four hours. It creates each scheduled notification once per day using an idempotency key, then sends browser push to subscribed devices where the user’s notification preferences allow it.
