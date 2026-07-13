import express from "express";
import { makeToken, requireAuth } from "../middleware/auth.js";
import { nowStamped, readDb, writeDb } from "../config/database.js";
import { hashPassword, isStrongEnoughPassword, sanitizeUser, verifyPassword } from "../utils/authSecurity.js";

const router = express.Router();

router.get("/me", requireAuth, (req, res) => {
  res.json(req.user);
});

router.patch("/me", requireAuth, async (req, res) => {
  const users = req.db.entities.User || [];
  const index = users.findIndex((item) => item.id === req.authenticatedUser.id);
  const { password, password_hash, role, email, id, ...safePatch } = req.body || {};
  users[index] = nowStamped(safePatch, users[index]);
  req.db.entities.User = users;
  await writeDb(req.db);
  res.json(sanitizeUser(users[index]));
});

router.post("/login-or-register", async (req, res) => {
  const db = await readDb();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!email) return res.status(400).json({ message: "Email is required" });
  if (!isStrongEnoughPassword(password)) {
    return res.status(400).json({ message: "Password must be at least 8 characters." });
  }

  db.entities.User ||= [];
  let user = db.entities.User.find((item) => item.email?.toLowerCase() === email);
  if (!user) {
    user = nowStamped({
      email,
      full_name: req.body.full_name || email.split("@")[0],
      role: "user",
      subsidiary: "",
      job_title: "",
      password_hash: hashPassword(password),
      auth_provider: "local_password",
      password_set_date: new Date().toISOString(),
    });
    db.entities.User.push(user);
  } else {
    if (user.password_hash) {
      if (!verifyPassword(password, user.password_hash)) {
        return res.status(401).json({ message: "Incorrect email or password." });
      }
    } else {
      user.password_hash = hashPassword(password);
      user.auth_provider = "local_password";
      user.password_set_date = new Date().toISOString();
    }

    if (req.body.full_name && (!user.full_name || user.full_name === email.split("@")[0])) {
      user.full_name = req.body.full_name;
    }
    user.updated_date = new Date().toISOString();
  }

  await writeDb(db);
  res.json({ token: makeToken(user), user: sanitizeUser(user) });
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
  res.json(sanitizeUser(user));
});

export default router;
