import { nowStamped, readDb, writeDb } from "../../config/database.js";
import { handleEntityCreated, handleEntityUpdated } from "../notificationHooks.js";
import { ApiError } from "../../utils/apiResponse.js";

const WORK_ENTITIES = {
  goals: "OKR",
  portfolios: "Portfolio",
  projects: "Project",
  tasks: "Task",
  milestones: "Milestone",
  timeLogs: "TimeLog",
  meetings: "MeetingStudio",
};

const TASK_DONE_STATUSES = new Set(["completed", "done"]);
const TASK_ACTIVE_STATUSES = new Set(["todo", "in_progress", "completed", "done"]);

function clone(record) {
  return JSON.parse(JSON.stringify(record || {}));
}

function getRecords(db, entityName) {
  db.entities ||= {};
  db.entities[entityName] ||= [];
  return db.entities[entityName];
}

function visibleRecords(records = []) {
  return records.filter((record) => !record.deleted_at && !record.deleted_date);
}

function sortByDate(records = [], field = "updated_date") {
  return [...records].sort((a, b) => String(b[field] || b.created_date || "").localeCompare(String(a[field] || a.created_date || "")));
}

function matchesFilter(record, filters = {}) {
  if (filters.subsidiary && record.subsidiary !== filters.subsidiary) return false;
  if (filters.project_id && record.project_id !== filters.project_id) return false;
  if (filters.portfolio_id && record.portfolio_id !== filters.portfolio_id) return false;
  if (filters.okr_id && record.okr_id !== filters.okr_id) return false;
  if (filters.assigned_to && record.assigned_to !== filters.assigned_to) return false;
  if (filters.status && record.status !== filters.status) return false;
  return true;
}

function getProjectTasks(tasks = [], projectId) {
  return tasks.filter((task) => task.project_id === projectId);
}

function isTaskDone(task) {
  return TASK_DONE_STATUSES.has(task.status);
}

function getTaskProgress(tasks = []) {
  if (!tasks.length) return 0;
  return Math.round((tasks.filter(isTaskDone).length / tasks.length) * 100);
}

function getProjectProgress(project, tasks = []) {
  return getTaskProgress(getProjectTasks(tasks, project?.id));
}

function getPortfolioProjects(portfolio, projects = []) {
  const explicitIds = new Set(portfolio?.project_ids || []);
  return projects.filter((project) => project.portfolio_id === portfolio?.id || explicitIds.has(project.id));
}

function getPortfolioProgress(portfolio, projects = [], tasks = []) {
  const linkedProjects = getPortfolioProjects(portfolio, projects);
  if (!linkedProjects.length) return 0;
  const total = linkedProjects.reduce((sum, project) => sum + getProjectProgress(project, tasks), 0);
  return Math.round(total / linkedProjects.length);
}

function getGoalPortfolios(goal, portfolios = []) {
  return portfolios.filter((portfolio) => portfolio.okr_id === goal?.id || goal?.portfolio_id === portfolio.id);
}

function getGoalProjects(goal, projects = [], portfolios = []) {
  const portfolioIds = new Set(getGoalPortfolios(goal, portfolios).map((portfolio) => portfolio.id));
  return projects.filter((project) =>
    project.okr_id === goal?.id ||
    goal?.project_id === project.id ||
    portfolioIds.has(project.portfolio_id)
  );
}

function getGoalProgress(goal, portfolios = [], projects = [], tasks = []) {
  const linkedPortfolios = getGoalPortfolios(goal, portfolios);
  if (linkedPortfolios.length) {
    const total = linkedPortfolios.reduce((sum, portfolio) => sum + getPortfolioProgress(portfolio, projects, tasks), 0);
    return Math.round(total / linkedPortfolios.length);
  }
  const linkedProjects = getGoalProjects(goal, projects, portfolios);
  if (linkedProjects.length) {
    const total = linkedProjects.reduce((sum, project) => sum + getProjectProgress(project, tasks), 0);
    return Math.round(total / linkedProjects.length);
  }
  return Number(goal?.progress || 0);
}

