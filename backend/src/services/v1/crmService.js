import { getPrismaClient, nowStamped, readDb, shouldUsePostgresPersistence, writeDb } from "../../config/database.js";
import { ApiError } from "../../utils/apiResponse.js";

const CRM_ENTITIES = {
  accounts: "ClientAccount",
  contacts: "ClientContact",
  notes: "ClientNote",
  interactions: "ClientInteraction",
  activities: "ClientActivity",
  health: "ClientHealthSnapshot",
  opportunities: "Opportunity",
};

function getRecords(db, entityName) {
  db.entities ||= {};
  db.entities[entityName] ||= [];
  return db.entities[entityName];
}

function visible(records = []) {
  return records.filter((record) => !record.deleted_at && !record.deleted_date);
}

function sortDesc(records = [], field = "updated_at") {
  return [...records].sort((a, b) => String(b[field] || b.updated_date || b.created_at || b.created_date || "").localeCompare(String(a[field] || a.updated_date || a.created_at || a.created_date || "")));
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "object" && typeof value.toNumber === "function") return value.toNumber();
  return Number(value || 0);
}

function toIso(value) {
  if (!value) return value;
  if (value instanceof Date) return value.toISOString();
  return value;
}

function normalizeDate(value, fallback = new Date()) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new ApiError(400, "validation_error", "Date value is invalid.");
  return date;
}

function publicAccount(account = {}) {
  return {
    ...account,
    estimated_value: toNumber(account.estimated_value),
    historical_revenue: toNumber(account.historical_revenue),
    created_at: toIso(account.created_at),
    updated_at: toIso(account.updated_at),
  };
}

function publicOpportunity(opportunity = {}) {
  return {
    ...opportunity,
    value: toNumber(opportunity.value),
    weighted_value: toNumber(opportunity.weighted_value),
    expected_close_date: toIso(opportunity.expected_close_date),
    created_at: toIso(opportunity.created_at),
    updated_at: toIso(opportunity.updated_at),
  };
}

function publicRecord(record = {}) {
  return {
    ...record,
    occurred_at: toIso(record.occurred_at),
    calculated_at: toIso(record.calculated_at),
    created_at: toIso(record.created_at),
    updated_at: toIso(record.updated_at),
  };
}

function timelineDate(value) {
  return toIso(value) || new Date().toISOString();
}

function timelineItem({ id, type, title, description, occurred_at, source, related_entity_type, related_entity_id, metadata = {} }) {
  return {
    id,
    type,
    title,
    description: description || "",
    occurred_at: timelineDate(occurred_at),
    source: source || "system",
    related_entity_type,
    related_entity_id,
    metadata,
  };
}

function sortTimeline(items = []) {
  return [...items].sort((a, b) => String(b.occurred_at || "").localeCompare(String(a.occurred_at || "")));
}

