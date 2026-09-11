import "../src/config/env.js";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { dbPath } from "../src/config/paths.js";

const dryRun = process.argv.includes("--dry-run");
const prisma = dryRun ? null : new PrismaClient();
const report = {
  skipped: [],
  invalid: [],
  duplicates: [],
  relationshipErrors: [],
};

function toDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

async function upsertEntityRecord(entity_name, record) {
  const record_id = String(record.id || crypto.randomUUID());
  if (!record || typeof record !== "object") {
    report.invalid.push({ entity: entity_name, reason: "Record is not an object" });
    return;
  }
  if (dryRun) return;
  await prisma.entityRecord.upsert({
    where: {
      entity_name_record_id: {
        entity_name,
        record_id,
      },
    },
    create: {
      entity_name,
      record_id,
      data: { ...record, id: record_id },
    },
    update: {
      data: { ...record, id: record_id },
      deleted_at: null,
    },
  });
}

function inspectEntities(entities) {
  for (const [entityName, records] of Object.entries(entities)) {
    if (!Array.isArray(records)) {
      report.invalid.push({ entity: entityName, reason: "Entity collection is not an array" });
      continue;
    }
    const seen = new Set();
    for (const record of records) {
      if (!record || typeof record !== "object") {
        report.invalid.push({ entity: entityName, reason: "Record is not an object" });
        continue;
      }
      if (!record.id) {
        report.skipped.push({ entity: entityName, reason: "Missing id; importer will generate one for EntityRecord compatibility storage" });
        continue;
      }
      if (seen.has(record.id)) {
        report.duplicates.push({ entity: entityName, id: record.id });
      }
      seen.add(record.id);
    }
  }

  const ids = Object.fromEntries(
    Object.entries(entities).map(([name, records]) => [
      name,
      new Set(Array.isArray(records) ? records.map((record) => record?.id).filter(Boolean) : []),
    ]),
  );
  const relationshipChecks = [
    ["Task", "project_id", "Project"],
    ["Milestone", "project_id", "Project"],
    ["TimeLog", "task_id", "Task"],
    ["TimeLog", "project_id", "Project"],
    ["MeetingStudio", "project_id", "Project"],
    ["ClientContact", "client_account_id", "ClientAccount"],
    ["ClientInteraction", "client_account_id", "ClientAccount"],
    ["ClientNote", "client_account_id", "ClientAccount"],
    ["Lead", "client_account_id", "ClientAccount"],
    ["Opportunity", "client_account_id", "ClientAccount"],
    ["Opportunity", "lead_id", "Lead"],
    ["Proposal", "client_account_id", "ClientAccount"],
    ["Proposal", "opportunity_id", "Opportunity"],
    ["Deal", "client_account_id", "ClientAccount"],
    ["Deal", "opportunity_id", "Opportunity"],
    ["Deal", "proposal_id", "Proposal"],
    ["DealProductService", "deal_id", "Deal"],
    ["ClientActivity", "client_account_id", "ClientAccount"],
  ];
  for (const [entity, field, target] of relationshipChecks) {
    for (const record of entities[entity] || []) {
      if (!record?.[field]) continue;
      if (!ids[target]?.has(record[field])) {
        report.relationshipErrors.push({
          entity,
          id: record.id,
          field,
          value: record[field],
          missingTarget: target,
        });
      }
    }
  }
}

