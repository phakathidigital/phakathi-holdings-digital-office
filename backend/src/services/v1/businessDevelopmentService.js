import crypto from "node:crypto";
import { getPrismaClient, nowStamped, readDb, shouldUsePostgresPersistence, writeDb } from "../../config/database.js";
import { ApiError } from "../../utils/apiResponse.js";

const ENTITIES = {
  accounts: "ClientAccount",
  leadSources: "LeadSource",
  leads: "Lead",
  stages: "OpportunityStage",
  opportunities: "Opportunity",
  activities: "OpportunityActivity",
  proposals: "Proposal",
  deals: "Deal",
  dealProducts: "DealProductService",
};

const DEFAULT_STAGES = [
  { id: "stage-lead", name: "Lead", order_index: 10, probability: 10 },
  { id: "stage-qualified", name: "Qualified", order_index: 20, probability: 25 },
  { id: "stage-discovery", name: "Discovery", order_index: 30, probability: 35 },
  { id: "stage-proposal", name: "Proposal", order_index: 40, probability: 55 },
  { id: "stage-negotiation", name: "Negotiation", order_index: 50, probability: 75 },
  { id: "stage-verbal-commitment", name: "Verbal Commitment", order_index: 60, probability: 90 },
  { id: "stage-won", name: "Won", order_index: 70, probability: 100, is_won_stage: true },
  { id: "stage-lost", name: "Lost", order_index: 80, probability: 0, is_lost_stage: true },
];

function getRecords(db, entityName) {
  db.entities ||= {};
  db.entities[entityName] ||= [];
  return db.entities[entityName];
}

function visible(records = []) {
  return records.filter((record) => !record.deleted_at && !record.deleted_date);
}

function sortByOrder(records = []) {
  return [...records].sort((a, b) => Number(a.order_index || 0) - Number(b.order_index || 0));
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

function dateOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new ApiError(400, "validation_error", "Date value is invalid.");
  return date;
}

function stringOrNull(value) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

function calculatedWeightedValue(value, probability) {
  return Math.round((toNumber(value) * Number(probability || 0)) / 100);
}

function publicStage(stage = {}) {
  return {
    ...stage,
    probability: Number(stage.probability || 0),
    order_index: Number(stage.order_index || 0),
    is_won_stage: Boolean(stage.is_won_stage),
    is_lost_stage: Boolean(stage.is_lost_stage),
  };
}

function publicLead(lead = {}) {
  return {
    ...lead,
    estimated_value: toNumber(lead.estimated_value),
    created_at: toIso(lead.created_at),
    updated_at: toIso(lead.updated_at),
  };
}

function publicOpportunity(opportunity = {}) {
  return {
    ...opportunity,
    value: toNumber(opportunity.value),
    weighted_value: toNumber(opportunity.weighted_value),
    expected_close_date: toIso(opportunity.expected_close_date),
    last_activity_at: toIso(opportunity.last_activity_at),
    next_follow_up_at: toIso(opportunity.next_follow_up_at),
    created_at: toIso(opportunity.created_at),
    updated_at: toIso(opportunity.updated_at),
  };
}

function publicProposal(proposal = {}) {
  return {
    ...proposal,
    proposal_value: toNumber(proposal.proposal_value),
    submission_date: toIso(proposal.submission_date),
    expiry_date: toIso(proposal.expiry_date),
    created_at: toIso(proposal.created_at),
    updated_at: toIso(proposal.updated_at),
  };
}

function publicDeal(deal = {}) {
  return {
    ...deal,
    value: toNumber(deal.value),
    closed_at: toIso(deal.closed_at),
    created_at: toIso(deal.created_at),
    updated_at: toIso(deal.updated_at),
  };
}

function ensureLocalStages(db) {
  const stages = getRecords(db, ENTITIES.stages);
  for (const stage of DEFAULT_STAGES) {
    if (!stages.some((item) => item.id === stage.id || item.name === stage.name)) {
      stages.push(nowStamped({ ...stage, metadata: {} }));
    }
  }
  return sortByOrder(visible(stages)).map(publicStage);
}

