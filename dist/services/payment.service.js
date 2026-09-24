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
exports.PaymentService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const mongoose_1 = __importDefault(require("mongoose"));
const booking_model_1 = __importStar(require("../models/booking.model"));
const payment_model_1 = __importStar(require("../models/payment.model"));
const razorpay_config_1 = require("../config/razorpay.config");
const appError_1 = require("../shared/appError");
class PaymentService {
    /**
     * Creates a Razorpay Order for a customer booking.
     */
    static async createOrder(bookingId, customerId) {
        if (!bookingId || !mongoose_1.default.Types.ObjectId.isValid(bookingId)) {
            throw new appError_1.AppError("Valid booking ID is required", 400);
        }
        const booking = await booking_model_1.default.findById(bookingId).populate("customer", "name email phone");
        if (!booking) {
            throw new appError_1.AppError("Booking not found", 404);
        }
        if (booking.customer._id.toString() !== customerId.toString()) {
            throw new appError_1.AppError("Forbidden: You cannot pay for this booking", 403);
        }
        if (booking.paymentStatus === booking_model_1.PaymentStatus.PAID) {
            throw new appError_1.AppError("This booking has already been paid and settled", 400);
        }
        if (booking.status === "CANCELLED" || booking.status === "REJECTED") {
            throw new appError_1.AppError("Cannot process payment for a cancelled or rejected booking", 400);
        }
        const totalAmount = Math.max(1, Math.round(booking.totalAmount || 0));
        const customerUser = booking.customer;
        const razorpay = (0, razorpay_config_1.getRazorpayInstance)();
        if (razorpay && (0, razorpay_config_1.isRazorpayConfigured)()) {
            try {
                const amountInPaise = Math.round(totalAmount * 100);
                const options = {
                    amount: amountInPaise,
                    currency: "INR",
                    receipt: booking.bookingNumber.slice(0, 40),
                    notes: {
                        bookingId: booking._id.toString(),
                        customerId: customerId.toString(),
                        bookingNumber: booking.bookingNumber,
                    },
                };
                const razorpayOrder = await razorpay.orders.create(options);
                // Store or update initial Payment document
                await payment_model_1.default.findOneAndUpdate({ booking: booking._id, status: payment_model_1.PaymentRecordStatus.CREATED }, {
                    booking: booking._id,
                    customer: customerId,
                    worker: booking.worker,
                    cooperative: booking.cooperative,
                    razorpayOrderId: razorpayOrder.id,
                    amount: totalAmount,
                    currency: "INR",
                    status: payment_model_1.PaymentRecordStatus.CREATED,
                    receipt: booking.bookingNumber,
                }, { upsert: true, new: true, setDefaultsOnInsert: true });
                return {
                    orderId: razorpayOrder.id,
                    amount: totalAmount,
                    currency: "INR",
                    keyId: razorpay_config_1.RAZORPAY_KEY_ID,
                    bookingNumber: booking.bookingNumber,
                    customerName: customerUser?.name,
                    customerEmail: customerUser?.email,
                    customerPhone: customerUser?.phone,
                    isMock: false,
                };
            }
            catch (err) {
                console.error("Razorpay order creation error:", err);
                throw new appError_1.AppError(`Payment Gateway Error: ${err?.error?.description || err.message || "Failed to create order"}`, 502);
            }
        }
        else {
            // Sandbox / development mock simulation mode
            const mockOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            await payment_model_1.default.findOneAndUpdate({ booking: booking._id, status: payment_model_1.PaymentRecordStatus.CREATED }, {
                booking: booking._id,
                customer: customerId,
                worker: booking.worker,
                cooperative: booking.cooperative,
                razorpayOrderId: mockOrderId,
                amount: totalAmount,
                currency: "INR",
                status: payment_model_1.PaymentRecordStatus.CREATED,
                receipt: booking.bookingNumber,
            }, { upsert: true, new: true, setDefaultsOnInsert: true });
            return {
                orderId: mockOrderId,
                amount: totalAmount,
                currency: "INR",
                keyId: razorpay_config_1.RAZORPAY_KEY_ID || "rzp_test_dev_mode",
                bookingNumber: booking.bookingNumber,
                customerName: customerUser?.name,
                customerEmail: customerUser?.email,
                customerPhone: customerUser?.phone,
                isMock: true,
            };
        }
    }
    /**
     * Verifies Razorpay payment signature and marks the booking and payment as PAID.
     */
    static async verifyPayment(params, customerId) {
        const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentMethod, } = params;
        if (!bookingId || !razorpayOrderId || !razorpayPaymentId) {
            throw new appError_1.AppError("Incomplete payment verification payload", 400);
        }
        const booking = await booking_model_1.default.findById(bookingId);
        if (!booking) {
            throw new appError_1.AppError("Booking not found", 404);
        }
        if (booking.customer.toString() !== customerId.toString()) {
            throw new appError_1.AppError("Forbidden: Unauthorized payment verification", 403);
        }
        const isConfigured = (0, razorpay_config_1.isRazorpayConfigured)();
        const isMockOrder = razorpayOrderId.startsWith("order_mock_");
        if (isConfigured && !isMockOrder) {
            // Verify HMAC-SHA256 signature
            const expectedSignature = crypto_1.default
                .createHmac("sha256", razorpay_config_1.RAZORPAY_KEY_SECRET)
                .update(`${razorpayOrderId}|${razorpayPaymentId}`)
                .digest("hex");
            if (expectedSignature !== razorpaySignature) {
                // Record failed attempt
                await payment_model_1.default.findOneAndUpdate({ razorpayOrderId }, {
                    status: payment_model_1.PaymentRecordStatus.FAILED,
                    errorDescription: "Signature verification failed",
                });
                throw new appError_1.AppError("Payment verification failed: Invalid transaction signature", 400);
            }
        }
        // Update payment record in database
        let payment = await payment_model_1.default.findOne({ razorpayOrderId });
        if (!payment) {
            payment = await payment_model_1.default.create({
                booking: booking._id,
                customer: customerId,
                worker: booking.worker,
                cooperative: booking.cooperative,
                razorpayOrderId,
                razorpayPaymentId,
                razorpaySignature,
                amount: booking.totalAmount,
                currency: "INR",
                status: payment_model_1.PaymentRecordStatus.PAID,
                paymentMethod: paymentMethod || "razorpay",
                receipt: booking.bookingNumber,
            });
        }
        else {
            payment.razorpayPaymentId = razorpayPaymentId;
            payment.razorpaySignature = razorpaySignature;
            payment.status = payment_model_1.PaymentRecordStatus.PAID;
            if (!payment.cooperative && booking.cooperative) {
                payment.cooperative = booking.cooperative;
            }
            if (paymentMethod)
                payment.paymentMethod = paymentMethod;
            await payment.save();
        }
        // Update booking payment state
        booking.paymentStatus = booking_model_1.PaymentStatus.PAID;
        booking.paymentDetails = {
            transactionId: razorpayPaymentId,
            paidAt: new Date(),
        };
        await booking.save();
        const populatedBooking = await booking_model_1.default.findById(booking._id)
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
        return {
            booking: populatedBooking,
            payment,
        };
    }
    /**
     * Gets payment record details for a specific booking.
     */
    static async getPaymentByBooking(bookingId, customerId) {
        if (!bookingId || !mongoose_1.default.Types.ObjectId.isValid(bookingId)) {
            throw new appError_1.AppError("Valid booking ID is required", 400);
        }
        const booking = await booking_model_1.default.findById(bookingId);
        if (!booking) {
            throw new appError_1.AppError("Booking not found", 404);
        }
        if (booking.customer.toString() !== customerId.toString()) {
            throw new appError_1.AppError("Forbidden: Cannot view this payment record", 403);
        }
        return payment_model_1.default.findOne({ booking: booking._id }).sort({ createdAt: -1 });
    }
    /**
     * Retrieves public Razorpay config for client SDK setup.
     */
    static getPublicConfig() {
        return {
            keyId: razorpay_config_1.RAZORPAY_KEY_ID || "rzp_test_dev_mode",
            isConfigured: (0, razorpay_config_1.isRazorpayConfigured)(),
            currency: "INR",
        };
    }
}
exports.PaymentService = PaymentService;
//# sourceMappingURL=payment.service.js.map