import express from "express";
import { makeToken, requireAuth } from "../middleware/auth.js";
import { nowStamped, readDb, writeDb } from "../config/database.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { createAuthSession, revokeRefreshToken, rotateRefreshToken } from "../services/authSessionService.js";
import { syncUserToRelational } from "../services/v1/organisationService.js";
import { getTokenTtlSeconds, hashPassword, isStrongEnoughPassword, sanitizeUser, verifyPassword } from "../utils/authSecurity.js";

const router = express.Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, scope: "auth" });

function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function issueAuthResponse(db, user, req) {
  const { sessionId, refreshToken } = createAuthSession(db, user, req);
  return {
    token: makeToken(user, { sessionId }),
    refresh_token: refreshToken,
    expires_in: getTokenTtlSeconds(),
    user: sanitizeUser(user),
  };
}

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
  await syncUserToRelational(users[index]);
  res.json(sanitizeUser(users[index]));
});

router.post("/login-or-register", authLimiter, async (req, res) => {
  const db = await readDb();
  const email = normalizeEmail(req.body.email);
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

  await syncUserToRelational(user);
  const payload = issueAuthResponse(db, user, req);
  await writeDb(db);
  res.json(payload);
});

router.post("/refresh", authLimiter, async (req, res) => {
  const db = await readDb();
  const refreshToken = String(req.body.refresh_token || "");
  if (!refreshToken) return res.status(400).json({ message: "Refresh token is required" });
  const rotated = rotateRefreshToken(db, refreshToken, req);
  if (!rotated) return res.status(401).json({ message: "Invalid or expired refresh token." });
  await writeDb(db);
  res.json({
    token: makeToken(rotated.user, { sessionId: rotated.sessionId }),
    refresh_token: rotated.refreshToken,
    expires_in: getTokenTtlSeconds(),
    user: sanitizeUser(rotated.user),
  });
});

router.post("/logout", async (req, res) => {
  const db = await readDb();
  const refreshToken = String(req.body.refresh_token || "");
  const result = refreshToken ? revokeRefreshToken(db, refreshToken) : { revoked: false };
  await writeDb(db);
  res.json(result);
});

router.post("/invite", async (req, res) => {
  const db = await readDb();
  const email = normalizeEmail(req.body.email);
  if (!email) return res.status(400).json({ message: "Email is required" });
  db.entities.User ||= [];
  let user = db.entities.User.find((item) => item.email?.toLowerCase() === email);
  if (!user) {
    user = nowStamped({ email, role: req.body.role || "user", full_name: email.split("@")[0], invited: true });
    db.entities.User.push(user);
    await writeDb(db);
    await syncUserToRelational(user);
  }
  res.json(sanitizeUser(user));
});

export default router;
