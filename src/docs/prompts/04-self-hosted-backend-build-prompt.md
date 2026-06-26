# Self-Hosted Backend Build Prompt

You are building a production-grade, self-hosted backend for the "Phakathi Flow" application — an employee experience, operations, and intelligence platform. The frontend (React 18 + Tailwind CSS + Vite) is already complete and uses the Base44 SDK interface. Your job is to build the backend from scratch following the architecture described in the project's README.md, then rewire the frontend API layer so the app runs entirely on your own infrastructure — no Base44 dependency.

## Reference
- The README.md file in the project root contains the full target architecture, file structure, Prisma schema examples, environment variables, and a frontend API client replacement pattern. Read it carefully before starting.
- The existing entity JSON schemas are in `src/entities/*.json` — these define the exact database shape. Every field name and type must be preserved.
- The existing `src/api/base44Client.js` is the SDK client you are replacing. Your new client must expose the exact same interface so no page or component code changes.

## Target Stack
- Runtime: Node.js 20+ with Express.js
- Database: PostgreSQL 16 with Prisma ORM
- Auth: JWT-based with refresh tokens (httpOnly cookies)
- File Storage: AWS S3 (or Cloudflare R2 / Supabase Storage)
- Email: Resend, SendGrid, or Nodemailer with SMTP
- AI/LLM: OpenAI API or Anthropic API via a proxy endpoint
- Realtime: WebSocket (Socket.io) for entity subscriptions and presence
- Background Jobs: BullMQ with Redis for scheduled automations
- Validation: Zod schemas mirroring the entity JSON schemas
- Logging: Pino (structured JSON logs)
- Containerisation: Docker + docker-compose

## Build Phases

### Phase 1 — Project Scaffolding

1. Create a `backend/` directory at the project root with this structure (from the README):
   ```
   backend/
   ├── src/
   │   ├── config/          # database.js, storage.js, email.js
   │   ├── middleware/      # auth.js, rbac.js, upload.js
   │   ├── models/          # Prisma models (or Sequelize)
   │   ├── routes/          # Express routes for every entity
   │   ├── services/        # emailService.js, storageService.js, aiService.js
   │   └── index.js         # Express app entry point
   ├── prisma/
   │   └── schema.prisma    # Complete schema for all 34 entities
   ├── .env
   ├── package.json
   └── README.md
   ```
