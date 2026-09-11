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

    const crmAccount = await request(baseUrl, "/v1/crm/accounts", {
      method: "POST",
      token,
      body: JSON.stringify({
        name: `Smoke Workflow Client ${unique}`,
        industry: "Education",
        estimated_value: 25000,
      }),
    });
    expect(crmAccount.data.id, "CRM account was not created.");

    await request(baseUrl, `/v1/crm/accounts/${crmAccount.data.id}/contacts`, {
      method: "POST",
      token,
      body: JSON.stringify({ full_name: "Smoke Client Contact", email: "smoke.client@example.com" }),
    });
    await request(baseUrl, `/v1/crm/accounts/${crmAccount.data.id}/interactions`, {
      method: "POST",
      token,
      body: JSON.stringify({ subject: "Smoke CRM interaction", interaction_type: "call" }),
    });
    await request(baseUrl, `/v1/crm/accounts/${crmAccount.data.id}/notes`, {
      method: "POST",
      token,
      body: JSON.stringify({ body: "Smoke CRM account note" }),
    });
    await request(baseUrl, `/v1/crm/accounts/${crmAccount.data.id}/opportunities`, {
      method: "POST",
      token,
      body: JSON.stringify({ title: "Smoke CRM opportunity", value: 10000, probability: 50 }),
    });
    const health = await request(baseUrl, `/v1/crm/accounts/${crmAccount.data.id}/health/refresh`, {
      method: "POST",
      token,
    });
    expect(Number(health.data.score) > 0, "CRM health refresh failed.");
    const account360 = await request(baseUrl, `/v1/crm/accounts/${crmAccount.data.id}/account-360`, { token });
    expect(account360.data.contacts.length === 1, "Account 360 did not include contact.");
    expect(account360.data.opportunities.length === 1, "Account 360 did not include opportunity.");
    const intelligence = await request(baseUrl, "/v1/crm/client-intelligence", { token });
    expect(Number(intelligence.data.summary.accounts) > 0, "Client Intelligence summary is empty.");

    const bdOverview = await request(baseUrl, "/v1/business-development/overview", { token });
    expect(Number(bdOverview.data.summary.leads) >= 0, "Business Development overview did not return a lead count.");

    const salesPipeline = await request(baseUrl, "/v1/business-development/pipeline", { token });
    expect(Array.isArray(salesPipeline.data.columns), "Sales pipeline did not return Kanban columns.");

    const lead = await request(baseUrl, "/v1/business-development/leads", {
      method: "POST",
      token,
      body: JSON.stringify({
        title: `Smoke growth lead ${unique}`,
        estimated_value: 50000,
        client_account_id: crmAccount.data.id,
        status: "new",
      }),
    });
    expect(lead.data.id, "Business Development lead was not created.");

    const opportunity = await request(baseUrl, "/v1/business-development/opportunities", {
      method: "POST",
      token,
      body: JSON.stringify({
        title: `Smoke sales opportunity ${unique}`,
        lead_id: lead.data.id,
        client_account_id: crmAccount.data.id,
        value: 50000,
        expected_close_date: "2026-07-31",
      }),
    });
    expect(opportunity.data.id, "Sales opportunity was not created.");

    const targetStage = salesPipeline.data.stages?.find((stage) => stage.name === "Proposal") || salesPipeline.data.stages?.[1];
    if (targetStage) {
      const movedOpportunity = await request(baseUrl, `/v1/business-development/opportunities/${opportunity.data.id}/stage`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ stage_id: targetStage.id }),
      });
      expect(movedOpportunity.data.stage_id === targetStage.id || movedOpportunity.data.stage?.id === targetStage.id, "Sales opportunity did not move stages.");
    }

    const proposal = await request(baseUrl, "/v1/business-development/proposals", {
      method: "POST",
      token,
      body: JSON.stringify({
        client_account_id: crmAccount.data.id,
        opportunity_id: opportunity.data.id,
        proposal_value: 50000,
        status: "draft",
      }),
    });
    expect(proposal.data.id, "Proposal was not created.");

    const deal = await request(baseUrl, "/v1/business-development/deals", {
      method: "POST",
      token,
      body: JSON.stringify({
        client_account_id: crmAccount.data.id,
        opportunity_id: opportunity.data.id,
        proposal_id: proposal.data.id,
        value: 50000,
        status: "open",
      }),
    });
    expect(deal.data.id, "Deal was not created.");

    await request(baseUrl, "/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshed.refresh_token }),
    });

    console.log(JSON.stringify({ ok: true, checks: 25 }, null, 2));
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
