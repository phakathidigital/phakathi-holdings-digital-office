# Phakathi Flow API Architecture

Phase: 0 API audit only.

## Current API shape

The API is currently Express-based and mounted by `backend/src/index.js`.

Current route families:

- `/api/health`
- `/api/auth`
- `/api/entities`
- `/api/integrations`
- `/api/functions`
- `/api/analytics`
- `/api/push`
- `/api/v1`

There are also resource aliases such as `/api/projects`, `/api/tasks`, `/api/notifications`, and `/api/meeting-studio`. These aliases currently route to the generic entity API.

## Current v1 routes

`/api/v1` currently includes health, organisation, and work.

The work API is the best model for the future because it starts connecting the work system as one graph instead of one page at a time.

## Current frontend API clients

`src/api` contains `apiClient.js`, `entities.js`, and `integrations.js`.

The application uses both `api.work.*` and `api.entities.*`. Work pages are moving in the right direction, but many other pages still use compatibility entity methods directly.

## What can be reused

- Auth routes and token flow as a base.
- `/api/v1/work` and `workService`.
- Organisation service.
- Push routes and delivery service.
- Meeting Studio integration route.
- Analytics route concepts.
- Generic entity API as temporary migration bridge.

## What is duplicated

- Resource aliases look like production REST routes but still call compatibility entities.
- Project/task/meeting/notification models exist in both entity schemas and Prisma.
- Some frontend pages calculate relationships and rollups that should eventually live in services.

## Missing first-class APIs

Required production APIs still missing or incomplete:

- `/api/v1/crm`
- `/api/v1/business-development`
- `/api/v1/people`
- `/api/v1/documents`
- `/api/v1/support`
- `/api/v1/assets`
- `/api/v1/expenses`
- `/api/v1/notifications`
- `/api/v1/integrations`
- `/api/v1/search`
- `/api/v1/reports`
- `/api/v1/audit`

## API standards needed

Before public or app-store use, the API should standardise:

- Request validation with schemas.
- Error response format.
- Pagination, filtering, sorting, and search.
- Permission checks per route/action.
- Audit logging for sensitive writes.
- Rate limiting for auth and public endpoints.
- File upload validation and scanning strategy.
- Stable API versioning.

## Security observations

- `cors({ origin: true, credentials: true })` is permissive for production and should be restricted by environment.
- Generic entity routes are powerful and need tighter per-entity permissions before broad public use.
- Uploads and integration credentials need stronger validation, encryption, and retention rules.
- Secrets must remain server-only; frontend should only receive public configuration such as `VITE_API_BASE_URL` and VAPID public key.

## Recommended API next step

Complete the `/api/v1/work` migration first, then add `/api/v1/crm` and `/api/v1/business-development`. Do not build new major features on the compatibility entity API unless they are explicitly temporary.
