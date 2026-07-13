import { readDb } from "../config/database.js";
import { makeSignedToken, sanitizeUser, verifySignedToken } from "../utils/authSecurity.js";

export function makeToken(user) {
  return makeSignedToken(user);
}

export function userFromToken(req, db) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  const payload = verifySignedToken(token);
  if (!payload?.email) return null;
  return db.entities.User?.find((user) => user.email === payload.email) || null;
}

export async function requireAuth(req, res, next) {
  const db = await readDb();
  const user = userFromToken(req, db);
  if (!user) return res.status(401).json({ message: "Not authenticated" });
  req.db = db;
  req.user = sanitizeUser(user);
  req.authenticatedUser = user;
  next();
}
