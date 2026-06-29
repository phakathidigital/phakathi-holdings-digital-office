import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, ".local-data");
const uploadDir = path.join(dataDir, "uploads");
const dbPath = path.join(dataDir, "db.json");
const entityDir = path.join(rootDir, "server", "schemas", "entities");
const PORT = Number(process.env.PORT || 4000);

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

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(uploadDir, { recursive: true });

  try {
    await fs.access(dbPath);
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

async function listEntityNames() {
  try {
    const files = await fs.readdir(entityDir);
    return files.filter((file) => file.endsWith(".jsonc")).map((file) => path.basename(file, ".jsonc"));
  } catch {
    return ["User", "UserProfile", "Project", "Task", "Notification", "MeetingNote"];
  }
}

async function readDb() {
  await ensureStore();
  return JSON.parse(await fs.readFile(dbPath, "utf8"));
}

async function writeDb(db) {
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
}

function send(res, status, data, headers = {}) {
  const body = typeof data === "string" ? data : JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": typeof data === "string" ? "text/plain; charset=utf-8" : "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    ...headers,
  });
  res.end(body);
  return true;
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function makeToken(user) {
  return Buffer.from(JSON.stringify({ email: user.email })).toString("base64url");
}

function userFromToken(req, db) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  try {
    const payload = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    return db.entities.User?.find((user) => user.email === payload.email) || null;
  } catch {
    return null;
  }
}

function nowStamped(data, existing = {}) {
  const now = new Date().toISOString();
  return {
    ...existing,
    ...data,
    id: existing.id || data.id || crypto.randomUUID(),
    created_date: existing.created_date || data.created_date || now,
    updated_date: now,
  };
}

function matches(record, query = {}) {
  return Object.entries(query || {}).every(([key, expected]) => {
    if (expected === undefined || expected === null || expected === "") return true;
    const actual = record[key];
    if (Array.isArray(expected)) return expected.includes(actual);
    if (typeof expected === "object" && expected !== null) {
      if ("$in" in expected) return expected.$in.includes(actual);
      if ("$ne" in expected) return actual !== expected.$ne;
      return JSON.stringify(actual) === JSON.stringify(expected);
    }
    return actual === expected;
  });
}

function sortRecords(records, sort) {
  if (!sort) return records;
  const desc = sort.startsWith("-");
  const key = desc ? sort.slice(1) : sort;
  return [...records].sort((a, b) => {
    const av = a[key] || "";
    const bv = b[key] || "";
    if (av === bv) return 0;
    return (av > bv ? 1 : -1) * (desc ? -1 : 1);
  });
}

async function entitySchema(entityName) {
  try {
    return await fs.readFile(path.join(entityDir, `${entityName}.jsonc`), "utf8");
  } catch {
    return "{}";
  }
}

async function handleAuth(req, res, pathname) {
  const db = await readDb();
  if (pathname === "/api/auth/me" && req.method === "GET") {
    const user = userFromToken(req, db);
    if (!user) return send(res, 401, { message: "Not authenticated" });
    return send(res, 200, user);
  }

  if (pathname === "/api/auth/me" && req.method === "PATCH") {
    const user = userFromToken(req, db);
    if (!user) return send(res, 401, { message: "Not authenticated" });
    const patch = await readJson(req);
    const users = db.entities.User || [];
    const index = users.findIndex((item) => item.id === user.id);
    users[index] = nowStamped(patch, users[index]);
    db.entities.User = users;
    await writeDb(db);
    return send(res, 200, users[index]);
  }

  if (pathname === "/api/auth/login-or-register" && req.method === "POST") {
    const body = await readJson(req);
    const email = String(body.email || "").trim().toLowerCase();
    if (!email) return send(res, 400, { message: "Email is required" });

    db.entities.User ||= [];
    let user = db.entities.User.find((item) => item.email?.toLowerCase() === email);
    if (!user) {
      user = nowStamped({
        email,
        full_name: body.full_name || email.split("@")[0],
        role: "user",
        subsidiary: "",
        job_title: "",
      });
      db.entities.User.push(user);
    } else if (body.full_name && !user.full_name) {
      user.full_name = body.full_name;
      user.updated_date = new Date().toISOString();
    }

    await writeDb(db);
    return send(res, 200, { token: makeToken(user), user });
  }

  if (pathname === "/api/auth/invite" && req.method === "POST") {
    const body = await readJson(req);
    const email = String(body.email || "").trim().toLowerCase();
    if (!email) return send(res, 400, { message: "Email is required" });
    db.entities.User ||= [];
    let user = db.entities.User.find((item) => item.email?.toLowerCase() === email);
    if (!user) {
      user = nowStamped({ email, role: body.role || "user", full_name: email.split("@")[0], invited: true });
      db.entities.User.push(user);
      await writeDb(db);
    }
    return send(res, 200, user);
  }

  return false;
}

