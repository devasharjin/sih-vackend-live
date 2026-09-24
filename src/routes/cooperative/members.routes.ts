import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/authMiddleware";
import { UserRole } from "../../models/auth/user.model";
import { asyncHandler } from "../../shared/asyncHandler";
import {
  getCooperativeMembers,
  toggleMemberStatus,
  getMemberDetails,
} from "../../controllers/cooperative/members.controller";

const router = Router();

// Protect all cooperative members endpoints with authentication and COOPERATIVE role
router.use(requireAuth, requireRole(UserRole.COOPERATIVE));

// GET /api/cooperative/members - List member roster with filters, search, and KPI metrics
router.get("/", asyncHandler(getCooperativeMembers));

// GET /api/cooperative/members/:id - Single member dossier with work history and welfare claims
router.get("/:id", asyncHandler(getMemberDetails));

// PATCH /api/cooperative/members/:id/status - Toggle active/inactive status or update availability
router.patch("/:id/status", asyncHandler(toggleMemberStatus));

export default router;