function enrichWorkData(db) {
  const goals = visibleRecords(getRecords(db, WORK_ENTITIES.goals));
  const portfolios = visibleRecords(getRecords(db, WORK_ENTITIES.portfolios));
  const projects = visibleRecords(getRecords(db, WORK_ENTITIES.projects));
  const tasks = visibleRecords(getRecords(db, WORK_ENTITIES.tasks));
  const milestones = visibleRecords(getRecords(db, WORK_ENTITIES.milestones));
  const timeLogs = visibleRecords(getRecords(db, WORK_ENTITIES.timeLogs));
  const meetings = visibleRecords(getRecords(db, WORK_ENTITIES.meetings));

  const enrichedProjects = projects.map((project) => {
    const projectTasks = getProjectTasks(tasks, project.id);
    const projectTimeLogs = timeLogs.filter((log) => log.project_id === project.id || projectTasks.some((task) => task.id === log.task_id));
    const loggedHours = projectTimeLogs.reduce((sum, log) => sum + Number(log.hours || 0), 0);
    return {
      ...project,
      progress: getProjectProgress(project, tasks),
      task_count: projectTasks.length,
      completed_task_count: projectTasks.filter(isTaskDone).length,
      logged_hours: loggedHours,
    };
  });

  const enrichedPortfolios = portfolios.map((portfolio) => {
    const linkedProjects = getPortfolioProjects(portfolio, projects);
    return {
      ...portfolio,
      progress: getPortfolioProgress(portfolio, projects, tasks),
      project_count: linkedProjects.length,
      project_ids: [...new Set([...(portfolio.project_ids || []), ...linkedProjects.map((project) => project.id)])],
    };
  });

  const enrichedGoals = goals.map((goal) => {
    const linkedPortfolios = getGoalPortfolios(goal, portfolios);
    const linkedProjects = getGoalProjects(goal, projects, portfolios);
    return {
      ...goal,
      progress: getGoalProgress(goal, portfolios, projects, tasks),
      portfolio_count: linkedPortfolios.length,
      project_count: linkedProjects.length,
      portfolio_ids: linkedPortfolios.map((portfolio) => portfolio.id),
      project_ids: linkedProjects.map((project) => project.id),
    };
  });

  return {
    goals: sortByDate(enrichedGoals, "updated_date"),
    portfolios: sortByDate(enrichedPortfolios, "updated_date"),
    projects: sortByDate(enrichedProjects, "updated_date"),
    tasks: sortByDate(tasks, "updated_date"),
    milestones: sortByDate(milestones, "due_date"),
    time_logs: sortByDate(timeLogs, "log_date"),
    meetings: sortByDate(meetings, "meeting_date"),
  };
}

function getTaskBlockers(task, tasks = []) {
  const blockerIds = Array.isArray(task.blocked_by) ? task.blocked_by : [];
  return blockerIds
    .map((id) => tasks.find((item) => item.id === id))
    .filter(Boolean)
    .filter((blocker) => !isTaskDone(blocker));
}

function validateProjectCompletion(db, projectId, projectData) {
  if (!TASK_DONE_STATUSES.has(projectData.status)) return;
  const tasks = getProjectTasks(getRecords(db, WORK_ENTITIES.tasks), projectId);
  if (!tasks.length) throw new ApiError(400, "project_completion_blocked", "A project cannot be marked completed until it has linked tasks.");
  const openTasks = tasks.filter((task) => !isTaskDone(task));
  if (openTasks.length) {
    throw new ApiError(400, "project_completion_blocked", `A project cannot be marked completed while ${openTasks.length} linked task(s) are still open.`);
  }
}

