import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/authMiddleware";
import { UserRole } from "../../models/auth/user.model";
import { asyncHandler } from "../../shared/asyncHandler";
import {
  getWorkerWelfareOverview,
  getWorkerClaims,
  fileWorkerClaim,
  getWorkerClaimById,
} from "../../controllers/worker/welfare.controller";

const router = Router();

// Protect all routes with authentication & WORKER role check
router.use(requireAuth, requireRole(UserRole.WORKER));

// GET /api/worker/welfare/overview - Policy details, accumulated fund contributions & claim stats
router.get("/overview", asyncHandler(getWorkerWelfareOverview));

// GET /api/worker/welfare/claims - List worker's claims with status filtering
router.get("/claims", asyncHandler(getWorkerClaims));

// POST /api/worker/welfare/claims - Submit new claim
router.post("/claims", asyncHandler(fileWorkerClaim));

// GET /api/worker/welfare/claims/:id - Get specific claim details and audit log
router.get("/claims/:id", asyncHandler(getWorkerClaimById));

export default router;
