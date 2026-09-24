"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const user_model_1 = require("../../models/auth/user.model");
const asyncHandler_1 = require("../../shared/asyncHandler");
const forecasting_controller_1 = require("../../controllers/admin/forecasting.controller");
const router = (0, express_1.Router)();
// Protect all routes with authentication & SUPERADMIN role check
router.use(authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(user_model_1.UserRole.SUPERADMIN));
// GET /api/admin/forecasting/matrix - Platform-wide forecasting telemetry
router.get("/matrix", (0, asyncHandler_1.asyncHandler)(forecasting_controller_1.getPlatformForecastingMatrix));
// GET /api/admin/forecasting/cross-cooperative-exchange - Inter-cooperative workforce rebalancing
router.get("/cross-cooperative-exchange", (0, asyncHandler_1.asyncHandler)(forecasting_controller_1.getCrossCooperativeExchange));
// GET /api/admin/forecasting/engine-health - AI engine accuracy, MAPE, and priors
router.get("/engine-health", (0, asyncHandler_1.asyncHandler)(forecasting_controller_1.getEngineHealth));
// POST /api/admin/forecasting/retrain - Trigger model recalibration
router.post("/retrain", (0, asyncHandler_1.asyncHandler)(forecasting_controller_1.retrainModel));
exports.default = router;
//# sourceMappingURL=forecasting.routes.js.map