import { nowStamped, writeDb } from "../config/database.js";
import { PERFORMANCE_NOTIFICATION_EMAILS } from "../config/officeContacts.js";
import { deliverNotification } from "./pushService.js";

const DEFAULT_CHANNELS = ["in_app", "browser_push"];

function uniq(values = []) {
  return [...new Set(values.filter(Boolean))];
}

export function normalizeNotification(notification = {}) {
  return {
    ...notification,
    delivery_channels: notification.delivery_channels?.length ? notification.delivery_channels : DEFAULT_CHANNELS,
    is_read_by: notification.is_read_by || [],
    acknowledged_by: notification.acknowledged_by || [],
    is_archived: notification.is_archived || false,
  };
}

async function createNotification(db, notification) {
  db.entities.Notification ||= [];
  const created = nowStamped(normalizeNotification(notification));
  db.entities.Notification.push(created);
  await deliverNotification(db, created);
  return created;
}

function queueEmail(db, email) {
  db.emails ||= [];
  db.emails.push(nowStamped(email));
}

function newlyAssignedEmail(before = {}, after = {}, field) {
  const previous = before?.[field] || "";
  const next = after?.[field] || "";
  return next && next !== previous ? next : "";
}

function newlyAddedEmails(before = {}, after = {}, field) {
  const previous = new Set(before?.[field] || []);
  return uniq(after?.[field] || []).filter((email) => !previous.has(email));
}

export async function handleEntityCreated(db, entityName, record) {
  if (entityName === "Task" && record.assigned_to) {
    await createNotification(db, {
      title: "✅ New task assigned",
      message: `You have been assigned: ${record.title}${record.due_date ? ` · Due ${record.due_date}` : ""}`,
      type: "general",
      priority: record.priority || "medium",
      target_users: [record.assigned_to],
      related_entity_type: "Task",
      related_entity_id: record.id,
      created_by: "system",
    });
  }

  if (entityName === "Project" && record.team_members?.length) {
    await createNotification(db, {
      title: "📁 Added to project",
      message: `You have been added to project: ${record.name}`,
      type: "general",
      priority: record.priority || "medium",
      target_users: uniq(record.team_members),
      related_entity_type: "Project",
      related_entity_id: record.id,
      created_by: "system",
    });
  }

  if (entityName === "Ticket") {
    const targets = uniq([record.submitter_email, record.assigned_to_email]);
    if (targets.length) {
      await createNotification(db, {
        title: `🎫 Ticket created: ${record.title}`,
        message: `${record.ticket_number ? `${record.ticket_number} · ` : ""}${record.category || "Support"} ticket is now open.`,
        type: "general",
        priority: record.priority || "medium",
        target_users: targets,
        related_entity_type: "Ticket",
        related_entity_id: record.id,
        created_by: "system",
      });
    }
  }

  if (entityName === "HRDocument" && record.owner_email) {
    await createNotification(db, {
      title: "📁 DAM document received",
      message: `Your document "${record.title}" is in the Document Vault${record.status ? ` with status ${record.status.replaceAll("_", " ")}` : ""}.`,
      type: "dam_reminder",
      priority: "medium",
      target_users: [record.owner_email],
      related_entity_type: "HRDocument",
      related_entity_id: record.id,
      created_by: "system",
    });
  }

  if (entityName === "PerformanceReview") {
    const targets = uniq([record.employee_email, record.manager_email, ...PERFORMANCE_NOTIFICATION_EMAILS]);
    if (targets.length) {
      await createNotification(db, {
        title: "⭐ Performance review created",
        message: `${record.employee_name || record.employee_email}'s ${record.review_period || ""} performance review is open for action.`,
        type: "performance",
        priority: "high",
        target_users: targets,
        related_entity_type: "PerformanceReview",
        related_entity_id: record.id,
        created_by: "system",
      });
    }
    for (const hrEmail of PERFORMANCE_NOTIFICATION_EMAILS) {
      queueEmail(db, {
        to: hrEmail,
        subject: `Performance Review Created: ${record.employee_name || record.employee_email}`,
        body: `A performance review has been created.\n\nEmployee: ${record.employee_name || record.employee_email}\nEmployee email: ${record.employee_email || "Not specified"}\nPeriod: ${record.review_period || "Not specified"}\nManager: ${record.manager_name || record.manager_email || "Not specified"}\nStatus: ${record.status || "Not specified"}\n\nOpen Phakathi Flow to review the record.`,
        related_entity_type: "PerformanceReview",
        related_entity_id: record.id,
        created_by: "system",
      });
    }
    await writeDb(db);
  }
}

