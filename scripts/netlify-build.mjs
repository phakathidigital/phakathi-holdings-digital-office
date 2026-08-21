import { spawnSync } from "node:child_process";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options,
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

const storage = process.env.PHAKATHI_STORAGE || "local-json";
const shouldPreparePostgres = storage === "postgres";

if (shouldPreparePostgres) {
  if (!process.env.DATABASE_URL) {
    console.error("PHAKATHI_STORAGE=postgres requires DATABASE_URL in the deployment environment.");
    process.exit(1);
  }

  console.log("Preparing PostgreSQL production database: generate Prisma client, migrate, seed.");
  run("npm", ["run", "db:generate"]);
  run("npm", ["run", "db:migrate"]);
  run("npm", ["run", "db:seed"]);
} else {
  console.log(`Skipping PostgreSQL migration because PHAKATHI_STORAGE=${storage}.`);
}

run("npm", ["run", "build"]);
