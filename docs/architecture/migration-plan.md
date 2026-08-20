# Phakathi Flow migration plan

## Migration objective

Move Phakathi Flow from an office-pilot hybrid data layer to a production-ready Group Business Operating System while preserving existing functionality.

Do not rebuild the app. Do not remove working modules. Migrate gradually.

## Phase 0: Audit and architecture

Status: started.

Deliverables:

- Current-state architecture.
- Target architecture.
- Database architecture.
- API architecture.
- Integration architecture.
- Mobile/desktop architecture.
- Migration plan.

No destructive changes during this phase.

## Phase 1: Production database foundation

Status: in progress.

Goals:

- Add Prisma client and migration scripts.
- Expand Prisma schema for core relational entities.
- Add repository abstraction for local-json, Netlify Blobs, and Postgres.
- Create idempotent seed scripts.
- Add local JSON import tooling.

Implemented foundation pieces:

- Expanded Prisma schema for organisation, people, permissions, audit, CRM, business development, work linkage, notifications, and integrations.
- Initial generated SQL migration under `backend/prisma/migrations/`.
- `npm run db:generate`, `db:migrate`, `db:migrate:dev`, `db:seed`, `db:reset`, and `db:import-local` scripts.
- `PHAKATHI_STORAGE=postgres` runtime mode using `EntityRecord` compatibility storage so the existing app can run against PostgreSQL during migration.
- Production seed script for subsidiaries, departments, roles, permissions, users, opportunity stages, integration records, and existing work-system compatibility seed.
- Safe `.local-data/db.json` import script with `--dry-run`.

Required scripts:

```bash
npm run db:migrate
npm run db:seed
npm run db:reset
npm run db:import-local
```

Do not delete `.local-data/db.json`.

## Phase 2: Authentication and security hardening

Goals:

- Add refresh tokens.
- Add session/device management.
- Add password reset.
- Add email verification readiness.
- Add MFA readiness.
- Add role/permission tables.
- Add permission middleware.
- Add audit logging for auth and sensitive operations.

Existing seeded employees must continue working.

## Phase 3: CRM foundation

Goals:

- Add CRM Hub navigation.
- Add ClientAccount.
- Add ClientContact.
- Add ClientNote.
- Add ClientInteraction.
- Add ClientActivity.
- Add account owner/subsidiary ownership fields.
- Add permission-aware list/detail APIs.

No static demo CRM data. Seed only approved realistic records when the business provides them.

## Phase 4: Client intelligence and Account 360

Goals:

- Add Account 360 page.
- Add optional relationship intelligence fields.
- Add important dates/reminders.
- Add visibility permissions.
- Add audit logs for private relationship fields.
- Add explainable client health scoring.

## Phase 5: Business development

Goals:

- Add leads.
- Add lead sources.
- Add opportunities.
- Add owners, values, probabilities, expected close dates.
- Add sales activities/follow-ups.

## Phase 6: Sales pipeline, proposals, and deals

Goals:

- Reuse Kanban-style architecture for opportunity pipeline.
- Add proposal tracking.
- Add won/lost handling.
- Add weighted pipeline and forecast calculations.
- Add create-project-from-opportunity flow.

## Phase 7: CRM to project linkage

Goals:

- Add CRM fields to Project.
- Link projects to accounts, contacts, opportunities, contracts, account managers, and subsidiaries.
- Show client information in Project Details.
- Feed project events back to Account 360 timeline.

## Phase 8: Unified activity timeline

Goals:

- Aggregate meetings, emails, calls, notes, tasks, projects, documents, proposals, opportunities, contracts, invoices where available, support tickets, and status changes.
- Avoid duplicating source records.
- Add timeline filters and permissions.

## Phase 9: Integrations

Goals:

- Add Integration Manager.
- Add Microsoft 365/Outlook configuration.
- Harden Google Drive and Sage status/sync.
- Wire real email provider.
- Add sync logs and webhook verification.

## Phase 10: AI business intelligence

Goals:

- Extend existing AI service.
- Add client briefings.
- Add opportunity analysis.
- Add project intelligence.
- Add executive summaries.
- Ensure all answers use real, permission-filtered data.

## Phase 11: Analytics and executive dashboard

Goals:

- Add CRM and business development KPIs.
- Extend executive dashboard with sales, client health, projects, risks, employee performance, and subsidiary performance.
- Ensure metrics are explainable and data-backed.

## Phase 12: Mobile readiness

Goals:

- Mobile responsive audit/fixes.
- Platform abstraction layer.
- Capacitor preparation.
- Mobile push readiness.

## Phase 13: Desktop readiness

Goals:

- Tauri preparation.
- Native notification/file/deep-link adapters.
- Desktop packaging documentation.

## Phase 14: Testing and security hardening

Goals:

- Unit tests.
- API tests.
- Integration tests.
- Auth/permission tests.
- CRM/sales/project tests.
- Notification tests.
- Security audit.
- Build and browser QA.

## Phase 15: Deployment documentation

Goals:

- Netlify deployment docs.
- Postgres deployment docs.
- Render/Railway/Fly/VPS/Docker docs.
- Environment variable reference.
- Backup/restore docs.
- Office pilot runbook.

## Immediate migration cleanup list

- Remove or convert `test@admin.com` before real office pilot.
- Replace `/api/functions/:functionName` placeholder success with real handlers or explicit not-configured responses.
- Decide whether `src/pages.config.js` should be deleted or regenerated.
- Move hard-coded department lists into canonical organisation configuration.
- Add `/api/v1` alongside current compatibility routes.
- Add audit log and granular permission foundations before CRM relationship intelligence.

## Verification after every phase

Run:

```bash
npm test
npm run build
```

If `npm test` is not yet defined, record that as a testing gap and add tests in Phase 14.
