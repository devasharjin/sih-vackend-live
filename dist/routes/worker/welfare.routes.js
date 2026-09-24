"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const user_model_1 = require("../../models/auth/user.model");
const asyncHandler_1 = require("../../shared/asyncHandler");
const welfare_controller_1 = require("../../controllers/worker/welfare.controller");
const router = (0, express_1.Router)();
// Protect all routes with authentication & WORKER role check
router.use(authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(user_model_1.UserRole.WORKER));
// GET /api/worker/welfare/overview - Policy details, accumulated fund contributions & claim stats
router.get("/overview", (0, asyncHandler_1.asyncHandler)(welfare_controller_1.getWorkerWelfareOverview));
// GET /api/worker/welfare/claims - List worker's claims with status filtering
router.get("/claims", (0, asyncHandler_1.asyncHandler)(welfare_controller_1.getWorkerClaims));
// POST /api/worker/welfare/claims - Submit new claim
router.post("/claims", (0, asyncHandler_1.asyncHandler)(welfare_controller_1.fileWorkerClaim));
// GET /api/worker/welfare/claims/:id - Get specific claim details and audit log
router.get("/claims/:id", (0, asyncHandler_1.asyncHandler)(welfare_controller_1.getWorkerClaimById));
exports.default = router;
//# sourceMappingURL=welfare.routes.js.map