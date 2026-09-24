import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/authMiddleware";
import { UserRole } from "../../models/auth/user.model";
import { asyncHandler } from "../../shared/asyncHandler";
import { getCooperativeOverview } from "../../controllers/cooperative/overview.controller";

const router = Router();

// Protect all cooperative overview endpoints with authentication and COOPERATIVE role
router.use(requireAuth, requireRole(UserRole.COOPERATIVE));

// GET /api/cooperative/overview - Society operational command center analytics
router.get("/", asyncHandler(getCooperativeOverview));

export default router;
