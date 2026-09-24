"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const user_model_1 = require("../../models/auth/user.model");
const asyncHandler_1 = require("../../shared/asyncHandler");
const payment_controller_1 = require("../../controllers/customer/payment.controller");
const router = (0, express_1.Router)();
// Protect all customer payment routes
router.use(authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(user_model_1.UserRole.CUSTOMER, user_model_1.UserRole.SUPERADMIN));
// GET /api/customer/payments/config - Get public Razorpay key ID and status
router.get("/config", (0, asyncHandler_1.asyncHandler)(payment_controller_1.getRazorpayConfig));
// POST /api/customer/payments/create-order - Create Razorpay order for booking
router.post("/create-order", (0, asyncHandler_1.asyncHandler)(payment_controller_1.createPaymentOrder));
// POST /api/customer/payments/verify - Verify payment signature and mark as PAID
router.post("/verify", (0, asyncHandler_1.asyncHandler)(payment_controller_1.verifyPayment));
// GET /api/customer/payments/booking/:bookingId - Get payment record for booking
router.get("/booking/:bookingId", (0, asyncHandler_1.asyncHandler)(payment_controller_1.getPaymentDetails));
exports.default = router;
//# sourceMappingURL=payment.routes.js.map