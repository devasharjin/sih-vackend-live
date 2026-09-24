import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/authMiddleware";
import { UserRole } from "../../models/auth/user.model";
import { asyncHandler } from "../../shared/asyncHandler";
import {
  getAdminCooperatives,
  getAdminCooperativeById,
  verifyAdminCooperative,
} from "../../controllers/admin/verifications";

const router = Router();

// Protect all admin verification endpoints with authentication and SUPERADMIN role
router.use(requireAuth, requireRole(UserRole.SUPERADMIN));

// GET /api/admin/verifications/cooperatives - list all cooperatives with status filter, search & pagination
router.get("/cooperatives", asyncHandler(getAdminCooperatives));

// GET /api/admin/verifications/cooperatives/:id - single cooperative verification details
router.get("/cooperatives/:id", asyncHandler(getAdminCooperativeById));

// PATCH /api/admin/verifications/cooperatives/:id/verify - approve, reject, or revert cooperative registration
router.patch("/cooperatives/:id/verify", asyncHandler(verifyAdminCooperative));

export default router;
