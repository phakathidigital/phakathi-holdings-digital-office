import crypto from "node:crypto";
import { makeRefreshToken, makeTokenHash, refreshTokenExpiryDate } from "../utils/authSecurity.js";

function getAuthState(db) {
  db.auth ||= {};
  db.auth.refresh_tokens ||= [];
  db.auth.sessions ||= [];
  return db.auth;
}

function requestMeta(req) {
  return {
    ip_address: String(req?.headers?.["x-forwarded-for"] || "").split(",")[0].trim() || req?.socket?.remoteAddress || req?.ip || "",
    user_agent: req?.headers?.["user-agent"] || "",
  };
}

export function createAuthSession(db, user, req) {
  const state = getAuthState(db);
  const now = new Date().toISOString();
  const sessionId = crypto.randomUUID();
  const familyId = crypto.randomUUID();
  const refreshToken = makeRefreshToken();
  const expiresAt = refreshTokenExpiryDate().toISOString();
  const meta = requestMeta(req);

  state.sessions.push({
    id: sessionId,
    user_email: user.email,
    created_at: now,
    updated_at: now,
    expires_at: expiresAt,
    revoked_at: null,
    ...meta,
  });
  state.refresh_tokens.push({
    id: crypto.randomUUID(),
    session_id: sessionId,
    family_id: familyId,
    user_email: user.email,
    token_hash: makeTokenHash(refreshToken),
    created_at: now,
    updated_at: now,
    expires_at: expiresAt,
    revoked_at: null,
    ...meta,
  });

  return { sessionId, refreshToken };
}

export function rotateRefreshToken(db, refreshToken, req) {
  const state = getAuthState(db);
  const tokenHash = makeTokenHash(refreshToken);
  const nowMs = Date.now();
  const existing = state.refresh_tokens.find((token) => token.token_hash === tokenHash);
  if (!existing || existing.revoked_at || new Date(existing.expires_at).getTime() <= nowMs) return null;
  const session = state.sessions.find((item) => item.id === existing.session_id);
  if (!session || session.revoked_at || new Date(session.expires_at).getTime() <= nowMs) return null;
  const user = db.entities?.User?.find((item) => item.email === existing.user_email);
  if (!user) return null;

  const now = new Date().toISOString();
  const nextRefreshToken = makeRefreshToken();
  const expiresAt = refreshTokenExpiryDate().toISOString();
  const meta = requestMeta(req);

  existing.revoked_at = now;
  existing.updated_at = now;
  session.updated_at = now;
  session.expires_at = expiresAt;

  state.refresh_tokens.push({
    id: crypto.randomUUID(),
    session_id: session.id,
    family_id: existing.family_id,
    user_email: user.email,
    token_hash: makeTokenHash(nextRefreshToken),
    created_at: now,
    updated_at: now,
    expires_at: expiresAt,
    revoked_at: null,
    ...meta,
  });

  return { user, sessionId: session.id, refreshToken: nextRefreshToken };
}

export function revokeRefreshToken(db, refreshToken) {
  const state = getAuthState(db);
  const tokenHash = makeTokenHash(refreshToken);
  const now = new Date().toISOString();
  const existing = state.refresh_tokens.find((token) => token.token_hash === tokenHash);
  if (!existing) return { revoked: false };
  existing.revoked_at = existing.revoked_at || now;
  existing.updated_at = now;
  const session = state.sessions.find((item) => item.id === existing.session_id);
  if (session) {
    session.revoked_at = session.revoked_at || now;
    session.updated_at = now;
  }
  return { revoked: true };
}
