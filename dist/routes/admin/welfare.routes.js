"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const user_model_1 = require("../../models/auth/user.model");
const asyncHandler_1 = require("../../shared/asyncHandler");
const welfare_controller_1 = require("../../controllers/admin/welfare.controller");
const router = (0, express_1.Router)();
// Protect all routes with authentication & SUPERADMIN role check
router.use(authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(user_model_1.UserRole.SUPERADMIN));
// GET /api/admin/welfare/stats - Platform reserve analytics and claims summary
router.get("/stats", (0, asyncHandler_1.asyncHandler)(welfare_controller_1.getPlatformWelfareStats));
// GET /api/admin/welfare/claims - List all claims across the platform with filters
router.get("/claims", (0, asyncHandler_1.asyncHandler)(welfare_controller_1.getAdminClaims));
// PATCH /api/admin/welfare/claims/:id/audit - Super Admin audit/override on a claim
router.patch("/claims/:id/audit", (0, asyncHandler_1.asyncHandler)(welfare_controller_1.auditAdminClaim));
// GET /api/admin/welfare/policy - Welfare policy and coverage parameters
router.get("/policy", (0, asyncHandler_1.asyncHandler)(welfare_controller_1.getPlatformWelfarePolicyConfig));
exports.default = router;
//# sourceMappingURL=welfare.routes.js.map