# Phakathi Flow Current State Audit

Phase: 0 repository audit only. This document describes what exists now; it does not approve any implementation work.

## Executive summary

Phakathi Flow is currently a React/Vite office operating system with a Node/Express API, Netlify function wrappers, a local JSON compatibility store, Netlify Blobs support, and a Prisma/PostgreSQL production foundation. The app already contains substantial office workflows: authentication, user onboarding, subsidiaries, projects, tasks, Kanban, meetings, notifications, documents, HR, performance, payroll screens, assets, tickets, and integrations placeholders.

The codebase is a credible office pilot foundation, but it is not yet a complete public app-store-grade product comparable to Monday.com or ClickUp. The main reason is not the user interface; it is the maturity of the production backend, data relationships, permissions, migrations, testing, native packaging, and operational controls.

## Repository inventory

- Total tracked source files found by audit: 376.
- Frontend: `src`, React 18, Vite 6, React Router, TanStack Query, Radix UI, Tailwind, Recharts, drag-and-drop, service worker.
- Backend: `backend/src`, Express 5, route modules, services, storage abstraction, scheduler, push delivery, Prisma setup.
- Deployment: `netlify.toml`, `netlify/functions/api.mjs`, `netlify/functions/scheduled-notifications.mjs`.
- Database foundation: `backend/prisma/schema.prisma`, one migration folder, seed/import/smoke scripts.
- Public assets: service worker and Phakathi brand assets in `public`.

## Current frontend modules

The app contains pages for Home, Dashboard, Executive Dashboard, My Day, Notifications, Calendar, Projects, Project Details, Kanban, Portfolios, Workload Planner, Roadmaps, Gantt, Time Tracking, Goals & OKRs, Messaging, Company Feed, Meeting Studio, Meeting Notes, AI Assistant, Org Chart, Performance Reviews, Onboarding, Team Attendance, Leave, Tickets, Assets, Document Repository/Vault, Expenses, Resource/Room Booking, Noticeboard, Culture Hub, HR Hub, Analytics, Payroll, Auto Payroll, Payslips, Sage Integration, Integrations, Profile, and Settings.

The sidebar and page inventory already match a broad internal office suite. The key gap is that several pages still use generic entity endpoints rather than first-class production APIs.

## Current backend modules

`backend/src/index.js` mounts `/api/auth`, `/api/entities`, `/api/integrations`, `/api/functions`, `/api/analytics`, `/api/push`, and `/api/v1`.

It also exposes README-style resource aliases such as `/api/projects`, `/api/tasks`, `/api/meeting-studio`, `/api/notifications`, and `/api/push-subscriptions`, which internally route to the compatibility entity API.

The current first-class v1 routes are health, organisation, and work. The work service is the strongest production API direction because it connects goals, portfolios, projects, tasks, milestones, meetings, and time logs.

## Current data layer

There are three storage modes:

- `local-json`: local `.local-data/db.json` compatibility store.
- `netlify-blobs`: pilot hosted storage.
- `postgres`: production PostgreSQL through Prisma.

The Prisma schema already includes production-oriented models for organisations, subsidiaries, departments, users, profiles, roles, permissions, audit logs, CRM, business development, projects, tasks, meetings, documents, support, notifications, integrations, and compatibility records.

However, much of the active frontend still reads/writes through compatibility entities. This means the production schema exists before all application workflows have been migrated onto it.

## Current authentication and access control

Implemented:

- Password-based sign-in/register.
- Password hashing.
- Signed auth token.
- Seeded employee claim flow.
- First-login company/profile completion.
- Basic role/permission service.
- Management overview rules for senior roles.

Not yet complete for public or app-store-grade production:

- Email verification.
- Password reset.
- Refresh-token/session lifecycle hardening in the running app.
- MFA.
- Rate limiting and brute-force protection.
- Full role-based access enforcement across every entity and route.
- Formal tenant/subsidiary isolation tests.

## Current notifications

Implemented:

- In-app notifications.
- Browser push subscription foundation.
- VAPID/web-push delivery.
- `public/sw.js` service worker push and click handling.
- Delivery records.
- Local scheduler for birthday, holiday, Monday, DAM, and wellness reminders.
- Netlify scheduled notification function.

Not yet complete:

- Native Android/iOS/Huawei push through FCM/APNs/HMS.
- Desktop native notifications through a packaged desktop app.
- Production delivery observability and retry dashboard.
- Per-user/device notification troubleshooting tools.

## Current AI and Meeting Studio

Implemented:

- Meeting Studio backend endpoint.
- OpenAI-backed transcript processing when `OPENAI_API_KEY` exists.
- Deterministic fallback when no key exists.
- Extraction of meeting summaries, decisions, action items, attendee summaries, and Kanban tasks.

Not yet complete:

- Admin model/provider management.
- Meeting intelligence history, redaction, consent, and retention policies.
- Production AI cost controls and monitoring.

## Current integrations

Found foundations for OpenAI, browser push/VAPID, Netlify Functions and scheduled jobs, Netlify Blobs or local file upload storage, Sage configuration placeholders, Google Drive/DAM configuration placeholders, Microsoft 365/Outlook seed/config placeholders, and email/SMS queue placeholders.

The integration UI exists, but most external integrations are not yet real connected provider flows.

## Current duplicated/transitional areas

- Work pages increasingly use `/api/v1/work`, while Dashboard, Calendar, Executive Dashboard, HR, payroll, assets, expenses, tickets, documents, and many components still use `api.entities`.
- Prisma has first-class CRM and business-development models, but there are no matching first-class CRM/BD APIs or app pages.
- Some resource aliases look like REST routes but still delegate to the generic entity API.
- `Project`, `Task`, `Meeting`, `Notification`, and similar concepts exist in both compatibility JSON entity schemas and Prisma models.

## Current readiness judgement

Office pilot readiness: partially ready after a full QA pass, controlled users, real secrets, and PostgreSQL deployment validation.

Public app-store readiness: not yet. The repo needs production backend hardening, native wrapper strategy, app-store notification implementation, security review, test coverage, monitoring, and a verified release pipeline.
