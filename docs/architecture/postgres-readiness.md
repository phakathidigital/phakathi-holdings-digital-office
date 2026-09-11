# Phakathi Flow PostgreSQL readiness

Status: production foundation in progress.

This document audits the current database/runtime implementation after the platform foundation commits. The goal is to prove what is already production-ready, what is still compatibility storage, and what must be completed before Android/iOS/Desktop packaging.

## Runtime storage modes

Phakathi Flow currently supports three modes:

- `local-json`: development/office pilot data in `.local-data/db.json`.
- `netlify-blobs`: pilot hosted compatibility storage for Netlify.
- `postgres`: production mode using Prisma with PostgreSQL.

In Postgres mode the app still uses a compatibility layer for many existing UI entities. The compatibility layer stores records in `entity_records` and app-level state in `app_state`. Production relational tables already exist for the main business graph, but not every route writes exclusively to those relational tables yet.

## Relational entities supported in PostgreSQL

The Prisma schema includes relational production tables for:

- Organisation, Subsidiary, Department
- User, UserProfile, Role, Permission, RolePermission, UserRole
- Session, RefreshToken
- PasswordResetToken, EmailVerificationToken, MfaCredential
- AuditLog
- ClientAccount, ClientContact, contact preferences, important dates, interests, notes, interactions, activities, health snapshots
- Lead, LeadSource, OpportunityStage, Opportunity, OpportunityActivity
- Proposal, Deal, DealProductService, SalesForecast, SalesTarget, Contract
- Project, ProjectClientRelationship, Task, Milestone, TimeLog, Meeting, MeetingParticipant
- Document, DocumentClientRelationship, SupportTicket
- Notification, PushSubscription, NotificationDelivery
- Integration, IntegrationCredential, IntegrationSyncLog, WebhookEvent
- EntityRecord and AppState compatibility storage

## Entities still compatibility-only

These app entities still primarily use the generic entity compatibility store unless/until they are promoted to dedicated relational services:

- HR operational entities such as LeaveRequest, HRDocument, OnboardingRecord, PerformanceReview, KPI, PeerFeedback, Payslip, BenefitsEnrollment
- Office operations entities such as Asset, Booking, Resource, TicketComment, CompanyFeedPost, Announcement, Channel, Message
- DAM-specific compatibility entities such as DocFolder, KnowledgeBaseDocument, DAMComplianceRule
- Legacy MeetingStudio records, because the existing UI stores rich AI processing output in the compatibility record format
- Some notification preferences and browser UI state held in generic records

## APIs using production service layers

- `/api/v1/work`
- `/api/v1/crm`
- `/api/v1/business-development`
- `/api/v1/organisations`, `/api/v1/subsidiaries`, `/api/v1/departments`, `/api/v1/users`
- `/api/v1/platform/health`
- `/api/auth` and `/api/v1/auth` for password auth, refresh, logout, reset and verification flows
- `/api/integrations/status`, `/api/integrations/ai/status`, `/api/integrations/platform-readiness`
- `/api/analytics/overview`

## APIs still using compatibility storage

- `/api/entities/:entityName`
- README-style route aliases that forward to `/api/entities`
- Some upload metadata and queued email/SMS records
- Local notification scheduler records

This is acceptable for the current transition only if `PHAKATHI_STORAGE=postgres` is used in production so compatibility records are still stored durably in PostgreSQL (`entity_records` and `app_state`) instead of local files.

## Migration gaps

- Promote HR, DAM, notification preferences and office operations from generic `EntityRecord` into relational tables when those domains become production-critical.
- Persist auth sessions directly through relational services rather than compatibility `app_state` if high-scale concurrent access becomes a requirement.
- Connect the provider-neutral email abstraction to a real SMTP/Resend provider before relying on password-reset delivery in production.
- Connect S3-compatible object storage before selecting `STORAGE_PROVIDER=s3`.
- Add provider-specific backup automation after the hosting/database provider is final.

## Data consistency risks

- Compatibility writes replace per-entity record sets; concurrent heavy writes should move to domain-specific relational services.
- Existing seeded records are idempotent but should not be treated as production master data forever.
- Importing from `.local-data/db.json` preserves compatibility records and selected relational records, but relationship warnings must be reviewed after each dry-run.
- Changing VAPID keys can require users to resubscribe devices.

## Required production posture

- Use `PHAKATHI_STORAGE=postgres`.
- Set `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `CORS_ORIGINS`, and a real `APP_PUBLIC_URL`.
- Run `npm run db:migrate:deploy`, `npm run db:seed`, `npm run db:check`, `npm test`, and `npm run build`.
- If a database is available in the environment, run `npm run test:postgres`.

## Current conclusion

PostgreSQL is ready as the authoritative production persistence layer for the platform foundation, provided the production deployment uses `PHAKATHI_STORAGE=postgres`. Some existing modules intentionally remain on the compatibility table during this stabilization phase so current functionality is preserved while the backend evolves safely.
