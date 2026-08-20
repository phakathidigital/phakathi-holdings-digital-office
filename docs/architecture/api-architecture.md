# Phakathi Flow API architecture

## Current API

Current base:

- Local: `http://127.0.0.1:4000/api`
- Netlify: `/api`

Current route groups:

- `/api/health`
- `/api/auth`
- `/api/entities`
- `/api/integrations`
- `/api/functions`
- `/api/analytics`
- `/api/push`

Current compatibility aliases include `/api/projects`, `/api/tasks`, `/api/portfolios`, `/api/meeting-studio`, `/api/notifications`, `/api/push-subscriptions`, `/api/hr-documents`, and other entity-backed resources.

## Current API strengths

- One API client shape preserves existing frontend functionality.
- Generic entity CRUD allows all migrated pages to keep working.
- Auth is enforced for generic entity operations.
- Notification hooks run when records are created/updated.
- Meeting Studio AI has a real backend endpoint with fallback.
- Netlify Functions can wrap the Express API.

## Current API gaps

- No `/api/v1` namespace yet.
- Generic entity CRUD does not enforce granular permissions per resource/action.
- No first-class CRM/sales endpoints.
- `/api/functions/:functionName` returns placeholder success.
- Analytics endpoint is not a full BI/event pipeline.
- No central audit logging on all mutating operations.
- No input validation layer per resource.
- No pagination standard for large tables/timelines.
- No rate limiting or CSRF/session hardening yet.

## Target API namespace

New production routes should be introduced under `/api/v1` while preserving the current `/api` compatibility layer.

```text
/api/v1/auth
/api/v1/users
/api/v1/organisations
/api/v1/subsidiaries
/api/v1/departments
/api/v1/crm/accounts
/api/v1/crm/contacts
/api/v1/crm/leads
/api/v1/crm/opportunities
/api/v1/crm/activities
/api/v1/crm/interactions
/api/v1/crm/timeline
/api/v1/crm/health
/api/v1/sales/pipeline
/api/v1/sales/proposals
/api/v1/sales/deals
/api/v1/projects
/api/v1/portfolios
/api/v1/milestones
/api/v1/tasks
/api/v1/kanban
/api/v1/meetings
/api/v1/calendar
/api/v1/documents
/api/v1/dam
/api/v1/hr
/api/v1/performance
/api/v1/leave
/api/v1/payroll
/api/v1/notifications
/api/v1/push
/api/v1/analytics
/api/v1/ai
/api/v1/integrations
/api/v1/audit
```

## Service-layer target

Routes should call services, not manipulate storage directly:

```text
Route
  ↓
Validation
  ↓
Auth + permission check
  ↓
Service
  ↓
Repository
  ↓
Database/object storage/integration provider
  ↓
Audit log + notifications
```

## Permission model

Every route should be protected by both authentication and action permissions. Examples include `crm.view`, `crm.create`, `crm.edit`, `crm.delete`, `sales.view`, `sales.manage`, `projects.view`, `projects.create`, `projects.edit`, `projects.delete`, `employees.view`, `employees.manage`, `finance.view`, `finance.manage`, `reports.view`, `audit.view`, and `admin.manage`.

Roles should be bundles of permissions, not the only authorization mechanism.

## CRM endpoint responsibilities

CRM routes should support account list/search/filter, Account 360 detail, contact list/detail, relationship intelligence fields with privacy controls, notes, interactions, timeline aggregation, health calculation, and follow-up reminders.

## Sales endpoint responsibilities

Sales routes should support lead creation/qualification, opportunity pipeline drag/drop stage changes, forecast calculations, proposal tracking, won/lost conversion, and create-project-from-opportunity using the existing project engine.

## AI endpoint responsibilities

AI routes must only answer from data the user is permitted to access. The existing Meeting Studio AI service should be extended for client briefing, opportunity analysis, project intelligence, executive summaries, relationship intelligence, and business questions.

If an AI provider key is absent, the route should return a safe fallback or a clear "AI provider not configured" response.

## API hardening checklist

- Add `/api/v1` routes.
- Add request validation with schemas.
- Add permission middleware.
- Add audit logging middleware/service.
- Replace placeholder function route.
- Add pagination: `limit`, `cursor`, `sort`.
- Add consistent error shape.
- Add rate limiting.
- Add API tests.
- Preserve current `/api/entities` compatibility during migration.
