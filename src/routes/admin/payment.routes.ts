import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/authMiddleware";
import { UserRole } from "../../models/auth/user.model";
import { asyncHandler } from "../../shared/asyncHandler";
import {
  getAdminPayments,
  getAdminPaymentStats,
} from "../../controllers/admin/payment.controller";

const router = Router();

// Protect all admin payment endpoints with authentication and SUPERADMIN role
router.use(requireAuth, requireRole(UserRole.SUPERADMIN));

// GET /api/admin/payments - List all payments with filter, search & pagination
router.get("/", asyncHandler(getAdminPayments));

// GET /api/admin/payments/stats - Get platform-wide payment statistics
router.get("/stats", asyncHandler(getAdminPaymentStats));

export default router;
