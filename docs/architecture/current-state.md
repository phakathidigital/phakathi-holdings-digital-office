# Phakathi Flow current-state audit

Last audited: 2026-08-20

## Executive summary

Phakathi Flow is an existing React/Vite application with a self-hosted Node/Express API and Netlify Functions deployment support. It already contains many office-work modules: authentication, multi-company profile setup, projects, Kanban, goals/OKRs, portfolios, meetings, Meeting Studio AI, HR, leave, payroll/payslips, performance, attendance, notifications, browser push, DAM/document vault, integrations foundations, and dashboards.

The current system is suitable as an office-pilot foundation, but it is not yet a production-grade Group Business Operating System comparable to Monday.com, ClickUp, Salesforce/HubSpot, Teams, and Sage HR combined. The main blockers are the generic JSON-style data layer, limited relational modelling, incomplete permissions, missing CRM/business-development entities, placeholder generic function routes, and incomplete production database/migration/test coverage.

## Current repository structure

```text
.
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── prisma/
│       ├── schema.prisma
│       └── entities/
├── docs/
│   └── brand/
├── netlify/
│   └── functions/
├── public/
├── scripts/
├── src/
│   ├── api/
│   ├── assets/
│   ├── components/
│   ├── lib/
│   └── pages/
├── Dockerfile
├── MIGRATION.md
├── README.md
├── netlify.toml
├── package.json
└── vite.config.js
```

## Existing frontend modules

The full route map is in `src/App.jsx`, not `src/pages.config.js`. The app currently routes to Dashboard, My Day, Notifications, Calendar, Projects, Project Details, Kanban, Portfolios, Workload Planner, Roadmaps, Gantt Timeline, Time Tracking, Goals & OKRs, Messaging, Company Feed, Meeting Studio, AI Assistant, Org Chart, Performance Reviews, Onboarding, Team Attendance, Support Tickets, Assets, Document Vault, Expenses, Room Booking, Noticeboard, Culture Hub, HR Hub, Meeting Notes, Executive Dashboard, Payroll, Auto Payroll, Sage Integration, Integrations, Profile, and Settings.

`src/pages.config.js` is stale/incomplete and only lists Dashboard, Projects, ProjectDetails, Profile, Settings, and AIAssistant. This is a duplicate routing/configuration source that should either be removed or regenerated from the canonical route map.

## Existing backend/API modules

Current backend entrypoint:

- `backend/src/index.js`

Current API groups:

- `/api/health`
- `/api/auth`
- `/api/entities`
- `/api/integrations`
- `/api/functions`
- `/api/analytics`
- `/api/push`
- README-style aliases such as `/api/projects`, `/api/tasks`, `/api/notifications`, etc.

The generic entity route is the main compatibility layer. It supports schema reads, list/filter/get/create/update/delete/bulk operations for entity names under `backend/prisma/entities/`.

## Existing entities

Entity schema files currently exist for users/profiles, project/work management, meetings, notifications, DAM/documents, HR/leave/payroll/performance, messaging/feed, support/assets/resources, Sage, and Google Drive foundations.

Current local `.local-data/db.json` entity counts at audit time:

| Entity | Count |
| --- | ---: |
| User | 10 |
| UserProfile | 10 |
| Project | 4 |
| Task | 11 |
| Portfolio | 1 |
| OKR | 1 |
| MeetingStudio | 1 |
| Milestone | 3 |
| TimeLog | 1 |
| Notification | 6 |
| NotificationDelivery | 5 |
| PushSubscription | 1 |
| Most HR/operations/document/feed entities | 0 |

One local pilot/test-style user remains in `.local-data/db.json`: `test@admin.com`. This should be removed or converted before real office rollout, but not during Phase 0 documentation.

## Existing authentication

Current implementation:

- Email/password login-or-register.
- PBKDF2 password hashing.
- Signed local auth tokens using `JWT_SECRET`.
- Seeded employees can claim existing profiles by setting a first password.
- Generic entity routes require authentication.
- User records are sanitized before returning to the browser.

Current gaps:

- No refresh-token rotation.
- No password reset flow.
- No email verification.
- No MFA.
- No device/session management screen.
- Role handling is mostly `admin` vs `user`.
- Granular permissions such as `crm.view`, `projects.edit`, or `finance.manage` are not yet implemented.
- Tokens appear to be stored client-side in localStorage, which is acceptable for pilot simplicity but not ideal for high-security production.

## Existing multi-company implementation

Reusable current pieces:

- Canonical subsidiary list in `src/lib/subsidiaries.js`.
- First-login profile completion for missing subsidiary.
- User/profile records store subsidiary, department, and job title.
- Group overview helper in `src/lib/accessControl.js` gives visibility to admin, Group CEO, Operations Manager, and HR.

