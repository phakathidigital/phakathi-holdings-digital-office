import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/permissions.js";
import { asyncHandler, sendData, sendError } from "../../utils/apiResponse.js";
import { writeAuditLog } from "../../services/auditLogService.js";
import workRoutes from "./work.js";
import {
  backfillRelationalUsers,
  listDepartments,
  listOrganisations,
  listSubsidiaries,
  listUsers,
} from "../../services/v1/organisationService.js";

const router = express.Router();

router.get("/health", (_req, res) => {
  sendData(res, {
    ok: true,
    service: "phakathi-flow-api",
    version: "v1",
  });
});

router.use(requireAuth);
router.use("/work", workRoutes);

router.get(
  "/me",
  asyncHandler(async (req, res) => {
    sendData(res, req.user);
  }),
);

router.get(
  "/organisations",
  asyncHandler(async (_req, res) => {
    sendData(res, await listOrganisations());
  }),
);

router.get(
  "/subsidiaries",
  asyncHandler(async (_req, res) => {
    sendData(res, await listSubsidiaries());
  }),
);

router.get(
  "/departments",
  asyncHandler(async (req, res) => {
    sendData(
      res,
      await listDepartments({
        subsidiaryId: req.query.subsidiary_id,
        subsidiaryName: req.query.subsidiary,
      }),
    );
  }),
);

router.get(
  "/users",
  requirePermission("employees.view"),
  asyncHandler(async (req, res) => {
    sendData(
      res,
      await listUsers({
        subsidiaryId: req.query.subsidiary_id,
        subsidiaryName: req.query.subsidiary,
        includeDeleted: req.query.include_deleted === "true",
      }),
    );
  }),
);

router.post(
  "/admin/backfill-relational-users",
  requirePermission("admin.manage"),
  asyncHandler(async (req, res) => {
    const result = await backfillRelationalUsers();
    await writeAuditLog(req.db, {
      actor: req.authenticatedUser || req.user,
      action: "backfill_relational_users",
      entity_type: "User",
      new_value: result,
      req,
    });
    sendData(res, result);
  }),
);

router.use((err, _req, res, _next) => {
  sendError(res, err);
});

export default router;
