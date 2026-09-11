import express from "express";
import crypto from "node:crypto";
import { makeToken, requireAuth } from "../middleware/auth.js";
import { nowStamped, readDb, writeDb } from "../config/database.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { writeAuditLog } from "../services/auditLogService.js";
import { createAuthSession, revokeRefreshToken, rotateRefreshToken } from "../services/authSessionService.js";
import { sendTransactionalEmail } from "../services/emailService.js";
import { syncUserToRelational } from "../services/v1/organisationService.js";
import {
  getTokenTtlSeconds,
  hashPassword,
  isStrongEnoughPassword,
  makeOneTimeToken,
  makeTokenHash,
  sanitizeUser,
  verifyPassword,
} from "../utils/authSecurity.js";

const router = express.Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, scope: "auth" });
const resetLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, scope: "password-reset" });

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

function getAuthState(db) {
  db.auth ||= {};
  db.auth.password_reset_tokens ||= [];
  db.auth.email_verification_tokens ||= [];
  return db.auth;
}

function absoluteFrontendUrl(pathname, token) {
  const base = process.env.APP_PUBLIC_URL || process.env.URL || "http://localhost:5173";
  const url = new URL(pathname, base);
  if (token) url.searchParams.set("token", token);
  return url.toString();
}

function requestMeta(req) {
  return {
    ip_address: String(req?.headers?.["x-forwarded-for"] || "").split(",")[0].trim() || req?.socket?.remoteAddress || req?.ip || "",
    user_agent: req?.headers?.["user-agent"] || "",
  };
}

function createOneTimeTokenRecord(db, collectionName, user, req, ttlMs) {
  const auth = getAuthState(db);
  const token = makeOneTimeToken();
  const now = new Date().toISOString();
  const record = {
    id: crypto.randomUUID(),
    user_id: user.id,
    user_email: user.email,
    token_hash: makeTokenHash(token),
    expires_at: new Date(Date.now() + ttlMs).toISOString(),
    used_at: null,
    created_at: now,
    updated_at: now,
    ...requestMeta(req),
  };
  auth[collectionName].push(record);
  return { token, record };
}

async function auditAuth(db, req, action, entity_id, metadata) {
  await writeAuditLog(db, {
    actor: req.authenticatedUser || req.user || { email: "anonymous" },
    action,
    entity_type: "Auth",
    entity_id,
    req,
    metadata,
  });
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
        await auditAuth(db, req, "login_failed", user.id, { reason: "bad_password", email });
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
  await auditAuth(db, req, "login", user.id, { email });
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
  await auditAuth(db, req, "logout", undefined, { revoked: result.revoked });
  await writeDb(db);
  res.json(result);
});

router.post("/forgot-password", resetLimiter, async (req, res) => {
  const db = await readDb();
  const email = normalizeEmail(req.body.email);
  const generic = { message: "If that email exists, password reset instructions have been sent." };
  if (!email) return res.json(generic);

  const user = (db.entities.User || []).find((item) => item.email?.toLowerCase() === email);
  if (user) {
    const { token } = createOneTimeTokenRecord(db, "password_reset_tokens", user, req, 60 * 60 * 1000);
    const resetUrl = absoluteFrontendUrl("/ResetPassword", token);
    await sendTransactionalEmail({
      to: user.email,
      subject: "Reset your Phakathi Flow password",
      text: `Use this link to reset your Phakathi Flow password. It expires in 1 hour: ${resetUrl}`,
      metadata: { type: "password-reset", user_id: user.id },
    });
    await auditAuth(db, req, "password_reset_requested", user.id, { email });
  } else {
    await auditAuth(db, req, "password_reset_requested_unknown_email", undefined, { email });
  }

  await writeDb(db);
  res.json(generic);
});

router.post("/reset-password", resetLimiter, async (req, res) => {
  const db = await readDb();
  const token = String(req.body.token || "");
  const password = String(req.body.password || "");
  if (!token) return res.status(400).json({ message: "Reset token is required." });
  if (!isStrongEnoughPassword(password)) {
    return res.status(400).json({ message: "Password must be at least 8 characters." });
  }

  const auth = getAuthState(db);
  const tokenHash = makeTokenHash(token);
  const record = auth.password_reset_tokens.find((item) => item.token_hash === tokenHash);
  if (!record || record.used_at || new Date(record.expires_at).getTime() <= Date.now()) {
    return res.status(400).json({ message: "Reset token is invalid or expired." });
  }

  const user = (db.entities.User || []).find((item) => item.id === record.user_id || item.email === record.user_email);
  if (!user) return res.status(400).json({ message: "Reset token is invalid or expired." });

  user.password_hash = hashPassword(password);
  user.auth_provider = "local_password";
  user.password_set_date = new Date().toISOString();
  user.updated_date = new Date().toISOString();
  record.used_at = new Date().toISOString();
  record.updated_at = record.used_at;
  auth.refresh_tokens = (auth.refresh_tokens || []).map((refreshToken) => (
    refreshToken.user_email === user.email
      ? { ...refreshToken, revoked_at: refreshToken.revoked_at || record.used_at, updated_at: record.used_at }
      : refreshToken
  ));

  await syncUserToRelational(user);
  await auditAuth(db, req, "password_reset_completed", user.id, { email: user.email });
  await writeDb(db);
  res.json({ ok: true, message: "Password has been reset. Please sign in again." });
});

router.post("/send-verification", requireAuth, resetLimiter, async (req, res) => {
  const db = await readDb();
  const user = (db.entities.User || []).find((item) => item.id === req.authenticatedUser.id || item.email === req.authenticatedUser.email);
  if (!user) return res.status(404).json({ message: "User not found." });
  if (user.email_verified_at) return res.json({ ok: true, message: "Email already verified." });

  const { token } = createOneTimeTokenRecord(db, "email_verification_tokens", user, req, 24 * 60 * 60 * 1000);
  const verifyUrl = absoluteFrontendUrl("/VerifyEmail", token);
  await sendTransactionalEmail({
    to: user.email,
    subject: "Verify your Phakathi Flow email",
    text: `Verify your Phakathi Flow email using this link. It expires in 24 hours: ${verifyUrl}`,
    metadata: { type: "email-verification", user_id: user.id },
  });
  await auditAuth(db, req, "email_verification_requested", user.id, { email: user.email });
  await writeDb(db);
  res.json({ ok: true, message: "Verification instructions sent." });
});

router.post("/verify-email", resetLimiter, async (req, res) => {
  const db = await readDb();
  const token = String(req.body.token || "");
  if (!token) return res.status(400).json({ message: "Verification token is required." });

  const auth = getAuthState(db);
  const tokenHash = makeTokenHash(token);
  const record = auth.email_verification_tokens.find((item) => item.token_hash === tokenHash);
  if (!record || record.used_at || new Date(record.expires_at).getTime() <= Date.now()) {
    return res.status(400).json({ message: "Verification token is invalid or expired." });
  }

  const user = (db.entities.User || []).find((item) => item.id === record.user_id || item.email === record.user_email);
  if (!user) return res.status(400).json({ message: "Verification token is invalid or expired." });

  const now = new Date().toISOString();
  user.email_verified_at = now;
  user.updated_date = now;
  record.used_at = now;
  record.updated_at = now;
  await syncUserToRelational(user);
  await auditAuth(db, req, "email_verified", user.id, { email: user.email });
  await writeDb(db);
  res.json({ ok: true, message: "Email verified." });
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
