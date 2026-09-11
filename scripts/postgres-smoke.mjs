import "../backend/src/config/env.js";
import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

const prisma = new PrismaClient();

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for npm run db:smoke.");
  }

  const [
    organisations,
    subsidiaries,
    departments,
    users,
    roles,
    permissions,
    stages,
    integrations,
    entityRecords,
  ] = await Promise.all([
    prisma.organisation.count(),
    prisma.subsidiary.count(),
    prisma.department.count(),
    prisma.user.count(),
    prisma.role.count(),
    prisma.permission.count(),
    prisma.opportunityStage.count(),
    prisma.integration.count(),
    prisma.entityRecord.count(),
  ]);

  const required = {
    organisations,
    subsidiaries,
    departments,
    users,
    roles,
    permissions,
    stages,
    integrations,
    entityRecords,
  };

  const missing = Object.entries(required)
    .filter(([, count]) => count <= 0)
    .map(([name]) => name);

  if (missing.length) {
    throw new Error(`Postgres smoke check failed; missing seeded data for: ${missing.join(", ")}`);
  }

  const runId = `postgres-smoke-${crypto.randomUUID()}`;
  const email = `${runId}@example.test`;
  const created = {};
  try {
    created.user = await prisma.user.create({
      data: {
        email,
        full_name: "Postgres Smoke User",
        role: "admin",
        job_title: "Automated Smoke Tester",
      },
    });

    created.account = await prisma.clientAccount.create({
      data: {
        name: `Postgres Smoke Account ${runId}`,
        status: "active",
        industry: "Internal QA",
        account_owner_id: created.user.id,
      },
    });

    created.contact = await prisma.clientContact.create({
      data: {
        client_account_id: created.account.id,
        owner_user_id: created.user.id,
        full_name: "Postgres Smoke Contact",
        email: `contact-${runId}@example.test`,
      },
    });

    const stage = await prisma.opportunityStage.findFirst({ orderBy: { order_index: "asc" } });
    created.opportunity = await prisma.opportunity.create({
      data: {
        title: `Postgres Smoke Opportunity ${runId}`,
        client_account_id: created.account.id,
        owner_user_id: created.user.id,
        primary_contact_id: created.contact.id,
        stage_id: stage?.id,
        value: 1000,
        probability: 50,
        weighted_value: 500,
        status: "open",
      },
    });

    created.proposal = await prisma.proposal.create({
      data: {
        client_account_id: created.account.id,
        opportunity_id: created.opportunity.id,
        owner_user_id: created.user.id,
        proposal_value: 1000,
        status: "draft",
      },
    });

    created.deal = await prisma.deal.create({
      data: {
        client_account_id: created.account.id,
        opportunity_id: created.opportunity.id,
        proposal_id: created.proposal.id,
        status: "open",
        value: 1000,
      },
    });

    created.project = await prisma.project.create({
      data: {
        name: `Postgres Smoke Project ${runId}`,
        status: "planning",
        client_account_id: created.account.id,
        opportunity_id: created.opportunity.id,
        account_manager_id: created.user.id,
      },
    });

    created.task = await prisma.task.create({
      data: {
        project_id: created.project.id,
        title: `Postgres Smoke Task ${runId}`,
        status: "todo",
        assigned_user_id: created.user.id,
        assigned_to: created.user.email,
      },
    });

    created.timeLog = await prisma.timeLog.create({
      data: {
        task_id: created.task.id,
        project_id: created.project.id,
        employee_email: created.user.email,
        hours: 1,
        log_date: new Date(),
        description: "Postgres smoke test time log",
      },
    });

    created.meeting = await prisma.meeting.create({
      data: {
        project_id: created.project.id,
        client_account_id: created.account.id,
        title: `Postgres Smoke Meeting ${runId}`,
        meeting_date: new Date(),
        action_items: [{ title: "Confirm smoke test workflow" }],
      },
    });

    created.notification = await prisma.notification.create({
      data: {
        title: `Postgres Smoke Notification ${runId}`,
        message: "Postgres smoke test notification",
        type: "smoke",
        target_users: [created.user.email],
      },
    });

    await prisma.clientActivity.create({
      data: {
        client_account_id: created.account.id,
        user_id: created.user.id,
        activity_type: "smoke_test",
        subject: "Verified Account 360 timeline persistence",
        occurred_at: new Date(),
        related_entity_type: "Opportunity",
        related_entity_id: created.opportunity.id,
      },
    });

    const verified = await prisma.clientAccount.findUnique({
      where: { id: created.account.id },
      include: {
        contacts: true,
        opportunities: true,
        proposals: true,
        deals: true,
        projects: { include: { tasks: true } },
        activities: true,
      },
    });

    if (!verified?.contacts?.length || !verified?.opportunities?.length || !verified?.projects?.[0]?.tasks?.length || !verified?.activities?.length) {
      throw new Error("Postgres smoke relationship verification failed.");
    }
  } finally {
    await prisma.clientActivity.deleteMany({ where: { client_account_id: created.account?.id } });
    if (created.notification) await prisma.notification.deleteMany({ where: { id: created.notification.id } });
    if (created.meeting) await prisma.meeting.deleteMany({ where: { id: created.meeting.id } });
    if (created.timeLog) await prisma.timeLog.deleteMany({ where: { id: created.timeLog.id } });
    if (created.task) await prisma.task.deleteMany({ where: { id: created.task.id } });
    if (created.project) await prisma.project.deleteMany({ where: { id: created.project.id } });
    if (created.deal) await prisma.deal.deleteMany({ where: { id: created.deal.id } });
    if (created.proposal) await prisma.proposal.deleteMany({ where: { id: created.proposal.id } });
    if (created.opportunity) await prisma.opportunity.deleteMany({ where: { id: created.opportunity.id } });
    if (created.contact) await prisma.clientContact.deleteMany({ where: { id: created.contact.id } });
    if (created.account) await prisma.clientAccount.deleteMany({ where: { id: created.account.id } });
    if (created.user) await prisma.user.deleteMany({ where: { id: created.user.id } });
  }

  console.log(JSON.stringify({
    ok: true,
    storage: "postgres",
    counts: required,
    workflow: {
      auth_user: "created-and-cleaned",
      account_360: "verified",
      opportunity_to_project_relationship: "verified",
      task_time_meeting_notification: "verified",
    },
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
