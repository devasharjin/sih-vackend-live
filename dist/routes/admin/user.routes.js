"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const user_model_1 = require("../../models/auth/user.model");
const asyncHandler_1 = require("../../shared/asyncHandler");
const user_controller_1 = require("../../controllers/admin/user.controller");
const router = (0, express_1.Router)();
// Protect all admin user routes with authentication & SUPERADMIN role
router.use(authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(user_model_1.UserRole.SUPERADMIN));
// GET /api/admin/users/stats - aggregated count metrics by role and status
router.get("/stats", (0, asyncHandler_1.asyncHandler)(user_controller_1.getAdminUserStats));
// GET /api/admin/users - paginated, searchable list of users with role and status filters
router.get("/", (0, asyncHandler_1.asyncHandler)(user_controller_1.getAdminUsers));
// GET /api/admin/users/:id - get single user details with linked profile & activity
router.get("/:id", (0, asyncHandler_1.asyncHandler)(user_controller_1.getAdminUserById));
// PATCH /api/admin/users/:id/status - suspend, activate, or deactivate user account
router.patch("/:id/status", (0, asyncHandler_1.asyncHandler)(user_controller_1.updateAdminUserStatus));
// PATCH /api/admin/users/:id/role - update assigned roles for user
router.patch("/:id/role", (0, asyncHandler_1.asyncHandler)(user_controller_1.updateAdminUserRoles));
exports.default = router;
//# sourceMappingURL=user.routes.js.map