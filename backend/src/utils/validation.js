import { ApiError } from "./apiResponse.js";

export function requireString(body, key, label = key) {
  const value = String(body?.[key] || "").trim();
  if (!value) throw new ApiError(400, "validation_error", `${label} is required.`, { field: key });
  return value;
}

export function optionalString(body, key) {
  const value = body?.[key];
  if (value === undefined || value === null) return undefined;
  return String(value).trim();
}

export function pickAllowed(body = {}, allowed = []) {
  const result = {};
  for (const key of allowed) {
    if (body[key] !== undefined) result[key] = body[key];
  }
  return result;
}

export function toSlug(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
