# Phakathi Flow current-state audit

Last audited: 2026-08-21

## Executive summary

Phakathi Flow is now a React/Vite office operating system with a Node/Express API, Netlify Functions deployment, scheduled notifications, OpenAI-backed Meeting Studio with fallback, password authentication, browser push foundations, and a PostgreSQL/Prisma production foundation.

The key finding is that the app is usable as an office pilot, but the business system is still partly disconnected:

- Most pages still use generic compatibility CRUD through `/api/entities/:EntityName`.
- PostgreSQL exists, but much live app data still flows through the `EntityRecord` compatibility table.
- The Prisma schema already contains many target CRM/business-development/work models, but most are not yet wired to dedicated production APIs or UI flows.

## What currently exists

### Frontend modules

Existing routed pages include Dashboard, My Day, Notifications, Calendar, Projects, Project Details, Kanban, Portfolios, Workload Planner, Roadmaps, Gantt Timeline, Time Tracking, Goals & OKRs, Messaging, Company Feed, Meeting Studio, AI Assistant, Org Chart, Performance, Onboarding, Team Attendance, Tickets, Assets, Document Vault, Expenses, Room Booking/Resource Calendar, Noticeboard, Culture Hub, HR Hub, Meeting Notes, Executive Dashboard, Payroll, Auto Payroll, Sage Integration, Integrations, Profile, and Settings.

The product surface is broad. The next problem is not missing pages; it is missing relationships between the pages.

### Backend/API

Current backend entrypoint: `backend/src/index.js`.

Current route groups:

- `/api/health`
- `/api/auth`
- `/api/entities`
- `/api/integrations`
- `/api/functions`
- `/api/analytics`
- `/api/push`

Netlify wraps the Express API through `netlify/functions/api.mjs`.

### Authentication

Implemented:

- Email/password login-or-register.
- PBKDF2 password hashing.
- Signed auth tokens.
- First-login company/profile completion.
- Sanitized user responses.
- Protected generic entity routes.

Gaps:

- No password reset.
- No email verification.
- No MFA.
- No live refresh-token/session rotation flow.
- No device/session management UI.
- Token storage is still browser `localStorage`.
- RBAC is not yet granular across entities/actions.

### Multi-company support

Implemented:

- Canonical subsidiaries in `src/lib/subsidiaries.js`.
- First-login subsidiary selection.
- User fields for subsidiary, department, and job title.
- Group overview helper for Group CEO, Operations Manager, HR/admin-style access.

Gaps:

- Most UI still uses string company names instead of relational `subsidiary_id`.
- Department taxonomy is not canonical.
- Subsidiary visibility is not consistently enforced server-side.

### Work management

Implemented:

- Goals/OKRs, Portfolios, Projects, Kanban Tasks, Milestones, Gantt, Roadmaps, Workload Planner, Time Tracking, Meeting Studio.
- Project progress cannot simply be manually overwritten because backend strips `progress` fields.
- Project completion is blocked while linked tasks are incomplete.
- Task status history, completion user/date, and reopen user/date are tracked.
- Production smoke check found seeded pilot work data: 4 projects, 11 tasks, 1 portfolio, 1 meeting.

Gaps:

- Work records still mostly live as compatibility JSON records.
- Portfolio/OKR/project/task relationships are not fully relational in live UI.
- Task dependencies and meeting action items need first-class models.
- Time tracking is not yet required for project health/accountability.

### Notifications

Implemented:

- Browser service worker.
- VAPID/web-push.
- Notification, PushSubscription, NotificationDelivery concepts.
- Birthday, SA holiday/special day, Monday alignment, DAM usage, break/wellness, Did You Know/fun fact notifications.
- Netlify scheduled function and `/api/push/run-scan`.

Gaps:

- Mobile-native push is not implemented.
- Desktop-native notifications are not implemented.
- Email/SMS provider delivery is not connected.
- Notification preferences and delivery logs need stronger production modelling.

### AI

Implemented:

- Meeting Studio uses OpenAI Responses API when `OPENAI_API_KEY` is configured.
- Meeting Studio has deterministic fallback.
- Output includes summaries, decisions, action items, attendee summaries, and extracted tasks.

Gaps:

- General AI Assistant remains partly placeholder.
- AI does not yet query permission-filtered CRM/work data.
- No client briefing, opportunity analysis, or executive data intelligence yet.

### Database/storage

Supported modes:

- `local-json`: `.local-data/db.json`.
- `netlify-blobs`: transitional hosted pilot mode.
- `postgres`: Prisma/PostgreSQL production mode.

Prisma currently includes organisation, subsidiary, department, user, profile, role, permission, session, refresh token, audit, CRM, business-development, project, task, meeting, document, notification, integration, webhook, `EntityRecord`, and `AppState` models.

Gaps:

- Most live data uses `EntityRecord`.
- First-class Prisma tables are not yet the primary service layer for most UI flows.
- Automated test coverage is still missing.