2. Initialise `package.json` with dependencies: express, cors, helmet, @prisma/client, prisma, zod, pino, jsonwebtoken, bcryptjs, multer, bullmq, ioredis, socket.io, dotenv, express-rate-limit.
3. Create a `.env.example` with all required variables (from the README's "Backend .env" section):
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/phakathi_flow
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=7d
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_BUCKET_NAME=phakathi-flow-files
   AWS_REGION=af-south-1
   RESEND_API_KEY=re_your_resend_key
   FROM_EMAIL=no-reply@phakathiholdings.co.za
   OPENAI_API_KEY=sk-your_openai_key
   ```

### Phase 2 — Database Schema (Prisma)

1. Read every JSON schema in `src/entities/*.json` (34 entities).
2. Convert each to a Prisma model in `prisma/schema.prisma`. The README contains partial examples — complete ALL 34 models.
3. Rules:
   - Every model must include: `id` (UUID, default uuid()), `created_date` (DateTime, default now()), `updated_date` (DateTime, @updatedAt), `created_by_id` (String, optional — the user ID who created the record).
   - Preserve every field name and type exactly as in the JSON schema.
   - Convert JSON schema `enum` arrays to Prisma enums.
   - Convert `array` types to `String[]` (PostgreSQL native arrays).
   - Convert `object` / free-form JSON fields to `Json` type.
   - Add appropriate indexes on: email fields, status fields, foreign key fields, and date fields used for filtering.
   - Add relations where entities reference each other (e.g., Task.project_id → Project, TimeLog.task_id → Task, Milestone.portfolio_id → Portfolio, PeerFeedback.review_id → PerformanceReview).
4. Run `npx prisma migrate dev --name init` to create the initial migration.
5. Create a seed script (`prisma/seed.js`) that inserts:
   - Default admin user (email: admin@phakathiholdings.co.za, password: hashed)
   - All 10 subsidiaries (Phakathi Holdings, Phakathi Capital, Empoweryst, House of Compliance, Kaello Education Co., Mickey Mouse Schools, Malepha Mining Co., Synergex Healthcare, Key Experts, Cristal Realty SA)
   - All 6 departments (Management, Finance, HR, IT, Operations, Empoweryst)
   - South African public holidays for 2026 (from `src/lib/saHolidays.js`)
   - Sample data: 3 projects, 10 tasks, 2 user profiles with birthdays, 1 notification

### Phase 3 — Authentication

1. Build `src/routes/auth.js` with endpoints:
   - `POST /auth/signup` — create user, hash password, return JWT
   - `POST /auth/login` — verify credentials, return JWT + refresh token in httpOnly cookie
   - `POST /auth/refresh` — rotate refresh token, return new JWT
   - `POST /auth/logout` — clear cookies
   - `GET /auth/me` — return current user (replaces `base44.auth.me()`)
   - `PATCH /auth/me` — update current user's editable fields (replaces `base44.auth.updateMe()`)
   - `POST /auth/invite` — admin-only: create pending user + send invite email (replaces `base44.users.inviteUser()`)
2. Build `src/middleware/auth.js` — JWT verification middleware that populates `req.user`.
3. Build `src/middleware/rbac.js` — role-based access control: `requireAdmin` middleware for admin-only routes.
4. Row-level security pattern: users can only read/update their own data; admins can access all. Implement this as query filters in the route handlers (e.g., `where: { created_by_id: req.user.id }` for non-admins).

### Phase 4 — Generic CRUD Factory

1. Build a generic CRUD factory (as shown in the README) that generates Express routes for any entity:
   - `GET /:resource` — list with pagination (`?page=1&limit=50`), sort (`?sort=-created_date`), and filter (`?status=active`)
   - `GET /:resource/:id` — get single record
   - `POST /:resource` — create (sets `created_by_id` from `req.user.id`)
   - `PATCH /:resource/:id` — update
   - `DELETE /:resource/:id` — delete
   - `POST /:resource/bulk` — bulk create
   - `PATCH /:resource/bulk` — bulk update (array of `{id, ...fields}`)
   - `PATCH /:resource/update-many` — update many by query filter (MongoDB-style `$set`, `$unset`, `$inc` operators)
   - `DELETE /:resource/delete-many` — delete many by query filter
2. Register routes for ALL 34 entities (the README lists every route file — create them all).
3. Add Zod validation on every create/update — mirror the entity JSON schemas.
4. Apply row-level security: non-admin users only see records they created or that are explicitly assigned to them (via `assigned_to`, `employee_email`, `user_email`, `owner_email`, or `author_email` fields).

### Phase 5 — File Storage

1. Build `src/routes/upload.js`:
   - `POST /upload` — accepts multipart file upload, uploads to S3, returns `{ file_url }` (replaces `base44.integrations.Core.UploadFile`)
   - `POST /upload-private` — uploads to private S3 path, returns `{ file_uri }` (replaces `UploadPrivateFile`)
   - `GET /signed-url` — generates presigned download URL for private files (replaces `CreateFileSignedUrl`)
2. Build `src/services/storageService.js` — S3 wrapper with `upload()`, `uploadPrivate()`, `getSignedUrl()`.
3. Build `src/middleware/upload.js` — Multer middleware for file parsing.

### Phase 6 — Email & AI Proxy

1. Build `src/routes/email.js`:
   - `POST /send-email` — accepts `{ to, subject, body, from_name }`, sends via Resend/SendGrid (replaces `base44.integrations.Core.SendEmail`)
2. Build `src/routes/ai.js`:
   - `POST /ai/invoke` — accepts `{ prompt, model, response_json_schema, file_urls, add_context_from_internet }`, routes to OpenAI or Anthropic (replaces `base44.integrations.Core.InvokeLLM`)
   - `POST /ai/transcribe` — accepts audio file URL, transcribes via Whisper API (replaces `TranscribeAudio`)
   - `POST /ai/generate-image` — accepts prompt, generates image via DALL-E (replaces `GenerateImage`)
   - `POST /ai/generate-speech` — accepts text + voice, generates TTS audio (replaces `GenerateSpeech`)
   - `POST /ai/generate-video` — accepts prompt, generates video (replaces `GenerateVideo`)
   - `POST /ai/extract-data` — accepts file URL + JSON schema, extracts structured data (replaces `ExtractDataFromUploadedFile`)

### Phase 7 — Realtime (WebSocket)

1. Set up Socket.io in `src/index.js`.
2. On entity create/update/delete, emit events to connected clients: `{ type: 'create'|'update'|'delete', data: record }`.
3. Build a subscription endpoint that clients join a "room" per entity type.
4. This replaces `base44.entities.X.subscribe()` — the frontend will use Socket.io listeners instead.

### Phase 8 — Automations & Background Jobs

1. Set up BullMQ with Redis in `src/index.js`.
2. Migrate the **dailyNotificationScan** scheduled automation:
   - Create a BullMQ recurring job that runs daily at 7am SAST (cron: `0 5 * * *` UTC).
   - The job scans UserProfile records for upcoming birthdays (5 days), SA holidays (7 days, from `saHolidays.js`), and recent Announcement records.
   - Creates Notification records (team-wide birthday reminders + personal birthday messages).
   - Sends summary emails to users with `email_notifications_enabled = true`.
   - Returns `{ success, birthdays, holidays, announcements, emailsSent, errors }`.
3. Create a BullMQ queue for entity-triggered automations (post-save hooks that enqueue jobs).
4. Create webhook endpoints for connector automations (Slack, Google Calendar, Google Drive) with signature verification.

### Phase 9 — Frontend API Client Replacement

1. Create `src/api/apiClient.js` following the pattern in the README — a generic entity factory that mirrors the Base44 SDK interface:
   ```js
   base44.entities.EntityName.list(sort, limit)
   base44.entities.EntityName.filter(query, sort, limit)
   base44.entities.EntityName.get(id)
   base44.entities.EntityName.create(data)
   base44.entities.EntityName.update(id, data)
   base44.entities.EntityName.delete(id)
   base44.entities.EntityName.bulkCreate(dataArray)
   base44.entities.EntityName.bulkUpdate(dataArray)
   base44.entities.EntityName.updateMany(query, updateOperators)
   base44.entities.EntityName.deleteMany(query)
   base44.entities.EntityName.schema()
   base44.entities.EntityName.subscribe(callback)
   ```
2. Implement `base44.auth.me()`, `base44.auth.isAuthenticated()`, `base44.auth.logout()`, `base44.auth.redirectToLogin()`, `base44.auth.updateMe()`.
3. Implement `base44.users.inviteUser(email, role)`.
4. Implement `base44.integrations.Core.*` (InvokeLLM, SendEmail, UploadFile, GenerateImage, GenerateSpeech, GenerateVideo, TranscribeAudio, ExtractDataFromUploadedFile, CreateFileSignedUrl, UploadPrivateFile).
5. Implement `base44.functions.invoke(functionName, payload)` — calls the backend function endpoint.
6. Implement `base44.analytics.track({ eventName, properties })` — sends to a logging endpoint.
7. Implement `base44.agents.*` — agent conversation management endpoints.
8. Replace the import in every frontend file from `@/api/base44Client` to `@/api/apiClient` (or keep the same export name `base44` so no changes are needed).
9. Update `src/lib/AuthContext.jsx` to use the new auth endpoints.
10. Replace `base44.entities.X.subscribe()` calls with Socket.io listeners in components that use realtime (NotificationBell, PushNotificationManager, Messaging).

### Phase 10 — Enterprise Hardening

1. Rate limiting: `express-rate-limit` on `/auth/*` (5 req/15min) and `/ai/*` (20 req/min).
2. Helmet for security headers.
3. CORS locked to the frontend origin.
4. Centralized error handler middleware with structured error codes.
5. Pino request logging.
6. Health check: `GET /health` returns `{ status: 'ok', timestamp }`.
7. Dockerfile (multi-stage build) + docker-compose.yml with: postgres, redis, api, and optional elasticsearch.
8. GitHub Actions CI: lint, test, build.

## Constraints
- The frontend React code must change as little as possible — the new API client must mirror the Base44 SDK interface exactly.
- Every entity must have the same field names and types as the current JSON schemas in `src/entities/`.
- The Prisma schema must include all built-in fields (id, created_date, updated_date, created_by_id) on every model.
- Maintain South African localization: SA holidays, ZA date formats, and subsidiary/department enums must be preserved exactly.
- The app must remain deployable as a PWA (preserve index.html meta tags and manifest).
- Dashboard is the default landing page at the "/" route.
- The dailyNotificationScan automation must run at 7am SAST (5am UTC).

## Deliverables
1. Complete `backend/` directory with all source files.
2. Complete `prisma/schema.prisma` for all 34 entities.
3. `src/api/apiClient.js` — new API client with identical interface to Base44 SDK.
4. Updated `src/lib/AuthContext.jsx` using new auth backend.
5. `docker-compose.yml` + `Dockerfile`.
6. `.env.example` (backend) and updated `.env.example` (frontend with `VITE_API_URL`).
7. Migration guide (`backend/MIGRATION.md`) documenting every frontend file that changed and why.
8. Seed script with default admin, subsidiaries, departments, SA holidays, and sample data.