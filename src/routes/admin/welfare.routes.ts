import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/authMiddleware";
import { UserRole } from "../../models/auth/user.model";
import { asyncHandler } from "../../shared/asyncHandler";
import {
  getPlatformWelfareStats,
  getAdminClaims,
  auditAdminClaim,
  getPlatformWelfarePolicyConfig,
} from "../../controllers/admin/welfare.controller";

const router = Router();

// Protect all routes with authentication & SUPERADMIN role check
router.use(requireAuth, requireRole(UserRole.SUPERADMIN));

// GET /api/admin/welfare/stats - Platform reserve analytics and claims summary
router.get("/stats", asyncHandler(getPlatformWelfareStats));

// GET /api/admin/welfare/claims - List all claims across the platform with filters
router.get("/claims", asyncHandler(getAdminClaims));

// PATCH /api/admin/welfare/claims/:id/audit - Super Admin audit/override on a claim
router.patch("/claims/:id/audit", asyncHandler(auditAdminClaim));

// GET /api/admin/welfare/policy - Welfare policy and coverage parameters
router.get("/policy", asyncHandler(getPlatformWelfarePolicyConfig));

export default router;
