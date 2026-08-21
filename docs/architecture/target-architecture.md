# Phakathi Flow target architecture

## Target product

Phakathi Flow should become the Phakathi Holdings Group Business Operating System: one secure system for people, subsidiaries, execution, CRM, business development, documents, meetings, notifications, integrations, AI, and management visibility.

## Non-negotiable architecture

PostgreSQL is the authoritative production database.

```text
React/Vite Web
Capacitor Android/iOS
Tauri Desktop
        |
        v
Shared API + business service layer
        |
        v
Prisma
        |
        v
PostgreSQL

Object storage handles files.
Schedulers/workers handle reminders, syncs, notifications, and reports.
```

Local JSON and Netlify Blobs are transitional/dev/pilot options only.

## Core business relationship model

```text
Organisation
  -> Subsidiaries
    -> Departments
      -> Users / roles / permissions

Client Account
  -> Contacts
  -> Relationships / notes / interactions
  -> Leads
  -> Opportunities
  -> Proposals
  -> Deals / Contracts
  -> Projects
    -> Milestones
    -> Tasks / Kanban
    -> Time logs
    -> Meetings
    -> Documents
    -> Support tickets
  -> Account health
  -> Next opportunity
```

## Target domains

- People: users, profiles, subsidiaries, departments, roles, permissions, HR, leave, attendance, payroll, performance, onboarding.
- Work: OKRs, portfolios, projects, milestones, tasks, Kanban, dependencies, workload, time, meetings.
- CRM: accounts, contacts, relationship intelligence, notes, interactions, account health, follow-ups.
- Business Development: leads, opportunities, pipeline, proposals, deals, targets, forecasts.
- Documents/DAM: folders, files, versions, metadata, permissions, links to business records.
- Communication: messaging, notifications, browser/mobile/desktop push, email, SMS, calendars.
- Intelligence: Meeting Studio, client briefings, opportunity analysis, project intelligence, executive summaries.
- Governance: audit logs, permissions, privacy controls, retention, integration logs.

## Target API principle

Existing `/api/entities` remains a compatibility layer.

New production work should use `/api/v1`:

```text
/api/v1/auth
/api/v1/organisation
/api/v1/users
/api/v1/work
/api/v1/crm
/api/v1/business-development
/api/v1/documents
/api/v1/notifications
/api/v1/integrations
/api/v1/ai
/api/v1/audit
```

Every route should follow:

```text
authenticate -> authorize -> validate -> service -> repository -> audit -> notify -> respond
```

## Target client strategy

- Web: React/Vite.
- Android/iOS: Capacitor over the same React app.
- Desktop: Tauri over the same React app.
- All clients use the same API.
- Business rules live server-side.

## Target deployment path

- Local development: local JSON or local Postgres.
- Office pilot: Netlify + Neon/Postgres + browser push.
- Production web: Postgres + object storage + real email + stronger auth.
- Android/iOS/Desktop: same API plus platform-specific adapters.

## Target navigation

The current sidebar should evolve into permission-aware areas:

- Home / My Day.
- Work.
- CRM / Customers.
- Business Development.
- People.
- Operations.
- Company.
- Documents.
- Insights.
- Integrations.
- Settings.

## Target data principle

No static dashboards. Every visible metric, project status, client relationship, notification, and AI answer must be explainable from the data model.

## Target migration principle

Move one domain at a time from compatibility storage into first-class relational services while keeping the office pilot working.
