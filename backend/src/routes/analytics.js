import express from "express";
import { nowStamped, readDb, writeDb } from "../config/database.js";

const router = express.Router();

router.post("/track", async (req, res) => {
  const db = await readDb();
  db.events ||= [];
  db.events.push(nowStamped(req.body));
  await writeDb(db);
  res.json({ success: true });
});

export default router;
