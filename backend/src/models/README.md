# Models

The README target architecture keeps database models under `backend/src/models`.

For the current local development backend, entity definitions are preserved as exported JSONC schemas in `backend/prisma/entities`, and the API persists records to `.local-data/db.json`.

When moving to production, replace this JSON-backed layer with Prisma models generated from `backend/prisma/schema.prisma`.
