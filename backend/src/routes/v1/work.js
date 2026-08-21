import express from "express";
import { requirePermission } from "../../middleware/permissions.js";
import { asyncHandler, sendData } from "../../utils/apiResponse.js";
import { writeAuditLog } from "../../services/auditLogService.js";
import {
  WORK_ENTITIES,
  createWorkRecord,
  deleteWorkRecord,
  getWorkGraph,
  getWorkOverview,
  listWorkEntity,
  logTaskTime,
  moveTask,
  syncMeetingTasks,
  updateWorkRecord,
} from "../../services/v1/workService.js";

const router = express.Router();

function filtersFromQuery(query = {}) {
  return {
    subsidiary: query.subsidiary,
    portfolio_id: query.portfolio_id,
    project_id: query.project_id,
    okr_id: query.okr_id,
    assigned_to: query.assigned_to,
    status: query.status,
  };
}

async function audit(req, action, entityType, result, previous = undefined) {
  await writeAuditLog(req.db, {
    actor: req.authenticatedUser || req.user,
    action,
    entity_type: entityType,
    entity_id: result?.id || result?.meeting_id,
    old_value: previous,
    new_value: result,
    req,
  });
}

router.get(
  "/overview",
  requirePermission("projects.view"),
  asyncHandler(async (req, res) => {
    sendData(res, await getWorkOverview(filtersFromQuery(req.query)));
  }),
);

router.get(
  "/graph",
  requirePermission("projects.view"),
  asyncHandler(async (req, res) => {
    sendData(res, await getWorkGraph(filtersFromQuery(req.query)));
  }),
);

router.get(
  "/goals",
  requirePermission("projects.view"),
  asyncHandler(async (req, res) => {
    sendData(res, await listWorkEntity("goals", filtersFromQuery(req.query)));
  }),
);

router.post(
  "/goals",
  requirePermission("projects.create"),
  asyncHandler(async (req, res) => {
    const result = await createWorkRecord(WORK_ENTITIES.goals, req.body, req.user);
    await audit(req, "create_goal", "OKR", result);
    sendData(res, result, undefined, 201);
  }),
);

router.patch(
  "/goals/:id",
  requirePermission("projects.edit"),
  asyncHandler(async (req, res) => {
    const result = await updateWorkRecord(WORK_ENTITIES.goals, req.params.id, req.body, req.user);
    await audit(req, "update_goal", "OKR", result);
    sendData(res, result);
  }),
);

router.delete(
  "/goals/:id",
  requirePermission("projects.delete"),
  asyncHandler(async (req, res) => {
    const result = await deleteWorkRecord(WORK_ENTITIES.goals, req.params.id);
    await audit(req, "delete_goal", "OKR", result);
    sendData(res, result);
  }),
);

router.get(
  "/portfolios",
  requirePermission("projects.view"),
  asyncHandler(async (req, res) => {
    sendData(res, await listWorkEntity("portfolios", filtersFromQuery(req.query)));
  }),
);

router.post(
  "/portfolios",
  requirePermission("projects.create"),
  asyncHandler(async (req, res) => {
    const result = await createWorkRecord(WORK_ENTITIES.portfolios, req.body, req.user);
    await audit(req, "create_portfolio", "Portfolio", result);
    sendData(res, result, undefined, 201);
  }),
);

router.patch(
  "/portfolios/:id",
  requirePermission("projects.edit"),
  asyncHandler(async (req, res) => {
    const result = await updateWorkRecord(WORK_ENTITIES.portfolios, req.params.id, req.body, req.user);
    await audit(req, "update_portfolio", "Portfolio", result);
    sendData(res, result);
  }),
);

router.delete(
  "/portfolios/:id",
  requirePermission("projects.delete"),
  asyncHandler(async (req, res) => {
    const result = await deleteWorkRecord(WORK_ENTITIES.portfolios, req.params.id);
    await audit(req, "delete_portfolio", "Portfolio", result);
    sendData(res, result);
  }),
);

router.get(
  "/projects",
  requirePermission("projects.view"),
  asyncHandler(async (req, res) => {
    sendData(res, await listWorkEntity("projects", filtersFromQuery(req.query)));
  }),
);

router.post(
  "/projects",
  requirePermission("projects.create"),
  asyncHandler(async (req, res) => {
    const result = await createWorkRecord(WORK_ENTITIES.projects, req.body, req.user);
    await audit(req, "create_project", "Project", result);
    sendData(res, result, undefined, 201);
  }),
);

router.patch(
  "/projects/:id",
  requirePermission("projects.edit"),
  asyncHandler(async (req, res) => {
    const result = await updateWorkRecord(WORK_ENTITIES.projects, req.params.id, req.body, req.user);
    await audit(req, "update_project", "Project", result);
    sendData(res, result);
  }),
);

router.delete(
  "/projects/:id",
  requirePermission("projects.delete"),
  asyncHandler(async (req, res) => {
    const result = await deleteWorkRecord(WORK_ENTITIES.projects, req.params.id);
    await audit(req, "delete_project", "Project", result);
    sendData(res, result);
  }),
);

