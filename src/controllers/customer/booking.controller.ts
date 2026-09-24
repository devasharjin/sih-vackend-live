import { Request, Response } from "express";
import mongoose from "mongoose";
import Booking, {
  BookingStatus,
  BookingType,
  CancelledByRole,
  PaymentStatus,
  UrgencyLevel,
} from "../../models/booking.model";
import Rating from "../../models/rating.model";
import Service from "../../models/service.model";
import { fail, ok } from "../../shared/envelope";
import { FIXED_TRANSPORT_FEE, BillingService } from "../../services/billing.service";
import { notifyWorkers } from "../../services/socket.service";

export async function createBooking(req: Request, res: Response) {
  const customerId = (req.user as any)?.userId || (req.user as any)?._id;
  if (!customerId) {
    return fail(res, "Unauthorized", null, 401);
  }

  const {
    serviceId,
    address,
    scheduledDate,
    customerNotes,
    units = 1,
    bookingType = "SCHEDULED",
    isEmergency = false,
    urgencyLevel = "STANDARD",
    emergencyDetails,
  } = req.body;

  if (!serviceId || !mongoose.Types.ObjectId.isValid(serviceId)) {
    return fail(res, "Valid service ID is required", null, 400);
  }

  if (!address || (typeof address === "string" && !address.trim())) {
    return fail(res, "Service address is required", null, 400);
  }

  const service = await Service.findById(serviceId);
  if (!service) {
    return fail(res, "Service not found", null, 404);
  }

  if (!service.isActive) {
    return fail(res, "This service is currently unavailable for booking", null, 400);
  }

  // Resolve booking classification & urgency
  let finalBookingType = BookingType.SCHEDULED;
  let finalIsEmergency = false;
  let finalUrgency = UrgencyLevel.STANDARD;

  const typeUpper = String(bookingType).toUpperCase();
  if (isEmergency === true || isEmergency === "true" || typeUpper === "EMERGENCY") {
    finalBookingType = BookingType.EMERGENCY;
    finalIsEmergency = true;
    finalUrgency =
      urgencyLevel && urgencyLevel !== "STANDARD"
        ? (urgencyLevel as UrgencyLevel)
        : UrgencyLevel.CRITICAL;
  } else if (typeUpper === "PREMIUM" || typeUpper === "ON_DEMAND") {
    finalBookingType = BookingType.PREMIUM;
    finalIsEmergency = false;
    finalUrgency = UrgencyLevel.HIGH;
  }

  // Set immediate scheduled date for premium dispatches if not provided, or emergency
  const finalScheduledDate =
    finalIsEmergency
      ? new Date()
      : scheduledDate
      ? new Date(scheduledDate)
      : new Date();

  // Extract service benchmark rates
  const baseFirstHourRate = service.firstHourRate ?? service.hourlyPrice ?? 0;
  const baseAdditionalHourRate = service.additionalHourRate ?? service.firstHourRate ?? service.hourlyPrice ?? 0;
  const transportFee = FIXED_TRANSPORT_FEE;
  const cooperativePercentage = service.cooperativeShare ?? 10;
  const insurancePercentage = service.insuranceShare ?? 5;

  // Surge / Priority multiplier:
  // 15% higher for premium (> 4.5★ specialist guarantee), 20% higher for emergency (EMERGENCY)
  const rateMultiplier =
    finalBookingType === BookingType.EMERGENCY || finalIsEmergency
      ? 1.20
      : finalBookingType === BookingType.PREMIUM
      ? 1.15
      : 1.0;

  const firstHourRate = Math.round(baseFirstHourRate * rateMultiplier);
  const additionalHourRate = Math.round(baseAdditionalHourRate * rateMultiplier);

  // Initial estimate calculation for first billable hour
  const initialCalc = BillingService.calculateBillingAndDistribution(60, {
    firstHourRate,
    additionalHourRate,
    cooperativePercentage,
    insurancePercentage,
    transportFee,
  });

  const formattedAddress =
    typeof address === "string"
      ? { street: address.trim() }
      : {
        street: address.street?.trim() || "",
        city: address.city?.trim() || "",
        state: address.state?.trim() || "",
        pincode: address.pincode?.trim() || "",
        landmark: address.landmark?.trim() || "",
      };

  if (!formattedAddress.street) {
    return fail(res, "Street address is required", null, 400);
  }

  const finalEmergencyDetails = {
    immediateContact:
      typeof emergencyDetails?.immediateContact === "string"
        ? emergencyDetails.immediateContact.trim()
        : "",
    notes:
      typeof emergencyDetails?.notes === "string"
        ? emergencyDetails.notes.trim()
        : typeof customerNotes === "string"
        ? customerNotes.trim()
        : "",
  };

  const booking = await Booking.create({
    customer: customerId,
    service: service._id,
    category: service.category,
    address: formattedAddress,
    scheduledDate: finalScheduledDate,
    customerNotes: typeof customerNotes === "string" ? customerNotes.trim() : "",
    bookingType: finalBookingType,
    isEmergency: finalIsEmergency,
    urgencyLevel: finalUrgency,
    emergencyDetails: finalEmergencyDetails,
    priceType: service.priceType || "hourly",
    rate: firstHourRate,
    units: 1,
    totalAmount: initialCalc.customerTotal,
    pricing: {
      firstHourRate,
      additionalHourRate,
      transportFee,
      cooperativePercentage,
      insurancePercentage,
      actualDurationMinutes: 0,
      billableHours: 1,
      firstHourCharge: initialCalc.firstHourCharge,
      additionalHoursCharge: 0,
      serviceAmount: initialCalc.serviceAmount,
      cooperativeShareAmount: initialCalc.cooperativeAdminShare,
      insuranceShareAmount: initialCalc.insuranceShare,
      workerNetEarnings: initialCalc.workerNetEarnings,
      customerTotalAmount: initialCalc.customerTotal,
      isFinalized: false,
    },
    status: BookingStatus.PENDING,
    paymentStatus: PaymentStatus.PENDING,
  });

  const populated = await Booking.findById(booking._id)
    .populate("service", "name description priceType firstHourRate additionalHourRate transportFee cooperativeShare insuranceShare hourlyPrice metersPrice emergencyAvailable emergencyFee")
    .populate("category", "name icon");

  const successMessage = finalIsEmergency
    ? "🚨 Emergency SOS request broadcast! Matching immediately with verified responders."
    : finalBookingType === BookingType.PREMIUM || (finalBookingType as any) === "ON_DEMAND"
    ? "⭐ Premium specialist booking submitted! Routed exclusively to top-rated specialists (> 4.5★)."
    : "Booking requested successfully";

  // Broadcast real-time socket notification to all active workers if emergency
  if (finalIsEmergency) {
    try {
      notifyWorkers("emergency:created", {
        type: "EMERGENCY_BOOKING",
        title: "🚨 URGENT: New Emergency SOS Callout!",
        message: `Emergency SOS callout for ${service.name} at ${booking.address?.street || "Customer Location"}!`,
        bookingId: booking._id.toString(),
        bookingNumber: booking.bookingNumber,
        serviceName: service.name,
        categoryName: (populated as any)?.category?.name || "Emergency Service",
        rate: booking.rate,
        totalAmount: booking.totalAmount,
        address: booking.address,
        urgencyLevel: booking.urgencyLevel || "CRITICAL",
        hazardType: booking.emergencyDetails?.hazardType,
        immediateContact: booking.emergencyDetails?.immediateContact,
        createdAt: booking.createdAt?.toISOString(),
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to emit emergency socket event:", err);
    }
  }

  return ok(res, populated, successMessage);
}

export async function getCustomerBookings(req: Request, res: Response) {
  const customerId = (req.user as any)?.userId || (req.user as any)?._id;
  if (!customerId) {
    return fail(res, "Unauthorized", null, 401);
  }

  const { status, type, isEmergency } = req.query;
  const filter: Record<string, any> = { customer: customerId };

  if (status && typeof status === "string" && status !== "all") {
    filter.status = status.toUpperCase();
  }
  if (type && typeof type === "string" && type !== "all") {
    filter.bookingType = type.toUpperCase();
  }
  if (isEmergency !== undefined) {
    filter.isEmergency = String(isEmergency).toLowerCase() === "true";
  }

  const bookings = await Booking.find(filter)
    .populate("service", "name description priceType firstHourRate additionalHourRate transportFee cooperativeShare insuranceShare hourlyPrice metersPrice")
    .populate("category", "name icon slug")
    .populate({
      path: "worker",
      select: "userId rating totalJobsCompleted location",
      populate: {
        path: "userId",
        select: "name phone profilePicture email",
      },
    })
    .populate("rating")
    .sort({ createdAt: -1 })
    .lean();

  return ok(res, bookings, "Customer bookings retrieved successfully");
}

export async function getBookingById(req: Request, res: Response) {
  const customerId = (req.user as any)?.userId || (req.user as any)?._id;
  const id = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0];

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return fail(res, "Invalid booking ID", null, 400);
  }

  const booking = await Booking.findById(id)
    .populate("service", "name description priceType firstHourRate additionalHourRate transportFee cooperativeShare insuranceShare hourlyPrice metersPrice")
    .populate("category", "name icon slug")
    .populate({
      path: "worker",
      select: "userId rating totalJobsCompleted location",
      populate: {
        path: "userId",
        select: "name phone profilePicture email",
      },
    })
    .populate("rating")
    .lean();

  if (!booking) {
    return fail(res, "Booking not found", null, 404);
  }

  // Ensure customer owns the booking
  if (booking.customer.toString() !== customerId.toString()) {
    return fail(res, "Forbidden: You cannot access this booking", null, 403);
  }

  return ok(res, booking, "Booking retrieved successfully");
}

