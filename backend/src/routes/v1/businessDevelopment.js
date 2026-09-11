import express from "express";
import { requirePermission } from "../../middleware/permissions.js";
import { asyncHandler, sendData } from "../../utils/apiResponse.js";
import { writeAuditLog } from "../../services/auditLogService.js";
import {
  createDeal,
  createLead,
  createOpportunity,
  createProjectFromWonOpportunity,
  createProposal,
  getBusinessDevelopmentOverview,
  getSalesPipeline,
  listDeals,
  listLeads,
  listOpportunities,
  listProposals,
  moveOpportunityStage,
  updateDeal,
  updateLead,
  updateOpportunity,
  updateProposal,
} from "../../services/v1/businessDevelopmentService.js";

const router = express.Router();

async function audit(req, action, entityType, result, previous = undefined) {
  await writeAuditLog(req.db, {
    actor: req.authenticatedUser || req.user,
    action,
    entity_type: entityType,
    entity_id: result?.id,
    old_value: previous,
    new_value: result,
    req,
  });
}

router.get(
  "/overview",
  requirePermission("sales.view"),
  asyncHandler(async (_req, res) => {
    sendData(res, await getBusinessDevelopmentOverview());
  }),
);

router.get(
  "/pipeline",
  requirePermission("sales.view"),
  asyncHandler(async (_req, res) => {
    sendData(res, await getSalesPipeline());
  }),
);

router.get(
  "/leads",
  requirePermission("sales.view"),
  asyncHandler(async (_req, res) => {
    sendData(res, await listLeads());
  }),
);

router.post(
  "/leads",
  requirePermission("sales.manage"),
  asyncHandler(async (req, res) => {
    const result = await createLead(req.body, req.user);
    await audit(req, "create_lead", "Lead", result);
    sendData(res, result, undefined, 201);
  }),
);

router.patch(
  "/leads/:id",
  requirePermission("sales.manage"),
  asyncHandler(async (req, res) => {
    const result = await updateLead(req.params.id, req.body);
    await audit(req, "update_lead", "Lead", result);
    sendData(res, result);
  }),
);

router.get(
  "/opportunities",
  requirePermission("sales.view"),
  asyncHandler(async (_req, res) => {
    sendData(res, await listOpportunities());
  }),
);

router.post(
  "/opportunities",
  requirePermission("sales.manage"),
  asyncHandler(async (req, res) => {
    const result = await createOpportunity(req.body, req.user);
    await audit(req, "create_opportunity", "Opportunity", result);
    sendData(res, result, undefined, 201);
  }),
);

router.patch(
  "/opportunities/:id",
  requirePermission("sales.manage"),
  asyncHandler(async (req, res) => {
    const result = await updateOpportunity(req.params.id, req.body);
    await audit(req, "update_opportunity", "Opportunity", result);
    sendData(res, result);
  }),
);

router.patch(
  "/opportunities/:id/stage",
  requirePermission("sales.manage"),
  asyncHandler(async (req, res) => {
    const result = await moveOpportunityStage(req.params.id, req.body.stage_id || req.body.stage_name || req.body.stage, req.user);
    await audit(req, "move_opportunity_stage", "Opportunity", result);
    sendData(res, result);
  }),
);

router.post(
  "/opportunities/:id/create-project",
  requirePermission("sales.manage"),
  requirePermission("projects.create"),
  asyncHandler(async (req, res) => {
    const result = await createProjectFromWonOpportunity(req.params.id, req.body, req.user);
    await audit(req, "create_project_from_won_opportunity", "Opportunity", result);
    sendData(res, result, undefined, 201);
  }),
);

router.get(
  "/proposals",
  requirePermission("sales.view"),
  asyncHandler(async (_req, res) => {
    sendData(res, await listProposals());
  }),
);

router.post(
  "/proposals",
  requirePermission("sales.manage"),
  asyncHandler(async (req, res) => {
    const result = await createProposal(req.body, req.user);
    await audit(req, "create_proposal", "Proposal", result);
    sendData(res, result, undefined, 201);
  }),
);

router.patch(
  "/proposals/:id",
  requirePermission("sales.manage"),
  asyncHandler(async (req, res) => {
    const result = await updateProposal(req.params.id, req.body);
    await audit(req, "update_proposal", "Proposal", result);
    sendData(res, result);
  }),
);

router.get(
  "/deals",
  requirePermission("sales.view"),
  asyncHandler(async (_req, res) => {
    sendData(res, await listDeals());
  }),
);

router.post(
  "/deals",
  requirePermission("sales.manage"),
  asyncHandler(async (req, res) => {
    const result = await createDeal(req.body, req.user);
    await audit(req, "create_deal", "Deal", result);
    sendData(res, result, undefined, 201);
  }),
);

router.patch(
  "/deals/:id",
  requirePermission("sales.manage"),
  asyncHandler(async (req, res) => {
    const result = await updateDeal(req.params.id, req.body);
    await audit(req, "update_deal", "Deal", result);
    sendData(res, result);
  }),
);

export default router;
