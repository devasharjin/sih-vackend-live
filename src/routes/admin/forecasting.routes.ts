import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/authMiddleware";
import { UserRole } from "../../models/auth/user.model";
import { asyncHandler } from "../../shared/asyncHandler";
import {
  getPlatformForecastingMatrix,
  getCrossCooperativeExchange,
  getEngineHealth,
  retrainModel,
} from "../../controllers/admin/forecasting.controller";

const router = Router();

// Protect all routes with authentication & SUPERADMIN role check
router.use(requireAuth, requireRole(UserRole.SUPERADMIN));

// GET /api/admin/forecasting/matrix - Platform-wide forecasting telemetry
router.get("/matrix", asyncHandler(getPlatformForecastingMatrix));

// GET /api/admin/forecasting/cross-cooperative-exchange - Inter-cooperative workforce rebalancing
router.get("/cross-cooperative-exchange", asyncHandler(getCrossCooperativeExchange));

// GET /api/admin/forecasting/engine-health - AI engine accuracy, MAPE, and priors
router.get("/engine-health", asyncHandler(getEngineHealth));

// POST /api/admin/forecasting/retrain - Trigger model recalibration
router.post("/retrain", asyncHandler(retrainModel));

export default router;