function buildLocalTimeline(db, accountId) {
  const projects = visible(getRecords(db, "Project")).filter((item) => item.client_account_id === accountId);
  const projectIds = new Set(projects.map((project) => project.id));
  const opportunities = visible(getRecords(db, "Opportunity")).filter((item) => item.client_account_id === accountId);
  const opportunityIds = new Set(opportunities.map((opportunity) => opportunity.id));
  const proposals = visible(getRecords(db, "Proposal")).filter((item) => item.client_account_id === accountId || opportunityIds.has(item.opportunity_id));
  const deals = visible(getRecords(db, "Deal")).filter((item) => item.client_account_id === accountId || opportunityIds.has(item.opportunity_id));
  const tasks = visible(getRecords(db, "Task")).filter((item) => projectIds.has(item.project_id));
  const timeLogs = visible(getRecords(db, "TimeLog")).filter((item) => projectIds.has(item.project_id) || tasks.some((task) => task.id === item.task_id));

  const items = [
    ...visible(getRecords(db, CRM_ENTITIES.interactions))
      .filter((item) => item.client_account_id === accountId)
      .map((item) => timelineItem({
        id: item.id,
        type: "interaction",
        title: item.subject,
        description: item.description,
        occurred_at: item.occurred_at || item.created_at || item.created_date,
        source: item.source || "crm",
        related_entity_type: "ClientInteraction",
        related_entity_id: item.id,
        metadata: { interaction_type: item.interaction_type },
      })),
    ...visible(getRecords(db, CRM_ENTITIES.notes))
      .filter((item) => item.client_account_id === accountId)
      .map((item) => timelineItem({
        id: item.id,
        type: "note",
        title: item.subject || "Account note",
        description: item.body,
        occurred_at: item.created_at || item.created_date,
        source: "crm",
        related_entity_type: "ClientNote",
        related_entity_id: item.id,
      })),
    ...visible(getRecords(db, CRM_ENTITIES.activities))
      .filter((item) => item.client_account_id === accountId)
      .map((item) => timelineItem({
        id: item.id,
        type: item.activity_type || "activity",
        title: item.subject,
        description: item.description,
        occurred_at: item.occurred_at || item.created_at || item.created_date,
        source: item.source || "crm",
        related_entity_type: item.related_entity_type || "ClientActivity",
        related_entity_id: item.related_entity_id || item.id,
        metadata: item.metadata,
      })),
    ...opportunities.map((item) => timelineItem({
      id: item.id,
      type: "opportunity",
      title: item.title,
      description: item.next_action || item.description,
      occurred_at: item.updated_at || item.updated_date || item.created_at || item.created_date,
      source: "business_development",
      related_entity_type: "Opportunity",
      related_entity_id: item.id,
      metadata: { status: item.status, probability: item.probability, stage: item.stage_name },
    })),
    ...visible(getRecords(db, "OpportunityActivity"))
      .filter((item) => opportunityIds.has(item.opportunity_id))
      .map((item) => timelineItem({
        id: item.id,
        type: item.activity_type || "opportunity_activity",
        title: item.subject,
        description: item.description,
        occurred_at: item.occurred_at || item.created_at || item.created_date,
        source: "sales_pipeline",
        related_entity_type: "Opportunity",
        related_entity_id: item.opportunity_id,
      })),
    ...proposals.map((item) => timelineItem({
      id: item.id,
      type: "proposal",
      title: `Proposal ${item.status || "draft"}`,
      description: item.notes || item.next_action,
      occurred_at: item.submission_date || item.updated_at || item.updated_date || item.created_at || item.created_date,
      source: "business_development",
      related_entity_type: "Proposal",
      related_entity_id: item.id,
      metadata: { status: item.status, proposal_value: item.proposal_value },
    })),
    ...deals.map((item) => timelineItem({
      id: item.id,
      type: "deal",
      title: `Deal ${item.status || "open"}`,
      description: item.lost_reason || "",
      occurred_at: item.closed_at || item.updated_at || item.updated_date || item.created_at || item.created_date,
      source: "business_development",
      related_entity_type: "Deal",
      related_entity_id: item.id,
      metadata: { status: item.status, value: item.value },
    })),
    ...projects.map((item) => timelineItem({
      id: item.id,
      type: "project",
      title: item.name,
      description: item.description,
      occurred_at: item.updated_at || item.updated_date || item.created_at || item.created_date,
      source: item.source || "project_management",
      related_entity_type: "Project",
      related_entity_id: item.id,
      metadata: { status: item.status, progress: item.progress, opportunity_id: item.opportunity_id },
    })),
    ...tasks.map((item) => timelineItem({
      id: item.id,
      type: "task",
      title: item.title,
      description: item.description,
      occurred_at: item.completed_at || item.updated_at || item.updated_date || item.created_at || item.created_date,
      source: "project_management",
      related_entity_type: "Task",
      related_entity_id: item.id,
      metadata: { status: item.status, project_id: item.project_id, assigned_to: item.assigned_to },
    })),
    ...timeLogs.map((item) => timelineItem({
      id: item.id,
      type: "time_log",
      title: `Time logged: ${item.hours || 0} hour(s)`,
      description: item.description,
      occurred_at: item.log_date || item.created_at || item.created_date,
      source: "project_management",
      related_entity_type: "TimeLog",
      related_entity_id: item.id,
      metadata: { project_id: item.project_id, task_id: item.task_id, employee_email: item.employee_email },
    })),
  ];

  return sortTimeline(items);
}

