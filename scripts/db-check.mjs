import "../backend/src/config/env.js";
import { execFileSync } from "node:child_process";

process.env.DATABASE_URL ||= "postgresql://user:password@localhost:5432/phakathi_flow_schema_check";

function run(command, args) {
  execFileSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
}

run("npx", ["prisma", "validate", "--schema", "backend/prisma/schema.prisma"]);
run("npx", ["prisma", "generate", "--schema", "backend/prisma/schema.prisma"]);

console.log(JSON.stringify({
  ok: true,
  checked: ["prisma validate", "prisma generate"],
  storage: process.env.PHAKATHI_STORAGE || "local-json",
}, null, 2));
