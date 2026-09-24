"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBooking = createBooking;
exports.getCustomerBookings = getCustomerBookings;
exports.getBookingById = getBookingById;
exports.cancelBooking = cancelBooking;
exports.rateBooking = rateBooking;
const mongoose_1 = __importDefault(require("mongoose"));
const booking_model_1 = __importStar(require("../../models/booking.model"));
const rating_model_1 = __importDefault(require("../../models/rating.model"));
const service_model_1 = __importDefault(require("../../models/service.model"));
const envelope_1 = require("../../shared/envelope");
const billing_service_1 = require("../../services/billing.service");
const socket_service_1 = require("../../services/socket.service");
async function createBooking(req, res) {
    const customerId = req.user?.userId || req.user?._id;
    if (!customerId) {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const { serviceId, address, scheduledDate, customerNotes, units = 1, bookingType = "SCHEDULED", isEmergency = false, urgencyLevel = "STANDARD", emergencyDetails, } = req.body;
    if (!serviceId || !mongoose_1.default.Types.ObjectId.isValid(serviceId)) {
        return (0, envelope_1.fail)(res, "Valid service ID is required", null, 400);
    }
    if (!address || (typeof address === "string" && !address.trim())) {
        return (0, envelope_1.fail)(res, "Service address is required", null, 400);
    }
    const service = await service_model_1.default.findById(serviceId);
    if (!service) {
        return (0, envelope_1.fail)(res, "Service not found", null, 404);
    }
    if (!service.isActive) {
        return (0, envelope_1.fail)(res, "This service is currently unavailable for booking", null, 400);
    }
    // Resolve booking classification & urgency
    let finalBookingType = booking_model_1.BookingType.SCHEDULED;
    let finalIsEmergency = false;
    let finalUrgency = booking_model_1.UrgencyLevel.STANDARD;
    const typeUpper = String(bookingType).toUpperCase();
    if (isEmergency === true || isEmergency === "true" || typeUpper === "EMERGENCY") {
        finalBookingType = booking_model_1.BookingType.EMERGENCY;
        finalIsEmergency = true;
        finalUrgency =
            urgencyLevel && urgencyLevel !== "STANDARD"
                ? urgencyLevel
                : booking_model_1.UrgencyLevel.CRITICAL;
    }
    else if (typeUpper === "PREMIUM" || typeUpper === "ON_DEMAND") {
        finalBookingType = booking_model_1.BookingType.PREMIUM;
        finalIsEmergency = false;
        finalUrgency = booking_model_1.UrgencyLevel.HIGH;
    }
    // Set immediate scheduled date for premium dispatches if not provided, or emergency
    const finalScheduledDate = finalIsEmergency
        ? new Date()
        : scheduledDate
            ? new Date(scheduledDate)
            : new Date();
    // Extract service benchmark rates
    const baseFirstHourRate = service.firstHourRate ?? service.hourlyPrice ?? 0;
    const baseAdditionalHourRate = service.additionalHourRate ?? service.firstHourRate ?? service.hourlyPrice ?? 0;
    const transportFee = billing_service_1.FIXED_TRANSPORT_FEE;
    const cooperativePercentage = service.cooperativeShare ?? 10;
    const insurancePercentage = service.insuranceShare ?? 5;
    // Surge / Priority multiplier:
    // 15% higher for premium (> 4.5★ specialist guarantee), 20% higher for emergency (EMERGENCY)
    const rateMultiplier = finalBookingType === booking_model_1.BookingType.EMERGENCY || finalIsEmergency
        ? 1.20
        : finalBookingType === booking_model_1.BookingType.PREMIUM
            ? 1.15
            : 1.0;
    const firstHourRate = Math.round(baseFirstHourRate * rateMultiplier);
    const additionalHourRate = Math.round(baseAdditionalHourRate * rateMultiplier);
    // Initial estimate calculation for first billable hour
    const initialCalc = billing_service_1.BillingService.calculateBillingAndDistribution(60, {
        firstHourRate,
        additionalHourRate,
        cooperativePercentage,
        insurancePercentage,
        transportFee,
    });
    const formattedAddress = typeof address === "string"
        ? { street: address.trim() }
        : {
            street: address.street?.trim() || "",
            city: address.city?.trim() || "",
            state: address.state?.trim() || "",
            pincode: address.pincode?.trim() || "",
            landmark: address.landmark?.trim() || "",
        };
    if (!formattedAddress.street) {
        return (0, envelope_1.fail)(res, "Street address is required", null, 400);
    }
    const finalEmergencyDetails = {
        immediateContact: typeof emergencyDetails?.immediateContact === "string"
            ? emergencyDetails.immediateContact.trim()
            : "",
        notes: typeof emergencyDetails?.notes === "string"
            ? emergencyDetails.notes.trim()
            : typeof customerNotes === "string"
                ? customerNotes.trim()
                : "",
    };
    const booking = await booking_model_1.default.create({
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
        status: booking_model_1.BookingStatus.PENDING,
        paymentStatus: booking_model_1.PaymentStatus.PENDING,
    });
    const populated = await booking_model_1.default.findById(booking._id)
        .populate("service", "name description priceType firstHourRate additionalHourRate transportFee cooperativeShare insuranceShare hourlyPrice metersPrice emergencyAvailable emergencyFee")
        .populate("category", "name icon");
    const successMessage = finalIsEmergency
        ? "🚨 Emergency SOS request broadcast! Matching immediately with verified responders."
        : finalBookingType === booking_model_1.BookingType.PREMIUM || finalBookingType === "ON_DEMAND"
            ? "⭐ Premium specialist booking submitted! Routed exclusively to top-rated specialists (> 4.5★)."
            : "Booking requested successfully";
    // Broadcast real-time socket notification to all active workers if emergency
    if (finalIsEmergency) {
        try {
            (0, socket_service_1.notifyWorkers)("emergency:created", {
                type: "EMERGENCY_BOOKING",
                title: "🚨 URGENT: New Emergency SOS Callout!",
                message: `Emergency SOS callout for ${service.name} at ${booking.address?.street || "Customer Location"}!`,
                bookingId: booking._id.toString(),
                bookingNumber: booking.bookingNumber,
                serviceName: service.name,
                categoryName: populated?.category?.name || "Emergency Service",
                rate: booking.rate,
                totalAmount: booking.totalAmount,
                address: booking.address,
                urgencyLevel: booking.urgencyLevel || "CRITICAL",
                hazardType: booking.emergencyDetails?.hazardType,
                immediateContact: booking.emergencyDetails?.immediateContact,
                createdAt: booking.createdAt?.toISOString(),
                timestamp: new Date().toISOString(),
            });
        }
        catch (err) {
            console.error("Failed to emit emergency socket event:", err);
        }
    }
    return (0, envelope_1.ok)(res, populated, successMessage);
}
async function getCustomerBookings(req, res) {
    const customerId = req.user?.userId || req.user?._id;
    if (!customerId) {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const { status, type, isEmergency } = req.query;
    const filter = { customer: customerId };
    if (status && typeof status === "string" && status !== "all") {
        filter.status = status.toUpperCase();
    }
    if (type && typeof type === "string" && type !== "all") {
        filter.bookingType = type.toUpperCase();
    }
    if (isEmergency !== undefined) {
        filter.isEmergency = String(isEmergency).toLowerCase() === "true";
    }
    const bookings = await booking_model_1.default.find(filter)
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
    return (0, envelope_1.ok)(res, bookings, "Customer bookings retrieved successfully");
}
async function getBookingById(req, res) {
    const customerId = req.user?.userId || req.user?._id;
    const id = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0];
    if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        return (0, envelope_1.fail)(res, "Invalid booking ID", null, 400);
    }
    const booking = await booking_model_1.default.findById(id)
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
        return (0, envelope_1.fail)(res, "Booking not found", null, 404);
    }
    // Ensure customer owns the booking
    if (booking.customer.toString() !== customerId.toString()) {
        return (0, envelope_1.fail)(res, "Forbidden: You cannot access this booking", null, 403);
    }
    return (0, envelope_1.ok)(res, booking, "Booking retrieved successfully");
}
async function cancelBooking(req, res) {
    const customerId = req.user?.userId || req.user?._id;
    const id = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0];
    const { reason = "Cancelled by customer" } = req.body;
    if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        return (0, envelope_1.fail)(res, "Invalid booking ID", null, 400);
    }
    const booking = await booking_model_1.default.findById(id);
    if (!booking) {
        return (0, envelope_1.fail)(res, "Booking not found", null, 404);
    }
    if (booking.customer.toString() !== customerId.toString()) {
        return (0, envelope_1.fail)(res, "Forbidden: You cannot cancel this booking", null, 403);
    }
    if (booking.status !== booking_model_1.BookingStatus.PENDING &&
        booking.status !== booking_model_1.BookingStatus.CONFIRMED &&
        booking.status !== booking_model_1.BookingStatus.ASSIGNED) {
        return (0, envelope_1.fail)(res, `Cannot cancel booking in '${booking.status}' status. Only pending or confirmed bookings can be cancelled.`, null, 400);
    }
    booking.status = booking_model_1.BookingStatus.CANCELLED;
    booking.cancelledAt = new Date();
    booking.cancelledBy = booking_model_1.CancelledByRole.CUSTOMER;
    booking.cancellationReason = typeof reason === "string" ? reason.trim() : "Cancelled by customer";
    await booking.save();
    const updated = await booking_model_1.default.findById(booking._id)
        .populate("service", "name description priceType firstHourRate additionalHourRate transportFee cooperativeShare insuranceShare hourlyPrice metersPrice")
        .populate("category", "name icon");
    return (0, envelope_1.ok)(res, updated, "Booking cancelled successfully");
}
async function rateBooking(req, res) {
    const customerId = req.user?.userId || req.user?._id;
    const id = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0];
    const { rating, review = "" } = req.body;
    if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        return (0, envelope_1.fail)(res, "Invalid booking ID", null, 400);
    }
    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
        return (0, envelope_1.fail)(res, "Rating must be a number between 1 and 5", null, 400);
    }
    const booking = await booking_model_1.default.findById(id);
    if (!booking) {
        return (0, envelope_1.fail)(res, "Booking not found", null, 404);
    }
    if (booking.customer.toString() !== customerId.toString()) {
        return (0, envelope_1.fail)(res, "Forbidden: You cannot rate this booking", null, 403);
    }
    if (booking.status !== booking_model_1.BookingStatus.COMPLETED) {
        return (0, envelope_1.fail)(res, "You can only rate completed bookings", null, 400);
    }
    if (booking.paymentStatus !== booking_model_1.PaymentStatus.PAID) {
        return (0, envelope_1.fail)(res, "Payment must be completed before submitting a rating and review", null, 400);
    }
    if (!booking.worker) {
        return (0, envelope_1.fail)(res, "No worker was associated with this booking to rate", null, 400);
    }
    // Find existing rating if previously submitted, or create a new one to prevent duplicate key errors
    let ratingDoc = await rating_model_1.default.findOne({ booking: booking._id });
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
    }
    else {
        try {
            ratingDoc = await rating_model_1.default.create({
                booking: booking._id,
                customer: customerId,
                worker: booking.worker,
                service: booking.service,
                cooperative: booking.cooperative,
                rating: numericRating,
                review: typeof review === "string" ? review.trim() : "",
            });
        }
        catch (err) {
            if (err?.code === 11000 &&
                (err?.keyPattern?.bookingId || err?.message?.includes("bookingId_1"))) {
                await rating_model_1.default.collection.dropIndex("bookingId_1").catch(() => { });
                ratingDoc = await rating_model_1.default.create({
                    booking: booking._id,
                    customer: customerId,
                    worker: booking.worker,
                    service: booking.service,
                    cooperative: booking.cooperative,
                    rating: numericRating,
                    review: typeof review === "string" ? review.trim() : "",
                });
            }
            else {
                throw err;
            }
        }
    }
    booking.rating = ratingDoc._id;
    booking.isRated = true;
    await booking.save();
    return (0, envelope_1.ok)(res, ratingDoc, "Rating and review submitted successfully");
}
//# sourceMappingURL=booking.controller.js.map