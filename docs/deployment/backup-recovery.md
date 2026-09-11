# PostgreSQL backup and recovery

Phakathi Flow production data should be protected with provider-managed PostgreSQL backups plus periodic restore tests.

## Backup policy

- Enable automated daily backups on the selected PostgreSQL provider.
- Keep at least 7 daily backups for pilot use.
- Increase retention before storing public/external customer data.
- Export critical documents from object storage separately; PostgreSQL backups do not include binary object storage.

## Restore testing

At least monthly during pilot:

1. Restore the latest backup to a separate database.
2. Run `npm run db:migrate:deploy`.
3. Run `npm run test:postgres`.
4. Verify one seeded user, one CRM account, one project, one task, and notification records.

## Migration rollback strategy

- Prefer additive migrations.
- Do not use `prisma migrate reset` against production.
- For risky migrations, create a database backup immediately before deployment.
- Roll forward with a corrective migration when possible.
- If a restore is required, freeze writes, restore to a known-good backup, redeploy matching application code, then resume writes.

## Object storage recovery

- Keep object storage versioning or backups enabled where the provider supports it.
- Store document metadata in PostgreSQL with immutable storage keys.
- Audit document access and deletion for sensitive HR/CRM/DAM records.
