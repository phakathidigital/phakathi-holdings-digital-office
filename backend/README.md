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
