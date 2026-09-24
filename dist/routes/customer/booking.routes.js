"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const user_model_1 = require("../../models/auth/user.model");
const asyncHandler_1 = require("../../shared/asyncHandler");
const booking_controller_1 = require("../../controllers/customer/booking.controller");
const router = (0, express_1.Router)();
// Protect all customer booking routes with authentication & Customer/SuperAdmin role check
router.use(authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(user_model_1.UserRole.CUSTOMER, user_model_1.UserRole.SUPERADMIN));
// POST /api/customer/bookings - Create new gig service booking
router.post("/", (0, asyncHandler_1.asyncHandler)(booking_controller_1.createBooking));
// GET /api/customer/bookings - List bookings for current customer
router.get("/", (0, asyncHandler_1.asyncHandler)(booking_controller_1.getCustomerBookings));
// GET /api/customer/bookings/:id - Get specific booking detail
router.get("/:id", (0, asyncHandler_1.asyncHandler)(booking_controller_1.getBookingById));
// PATCH /api/customer/bookings/:id/cancel - Cancel a pending or confirmed booking
router.patch("/:id/cancel", (0, asyncHandler_1.asyncHandler)(booking_controller_1.cancelBooking));
// POST /api/customer/bookings/:id/rate - Rate and review a completed booking
router.post("/:id/rate", (0, asyncHandler_1.asyncHandler)(booking_controller_1.rateBooking));
exports.default = router;
//# sourceMappingURL=booking.routes.js.map