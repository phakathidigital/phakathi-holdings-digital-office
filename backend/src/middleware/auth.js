import { readDb } from "../config/database.js";

export function makeToken(user) {
  return Buffer.from(JSON.stringify({ email: user.email })).toString("base64url");
}

export function userFromToken(req, db) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  try {
    const payload = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    return db.entities.User?.find((user) => user.email === payload.email) || null;
  } catch {
    return null;
  }
}

export async function requireAuth(req, res, next) {
  const db = await readDb();
  const user = userFromToken(req, db);
  if (!user) return res.status(401).json({ message: "Not authenticated" });
  req.db = db;
  req.user = user;
  next();
}
