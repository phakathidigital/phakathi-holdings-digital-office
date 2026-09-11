# Phakathi Flow Database Architecture

Phase: 0 database audit only.

## Current storage modes

The backend supports:

- `local-json`: development and fallback storage in `.local-data/db.json`.
- `netlify-blobs`: pilot-style hosted object/key-value storage.
- `postgres`: Prisma-backed PostgreSQL production storage.

This is useful for migration, but production should standardise on PostgreSQL plus object storage.

## Current Prisma foundation

The current Prisma schema already contains first-class models for:

- Organisation structure: `Organisation`, `Subsidiary`, `Department`.
- Identity/security: `User`, `UserProfile`, `Role`, `Permission`, `RolePermission`, `UserRole`, `Session`, `RefreshToken`, `AuditLog`.
- CRM: `ClientAccount`, `ClientContact`, `ContactRelationship`, `ClientContactPreference`, `ClientImportantDate`, `ClientInterest`, `ClientNote`, `ClientInteraction`, `ClientActivity`, `ClientHealthSnapshot`.
- Business development: `Lead`, `LeadSource`, `OpportunityStage`, `Opportunity`, `OpportunityActivity`, `Proposal`, `Deal`, `DealProductService`, `SalesForecast`, `SalesTarget`, `Contract`.
- Work: `Project`, `ProjectClientRelationship`, `Task`, `Milestone`, `TimeLog`, `Meeting`, `MeetingParticipant`.
- Documents/support/notifications/integrations: `Document`, `DocumentClientRelationship`, `SupportTicket`, `Notification`, `PushSubscription`, `NotificationDelivery`, `Integration`, `IntegrationCredential`, `IntegrationSyncLog`, `WebhookEvent`.
- Compatibility: `EntityRecord`, `AppState`.

There is a production foundation migration under `backend/prisma/migrations`.

## Current compatibility entity layer

`backend/prisma/entities` contains JSONC schemas for existing app entities such as projects, tasks, milestones, portfolios, OKRs, time logs, Meeting Studio, meeting notes, users, profiles, notifications, push subscriptions, HR, payroll, performance, tickets, assets, expenses, bookings, documents, DAM, Sage, Google Drive, company feed, and recognition records.

This layer is still important because many frontend pages depend on it.

## Main database gap

The schema is ahead of the application. CRM and business-development production models exist, but the app does not yet expose them through first-class services, APIs, and pages. Existing pages mostly cover office/work/HR operations, not full external relationship management.

## Required database changes before production

1. Confirm the Prisma schema against actual business workflows.
2. Add missing indexes for common filters: subsidiary, owner, assignee, status, due date, client, opportunity, created/updated dates.
3. Add unique constraints for important identity and integration records.
4. Decide which compatibility entities are temporary and map each one to a Prisma model or retained JSON field.
5. Add migration scripts for `.local-data/db.json` into PostgreSQL.
6. Add seed scripts for realistic office data, roles, subsidiaries, CRM stages, opportunity stages, and notification preferences.
7. Add backup and restore runbooks.
8. Add smoke tests that verify CRUD and relationship rollups.

## Data relationship priorities

The highest-priority connected relationships are:

```text
Goal
  -> Portfolio
  -> Project
  -> Milestone
  -> Task
  -> TimeLog
  -> Meeting action item

ClientAccount
  -> Contact
  -> Lead
  -> Opportunity
  -> Proposal
  -> Deal/Contract
  -> Project
  -> Support/Document/Interaction
```

## Migration risk

The most important migration risk is having two sources of truth: compatibility entity records and Prisma relational records. Until migration is complete, writes can diverge unless compatibility writes are carefully mapped or retired.

## Recommended database next step

Run a focused PostgreSQL production-foundation pass:

- Validate migrations on a fresh database.
- Run seed.
- Import local data.
- Run smoke tests.
- Confirm the app can operate with `PHAKATHI_STORAGE=postgres`.
- Document every entity that still falls back to compatibility storage.
