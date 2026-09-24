import { Request, Response } from "express";
import mongoose from "mongoose";
import Payment, { PaymentRecordStatus } from "../../models/payment.model";
import Booking from "../../models/booking.model";
import User from "../../models/auth/user.model";
import { fail, ok } from "../../shared/envelope";

/**
 * Get all platform payments with filtering, search, and pagination
 */
export async function getAdminPayments(req: Request, res: Response) {
  const {
    status,
    search,
    cooperativeId,
    page = "1",
    limit = "20",
  } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const query: Record<string, any> = {};

  // 1. Status Filter
  if (status && status !== "ALL") {
    if (status === "PENDING") {
      query.status = PaymentRecordStatus.CREATED;
    } else {
      query.status = status;
    }
  }

  // 2. Cooperative Filter
  if (cooperativeId && mongoose.Types.ObjectId.isValid(cooperativeId as string)) {
    query.cooperative = new mongoose.Types.ObjectId(cooperativeId as string);
  }

  // 3. Search Filter (by Razorpay ID, Order ID, receipt, or customer name)
  if (search && typeof search === "string" && search.trim()) {
    const s = search.trim();
    const regex = new RegExp(s, "i");

    // Search matching customers or bookings
    const [matchingUsers, matchingBookings] = await Promise.all([
      User.find({ name: regex }).select("_id").lean(),
      Booking.find({ bookingNumber: regex }).select("_id").lean(),
    ]);

    const matchingCustomerIds = matchingUsers.map((u) => u._id);
    const matchingBookingIds = matchingBookings.map((b) => b._id);

    query.$or = [
      { razorpayPaymentId: regex },
      { razorpayOrderId: regex },
      { receipt: regex },
      ...(matchingCustomerIds.length > 0 ? [{ customer: { $in: matchingCustomerIds } }] : []),
      ...(matchingBookingIds.length > 0 ? [{ booking: { $in: matchingBookingIds } }] : []),
    ];
  }

  const [payments, totalCount] = await Promise.all([
    Payment.find(query)
      .populate({
        path: "booking",
        populate: [
          { path: "service", select: "name description priceType firstHourRate additionalHourRate transportFee cooperativeShare insuranceShare hourlyPrice metersPrice" },
          { path: "category", select: "name icon slug" },
        ],
      })
      .populate("customer", "name email phone profilePicture")
      .populate({
        path: "worker",
        populate: {
          path: "userId",
          select: "name phone profilePicture email",
        },
      })
      .populate("cooperative", "cooperativeName cooperativeEmail cooperativePhone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Payment.countDocuments(query),
  ]);

  return ok(
    res,
    {
      payments,
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum),
    },
    "Admin payments retrieved successfully"
  );
}

/**
 * Get summary statistics for admin payments dashboard
 */
export async function getAdminPaymentStats(_req: Request, res: Response) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [aggregations, todayAgg, counts] = await Promise.all([
    Payment.aggregate([
      {
        $group: {
          _id: "$status",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
    Payment.aggregate([
      {
        $match: {
          status: PaymentRecordStatus.PAID,
          createdAt: { $gte: startOfToday },
        },
      },
      {
        $group: {
          _id: null,
          todayRevenue: { $sum: "$amount" },
          todayCount: { $sum: 1 },
        },
      },
    ]),
    Payment.aggregate([
      {
        $group: {
          _id: "$cooperative",
        },
      },
    ]),
  ]);

  let totalRevenue = 0;
  let totalTransactions = 0;
  let paidCount = 0;
  let pendingCount = 0;
  let failedCount = 0;
  let pendingAmount = 0;

  for (const group of aggregations) {
    totalTransactions += group.count;
    if (group._id === PaymentRecordStatus.PAID) {
      totalRevenue += group.totalAmount;
      paidCount += group.count;
    } else if (group._id === PaymentRecordStatus.CREATED) {
      pendingCount += group.count;
      pendingAmount += group.totalAmount;
    } else if (group._id === PaymentRecordStatus.FAILED) {
      failedCount += group.count;
    }
  }

  const todayRevenue = todayAgg[0]?.todayRevenue || 0;
  const todayCount = todayAgg[0]?.todayCount || 0;
  const activeCooperativesCount = counts.filter((c) => c._id !== null).length;
  const avgOrderValue = paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0;

  return ok(
    res,
    {
      totalRevenue,
      totalTransactions,
      paidCount,
      pendingCount,
      pendingAmount,
      failedCount,
      todayRevenue,
      todayCount,
      activeCooperativesCount,
      avgOrderValue,
    },
    "Admin payment statistics retrieved successfully"
  );
}
