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
exports.WelfareService = exports.PLATFORM_WELFARE_POLICY = void 0;
const booking_model_1 = __importStar(require("../models/booking.model"));
const welfareClaim_model_1 = __importStar(require("../models/welfareClaim.model"));
const worker_model_1 = __importDefault(require("../models/auth/worker.model"));
exports.PLATFORM_WELFARE_POLICY = {
    policyNumberPrefix: "FG-WLF",
    underwriter: "National Cooperative Workers Insurance Trust (NCWIT)",
    schemeName: "Pradhan Mantri Suraksha Bima & Cooperative Gig Welfare Security",
    coverage: {
        accidentalInjuryMax: 500000, // ₹5,00,000 Accidental Death / Permanent Disability
        hospitalizationMax: 200000, // ₹2,00,000 Cashless Inpatient Hospitalization
        emergencyHardshipMax: 25000, // ₹25,000 Immediate Distress Grant
        toolEquipmentLossMax: 15000, // ₹15,000 Trade Tool Loss/Damage Coverage
        healthCheckupAnnualMax: 3000, // ₹3,000 Annual Preventative Health Screening
    },
    features: [
        "24/7 Cashless Emergency Medical Assistance on all active gig assignments",
        "Direct cooperative welfare committee review within 24–48 hours",
        "Automatic 5% contribution accumulation from every completed gig",
        "No out-of-pocket premium deductions – 100% financed through cooperative billing",
        "Includes family distress aid and trade equipment protection",
    ],
};
class WelfareService {
    /**
     * Generates a deterministic policy identifier for a worker
     */
    static generatePolicyNumber(workerId) {
        const cleanId = workerId.toString().slice(-6).toUpperCase();
        return `${exports.PLATFORM_WELFARE_POLICY.policyNumberPrefix}-${cleanId}`;
    }
    /**
     * Computes worker's personal welfare & insurance summary:
     * - Accumulated insurance share from completed bookings
     * - Policy details and limits
     * - Claims tally and disbursed benefits
     */
    static async getWorkerWelfareSummary(workerId) {
        // 1. Calculate accumulated insurance pool contribution from bookings
        const bookingStats = await booking_model_1.default.aggregate([
            {
                $match: {
                    worker: workerId,
                    status: booking_model_1.BookingStatus.COMPLETED,
                },
            },
            {
                $group: {
                    _id: null,
                    totalInsuranceAccrued: {
                        $sum: {
                            $ifNull: [
                                "$pricing.insuranceShareAmount",
                                { $multiply: ["$totalAmount", 0.05] }, // Fallback to 5% if pricing not yet recorded
                            ],
                        },
                    },
                    coveredJobsCompleted: { $sum: 1 },
                    totalHoursLogged: { $sum: { $ifNull: ["$pricing.billableHours", 1] } },
                },
            },
        ]);
        const accruedInsurance = bookingStats[0]?.totalInsuranceAccrued || 0;
        const coveredJobs = bookingStats[0]?.coveredJobsCompleted || 0;
        const hoursLogged = bookingStats[0]?.totalHoursLogged || 0;
        // 2. Aggregate claims filed by this worker
        const claimStats = await welfareClaim_model_1.default.aggregate([
            { $match: { worker: workerId } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalAmountRequested: { $sum: "$amountRequested" },
                    totalAmountDisbursed: { $sum: { $ifNull: ["$amountDisbursed", 0] } },
                },
            },
        ]);
        let totalClaimsCount = 0;
        let pendingClaimsCount = 0;
        let approvedClaimsCount = 0;
        let totalBenefitsReceived = 0;
        for (const stat of claimStats) {
            totalClaimsCount += stat.count;
            if (stat._id === welfareClaim_model_1.WelfareClaimStatus.SUBMITTED ||
                stat._id === welfareClaim_model_1.WelfareClaimStatus.UNDER_REVIEW) {
                pendingClaimsCount += stat.count;
            }
            else if (stat._id === welfareClaim_model_1.WelfareClaimStatus.APPROVED) {
                approvedClaimsCount += stat.count;
            }
            else if (stat._id === welfareClaim_model_1.WelfareClaimStatus.DISBURSED) {
                totalBenefitsReceived += stat.totalAmountDisbursed;
            }
        }
        return {
            policy: {
                policyNumber: this.generatePolicyNumber(workerId),
                status: "ACTIVE_PROTECTED",
                tier: "Cooperative Gold Shield",
                underwriter: exports.PLATFORM_WELFARE_POLICY.underwriter,
                schemeName: exports.PLATFORM_WELFARE_POLICY.schemeName,
                coverage: exports.PLATFORM_WELFARE_POLICY.coverage,
                features: exports.PLATFORM_WELFARE_POLICY.features,
            },
            contributions: {
                totalInsuranceAccrued: Math.round(accruedInsurance * 100) / 100,
                coveredJobsCompleted: coveredJobs,
                totalHoursLogged: hoursLogged,
            },
            claimsOverview: {
                totalClaimsCount,
                pendingClaimsCount,
                approvedClaimsCount,
                totalBenefitsReceived: Math.round(totalBenefitsReceived * 100) / 100,
            },
        };
    }
    /**
     * Computes cooperative's society welfare fund metrics:
     * - Total insurance pool collected across all member workers' bookings
     * - Total claims disbursed
     * - Current available fund reserve
     * - Total active member workers
     */
    static async getCooperativeWelfareMetrics(cooperativeId) {
        // 1. Total pool accumulated from bookings belonging to this cooperative
        const bookingPoolAgg = await booking_model_1.default.aggregate([
            {
                $match: {
                    cooperative: cooperativeId,
                    status: booking_model_1.BookingStatus.COMPLETED,
                },
            },
            {
                $group: {
                    _id: null,
                    totalPoolCollected: {
                        $sum: {
                            $ifNull: [
                                "$pricing.insuranceShareAmount",
                                { $multiply: ["$totalAmount", 0.05] },
                            ],
                        },
                    },
                    totalCompletedGigs: { $sum: 1 },
                },
            },
        ]);
        const totalPoolCollected = Math.round((bookingPoolAgg[0]?.totalPoolCollected || 0) * 100) / 100;
        const totalCompletedGigs = bookingPoolAgg[0]?.totalCompletedGigs || 0;
        // 2. Aggregate claims within this cooperative
        const claimsAgg = await welfareClaim_model_1.default.aggregate([
            { $match: { cooperative: cooperativeId } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    requestedAmount: { $sum: "$amountRequested" },
                    disbursedAmount: { $sum: { $ifNull: ["$amountDisbursed", 0] } },
                    approvedAmount: { $sum: { $ifNull: ["$amountApproved", 0] } },
                },
            },
        ]);
        let totalClaimsCount = 0;
        let pendingReviewCount = 0;
        let pendingReviewAmount = 0;
        let approvedPendingDisbursementCount = 0;
        let totalDisbursedAmount = 0;
        let rejectedCount = 0;
        for (const item of claimsAgg) {
            totalClaimsCount += item.count;
            if (item._id === welfareClaim_model_1.WelfareClaimStatus.SUBMITTED ||
                item._id === welfareClaim_model_1.WelfareClaimStatus.UNDER_REVIEW) {
                pendingReviewCount += item.count;
                pendingReviewAmount += item.requestedAmount;
            }
            else if (item._id === welfareClaim_model_1.WelfareClaimStatus.APPROVED) {
                approvedPendingDisbursementCount += item.count;
            }
            else if (item._id === welfareClaim_model_1.WelfareClaimStatus.DISBURSED) {
                totalDisbursedAmount += item.disbursedAmount;
            }
            else if (item._id === welfareClaim_model_1.WelfareClaimStatus.REJECTED) {
                rejectedCount += item.count;
            }
        }
        // 3. Count member workers in cooperative
        const totalWorkers = await worker_model_1.default.countDocuments({ cooperativeId });
        const availableFundReserve = Math.max(0, Math.round((totalPoolCollected - totalDisbursedAmount) * 100) / 100);
        return {
            totalPoolCollected,
            totalDisbursedAmount: Math.round(totalDisbursedAmount * 100) / 100,
            availableFundReserve,
            totalCompletedGigs,
            totalWorkersCovered: totalWorkers,
            claimsStats: {
                totalClaimsCount,
                pendingReviewCount,
                pendingReviewAmount: Math.round(pendingReviewAmount * 100) / 100,
                approvedPendingDisbursementCount,
                rejectedCount,
            },
            policy: exports.PLATFORM_WELFARE_POLICY,
        };
    }
    /**
     * Computes platform-wide welfare reserve health and metrics for Super Admin
     */
    static async getPlatformWelfareMetrics() {
        // 1. Total platform insurance pool accumulated
        const globalBookingAgg = await booking_model_1.default.aggregate([
            {
                $match: {
                    status: booking_model_1.BookingStatus.COMPLETED,
                },
            },
            {
                $group: {
                    _id: null,
                    totalPlatformInsuranceAccrued: {
                        $sum: {
                            $ifNull: [
                                "$pricing.insuranceShareAmount",
                                { $multiply: ["$totalAmount", 0.05] },
                            ],
                        },
                    },
                    totalCompletedJobs: { $sum: 1 },
                },
            },
        ]);
        const totalInsurancePool = Math.round((globalBookingAgg[0]?.totalPlatformInsuranceAccrued || 0) * 100) / 100;
        const totalCompletedJobs = globalBookingAgg[0]?.totalCompletedJobs || 0;
        // 2. Global claims aggregation
        const globalClaimsAgg = await welfareClaim_model_1.default.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    requestedAmount: { $sum: "$amountRequested" },
                    disbursedAmount: { $sum: { $ifNull: ["$amountDisbursed", 0] } },
                },
            },
        ]);
        let totalClaimsCount = 0;
        let pendingClaimsCount = 0;
        let pendingLiability = 0;
        let totalSettledAmount = 0;
        let settledClaimsCount = 0;
        for (const item of globalClaimsAgg) {
            totalClaimsCount += item.count;
            if (item._id === welfareClaim_model_1.WelfareClaimStatus.SUBMITTED ||
                item._id === welfareClaim_model_1.WelfareClaimStatus.UNDER_REVIEW) {
                pendingClaimsCount += item.count;
                pendingLiability += item.requestedAmount;
            }
            else if (item._id === welfareClaim_model_1.WelfareClaimStatus.DISBURSED) {
                settledClaimsCount += item.count;
                totalSettledAmount += item.disbursedAmount;
            }
        }
        const availableReserve = Math.max(0, Math.round((totalInsurancePool - totalSettledAmount) * 100) / 100);
        const lossRatio = totalInsurancePool > 0
            ? Math.round((totalSettledAmount / totalInsurancePool) * 10000) / 100
            : 0;
        const totalWorkersEnrolled = await worker_model_1.default.countDocuments();
        return {
            totalInsurancePool,
            totalSettledAmount: Math.round(totalSettledAmount * 100) / 100,
            availableReserve,
            lossRatio, // e.g. 14.5%
            pendingLiability: Math.round(pendingLiability * 100) / 100,
            totalCompletedJobs,
            totalWorkersEnrolled,
            claimsOverview: {
                totalClaimsCount,
                pendingClaimsCount,
                settledClaimsCount,
            },
            policyConfig: exports.PLATFORM_WELFARE_POLICY,
        };
    }
}
exports.WelfareService = WelfareService;
//# sourceMappingURL=welfare.service.js.map