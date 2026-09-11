const buckets = new Map();

function clientKey(req, scope) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return `${scope}:${forwarded || req.socket?.remoteAddress || req.ip || "unknown"}`;
}

export function rateLimit({ windowMs = 60_000, max = 30, scope = "global" } = {}) {
  return (req, res, next) => {
    const key = clientKey(req, scope);
    const now = Date.now();
    const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };
    if (bucket.resetAt <= now) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }
    bucket.count += 1;
    buckets.set(key, bucket);
    res.setHeader("RateLimit-Limit", String(max));
    res.setHeader("RateLimit-Remaining", String(Math.max(0, max - bucket.count)));
    res.setHeader("RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));
    if (bucket.count > max) {
      return res.status(429).json({ message: "Too many requests. Please wait and try again." });
    }
    next();
  };
}
