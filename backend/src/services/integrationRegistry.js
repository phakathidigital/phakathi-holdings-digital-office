const INTEGRATIONS = [
  {
    id: "openai",
    name: "OpenAI",
    category: "ai",
    requiredEnv: ["OPENAI_API_KEY"],
    optionalEnv: ["OPENAI_MEETING_MODEL", "OPENAI_MODEL"],
    capabilities: ["meeting_transcript_analysis", "structured_summaries", "action_items", "kanban_task_extraction"],
  },
  {
    id: "email",
    name: "Transactional Email",
    category: "communications",
    requiredEnvAny: [["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD"], ["EMAIL_PROVIDER_API_KEY"]],
    optionalEnv: ["SMTP_FROM"],
    capabilities: ["office_notifications", "meeting_notes", "performance_hr_alerts"],
  },
  {
    id: "sms",
    name: "SMS Provider",
    category: "communications",
    requiredEnv: ["SMS_PROVIDER_API_KEY"],
    capabilities: ["urgent_alerts", "offline_reminders"],
  },
  {
    id: "sage",
    name: "Sage Business Cloud",
    category: "finance",
    requiredEnv: ["SAGE_API_URL", "SAGE_API_KEY"],
    capabilities: ["payroll_export", "journal_export", "finance_sync"],
  },
  {
    id: "microsoft365",
    name: "Microsoft 365 / Graph",
    category: "productivity",
    requiredEnv: ["MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET", "MICROSOFT_TENANT_ID"],
    capabilities: ["calendar_sync", "sso_future", "outlook_meetings"],
  },
  {
    id: "google",
    name: "Google Workspace / Drive",
    category: "productivity",
    requiredEnv: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    capabilities: ["drive_sync", "document_import", "dam_mapping"],
  },
  {
    id: "push",
    name: "Web Push",
    category: "notifications",
    requiredEnv: ["VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT"],
    capabilities: ["browser_push", "service_worker_notifications", "scheduled_reminders"],
  },
  {
    id: "netlify",
    name: "Netlify Deployment",
    category: "deployment",
    requiredEnv: ["URL"],
    optionalEnv: ["NETLIFY_SITE_ID", "NETLIFY_AUTH_TOKEN", "SCHEDULED_NOTIFICATION_SECRET"],
    capabilities: ["static_web", "serverless_api", "scheduled_notifications"],
  },
  {
    id: "database",
    name: "PostgreSQL",
    category: "data",
    requiredEnv: ["DATABASE_URL"],
    capabilities: ["production_storage", "crm", "sales", "auth", "audit"],
  },
];

function hasEnv(key) {
  return Boolean(String(process.env[key] || "").trim());
}

function requirementStatus(integration) {
  const required = integration.requiredEnv || [];
  const missing = required.filter((key) => !hasEnv(key));
  const anyGroups = integration.requiredEnvAny || [];
  const missingGroups = anyGroups
    .map((group) => ({ group, satisfied: group.every(hasEnv) }))
    .filter((item) => !item.satisfied)
    .map((item) => item.group);
  const anySatisfied = !anyGroups.length || missingGroups.length < anyGroups.length;
  const configured = missing.length === 0 && anySatisfied;
  return {
    configured,
    missing,
    missing_any_of: configured ? [] : missingGroups,
  };
}

export function listIntegrationStatuses() {
  return INTEGRATIONS.map((integration) => {
    const requirements = requirementStatus(integration);
    return {
      id: integration.id,
      name: integration.name,
      category: integration.category,
      capabilities: integration.capabilities,
      status: requirements.configured ? "configured" : "not_configured",
      enabled: requirements.configured,
      requirements,
      optional_configured: (integration.optionalEnv || []).filter(hasEnv),
    };
  });
}

export function getAiCapabilityStatus() {
  const openai = listIntegrationStatuses().find((item) => item.id === "openai");
  return {
    provider: openai?.enabled ? "openai" : "local_fallback",
    status: openai?.status || "not_configured",
    meeting_model: process.env.OPENAI_MEETING_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini",
    fallback_available: true,
    capabilities: {
      meeting_transcript_processing: true,
      structured_summaries: true,
      decisions: true,
      action_items: true,
      kanban_task_extraction: true,
    },
  };
}

export function getPlatformReadiness() {
  const integrations = listIntegrationStatuses();
  const byId = Object.fromEntries(integrations.map((item) => [item.id, item]));
  return {
    web: {
      status: "ready_for_office_pilot",
      checks: ["auth", "api", "scheduled_notifications", "service_worker", "responsive_ui"],
    },
    mobile: {
      status: "foundation_ready_not_packaged",
      target: "Capacitor Android/iOS/Huawei wrappers",
      blockers: ["native_push_provider_setup", "store_signing", "privacy_labels", "device_qa"],
    },
    desktop: {
      status: "foundation_ready_not_packaged",
      target: "Tauri desktop wrapper",
      blockers: ["tauri_scaffold", "code_signing", "auto_update_strategy", "windows_notification_qa"],
    },
    deployment: {
      status: byId.database?.enabled && byId.push?.enabled ? "production_foundation_configured" : "configuration_required",
      database: byId.database?.status,
      push: byId.push?.status,
      netlify: byId.netlify?.status,
    },
    security: {
      status: "baseline_hardened",
      checks: ["signed_tokens", "refresh_tokens", "security_headers", "cors_allowlist", "auth_required_for_integrations"],
    },
  };
}
