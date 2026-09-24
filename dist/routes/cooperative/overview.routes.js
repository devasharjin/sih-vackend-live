"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const user_model_1 = require("../../models/auth/user.model");
const asyncHandler_1 = require("../../shared/asyncHandler");
const overview_controller_1 = require("../../controllers/cooperative/overview.controller");
const router = (0, express_1.Router)();
// Protect all cooperative overview endpoints with authentication and COOPERATIVE role
router.use(authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(user_model_1.UserRole.COOPERATIVE));
// GET /api/cooperative/overview - Society operational command center analytics
router.get("/", (0, asyncHandler_1.asyncHandler)(overview_controller_1.getCooperativeOverview));
exports.default = router;
//# sourceMappingURL=overview.routes.js.map