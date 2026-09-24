"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const user_model_1 = require("../../models/auth/user.model");
const asyncHandler_1 = require("../../shared/asyncHandler");
const members_controller_1 = require("../../controllers/cooperative/members.controller");
const router = (0, express_1.Router)();
// Protect all cooperative members endpoints with authentication and COOPERATIVE role
router.use(authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(user_model_1.UserRole.COOPERATIVE));
// GET /api/cooperative/members - List member roster with filters, search, and KPI metrics
router.get("/", (0, asyncHandler_1.asyncHandler)(members_controller_1.getCooperativeMembers));
// GET /api/cooperative/members/:id - Single member dossier with work history and welfare claims
router.get("/:id", (0, asyncHandler_1.asyncHandler)(members_controller_1.getMemberDetails));
// PATCH /api/cooperative/members/:id/status - Toggle active/inactive status or update availability
router.patch("/:id/status", (0, asyncHandler_1.asyncHandler)(members_controller_1.toggleMemberStatus));
exports.default = router;
//# sourceMappingURL=members.routes.js.map