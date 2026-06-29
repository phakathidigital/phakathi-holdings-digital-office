import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
export const backendSrcDir = path.dirname(path.dirname(__filename));
export const backendDir = path.dirname(backendSrcDir);
export const rootDir = path.dirname(backendDir);
export const dataDir = path.join(rootDir, ".local-data");
export const uploadDir = path.join(dataDir, "uploads");
export const dbPath = path.join(dataDir, "db.json");
export const entitySchemaDir = path.join(backendDir, "prisma", "entities");