Current gap:

- Organisation → Subsidiary → Department is not a true relational hierarchy yet.
- Company/subsidiary grouping is mostly string-based.
- Some departments are still hard-coded per page/component.

## Existing work-management implementation

Reusable current pieces:

- Work system roll-up helpers in `src/lib/workSystem.js`.
- Project progress is calculated from linked tasks, not manually trusted.
- Task status changes record history fields.
- Project completion is blocked if linked tasks are incomplete.
- Kanban, projects, portfolios, OKRs, workload, Gantt, roadmaps, and time tracking already exist.
- Meeting Studio can extract Kanban-ready tasks.

Current gaps:

- No CRM/opportunity/client relationships on Project yet.
- No unified activity timeline.
- No formal audit log.
- Some project/task operations depend on generic entity CRUD rather than first-class project services.

## Existing notification implementation

Reusable current pieces:

- `public/sw.js` service worker.
- `backend/src/services/pushService.js`.
- `backend/src/services/scheduler.js`.
- `backend/src/services/notificationContent.js`.
- `backend/src/services/notificationHooks.js`.
- `netlify/functions/scheduled-notifications.mjs`.
- `Notification`, `PushSubscription`, and `NotificationDelivery` entities.

Supported current notification categories include birthdays, South African public/special holidays, Monday alignment reminders, DAM usage reminders, break/wellness reminders, Did You Know/fun facts, and workflow-generated notifications for several entity changes.

Current gaps:

- Browser/device push depends on user permission, HTTPS/localhost, stable VAPID keys, and a running backend/scheduled function.
- Email and SMS routes currently queue locally but are not connected to real providers.
- No mobile-native push provider yet.

## Existing AI implementation

Reusable current pieces:

- `backend/src/services/meetingStudioAi.js` uses OpenAI Responses API when `OPENAI_API_KEY` exists.
- Meeting Studio has deterministic local fallback.
- Meeting processing returns summary, decisions, action items, structured notes, attendee summaries, and extracted tasks.

Current gaps:

- General `/api/integrations/ai/:operation` still has local placeholder responses except for Meeting Studio-style prompts.
- AI Assistant and BI features do not yet query a permission-aware CRM/business data layer.
- No AI client briefing or opportunity analysis yet.

## Existing integrations

Reusable current pieces:

- Google Drive connector foundations.
- Sage integration foundations.
- Integration page/component foundations.
- Upload support through local file storage or Netlify Blobs.

Current gaps:

- Microsoft 365/Outlook architecture is not yet present as a real module.
- Integration credentials/status/sync logs are not represented by first-class relational entities.
- Integrations should show "not configured" when credentials are absent.

## Existing storage

Current storage modes:

- Local development: `.local-data/db.json` and `.local-data/uploads`.
- Netlify deployment: Netlify Blobs for app data and uploads.
- Prisma schema exists but is very thin: `User`, `EntityRecord`, `PushSubscription`, and `NotificationDelivery`.

Current gaps:

- PostgreSQL is not yet the authoritative production system of record.
- Prisma migrations/scripts are not yet wired into `package.json`.
- Most business data remains generic JSON records, not relational tables with constraints and foreign keys.

## Existing deployment support

Current support:

- Vite production build.
- Netlify frontend deployment.
- Netlify `/api/*` function wrapper.
- Netlify scheduled notification function.
- Dockerfile exists.

Current gaps:

- Dockerfile serves only static frontend through nginx and does not run the Node API.
- Render/Railway/Fly/AWS/Azure/DigitalOcean/VPS deployment docs are not yet implemented.
- Netlify Blobs are useful for hosted pilot persistence but should not be the only production database option.

## Duplicate or conflicting implementation areas

- `src/App.jsx` and `src/pages.config.js` both define page/routing concepts, but `pages.config.js` is stale.
- Generic `/api/entities/:entityName` and README-style aliases both expose the same data, which is acceptable for compatibility but should be documented.
- `/api/functions/:functionName` returns `{ placeholder: true }`, which is unsafe for production because it can make missing workflows look successful.
- Several pages/components still hard-code department lists instead of using a canonical organisation/department model.
- Project/work progress logic is improving, but still spread between frontend helpers and backend generic entity rules.

## Immediate Phase 0 recommendations

1. Preserve the existing app, routes, and compatibility entity layer.
2. Introduce first-class production architecture around PostgreSQL/Prisma without deleting `.local-data`.
3. Create relational CRM/business-development entities as an extension of the existing work system.
4. Add granular permissions and audit logging before exposing relationship intelligence.
5. Replace placeholder function endpoints with explicit "not implemented/configured" responses or real handlers.
6. Remove/convert local test user data before live office use.
7. Keep Netlify support, but define Postgres as the production source of truth.
