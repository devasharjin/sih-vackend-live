import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/authMiddleware";
import { UserRole } from "../../models/auth/user.model";
import { asyncHandler } from "../../shared/asyncHandler";
import {
  getCooperativePayments,
  getCooperativePaymentStats,
} from "../../controllers/cooperative/payment.controller";

const router = Router();

// Protect all cooperative payment endpoints with authentication and COOPERATIVE role
router.use(requireAuth, requireRole(UserRole.COOPERATIVE));

// GET /api/cooperative/payments - List payments for authenticated cooperative society
router.get("/", asyncHandler(getCooperativePayments));

// GET /api/cooperative/payments/stats - Financial metrics & worker earnings aggregation
router.get("/stats", asyncHandler(getCooperativePaymentStats));

export default router;
