# Phakathi Flow target architecture

## Product target

Phakathi Flow should evolve into the Phakathi Holdings Group Business Operating System: a central intelligence and workflow layer that connects people, work, customers, growth, communications, governance, documents, and integrations.

It must extend the current app rather than replacing it.

## Core principle

CRM becomes the relationship layer:

```text
Client Account
  ↓
Contacts
  ↓
Relationships
  ↓
Leads
  ↓
Opportunities
  ↓
Proposals
  ↓
Deals
  ↓
Projects
  ↓
Tasks / Kanban
  ↓
Meetings
  ↓
Documents
  ↓
Delivery
  ↓
Client Health
  ↓
Next Opportunity
```

The existing project, Kanban, Meeting Studio, DAM, notification, and AI systems should be reused and extended.

## Target logical domains

- People: users, profiles, subsidiaries, departments, HR, leave, attendance, payroll, performance, recognition, onboarding.
- Work: OKRs, portfolios, projects, milestones, tasks, Kanban, dependencies, workload, time tracking, meetings, documents.
- Customers: CRM hub, accounts, contacts, relationship intelligence, notes, interactions, timeline, health.
- Growth: leads, opportunities, sales pipeline, proposals, deals, forecasting, win/loss tracking.
- Intelligence: AI assistant, meeting AI, client briefings, opportunity analysis, project intelligence, executive summaries.
- Communication: messaging, notifications, browser push, email, calendar, Microsoft 365/Outlook, Google services.
- Governance: roles, permissions, audit logs, security, retention, privacy controls.
- Integrations: integration manager, Sage, Google Drive, Microsoft 365/Outlook, APIs, webhooks.

## Target runtime architecture

```text
React/Vite web app
        ↓
Versioned API (/api/v1)
        ↓
Node.js service layer
        ↓
Prisma
        ↓
PostgreSQL

Object storage:
documents, images, PDFs, DAM assets, attachments

Schedulers/workers:
notifications, integration syncs, reminders, reports
```

## Deployment target

Phakathi Flow should support local development, Netlify web/functions/scheduled functions, a standalone Node API on common hosting platforms, PostgreSQL as the production system of record, object storage for files, and future Capacitor mobile apps/Tauri desktop apps using the same API.

## Navigation target

The current sidebar should be extended, not redesigned from scratch:

- My Day
- Dashboard
- Work
- Customers
- Business Development
- People
- Documents
- Communication
- Analytics
- AI Assistant
- Executive Dashboard
- Settings

Modules must be permission-aware. Users should only see features they are allowed to access.

## Data principle

Do not create static dashboards to make the app look complete. Every CRM, sales, project, notification, AI, and analytics feature must use the actual data layer. If an external integration is not configured, the UI must clearly say "Integration not configured."

## Compatibility principle

The current generic entity API and JSON/Netlify Blobs persistence can remain as transitional compatibility infrastructure. New production capabilities should use first-class services and relational models while existing pages continue working.
