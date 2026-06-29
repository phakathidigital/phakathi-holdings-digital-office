import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { uploadDir } from "../config/paths.js";
import { nowStamped, readDb, writeDb } from "../config/database.js";

const router = express.Router();
const PORT = Number(process.env.PORT || 4000);

router.post("/upload-file", async (req, res) => {
  const extension = path.extname(req.body.name || "") || ".bin";
  const filename = `${Date.now()}-${crypto.randomUUID()}${extension}`;
  const base64 = String(req.body.dataUrl || "").split(",")[1] || "";
  await fs.writeFile(path.join(uploadDir, filename), Buffer.from(base64, "base64"));
  res.status(201).json({ file_url: `http://127.0.0.1:${PORT}/uploads/${filename}` });
});

router.post("/send-email", async (req, res) => {
  const db = await readDb();
  db.emails ||= [];
  db.emails.push(nowStamped(req.body));
  await writeDb(db);
  res.json({ success: true, queued: true });
});

router.post("/send-sms", async (req, res) => {
  const db = await readDb();
  db.sms ||= [];
  db.sms.push(nowStamped(req.body));
  await writeDb(db);
  res.json({ success: true, queued: true });
});

router.post("/ai/:operation", (req, res) => {
  if (req.body.response_json_schema || req.body.schema) {
    return res.json({ result: {}, note: "Local AI placeholder. Configure a provider to enable generated structured output." });
  }
  res.json({
    response: "Local AI placeholder: connect OpenAI/Anthropic in the backend to enable generated content.",
    text: "Local AI placeholder: connect OpenAI/Anthropic in the backend to enable generated content.",
  });
});

export default router;
