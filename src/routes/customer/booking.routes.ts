import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/authMiddleware";
import { UserRole } from "../../models/auth/user.model";
import { asyncHandler } from "../../shared/asyncHandler";
import {
  createBooking,
  getCustomerBookings,
  getBookingById,
  cancelBooking,
  rateBooking,
} from "../../controllers/customer/booking.controller";

const router = Router();

// Protect all customer booking routes with authentication & Customer/SuperAdmin role check
router.use(requireAuth, requireRole(UserRole.CUSTOMER, UserRole.SUPERADMIN));

// POST /api/customer/bookings - Create new gig service booking
router.post("/", asyncHandler(createBooking));

// GET /api/customer/bookings - List bookings for current customer
router.get("/", asyncHandler(getCustomerBookings));

// GET /api/customer/bookings/:id - Get specific booking detail
router.get("/:id", asyncHandler(getBookingById));

// PATCH /api/customer/bookings/:id/cancel - Cancel a pending or confirmed booking
router.patch("/:id/cancel", asyncHandler(cancelBooking));

// POST /api/customer/bookings/:id/rate - Rate and review a completed booking
router.post("/:id/rate", asyncHandler(rateBooking));

export default router;
