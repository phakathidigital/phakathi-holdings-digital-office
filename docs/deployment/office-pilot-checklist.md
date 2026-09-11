# Office pilot checklist

Use this checklist before allowing real office employees to rely on Phakathi Flow for daily work.

## Environment

- [ ] `npm run prod:env-check` passes in the deployed environment.
- [ ] `PHAKATHI_STORAGE=postgres`.
- [ ] `DATABASE_URL` points to the intended pilot database.
- [ ] `APP_PUBLIC_URL` is the actual public app URL.
- [ ] `CORS_ORIGINS` includes only approved production/development origins.
- [ ] Secrets are configured in the hosting provider, not committed to Git.

## Database and backup

- [ ] PostgreSQL automated backups are enabled.
- [ ] A manual backup/snapshot is created before pilot launch.
- [ ] Restore procedure is documented in `docs/deployment/backup-recovery.md`.
- [ ] `npm run db:migrate:deploy` passes.
- [ ] `npm run db:seed` is run only if required.
- [ ] `npm run test:postgres` passes.
- [ ] No destructive reset command is used against pilot data.

## Authentication

- [ ] Admin user verified.
- [ ] Staff seeded/claimable accounts verified.
- [ ] New registration policy agreed.
- [ ] Login tested.
- [ ] Logout tested.
- [ ] Refresh-token rotation tested.
- [ ] Password reset email tested.
- [ ] Email verification tested.
- [ ] Password hashes and tokens do not appear in browser/API responses.

## Notifications

- [ ] Stable VAPID keys configured.
- [ ] Browser permission prompt tested.
- [ ] Push subscription creation tested.
- [ ] Push delivery tested when app tab is not focused.
- [ ] Scheduled reminders tested.
- [ ] Birthday reminder tested.
- [ ] Holiday reminder tested.
- [ ] DAM reminder tested.
- [ ] Duplicate notification prevention checked.

## Email

- [ ] Email provider configured.
- [ ] Sender address verified.
- [ ] Password reset email delivered.
- [ ] Verification email delivered.
- [ ] Links use the public production URL.
- [ ] Development console fallback is not used in production.

## Storage and documents

- [ ] Production storage provider selected.
- [ ] Image upload tested.
- [ ] PDF upload tested.
- [ ] Office document upload tested.
- [ ] Download/view tested.
- [ ] Private business documents cannot be accessed by guessing a URL.
- [ ] CRM document linkage tested.
- [ ] Project document linkage tested.

## Business workflow

- [ ] CRM account creation tested.
- [ ] Contact creation tested.
- [ ] Interaction/note creation tested.
- [ ] Opportunity creation tested.
- [ ] Pipeline movement tested.
- [ ] Proposal creation tested.
- [ ] Deal creation tested.
- [ ] Won opportunity creates a linked project.
- [ ] Duplicate project prevention verified.
- [ ] Project/task/time-log workflow tested.
- [ ] Meeting action item sync tested.
- [ ] Account 360 verified.
- [ ] Unified Client Activity Timeline verified.

## Permissions

- [ ] Standard employee access tested.
- [ ] Sales/BD access tested.
- [ ] Project Manager access tested.
- [ ] HR access tested.
- [ ] Management/Executive access tested.
- [ ] Subsidiary data boundaries tested on backend APIs.

## Frontend and PWA

- [ ] Deployed frontend opens.
- [ ] Direct route refresh works.
- [ ] Lazy-loaded routes open.
- [ ] Authenticated routes work after refresh.
- [ ] PWA manifest loads.
- [ ] Service worker registers over HTTPS.
- [ ] Mobile/responsive layouts checked for pilot devices.

## Monitoring and rollback

- [ ] Deployed logs reviewed.
- [ ] Logs do not include passwords, JWTs, refresh tokens, API keys or database URLs.
- [ ] Rollback commit/tag is known.
- [ ] Database restore plan is known.
- [ ] One person owns pilot support escalation.
