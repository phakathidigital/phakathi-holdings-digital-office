# Phakathi Flow database architecture

## Current storage modes

```text
local-json     -> .local-data/db.json
netlify-blobs  -> transitional hosted pilot storage
postgres       -> Prisma/PostgreSQL production mode
```

Production should use `PHAKATHI_STORAGE=postgres`.

## Current Prisma foundation

The Prisma schema includes a broad foundation:

- Organisation, Subsidiary, Department.
- User, UserProfile, Role, Permission, RolePermission, UserRole.
- Session, RefreshToken, AuditLog.
- CRM: ClientAccount, ClientContact, relationships, preferences, important dates, interests, notes, interactions, activities, health snapshots.
- Business Development: Lead, LeadSource, OpportunityStage, Opportunity, OpportunityActivity, Proposal, Deal, DealProductService, SalesTarget, SalesForecast, Contract.
- Work: Project, ProjectClientRelationship, Task, Milestone, TimeLog, Meeting, MeetingParticipant.
- Documents: Document, DocumentClientRelationship.
- Notifications: Notification, PushSubscription, NotificationDelivery.
- Integrations: Integration, IntegrationCredential, IntegrationSyncLog, WebhookEvent.
- Compatibility: EntityRecord, AppState.

Existing migration:

```text
backend/prisma/migrations/20260820000000_production_foundation
```

## Current limitation

The running app mostly uses:

```text
UI -> /api/entities/:EntityName -> readDb/writeDb -> EntityRecord JSON
```

This is acceptable for migration compatibility, not final production architecture.

## Target database rule

Core production features must move to first-class relational tables. `EntityRecord` is a bridge, not the destination.

## Required migration sequence

1. Organisation/subsidiary/department/user relational backfill.
2. Roles, permissions, sessions, audit enforcement.
3. Work system relational migration.
4. CRM relational services.
5. Business-development relational services.
6. Documents/DAM metadata migration.
7. Notification/device/preference hardening.
8. Integration credential/sync/webhook hardening.

## Missing or incomplete tables

Still needed or needing completion:

- Portfolio.
- OKR.
- TaskDependency.
- MeetingActionItem.
- CalendarEvent.
- DocumentFolder.
- DocumentVersion.
- TicketComment.
- EmailActivity.
- SMSActivity.
- Device.
- NotificationPreference.
- ScheduledNotificationRun.
- FileAsset/Attachment.

## Data integrity requirements

- UUID primary keys.
- Foreign keys for real relationships.
- Soft-delete where history matters.
- Audit logs for sensitive changes.
- Indexes for dashboards, timelines, and subsidiary filters.
- JSON for metadata only, not core relationships.
- Idempotent seeds.
- Backup/restore plan.

## Verification

After database changes:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:smoke
npm run lint -- --quiet
npm run build
```
