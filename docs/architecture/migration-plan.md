# Phakathi Flow Migration Plan

Phase: 0 migration plan only.

## Migration principle

Do not redesign the app. Preserve the existing user experience while moving data, permissions, and workflows behind production-grade APIs and PostgreSQL.

The safest migration path is:

```text
Audit
  -> PostgreSQL proof
  -> v1 domain APIs
  -> frontend migration
  -> security hardening
  -> integrations
  -> native packaging
```

## Phase 0: audit

Status: this documentation set.

Outputs:

- Current state.
- Target architecture.
- Database architecture.
- API architecture.
- Integration architecture.
- Mobile/desktop architecture.
- Migration plan.

No application functionality should be changed in Phase 0.

## Phase 1: production database foundation

Goal: prove PostgreSQL can be the source of truth.

Tasks:

- Validate Prisma migrations on a fresh database.
- Run seed scripts.
- Run local-data import tooling.
- Add smoke tests for auth, users, work graph, notifications, CRM seed, and integration seed.
- Document the exact environment variables for local, Netlify, and production.
- Confirm `PHAKATHI_STORAGE=postgres` works without local JSON dependency for the chosen pilot flows.

Approval required before starting.

## Phase 2: connected work workflow

Goal: finish the work operating system.

Tasks:

- Complete `/api/v1/work` coverage.
- Remove remaining compatibility writes from work pages.
- Confirm Goal -> Portfolio -> Project -> Task -> Kanban -> TimeLog -> Meeting action item rollups.
- Add permissions and audit logs for work writes.

## Phase 3: CRM and business development

Goal: activate the relationship-management side of the schema.

Tasks:

- Build `/api/v1/crm`.
- Build `/api/v1/business-development`.
- Add pages for accounts, contacts, leads, pipeline, opportunities, proposals, deals, contracts, interactions, and account health.
- Link projects/documents/support tickets to client accounts.

## Phase 4: people, HR, and permissions

Goal: make internal office use safe for real employees.

Tasks:

- Harden role-based permissions.
- Add password reset and email verification.
- Add HR/performance privacy rules.
- Add stronger audit logging.
- Add admin user/device management.

## Phase 5: notifications and scheduled jobs

Goal: reliable office notifications.

Tasks:

- Use deployed scheduler against PostgreSQL.
- Stabilise browser push.
- Add retry/failure reporting.
- Add email delivery.
- Prepare native push providers for mobile/desktop.

## Phase 6: integrations

Goal: real external systems.

Tasks:

- Sage read-only sync first.
- Google Drive DAM sync.
- Microsoft calendar/email.
- SMTP/SMS provider.
- Webhook logs and retries.

## Phase 7: quality and operations

Goal: production confidence.

Tasks:

- Add automated tests.
- Add browser QA scripts.
- Add monitoring and error reporting.
- Add backup/restore procedures.
- Add data-retention and privacy documentation.

## Phase 8: mobile and desktop packaging

Goal: prepare for app stores.

Tasks:

- Capacitor Android/iOS/Huawei.
- Tauri desktop.
- Native push adapters.
- Store icons/splash screens.
- Signing.
- App-store privacy and data-safety metadata.

## What should be done first

Phase 1 should be the next implementation phase after approval: prove the production database foundation and document every workflow that still depends on compatibility storage.