### Deployment

Implemented:

- Netlify frontend and functions deploy.
- API health verified live.
- Scheduled notification function deployed.
- Netlify currently builds from `Phathu87/phakathi-flow`; fixes are also pushed to `phakathidigital/phakathi-holdings-digital-office`.

Gaps:

- Netlify should be reconnected to the organisation repo.
- Dockerfile is static-frontend oriented and not a full API/scheduler deployment.
- Android/iOS/Desktop packaging is not started.

## What can be reused

- React/Vite UI and route map.
- Current sidebar/module groupings.
- Generic API client during migration.
- Auth hashing/token foundation.
- First-login company onboarding.
- Canonical subsidiaries and branding defaults.
- Work-management pages and roll-up logic.
- Meeting Studio AI service.
- Notification scheduler and push foundation.
- Netlify function wrapper.
- Prisma production schema foundation.

## What is duplicated or inconsistent

- `/api/entities` and alias routes expose the same compatibility data.
- Relational Prisma models and `EntityRecord` compatibility storage coexist.
- Company/user fields exist as strings and relational IDs.
- Meeting concepts are split across MeetingStudio, MeetingNote, and relational Meeting.
- Documents exist as compatibility document vault records and relational Document.
- Tickets exist as compatibility Ticket/TicketComment and relational SupportTicket.
- `/api/functions/:functionName` is placeholder-style and should not pretend workflows exist.

## What needs migration

- Users/profiles to relational organisation/subsidiary/department IDs.
- Work data to relational projects/tasks/meetings/timelogs/milestones.
- Meeting Studio records to relational meetings/action items/tasks.
- Documents/DAM to relational metadata plus object storage.
- Notifications to direct relational notification services.
- Integrations to Integration/IntegrationCredential/IntegrationSyncLog/WebhookEvent.
- New CRM and Business Development UI/API on top of existing schema.

## What needs refactoring

- Add `/api/v1` domain APIs.
- Add service/repository layers.
- Add validation schemas.
- Add granular permissions.
- Add audit logging.
- Replace critical generic writes with domain services.
- Add platform abstraction before mobile/desktop packaging.
- Separate local/dev/demo seed logic from production seed logic.

## CRM entities missing or not fully wired

Needs first-class UI/API wiring:

- CRM dashboard.
- Account list/detail.
- Account 360.
- Contacts.
- Contact relationships.
- Preferences, interests, important dates.
- Notes.
- Interactions.
- Activity timeline.
- Client health.
- Follow-ups/reminders.
- Privacy/visibility controls.

## Business Development entities missing or not fully wired

Needs first-class UI/API wiring:

- Lead capture/qualification.
- Lead sources.
- Opportunity pipeline.
- Opportunity stages.
- Opportunity activities.
- Proposals.
- Deals.
- Deal products/services.
- Contracts.
- Sales targets and forecasts.
- Win/loss reasons.
- Create project from opportunity.

## Project relationships needing modification

Projects must connect to:

- Subsidiary.
- Client account.
- Primary contact.
- Opportunity.
- Contract.
- Account manager.
- Portfolio.
- OKR.
- Project value.
- Client status.
- Expected start/end dates.
- Documents, meetings, tickets, and activity timeline.

## Integrations already present

- OpenAI Meeting Studio.
- Browser push.
- Netlify scheduled functions.
- Netlify Functions API.
- Netlify Blobs upload support.
- Sage UI foundation.
- Google Drive UI foundation.
- Email/SMS queue placeholders.

## Integrations missing/incomplete

- Real SMTP/email provider.
- Real SMS provider.
- Microsoft 365/Outlook.
- Google Drive production sync.
- Sage production sync.
- Webhook verification.
- Encrypted credential workflow.
- Sync logs and retry UI.

## Database changes required

Required next database work:

1. Move live services from `EntityRecord` to first-class relational tables.
2. Add missing relational models: Portfolio, OKR, TaskDependency, MeetingActionItem, CalendarEvent, DocumentFolder, DocumentVersion, TicketComment, EmailActivity, SMSActivity, Device, NotificationPreference, FileAsset/Attachment.
3. Backfill relational IDs.
4. Add audit writes on sensitive changes.
5. Add indexes for dashboards/timelines.
6. Add migration and seed tests.

## Security issues

- Tokens in localStorage.
- No password reset/email verification/MFA.
- No live refresh-token/session revocation flow.
- Generic CRUD too broad for production.
- AuditLog schema exists but is not consistently used.
- Integration credential security is not implemented end-to-end.
- Smoke-test users should be cleaned before office rollout.
- Netlify repo connection should move to the organisation repo.

## What should be done first

Do not add more disconnected screens first.

Start with:

1. `/api/v1` skeleton.
2. Permissions and audit logging.
3. Organisation/subsidiary/department/user services.
4. Backfill relational IDs.
5. First-class work services.
6. Then CRM Account + Contact + Activity as the first new business module.
