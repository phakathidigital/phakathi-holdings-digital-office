# Phakathi Flow migration plan

## Objective

Connect the existing Phakathi Flow app into a production business operating system without breaking the office pilot.

The next work is not to create more disconnected pages. The next work is to connect data, permissions, relationships, and workflows.

## Phase 0: Audit and architecture

Status: current phase.

Deliverables:

- `docs/architecture/current-state.md`
- `docs/architecture/target-architecture.md`
- `docs/architecture/database-architecture.md`
- `docs/architecture/api-architecture.md`
- `docs/architecture/integration-architecture.md`
- `docs/architecture/mobile-desktop-architecture.md`
- `docs/architecture/migration-plan.md`

No Phase 1+ implementation before this audit is reviewed.

## Phase 1: Production data foundation connection

Tasks:

1. Add `/api/v1` skeleton.
2. Add shared validation/error helpers.
3. Add permission middleware.
4. Add audit logging service.
5. Build organisation/subsidiary/department/user services.
6. Backfill relational IDs.
7. Keep `/api/entities` working.

Acceptance:

- Existing login works.
- Subsidiary/profile setup works.
- Existing work data appears.
- Relational IDs exist alongside compatibility fields.

## Phase 2: Work-system relational services

Tasks:

1. Add first-class Work/Project/Task services.
2. Move Project/Task/Milestone/TimeLog mutations into services.
3. Preserve task-derived progress.
4. Add TaskDependency.
5. Add MeetingActionItem.
6. Connect Meeting Studio output to real tasks.
7. Add project timeline.

Acceptance:

- Project progress cannot be faked.
- Kanban, projects, time logs, meetings, and reports roll up together.

## Phase 3: CRM foundation

Tasks:

1. CRM navigation.
2. ClientAccount list/detail.
3. ClientContact list/detail.
4. ClientNote.
5. ClientInteraction.
6. ClientActivity.
7. Account owner/subsidiary ownership.
8. Permission-aware access.

Acceptance:

- Users can manage accounts and contacts.
- Activities appear on account timeline.
- Data is relational.

## Phase 4: Account 360 and relationship intelligence

Tasks:

1. Account 360 page.
2. Relationship fields.
3. Preferences/interests/important dates.
4. Visibility controls.
5. Client health snapshots.
6. Audit logs for sensitive fields.

## Phase 5: Business development

Tasks:

1. Leads.
2. Lead sources.
3. Opportunity stages.
4. Opportunities.
5. Opportunity activities.
6. Pipeline board.
7. Follow-up reminders.

## Phase 6: Proposals, deals, contracts, forecasting

Tasks:

1. Proposal tracking.
2. Deals.
3. Deal products/services.
4. Contracts.
5. Sales targets.
6. Sales forecasts.
7. Won/lost flow.
8. Create project from won opportunity.

## Phase 7: Documents/DAM relational migration

Tasks:

1. DocumentFolder.
2. DocumentVersion.
3. FileAsset/Attachment.
4. Links to clients/projects/meetings/HR records.
5. Object storage for file bytes.
6. Document permissions.

## Phase 8: Integrations

Tasks:

1. Integration status API.
2. Integrations UI backed by Integration records.
3. Configured/not-configured states.
4. Email provider adapter.
5. Microsoft 365/Outlook foundation.
6. Google Drive hardening.
7. Sage hardening.
8. Webhook events and sync logs.

## Phase 9: Notifications production hardening

Tasks:

1. NotificationPreference.
2. Device/session model.
3. ScheduledNotificationRun.
4. Delivery retries.
5. Invalid subscription cleanup.
6. Native push preparation.

## Phase 10: AI business intelligence

Tasks:

1. Permission-aware AI data access.
2. Client briefing.
3. Opportunity analysis.
4. Project intelligence.
5. Executive summaries.
6. Source/trace metadata.

## Phase 11: Mobile readiness

Tasks:

1. Platform abstractions.
2. Responsive fixes.
3. Secure-token design.
4. Device/session handling.
5. Capacitor shell.
6. Mobile push strategy.

## Phase 12: Desktop readiness

Tasks:

1. Tauri shell.
2. Native notification adapter.
3. File/link adapters.
4. Desktop packaging docs.

## Phase 13: Testing/security/release hardening

Tasks:

1. Unit tests.
2. API tests.
3. Permission tests.
4. Migration tests.
5. Notification tests.
6. CRM/workflow tests.
7. Security scan.
8. Backup/restore tests.
9. Office pilot runbook.

## Immediate cleanup before Phase 1

- Remove smoke-test users from production.
- Move Netlify Git connection to the organisation repo.
- Keep both repos synchronized until Netlify is moved.
- Rotate any exposed secrets.
- Keep `.env.example` placeholder-only.
- Replace `/api/functions/:functionName` placeholder behavior.
- Add a test script or document test gap.

## Phase gate rule

Before moving phases:

- Existing app signs in.
- `/api/health` works.
- Work data still appears.
- Lint/build status is recorded.
- No secrets are committed.