function findLocalStage(db, value) {
  const stages = ensureLocalStages(db);
  if (!value) return stages[0];
  const normalized = String(value).trim().toLowerCase();
  return stages.find((stage) => stage.id === value || stage.name.toLowerCase() === normalized) || null;
}

async function findPrismaUser(actor) {
  if (!actor?.email) return null;
  const prisma = await getPrismaClient();
  return prisma.user.findUnique({ where: { email: actor.email } });
}

async function findPrismaStage(value) {
  const prisma = await getPrismaClient();
  if (value) {
    const byId = await prisma.opportunityStage.findUnique({ where: { id: value } }).catch(() => null);
    if (byId) return byId;
    const byName = await prisma.opportunityStage.findUnique({ where: { name: value } }).catch(() => null);
    if (byName) return byName;
  }
  return prisma.opportunityStage.findFirst({ orderBy: { order_index: "asc" } });
}

function buildOverview({ leads = [], opportunities = [], proposals = [], deals = [] }) {
  const openOpportunities = opportunities.filter((item) => item.status !== "lost" && item.status !== "won");
  const wonDeals = deals.filter((item) => item.status === "won" || item.status === "closed_won");
  const openDeals = deals.filter((item) => item.status !== "lost" && item.status !== "closed_lost");
  return {
    summary: {
      leads: leads.length,
      qualified_leads: leads.filter((item) => ["qualified", "converted"].includes(item.status)).length,
      opportunities: opportunities.length,
      open_opportunities: openOpportunities.length,
      proposals: proposals.length,
      sent_proposals: proposals.filter((item) => ["sent", "under_review"].includes(item.status)).length,
      deals: deals.length,
      open_deals: openDeals.length,
      pipeline_value: opportunities.reduce((sum, item) => sum + toNumber(item.value), 0),
      weighted_pipeline: opportunities.reduce((sum, item) => sum + toNumber(item.weighted_value), 0),
      proposal_value: proposals.reduce((sum, item) => sum + toNumber(item.proposal_value), 0),
      won_value: wonDeals.reduce((sum, item) => sum + toNumber(item.value), 0),
    },
    leads: sortDesc(leads).slice(0, 8).map(publicLead),
    opportunities: sortDesc(opportunities).slice(0, 8).map(publicOpportunity),
    proposals: sortDesc(proposals).slice(0, 8).map(publicProposal),
    deals: sortDesc(deals).slice(0, 8).map(publicDeal),
  };
}

export async function getBusinessDevelopmentOverview() {
  if (shouldUsePostgresPersistence()) {
    const prisma = await getPrismaClient();
    const [leads, opportunities, proposals, deals] = await Promise.all([
      prisma.lead.findMany({ where: { deleted_at: null }, include: { client_account: true, owner: true, source: true }, orderBy: { updated_at: "desc" } }),
      prisma.opportunity.findMany({ where: { deleted_at: null }, include: { client_account: true, owner: true, stage: true }, orderBy: { updated_at: "desc" } }),
      prisma.proposal.findMany({ where: { deleted_at: null }, include: { client_account: true, opportunity: true, owner: true }, orderBy: { updated_at: "desc" } }),
      prisma.deal.findMany({ where: { deleted_at: null }, include: { client_account: true, opportunity: true, proposal: true, products_services: true }, orderBy: { updated_at: "desc" } }),
    ]);
    return buildOverview({ leads, opportunities, proposals, deals });
  }

  const db = await readDb();
  ensureLocalStages(db);
  return buildOverview({
    leads: visible(getRecords(db, ENTITIES.leads)),
    opportunities: visible(getRecords(db, ENTITIES.opportunities)),
    proposals: visible(getRecords(db, ENTITIES.proposals)),
    deals: visible(getRecords(db, ENTITIES.deals)),
  });
}