export async function cancelBooking(req: Request, res: Response) {
  const customerId = (req.user as any)?.userId || (req.user as any)?._id;
  const id = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0];
  const { reason = "Cancelled by customer" } = req.body;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return fail(res, "Invalid booking ID", null, 400);
  }

  const booking = await Booking.findById(id);
  if (!booking) {
    return fail(res, "Booking not found", null, 404);
  }

  if (booking.customer.toString() !== customerId.toString()) {
    return fail(res, "Forbidden: You cannot cancel this booking", null, 403);
  }

  if (
    booking.status !== BookingStatus.PENDING &&
    booking.status !== BookingStatus.CONFIRMED &&
    booking.status !== BookingStatus.ASSIGNED
  ) {
    return fail(
      res,
      `Cannot cancel booking in '${booking.status}' status. Only pending or confirmed bookings can be cancelled.`,
      null,
      400
    );
  }

  booking.status = BookingStatus.CANCELLED;
  booking.cancelledAt = new Date();
  booking.cancelledBy = CancelledByRole.CUSTOMER;
  booking.cancellationReason = typeof reason === "string" ? reason.trim() : "Cancelled by customer";

  await booking.save();

  const updated = await Booking.findById(booking._id)
    .populate("service", "name description priceType firstHourRate additionalHourRate transportFee cooperativeShare insuranceShare hourlyPrice metersPrice")
    .populate("category", "name icon");

  return ok(res, updated, "Booking cancelled successfully");
}

