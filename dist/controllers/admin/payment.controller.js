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
exports.getAdminPayments = getAdminPayments;
exports.getAdminPaymentStats = getAdminPaymentStats;
const mongoose_1 = __importDefault(require("mongoose"));
const payment_model_1 = __importStar(require("../../models/payment.model"));
const booking_model_1 = __importDefault(require("../../models/booking.model"));
const user_model_1 = __importDefault(require("../../models/auth/user.model"));
const envelope_1 = require("../../shared/envelope");
/**
 * Get all platform payments with filtering, search, and pagination
 */
async function getAdminPayments(req, res) {
    const { status, search, cooperativeId, page = "1", limit = "20", } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    const query = {};
    // 1. Status Filter
    if (status && status !== "ALL") {
        if (status === "PENDING") {
            query.status = payment_model_1.PaymentRecordStatus.CREATED;
        }
        else {
            query.status = status;
        }
    }
    // 2. Cooperative Filter
    if (cooperativeId && mongoose_1.default.Types.ObjectId.isValid(cooperativeId)) {
        query.cooperative = new mongoose_1.default.Types.ObjectId(cooperativeId);
    }
    // 3. Search Filter (by Razorpay ID, Order ID, receipt, or customer name)
    if (search && typeof search === "string" && search.trim()) {
        const s = search.trim();
        const regex = new RegExp(s, "i");
        // Search matching customers or bookings
        const [matchingUsers, matchingBookings] = await Promise.all([
            user_model_1.default.find({ name: regex }).select("_id").lean(),
            booking_model_1.default.find({ bookingNumber: regex }).select("_id").lean(),
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
            .populate("cooperative", "cooperativeName cooperativeEmail cooperativePhone")
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
    }, "Admin payments retrieved successfully");
}
/**
 * Get summary statistics for admin payments dashboard
 */
async function getAdminPaymentStats(_req, res) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const [aggregations, todayAgg, counts] = await Promise.all([
        payment_model_1.default.aggregate([
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
        if (group._id === payment_model_1.PaymentRecordStatus.PAID) {
            totalRevenue += group.totalAmount;
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
    const activeCooperativesCount = counts.filter((c) => c._id !== null).length;
    const avgOrderValue = paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0;
    return (0, envelope_1.ok)(res, {
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
    }, "Admin payment statistics retrieved successfully");
}
//# sourceMappingURL=payment.controller.js.map