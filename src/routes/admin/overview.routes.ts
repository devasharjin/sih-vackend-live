import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/authMiddleware";
import { UserRole } from "../../models/auth/user.model";
import { asyncHandler } from "../../shared/asyncHandler";
import { getAdminPlatformOverview } from "../../controllers/admin/overview.controller";

const router = Router();

// Protect all admin overview endpoints with authentication and SUPERADMIN role
router.use(requireAuth, requireRole(UserRole.SUPERADMIN));

// GET /api/admin/overview - Aggregated executive command center metrics
router.get("/", asyncHandler(getAdminPlatformOverview));

export default router;
