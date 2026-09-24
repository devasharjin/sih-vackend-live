import { Request, Response } from "express";
import { PaymentService } from "../../services/payment.service";
import { fail, ok } from "../../shared/envelope";

export async function createPaymentOrder(req: Request, res: Response) {
  const customerId = (req.user as any)?.userId || (req.user as any)?._id;
  if (!customerId) {
    return fail(res, "Unauthorized", null, 401);
  }

  const { bookingId } = req.body;
  if (!bookingId) {
    return fail(res, "Booking ID is required", null, 400);
  }

  const orderData = await PaymentService.createOrder(bookingId, customerId);
  return ok(res, orderData, "Razorpay payment order initialized successfully");
}

export async function verifyPayment(req: Request, res: Response) {
  const customerId = (req.user as any)?.userId || (req.user as any)?._id;
  if (!customerId) {
    return fail(res, "Unauthorized", null, 401);
  }

  const {
    bookingId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    paymentMethod,
  } = req.body;

  if (!bookingId || !razorpayOrderId || !razorpayPaymentId) {
    return fail(res, "Missing required payment verification parameters", null, 400);
  }

  const result = await PaymentService.verifyPayment(
    {
      bookingId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentMethod,
    },
    customerId
  );

  return ok(res, result, "Payment completed and verified successfully");
}

export async function getPaymentDetails(req: Request, res: Response) {
  const customerId = (req.user as any)?.userId || (req.user as any)?._id;
  if (!customerId) {
    return fail(res, "Unauthorized", null, 401);
  }

  const bookingId =
    typeof req.params.bookingId === "string"
      ? req.params.bookingId
      : req.params.bookingId?.[0];

  if (!bookingId) {
    return fail(res, "Booking ID is required", null, 400);
  }

  const payment = await PaymentService.getPaymentByBooking(bookingId, customerId);
  return ok(res, payment, "Payment details retrieved successfully");
}

export async function getRazorpayConfig(_req: Request, res: Response) {
  const config = PaymentService.getPublicConfig();
  return ok(res, config, "Payment configuration retrieved");
}
