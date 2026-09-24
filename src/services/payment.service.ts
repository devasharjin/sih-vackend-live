import crypto from "crypto";
import mongoose from "mongoose";
import Booking, { PaymentStatus } from "../models/booking.model";
import Payment, { PaymentRecordStatus, IPayment } from "../models/payment.model";
import {
  getRazorpayInstance,
  isRazorpayConfigured,
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
} from "../config/razorpay.config";
import { AppError } from "../shared/appError";

export interface CreateOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  bookingNumber: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  isMock: boolean;
}

export interface VerifyPaymentParams {
  bookingId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  paymentMethod?: string;
}

export class PaymentService {
  /**
   * Creates a Razorpay Order for a customer booking.
   */
  static async createOrder(
    bookingId: string,
    customerId: string
  ): Promise<CreateOrderResult> {
    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      throw new AppError("Valid booking ID is required", 400);
    }

    const booking = await Booking.findById(bookingId).populate(
      "customer",
      "name email phone"
    );

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    if (booking.customer._id.toString() !== customerId.toString()) {
      throw new AppError("Forbidden: You cannot pay for this booking", 403);
    }

    if (booking.paymentStatus === PaymentStatus.PAID) {
      throw new AppError("This booking has already been paid and settled", 400);
    }

    if (booking.status === "CANCELLED" || booking.status === "REJECTED") {
      throw new AppError("Cannot process payment for a cancelled or rejected booking", 400);
    }

    const totalAmount = Math.max(1, Math.round(booking.totalAmount || 0));
    const customerUser = booking.customer as any;

    const razorpay = getRazorpayInstance();

    if (razorpay && isRazorpayConfigured()) {
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
        await Payment.findOneAndUpdate(
          { booking: booking._id, status: PaymentRecordStatus.CREATED },
          {
            booking: booking._id,
            customer: customerId,
            worker: booking.worker,
            cooperative: booking.cooperative,
            razorpayOrderId: razorpayOrder.id,
            amount: totalAmount,
            currency: "INR",
            status: PaymentRecordStatus.CREATED,
            receipt: booking.bookingNumber,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return {
          orderId: razorpayOrder.id,
          amount: totalAmount,
          currency: "INR",
          keyId: RAZORPAY_KEY_ID,
          bookingNumber: booking.bookingNumber,
          customerName: customerUser?.name,
          customerEmail: customerUser?.email,
          customerPhone: customerUser?.phone,
          isMock: false,
        };
      } catch (err: any) {
        console.error("Razorpay order creation error:", err);
        throw new AppError(
          `Payment Gateway Error: ${err?.error?.description || err.message || "Failed to create order"}`,
          502
        );
      }
    } else {
      // Sandbox / development mock simulation mode
      const mockOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      await Payment.findOneAndUpdate(
        { booking: booking._id, status: PaymentRecordStatus.CREATED },
        {
          booking: booking._id,
          customer: customerId,
          worker: booking.worker,
          cooperative: booking.cooperative,
          razorpayOrderId: mockOrderId,
          amount: totalAmount,
          currency: "INR",
          status: PaymentRecordStatus.CREATED,
          receipt: booking.bookingNumber,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return {
        orderId: mockOrderId,
        amount: totalAmount,
        currency: "INR",
        keyId: RAZORPAY_KEY_ID || "rzp_test_dev_mode",
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
  static async verifyPayment(
    params: VerifyPaymentParams,
    customerId: string
  ): Promise<{ booking: any; payment: IPayment }> {
    const {
      bookingId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentMethod,
    } = params;

    if (!bookingId || !razorpayOrderId || !razorpayPaymentId) {
      throw new AppError("Incomplete payment verification payload", 400);
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    if (booking.customer.toString() !== customerId.toString()) {
      throw new AppError("Forbidden: Unauthorized payment verification", 403);
    }

    const isConfigured = isRazorpayConfigured();
    const isMockOrder = razorpayOrderId.startsWith("order_mock_");

    if (isConfigured && !isMockOrder) {
      // Verify HMAC-SHA256 signature
      const expectedSignature = crypto
        .createHmac("sha256", RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

      if (expectedSignature !== razorpaySignature) {
        // Record failed attempt
        await Payment.findOneAndUpdate(
          { razorpayOrderId },
          {
            status: PaymentRecordStatus.FAILED,
            errorDescription: "Signature verification failed",
          }
        );
        throw new AppError("Payment verification failed: Invalid transaction signature", 400);
      }
    }

    // Update payment record in database
    let payment = await Payment.findOne({ razorpayOrderId });
    if (!payment) {
      payment = await Payment.create({
        booking: booking._id,
        customer: customerId,
        worker: booking.worker,
        cooperative: booking.cooperative,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        amount: booking.totalAmount,
        currency: "INR",
        status: PaymentRecordStatus.PAID,
        paymentMethod: paymentMethod || "razorpay",
        receipt: booking.bookingNumber,
      });
    } else {
      payment.razorpayPaymentId = razorpayPaymentId;
      payment.razorpaySignature = razorpaySignature;
      payment.status = PaymentRecordStatus.PAID;
      if (!payment.cooperative && booking.cooperative) {
        payment.cooperative = booking.cooperative;
      }
      if (paymentMethod) payment.paymentMethod = paymentMethod;
      await payment.save();
    }

    // Update booking payment state
    booking.paymentStatus = PaymentStatus.PAID;
    booking.paymentDetails = {
      transactionId: razorpayPaymentId,
      paidAt: new Date(),
    };
    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
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
  static async getPaymentByBooking(
    bookingId: string,
    customerId: string
  ): Promise<IPayment | null> {
    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      throw new AppError("Valid booking ID is required", 400);
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    if (booking.customer.toString() !== customerId.toString()) {
      throw new AppError("Forbidden: Cannot view this payment record", 403);
    }

    return Payment.findOne({ booking: booking._id }).sort({ createdAt: -1 });
  }

  /**
   * Retrieves public Razorpay config for client SDK setup.
   */
  static getPublicConfig() {
    return {
      keyId: RAZORPAY_KEY_ID || "rzp_test_dev_mode",
      isConfigured: isRazorpayConfigured(),
      currency: "INR",
    };
  }
}
