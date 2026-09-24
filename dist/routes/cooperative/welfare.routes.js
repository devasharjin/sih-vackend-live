"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const user_model_1 = require("../../models/auth/user.model");
const asyncHandler_1 = require("../../shared/asyncHandler");
const welfare_controller_1 = require("../../controllers/cooperative/welfare.controller");
const router = (0, express_1.Router)();
// Protect all routes with authentication & COOPERATIVE role check
router.use(authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(user_model_1.UserRole.COOPERATIVE));
// GET /api/cooperative/welfare/stats - Fund reserve analytics and summary
router.get("/stats", (0, asyncHandler_1.asyncHandler)(welfare_controller_1.getCooperativeWelfareStats));
// GET /api/cooperative/welfare/claims - List claims from cooperative workers with filters
router.get("/claims", (0, asyncHandler_1.asyncHandler)(welfare_controller_1.getCooperativeClaims));
// PATCH /api/cooperative/welfare/claims/:id/status - Review, approve, reject, or disburse claim
router.patch("/claims/:id/status", (0, asyncHandler_1.asyncHandler)(welfare_controller_1.updateCooperativeClaimStatus));
// POST /api/cooperative/welfare/emergency-grant - Directly issue emergency relief grant
router.post("/emergency-grant", (0, asyncHandler_1.asyncHandler)(welfare_controller_1.issueEmergencyGrant));
// GET /api/cooperative/welfare/workers - Worker insurance directory with accrued contributions
router.get("/workers", (0, asyncHandler_1.asyncHandler)(welfare_controller_1.getCooperativeWorkerWelfareList));
exports.default = router;
//# sourceMappingURL=welfare.routes.js.map