export async function rateBooking(req: Request, res: Response) {
  const customerId = (req.user as any)?.userId || (req.user as any)?._id;
  const id = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0];
  const { rating, review = "" } = req.body;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return fail(res, "Invalid booking ID", null, 400);
  }

  const numericRating = Number(rating);
  if (!numericRating || numericRating < 1 || numericRating > 5) {
    return fail(res, "Rating must be a number between 1 and 5", null, 400);
  }

  const booking = await Booking.findById(id);
  if (!booking) {
    return fail(res, "Booking not found", null, 404);
  }

  if (booking.customer.toString() !== customerId.toString()) {
    return fail(res, "Forbidden: You cannot rate this booking", null, 403);
  }

  if (booking.status !== BookingStatus.COMPLETED) {
    return fail(res, "You can only rate completed bookings", null, 400);
  }

  if (booking.paymentStatus !== PaymentStatus.PAID) {
    return fail(
      res,
      "Payment must be completed before submitting a rating and review",
      null,
      400
    );
  }

  if (!booking.worker) {
    return fail(res, "No worker was associated with this booking to rate", null, 400);
  }

  // Find existing rating if previously submitted, or create a new one to prevent duplicate key errors
  let ratingDoc = await Rating.findOne({ booking: booking._id });

  if (ratingDoc) {
    ratingDoc.rating = numericRating;
    ratingDoc.review = typeof review === "string" ? review.trim() : "";
    if (!ratingDoc.worker && booking.worker) {
      ratingDoc.worker = booking.worker;
    }
    if (!ratingDoc.service && booking.service) {
      ratingDoc.service = booking.service;
    }
    if (!ratingDoc.cooperative && booking.cooperative) {
      ratingDoc.cooperative = booking.cooperative;
    }
    await ratingDoc.save();
  } else {
    try {
      ratingDoc = await Rating.create({
        booking: booking._id,
        customer: customerId,
        worker: booking.worker,
        service: booking.service,
        cooperative: booking.cooperative,
        rating: numericRating,
        review: typeof review === "string" ? review.trim() : "",
      });
    } catch (err: any) {
      if (
        err?.code === 11000 &&
        (err?.keyPattern?.bookingId || err?.message?.includes("bookingId_1"))
      ) {
        await Rating.collection.dropIndex("bookingId_1").catch(() => { });
        ratingDoc = await Rating.create({
          booking: booking._id,
          customer: customerId,
          worker: booking.worker,
          service: booking.service,
          cooperative: booking.cooperative,
          rating: numericRating,
          review: typeof review === "string" ? review.trim() : "",
        });
      } else {
        throw err;
      }
    }
  }

  booking.rating = ratingDoc._id;
  booking.isRated = true;
  await booking.save();

  return ok(res, ratingDoc, "Rating and review submitted successfully");
}
