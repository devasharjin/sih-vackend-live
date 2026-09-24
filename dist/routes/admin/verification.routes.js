"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const user_model_1 = require("../../models/auth/user.model");
const asyncHandler_1 = require("../../shared/asyncHandler");
const verifications_1 = require("../../controllers/admin/verifications");
const router = (0, express_1.Router)();
// Protect all admin verification endpoints with authentication and SUPERADMIN role
router.use(authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(user_model_1.UserRole.SUPERADMIN));
// GET /api/admin/verifications/cooperatives - list all cooperatives with status filter, search & pagination
router.get("/cooperatives", (0, asyncHandler_1.asyncHandler)(verifications_1.getAdminCooperatives));
// GET /api/admin/verifications/cooperatives/:id - single cooperative verification details
router.get("/cooperatives/:id", (0, asyncHandler_1.asyncHandler)(verifications_1.getAdminCooperativeById));
// PATCH /api/admin/verifications/cooperatives/:id/verify - approve, reject, or revert cooperative registration
router.patch("/cooperatives/:id/verify", (0, asyncHandler_1.asyncHandler)(verifications_1.verifyAdminCooperative));
exports.default = router;
//# sourceMappingURL=verification.routes.js.map