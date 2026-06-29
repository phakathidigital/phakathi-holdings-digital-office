import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), "..");
const viteBin = path.join(rootDir, "node_modules", "vite", "bin", "vite.js");

const commands = [
  ["backend", process.execPath, ["backend/src/index.js"]],
  ["frontend", process.execPath, [viteBin, "--configLoader", "runner"]],
];

const children = commands.map(([name, command, args]) => {
  const child = spawn(command, args, {
    stdio: "inherit",
    cwd: rootDir,
    shell: false,
    env: { ...process.env },
  });
  child.on("exit", (code) => {
    if (code) {
      console.error(`${name} exited with code ${code}`);
      process.exitCode = code;
    }
  });
  return child;
});

function shutdown() {
  for (const child of children) child.kill();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
