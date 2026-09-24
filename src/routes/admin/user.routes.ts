import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/authMiddleware";
import { UserRole } from "../../models/auth/user.model";
import { asyncHandler } from "../../shared/asyncHandler";
import {
  getAdminUsers,
  getAdminUserStats,
  getAdminUserById,
  updateAdminUserStatus,
  updateAdminUserRoles,
} from "../../controllers/admin/user.controller";

const router = Router();

// Protect all admin user routes with authentication & SUPERADMIN role
router.use(requireAuth, requireRole(UserRole.SUPERADMIN));

// GET /api/admin/users/stats - aggregated count metrics by role and status
router.get("/stats", asyncHandler(getAdminUserStats));

// GET /api/admin/users - paginated, searchable list of users with role and status filters
router.get("/", asyncHandler(getAdminUsers));

// GET /api/admin/users/:id - get single user details with linked profile & activity
router.get("/:id", asyncHandler(getAdminUserById));

// PATCH /api/admin/users/:id/status - suspend, activate, or deactivate user account
router.patch("/:id/status", asyncHandler(updateAdminUserStatus));

// PATCH /api/admin/users/:id/role - update assigned roles for user
router.patch("/:id/role", asyncHandler(updateAdminUserRoles));

export default router;