async function upsertKnownTables(db) {
  const usersByEmail = new Map();
  for (const user of db.entities?.User || []) {
    if (!user.email) continue;
    if (!dryRun) {
      const saved = await prisma.user.upsert({
        where: { email: String(user.email).toLowerCase() },
        create: {
          id: user.id,
          email: String(user.email).toLowerCase(),
          full_name: user.full_name,
          role: user.role || "user",
          subsidiary: user.subsidiary,
          department: user.department,
          job_title: user.job_title,
          password_hash: user.password_hash,
          auth_provider: user.auth_provider,
          password_set_date: toDate(user.password_set_date),
          phone: user.phone,
          branding: user.branding,
          profile_image_url: user.profile_image_url,
          cover_image_url: user.cover_image_url,
          metadata: user.metadata,
        },
        update: {
          full_name: user.full_name,
          role: user.role || "user",
          subsidiary: user.subsidiary,
          department: user.department,
          job_title: user.job_title,
          password_hash: user.password_hash,
          auth_provider: user.auth_provider,
          password_set_date: toDate(user.password_set_date),
          phone: user.phone,
          branding: user.branding,
          profile_image_url: user.profile_image_url,
          cover_image_url: user.cover_image_url,
          metadata: user.metadata,
        },
      });
      usersByEmail.set(saved.email, saved);
    }
  }

  for (const profile of db.entities?.UserProfile || []) {
    const email = String(profile.user_email || "").toLowerCase();
    const user = usersByEmail.get(email);
    if (!user || dryRun) continue;
    await prisma.userProfile.upsert({
      where: { user_id: user.id },
      create: {
        user_id: user.id,
        user_email: email,
        full_name: profile.full_name,
        subsidiary: profile.subsidiary,
        department: profile.department,
        job_title: profile.job_title,
        role: profile.role,
        preferences: profile.preferences,
        privacy: profile.privacy,
        metadata: profile.metadata,
      },
      update: {
        user_email: email,
        full_name: profile.full_name,
        subsidiary: profile.subsidiary,
        department: profile.department,
        job_title: profile.job_title,
        role: profile.role,
        preferences: profile.preferences,
        privacy: profile.privacy,
        metadata: profile.metadata,
      },
    });
  }

  for (const notification of db.entities?.Notification || []) {
    if (!notification.id || dryRun) continue;
    await prisma.notification.upsert({
      where: { id: notification.id },
      create: {
        id: notification.id,
        title: notification.title || "Phakathi Flow",
        message: notification.message || "",
        type: notification.type || "general",
        priority: notification.priority || "low",
        target_users: notification.target_users,
        delivery_channels: notification.delivery_channels,
        preference_key: notification.preference_key,
        schedule_key: notification.schedule_key,
        related_entity_type: notification.related_entity_type,
        related_entity_id: notification.related_entity_id,
        metadata: notification.metadata,
        created_by: notification.created_by,
        is_archived: notification.is_archived === true,
      },
      update: {
        title: notification.title || "Phakathi Flow",
        message: notification.message || "",
        type: notification.type || "general",
        priority: notification.priority || "low",
        target_users: notification.target_users,
        delivery_channels: notification.delivery_channels,
        preference_key: notification.preference_key,
        schedule_key: notification.schedule_key,
        related_entity_type: notification.related_entity_type,
        related_entity_id: notification.related_entity_id,
        metadata: notification.metadata,
        created_by: notification.created_by,
        is_archived: notification.is_archived === true,
      },
    });
  }

  for (const subscription of db.entities?.PushSubscription || []) {
    if (!subscription.endpoint || dryRun) continue;
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      create: {
        id: subscription.id,
        user_email: subscription.user_email,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        device_label: subscription.device_label,
        user_agent: subscription.user_agent,
        enabled: subscription.enabled !== false,
        last_seen_at: toDate(subscription.last_seen_at),
      },
      update: {
        user_email: subscription.user_email,
        keys: subscription.keys,
        device_label: subscription.device_label,
        user_agent: subscription.user_agent,
        enabled: subscription.enabled !== false,
        last_seen_at: toDate(subscription.last_seen_at),
      },
    });
  }
}

async function main() {
  if (!dryRun && !process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for npm run db:import-local.");
  }

  const db = JSON.parse(await fs.readFile(dbPath, "utf8"));
  const entities = db.entities || {};
  inspectEntities(entities);
  const summary = Object.fromEntries(
    Object.entries(entities).map(([name, records]) => [name, Array.isArray(records) ? records.length : 0])
  );

  for (const [entityName, records] of Object.entries(entities)) {
    if (!Array.isArray(records)) continue;
    for (const record of records) {
      await upsertEntityRecord(entityName, record);
    }
  }

  if (!dryRun) {
    for (const [key, value] of Object.entries({
      events: db.events || [],
      emails: db.emails || [],
      sms: db.sms || [],
    })) {
      await prisma.appState.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      });
    }
  }

  await upsertKnownTables(db);

  console.log(JSON.stringify({
    ok: true,
    dryRun,
    importedFrom: dbPath,
    entityCounts: summary,
    report,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma?.$disconnect();
  });
