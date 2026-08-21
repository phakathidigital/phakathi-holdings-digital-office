# PostgreSQL production database setup

Phakathi Flow now has a Prisma/PostgreSQL production foundation while preserving the current local JSON and Netlify Blobs pilot storage.

## Storage modes

Use `PHAKATHI_STORAGE` to choose the runtime data store:

- `local-json` — local `.local-data/db.json` development mode.
- `netlify-blobs` — Netlify Blobs hosted pilot mode.
- `postgres` — production PostgreSQL mode through Prisma.

Do not set `PHAKATHI_STORAGE=postgres` until a migrated PostgreSQL database is available.

## Required variables

```bash
PHAKATHI_STORAGE=postgres
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=...
JWT_REFRESH_SECRET=...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:notifications@phakathiholdings.local
```

Keep real values in the deployment provider environment, not in Git.

## Provisioned Neon database

The office-pilot Neon database project has been created:

- Neon project name: `phakathi-flow-production`
- Neon project ID: `jolly-sun-64598141`
- Primary branch: `main`
- Branch ID: `br-flat-river-axxvmhcs`
- Default database: `neondb`

The actual connection string contains a password and must remain only in local `.env.local` or Netlify environment variables.

## Commands

Generate Prisma client:

```bash
npm run db:generate
```

Apply production migrations:

```bash
npm run db:migrate
```

Seed the production foundation:

```bash
npm run db:seed
```

Verify the production foundation:

```bash
npm run db:smoke
```

Import current local JSON records into PostgreSQL compatibility storage:

```bash
npm run db:import-local
```

Dry-run the import summary:

```bash
npm run db:import-local -- --dry-run
```

## Safe migration order

1. Back up `.local-data/db.json`.
2. Provision a PostgreSQL database.
3. Set `DATABASE_URL` locally or in the deployment provider.
4. Run `npm run db:migrate`.
5. Run `npm run db:seed`.
6. Run `npm run db:import-local -- --dry-run`.
7. Run `npm run db:import-local`.
8. Run `npm run db:smoke`.
9. Start the app with `PHAKATHI_STORAGE=postgres`.
10. Verify auth, users, projects, Kanban, meetings, notifications, and uploads.

## Netlify/GitHub deployment

The Netlify build command is `npm run deploy:build`.

When `PHAKATHI_STORAGE=postgres`, the build wrapper runs:

1. `npm run db:generate`
2. `npm run db:migrate`
3. `npm run db:seed`
4. `npm run build`

When `PHAKATHI_STORAGE` is not `postgres`, the wrapper skips database migration and builds the current app normally.

Set secrets in Netlify project environment variables, not in `netlify.toml`:

```bash
PHAKATHI_STORAGE=postgres
DATABASE_URL=...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
SCHEDULED_NOTIFICATION_SECRET=...
```

Current Netlify project:

- Site name: `phakathi-holdings-digital-office`
- Site ID: `0ede8910-be38-4b0f-b13a-50e0991997a1`
- Production URL: `https://phakathi-holdings-digital-office.netlify.app`

After adding the secret variables in Netlify, trigger a GitHub deploy from `main`.

## Current limitation

The new relational tables are available for production CRM/business-development work, while the existing app can continue using the compatibility `EntityRecord` bridge. Future CRM, sales, and Account 360 modules should use the first-class relational tables directly.
