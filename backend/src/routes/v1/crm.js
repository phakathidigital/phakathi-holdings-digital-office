import express from "express";
import { requirePermission } from "../../middleware/permissions.js";
import { asyncHandler, sendData } from "../../utils/apiResponse.js";
import { writeAuditLog } from "../../services/auditLogService.js";
import {
  addContact,
  addInteraction,
  addNote,
  addOpportunity,
  createAccount,
  getAccount360,
  getAccountActivityTimeline,
  getCrmOverview,
  listAccounts,
  refreshHealth,
  updateAccount,
} from "../../services/v1/crmService.js";

const router = express.Router();

async function audit(req, action, entityType, result, previous = undefined) {
  await writeAuditLog(req.db, {
    actor: req.authenticatedUser || req.user,
    action,
    entity_type: entityType,
    entity_id: result?.id || result?.account?.id,
    old_value: previous,
    new_value: result,
    req,
  });
}

router.get(
  "/overview",
  requirePermission("crm.view"),
  asyncHandler(async (_req, res) => {
    sendData(res, await getCrmOverview());
  }),
);

router.get(
  "/client-intelligence",
  requirePermission("crm.view"),
  asyncHandler(async (_req, res) => {
    sendData(res, await getCrmOverview());
  }),
);

router.get(
  "/accounts",
  requirePermission("crm.view"),
  asyncHandler(async (_req, res) => {
    sendData(res, await listAccounts());
  }),
);

router.post(
  "/accounts",
  requirePermission("crm.create"),
  asyncHandler(async (req, res) => {
    const result = await createAccount(req.body, req.user);
    await audit(req, "create_client_account", "ClientAccount", result);
    sendData(res, result, undefined, 201);
  }),
);

router.get(
  "/accounts/:id",
  requirePermission("crm.view"),
  asyncHandler(async (req, res) => {
    sendData(res, await getAccount360(req.params.id));
  }),
);

router.get(
  "/accounts/:id/account-360",
  requirePermission("crm.view"),
  asyncHandler(async (req, res) => {
    sendData(res, await getAccount360(req.params.id));
  }),
);

router.get(
  "/accounts/:id/timeline",
  requirePermission("crm.view"),
  asyncHandler(async (req, res) => {
    sendData(res, await getAccountActivityTimeline(req.params.id));
  }),
);

router.patch(
  "/accounts/:id",
  requirePermission("crm.edit"),
  asyncHandler(async (req, res) => {
    const result = await updateAccount(req.params.id, req.body);
    await audit(req, "update_client_account", "ClientAccount", result);
    sendData(res, result);
  }),
);

router.post(
  "/accounts/:id/contacts",
  requirePermission("crm.create"),
  asyncHandler(async (req, res) => {
    const result = await addContact(req.params.id, req.body, req.user);
    await audit(req, "create_client_contact", "ClientContact", result);
    sendData(res, result, undefined, 201);
  }),
);

router.post(
  "/accounts/:id/interactions",
  requirePermission("crm.create"),
  asyncHandler(async (req, res) => {
    const result = await addInteraction(req.params.id, req.body, req.user);
    await audit(req, "create_client_interaction", "ClientInteraction", result);
    sendData(res, result, undefined, 201);
  }),
);

router.post(
  "/accounts/:id/notes",
  requirePermission("crm.create"),
  asyncHandler(async (req, res) => {
    const result = await addNote(req.params.id, req.body, req.user);
    await audit(req, "create_client_note", "ClientNote", result);
    sendData(res, result, undefined, 201);
  }),
);

router.post(
  "/accounts/:id/opportunities",
  requirePermission("crm.create"),
  asyncHandler(async (req, res) => {
    const result = await addOpportunity(req.params.id, req.body, req.user);
    await audit(req, "create_opportunity", "Opportunity", result);
    sendData(res, result, undefined, 201);
  }),
);

router.post(
  "/accounts/:id/health/refresh",
  requirePermission("crm.edit"),
  asyncHandler(async (req, res) => {
    const result = await refreshHealth(req.params.id);
    await audit(req, "refresh_client_health", "ClientHealthSnapshot", result);
    sendData(res, result, undefined, 201);
  }),
);

export default router;
