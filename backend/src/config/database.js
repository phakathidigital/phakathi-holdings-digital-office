import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { dataDir, dbPath, entitySchemaDir, uploadDir } from "./paths.js";

const initialUsers = [
  ["Lorraine", "Phakathi Holdings"],
  ["Meriam", "Phakathi Holdings"],
  ["Phathu", "Phakathi Holdings"],
  ["Thuli", "Phakathi Holdings"],
  ["Percity", "Phakathi Holdings"],
  ["Sarah", "Empoweryst"],
  ["Lesedi", "Empoweryst"],
  ["Molato", "Empoweryst"],
].map(([name, subsidiary]) => ({
  id: crypto.randomUUID(),
  full_name: name,
  email: `${name.toLowerCase()}@phakathiholdings.local`,
  role: "user",
  subsidiary,
  job_title: "",
  created_date: new Date().toISOString(),
  updated_date: new Date().toISOString(),
}));

export async function listEntityNames() {
  try {
    const files = await fs.readdir(entitySchemaDir);
    return files.filter((file) => file.endsWith(".jsonc")).map((file) => path.basename(file, ".jsonc"));
  } catch {
    return ["User", "UserProfile", "Project", "Task", "Notification", "MeetingNote"];
  }
}

export async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(uploadDir, { recursive: true });

  try {
    await fs.access(dbPath);
    const db = JSON.parse(await fs.readFile(dbPath, "utf8"));
    const entityNames = await listEntityNames();
    db.entities ||= {};
    let changed = false;
    for (const name of entityNames) {
      if (!Array.isArray(db.entities[name])) {
        db.entities[name] = [];
        changed = true;
      }
    }
    if (changed) await writeDb(db);
  } catch {
    const entityNames = await listEntityNames();
    const entities = Object.fromEntries(entityNames.map((name) => [name, []]));
    entities.User = initialUsers;
    entities.UserProfile = initialUsers.map((user) => ({
      id: crypto.randomUUID(),
      user_email: user.email,
      full_name: user.full_name,
      subsidiary: user.subsidiary,
      role: user.job_title,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    }));
    await writeDb({ entities, events: [], emails: [], sms: [] });
  }
}

export async function readDb() {
  await ensureStore();
  return JSON.parse(await fs.readFile(dbPath, "utf8"));
}

export async function writeDb(db) {
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
}

export function nowStamped(data, existing = {}) {
  const now = new Date().toISOString();
  return {
    ...existing,
    ...data,
    id: existing.id || data.id || crypto.randomUUID(),
    created_date: existing.created_date || data.created_date || now,
    updated_date: now,
  };
}
