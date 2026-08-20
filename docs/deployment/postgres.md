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
8. Start the app with `PHAKATHI_STORAGE=postgres`.
9. Verify auth, users, projects, Kanban, meetings, notifications, and uploads.

## Current limitation

The new relational tables are available for production CRM/business-development work, while the existing app can continue using the compatibility `EntityRecord` bridge. Future CRM, sales, and Account 360 modules should use the first-class relational tables directly.
