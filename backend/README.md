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

The current implementation supports local development with JSON-file persistence in `.local-data/db.json` and hosted Netlify deployment with Netlify Blobs persistence. The route and module layout remains ready for a future PostgreSQL/Prisma migration when the office pilot outgrows object-backed JSON storage.

Hosted Netlify API:

- `netlify/functions/api.mjs` serves the Express API under `/api/*`.
- `PHAKATHI_STORAGE=netlify-blobs` stores app data in the `phakathi-flow-db` Blob store.
- Uploaded files are stored in the `phakathi-flow-uploads` Blob store and served through `/api/integrations/uploads/:filename`.

Meeting Studio is wired through `src/services/meetingStudioAi.js`. It uses OpenAI when `OPENAI_API_KEY` exists and falls back to deterministic transcript parsing when no key is configured.

Scheduled notifications are shared through `src/services/scheduler.js`. Local development may run the interval scheduler from `src/index.js`; deployed Netlify scans use `netlify/functions/scheduled-notifications.mjs` against Netlify Blobs directly, or against `PHAKATHI_API_BASE_URL` when a separate hosted API is configured.
