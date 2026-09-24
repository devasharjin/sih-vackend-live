"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const user_model_1 = require("../../models/auth/user.model");
const asyncHandler_1 = require("../../shared/asyncHandler");
const forecasting_controller_1 = require("../../controllers/cooperative/forecasting.controller");
const router = (0, express_1.Router)();
// Protect all routes with authentication & COOPERATIVE role check
router.use(authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(user_model_1.UserRole.COOPERATIVE));
// GET /api/cooperative/forecasting/overview - 7-day demand projections & 24h curve
router.get("/overview", (0, asyncHandler_1.asyncHandler)(forecasting_controller_1.getCooperativeForecastOverview));
// GET /api/cooperative/forecasting/category-breakdown - Category volume & surge trends
router.get("/category-breakdown", (0, asyncHandler_1.asyncHandler)(forecasting_controller_1.getCategoryDemandBreakdown));
// GET /api/cooperative/forecasting/zone-matrix - Zone allocations and capacity gaps
router.get("/zone-matrix", (0, asyncHandler_1.asyncHandler)(forecasting_controller_1.getZoneAllocationMatrix));
// GET /api/cooperative/forecasting/rebalance-plans - AI workforce rebalancing suggestions
router.get("/rebalance-plans", (0, asyncHandler_1.asyncHandler)(forecasting_controller_1.getRebalancePlans));
// POST /api/cooperative/forecasting/rebalance-plans/:id/execute - Trigger workforce mobilization
router.post("/rebalance-plans/:id/execute", (0, asyncHandler_1.asyncHandler)(forecasting_controller_1.executeRebalancePlan));
// GET /api/cooperative/forecasting/fair-rotation - Equitable member gig rotation stats
router.get("/fair-rotation", (0, asyncHandler_1.asyncHandler)(forecasting_controller_1.getFairRotationMetrics));
exports.default = router;
//# sourceMappingURL=forecasting.routes.js.map