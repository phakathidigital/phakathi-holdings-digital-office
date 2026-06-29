import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { entitySchemaDir } from "../config/paths.js";
import { nowStamped, readDb, writeDb } from "../config/database.js";
import { userFromToken } from "../middleware/auth.js";
import { deliverNotification } from "../services/pushService.js";
import { handleEntityCreated, handleEntityUpdated, normalizeNotification } from "../services/notificationHooks.js";

const router = express.Router({ mergeParams: true });

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

async function getEntityStore(req) {
  const db = await readDb();
  req.user ||= userFromToken(req, db);
  db.entities[req.params.entityName] ||= [];
  return { db, records: db.entities[req.params.entityName] };
}

function getProjectTaskStats(db, projectId) {
  const projectTasks = (db.entities.Task || []).filter((task) => task.project_id === projectId);
  const completedTasks = projectTasks.filter((task) => task.status === "completed");
  return {
    total: projectTasks.length,
    completed: completedTasks.length,
    progress: projectTasks.length ? Math.round((completedTasks.length / projectTasks.length) * 100) : 0,
  };
}

function validateProjectCompletion(db, projectId, projectData) {
  if (projectData.status !== "completed") return null;
  const stats = getProjectTaskStats(db, projectId);
  if (stats.total === 0) return "A project cannot be marked completed until it has linked tasks.";
  if (stats.completed !== stats.total) {
    return `A project cannot be marked completed while ${stats.total - stats.completed} linked task(s) are still open.`;
  }
  return null;
}

function prepareEntityData(entityName, incoming, existing = {}, req = {}) {
  const data = entityName === "Notification" ? normalizeNotification(incoming) : { ...incoming };

  if (entityName === "Project") {
    delete data.progress;
    delete data.progress_override;
  }

  if (entityName === "Task") {
    const previousStatus = existing.status || "todo";
    const nextStatus = data.status || previousStatus;
    if (nextStatus !== previousStatus) {
      const statusEvent = {
        from: previousStatus,
        to: nextStatus,
        changed_by: req.user?.email || "unknown",
        changed_at: new Date().toISOString(),
      };
      data.status_history = [...(existing.status_history || []), statusEvent];
    }
    if (nextStatus === "completed" && previousStatus !== "completed") {
      data.completed_at = new Date().toISOString();
      data.completed_by = req.user?.email || "unknown";
    }
    if (previousStatus === "completed" && nextStatus !== "completed") {
      data.reopened_at = new Date().toISOString();
      data.reopened_by = req.user?.email || "unknown";
    }
  }

  return data;
}

router.get("/:entityName/schema", async (req, res) => {
  try {
    const schema = await fs.readFile(path.join(entitySchemaDir, `${req.params.entityName}.jsonc`), "utf8");
    res.json({ schema });
  } catch {
    res.json({ schema: "{}" });
  }
});

router.post("/:entityName/filter", async (req, res) => {
  const { records } = await getEntityStore(req);
  const filtered = sortRecords(records.filter((record) => matches(record, req.body.query)), req.body.sort);
  res.json(req.body.limit ? filtered.slice(0, Number(req.body.limit)) : filtered);
});

router.get("/:entityName", async (req, res) => {
  const { records } = await getEntityStore(req);
  const sorted = sortRecords(records, req.query.sort);
  res.json(req.query.limit ? sorted.slice(0, Number(req.query.limit)) : sorted);
});

router.post("/:entityName", async (req, res) => {
  const { db, records } = await getEntityStore(req);
  const body = prepareEntityData(req.params.entityName, req.body, {}, req);
  if (req.params.entityName === "Project") {
    const completionError = validateProjectCompletion(db, body.id, body);
    if (completionError) return res.status(400).json({ message: completionError });
  }
  const created = nowStamped(body);
  records.push(created);
  await writeDb(db);
  if (req.params.entityName === "Notification") await deliverNotification(db, created);
  else await handleEntityCreated(db, req.params.entityName, created);
  res.status(201).json(created);
});