function buildHealthSnapshot(account, data = {}) {
  const contacts = data.contacts || [];
  const interactions = data.interactions || [];
  const opportunities = data.opportunities || [];
  const projects = data.projects || [];
  let score = 50;
  const reasons = [];

  if (contacts.length) {
    score += 15;
    reasons.push("Account has named contacts.");
  } else {
    score -= 15;
    reasons.push("No contacts captured yet.");
  }

  const recentInteraction = interactions.some((item) => {
    const occurredAt = new Date(item.occurred_at || item.created_at || item.created_date || 0);
    return Date.now() - occurredAt.getTime() <= 1000 * 60 * 60 * 24 * 30;
  });
  if (recentInteraction) {
    score += 20;
    reasons.push("Recent interaction logged in the last 30 days.");
  } else {
    score -= 10;
    reasons.push("No recent interaction in the last 30 days.");
  }

  if (opportunities.some((item) => item.status !== "lost")) {
    score += 10;
    reasons.push("Open opportunity or pipeline activity exists.");
  }
  if (projects.length) {
    score += 10;
    reasons.push("Linked project delivery exists.");
  }
  if (account.relationship_status === "at_risk") {
    score -= 25;
    reasons.push("Relationship is marked at risk.");
  }

  return {
    id: `health-${account.id}-${new Date().toISOString().slice(0, 10)}`,
    client_account_id: account.id,
    score: Math.max(0, Math.min(100, score)),
    reasons,
    calculated_at: new Date().toISOString(),
  };
}

function localAccount360(db, accountId) {
  const account = visible(getRecords(db, CRM_ENTITIES.accounts)).find((item) => item.id === accountId);
  if (!account) throw new ApiError(404, "not_found", "Client account not found.");
  const contacts = visible(getRecords(db, CRM_ENTITIES.contacts)).filter((item) => item.client_account_id === accountId);
  const notes = visible(getRecords(db, CRM_ENTITIES.notes)).filter((item) => item.client_account_id === accountId);
  const interactions = visible(getRecords(db, CRM_ENTITIES.interactions)).filter((item) => item.client_account_id === accountId);
  const activities = visible(getRecords(db, CRM_ENTITIES.activities)).filter((item) => item.client_account_id === accountId);
  const opportunities = visible(getRecords(db, CRM_ENTITIES.opportunities)).filter((item) => item.client_account_id === accountId);
  const projects = visible(getRecords(db, "Project")).filter((item) => item.client_account_id === accountId);
  const healthSnapshots = visible(getRecords(db, CRM_ENTITIES.health)).filter((item) => item.client_account_id === accountId);
  const latestHealth = sortDesc(healthSnapshots, "calculated_at")[0] || buildHealthSnapshot(account, { contacts, interactions, opportunities, projects });
  return {
    account: publicAccount(account),
    contacts: sortDesc(contacts),
    notes: sortDesc(notes),
    interactions: sortDesc(interactions, "occurred_at"),
    activities: sortDesc(activities, "occurred_at"),
    opportunities: sortDesc(opportunities).map(publicOpportunity),
    projects: sortDesc(projects),
    health: publicRecord(latestHealth),
    timeline: buildLocalTimeline(db, accountId),
  };
}

