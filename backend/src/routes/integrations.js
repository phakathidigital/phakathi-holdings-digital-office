import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { uploadDir } from "../config/paths.js";
import { nowStamped, readDb, writeDb } from "../config/database.js";
import { analyzeMeetingTranscript } from "../services/meetingStudioAi.js";

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

router.post("/ai/meeting-studio", async (req, res) => {
  const result = await analyzeMeetingTranscript(req.body || {});
  res.json(result);
});

router.post("/ai/:operation", async (req, res) => {
  if (req.params.operation === "invoke" && /meeting transcript|meeting documentation|action_items|structured_notes/i.test(req.body?.prompt || "")) {
    const prompt = req.body.prompt || "";
    const transcriptMatch = prompt.match(/TRANSCRIPT:\s*([\s\S]*)/i);
    const result = await analyzeMeetingTranscript({
      title: prompt.match(/Meeting Title:\s*(.*)/i)?.[1]?.trim() || "Meeting",
      meeting_date: prompt.match(/Date:\s*(.*)/i)?.[1]?.trim() || new Date().toISOString().slice(0, 10),
      attendees: prompt.match(/Attendees:\s*(.*)/i)?.[1]?.split(",").map((item) => item.trim()).filter(Boolean) || [],
      transcript: transcriptMatch?.[1] || prompt,
    });
    return res.json({ result, ...result });
  }
  if (req.body.response_json_schema || req.body.schema) {
    return res.json({ result: {}, note: "No AI provider configured for this operation. Meeting Studio supports OpenAI with a local fallback." });
  }
  res.json({
    response: "Local AI placeholder: connect OpenAI/Anthropic in the backend to enable generated content.",
    text: "Local AI placeholder: connect OpenAI/Anthropic in the backend to enable generated content.",
  });
});

export default router;