export async function getSalesPipeline() {
  if (shouldUsePostgresPersistence()) {
    const prisma = await getPrismaClient();
    const [stages, opportunities] = await Promise.all([
      prisma.opportunityStage.findMany({ orderBy: { order_index: "asc" } }),
      prisma.opportunity.findMany({ where: { deleted_at: null }, include: { client_account: true, owner: true, stage: true }, orderBy: { updated_at: "desc" } }),
    ]);
    const publicStages = stages.map(publicStage);
    return {
      stages: publicStages,
      columns: publicStages.map((stage) => ({
        ...stage,
        opportunities: opportunities.filter((item) => item.stage_id === stage.id).map(publicOpportunity),
      })),
      opportunities: opportunities.map(publicOpportunity),
    };
  }

  const db = await readDb();
  const stages = ensureLocalStages(db);
  const opportunities = visible(getRecords(db, ENTITIES.opportunities)).map((item) => ({
    ...item,
    stage_id: item.stage_id || findLocalStage(db, item.stage_name)?.id || "stage-lead",
  }));
  return {
    stages,
    columns: stages.map((stage) => ({
      ...stage,
      opportunities: sortDesc(opportunities.filter((item) => item.stage_id === stage.id)).map(publicOpportunity),
    })),
    opportunities: sortDesc(opportunities).map(publicOpportunity),
  };
}

export async function listLeads() {
  if (shouldUsePostgresPersistence()) {
    const prisma = await getPrismaClient();
    return (await prisma.lead.findMany({ where: { deleted_at: null }, include: { client_account: true, owner: true, source: true }, orderBy: { updated_at: "desc" } })).map(publicLead);
  }
  const db = await readDb();
  return sortDesc(visible(getRecords(db, ENTITIES.leads))).map(publicLead);
}

export async function createLead(data = {}, actor = {}) {
  if (!stringOrNull(data.title)) throw new ApiError(400, "validation_error", "Lead title is required.");
  if (shouldUsePostgresPersistence()) {
    const prisma = await getPrismaClient();
    const owner = await findPrismaUser(actor);
    const source = data.source_id ? await prisma.leadSource.findUnique({ where: { id: data.source_id } }) : null;
    const lead = await prisma.lead.create({
      data: {
        title: stringOrNull(data.title),
        source_id: source?.id,
        owner_user_id: data.owner_user_id || owner?.id,
        subsidiary_id: data.subsidiary_id || null,
        client_account_id: data.client_account_id || null,
        status: data.status || "new",
        qualification: data.qualification || null,
        estimated_value: toNumber(data.estimated_value),
        description: data.description || null,
        metadata: data.metadata || {},
      },
      include: { client_account: true, owner: true, source: true },
    });
    return publicLead(lead);
  }

  const db = await readDb();
  const lead = nowStamped({
    id: data.id || crypto.randomUUID(),
    title: stringOrNull(data.title),
    source_id: data.source_id || null,
    owner_email: data.owner_email || actor.email || null,
    subsidiary_id: data.subsidiary_id || null,
    client_account_id: data.client_account_id || null,
    status: data.status || "new",
    qualification: data.qualification || null,
    estimated_value: toNumber(data.estimated_value),
    description: data.description || null,
    metadata: data.metadata || {},
  });
  getRecords(db, ENTITIES.leads).push(lead);
  await writeDb(db);
  return publicLead(lead);
}

export async function updateLead(id, data = {}) {
  if (shouldUsePostgresPersistence()) {
    const prisma = await getPrismaClient();
    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: stringOrNull(data.title) } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.qualification !== undefined ? { qualification: data.qualification } : {}),
        ...(data.estimated_value !== undefined ? { estimated_value: toNumber(data.estimated_value) } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.client_account_id !== undefined ? { client_account_id: data.client_account_id || null } : {}),
      },
      include: { client_account: true, owner: true, source: true },
    });
    return publicLead(lead);
  }
  const db = await readDb();
  const lead = visible(getRecords(db, ENTITIES.leads)).find((item) => item.id === id);
  if (!lead) throw new ApiError(404, "not_found", "Lead not found.");
  Object.assign(lead, data, { updated_at: new Date().toISOString(), updated_date: new Date().toISOString() });
  await writeDb(db);
  return publicLead(lead);
}

export async function listOpportunities() {
  if (shouldUsePostgresPersistence()) {
    const prisma = await getPrismaClient();
    return (await prisma.opportunity.findMany({ where: { deleted_at: null }, include: { client_account: true, owner: true, stage: true, proposals: true, deals: true }, orderBy: { updated_at: "desc" } })).map(publicOpportunity);
  }
  const db = await readDb();
  ensureLocalStages(db);
  return sortDesc(visible(getRecords(db, ENTITIES.opportunities))).map(publicOpportunity);
}

