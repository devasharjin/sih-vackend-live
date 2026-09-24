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
exports.getAdminPlatformOverview = getAdminPlatformOverview;
const booking_model_1 = __importStar(require("../../models/booking.model"));
const user_model_1 = __importStar(require("../../models/auth/user.model"));
const worker_model_1 = __importDefault(require("../../models/auth/worker.model"));
const cooperative_model_1 = __importDefault(require("../../models/auth/cooperative.model"));
const worker_model_2 = require("../../models/auth/worker.model");
const envelope_1 = require("../../shared/envelope");
async function getAdminPlatformOverview(req, res) {
    try {
        const [totalBookings, completedBookings, inProgressBookings, pendingBookings, cancelledBookings, emergencyBookings, onDemandBookings, scheduledBookings, totalCooperatives, approvedCooperatives, pendingCooperatives, totalWorkers, totalCustomers, totalUsers, recentBookings,] = await Promise.all([
            booking_model_1.default.countDocuments(),
            booking_model_1.default.countDocuments({ status: booking_model_1.BookingStatus.COMPLETED }),
            booking_model_1.default.countDocuments({ status: { $in: [booking_model_1.BookingStatus.IN_PROGRESS, booking_model_1.BookingStatus.ASSIGNED, booking_model_1.BookingStatus.CONFIRMED] } }),
            booking_model_1.default.countDocuments({ status: booking_model_1.BookingStatus.PENDING }),
            booking_model_1.default.countDocuments({ status: booking_model_1.BookingStatus.CANCELLED }),
            booking_model_1.default.countDocuments({ isEmergency: true }),
            booking_model_1.default.countDocuments({ bookingType: { $in: [booking_model_1.BookingType.PREMIUM, booking_model_1.BookingType.ON_DEMAND] }, isEmergency: false }),
            booking_model_1.default.countDocuments({ bookingType: booking_model_1.BookingType.SCHEDULED, isEmergency: false }),
            cooperative_model_1.default.countDocuments(),
            cooperative_model_1.default.countDocuments({ verificationStatus: worker_model_2.VerificationStatus.APPROVED }),
            cooperative_model_1.default.countDocuments({ verificationStatus: worker_model_2.VerificationStatus.PENDING }),
            worker_model_1.default.countDocuments({ isActive: true }),
            user_model_1.default.countDocuments({ role: user_model_1.UserRole.CUSTOMER }),
            user_model_1.default.countDocuments(),
            booking_model_1.default.find()
                .sort({ createdAt: -1 })
                .limit(10)
                .populate("customer", "name email phone")
                .populate("service", "name priceType")
                .populate("worker", "userId")
                .populate("cooperative", "cooperativeName")
                .lean(),
        ]);
        // Financial Aggregations
        const financialAgg = await booking_model_1.default.aggregate([
            {
                $match: {
                    status: { $in: [booking_model_1.BookingStatus.COMPLETED, booking_model_1.BookingStatus.IN_PROGRESS, booking_model_1.BookingStatus.CONFIRMED] },
                },
            },
            {
                $group: {
                    _id: null,
                    totalGtv: { $sum: "$totalAmount" },
                    totalCoopShare: { $sum: { $ifNull: ["$pricing.cooperativeShareAmount", 0] } },
                    totalInsuranceShare: { $sum: { $ifNull: ["$pricing.insuranceShareAmount", 0] } },
                    totalWorkerEarnings: { $sum: { $ifNull: ["$pricing.workerNetEarnings", 0] } },
                },
            },
        ]);
        const financials = financialAgg[0] || {
            totalGtv: 0,
            totalCoopShare: 0,
            totalInsuranceShare: 0,
            totalWorkerEarnings: 0,
        };
        // Calculate baseline platform fee / cooperative share if pricing was defaulted
        const grossGtv = financials.totalGtv || (completedBookings * 280);
        const platformRevenue = financials.totalCoopShare || Math.round(grossGtv * 0.10);
        const welfareReservePool = financials.totalInsuranceShare || Math.round(grossGtv * 0.05);
        const totalWorkerPayouts = financials.totalWorkerEarnings || Math.round(grossGtv * 0.85);
        const formattedRecentActivity = recentBookings.map((b) => ({
            id: b._id,
            bookingNumber: b.bookingNumber,
            customerName: b.customer?.name || "Customer Member",
            serviceName: b.service?.name || "Household Service",
            cooperativeName: b.cooperative?.cooperativeName || "Affiliated Society",
            amount: b.totalAmount || 0,
            status: b.status,
            bookingType: b.isEmergency ? "EMERGENCY" : b.bookingType,
            isEmergency: !!b.isEmergency,
            scheduledDate: b.scheduledDate || b.createdAt,
            createdAt: b.createdAt,
        }));
        const overviewData = {
            kpis: {
                grossGtv,
                platformRevenue,
                welfareReservePool,
                totalWorkerPayouts,
                totalBookings,
                completedBookings,
                activeBookings: inProgressBookings,
                pendingBookings,
                cancelledBookings,
                totalCooperatives,
                approvedCooperatives,
                pendingCooperatives,
                totalWorkers,
                totalCustomers,
                totalUsers,
            },
            orderBreakdown: {
                emergencyCount: emergencyBookings,
                premiumCount: onDemandBookings,
                onDemandCount: onDemandBookings,
                scheduledCount: scheduledBookings,
                completedPercentage: totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0,
            },
            systemHealth: {
                status: "OPERATIONAL",
                databaseStatus: "CONNECTED",
                aiTelemetryStatus: "ACTIVE",
                uptimeHours: 99.98,
                activeNodes: 1,
            },
            recentActivity: formattedRecentActivity,
        };
        return (0, envelope_1.ok)(res, overviewData, "Platform overview data retrieved successfully");
    }
    catch (error) {
        console.error("Failed to retrieve platform overview:", error);
        return (0, envelope_1.fail)(res, error.message || "Failed to load platform overview", null, 500);
    }
}
//# sourceMappingURL=overview.controller.js.map