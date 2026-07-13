import "../config/env.js";
import crypto from "node:crypto";

const TOKEN_ALGORITHM = "HS256";
const TOKEN_TTL_SECONDS = Number(process.env.AUTH_TOKEN_TTL_SECONDS || 60 * 60 * 12);
const PBKDF2_ITERATIONS = Number(process.env.PASSWORD_HASH_ITERATIONS || 210000);
const PBKDF2_KEYLEN = 32;
const PBKDF2_DIGEST = "sha256";

const fallbackJwtSecret = "phakathi-flow-local-office-pilot-change-this-secret";

export function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    console.warn("JWT_SECRET is not configured. Using local office-pilot fallback secret; set JWT_SECRET in .env.local before wider testing.");
  }
  return process.env.JWT_SECRET || fallbackJwtSecret;
}

function base64UrlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signTokenInput(input) {
  return crypto
    .createHmac("sha256", getJwtSecret())
    .update(input)
    .digest("base64url");
}

export function makeSignedToken(user) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64UrlJson({ alg: TOKEN_ALGORITHM, typ: "JWT" });
  const payload = base64UrlJson({
    sub: user.id,
    email: user.email,
    role: user.role || "user",
    iat: issuedAt,
    exp: issuedAt + TOKEN_TTL_SECONDS,
  });
  const signature = signTokenInput(`${header}.${payload}`);
  return `${header}.${payload}.${signature}`;
}

export function verifySignedToken(token = "") {
  const parts = String(token).split(".");
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const expected = signTokenInput(`${header}.${payload}`);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("base64url");
  const hash = crypto.pbkdf2Sync(String(password), salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString("base64url");
  return `pbkdf2:${PBKDF2_DIGEST}:${PBKDF2_ITERATIONS}:${salt}:${hash}`;
}

export function verifyPassword(password, storedHash = "") {
  const [scheme, digest, iterationsRaw, salt, hash] = String(storedHash).split(":");
  if (scheme !== "pbkdf2" || !digest || !iterationsRaw || !salt || !hash) return false;
  const iterations = Number(iterationsRaw);
  const candidate = crypto.pbkdf2Sync(String(password), salt, iterations, PBKDF2_KEYLEN, digest).toString("base64url");
  const candidateBuffer = Buffer.from(candidate);
  const hashBuffer = Buffer.from(hash);
  return candidateBuffer.length === hashBuffer.length && crypto.timingSafeEqual(candidateBuffer, hashBuffer);
}

export function sanitizeUser(user = {}) {
  const { password_hash, password_reset_token, ...safeUser } = user;
  return safeUser;
}

export function isStrongEnoughPassword(password = "") {
  return typeof password === "string" && password.length >= 8;
}
