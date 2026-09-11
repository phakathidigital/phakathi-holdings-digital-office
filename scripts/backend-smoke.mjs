import fs from "node:fs/promises";
import path from "node:path";

process.env.NODE_ENV = "test";
process.env.PHAKATHI_STORAGE = "local-json";
process.env.JWT_SECRET ||= "phakathi-flow-smoke-test-jwt-secret-change-outside-tests";
process.env.JWT_REFRESH_SECRET ||= "phakathi-flow-smoke-test-refresh-secret-change-outside-tests";
process.env.ENABLE_LOCAL_NOTIFICATION_SCHEDULER = "false";
process.env.PHAKATHI_EMBEDDED_API = "true";

const rootDir = process.cwd();
const dbPath = path.join(rootDir, ".local-data", "db.json");
let originalDb = null;

async function request(baseUrl, pathName, { token, ...options } = {}) {
  const response = await fetch(`${baseUrl}${pathName}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.error?.message || body?.message || `${response.status} ${response.statusText}`;
    const error = new Error(message);
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  try {
    originalDb = await fs.readFile(dbPath, "utf8");
  } catch {
    originalDb = null;
  }

  const { app, prepareApp } = await import("../backend/src/index.js");
  await prepareApp();
  const server = app.listen(0, "127.0.0.1");

  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}/api`;
    const unique = Date.now();

    const login = await request(baseUrl, "/auth/login-or-register", {
      method: "POST",
      body: JSON.stringify({
        email: `smoke-${unique}@phakathiholdings.local`,
        full_name: "Smoke Test User",
        password: "SmokeTest123!",
      }),
    });
    expect(login.token, "Login did not return an access token.");
    expect(login.refresh_token, "Login did not return a refresh token.");
    expect(!login.user.password_hash, "Login response leaked password hash.");

    const refreshed = await request(baseUrl, "/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: login.refresh_token }),
    });
    expect(refreshed.token && refreshed.refresh_token, "Refresh did not rotate tokens.");

    const token = refreshed.token;
    const graph = await request(baseUrl, "/v1/work/graph", { token });
    expect(Array.isArray(graph.data.projects), "Work graph did not return projects.");

    const goal = await request(baseUrl, "/v1/work/goals", {
      method: "POST",
      token,
      body: JSON.stringify({
        id: `smoke-goal-${unique}`,
        objective: "Smoke test connected work workflow",
        period: "Smoke Test",
        status: "on_track",
      }),
    });

    const portfolio = await request(baseUrl, "/v1/work/portfolios", {
      method: "POST",
      token,
      body: JSON.stringify({
        id: `smoke-portfolio-${unique}`,
        name: "Smoke Workflow Portfolio",
        okr_id: goal.data.id,
        status: "active",
      }),
    });

    const project = await request(baseUrl, "/v1/work/projects", {
      method: "POST",
      token,
      body: JSON.stringify({
        id: `smoke-project-${unique}`,
        name: "Smoke Workflow Project",
        portfolio_id: portfolio.data.id,
        okr_id: goal.data.id,
        status: "in_progress",
      }),
    });

    const task = await request(baseUrl, "/v1/work/tasks", {
      method: "POST",
      token,
      body: JSON.stringify({
        id: `smoke-task-${unique}`,
        title: "Smoke workflow task",
        project_id: project.data.id,
        status: "todo",
        due_date: "2026-07-31",
      }),
    });

    let blockedCompletion = false;
    try {
      await request(baseUrl, `/v1/work/projects/${project.data.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status: "completed" }),
      });
    } catch (error) {
      blockedCompletion = error.status === 400;
    }
    expect(blockedCompletion, "Project completion was not blocked while task was open.");

    await request(baseUrl, `/v1/work/tasks/${task.data.id}/status`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ status: "completed" }),
    });

    await request(baseUrl, "/v1/work/time-logs", {
      method: "POST",
      token,
      body: JSON.stringify({
        task_id: task.data.id,
        project_id: project.data.id,
        hours: 1,
        description: "Smoke workflow time log",
      }),
    });

    const completedProject = await request(baseUrl, `/v1/work/projects/${project.data.id}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ status: "completed" }),
    });
    expect(completedProject.data.status === "completed", "Project did not complete after linked task was done.");

    const meeting = await request(baseUrl, "/v1/work/meetings", {
      method: "POST",
      token,
      body: JSON.stringify({
        id: `smoke-meeting-${unique}`,
        title: "Smoke Workflow Meeting",
        meeting_date: "2026-07-06",
        project_id: project.data.id,
        extracted_tasks: [{ title: "Smoke extracted action", project_id: project.data.id }],
      }),
    });
    const sync = await request(baseUrl, `/v1/work/meetings/${meeting.data.id}/sync-tasks`, {
      method: "POST",
      token,
    });
    expect(sync.data.created_count === 1, "Meeting task sync did not create a task.");

    await request(baseUrl, "/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshed.refresh_token }),
    });

    console.log(JSON.stringify({ ok: true, checks: 11 }, null, 2));
  } finally {
    await new Promise((resolve) => server.close(resolve));
    if (originalDb === null) {
      await fs.rm(dbPath, { force: true }).catch(() => {});
    } else {
      await fs.writeFile(dbPath, originalDb);
    }
  }
}

main().catch(async (error) => {
  if (originalDb !== null) await fs.writeFile(dbPath, originalDb).catch(() => {});
  console.error(error);
  process.exitCode = 1;
});
