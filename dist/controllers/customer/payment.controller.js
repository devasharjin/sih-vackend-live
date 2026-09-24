"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentOrder = createPaymentOrder;
exports.verifyPayment = verifyPayment;
exports.getPaymentDetails = getPaymentDetails;
exports.getRazorpayConfig = getRazorpayConfig;
const payment_service_1 = require("../../services/payment.service");
const envelope_1 = require("../../shared/envelope");
async function createPaymentOrder(req, res) {
    const customerId = req.user?.userId || req.user?._id;
    if (!customerId) {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const { bookingId } = req.body;
    if (!bookingId) {
        return (0, envelope_1.fail)(res, "Booking ID is required", null, 400);
    }
    const orderData = await payment_service_1.PaymentService.createOrder(bookingId, customerId);
    return (0, envelope_1.ok)(res, orderData, "Razorpay payment order initialized successfully");
}
async function verifyPayment(req, res) {
    const customerId = req.user?.userId || req.user?._id;
    if (!customerId) {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentMethod, } = req.body;
    if (!bookingId || !razorpayOrderId || !razorpayPaymentId) {
        return (0, envelope_1.fail)(res, "Missing required payment verification parameters", null, 400);
    }
    const result = await payment_service_1.PaymentService.verifyPayment({
        bookingId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        paymentMethod,
    }, customerId);
    return (0, envelope_1.ok)(res, result, "Payment completed and verified successfully");
}
async function getPaymentDetails(req, res) {
    const customerId = req.user?.userId || req.user?._id;
    if (!customerId) {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const bookingId = typeof req.params.bookingId === "string"
        ? req.params.bookingId
        : req.params.bookingId?.[0];
    if (!bookingId) {
        return (0, envelope_1.fail)(res, "Booking ID is required", null, 400);
    }
    const payment = await payment_service_1.PaymentService.getPaymentByBooking(bookingId, customerId);
    return (0, envelope_1.ok)(res, payment, "Payment details retrieved successfully");
}
async function getRazorpayConfig(_req, res) {
    const config = payment_service_1.PaymentService.getPublicConfig();
    return (0, envelope_1.ok)(res, config, "Payment configuration retrieved");
}
//# sourceMappingURL=payment.controller.js.map