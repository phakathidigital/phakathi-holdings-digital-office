import { runNotificationScan } from "../../backend/src/services/scheduler.js";

function getEnv(name) {
  return globalThis.Netlify?.env?.get?.(name) || process.env[name];
}

export default async (req) => {
  const configuredApiUrl = getEnv("PHAKATHI_API_BASE_URL");
  const schedulerSecret = getEnv("SCHEDULED_NOTIFICATION_SECRET");

  if (configuredApiUrl) {
    const response = await fetch(`${configuredApiUrl.replace(/\/$/, "")}/api/push/run-scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(schedulerSecret ? { "x-scheduler-secret": schedulerSecret } : {}),
      },
      body: JSON.stringify({ source: "netlify-scheduled-function" }),
    });
    const text = await response.text();
    return new Response(text || JSON.stringify({ ok: response.ok }), {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") || "application/json" },
    });
  }

  const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const date = body.date ? new Date(body.date) : new Date();
  const created = await runNotificationScan(date);
  return Response.json({
    ok: true,
    mode: "local-json-store",
    created: created.length,
    note: "For production durability, set PHAKATHI_API_BASE_URL to a deployed backend/API with persistent storage.",
  });
};

export const config = {
  schedule: "0 7,11,14 * * *",
};

