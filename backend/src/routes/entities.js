import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { entitySchemaDir } from "../config/paths.js";
import { nowStamped, readDb, writeDb } from "../config/database.js";
import { deliverNotification } from "../services/pushService.js";

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
  db.entities[req.params.entityName] ||= [];
  return { db, records: db.entities[req.params.entityName] };
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
  const created = nowStamped(req.body);
  records.push(created);
  await writeDb(db);
  if (req.params.entityName === "Notification") await deliverNotification(db, created);
  res.status(201).json(created);
});

router.post("/:entityName/bulk", async (req, res) => {
  const { db, records } = await getEntityStore(req);
  const created = (req.body.items || []).map((item) => nowStamped(item));
  records.push(...created);
  await writeDb(db);
  if (req.params.entityName === "Notification") {
    for (const item of created) await deliverNotification(db, item);
  }
  res.status(201).json(created);
});

router.patch("/:entityName/bulk", async (req, res) => {
  const { db, records } = await getEntityStore(req);
  const updated = (req.body.items || []).map((item) => {
    const index = records.findIndex((record) => record.id === item.id);
    if (index === -1) return null;
    records[index] = nowStamped(item, records[index]);
    return records[index];
  }).filter(Boolean);
  await writeDb(db);
  res.json(updated);
});

router.patch("/:entityName/many", async (req, res) => {
  const { db, records } = await getEntityStore(req);
  const affected = [];
  records.forEach((record) => {
    if (matches(record, req.body.query)) {
      Object.assign(record, req.body.update || {}, { updated_date: new Date().toISOString() });
      affected.push(record);
    }
  });
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
  records[index] = nowStamped(req.body, records[index]);
  await writeDb(db);
  res.json(records[index]);
});

router.delete("/:entityName/:id", async (req, res) => {
  const { db, records } = await getEntityStore(req);
  db.entities[req.params.entityName] = records.filter((item) => item.id !== req.params.id);
  await writeDb(db);
  res.json({ id: req.params.id, deleted: true });
});

export default router;
