import { Request, Response } from "express";
import mongoose from "mongoose";
import Cooperative from "../../models/auth/cooperative.model";
import Worker, { VerificationStatus } from "../../models/auth/worker.model";
import Booking, { BookingStatus } from "../../models/booking.model";
import Payment, { PaymentRecordStatus } from "../../models/payment.model";
import WelfareClaim, { WelfareClaimStatus } from "../../models/welfareClaim.model";
import { WelfareService } from "../../services/welfare.service";
import { fail, ok } from "../../shared/envelope";

export async function getCooperativeOverview(req: Request, res: Response) {
  if (!req.user || typeof req.user === "string") {
    return fail(res, "Unauthorized", null, 401);
  }

  const userId = req.user.userId || (req.user as any)?.id;

  // 1. Locate authenticated cooperative
  const cooperative = await Cooperative.findOne({ userId });
  if (!cooperative) {
    return fail(
      res,
      "Cooperative profile not found. Please register your cooperative society first.",
      null,
      404
    );
  }

  const coopId = cooperative._id as mongoose.Types.ObjectId;

  // 2. Parallel aggregation of all operational domains
  const [
    totalWorkers,
    activeWorkers,
    pendingWorkers,
    approvedWorkers,
    rejectedWorkers,
    totalBookings,
    completedBookings,
    inProgressBookings,
    pendingBookings,
    emergencyBookings,
    pendingClaimsCount,
    recentBookings,
    welfareMetrics,
  ] = await Promise.all([
    Worker.countDocuments({ cooperativeId: coopId }),
    Worker.countDocuments({
      cooperativeId: coopId,
      isActive: true,
      verificationStatus: VerificationStatus.APPROVED,
    }),
    Worker.countDocuments({
      cooperativeId: coopId,
      verificationStatus: VerificationStatus.PENDING,
    }),
    Worker.countDocuments({
      cooperativeId: coopId,
      verificationStatus: VerificationStatus.APPROVED,
    }),
    Worker.countDocuments({
      cooperativeId: coopId,
      verificationStatus: VerificationStatus.REJECTED,
    }),
    Booking.countDocuments({ cooperative: coopId }),
    Booking.countDocuments({ cooperative: coopId, status: BookingStatus.COMPLETED }),
    Booking.countDocuments({
      cooperative: coopId,
      status: {
        $in: [
          BookingStatus.IN_PROGRESS,
          BookingStatus.ASSIGNED,
          BookingStatus.CONFIRMED,
        ],
      },
    }),
    Booking.countDocuments({ cooperative: coopId, status: BookingStatus.PENDING }),
    Booking.countDocuments({ cooperative: coopId, isEmergency: true }),
    WelfareClaim.countDocuments({
      cooperative: coopId,
      status: {
        $in: [WelfareClaimStatus.SUBMITTED, WelfareClaimStatus.UNDER_REVIEW],
      },
    }),
    Booking.find({ cooperative: coopId })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("customer", "name email phone profilePicture")
      .populate({
        path: "worker",
        populate: { path: "userId", select: "name email phone profilePicture" },
      })
      .populate("service", "name priceType hourlyPrice metersPrice cooperativeShare")
      .lean(),
    WelfareService.getCooperativeWelfareMetrics(coopId).catch(() => ({
      availableFundReserve: 0,
      totalPoolCollected: 0,
      totalDisbursedAmount: 0,
      totalCompletedGigs: 0,
      totalWorkersCovered: 0,
      claimsStats: {
        totalClaimsCount: 0,
        pendingReviewCount: 0,
        pendingReviewAmount: 0,
        approvedPendingDisbursementCount: 0,
        rejectedCount: 0,
      },
      policy: null as any,
    })),
  ]);

  // 3. Financial Metrics Aggregation
  const paymentAgg = await Payment.aggregate([
    {
      $match: {
        cooperative: coopId,
        status: PaymentRecordStatus.PAID,
      },
    },
    {
      $group: {
        _id: null,
        grossTurnover: { $sum: "$amount" },
        cooperativeShareEarned: { $sum: "$cooperativeShare" },
        workerNetDisbursed: { $sum: "$workerShare" },
        paidTransactionsCount: { $sum: 1 },
      },
    },
  ]);

  const financials = paymentAgg[0] || {
    grossTurnover: 0,
    cooperativeShareEarned: 0,
    workerNetDisbursed: 0,
    paidTransactionsCount: 0,
  };

  // 4. Trade breakdown of member workforce (by Category, fallback to Service)
  const tradeDistribution = await Worker.aggregate([
    { $match: { cooperativeId: coopId } },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "categoryDetails",
      },
    },
    {
      $lookup: {
        from: "services",
        localField: "skills",
        foreignField: "_id",
        as: "serviceDetails",
      },
    },
    {
      $project: {
        tradeName: {
          $ifNull: [
            { $arrayElemAt: ["$categoryDetails.name", 0] },
            { $arrayElemAt: ["$serviceDetails.name", 0] },
            "General Trades",
          ],
        },
      },
    },
    {
      $group: {
        _id: "$tradeName",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 6 },
  ]);

  const topTrades = tradeDistribution
    .filter((t) => t._id)
    .map((t) => ({ trade: t._id, workerCount: t.count }));

  return ok(
    res,
    {
      cooperative: {
        id: cooperative._id,
        name: cooperative.cooperativeName,
        email: cooperative.cooperativeEmail,
        phone: cooperative.cooperativePhone,
        address: cooperative.cooperativeAddress,
        verificationStatus: cooperative.verificationStatus,
        logo: cooperative.cooperativeLogo?.url,
        certificate: cooperative.verificationCertificate?.url,
        rejectedReason: cooperative.rejectedReason,
      },
      workforce: {
        total: totalWorkers,
        active: activeWorkers,
        pending: pendingWorkers,
        approved: approvedWorkers,
        rejected: rejectedWorkers,
      },
      financials: {
        grossTurnover: financials.grossTurnover,
        cooperativeShareEarned: financials.cooperativeShareEarned,
        workerNetDisbursed: financials.workerNetDisbursed,
        welfareReserveFund: welfareMetrics.availableFundReserve,
        paidTransactionsCount: financials.paidTransactionsCount,
      },
      gigs: {
        total: totalBookings,
        completed: completedBookings,
        inProgress: inProgressBookings,
        pending: pendingBookings,
        emergency: emergencyBookings,
      },
      pendingActions: {
        pendingWorkersCount: pendingWorkers,
        pendingClaimsCount,
        activeEmergencyGigs: emergencyBookings,
      },
      recentBookings,
      topTrades,
    },
    "Cooperative overview metrics loaded successfully"
  );
}