async function buildPrismaTimeline(accountId) {
  const prisma = await getPrismaClient();
  const [interactions, notes, activities, opportunities, proposals, deals, prismaProjects] = await Promise.all([
    prisma.clientInteraction.findMany({ where: { client_account_id: accountId, deleted_at: null }, orderBy: { occurred_at: "desc" } }),
    prisma.clientNote.findMany({ where: { client_account_id: accountId, deleted_at: null }, orderBy: { created_at: "desc" } }),
    prisma.clientActivity.findMany({ where: { client_account_id: accountId }, orderBy: { occurred_at: "desc" } }),
    prisma.opportunity.findMany({ where: { client_account_id: accountId, deleted_at: null }, include: { activities: true, stage: true }, orderBy: { updated_at: "desc" } }),
    prisma.proposal.findMany({ where: { client_account_id: accountId, deleted_at: null }, orderBy: { updated_at: "desc" } }),
    prisma.deal.findMany({ where: { client_account_id: accountId, deleted_at: null }, orderBy: { updated_at: "desc" } }),
    prisma.project.findMany({ where: { client_account_id: accountId, deleted_at: null }, include: { tasks: true, time_logs: true }, orderBy: { updated_at: "desc" } }).catch(() => []),
  ]);

  const compatibilityDb = await readDb().catch(() => ({ entities: {} }));
  const compatibilityItems = buildLocalTimeline(compatibilityDb, accountId);
  const compatibilityProjectIds = new Set(visible(getRecords(compatibilityDb, "Project")).filter((project) => project.client_account_id === accountId).map((project) => project.id));

  const items = [
    ...interactions.map((item) => timelineItem({
      id: item.id,
      type: "interaction",
      title: item.subject,
      description: item.description,
      occurred_at: item.occurred_at,
      source: item.source || "crm",
      related_entity_type: "ClientInteraction",
      related_entity_id: item.id,
      metadata: { interaction_type: item.interaction_type },
    })),
    ...notes.map((item) => timelineItem({
      id: item.id,
      type: "note",
      title: item.subject || "Account note",
      description: item.body,
      occurred_at: item.created_at,
      source: "crm",
      related_entity_type: "ClientNote",
      related_entity_id: item.id,
    })),
    ...activities.map((item) => timelineItem({
      id: item.id,
      type: item.activity_type || "activity",
      title: item.subject,
      description: item.description,
      occurred_at: item.occurred_at,
      source: item.source || "crm",
      related_entity_type: item.related_entity_type || "ClientActivity",
      related_entity_id: item.related_entity_id || item.id,
      metadata: item.metadata,
    })),
    ...opportunities.map((item) => timelineItem({
      id: item.id,
      type: "opportunity",
      title: item.title,
      description: item.next_action || item.description,
      occurred_at: item.last_activity_at || item.updated_at || item.created_at,
      source: "business_development",
      related_entity_type: "Opportunity",
      related_entity_id: item.id,
      metadata: { status: item.status, probability: item.probability, stage: item.stage?.name },
    })),
    ...opportunities.flatMap((opportunity) => (opportunity.activities || []).map((item) => timelineItem({
      id: item.id,
      type: item.activity_type || "opportunity_activity",
      title: item.subject,
      description: item.description,
      occurred_at: item.occurred_at,
      source: "sales_pipeline",
      related_entity_type: "Opportunity",
      related_entity_id: opportunity.id,
    }))),
    ...proposals.map((item) => timelineItem({
      id: item.id,
      type: "proposal",
      title: `Proposal ${item.status || "draft"}`,
      description: item.notes || item.next_action,
      occurred_at: item.submission_date || item.updated_at || item.created_at,
      source: "business_development",
      related_entity_type: "Proposal",
      related_entity_id: item.id,
      metadata: { status: item.status, proposal_value: toNumber(item.proposal_value) },
    })),
    ...deals.map((item) => timelineItem({
      id: item.id,
      type: "deal",
      title: `Deal ${item.status || "open"}`,
      description: item.lost_reason || "",
      occurred_at: item.closed_at || item.updated_at || item.created_at,
      source: "business_development",
      related_entity_type: "Deal",
      related_entity_id: item.id,
      metadata: { status: item.status, value: toNumber(item.value) },
    })),
    ...prismaProjects.map((item) => timelineItem({
      id: item.id,
      type: "project",
      title: item.name,
      description: item.description,
      occurred_at: item.updated_at || item.created_at,
      source: "project_management",
      related_entity_type: "Project",
      related_entity_id: item.id,
      metadata: { status: item.status, opportunity_id: item.opportunity_id },
    })),
    ...prismaProjects.flatMap((project) => (project.tasks || []).map((item) => timelineItem({
      id: item.id,
      type: "task",
      title: item.title,
      description: item.description,
      occurred_at: item.completed_at || item.updated_at || item.created_at,
      source: "project_management",
      related_entity_type: "Task",
      related_entity_id: item.id,
      metadata: { status: item.status, project_id: project.id, assigned_to: item.assigned_to },
    }))),
    ...compatibilityItems.filter((item) => item.related_entity_type !== "Project" || compatibilityProjectIds.has(item.related_entity_id)),
  ];

  const seen = new Set();
  return sortTimeline(items).filter((item) => {
    const key = `${item.related_entity_type}:${item.related_entity_id}:${item.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function prismaAccount360(accountId) {
  const prisma = await getPrismaClient();
  const account = await prisma.clientAccount.findFirst({
    where: { id: accountId, deleted_at: null },
    include: {
      contacts: { where: { deleted_at: null }, orderBy: { updated_at: "desc" } },
      notes: { where: { deleted_at: null }, orderBy: { updated_at: "desc" } },
      interactions: { where: { deleted_at: null }, orderBy: { occurred_at: "desc" } },
      activities: { orderBy: { occurred_at: "desc" } },
      opportunities: { where: { deleted_at: null }, include: { stage: true }, orderBy: { updated_at: "desc" } },
      projects: { where: { deleted_at: null }, orderBy: { updated_at: "desc" } },
      health_snapshots: { orderBy: { calculated_at: "desc" }, take: 1 },
    },
  });
  if (!account) throw new ApiError(404, "not_found", "Client account not found.");
  const health = account.health_snapshots[0] || buildHealthSnapshot(account, {
    contacts: account.contacts,
    interactions: account.interactions,
    opportunities: account.opportunities,
    projects: account.projects,
  });
  return {
    account: publicAccount(account),
    contacts: account.contacts.map(publicRecord),
    notes: account.notes.map(publicRecord),
    interactions: account.interactions.map(publicRecord),
    activities: account.activities.map(publicRecord),
    opportunities: account.opportunities.map(publicOpportunity),
    projects: [
      ...account.projects.map(publicRecord),
      ...visible(getRecords(await readDb().catch(() => ({ entities: {} })), "Project")).filter((project) => project.client_account_id === accountId),
    ],
    health: publicRecord(health),
    timeline: await buildPrismaTimeline(accountId),
  };
}

export async function getCrmOverview() {
  if (shouldUsePostgresPersistence()) {
    const prisma = await getPrismaClient();
    const [accounts, contacts, interactions, opportunities] = await Promise.all([
      prisma.clientAccount.findMany({ where: { deleted_at: null }, include: { contacts: true, interactions: true, opportunities: true, projects: true }, orderBy: { updated_at: "desc" } }),
      prisma.clientContact.count({ where: { deleted_at: null } }),
      prisma.clientInteraction.count({ where: { deleted_at: null } }),
      prisma.opportunity.findMany({ where: { deleted_at: null }, include: { stage: true }, orderBy: { updated_at: "desc" } }),
    ]);
    const accountCards = accounts.map((account) => {
      const health = buildHealthSnapshot(account, {
        contacts: account.contacts,
        interactions: account.interactions,
        opportunities: account.opportunities,
        projects: account.projects,
      });
      return {
        ...publicAccount(account),
        contact_count: account.contacts.length,
        opportunity_count: account.opportunities.length,
        project_count: account.projects.length,
        health_score: health.score,
        health_reasons: health.reasons,
      };
    });
    return {
      summary: {
        accounts: accounts.length,
        contacts,
        interactions,
        opportunities: opportunities.length,
        pipeline_value: opportunities.reduce((sum, item) => sum + toNumber(item.value), 0),
        weighted_pipeline: opportunities.reduce((sum, item) => sum + toNumber(item.weighted_value || (toNumber(item.value) * Number(item.probability || item.stage?.probability || 0)) / 100), 0),
      },
      accounts: accountCards,
      opportunities: opportunities.map(publicOpportunity),
    };
  }

  const db = await readDb();
  const accounts = visible(getRecords(db, CRM_ENTITIES.accounts));
  const contacts = visible(getRecords(db, CRM_ENTITIES.contacts));
  const interactions = visible(getRecords(db, CRM_ENTITIES.interactions));
  const opportunities = visible(getRecords(db, CRM_ENTITIES.opportunities));
  const projects = visible(getRecords(db, "Project"));
  const accountCards = accounts.map((account) => {
    const accountContacts = contacts.filter((item) => item.client_account_id === account.id);
    const accountInteractions = interactions.filter((item) => item.client_account_id === account.id);
    const accountOpportunities = opportunities.filter((item) => item.client_account_id === account.id);
    const accountProjects = projects.filter((item) => item.client_account_id === account.id);
    const health = buildHealthSnapshot(account, {
      contacts: accountContacts,
      interactions: accountInteractions,
      opportunities: accountOpportunities,
      projects: accountProjects,
    });
    return {
      ...publicAccount(account),
      contact_count: accountContacts.length,
      opportunity_count: accountOpportunities.length,
      project_count: accountProjects.length,
      health_score: health.score,
      health_reasons: health.reasons,
    };
  });
  return {
    summary: {
      accounts: accounts.length,
      contacts: contacts.length,
      interactions: interactions.length,
      opportunities: opportunities.length,
      pipeline_value: opportunities.reduce((sum, item) => sum + toNumber(item.value), 0),
      weighted_pipeline: opportunities.reduce((sum, item) => sum + toNumber(item.weighted_value || (toNumber(item.value) * Number(item.probability || 0)) / 100), 0),
    },
    accounts: sortDesc(accountCards),
    opportunities: sortDesc(opportunities).map(publicOpportunity),
  };
}

export async function listAccounts() {
  if (shouldUsePostgresPersistence()) {
    const prisma = await getPrismaClient();
    const records = await prisma.clientAccount.findMany({ where: { deleted_at: null }, orderBy: { updated_at: "desc" } });
    return records.map(publicAccount);
  }
  const db = await readDb();
  return sortDesc(visible(getRecords(db, CRM_ENTITIES.accounts))).map(publicAccount);
}

export async function getAccount360(accountId) {
  if (shouldUsePostgresPersistence()) return prismaAccount360(accountId);
  const db = await readDb();
  return localAccount360(db, accountId);
}

export async function getAccountActivityTimeline(accountId) {
  if (shouldUsePostgresPersistence()) {
    const account = await getPrismaClient().then((prisma) => prisma.clientAccount.findFirst({ where: { id: accountId, deleted_at: null } }));
    if (!account) throw new ApiError(404, "not_found", "Client account not found.");
    return buildPrismaTimeline(accountId);
  }
  const db = await readDb();
  const account = visible(getRecords(db, CRM_ENTITIES.accounts)).find((item) => item.id === accountId);
  if (!account) throw new ApiError(404, "not_found", "Client account not found.");
  return buildLocalTimeline(db, accountId);
}

export async function createAccount(data = {}, actor = {}) {
  if (!data.name?.trim()) throw new ApiError(400, "validation_error", "Client account name is required.", { field: "name" });
  if (shouldUsePostgresPersistence()) {
    const prisma = await getPrismaClient();
    const owner = actor.email ? await prisma.user.findUnique({ where: { email: actor.email } }) : null;
    const account = await prisma.clientAccount.create({
      data: {
        name: data.name.trim(),
        status: data.status || "active",
        industry: data.industry || null,
        website: data.website || null,
        address: data.address || null,
        location: data.location || null,
        source: data.source || null,
        category: data.category || null,
        tags: data.tags || [],
        estimated_value: data.estimated_value || null,
        historical_revenue: data.historical_revenue || null,
        relationship_status: data.relationship_status || "healthy",
        account_owner_id: data.account_owner_id || owner?.id,
        metadata: data.metadata || {},
      },
    });
    return publicAccount(account);
  }

  const db = await readDb();
  const account = nowStamped({
    name: data.name.trim(),
    status: data.status || "active",
    industry: data.industry || "",
    website: data.website || "",
    address: data.address || "",
    location: data.location || "",
    source: data.source || "manual",
    category: data.category || "",
    tags: data.tags || [],
    estimated_value: Number(data.estimated_value || 0),
    historical_revenue: Number(data.historical_revenue || 0),
    relationship_status: data.relationship_status || "healthy",
    owner_email: actor.email || data.owner_email || "",
    metadata: data.metadata || {},
  });
  getRecords(db, CRM_ENTITIES.accounts).push(account);
  getRecords(db, CRM_ENTITIES.activities).push(nowStamped({
    client_account_id: account.id,
    user_email: actor.email,
    activity_type: "account_created",
    subject: `Account created: ${account.name}`,
    occurred_at: new Date().toISOString(),
    source: "crm",
  }));
  await writeDb(db);
  return publicAccount(account);
}

export async function updateAccount(accountId, data = {}) {
  if (shouldUsePostgresPersistence()) {
    const prisma = await getPrismaClient();
    const account = await prisma.clientAccount.update({
      where: { id: accountId },
      data: {
        name: data.name,
        status: data.status,
        industry: data.industry,
        website: data.website,
        address: data.address,
        location: data.location,
        source: data.source,
        category: data.category,
        tags: data.tags,
        estimated_value: data.estimated_value,
        historical_revenue: data.historical_revenue,
        relationship_status: data.relationship_status,
        metadata: data.metadata,
      },
    });
    return publicAccount(account);
  }
  const db = await readDb();
  const records = getRecords(db, CRM_ENTITIES.accounts);
  const index = records.findIndex((item) => item.id === accountId);
  if (index === -1) throw new ApiError(404, "not_found", "Client account not found.");
  records[index] = nowStamped(data, records[index]);
  await writeDb(db);
  return publicAccount(records[index]);
}

export async function addContact(accountId, data = {}, actor = {}) {
  if (!data.full_name?.trim()) throw new ApiError(400, "validation_error", "Contact full name is required.", { field: "full_name" });
  await getAccount360(accountId);
  if (shouldUsePostgresPersistence()) {
    const prisma = await getPrismaClient();
    const owner = actor.email ? await prisma.user.findUnique({ where: { email: actor.email } }) : null;
    const contact = await prisma.clientContact.create({
      data: {
        client_account_id: accountId,
        owner_user_id: owner?.id,
        full_name: data.full_name.trim(),
        position: data.position || null,
        email: data.email || null,
        phone: data.phone || null,
        preferred_contact: data.preferred_contact || null,
        visibility: data.visibility || "account_team",
        metadata: data.metadata || {},
      },
    });
    return publicRecord(contact);
  }
  const db = await readDb();
  const contact = nowStamped({
    client_account_id: accountId,
    owner_email: actor.email || "",
    full_name: data.full_name.trim(),
    position: data.position || "",
    email: data.email || "",
    phone: data.phone || "",
    preferred_contact: data.preferred_contact || "",
    visibility: data.visibility || "account_team",
    metadata: data.metadata || {},
  });
  getRecords(db, CRM_ENTITIES.contacts).push(contact);
  await writeDb(db);
  return publicRecord(contact);
}

export async function addInteraction(accountId, data = {}, actor = {}) {
  if (!data.subject?.trim()) throw new ApiError(400, "validation_error", "Interaction subject is required.", { field: "subject" });
  await getAccount360(accountId);
  if (shouldUsePostgresPersistence()) {
    const prisma = await getPrismaClient();
    const user = actor.email ? await prisma.user.findUnique({ where: { email: actor.email } }) : null;
    const interaction = await prisma.clientInteraction.create({
      data: {
        client_account_id: accountId,
        client_contact_id: data.client_contact_id || null,
        user_id: user?.id,
        interaction_type: data.interaction_type || "note",
        subject: data.subject.trim(),
        description: data.description || null,
        occurred_at: normalizeDate(data.occurred_at),
        source: data.source || "manual",
        metadata: data.metadata || {},
      },
    });
    return publicRecord(interaction);
  }
  const db = await readDb();
  const interaction = nowStamped({
    client_account_id: accountId,
    client_contact_id: data.client_contact_id || "",
    user_email: actor.email || "",
    interaction_type: data.interaction_type || "note",
    subject: data.subject.trim(),
    description: data.description || "",
    occurred_at: normalizeDate(data.occurred_at).toISOString(),
    source: data.source || "manual",
    metadata: data.metadata || {},
  });
  getRecords(db, CRM_ENTITIES.interactions).push(interaction);
  getRecords(db, CRM_ENTITIES.activities).push(nowStamped({
    client_account_id: accountId,
    user_email: actor.email || "",
    activity_type: "interaction_logged",
    subject: interaction.subject,
    occurred_at: interaction.occurred_at,
    related_entity_type: "ClientInteraction",
    related_entity_id: interaction.id,
    source: "crm",
  }));
  await writeDb(db);
  return publicRecord(interaction);
}

export async function addNote(accountId, data = {}, actor = {}) {
  if (!data.body?.trim()) throw new ApiError(400, "validation_error", "Note body is required.", { field: "body" });
  await getAccount360(accountId);
  if (shouldUsePostgresPersistence()) {
    const prisma = await getPrismaClient();
    const user = actor.email ? await prisma.user.findUnique({ where: { email: actor.email } }) : null;
    const note = await prisma.clientNote.create({
      data: {
        client_account_id: accountId,
        client_contact_id: data.client_contact_id || null,
        created_by_user_id: user?.id,
        subject: data.subject || null,
        body: data.body.trim(),
        visibility: data.visibility || "account_team",
        metadata: data.metadata || {},
      },
    });
    return publicRecord(note);
  }
  const db = await readDb();
  const note = nowStamped({
    client_account_id: accountId,
    client_contact_id: data.client_contact_id || "",
    created_by_email: actor.email || "",
    subject: data.subject || "",
    body: data.body.trim(),
    visibility: data.visibility || "account_team",
    metadata: data.metadata || {},
  });
  getRecords(db, CRM_ENTITIES.notes).push(note);
  await writeDb(db);
  return publicRecord(note);
}

export async function addOpportunity(accountId, data = {}, actor = {}) {
  if (!data.title?.trim()) throw new ApiError(400, "validation_error", "Opportunity title is required.", { field: "title" });
  await getAccount360(accountId);
  const value = Number(data.value || 0);
  const probability = Number(data.probability || 0);
  if (shouldUsePostgresPersistence()) {
    const prisma = await getPrismaClient();
    const owner = actor.email ? await prisma.user.findUnique({ where: { email: actor.email } }) : null;
    const opportunity = await prisma.opportunity.create({
      data: {
        title: data.title.trim(),
        client_account_id: accountId,
        primary_contact_id: data.primary_contact_id || null,
        owner_user_id: owner?.id,
        stage_id: data.stage_id || null,
        value: value || null,
        probability: probability || null,
        weighted_value: value && probability ? (value * probability) / 100 : null,
        expected_close_date: data.expected_close_date ? normalizeDate(data.expected_close_date) : null,
        source: data.source || "manual",
        industry: data.industry || null,
        description: data.description || null,
        next_action: data.next_action || null,
        next_follow_up_at: data.next_follow_up_at ? normalizeDate(data.next_follow_up_at) : null,
        status: data.status || "open",
        metadata: data.metadata || {},
      },
    });
    return publicOpportunity(opportunity);
  }
  const db = await readDb();
  const opportunity = nowStamped({
    title: data.title.trim(),
    client_account_id: accountId,
    primary_contact_id: data.primary_contact_id || "",
    owner_email: actor.email || "",
    value,
    probability,
    weighted_value: value && probability ? (value * probability) / 100 : 0,
    expected_close_date: data.expected_close_date || "",
    source: data.source || "manual",
    industry: data.industry || "",
    description: data.description || "",
    next_action: data.next_action || "",
    next_follow_up_at: data.next_follow_up_at || "",
    status: data.status || "open",
    metadata: data.metadata || {},
  });
  getRecords(db, CRM_ENTITIES.opportunities).push(opportunity);
  await writeDb(db);
  return publicOpportunity(opportunity);
}

export async function refreshHealth(accountId) {
  if (shouldUsePostgresPersistence()) {
    const account360 = await prismaAccount360(accountId);
    const snapshot = buildHealthSnapshot(account360.account, account360);
    const prisma = await getPrismaClient();
    const saved = await prisma.clientHealthSnapshot.create({
      data: {
        client_account_id: accountId,
        score: snapshot.score,
        reasons: snapshot.reasons,
        metadata: snapshot.metadata || {},
      },
    });
    return publicRecord(saved);
  }
  const db = await readDb();
  const account360 = localAccount360(db, accountId);
  const snapshot = nowStamped(buildHealthSnapshot(account360.account, account360));
  getRecords(db, CRM_ENTITIES.health).push(snapshot);
  await writeDb(db);
  return publicRecord(snapshot);
}