router.post("/:entityName/bulk", async (req, res) => {
  const { db, records } = await getEntityStore(req);
  const created = [];
  for (const item of req.body.items || []) {
    const prepared = prepareEntityData(req.params.entityName, item, {}, req);
    if (req.params.entityName === "Project") {
      const completionError = validateProjectCompletion(db, prepared.id, prepared);
      if (completionError) return res.status(400).json({ message: completionError });
    }
    created.push(nowStamped(prepared));
  }
  records.push(...created);
  await writeDb(db);
  if (req.params.entityName === "Notification") {
    for (const item of created) await deliverNotification(db, item);
  } else {
    for (const item of created) await handleEntityCreated(db, req.params.entityName, item);
  }
  res.status(201).json(created);
});

router.patch("/:entityName/bulk", async (req, res) => {
  const { db, records } = await getEntityStore(req);
  const updated = [];
  for (const item of req.body.items || []) {
    const index = records.findIndex((record) => record.id === item.id);
    if (index === -1) continue;
    const prepared = prepareEntityData(req.params.entityName, item, records[index], req);
    if (req.params.entityName === "Project") {
      const completionError = validateProjectCompletion(db, item.id, { ...records[index], ...prepared });
      if (completionError) return res.status(400).json({ message: completionError });
    }
    records[index] = nowStamped(prepared, records[index]);
    updated.push(records[index]);
  }
  await writeDb(db);
  res.json(updated);
});

router.patch("/:entityName/many", async (req, res) => {
  const { db, records } = await getEntityStore(req);
  const affected = [];
  records.forEach((record) => {
    if (matches(record, req.body.query)) {
      const prepared = prepareEntityData(req.params.entityName, req.body.update || {}, record, req);
      if (req.params.entityName === "Project") {
        const completionError = validateProjectCompletion(db, record.id, { ...record, ...prepared });
        if (completionError) {
          affected.push({ __completionError: completionError });
          return;
        }
      }
      Object.assign(record, prepared, { updated_date: new Date().toISOString() });
      affected.push(record);
    }
  });
  const completionError = affected.find((record) => record.__completionError)?.__completionError;
  if (completionError) return res.status(400).json({ message: completionError });
  await writeDb(db);
  res.json({ count: affected.length, records: affected });
});

router.delete("/:entityName/many", async (req, res) => {
  const { db, records } = await getEntityStore(req);
  const affected = [];
  db.entities[req.params.entityName] = records.filter((record) => {
    if (!matches(record, req.body.query)) return true;
    affected.push(record);
    return false;
  });
  await writeDb(db);
  res.json({ count: affected.length, records: affected });
});

router.get("/:entityName/:id", async (req, res) => {
  const { records } = await getEntityStore(req);
  const record = records.find((item) => item.id === req.params.id);
  return record ? res.json(record) : res.status(404).json({ message: `${req.params.entityName} not found` });
});

router.patch("/:entityName/:id", async (req, res) => {
  const { db, records } = await getEntityStore(req);
  const index = records.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: `${req.params.entityName} not found` });
  const previous = { ...records[index] };
  const prepared = prepareEntityData(req.params.entityName, req.body, records[index], req);
  if (req.params.entityName === "Project") {
    const completionError = validateProjectCompletion(db, req.params.id, { ...records[index], ...prepared });
    if (completionError) return res.status(400).json({ message: completionError });
  }
  records[index] = nowStamped(prepared, records[index]);
  await writeDb(db);
  await handleEntityUpdated(db, req.params.entityName, previous, records[index]);
  res.json(records[index]);
});

router.delete("/:entityName/:id", async (req, res) => {
  const { db, records } = await getEntityStore(req);
  db.entities[req.params.entityName] = records.filter((item) => item.id !== req.params.id);
  await writeDb(db);
  res.json({ id: req.params.id, deleted: true });
});

export default router;
