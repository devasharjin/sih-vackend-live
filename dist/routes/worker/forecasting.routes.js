"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const user_model_1 = require("../../models/auth/user.model");
const asyncHandler_1 = require("../../shared/asyncHandler");
const forecasting_controller_1 = require("../../controllers/worker/forecasting.controller");
const router = (0, express_1.Router)();
// Protect all routes with authentication & WORKER role check
router.use(authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(user_model_1.UserRole.WORKER));
// GET /api/worker/forecasting/hotspots - AI zone hotspots and real-time surges
router.get("/hotspots", (0, asyncHandler_1.asyncHandler)(forecasting_controller_1.getWorkerDemandHotspots));
// GET /api/worker/forecasting/smart-shifts - Personalized shift recommendations & incentives
router.get("/smart-shifts", (0, asyncHandler_1.asyncHandler)(forecasting_controller_1.getWorkerSmartShifts));
exports.default = router;
//# sourceMappingURL=forecasting.routes.js.map