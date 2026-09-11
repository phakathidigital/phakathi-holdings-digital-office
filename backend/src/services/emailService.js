import "../config/env.js";

export function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST ||
    process.env.EMAIL_PROVIDER_API_KEY ||
    process.env.RESEND_API_KEY
  );
}

export async function sendTransactionalEmail({ to, subject, text, html, metadata } = {}) {
  if (!to || !subject) {
    throw new Error("Email recipient and subject are required.");
  }

  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email provider is not configured.");
    }
    if (process.env.NODE_ENV !== "test") {
      console.info("[dev-email]", JSON.stringify({
        to,
        subject,
        text,
        html: html ? "[html omitted]" : undefined,
        metadata,
      }, null, 2));
    }
    return { provider: "development-log", queued: false };
  }

  // Provider implementation hook. SMTP/Resend credentials stay server-side and
  // should be wired here without changing callers.
  console.info("[email-provider-placeholder]", JSON.stringify({
    provider: process.env.EMAIL_PROVIDER_API_KEY ? "api" : "smtp",
    to,
    subject,
    metadata,
  }));
  return { provider: process.env.EMAIL_PROVIDER_API_KEY ? "api" : "smtp", queued: true };
}