async function handleEntity(req, res, pathname, searchParams) {
  const match = pathname.match(/^\/api\/entities\/([^/]+)(?:\/([^/]+))?(?:\/([^/]+))?$/);
  if (!match) return false;

  const [, entityName, idOrAction, nested] = match;
  const db = await readDb();
  db.entities[entityName] ||= [];
  const records = db.entities[entityName];

  if (idOrAction === "schema" && req.method === "GET") {
    return send(res, 200, { schema: await entitySchema(entityName) });
  }

  if (idOrAction === "filter" && req.method === "POST") {
    const { query, sort, limit } = await readJson(req);
    const filtered = sortRecords(records.filter((record) => matches(record, query)), sort);
    return send(res, 200, limit ? filtered.slice(0, Number(limit)) : filtered);
  }

  if (!idOrAction && req.method === "GET") {
    const sort = searchParams.get("sort");
    const limit = searchParams.get("limit");
    const sorted = sortRecords(records, sort);
    return send(res, 200, limit ? sorted.slice(0, Number(limit)) : sorted);
  }

  if (!idOrAction && req.method === "POST") {
    const created = nowStamped(await readJson(req));
    records.push(created);
    await writeDb(db);
    return send(res, 201, created);
  }

  if (idOrAction === "bulk" && req.method === "POST") {
    const { items = [] } = await readJson(req);
    const created = items.map((item) => nowStamped(item));
    records.push(...created);
    await writeDb(db);
    return send(res, 201, created);
  }

  if (idOrAction === "bulk" && req.method === "PATCH") {
    const { items = [] } = await readJson(req);
    const updated = items.map((item) => {
      const index = records.findIndex((record) => record.id === item.id);
      if (index === -1) return null;
      records[index] = nowStamped(item, records[index]);
      return records[index];
    }).filter(Boolean);
    await writeDb(db);
    return send(res, 200, updated);
  }

  if (idOrAction === "many" && ["PATCH", "DELETE"].includes(req.method)) {
    const { query = {}, update = {} } = await readJson(req);
    const affected = [];
    db.entities[entityName] = records.filter((record) => {
      if (!matches(record, query)) return true;
      affected.push(record);
      if (req.method === "PATCH") {
        Object.assign(record, update, { updated_date: new Date().toISOString() });
        return true;
      }
      return false;
    });
    await writeDb(db);
    return send(res, 200, { count: affected.length, records: affected });
  }

  if (idOrAction && !nested && req.method === "GET") {
    const record = records.find((item) => item.id === idOrAction);
    return record ? send(res, 200, record) : send(res, 404, { message: `${entityName} not found` });
  }

  if (idOrAction && !nested && req.method === "PATCH") {
    const index = records.findIndex((item) => item.id === idOrAction);
    if (index === -1) return send(res, 404, { message: `${entityName} not found` });
    records[index] = nowStamped(await readJson(req), records[index]);
    await writeDb(db);
    return send(res, 200, records[index]);
  }

  if (idOrAction && !nested && req.method === "DELETE") {
    db.entities[entityName] = records.filter((item) => item.id !== idOrAction);
    await writeDb(db);
    return send(res, 200, { id: idOrAction, deleted: true });
  }

  return false;
}

async function handleIntegrations(req, res, pathname) {
  if (pathname === "/api/integrations/upload-file" && req.method === "POST") {
    const body = await readJson(req);
    const extension = path.extname(body.name || "") || ".bin";
    const filename = `${Date.now()}-${crypto.randomUUID()}${extension}`;
    const base64 = String(body.dataUrl || "").split(",")[1] || "";
    await fs.writeFile(path.join(uploadDir, filename), Buffer.from(base64, "base64"));
    return send(res, 201, { file_url: `http://127.0.0.1:${PORT}/uploads/${filename}` });
  }

  if (pathname === "/api/integrations/send-email" && req.method === "POST") {
    const db = await readDb();
    db.emails ||= [];
    db.emails.push(nowStamped(await readJson(req)));
    await writeDb(db);
    return send(res, 200, { success: true, queued: true });
  }

  if (pathname === "/api/integrations/send-sms" && req.method === "POST") {
    const db = await readDb();
    db.sms ||= [];
    db.sms.push(nowStamped(await readJson(req)));
    await writeDb(db);
    return send(res, 200, { success: true, queued: true });
  }

  if (pathname.startsWith("/api/integrations/ai/") && req.method === "POST") {
    const body = await readJson(req);
    if (body.response_json_schema || body.schema) {
      return send(res, 200, { result: {}, note: "Local AI placeholder. Configure a provider to enable generated structured output." });
    }
    return send(res, 200, {
      response: "Local AI placeholder: connect OpenAI/Anthropic in the self-hosted backend to enable generated content.",
      text: "Local AI placeholder: connect OpenAI/Anthropic in the self-hosted backend to enable generated content.",
    });
  }

  return false;
}

async function handleStaticUpload(req, res, pathname) {
  if (!pathname.startsWith("/uploads/")) return false;
  const filename = path.basename(pathname);
  try {
    const file = await fs.readFile(path.join(uploadDir, filename));
    res.writeHead(200, {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/octet-stream",
    });
    res.end(file);
  } catch {
    send(res, 404, "File not found");
  }
  return true;
}

async function handleRequest(req, res) {
  if (req.method === "OPTIONS") return send(res, 204, "");
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname, searchParams } = url;

  try {
    if (await handleStaticUpload(req, res, pathname)) return;
    if (pathname === "/api/health") return send(res, 200, { ok: true, service: "phakathi-flow-api" });
    if (await handleAuth(req, res, pathname)) return;
    if (await handleEntity(req, res, pathname, searchParams)) return;
    if (await handleIntegrations(req, res, pathname)) return;
    if (pathname.startsWith("/api/functions/")) return send(res, 200, { success: true, placeholder: true });
    if (pathname === "/api/analytics/track") return send(res, 200, { success: true });
    return send(res, 404, { message: "Not found" });
  } catch (error) {
    console.error(error);
    return send(res, 500, { message: error.message || "Internal server error" });
  }
}

await ensureStore();
http.createServer(handleRequest).listen(PORT, "127.0.0.1", () => {
  console.log(`Phakathi Flow API running on http://127.0.0.1:${PORT}`);
});
