import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/authMiddleware";
import { UserRole } from "../../models/auth/user.model";
import { asyncHandler } from "../../shared/asyncHandler";
import {
  getCooperativeForecastOverview,
  getCategoryDemandBreakdown,
  getZoneAllocationMatrix,
  getRebalancePlans,
  executeRebalancePlan,
  getFairRotationMetrics,
} from "../../controllers/cooperative/forecasting.controller";

const router = Router();

// Protect all routes with authentication & COOPERATIVE role check
router.use(requireAuth, requireRole(UserRole.COOPERATIVE));

// GET /api/cooperative/forecasting/overview - 7-day demand projections & 24h curve
router.get("/overview", asyncHandler(getCooperativeForecastOverview));

// GET /api/cooperative/forecasting/category-breakdown - Category volume & surge trends
router.get("/category-breakdown", asyncHandler(getCategoryDemandBreakdown));

// GET /api/cooperative/forecasting/zone-matrix - Zone allocations and capacity gaps
router.get("/zone-matrix", asyncHandler(getZoneAllocationMatrix));

// GET /api/cooperative/forecasting/rebalance-plans - AI workforce rebalancing suggestions
router.get("/rebalance-plans", asyncHandler(getRebalancePlans));

// POST /api/cooperative/forecasting/rebalance-plans/:id/execute - Trigger workforce mobilization
router.post("/rebalance-plans/:id/execute", asyncHandler(executeRebalancePlan));

// GET /api/cooperative/forecasting/fair-rotation - Equitable member gig rotation stats
router.get("/fair-rotation", asyncHandler(getFairRotationMetrics));

export default router;
