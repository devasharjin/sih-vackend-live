/**
 * Fixed transport fee applied to every gig booking in INR.
 * Centrally configured and immutable by workers or customers.
 */
export declare const FIXED_TRANSPORT_FEE = 30;
export interface PricingRuleInputs {
    firstHourRate: number;
    additionalHourRate: number;
    cooperativePercentage: number;
    insurancePercentage: number;
    transportFee?: number;
}
export interface BillingCalculationResult {
    actualDurationMinutes: number;
    billableHours: number;
    firstHourCharge: number;
    additionalHoursCharge: number;
    serviceAmount: number;
    transportFee: number;
    cooperativeAdminShare: number;
    insuranceShare: number;
    workerNetEarnings: number;
    customerTotal: number;
}
export declare class BillingService {
    /**
     * Calculates billable hours using the ceiling function.
     * - <= 60 minutes = 1 billable hour
     * - 61-120 minutes = 2 billable hours
     * - 121-180 minutes = 3 billable hours
     * - Minimum 1 billable hour for a completed job.
     */
    static calculateBillableHours(durationMinutes: number): number;
    /**
     * Calculates the working duration in minutes between start and completion dates.
     * Throws AppError if timestamps are invalid or completion is before start.
     */
    static calculateWorkingDurationMinutes(startedAt: Date | string, completedAt: Date | string): number;
    /**
     * Calculates the gross service amount based on billable hours:
     * Service Amount = First Hour Rate + ((Billable Hours - 1) * Additional Hour Rate)
     */
    static calculateServiceAmount(billableHours: number, firstHourRate: number, additionalHourRate: number): number;
    /**
     * Performs the complete billing and financial salary distribution calculation.
     *
     * Formulas:
     * 1. Billable Hours = Math.max(1, Math.ceil(durationMinutes / 60))
     * 2. Service Amount = First Hour Rate + ((Billable Hours - 1) * Additional Hour Rate)
     * 3. Customer Total = Service Amount + Fixed Transport Fee (₹30)
     * 4. Cooperative Admin Share = Service Amount * (Cooperative % / 100)
     * 5. Insurance Share = Service Amount * (Insurance % / 100)
     * 6. Worker Net Earnings = Service Amount - Cooperative Share - Insurance Share
     *
     * The fixed ₹30 transport fee is kept strictly separate from worker earnings
     * and percentage deductions.
     */
    static calculateBillingAndDistribution(durationMinutes: number, pricing: PricingRuleInputs): BillingCalculationResult;
    /**
     * Helper to format minutes into human-readable duration string (e.g., "1 hr 15 mins" or "45 mins")
     */
    static formatDuration(minutes: number): string;
}
//# sourceMappingURL=billing.service.d.ts.map