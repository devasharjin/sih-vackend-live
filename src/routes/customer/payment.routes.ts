import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/authMiddleware";
import { UserRole } from "../../models/auth/user.model";
import { asyncHandler } from "../../shared/asyncHandler";
import {
  createPaymentOrder,
  verifyPayment,
  getPaymentDetails,
  getRazorpayConfig,
} from "../../controllers/customer/payment.controller";

const router = Router();

// Protect all customer payment routes
router.use(requireAuth, requireRole(UserRole.CUSTOMER, UserRole.SUPERADMIN));

// GET /api/customer/payments/config - Get public Razorpay key ID and status
router.get("/config", asyncHandler(getRazorpayConfig));

// POST /api/customer/payments/create-order - Create Razorpay order for booking
router.post("/create-order", asyncHandler(createPaymentOrder));

// POST /api/customer/payments/verify - Verify payment signature and mark as PAID
router.post("/verify", asyncHandler(verifyPayment));

// GET /api/customer/payments/booking/:bookingId - Get payment record for booking
router.get("/booking/:bookingId", asyncHandler(getPaymentDetails));

export default router;
