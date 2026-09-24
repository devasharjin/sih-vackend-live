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
exports.getCooperativeOverview = getCooperativeOverview;
const cooperative_model_1 = __importDefault(require("../../models/auth/cooperative.model"));
const worker_model_1 = __importStar(require("../../models/auth/worker.model"));
const booking_model_1 = __importStar(require("../../models/booking.model"));
const payment_model_1 = __importStar(require("../../models/payment.model"));
const welfareClaim_model_1 = __importStar(require("../../models/welfareClaim.model"));
const welfare_service_1 = require("../../services/welfare.service");
const envelope_1 = require("../../shared/envelope");
async function getCooperativeOverview(req, res) {
    if (!req.user || typeof req.user === "string") {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const userId = req.user.userId || req.user?.id;
    // 1. Locate authenticated cooperative
    const cooperative = await cooperative_model_1.default.findOne({ userId });
    if (!cooperative) {
        return (0, envelope_1.fail)(res, "Cooperative profile not found. Please register your cooperative society first.", null, 404);
    }
    const coopId = cooperative._id;
    // 2. Parallel aggregation of all operational domains
    const [totalWorkers, activeWorkers, pendingWorkers, approvedWorkers, rejectedWorkers, totalBookings, completedBookings, inProgressBookings, pendingBookings, emergencyBookings, pendingClaimsCount, recentBookings, welfareMetrics,] = await Promise.all([
        worker_model_1.default.countDocuments({ cooperativeId: coopId }),
        worker_model_1.default.countDocuments({
            cooperativeId: coopId,
            isActive: true,
            verificationStatus: worker_model_1.VerificationStatus.APPROVED,
        }),
        worker_model_1.default.countDocuments({
            cooperativeId: coopId,
            verificationStatus: worker_model_1.VerificationStatus.PENDING,
        }),
        worker_model_1.default.countDocuments({
            cooperativeId: coopId,
            verificationStatus: worker_model_1.VerificationStatus.APPROVED,
        }),
        worker_model_1.default.countDocuments({
            cooperativeId: coopId,
            verificationStatus: worker_model_1.VerificationStatus.REJECTED,
        }),
        booking_model_1.default.countDocuments({ cooperative: coopId }),
        booking_model_1.default.countDocuments({ cooperative: coopId, status: booking_model_1.BookingStatus.COMPLETED }),
        booking_model_1.default.countDocuments({
            cooperative: coopId,
            status: {
                $in: [
                    booking_model_1.BookingStatus.IN_PROGRESS,
                    booking_model_1.BookingStatus.ASSIGNED,
                    booking_model_1.BookingStatus.CONFIRMED,
                ],
            },
        }),
        booking_model_1.default.countDocuments({ cooperative: coopId, status: booking_model_1.BookingStatus.PENDING }),
        booking_model_1.default.countDocuments({ cooperative: coopId, isEmergency: true }),
        welfareClaim_model_1.default.countDocuments({
            cooperative: coopId,
            status: {
                $in: [welfareClaim_model_1.WelfareClaimStatus.SUBMITTED, welfareClaim_model_1.WelfareClaimStatus.UNDER_REVIEW],
            },
        }),
        booking_model_1.default.find({ cooperative: coopId })
            .sort({ createdAt: -1 })
            .limit(8)
            .populate("customer", "name email phone profilePicture")
            .populate({
            path: "worker",
            populate: { path: "userId", select: "name email phone profilePicture" },
        })
            .populate("service", "name priceType hourlyPrice metersPrice cooperativeShare")
            .lean(),
        welfare_service_1.WelfareService.getCooperativeWelfareMetrics(coopId).catch(() => ({
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
            policy: null,
        })),
    ]);
    // 3. Financial Metrics Aggregation
    const paymentAgg = await payment_model_1.default.aggregate([
        {
            $match: {
                cooperative: coopId,
                status: payment_model_1.PaymentRecordStatus.PAID,
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
    const tradeDistribution = await worker_model_1.default.aggregate([
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
    return (0, envelope_1.ok)(res, {
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
    }, "Cooperative overview metrics loaded successfully");
}
//# sourceMappingURL=overview.controller.js.map