import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/authMiddleware";
import { UserRole } from "../../models/auth/user.model";
import { asyncHandler } from "../../shared/asyncHandler";
import {
  getCooperativeWelfareStats,
  getCooperativeClaims,
  updateCooperativeClaimStatus,
  issueEmergencyGrant,
  getCooperativeWorkerWelfareList,
} from "../../controllers/cooperative/welfare.controller";

const router = Router();

// Protect all routes with authentication & COOPERATIVE role check
router.use(requireAuth, requireRole(UserRole.COOPERATIVE));

// GET /api/cooperative/welfare/stats - Fund reserve analytics and summary
router.get("/stats", asyncHandler(getCooperativeWelfareStats));

// GET /api/cooperative/welfare/claims - List claims from cooperative workers with filters
router.get("/claims", asyncHandler(getCooperativeClaims));

// PATCH /api/cooperative/welfare/claims/:id/status - Review, approve, reject, or disburse claim
router.patch("/claims/:id/status", asyncHandler(updateCooperativeClaimStatus));

// POST /api/cooperative/welfare/emergency-grant - Directly issue emergency relief grant
router.post("/emergency-grant", asyncHandler(issueEmergencyGrant));

// GET /api/cooperative/welfare/workers - Worker insurance directory with accrued contributions
router.get("/workers", asyncHandler(getCooperativeWorkerWelfareList));

export default router;
