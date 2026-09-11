import "./env.js";

const LOCAL_ORIGINS = new Set([
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  "http://127.0.0.1:4173",
  "http://localhost:4173",
]);

function splitCsv(value = "") {
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function isProductionRuntime() {
  return process.env.NODE_ENV === "production" || process.env.NETLIFY === "true";
}

export function getAllowedCorsOrigins() {
  const configured = splitCsv(process.env.CORS_ORIGINS);
  const derived = [
    process.env.URL,
    process.env.DEPLOY_URL,
    process.env.DEPLOY_PRIME_URL,
  ].filter(Boolean);
  if (configured.length || derived.length) return new Set([...configured, ...derived]);
  if (isProductionRuntime()) return new Set();
  return LOCAL_ORIGINS;
}

export function corsOptions() {
  const allowedOrigins = getAllowedCorsOrigins();
  return {
    credentials: true,
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      if (!isProductionRuntime() && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS origin not allowed: ${origin}`));
    },
  };
}

export function securityHeaders(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), camera=(), microphone=()");
  if (isProductionRuntime()) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
}

export function assertProductionConfig() {
  if (!isProductionRuntime()) return;
  const missing = [];
  if (process.env.PHAKATHI_STORAGE === "postgres" && !process.env.DATABASE_URL) missing.push("DATABASE_URL");
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) missing.push("JWT_SECRET (32+ chars)");
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) missing.push("JWT_REFRESH_SECRET (32+ chars)");
  if (!process.env.VAPID_PUBLIC_KEY) missing.push("VAPID_PUBLIC_KEY");
  if (!process.env.VAPID_PRIVATE_KEY) missing.push("VAPID_PRIVATE_KEY");
  if (!getAllowedCorsOrigins().size) missing.push("CORS_ORIGINS");
  if (missing.length) {
    throw new Error(`Production configuration is incomplete: ${missing.join(", ")}`);
  }
}