export async function createOpportunity(data = {}, actor = {}) {
  if (!stringOrNull(data.title)) throw new ApiError(400, "validation_error", "Opportunity title is required.");
  if (shouldUsePostgresPersistence()) {
    const prisma = await getPrismaClient();
    const owner = await findPrismaUser(actor);
    const stage = await findPrismaStage(data.stage_id || data.stage_name);
    const probability = Number(data.probability ?? stage?.probability ?? 10);
    const opportunity = await prisma.opportunity.create({
      data: {
        title: stringOrNull(data.title),
        lead_id: data.lead_id || null,
        client_account_id: data.client_account_id || null,
        primary_contact_id: data.primary_contact_id || null,
        owner_user_id: data.owner_user_id || owner?.id,
        subsidiary_id: data.subsidiary_id || null,
        stage_id: stage?.id || null,
        value: toNumber(data.value),
        probability,
        weighted_value: calculatedWeightedValue(data.value, probability),
        expected_close_date: dateOrNull(data.expected_close_date),
        source: data.source || null,
        industry: data.industry || null,
        description: data.description || null,
        products_services: data.products_services || [],
        next_action: data.next_action || null,
        next_follow_up_at: dateOrNull(data.next_follow_up_at),
        status: stage?.is_won_stage ? "won" : stage?.is_lost_stage ? "lost" : data.status || "open",
        metadata: data.metadata || {},
      },
      include: { client_account: true, owner: true, stage: true },
    });
    return publicOpportunity(opportunity);
  }

  const db = await readDb();
  const stage = findLocalStage(db, data.stage_id || data.stage_name) || findLocalStage(db);
  const probability = Number(data.probability ?? stage?.probability ?? 10);
  const opportunity = nowStamped({
    id: data.id || crypto.randomUUID(),
    title: stringOrNull(data.title),
    lead_id: data.lead_id || null,
    client_account_id: data.client_account_id || null,
    primary_contact_id: data.primary_contact_id || null,
    owner_email: data.owner_email || actor.email || null,
    subsidiary_id: data.subsidiary_id || null,
    stage_id: stage?.id,
    stage_name: stage?.name,
    value: toNumber(data.value),
    probability,
    weighted_value: calculatedWeightedValue(data.value, probability),
    expected_close_date: data.expected_close_date || null,
    source: data.source || null,
    industry: data.industry || null,
    description: data.description || null,
    products_services: data.products_services || [],
    next_action: data.next_action || null,
    next_follow_up_at: data.next_follow_up_at || null,
    status: stage?.is_won_stage ? "won" : stage?.is_lost_stage ? "lost" : data.status || "open",
    metadata: data.metadata || {},
  });
  getRecords(db, ENTITIES.opportunities).push(opportunity);
  await writeDb(db);
  return publicOpportunity(opportunity);
}

