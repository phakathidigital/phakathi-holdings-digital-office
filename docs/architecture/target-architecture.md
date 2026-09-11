# Phakathi Flow Target Architecture

Phase: 0 target architecture definition only.

## Product target

Phakathi Flow should evolve into a group business operating system for Phakathi Holdings and its subsidiaries. It should connect internal office operations, project execution, people management, CRM, business development, meetings, documents, analytics, notifications, and integrations through one shared backend and one authoritative data model.

The target platform path is:

```text
React/Vite web
  -> Capacitor Android/iOS/Huawei
  -> Tauri desktop
  -> shared API
  -> PostgreSQL + object storage + scheduled jobs + integrations
```

The web app remains the primary client, but mobile and desktop clients should reuse the same business rules and APIs rather than duplicating logic.

## Non-negotiable production direction

PostgreSQL should be the authoritative production database. Local JSON and Netlify Blobs are useful for development and pilot fallback, but the final CRM/business system should not depend on them as the source of truth.

Documents and binary files should live in object storage. PostgreSQL should store metadata, ownership, access rules, audit history, and relationships.

## Core business domains

### Organisation and people

Organisation, subsidiaries, departments, users, profiles, roles, permissions, employee lifecycle, performance, and HR records.

### Work management

Goals/OKRs, portfolios, projects, milestones, tasks, Kanban state, Gantt dependencies, workload capacity, time logs, and meeting action items.

### CRM and relationship management

Client accounts, contacts, contact relationships, preferences, interests, notes, interactions, activities, health snapshots, and relationship-to-project links.

### Business development

Leads, lead sources, opportunities, opportunity stages, proposal records, deals, deal products/services, forecasts, sales targets, and contracts.

### Operations

Support tickets, assets, expenses, documents, rooms/resources, DAM, and compliance records.

### Communications and intelligence

Notifications, push subscriptions, delivery logs, Meeting Studio AI, AI Assistant, audit logs, and integration sync logs.

## Target client architecture

Frontend pages should stop owning business workflows directly. Pages should call domain APIs:

- `api.auth`
- `api.organisation`
- `api.work`
- `api.crm`
- `api.businessDevelopment`
- `api.people`
- `api.documents`
- `api.notifications`
- `api.integrations`
- `api.analytics`

The compatibility entity API can remain temporarily for migration, but it should not be the long-term public contract.

## Target backend architecture

The backend should be layered:

```text
HTTP routes
  -> request validation
  -> auth/context
  -> permission checks
  -> domain services
  -> Prisma repositories
  -> audit hooks
  -> notification hooks
  -> integration jobs
```

Every production write should validate input, check permissions, write through Prisma, record audit history where business-relevant, and trigger notifications or integration jobs through a queue-like service.

## Target deployment architecture

Office pilot:

- Netlify web/functions or local Express.
- PostgreSQL database.
- Stable VAPID keys.
- Real JWT secrets.
- Controlled users only.

Production web:

- Hosted web app.
- Hosted API/functions.
- Managed PostgreSQL.
- Object storage.
- Scheduled jobs.
- Monitoring and logs.
- Backup/restore.

Android/iOS/Huawei/Desktop:

- Capacitor for mobile builds.
- Tauri for desktop builds.
- Native notification adapters where required.
- Shared API and auth.
- Store-specific signing, privacy, and release processes.

## Target security posture

- Verified email and password reset.
- Refresh-token/session lifecycle.
- Role-based and subsidiary-aware permissions.
- Rate limiting.
- Secure upload validation.
- Audit log coverage.
- Secrets only in server runtime environments.
- Principle-of-least-privilege integration credentials.
- App-store privacy and data-safety documentation.

## What should be reused

- Existing React page structure and components.
- Existing work-management UI.
- Existing `/api/v1/work` direction.
- Existing Prisma schema as a strong first production draft.
- Existing scheduler and notification content logic.
- Existing Meeting Studio OpenAI/fallback design.
- Existing Phakathi brand assets and subsidiary constants.

## What should be replaced or retired

- Generic entity writes as the default backend contract.
- Local JSON as anything more than development/import tooling.
- Placeholder integration flows that appear connected but do not call real providers.
- Duplicated business logic in pages that should live in domain services.
