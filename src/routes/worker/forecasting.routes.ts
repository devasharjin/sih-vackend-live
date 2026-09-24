import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/authMiddleware";
import { UserRole } from "../../models/auth/user.model";
import { asyncHandler } from "../../shared/asyncHandler";
import {
  getWorkerDemandHotspots,
  getWorkerSmartShifts,
} from "../../controllers/worker/forecasting.controller";

const router = Router();

// Protect all routes with authentication & WORKER role check
router.use(requireAuth, requireRole(UserRole.WORKER));

// GET /api/worker/forecasting/hotspots - AI zone hotspots and real-time surges
router.get("/hotspots", asyncHandler(getWorkerDemandHotspots));

// GET /api/worker/forecasting/smart-shifts - Personalized shift recommendations & incentives
router.get("/smart-shifts", asyncHandler(getWorkerSmartShifts));

export default router;
