# Backend Migration & Enterprise Prompt

You are migrating the "Phakathi Flow" application from the Base44 BaaS platform to a self-hosted, production-grade enterprise backend. The frontend (React 18 + Tailwind CSS + Vite) stays the same; you are building the backend and rewiring the frontend API layer.

## Target Stack
- Runtime: Node.js 20+ with Express.js
- Database: PostgreSQL 16 with Prisma ORM
- Auth: JWT-based with refresh tokens (replacing Base44 Auth)
- File Storage: AWS S3 (replacing Base44 UploadFile)
- Email: AWS SES or Nodemailer with SMTP (replacing Base44 SendEmail)
- AI/LLM: OpenAI API or Anthropic API via a proxy endpoint (replacing Base44 InvokeLLM)
- Realtime: WebSocket (Socket.io) for entity subscriptions and presence (replacing Base44 realtime)
- Background Jobs: BullMQ with Redis for scheduled automations and async tasks
- Search: Optional Elasticsearch or PostgreSQL full-text search for the knowledge base

## Migration Scope

### Phase 1 — Database & ORM
1. Convert all 34 entity JSON schemas (in src/entities/) into a complete Prisma schema (schema.prisma) with proper relations, indexes, and enums. The README already contains a partial Prisma schema — complete it for every entity.
2. Create PostgreSQL migration scripts.
3. Seed scripts for subsidiaries, departments, default admin user, SA holidays, and sample data.

### Phase 2 — Authentication & Authorization
1. Replace base44.auth.me(), base44.auth.isAuthenticated(), base44.auth.logout(), base44.auth.redirectToLogin() with a custom auth context that calls the new backend.
2. Implement: signup, login, email verification, password reset, refresh token rotation, role-based access control (admin/user), and row-level security patterns (users see their own data; admins see all).
3. User invites: replace base44.users.inviteUser() with an email-based invite flow that creates a pending user record and sends a signup link.
4. Session management with httpOnly cookies for tokens.

### Phase 3 — API Layer & Frontend Rewire
1. Build a generic CRUD factory for all 34 entities (the README shows the pattern — extend it to cover every entity).
2. Build Express routes for every entity with: list (with pagination, sort, filter), get, create, update, delete, bulkCreate, bulkUpdate, updateMany, deleteMany.
3. Replace the Base44 SDK client (src/api/base44Client.js) with a new API client that mirrors the same interface (base44.entities.EntityName.list/filter/create/update/delete) so frontend code changes are minimal.
4. Replace base44.integrations.Core.InvokeLLM/SendEmail/UploadFile/GenerateImage/GenerateSpeech/GenerateVideo/TranscribeAudio/ExtractDataFromUploadedFile with backend proxy endpoints.
5. Replace base44.entities.X.subscribe() realtime subscriptions with Socket.io event listeners.

### Phase 4 — File Storage
1. Implement S3-backed file upload (replacing Base44 UploadFile) with presigned URLs.
2. Implement private file storage with signed download URLs (replacing Base44 CreateFileSignedUrl).
3. Migrate the Document Vault, Payslips, Meeting Studio transcripts, and HR Documents to S3.

### Phase 5 — Integrations
1. Sage Integration: build a backend module that connects to the Sage HR/Payroll API (or CSV import fallback) to sync employee profiles, leave balances, leave requests, departments, and reporting structures. Store config in the SageIntegration table.
2. Google Drive Sync: build a backend module using the Google Drive API to sync files into the Document Vault with auto-tagging and department mapping. Store config in the DriveSyncConnection table.
3. Replace any Base44 connector automations with webhook handlers + BullMQ jobs.

### Phase 6 — Automations & Background Jobs
1. Replace Base44 scheduled automations with BullMQ recurring jobs (cron patterns).
2. Replace Base44 entity-triggered automations with Prisma middleware or post-save hooks that enqueue BullMQ jobs.
3. Replace Base44 connector webhook automations with Express webhook endpoints + signature verification.
4. Migrate: SA holiday reminders, birthday reminders, well-being tips, DAM compliance rule checks, Sage sync schedules, Drive sync schedules, notification delivery.

### Phase 7 — Enterprise Hardening
1. Rate limiting (express-rate-limit) on auth and AI endpoints.
2. Input validation with Zod schemas on every route (mirror the entity JSON schemas).
3. Centralized error handling middleware with structured error codes.
4. Request logging with Pino (structured JSON logs).
5. Health check endpoint (/health) and readiness probe.
6. CORS configuration locked to the frontend domain.
7. Helmet for security headers.
8. Environment-based config (dotenv) with validation.
9. Dockerfile + docker-compose.yml for Postgres, Redis, API, and optional Elasticsearch.
10. CI/CD pipeline (GitHub Actions): lint, test, build, deploy.
11. API documentation with OpenAPI/Swagger.
12. Audit log table for sensitive operations (user management, payroll, document access).

### Phase 8 — AI Features
1. Build an LLM proxy endpoint that accepts prompt, model, response_json_schema, file_urls, and add_context_from_internet — routing to OpenAI or Anthropic.
2. Implement the AI Assistant, AI Briefing Card, Task Prioritizer, Smart Suggestions, Project Analyzer, and Knowledge Base search using the proxy.
3. Meeting Studio: audio transcription (Whisper API), summarization, action item extraction, and individual summaries via the LLM proxy.

## Constraints
- The frontend React code must change as little as possible — the new API client should mirror the Base44 SDK interface so page/component code stays the same.
- Every entity must have the same field names and types as the current JSON schemas.
- The Prisma schema must include all built-in fields (id, created_date, updated_date, created_by_id) on every model.
- Maintain South African localization: SA holidays, ZA date formats, and subsidiary/department enums must be preserved exactly.
- The app must remain deployable as a PWA (preserve index.html meta tags and manifest).
- Dashboard is the default landing page at the "/" route.

## Deliverables
1. Complete Prisma schema (schema.prisma) for all 34 entities.
2. Express backend with all routes, middleware, and auth.
3. New API client (src/api/base44Client.js replacement) with identical interface.
4. Updated AuthContext.jsx to use the new auth backend.
5. Docker setup (Dockerfile, docker-compose.yml).
6. Migration guide documenting every frontend file that changed and why.
7. Environment variable template (.env.example) with all required secrets.