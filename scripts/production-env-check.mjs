import "../backend/src/config/env.js";

const definitions = [
  ["APPLICATION", "APP_PUBLIC_URL", "REQUIRED", "Public frontend URL used in password reset and email verification links."],
  ["APPLICATION", "API_BASE_URL", "OPTIONAL", "External API URL when different from the frontend origin."],
  ["DATABASE", "PHAKATHI_STORAGE", "REQUIRED", "Set to postgres for production."],
  ["DATABASE", "DATABASE_URL", "REQUIRED", "PostgreSQL connection string."],
  ["AUTH", "JWT_SECRET", "REQUIRED", "32+ character access-token signing secret."],
  ["AUTH", "JWT_REFRESH_SECRET", "REQUIRED", "32+ character refresh/reset token signing secret."],
  ["AUTH", "AUTH_TOKEN_TTL_SECONDS", "OPTIONAL", "Access-token TTL override."],
  ["AUTH", "AUTH_REFRESH_TOKEN_TTL_SECONDS", "OPTIONAL", "Refresh-token TTL override."],
  ["CORS", "CORS_ORIGINS", "REQUIRED", "Comma-separated allowed frontend origins."],
  ["STORAGE", "STORAGE_PROVIDER", "REQUIRED", "local, netlify-blobs, or s3."],
  ["STORAGE", "STORAGE_BUCKET", "PROVIDER-SPECIFIC", "Required when STORAGE_PROVIDER=s3."],
  ["STORAGE", "STORAGE_REGION", "PROVIDER-SPECIFIC", "Required when STORAGE_PROVIDER=s3."],
  ["STORAGE", "STORAGE_ACCESS_KEY", "PROVIDER-SPECIFIC", "Required when STORAGE_PROVIDER=s3."],
  ["STORAGE", "STORAGE_SECRET_KEY", "PROVIDER-SPECIFIC", "Required when STORAGE_PROVIDER=s3."],
  ["EMAIL", "EMAIL_PROVIDER", "OPTIONAL", "smtp, resend, or future provider name."],
  ["EMAIL", "SMTP_HOST", "PROVIDER-SPECIFIC", "Required for SMTP delivery."],
  ["EMAIL", "SMTP_PORT", "PROVIDER-SPECIFIC", "Required for SMTP delivery."],
  ["EMAIL", "SMTP_USER", "PROVIDER-SPECIFIC", "Required when SMTP auth is enabled."],
  ["EMAIL", "SMTP_PASSWORD", "PROVIDER-SPECIFIC", "Required when SMTP auth is enabled."],
  ["EMAIL", "SMTP_FROM", "PROVIDER-SPECIFIC", "Sender address for SMTP/provider email."],
  ["EMAIL", "EMAIL_PROVIDER_API_KEY", "PROVIDER-SPECIFIC", "Provider API key if using API email delivery."],
  ["EMAIL", "RESEND_API_KEY", "PROVIDER-SPECIFIC", "Required when EMAIL_PROVIDER=resend."],
  ["PUSH", "VAPID_PUBLIC_KEY", "REQUIRED", "Public browser push key."],
  ["PUSH", "VAPID_PRIVATE_KEY", "REQUIRED", "Private browser push key."],
  ["PUSH", "VAPID_SUBJECT", "REQUIRED", "VAPID subject, usually a mailto address."],
  ["AI", "OPENAI_API_KEY", "PROVIDER-SPECIFIC", "Required only when OpenAI-backed AI is enabled."],
  ["AI", "OPENAI_MEETING_MODEL", "OPTIONAL", "Meeting Studio model override."],
  ["SCHEDULER", "SCHEDULED_NOTIFICATION_SECRET", "REQUIRED", "Secret used by scheduled notification function calls."],
  ["SCHEDULER", "PHAKATHI_API_BASE_URL", "PROVIDER-SPECIFIC", "Required when scheduled jobs call a deployed API URL."],
  ["NETLIFY", "NETLIFY_SITE_ID", "PROVIDER-SPECIFIC", "Required only for Netlify CLI/API operations."],
  ["NETLIFY", "NETLIFY_AUTH_TOKEN", "PROVIDER-SPECIFIC", "Required only for Netlify CLI/API operations."],
  ["SAGE", "SAGE_API_URL", "OPTIONAL", "Required only when Sage integration is enabled."],
  ["SAGE", "SAGE_API_KEY", "OPTIONAL", "Required only when Sage integration is enabled."],
  ["MICROSOFT", "MICROSOFT_CLIENT_ID", "OPTIONAL", "Required only when Microsoft integration is enabled."],
  ["MICROSOFT", "MICROSOFT_CLIENT_SECRET", "OPTIONAL", "Required only when Microsoft integration is enabled."],
  ["MICROSOFT", "MICROSOFT_TENANT_ID", "OPTIONAL", "Required only when Microsoft integration is enabled."],
  ["GOOGLE", "GOOGLE_CLIENT_ID", "OPTIONAL", "Required only when Google integration is enabled."],
  ["GOOGLE", "GOOGLE_CLIENT_SECRET", "OPTIONAL", "Required only when Google integration is enabled."],
];

function present(name) {
  const value = process.env[name];
  return Boolean(value && String(value).trim());
}

function providerRequired(name) {
  const storage = process.env.STORAGE_PROVIDER;
  const emailProvider = process.env.EMAIL_PROVIDER;
  if (["STORAGE_BUCKET", "STORAGE_REGION", "STORAGE_ACCESS_KEY", "STORAGE_SECRET_KEY"].includes(name)) {
    return storage === "s3";
  }
  if (name.startsWith("SMTP_")) return emailProvider === "smtp" || Boolean(process.env.SMTP_HOST);
  if (name === "RESEND_API_KEY") return emailProvider === "resend";
  if (name === "EMAIL_PROVIDER_API_KEY") return Boolean(emailProvider && !["smtp", "resend"].includes(emailProvider));
  if (name === "PHAKATHI_API_BASE_URL") return Boolean(process.env.NETLIFY === "true");
  if (name === "OPENAI_API_KEY") return process.env.AI_ENABLED === "true";
  return false;
}

const rows = definitions.map(([group, name, requirement, description]) => ({
  group,
  name,
  requirement,
  present: present(name),
  requiredNow: requirement === "REQUIRED" || (requirement === "PROVIDER-SPECIFIC" && providerRequired(name)),
  description,
}));

const missing = rows.filter((row) => row.requiredNow && !row.present);

console.log(JSON.stringify({
  ok: missing.length === 0,
  storage: process.env.PHAKATHI_STORAGE || "not-set",
  checkedAt: new Date().toISOString(),
  missing: missing.map(({ group, name, requirement }) => ({ group, name, requirement })),
  variables: rows.map(({ group, name, requirement, present, requiredNow }) => ({ group, name, requirement, present, requiredNow })),
}, null, 2));

if (missing.length) process.exitCode = 1;
