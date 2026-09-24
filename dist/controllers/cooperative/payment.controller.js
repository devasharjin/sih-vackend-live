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
exports.getCooperativePayments = getCooperativePayments;
exports.getCooperativePaymentStats = getCooperativePaymentStats;
const payment_model_1 = __importStar(require("../../models/payment.model"));
const booking_model_1 = __importDefault(require("../../models/booking.model"));
const user_model_1 = __importDefault(require("../../models/auth/user.model"));
const worker_model_1 = __importDefault(require("../../models/auth/worker.model"));
const cooperative_model_1 = __importDefault(require("../../models/auth/cooperative.model"));
const envelope_1 = require("../../shared/envelope");
/**
 * Get cooperative specific payments with status filter, search, and pagination
 */
async function getCooperativePayments(req, res) {
    if (!req.user || typeof req.user === "string") {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const userId = req.user.userId || req.user?.id;
    // 1. Locate the cooperative belonging to this authenticated user
    const cooperative = await cooperative_model_1.default.findOne({ userId });
    if (!cooperative) {
        return (0, envelope_1.fail)(res, "Cooperative profile not found. Please register or verify your cooperative society.", null, 404);
    }
    const { status, search, page = "1", limit = "20", } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    // 2. Base query strictly scoped to this cooperative
    const query = {
        cooperative: cooperative._id,
    };
    // 3. Status filter
    if (status && status !== "ALL") {
        if (status === "PENDING") {
            query.status = payment_model_1.PaymentRecordStatus.CREATED;
        }
        else {
            query.status = status;
        }
    }
    // 4. Search query (Order ID, Payment ID, receipt, booking number, customer or worker)
    if (search && typeof search === "string" && search.trim()) {
        const s = search.trim();
        const regex = new RegExp(s, "i");
        // Search matching users (customers or worker user accounts)
        const matchingUsers = await user_model_1.default.find({ name: regex }).select("_id").lean();
        const matchingUserIds = matchingUsers.map((u) => u._id);
        // Search matching workers in this cooperative
        const matchingWorkers = await worker_model_1.default.find({
            cooperativeId: cooperative._id,
            $or: [
                { workerId: regex },
                { userId: { $in: matchingUserIds } },
            ],
        }).select("_id").lean();
        const matchingWorkerIds = matchingWorkers.map((w) => w._id);
        // Search matching bookings
        const matchingBookings = await booking_model_1.default.find({
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
        payment_model_1.default.find(query)
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
        payment_model_1.default.countDocuments(query),
    ]);
    return (0, envelope_1.ok)(res, {
        payments,
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
        cooperative: {
            id: cooperative._id,
            name: cooperative.cooperativeName,
        },
    }, "Cooperative payments retrieved successfully");
}
/**
 * Get summary financial statistics for cooperative payments dashboard
 */
async function getCooperativePaymentStats(req, res) {
    if (!req.user || typeof req.user === "string") {
        return (0, envelope_1.fail)(res, "Unauthorized", null, 401);
    }
    const userId = req.user.userId || req.user?.id;
    const cooperative = await cooperative_model_1.default.findOne({ userId });
    if (!cooperative) {
        return (0, envelope_1.fail)(res, "Cooperative profile not found.", null, 404);
    }
    const coopId = cooperative._id;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const [aggregations, todayAgg, workerEarningsAgg] = await Promise.all([
        payment_model_1.default.aggregate([
            { $match: { cooperative: coopId } },
            {
                $group: {
                    _id: "$status",
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 },
                },
            },
        ]),
        payment_model_1.default.aggregate([
            {
                $match: {
                    cooperative: coopId,
                    status: payment_model_1.PaymentRecordStatus.PAID,
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
        payment_model_1.default.aggregate([
            {
                $match: {
                    cooperative: coopId,
                    status: payment_model_1.PaymentRecordStatus.PAID,
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
        if (group._id === payment_model_1.PaymentRecordStatus.PAID) {
            totalGrossRevenue += group.totalAmount;
            paidCount += group.count;
        }
        else if (group._id === payment_model_1.PaymentRecordStatus.CREATED) {
            pendingCount += group.count;
            pendingAmount += group.totalAmount;
        }
        else if (group._id === payment_model_1.PaymentRecordStatus.FAILED) {
            failedCount += group.count;
        }
    }
    const todayRevenue = todayAgg[0]?.todayRevenue || 0;
    const todayCount = todayAgg[0]?.todayCount || 0;
    const activeWorkersWithPayouts = workerEarningsAgg.length;
    const totalWorkerPayouts = workerEarningsAgg.reduce((acc, curr) => acc + curr.workerEarned, 0);
    return (0, envelope_1.ok)(res, {
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
    }, "Cooperative payment statistics retrieved successfully");
}
//# sourceMappingURL=payment.controller.js.map