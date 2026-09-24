import { Request, Response } from "express";
import mongoose from "mongoose";
import Payment, { PaymentRecordStatus } from "../../models/payment.model";
import Booking from "../../models/booking.model";
import User from "../../models/auth/user.model";
import Worker from "../../models/auth/worker.model";
import Cooperative from "../../models/auth/cooperative.model";
import { fail, ok } from "../../shared/envelope";

/**
 * Get cooperative specific payments with status filter, search, and pagination
 */
export async function getCooperativePayments(req: Request, res: Response) {
  if (!req.user || typeof req.user === "string") {
    return fail(res, "Unauthorized", null, 401);
  }

  const userId = req.user.userId || (req.user as any)?.id;

  // 1. Locate the cooperative belonging to this authenticated user
  const cooperative = await Cooperative.findOne({ userId });
  if (!cooperative) {
    return fail(
      res,
      "Cooperative profile not found. Please register or verify your cooperative society.",
      null,
      404
    );
  }

  const {
    status,
    search,
    page = "1",
    limit = "20",
  } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  // 2. Base query strictly scoped to this cooperative
  const query: Record<string, any> = {
    cooperative: cooperative._id,
  };

  // 3. Status filter
  if (status && status !== "ALL") {
    if (status === "PENDING") {
      query.status = PaymentRecordStatus.CREATED;
    } else {
      query.status = status;
    }
  }

  // 4. Search query (Order ID, Payment ID, receipt, booking number, customer or worker)
  if (search && typeof search === "string" && search.trim()) {
    const s = search.trim();
    const regex = new RegExp(s, "i");

    // Search matching users (customers or worker user accounts)
    const matchingUsers = await User.find({ name: regex }).select("_id").lean();
    const matchingUserIds = matchingUsers.map((u) => u._id);

    // Search matching workers in this cooperative
    const matchingWorkers = await Worker.find({
      cooperativeId: cooperative._id,
      $or: [
        { workerId: regex },
        { userId: { $in: matchingUserIds } },
      ],
    }).select("_id").lean();
    const matchingWorkerIds = matchingWorkers.map((w) => w._id);

    // Search matching bookings
    const matchingBookings = await Booking.find({
      cooperative: cooperative._id,
      bookingNumber: regex,
    }).select("_id").lean();
    const matchingBookingIds = matchingBookings.map((b) => b._id);

    query.$or = [
      { razorpayPaymentId: regex },
      { razorpayOrderId: regex },
      { receipt: regex },
      ...(matchingUserIds.length > 0 ? [{ customer: { $in: matchingUserIds } }] : []),
      ...(matchingWorkerIds.length > 0 ? [{ worker: { $in: matchingWorkerIds } }] : []),
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
      cooperative: {
        id: cooperative._id,
        name: cooperative.cooperativeName,
      },
    },
    "Cooperative payments retrieved successfully"
  );
}

/**
 * Get summary financial statistics for cooperative payments dashboard
 */
export async function getCooperativePaymentStats(req: Request, res: Response) {
  if (!req.user || typeof req.user === "string") {
    return fail(res, "Unauthorized", null, 401);
  }

  const userId = req.user.userId || (req.user as any)?.id;

  const cooperative = await Cooperative.findOne({ userId });
  if (!cooperative) {
    return fail(
      res,
      "Cooperative profile not found.",
      null,
      404
    );
  }

  const coopId = cooperative._id;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [aggregations, todayAgg, workerEarningsAgg] = await Promise.all([
    Payment.aggregate([
      { $match: { cooperative: coopId } },
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
          cooperative: coopId,
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
        $match: {
          cooperative: coopId,
          status: PaymentRecordStatus.PAID,
          worker: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$worker",
          workerEarned: { $sum: "$amount" },
          completedGigs: { $sum: 1 },
        },
      },
    ]),
  ]);

  let totalGrossRevenue = 0;
  let totalTransactions = 0;
  let paidCount = 0;
  let pendingCount = 0;
  let failedCount = 0;
  let pendingAmount = 0;

  for (const group of aggregations) {
    totalTransactions += group.count;
    if (group._id === PaymentRecordStatus.PAID) {
      totalGrossRevenue += group.totalAmount;
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
  const activeWorkersWithPayouts = workerEarningsAgg.length;
  const totalWorkerPayouts = workerEarningsAgg.reduce((acc, curr) => acc + curr.workerEarned, 0);

  return ok(
    res,
    {
      totalGrossRevenue,
      totalWorkerPayouts,
      totalTransactions,
      paidCount,
      pendingCount,
      pendingAmount,
      failedCount,
      todayRevenue,
      todayCount,
      activeWorkersWithPayouts,
      societyName: cooperative.cooperativeName,
    },
    "Cooperative payment statistics retrieved successfully"
  );
}
