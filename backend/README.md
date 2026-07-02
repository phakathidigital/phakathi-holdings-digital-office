# Phakathi Flow Backend

This backend follows the structure documented in the application README:

```text
backend/
├── src/
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── index.js
└── prisma/
    ├── schema.prisma
    └── entities/
```

The current implementation is a local development backend using JSON-file persistence in `.local-data/db.json`. The route and module layout is ready for the production migration to PostgreSQL/Prisma, JWT auth, S3-compatible storage, email, AI, and background jobs.

Meeting Studio is wired through `src/services/meetingStudioAi.js`. It uses OpenAI when `OPENAI_API_KEY` exists and falls back to deterministic transcript parsing when no key is configured.

Scheduled notifications are shared through `src/services/scheduler.js`. Local development may run the interval scheduler from `src/index.js`; deployed Netlify scans should use `netlify/functions/scheduled-notifications.mjs` with `PHAKATHI_API_BASE_URL` and `SCHEDULED_NOTIFICATION_SECRET`.