router.get(
  "/tasks",
  requirePermission("projects.view"),
  asyncHandler(async (req, res) => {
    sendData(res, await listWorkEntity("tasks", filtersFromQuery(req.query)));
  }),
);

router.post(
  "/tasks",
  requirePermission("projects.create"),
  asyncHandler(async (req, res) => {
    const result = await createWorkRecord(WORK_ENTITIES.tasks, req.body, req.user);
    await audit(req, "create_task", "Task", result);
    sendData(res, result, undefined, 201);
  }),
);

router.patch(
  "/tasks/:id",
  requirePermission("projects.edit"),
  asyncHandler(async (req, res) => {
    const result = await updateWorkRecord(WORK_ENTITIES.tasks, req.params.id, req.body, req.user);
    await audit(req, "update_task", "Task", result);
    sendData(res, result);
  }),
);

router.patch(
  "/tasks/:id/status",
  requirePermission("projects.edit"),
  asyncHandler(async (req, res) => {
    const result = await moveTask(req.params.id, req.body.status, req.user);
    await audit(req, "move_task", "Task", result);
    sendData(res, result);
  }),
);

router.delete(
  "/tasks/:id",
  requirePermission("projects.delete"),
  asyncHandler(async (req, res) => {
    const result = await deleteWorkRecord(WORK_ENTITIES.tasks, req.params.id);
    await audit(req, "delete_task", "Task", result);
    sendData(res, result);
  }),
);

router.get(
  "/kanban",
  requirePermission("projects.view"),
  asyncHandler(async (req, res) => {
    const tasks = await listWorkEntity("tasks", filtersFromQuery(req.query));
    sendData(res, {
      columns: {
        todo: tasks.filter((task) => !task.status || task.status === "todo"),
        in_progress: tasks.filter((task) => task.status === "in_progress"),
        completed: tasks.filter((task) => task.status === "completed" || task.status === "done"),
      },
    });
  }),
);

router.get(
  "/milestones",
  requirePermission("projects.view"),
  asyncHandler(async (req, res) => {
    sendData(res, await listWorkEntity("milestones", filtersFromQuery(req.query)));
  }),
);

router.post(
  "/milestones",
  requirePermission("projects.create"),
  asyncHandler(async (req, res) => {
    const result = await createWorkRecord(WORK_ENTITIES.milestones, req.body, req.user);
    await audit(req, "create_milestone", "Milestone", result);
    sendData(res, result, undefined, 201);
  }),
);

router.patch(
  "/milestones/:id",
  requirePermission("projects.edit"),
  asyncHandler(async (req, res) => {
    const result = await updateWorkRecord(WORK_ENTITIES.milestones, req.params.id, req.body, req.user);
    await audit(req, "update_milestone", "Milestone", result);
    sendData(res, result);
  }),
);

router.delete(
  "/milestones/:id",
  requirePermission("projects.delete"),
  asyncHandler(async (req, res) => {
    const result = await deleteWorkRecord(WORK_ENTITIES.milestones, req.params.id);
    await audit(req, "delete_milestone", "Milestone", result);
    sendData(res, result);
  }),
);

router.get(
  "/time-logs",
  requirePermission("projects.view"),
  asyncHandler(async (req, res) => {
    sendData(res, await listWorkEntity("time_logs", filtersFromQuery(req.query)));
  }),
);

router.post(
  "/time-logs",
  requirePermission("projects.edit"),
  asyncHandler(async (req, res) => {
    const result = await logTaskTime(req.body, req.user);
    await audit(req, "log_time", "TimeLog", result);
    sendData(res, result, undefined, 201);
  }),
);

router.get(
  "/meetings",
  requirePermission("projects.view"),
  asyncHandler(async (req, res) => {
    sendData(res, await listWorkEntity("meetings", filtersFromQuery(req.query)));
  }),
);

router.post(
  "/meetings",
  requirePermission("projects.create"),
  asyncHandler(async (req, res) => {
    const result = await createWorkRecord(WORK_ENTITIES.meetings, req.body, req.user);
    await audit(req, "create_meeting", "MeetingStudio", result);
    sendData(res, result, undefined, 201);
  }),
);

router.patch(
  "/meetings/:id",
  requirePermission("projects.edit"),
  asyncHandler(async (req, res) => {
    const result = await updateWorkRecord(WORK_ENTITIES.meetings, req.params.id, req.body, req.user);
    await audit(req, "update_meeting", "MeetingStudio", result);
    sendData(res, result);
  }),
);

router.delete(
  "/meetings/:id",
  requirePermission("projects.delete"),
  asyncHandler(async (req, res) => {
    const result = await deleteWorkRecord(WORK_ENTITIES.meetings, req.params.id);
    await audit(req, "delete_meeting", "MeetingStudio", result);
    sendData(res, result);
  }),
);

router.post(
  "/meetings/:id/sync-tasks",
  requirePermission("projects.edit"),
  asyncHandler(async (req, res) => {
    const result = await syncMeetingTasks(req.params.id, req.user);
    await audit(req, "sync_meeting_tasks", "MeetingStudio", result);
    sendData(res, result);
  }),
);

export default router;
