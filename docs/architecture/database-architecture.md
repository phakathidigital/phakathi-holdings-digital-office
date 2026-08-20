# Phakathi Flow database architecture

## Current state

Current persistence is hybrid:

- Local development uses `.local-data/db.json`.
- Netlify deployment can use Netlify Blobs.
- `backend/prisma/schema.prisma` exists but only defines a small relational foundation: `User`, `EntityRecord`, `PushSubscription`, and `NotificationDelivery`.

Most current business records are generic JSON arrays keyed by entity name. This preserves migration compatibility and allowed quick local operation, but it is not sufficient for production CRM, sales, permissions, audit, reporting, or relationship intelligence.

## Target production source of truth

PostgreSQL should become the authoritative production database.

```text
Node API
  ↓
Service/repository layer
  ↓
Prisma
  ↓
PostgreSQL
```

Object storage should hold uploaded documents, PDFs, images, DAM assets, client files, project files, proposal files, and contracts.

## Transitional storage policy

Keep three storage modes during migration:

1. `local-json` for local prototype compatibility.
2. `netlify-blobs` for hosted pilot persistence.
3. `postgres` for production.

The API should select the backing repository based on environment configuration, but business logic should not be hard-coded to any one storage provider.

## Required relational model

Minimum first-class tables:

- Organisation, Subsidiary, Department, User, UserProfile, Role, Permission, RolePermission, UserRole, Session, RefreshToken, AuditLog.
- ClientAccount, ClientContact, ContactRelationship, ClientContactPreference, ClientImportantDate, ClientInterest, ClientNote, ClientInteraction, ClientActivity, ClientHealthSnapshot.
- Lead, LeadSource, Opportunity, OpportunityStage, OpportunityActivity, Proposal, Deal, DealProductService, SalesForecast, SalesTarget, Contract.
- Portfolio, OKR, Project, ProjectClientRelationship, Milestone, Task, TaskDependency, TimeLog, Meeting, MeetingParticipant, MeetingActionItem.
- Document, DocumentFolder, DocumentClientRelationship, DAMComplianceRule, SupportTicket, TicketComment.
- Notification, NotificationDelivery, PushSubscription, EmailActivity, CalendarEvent, Message, Channel.
- Integration, IntegrationCredential, IntegrationSyncLog, WebhookEvent.

## Key relationship requirements

Projects must support `client_account_id`, `primary_contact_id`, `opportunity_id`, `contract_id`, `account_manager_id`, `subsidiary_id`, `project_value`, `client_status`, `expected_start_date`, and `expected_end_date`.

Activities must support `client_account_id`, `client_contact_id`, `user_id`, `activity_type`, `subject`, `description`, `occurred_at`, `related_entity_type`, `related_entity_id`, `source`, and `metadata`.

Relationship-intelligence fields must be optional, permission-controlled, and audited.

## Integrity requirements

Production tables should use UUID primary keys, foreign keys, timestamps, soft-delete where appropriate, audit fields, indexes, constraints, and JSON fields only for flexible metadata rather than core relationships.

## Migration scripts required

Add package scripts in the production database phase:

```bash
npm run db:migrate
npm run db:seed
npm run db:reset
npm run db:import-local
```

`db:import-local` must import `.local-data/db.json` safely without deleting existing production data unless explicitly requested.

## Data cleanup requirements

Before real office use:

- Remove or convert `test@admin.com` from local pilot data.
- Ensure all seeded employees use real approved work emails.
- Keep password hashes and push subscription keys out of frontend responses.
- Migrate seeded July 2026 workflow data into proper relational seed files.

## Recommended database phase sequence

1. Add Prisma client dependency and migration scripts.
2. Expand schema with organisation, people, roles, permissions, audit, CRM, sales, work, notifications, and integration models.
3. Build repository abstraction so current generic entity operations continue working.
4. Add idempotent seeds for staff, subsidiaries, roles, permissions, stages, and July 2026 workflow records.
5. Add `.local-data/db.json` import tooling.
6. Add API tests against a test database.
