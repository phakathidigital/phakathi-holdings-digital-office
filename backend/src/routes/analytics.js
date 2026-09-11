import express from "express";
import { nowStamped, readDb, writeDb } from "../config/database.js";
import { requireAuth } from "../middleware/auth.js";
import { getPlatformReadiness, listIntegrationStatuses } from "../services/integrationRegistry.js";

const router = express.Router();

router.use(requireAuth);

function visible(records = []) {
  return records.filter((record) => !record.deleted_at && !record.deleted_date);
}

router.get("/overview", async (_req, res) => {
  const db = await readDb();
  const entities = db.entities || {};
  const projects = visible(entities.Project || []);
  const tasks = visible(entities.Task || []);
  const notifications = visible(entities.Notification || []);
  const meetings = visible(entities.MeetingStudio || []);
  const opportunities = visible(entities.Opportunity || []);
  const proposals = visible(entities.Proposal || []);
  const deals = visible(entities.Deal || []);
  const events = db.events || [];
  const integrations = listIntegrationStatuses();

  res.json({
    summary: {
      projects: projects.length,
      tasks: tasks.length,
      completed_tasks: tasks.filter((task) => ["completed", "done"].includes(task.status)).length,
      meetings: meetings.length,
      notifications: notifications.length,
      unread_notifications: notifications.filter((item) => !item.read).length,
      opportunities: opportunities.length,
      proposals: proposals.length,
      deals: deals.length,
      tracked_events: events.length,
      configured_integrations: integrations.filter((item) => item.enabled).length,
    },
    work: {
      active_projects: projects.filter((project) => !["completed", "done", "cancelled"].includes(project.status)).length,
      overdue_tasks: tasks.filter((task) => task.due_date && new Date(task.due_date) < new Date() && !["completed", "done"].includes(task.status)).length,
    },
    growth: {
      pipeline_value: opportunities.reduce((sum, item) => sum + Number(item.value || 0), 0),
      weighted_pipeline: opportunities.reduce((sum, item) => sum + Number(item.weighted_value || 0), 0),
      proposal_value: proposals.reduce((sum, item) => sum + Number(item.proposal_value || 0), 0),
      deal_value: deals.reduce((sum, item) => sum + Number(item.value || 0), 0),
    },
    integrations,
    platform: getPlatformReadiness(),
  });
});

router.post("/track", async (req, res) => {
  const db = await readDb();
  db.events ||= [];
  db.events.push(nowStamped(req.body));
  await writeDb(db);
  res.json({ success: true });
});

export default router;
