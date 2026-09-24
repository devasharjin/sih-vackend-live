import { Types } from "mongoose";
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
export declare const PLATFORM_WELFARE_POLICY: WelfarePolicyTier;
export declare class WelfareService {
    /**
     * Generates a deterministic policy identifier for a worker
     */
    static generatePolicyNumber(workerId: string | Types.ObjectId): string;
    /**
     * Computes worker's personal welfare & insurance summary:
     * - Accumulated insurance share from completed bookings
     * - Policy details and limits
     * - Claims tally and disbursed benefits
     */
    static getWorkerWelfareSummary(workerId: Types.ObjectId): Promise<{
        policy: {
            policyNumber: string;
            status: string;
            tier: string;
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
        };
        contributions: {
            totalInsuranceAccrued: number;
            coveredJobsCompleted: any;
            totalHoursLogged: any;
        };
        claimsOverview: {
            totalClaimsCount: number;
            pendingClaimsCount: number;
            approvedClaimsCount: number;
            totalBenefitsReceived: number;
        };
    }>;
    /**
     * Computes cooperative's society welfare fund metrics:
     * - Total insurance pool collected across all member workers' bookings
     * - Total claims disbursed
     * - Current available fund reserve
     * - Total active member workers
     */
    static getCooperativeWelfareMetrics(cooperativeId: Types.ObjectId): Promise<{
        totalPoolCollected: number;
        totalDisbursedAmount: number;
        availableFundReserve: number;
        totalCompletedGigs: any;
        totalWorkersCovered: number;
        claimsStats: {
            totalClaimsCount: number;
            pendingReviewCount: number;
            pendingReviewAmount: number;
            approvedPendingDisbursementCount: number;
            rejectedCount: number;
        };
        policy: WelfarePolicyTier;
    }>;
    /**
     * Computes platform-wide welfare reserve health and metrics for Super Admin
     */
    static getPlatformWelfareMetrics(): Promise<{
        totalInsurancePool: number;
        totalSettledAmount: number;
        availableReserve: number;
        lossRatio: number;
        pendingLiability: number;
        totalCompletedJobs: any;
        totalWorkersEnrolled: number;
        claimsOverview: {
            totalClaimsCount: number;
            pendingClaimsCount: number;
            settledClaimsCount: number;
        };
        policyConfig: WelfarePolicyTier;
    }>;
}
//# sourceMappingURL=welfare.service.d.ts.map