export async function handleEntityUpdated(db, entityName, before, after) {
  if (entityName === "Task") {
    const assignedTo = newlyAssignedEmail(before, after, "assigned_to");
    if (assignedTo) {
      await createNotification(db, {
        title: "✅ Task assigned to you",
        message: `${after.title}${after.due_date ? ` · Due ${after.due_date}` : ""}`,
        type: "general",
        priority: after.priority || "medium",
        target_users: [assignedTo],
        related_entity_type: "Task",
        related_entity_id: after.id,
        created_by: "system",
      });
    }
  }

  if (entityName === "Asset") {
    const assignedTo = newlyAssignedEmail(before, after, "assigned_to_email");
    if (assignedTo) {
      await createNotification(db, {
        title: "💻 Asset assigned to you",
        message: `${after.name} has been assigned to you. Please confirm receipt with IT if required.`,
        type: "general",
        priority: "medium",
        target_users: [assignedTo],
        related_entity_type: "Asset",
        related_entity_id: after.id,
        created_by: "system",
      });
    }
  }

  if (entityName === "Ticket") {
    const assignedTo = newlyAssignedEmail(before, after, "assigned_to_email");
    if (assignedTo) {
      await createNotification(db, {
        title: "🎫 Ticket assigned to you",
        message: `${after.ticket_number ? `${after.ticket_number} · ` : ""}${after.title}`,
        type: "general",
        priority: after.priority || "medium",
        target_users: [assignedTo],
        related_entity_type: "Ticket",
        related_entity_id: after.id,
        created_by: "system",
      });
    }

    if (before.status !== after.status && after.submitter_email) {
      await createNotification(db, {
        title: "🎫 Ticket status updated",
        message: `${after.title} is now ${after.status?.replaceAll("_", " ") || "updated"}.`,
        type: "general",
        priority: after.priority || "medium",
        target_users: [after.submitter_email],
        related_entity_type: "Ticket",
        related_entity_id: after.id,
        created_by: "system",
      });
    }
  }

  if (entityName === "Project") {
    const newMembers = newlyAddedEmails(before, after, "team_members");
    if (newMembers.length) {
      await createNotification(db, {
        title: "📁 Added to project",
        message: `You have been added to project: ${after.name}`,
        type: "general",
        priority: after.priority || "medium",
        target_users: newMembers,
        related_entity_type: "Project",
        related_entity_id: after.id,
        created_by: "system",
      });
    }
  }

  if (entityName === "HRDocument") {
    const newlyShared = newlyAddedEmails(before, after, "shared_with");
    if (newlyShared.length) {
      await createNotification(db, {
        title: "📄 Document shared with you",
        message: `${after.owner_name || "A colleague"} shared "${after.title}" with you in the Document Vault.`,
        type: "dam_reminder",
        priority: "medium",
        target_users: newlyShared,
        related_entity_type: "HRDocument",
        related_entity_id: after.id,
        created_by: "system",
      });
    }

    if (before.status !== after.status && after.owner_email) {
      await createNotification(db, {
        title: `📁 Document ${after.status?.replaceAll("_", " ") || "updated"}`,
        message: `"${after.title}" was marked as ${after.status?.replaceAll("_", " ") || "updated"}.`,
        type: "dam_reminder",
        priority: after.status === "rejected" ? "high" : "medium",
        target_users: [after.owner_email],
        related_entity_type: "HRDocument",
        related_entity_id: after.id,
        created_by: "system",
      });
    }
  }

  if (entityName === "PerformanceReview") {
    const statusChanged = before.status !== after.status;
    const managerRatingChanged = before.manager_rating !== after.manager_rating;
    const selfRatingChanged = before.self_rating !== after.self_rating;
    if (statusChanged || managerRatingChanged || selfRatingChanged) {
      const targets = uniq([after.employee_email, after.manager_email, ...PERFORMANCE_NOTIFICATION_EMAILS]);
      await createNotification(db, {
        title: "⭐ Performance review updated",
        message: `${after.employee_name || after.employee_email}'s ${after.review_period || ""} review is now ${after.status?.replaceAll("_", " ") || "updated"}.`,
        type: "performance",
        priority: statusChanged ? "high" : "medium",
        target_users: targets,
        related_entity_type: "PerformanceReview",
        related_entity_id: after.id,
        created_by: "system",
      });
      for (const hrEmail of PERFORMANCE_NOTIFICATION_EMAILS) {
        queueEmail(db, {
          to: hrEmail,
          subject: `Performance Review Updated: ${after.employee_name || after.employee_email}`,
          body: `A performance review has been updated.\n\nEmployee: ${after.employee_name || after.employee_email}\nEmployee email: ${after.employee_email || "Not specified"}\nPeriod: ${after.review_period || "Not specified"}\nManager: ${after.manager_name || after.manager_email || "Not specified"}\nStatus: ${after.status || "Not specified"}\nSelf rating: ${after.self_rating || "Not captured"}\nManager rating: ${after.manager_rating || "Not captured"}\n\nOpen Phakathi Flow to review the record.`,
          related_entity_type: "PerformanceReview",
          related_entity_id: after.id,
          created_by: "system",
        });
      }
      await writeDb(db);
    }
  }
}
