import { AppError } from "../shared/appError";

/**
 * Fixed transport fee applied to every gig booking in INR.
 * Centrally configured and immutable by workers or customers.
 */
export const FIXED_TRANSPORT_FEE = 30;

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

export class BillingService {
  /**
   * Calculates billable hours using the ceiling function.
   * - <= 60 minutes = 1 billable hour
   * - 61-120 minutes = 2 billable hours
   * - 121-180 minutes = 3 billable hours
   * - Minimum 1 billable hour for a completed job.
   */
  static calculateBillableHours(durationMinutes: number): number {
    const safeMinutes = Math.max(0, durationMinutes);
    return Math.max(1, Math.ceil(safeMinutes / 60));
  }

  /**
   * Calculates the working duration in minutes between start and completion dates.
   * Throws AppError if timestamps are invalid or completion is before start.
   */
  static calculateWorkingDurationMinutes(startedAt: Date | string, completedAt: Date | string): number {
    const start = new Date(startedAt);
    const end = new Date(completedAt);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new AppError("Invalid job start or completion timestamp", 400);
    }

    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) {
      throw new AppError("Job completion timestamp cannot be earlier than start timestamp", 400);
    }

    // Convert milliseconds to elapsed minutes (rounded to nearest minute, minimum 0)
    return Math.max(0, Math.round(diffMs / (1000 * 60)));
  }

  /**
   * Calculates the gross service amount based on billable hours:
   * Service Amount = First Hour Rate + ((Billable Hours - 1) * Additional Hour Rate)
   */
  static calculateServiceAmount(
    billableHours: number,
    firstHourRate: number,
    additionalHourRate: number
  ): number {
    const hours = Math.max(1, billableHours);
    const firstRate = Math.max(0, firstHourRate);
    const addlRate = Math.max(0, additionalHourRate);

    const firstHourCharge = firstRate;
    const additionalHoursCharge = (hours - 1) * addlRate;
    return firstHourCharge + additionalHoursCharge;
  }

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
  static calculateBillingAndDistribution(
    durationMinutes: number,
    pricing: PricingRuleInputs
  ): BillingCalculationResult {
    const {
      firstHourRate,
      additionalHourRate,
      cooperativePercentage,
      insurancePercentage,
      transportFee = FIXED_TRANSPORT_FEE,
    } = pricing;

    if (firstHourRate < 0 || additionalHourRate < 0) {
      throw new AppError("Service rates cannot be negative", 400);
    }

    if (cooperativePercentage < 0 || insurancePercentage < 0) {
      throw new AppError("Share percentages cannot be negative", 400);
    }

    if (cooperativePercentage + insurancePercentage > 100) {
      throw new AppError("Combined cooperative and insurance share cannot exceed 100%", 400);
    }

    const billableHours = this.calculateBillableHours(durationMinutes);
    const firstHourCharge = Math.max(0, firstHourRate);
    const additionalHoursCharge = (billableHours - 1) * Math.max(0, additionalHourRate);
    const serviceAmount = firstHourCharge + additionalHoursCharge;

    // Financial percentage deductions from gross service earnings (excluding transport fee)
    const cooperativeAdminShare = Math.round(((serviceAmount * cooperativePercentage) / 100) * 100) / 100;
    const insuranceShare = Math.round(((serviceAmount * insurancePercentage) / 100) * 100) / 100;
    const workerNetEarnings = Math.round((serviceAmount - cooperativeAdminShare - insuranceShare) * 100) / 100;

    // Customer Total includes service amount + ₹30 transport fee
    const customerTotal = Math.round((serviceAmount + transportFee) * 100) / 100;

    return {
      actualDurationMinutes: durationMinutes,
      billableHours,
      firstHourCharge,
      additionalHoursCharge,
      serviceAmount,
      transportFee,
      cooperativeAdminShare,
      insuranceShare,
      workerNetEarnings,
      customerTotal,
    };
  }

  /**
   * Helper to format minutes into human-readable duration string (e.g., "1 hr 15 mins" or "45 mins")
   */
  static formatDuration(minutes: number): string {
    const totalMinutes = Math.max(0, Math.round(minutes));
    const hours = Math.floor(totalMinutes / 60);
    const remMins = totalMinutes % 60;

    if (hours === 0) {
      return `${remMins} min${remMins === 1 ? "" : "s"}`;
    }
    if (remMins === 0) {
      return `${hours} hr${hours === 1 ? "" : "s"}`;
    }
    return `${hours} hr${hours === 1 ? "" : "s"} ${remMins} min${remMins === 1 ? "" : "s"}`;
  }
}
