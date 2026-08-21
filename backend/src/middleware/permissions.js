import { ApiError } from "../utils/apiResponse.js";
import { userHasPermission } from "../services/permissionService.js";

export function requirePermission(permissionKey) {
  return async (req, _res, next) => {
    try {
      const allowed = await userHasPermission(req.user, permissionKey);
      if (!allowed) throw new ApiError(403, "forbidden", "You do not have permission to perform this action.");
      next();
    } catch (error) {
      next(error);
    }
  };
}
