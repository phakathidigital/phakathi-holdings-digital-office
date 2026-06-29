import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { dataDir, dbPath, entitySchemaDir, uploadDir } from "./paths.js";

const initialEmployees = [
  { full_name: "Mr Tshepo Phakathi", email: "tshepo.phakathi@phakathiholdings.local", role: "admin", subsidiary: "Phakathi Holdings", department: "Executive", job_title: "Group CEO" },
  { full_name: "Lorraine Sekwati", email: "lorraine.sekwati@phakathiholdings.local", role: "user", subsidiary: "Phakathi Holdings", department: "HR", job_title: "HR" },
  { full_name: "Meriam Malatji", email: "meriam.malatji@phakathiholdings.local", role: "user", subsidiary: "Phakathi Holdings", department: "Finance", job_title: "Bookkeeper / Accountant" },
  { full_name: "Phathtshedzo Rakhunwana", email: "phathtshedzo.rakhunwana@phakathiholdings.local", role: "user", subsidiary: "Phakathi Holdings", department: "Digital", job_title: "Web, Graphics, and System Developer" },
  { full_name: "Thuli Thabethe", email: "thuli.thabethe@phakathiholdings.local", role: "user", subsidiary: "Phakathi Holdings", department: "Office Administration", job_title: "Office Coordinator" },
  { full_name: "Percity Mavimbela", email: "percity.mavimbela@phakathiholdings.local", role: "user", subsidiary: "Phakathi Holdings", department: "Operations", job_title: "Operations Manager" },
  { full_name: "Sarah Ngwenya", email: "sarah.ngwenya@phakathiholdings.local", role: "user", subsidiary: "Empoweryst", department: "Administration", job_title: "Administrator" },
  { full_name: "Lesedi Lucy Motloung", email: "lesedi.motloung@phakathiholdings.local", role: "user", subsidiary: "Empoweryst", department: "BBBEE Consulting", job_title: "Senior BBBEE Consultant" },
  { full_name: "Molato Moloko", email: "molato.moloko@phakathiholdings.local", role: "user", subsidiary: "Empoweryst", department: "BBBEE Consulting", job_title: "Senior BBBEE Consultant" },
];

const legacySeedEmails = new Set([
  "lorraine@phakathiholdings.local",
  "meriam@phakathiholdings.local",
  "phathu@phakathiholdings.local",
  "thuli@phakathiholdings.local",
  "percity@phakathiholdings.local",
  "sarah@phakathiholdings.local",
  "lesedi@phakathiholdings.local",
  "molato@phakathiholdings.local",
]);

function initialUsers() {
  const now = new Date().toISOString();
  return initialEmployees.map((employee) => ({
    id: crypto.randomUUID(),
    ...employee,
    created_date: now,
    updated_date: now,
  }));
}

function upsertInitialEmployees(db) {
  db.entities ||= {};
  db.entities.User ||= [];
  db.entities.UserProfile ||= [];

  db.entities.User = db.entities.User.filter((user) => !legacySeedEmails.has(user.email));
  db.entities.UserProfile = db.entities.UserProfile.filter((profile) => !legacySeedEmails.has(profile.user_email));

  for (const employee of initialEmployees) {
    const now = new Date().toISOString();
    const userIndex = db.entities.User.findIndex((user) => user.email === employee.email);
    if (userIndex >= 0) {
      db.entities.User[userIndex] = {
        ...db.entities.User[userIndex],
        ...employee,
        updated_date: now,
      };
    } else {
      db.entities.User.push({
        id: crypto.randomUUID(),
        ...employee,
        created_date: now,
        updated_date: now,
      });
    }

    const profileIndex = db.entities.UserProfile.findIndex((profile) => profile.user_email === employee.email);
    const profileData = {
      user_email: employee.email,
      full_name: employee.full_name,
      subsidiary: employee.subsidiary,
      department: employee.department,
      job_title: employee.job_title,
      role: employee.job_title,
    };
    if (profileIndex >= 0) {
      db.entities.UserProfile[profileIndex] = {
        ...db.entities.UserProfile[profileIndex],
        ...profileData,
        updated_date: now,
      };
    } else {
      db.entities.UserProfile.push({
        id: crypto.randomUUID(),
        ...profileData,
        created_date: now,
        updated_date: now,
      });
    }
  }
}

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
    const beforeSeed = JSON.stringify({ users: db.entities.User, profiles: db.entities.UserProfile });
    upsertInitialEmployees(db);
    if (beforeSeed !== JSON.stringify({ users: db.entities.User, profiles: db.entities.UserProfile })) changed = true;
    if (changed) await writeDb(db);
  } catch {
    const entityNames = await listEntityNames();
    const entities = Object.fromEntries(entityNames.map((name) => [name, []]));
    entities.User = initialUsers();
    entities.UserProfile = entities.User.map((user) => ({
      id: crypto.randomUUID(),
      user_email: user.email,
      full_name: user.full_name,
      subsidiary: user.subsidiary,
      department: user.department,
      job_title: user.job_title,
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