function prepareTaskData(incoming, existing = {}, actorEmail = "unknown") {
  const data = { ...incoming };
  const previousStatus = existing.status || "todo";
  const nextStatus = data.status || previousStatus;
  if (!TASK_ACTIVE_STATUSES.has(nextStatus)) {
    throw new ApiError(400, "invalid_task_status", "Task status must be todo, in_progress, completed, or done.");
  }
  if (nextStatus !== previousStatus) {
    const event = {
      from: previousStatus,
      to: nextStatus,
      changed_by: actorEmail,
      changed_at: new Date().toISOString(),
    };
    data.status_history = [...(existing.status_history || []), event];
  }
  if (TASK_DONE_STATUSES.has(nextStatus) && !TASK_DONE_STATUSES.has(previousStatus)) {
    data.completed_at = new Date().toISOString();
    data.completed_by = actorEmail;
  }
  if (TASK_DONE_STATUSES.has(previousStatus) && !TASK_DONE_STATUSES.has(nextStatus)) {
    data.reopened_at = new Date().toISOString();
    data.reopened_by = actorEmail;
  }
  return data;
}

export async function getWorkOverview(filters = {}) {
  const db = await readDb();
  const work = enrichWorkData(db);
  const goals = work.goals.filter((record) => matchesFilter(record, filters));
  const portfolios = work.portfolios.filter((record) => matchesFilter(record, filters));
  const projects = work.projects.filter((record) => matchesFilter(record, filters));
  const tasks = work.tasks.filter((record) => matchesFilter(record, filters));
  const timeLogs = work.time_logs.filter((record) => matchesFilter(record, filters));

  return {
    summary: {
      goals: goals.length,
      portfolios: portfolios.length,
      projects: projects.length,
      tasks: tasks.length,
      open_tasks: tasks.filter((task) => !isTaskDone(task)).length,
      completed_tasks: tasks.filter(isTaskDone).length,
      overdue_tasks: tasks.filter((task) => task.due_date && new Date(task.due_date) < new Date() && !isTaskDone(task)).length,
      logged_hours: timeLogs.reduce((sum, log) => sum + Number(log.hours || 0), 0),
      average_project_progress: projects.length ? Math.round(projects.reduce((sum, project) => sum + Number(project.progress || 0), 0) / projects.length) : 0,
    },
    recent: {
      goals: goals.slice(0, 5),
      portfolios: portfolios.slice(0, 5),
      projects: projects.slice(0, 8),
      tasks: tasks.slice(0, 12),
    },
  };
}

export async function getWorkGraph(filters = {}) {
  const db = await readDb();
  const work = enrichWorkData(db);
  return {
    ...work,
    goals: work.goals.filter((record) => matchesFilter(record, filters)),
    portfolios: work.portfolios.filter((record) => matchesFilter(record, filters)),
    projects: work.projects.filter((record) => matchesFilter(record, filters)),
    tasks: work.tasks.filter((record) => matchesFilter(record, filters)),
  };
}

export async function listWorkEntity(entityKey, filters = {}) {
  const graph = await getWorkGraph(filters);
  return graph[entityKey] || [];
}

export async function createWorkRecord(entityName, data, actor) {
  const db = await readDb();
  const records = getRecords(db, entityName);
  const prepared = entityName === WORK_ENTITIES.tasks ? prepareTaskData(data, {}, actor?.email) : { ...data };
  if (entityName === WORK_ENTITIES.projects) delete prepared.progress;
  if (entityName === WORK_ENTITIES.projects) validateProjectCompletion(db, prepared.id, prepared);
  const created = nowStamped(prepared);
  records.push(created);
  await writeDb(db);
  await handleEntityCreated(db, entityName, created);
  return created;
}

export async function updateWorkRecord(entityName, id, data, actor) {
  const db = await readDb();
  const records = getRecords(db, entityName);
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) throw new ApiError(404, "not_found", `${entityName} not found.`);
  const previous = clone(records[index]);
  const prepared = entityName === WORK_ENTITIES.tasks ? prepareTaskData(data, records[index], actor?.email) : { ...data };
  if (entityName === WORK_ENTITIES.projects) delete prepared.progress;
  if (entityName === WORK_ENTITIES.projects) validateProjectCompletion(db, id, { ...records[index], ...prepared });
  records[index] = nowStamped(prepared, records[index]);
  await writeDb(db);
  await handleEntityUpdated(db, entityName, previous, records[index]);
  return records[index];
}