export async function updateOpportunity(id, data = {}) {
  if (shouldUsePostgresPersistence()) {
    const prisma = await getPrismaClient();
    let stage = null;
    if (data.stage_id || data.stage_name) stage = await findPrismaStage(data.stage_id || data.stage_name);
    const probability = Number(data.probability ?? stage?.probability ?? undefined);
    const update = {
      ...(data.title !== undefined ? { title: stringOrNull(data.title) } : {}),
      ...(data.client_account_id !== undefined ? { client_account_id: data.client_account_id || null } : {}),
      ...(stage ? { stage_id: stage.id, status: stage.is_won_stage ? "won" : stage.is_lost_stage ? "lost" : "open" } : {}),
      ...(data.value !== undefined ? { value: toNumber(data.value) } : {}),
      ...(probability !== undefined && !Number.isNaN(probability) ? { probability } : {}),
      ...(data.expected_close_date !== undefined ? { expected_close_date: dateOrNull(data.expected_close_date) } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.next_action !== undefined ? { next_action: data.next_action } : {}),
      ...(data.next_follow_up_at !== undefined ? { next_follow_up_at: dateOrNull(data.next_follow_up_at) } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
    };
    const current = await prisma.opportunity.findUnique({ where: { id } });
    if (!current) throw new ApiError(404, "not_found", "Opportunity not found.");
    update.weighted_value = calculatedWeightedValue(update.value ?? current.value, update.probability ?? current.probability);
    const opportunity = await prisma.opportunity.update({ where: { id }, data: update, include: { client_account: true, owner: true, stage: true } });
    return publicOpportunity(opportunity);
  }

  const db = await readDb();
  const opportunity = visible(getRecords(db, ENTITIES.opportunities)).find((item) => item.id === id);
  if (!opportunity) throw new ApiError(404, "not_found", "Opportunity not found.");
  let stage = null;
  if (data.stage_id || data.stage_name) stage = findLocalStage(db, data.stage_id || data.stage_name);
  Object.assign(opportunity, data);
  if (stage) {
    opportunity.stage_id = stage.id;
    opportunity.stage_name = stage.name;
    opportunity.probability = Number(data.probability ?? stage.probability);
    opportunity.status = stage.is_won_stage ? "won" : stage.is_lost_stage ? "lost" : "open";
  }
  opportunity.weighted_value = calculatedWeightedValue(opportunity.value, opportunity.probability);
  opportunity.updated_at = new Date().toISOString();
  opportunity.updated_date = opportunity.updated_at;
  await writeDb(db);
  return publicOpportunity(opportunity);
}

export async function moveOpportunityStage(id, stageIdOrName, actor = {}) {
  const result = await updateOpportunity(id, { stage_id: stageIdOrName, stage_name: stageIdOrName, last_activity_at: new Date().toISOString() });
  if (shouldUsePostgresPersistence()) {
    const prisma = await getPrismaClient();
    const user = await findPrismaUser(actor);
    await prisma.opportunityActivity.create({
      data: {
        opportunity_id: id,
        user_id: user?.id,
        activity_type: "stage_change",
        subject: `Moved opportunity to ${result.stage?.name || result.stage_name || result.stage_id}`,
        occurred_at: new Date(),
      },
    }).catch(() => null);
  }
  return result;
}

export async function listProposals() {
  if (shouldUsePostgresPersistence()) {
    const prisma = await getPrismaClient();
    return (await prisma.proposal.findMany({ where: { deleted_at: null }, include: { client_account: true, opportunity: true, owner: true, deals: true }, orderBy: { updated_at: "desc" } })).map(publicProposal);
  }
  const db = await readDb();
  return sortDesc(visible(getRecords(db, ENTITIES.proposals))).map(publicProposal);
}

export async function createProposal(data = {}, actor = {}) {
  if (!data.client_account_id) throw new ApiError(400, "validation_error", "Proposal requires a client account.");
  if (shouldUsePostgresPersistence()) {
    const owner = await findPrismaUser(actor);
    const prisma = await getPrismaClient();
    const proposal = await prisma.proposal.create({
      data: {
        client_account_id: data.client_account_id,
        opportunity_id: data.opportunity_id || null,
        owner_user_id: data.owner_user_id || owner?.id,
        proposal_value: toNumber(data.proposal_value),
        submission_date: dateOrNull(data.submission_date),
        expiry_date: dateOrNull(data.expiry_date),
        status: data.status || "draft",
        document_id: data.document_id || null,
        notes: data.notes || null,
        next_action: data.next_action || null,
        metadata: data.metadata || {},
      },
      include: { client_account: true, opportunity: true, owner: true },
    });
    return publicProposal(proposal);
  }
  const db = await readDb();
  const proposal = nowStamped({
    id: data.id || crypto.randomUUID(),
    client_account_id: data.client_account_id,
    opportunity_id: data.opportunity_id || null,
    owner_email: data.owner_email || actor.email || null,
    proposal_value: toNumber(data.proposal_value),
    submission_date: data.submission_date || null,
    expiry_date: data.expiry_date || null,
    status: data.status || "draft",
    document_id: data.document_id || null,
    notes: data.notes || null,
    next_action: data.next_action || null,
    metadata: data.metadata || {},
  });
  getRecords(db, ENTITIES.proposals).push(proposal);
  await writeDb(db);
  return publicProposal(proposal);
}

export async function updateProposal(id, data = {}) {
  if (shouldUsePostgresPersistence()) {
    const prisma = await getPrismaClient();
    const proposal = await prisma.proposal.update({
      where: { id },
      data: {
        ...(data.proposal_value !== undefined ? { proposal_value: toNumber(data.proposal_value) } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.submission_date !== undefined ? { submission_date: dateOrNull(data.submission_date) } : {}),
        ...(data.expiry_date !== undefined ? { expiry_date: dateOrNull(data.expiry_date) } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.next_action !== undefined ? { next_action: data.next_action } : {}),
      },
      include: { client_account: true, opportunity: true, owner: true },
    });
    return publicProposal(proposal);
  }
  const db = await readDb();
  const proposal = visible(getRecords(db, ENTITIES.proposals)).find((item) => item.id === id);
  if (!proposal) throw new ApiError(404, "not_found", "Proposal not found.");
  Object.assign(proposal, data, { updated_at: new Date().toISOString(), updated_date: new Date().toISOString() });
  await writeDb(db);
  return publicProposal(proposal);
}

export async function listDeals() {
  if (shouldUsePostgresPersistence()) {
    const prisma = await getPrismaClient();
    return (await prisma.deal.findMany({ where: { deleted_at: null }, include: { client_account: true, opportunity: true, proposal: true, products_services: true }, orderBy: { updated_at: "desc" } })).map(publicDeal);
  }
  const db = await readDb();
  return sortDesc(visible(getRecords(db, ENTITIES.deals))).map(publicDeal);
}

export async function createDeal(data = {}) {
  if (!data.client_account_id) throw new ApiError(400, "validation_error", "Deal requires a client account.");
  if (shouldUsePostgresPersistence()) {
    const prisma = await getPrismaClient();
    const deal = await prisma.deal.create({
      data: {
        client_account_id: data.client_account_id,
        opportunity_id: data.opportunity_id || null,
        proposal_id: data.proposal_id || null,
        status: data.status || "open",
        value: toNumber(data.value),
        closed_at: dateOrNull(data.closed_at),
        lost_reason: data.lost_reason || null,
        metadata: data.metadata || {},
        products_services: data.products_services?.length ? {
          create: data.products_services.map((item) => ({
            name: item.name,
            description: item.description || null,
            value: toNumber(item.value),
            metadata: item.metadata || {},
          })),
        } : undefined,
      },
      include: { client_account: true, opportunity: true, proposal: true, products_services: true },
    });
    return publicDeal(deal);
  }
  const db = await readDb();
  const deal = nowStamped({
    id: data.id || crypto.randomUUID(),
    client_account_id: data.client_account_id,
    opportunity_id: data.opportunity_id || null,
    proposal_id: data.proposal_id || null,
    status: data.status || "open",
    value: toNumber(data.value),
    closed_at: data.closed_at || null,
    lost_reason: data.lost_reason || null,
    products_services: data.products_services || [],
    metadata: data.metadata || {},
  });
  getRecords(db, ENTITIES.deals).push(deal);
  await writeDb(db);
  return publicDeal(deal);
}

export async function updateDeal(id, data = {}) {
  if (shouldUsePostgresPersistence()) {
    const prisma = await getPrismaClient();
    const deal = await prisma.deal.update({
      where: { id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.value !== undefined ? { value: toNumber(data.value) } : {}),
        ...(data.closed_at !== undefined ? { closed_at: dateOrNull(data.closed_at) } : {}),
        ...(data.lost_reason !== undefined ? { lost_reason: data.lost_reason } : {}),
      },
      include: { client_account: true, opportunity: true, proposal: true, products_services: true },
    });
    return publicDeal(deal);
  }
  const db = await readDb();
  const deal = visible(getRecords(db, ENTITIES.deals)).find((item) => item.id === id);
  if (!deal) throw new ApiError(404, "not_found", "Deal not found.");
  Object.assign(deal, data, { updated_at: new Date().toISOString(), updated_date: new Date().toISOString() });
  await writeDb(db);
  return publicDeal(deal);
}
