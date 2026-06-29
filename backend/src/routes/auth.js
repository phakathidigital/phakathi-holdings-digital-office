import express from "express";
import { makeToken, requireAuth } from "../middleware/auth.js";
import { nowStamped, readDb, writeDb } from "../config/database.js";

const router = express.Router();

router.get("/me", requireAuth, (req, res) => {
  res.json(req.user);
});

router.patch("/me", requireAuth, async (req, res) => {
  const users = req.db.entities.User || [];
  const index = users.findIndex((item) => item.id === req.user.id);
  users[index] = nowStamped(req.body, users[index]);
  req.db.entities.User = users;
  await writeDb(req.db);
  res.json(users[index]);
});

router.post("/login-or-register", async (req, res) => {
  const db = await readDb();
  const email = String(req.body.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ message: "Email is required" });

  db.entities.User ||= [];
  let user = db.entities.User.find((item) => item.email?.toLowerCase() === email);
  if (!user) {
    user = nowStamped({
      email,
      full_name: req.body.full_name || email.split("@")[0],
      role: "user",
      subsidiary: "",
      job_title: "",
    });
    db.entities.User.push(user);
  } else if (req.body.full_name && !user.full_name) {
    user.full_name = req.body.full_name;
    user.updated_date = new Date().toISOString();
  }

  await writeDb(db);
  res.json({ token: makeToken(user), user });
});

router.post("/invite", async (req, res) => {
  const db = await readDb();
  const email = String(req.body.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ message: "Email is required" });
  db.entities.User ||= [];
  let user = db.entities.User.find((item) => item.email?.toLowerCase() === email);
  if (!user) {
    user = nowStamped({ email, role: req.body.role || "user", full_name: email.split("@")[0], invited: true });
    db.entities.User.push(user);
    await writeDb(db);
  }
  res.json(user);
});

export default router;