export async function deleteWorkRecord(entityName, id) {
  const db = await readDb();
  const records = getRecords(db, entityName);
  const existing = records.find((record) => record.id === id);
  if (!existing) throw new ApiError(404, "not_found", `${entityName} not found.`);
  db.entities[entityName] = records.filter((record) => record.id !== id);
  await writeDb(db);
  return { id, deleted: true };
}

export async function moveTask(taskId, status, actor) {
  const db = await readDb();
  const tasks = getRecords(db, WORK_ENTITIES.tasks);
  const index = tasks.findIndex((task) => task.id === taskId);
  if (index === -1) throw new ApiError(404, "not_found", "Task not found.");
  const blockers = getTaskBlockers(tasks[index], tasks);
  if (TASK_DONE_STATUSES.has(status) && blockers.length) {
    throw new ApiError(400, "task_blocked", "This task cannot be completed until its blockers are done.", {
      blockers: blockers.map((task) => ({ id: task.id, title: task.title, status: task.status })),
    });
  }
  const previous = clone(tasks[index]);
  tasks[index] = nowStamped(prepareTaskData({ status }, tasks[index], actor?.email), tasks[index]);
  await writeDb(db);
  await handleEntityUpdated(db, WORK_ENTITIES.tasks, previous, tasks[index]);
  return tasks[index];
}

export async function logTaskTime(data, actor) {
  if (!data.task_id && !data.project_id) throw new ApiError(400, "validation_error", "Time logs must be linked to a task or project.");
  if (!Number(data.hours || 0)) throw new ApiError(400, "validation_error", "Time log hours are required.");
  const payload = {
    ...data,
    employee_email: data.employee_email || actor?.email,
    log_date: data.log_date || new Date().toISOString().slice(0, 10),
  };
  return createWorkRecord(WORK_ENTITIES.timeLogs, payload, actor);
}

export async function syncMeetingTasks(meetingId, actor) {
  const db = await readDb();
  const meetings = getRecords(db, WORK_ENTITIES.meetings);
  const meeting = meetings.find((record) => record.id === meetingId);
  if (!meeting) throw new ApiError(404, "not_found", "Meeting not found.");
  const tasks = getRecords(db, WORK_ENTITIES.tasks);
  const sourceItems = [
    ...(Array.isArray(meeting.extracted_tasks) ? meeting.extracted_tasks : []),
    ...(Array.isArray(meeting.action_items) ? meeting.action_items : []),
  ];
  const created = [];
  for (const item of sourceItems) {
    const title = String(item.title || item.task || item.action || item.description || "").trim();
    if (!title) continue;
    const existing = tasks.find((task) => task.meeting_id === meeting.id && task.title === title);
    if (existing) continue;
    const task = nowStamped(prepareTaskData({
      title,
      description: item.description || item.notes || `Created from ${meeting.title || "meeting"} follow-up.`,
      project_id: item.project_id || meeting.project_id || "",
      meeting_id: meeting.id,
      assigned_to: item.assigned_to || item.owner_email || item.owner || "",
      due_date: item.due_date || "",
      status: "todo",
      priority: item.priority || "medium",
      source: "meeting_studio",
    }, {}, actor?.email));
    tasks.push(task);
    created.push(task);
  }
  meeting.kanban_synced_at = new Date().toISOString();
  meeting.kanban_synced_by = actor?.email;
  await writeDb(db);
  for (const task of created) await handleEntityCreated(db, WORK_ENTITIES.tasks, task);
  return { meeting_id: meeting.id, created_count: created.length, tasks: created };
}

export { WORK_ENTITIES };
