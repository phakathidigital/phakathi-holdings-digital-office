import { getPrismaClient, nowStamped, shouldUsePostgresPersistence, writeDb } from "../config/database.js";

export async function writeAuditLog(db, {
  actor,
  action,
  entity_type,
  entity_id,
  old_value,
  new_value,
  reason,
  req,
  metadata,
}) {
  const payload = {
    actor_email: actor?.email || "system",
    actor_user_id: actor?.id,
    action,
    entity_type,
    entity_id,
    old_value,
    new_value,
    reason,
    ip_address: req?.ip,
    user_agent: req?.get?.("user-agent"),
    metadata,
  };

  if (shouldUsePostgresPersistence()) {
    const prisma = await getPrismaClient();
    await prisma.auditLog.create({ data: payload });
    return;
  }

  if (db) {
    db.entities ||= {};
    db.entities.AuditLog ||= [];
    db.entities.AuditLog.push(nowStamped(payload));
    await writeDb(db);
  }
}
