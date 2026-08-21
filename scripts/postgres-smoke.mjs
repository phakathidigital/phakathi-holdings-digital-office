import "../backend/src/config/env.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for npm run db:smoke.");
  }

  const [
    organisations,
    subsidiaries,
    departments,
    users,
    roles,
    permissions,
    stages,
    integrations,
    entityRecords,
  ] = await Promise.all([
    prisma.organisation.count(),
    prisma.subsidiary.count(),
    prisma.department.count(),
    prisma.user.count(),
    prisma.role.count(),
    prisma.permission.count(),
    prisma.opportunityStage.count(),
    prisma.integration.count(),
    prisma.entityRecord.count(),
  ]);

  const required = {
    organisations,
    subsidiaries,
    departments,
    users,
    roles,
    permissions,
    stages,
    integrations,
    entityRecords,
  };

  const missing = Object.entries(required)
    .filter(([, count]) => count <= 0)
    .map(([name]) => name);

  if (missing.length) {
    throw new Error(`Postgres smoke check failed; missing seeded data for: ${missing.join(", ")}`);
  }

  console.log(JSON.stringify({
    ok: true,
    storage: "postgres",
    counts: required,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
