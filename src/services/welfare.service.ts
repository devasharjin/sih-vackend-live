import mongoose, { Types } from "mongoose";
import Booking, { BookingStatus } from "../models/booking.model";
import WelfareClaim, { WelfareClaimStatus, WelfareClaimType } from "../models/welfareClaim.model";
import Worker from "../models/auth/worker.model";

export interface WelfarePolicyTier {
  policyNumberPrefix: string;
  underwriter: string;
  schemeName: string;
  coverage: {
    accidentalInjuryMax: number;
    hospitalizationMax: number;
    emergencyHardshipMax: number;
    toolEquipmentLossMax: number;
    healthCheckupAnnualMax: number;
  };
  features: string[];
}

export const PLATFORM_WELFARE_POLICY: WelfarePolicyTier = {
  policyNumberPrefix: "FG-WLF",
  underwriter: "National Cooperative Workers Insurance Trust (NCWIT)",
  schemeName: "Pradhan Mantri Suraksha Bima & Cooperative Gig Welfare Security",
  coverage: {
    accidentalInjuryMax: 500000, // ₹5,00,000 Accidental Death / Permanent Disability
    hospitalizationMax: 200000,  // ₹2,00,000 Cashless Inpatient Hospitalization
    emergencyHardshipMax: 25000, // ₹25,000 Immediate Distress Grant
    toolEquipmentLossMax: 15000, // ₹15,000 Trade Tool Loss/Damage Coverage
    healthCheckupAnnualMax: 3000,// ₹3,000 Annual Preventative Health Screening
  },
  features: [
    "24/7 Cashless Emergency Medical Assistance on all active gig assignments",
    "Direct cooperative welfare committee review within 24–48 hours",
    "Automatic 5% contribution accumulation from every completed gig",
    "No out-of-pocket premium deductions – 100% financed through cooperative billing",
    "Includes family distress aid and trade equipment protection",
  ],
};

export class WelfareService {
  /**
   * Generates a deterministic policy identifier for a worker
   */
  static generatePolicyNumber(workerId: string | Types.ObjectId): string {
    const cleanId = workerId.toString().slice(-6).toUpperCase();
    return `${PLATFORM_WELFARE_POLICY.policyNumberPrefix}-${cleanId}`;
  }

  /**
   * Computes worker's personal welfare & insurance summary:
   * - Accumulated insurance share from completed bookings
   * - Policy details and limits
   * - Claims tally and disbursed benefits
   */
  static async getWorkerWelfareSummary(workerId: Types.ObjectId) {
    // 1. Calculate accumulated insurance pool contribution from bookings
    const bookingStats = await Booking.aggregate([
      {
        $match: {
          worker: workerId,
          status: BookingStatus.COMPLETED,
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
    const claimStats = await WelfareClaim.aggregate([
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
      if (
        stat._id === WelfareClaimStatus.SUBMITTED ||
        stat._id === WelfareClaimStatus.UNDER_REVIEW
      ) {
        pendingClaimsCount += stat.count;
      } else if (stat._id === WelfareClaimStatus.APPROVED) {
        approvedClaimsCount += stat.count;
      } else if (stat._id === WelfareClaimStatus.DISBURSED) {
        totalBenefitsReceived += stat.totalAmountDisbursed;
      }
    }

    return {
      policy: {
        policyNumber: this.generatePolicyNumber(workerId),
        status: "ACTIVE_PROTECTED",
        tier: "Cooperative Gold Shield",
        underwriter: PLATFORM_WELFARE_POLICY.underwriter,
        schemeName: PLATFORM_WELFARE_POLICY.schemeName,
        coverage: PLATFORM_WELFARE_POLICY.coverage,
        features: PLATFORM_WELFARE_POLICY.features,
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
  static async getCooperativeWelfareMetrics(cooperativeId: Types.ObjectId) {
    // 1. Total pool accumulated from bookings belonging to this cooperative
    const bookingPoolAgg = await Booking.aggregate([
      {
        $match: {
          cooperative: cooperativeId,
          status: BookingStatus.COMPLETED,
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
    const claimsAgg = await WelfareClaim.aggregate([
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
      if (
        item._id === WelfareClaimStatus.SUBMITTED ||
        item._id === WelfareClaimStatus.UNDER_REVIEW
      ) {
        pendingReviewCount += item.count;
        pendingReviewAmount += item.requestedAmount;
      } else if (item._id === WelfareClaimStatus.APPROVED) {
        approvedPendingDisbursementCount += item.count;
      } else if (item._id === WelfareClaimStatus.DISBURSED) {
        totalDisbursedAmount += item.disbursedAmount;
      } else if (item._id === WelfareClaimStatus.REJECTED) {
        rejectedCount += item.count;
      }
    }

    // 3. Count member workers in cooperative
    const totalWorkers = await Worker.countDocuments({ cooperativeId });
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
      policy: PLATFORM_WELFARE_POLICY,
    };
  }

  /**
   * Computes platform-wide welfare reserve health and metrics for Super Admin
   */
  static async getPlatformWelfareMetrics() {
    // 1. Total platform insurance pool accumulated
    const globalBookingAgg = await Booking.aggregate([
      {
        $match: {
          status: BookingStatus.COMPLETED,
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
    const globalClaimsAgg = await WelfareClaim.aggregate([
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
      if (
        item._id === WelfareClaimStatus.SUBMITTED ||
        item._id === WelfareClaimStatus.UNDER_REVIEW
      ) {
        pendingClaimsCount += item.count;
        pendingLiability += item.requestedAmount;
      } else if (item._id === WelfareClaimStatus.DISBURSED) {
        settledClaimsCount += item.count;
        totalSettledAmount += item.disbursedAmount;
      }
    }

    const availableReserve = Math.max(0, Math.round((totalInsurancePool - totalSettledAmount) * 100) / 100);
    const lossRatio = totalInsurancePool > 0
      ? Math.round((totalSettledAmount / totalInsurancePool) * 10000) / 100
      : 0;

    const totalWorkersEnrolled = await Worker.countDocuments();

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
      policyConfig: PLATFORM_WELFARE_POLICY,
    };
  }
}
